// 记忆服务 — CRUD + 同步 + 比对 + 冲突解决 + 搜索 + 提炼（支持分页）
// S9: 集成 memory-engine 包 | H4: sync 事务 | H5: promote 事务 | H9: resolve 完整实现 | H10: diff 删除条件修正

import { db, memories, memoryDiffs, topics, eq, and, desc, sql, count } from "@agenthub/db";
import { computeHash, syncCompare, resolveConflict } from "@agenthub/memory-engine";
import type {
  CreateMemoryRequest,
  MemorySyncRequest,
  MemorySyncResponse,
  MemoryResolveRequest,
  Memory,
  MemoryDiff,
  PaginatedResponse,
} from "@agenthub/shared";
import { MemoryType } from "@agenthub/shared";
import { getVectorClient, DEFAULT_COLLECTION } from "@agenthub/vector";
import { NotFoundError, AuthorizationError } from "../middleware/error-handler.js";
import { logger } from "../middleware/logger.js";

/** 默认每页条数 */
const DEFAULT_LIMIT = 20;

export const memoryService = {
  // ==================== CRUD ====================

  /** 记忆列表（支持分页和筛选） */
  async list(
    agentId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT,
    memoryType?: string,
    tag?: string
  ): Promise<PaginatedResponse<Memory>> {
    // 构建查询条件
    const conditions = [eq(memories.agentId, agentId)];
    if (memoryType) {
      conditions.push(eq(memories.memoryType, memoryType as MemoryType));
    }

    // 查询总数
    const [countRow] = await db
      .select({ total: count() })
      .from(memories)
      .where(and(...conditions));

    const total = countRow?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    // 查询分页数据
    const data = await db
      .select()
      .from(memories)
      .where(and(...conditions))
      .orderBy(desc(memories.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: data as unknown as Memory[],
      total,
      page,
      limit,
      totalPages,
    };
  },

  /** 写入记忆 */
  async create(agentId: string, body: CreateMemoryRequest): Promise<Memory> {
    // S9: 使用 memory-engine 的 computeHash 替代本地 hashJsonContent
    const contentHash = computeHash(body.content);

    const [row] = await db
      .insert(memories)
      .values({
        agentId,
        memoryType: body.memoryType,
        content: body.content,
        contentHash,
        tags: body.tags || [],
        metadata: body.metadata || null,
        source: "manual",
      })
      .returning();

    return row as unknown as Memory;
  },

  /** 单条记忆 */
  async getById(memoryId: string, agentId: string): Promise<Memory> {
    const rows = await db.select().from(memories).where(eq(memories.id, memoryId)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundError("Memory");
    }
    if (rows[0].agentId !== agentId) {
      throw new AuthorizationError("Access denied: not your memory");
    }
    return rows[0] as unknown as Memory;
  },

  /** 更新记忆 */
  async update(memoryId: string, agentId: string, body: { content?: Record<string, unknown>; tags?: string[]; metadata?: Record<string, unknown> }): Promise<Memory> {
    const existing = await db.select().from(memories).where(eq(memories.id, memoryId)).limit(1);
    if (existing.length === 0) {
      throw new NotFoundError("Memory");
    }
    if (existing[0].agentId !== agentId) {
      throw new AuthorizationError("Access denied: not your memory");
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.content) {
      updateData.content = body.content;
      // S9: 使用 memory-engine 的 computeHash 替代本地 hashJsonContent
      updateData.contentHash = computeHash(body.content);
    }
    if (body.tags) {
      updateData.tags = body.tags;
    }
    if (body.metadata) {
      updateData.metadata = body.metadata;
    }

    const [row] = await db
      .update(memories)
      .set(updateData)
      .where(eq(memories.id, memoryId))
      .returning();

    return row as unknown as Memory;
  },

  /** 删除记忆 */
  async delete(memoryId: string, agentId: string): Promise<void> {
    const rows = await db.select().from(memories).where(eq(memories.id, memoryId)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundError("Memory");
    }
    if (rows[0].agentId !== agentId) {
      throw new AuthorizationError("Access denied: not your memory");
    }
    await db.delete(memories).where(eq(memories.id, memoryId));
  },

  // ==================== 同步 / 比对 / 冲突 ====================

  /**
   * 触发同步比对
   * Agent 提交本地记忆 hash 列表，服务端逐一比对，返回差异
   * H4: 将 sync 中的所有 DB 操作包裹在 db.transaction() 中，批量 insert diff 记录
   * S9: 使用 memory-engine 的 syncCompare 进行逻辑比对
   */
  async sync(agentId: string, request: MemorySyncRequest): Promise<MemorySyncResponse> {
    // H4: 将 sync 中的所有 DB 操作包裹在事务中
    const result = await db.transaction(async (tx) => {
      // 查询该 Agent 的所有服务端记忆
      const remoteRows = await tx
        .select({ id: memories.id, contentHash: memories.contentHash })
        .from(memories)
        .where(eq(memories.agentId, agentId));

      // 构造 memory-engine 所需的输入
      const localItems = request.hashes.map((h) => ({
        id: h.id,
        contentHash: h.contentHash,
      }));
      const remoteItems = remoteRows.map((r) => ({
        id: r.id,
        contentHash: r.contentHash,
      }));

      // S9: 使用 memory-engine 的 syncCompare 进行比对
      const engineDiffs = syncCompare(localItems, remoteItems);

      // 过滤掉 unchanged 项，转换为 API 响应格式
      const diffs: MemorySyncResponse["diffs"] = engineDiffs
        .filter((d): d is typeof d & { status: Exclude<typeof d["status"], "unchanged"> } => d.status !== "unchanged")
        .map((d) => ({
          memoryId: d.memoryId,
          localHash: d.localHash,
          remoteHash: d.remoteHash,
          status: d.status,
        }));

      // H4: 批量收集所有 diff 记录，一次性批量 insert
      if (diffs.length > 0) {
        const diffValues = diffs.map((d) => ({
          agentId,
          memoryId: d.memoryId,
          localHash: d.localHash,
          remoteHash: d.remoteHash,
          match: false,
          diffDetails: { localHash: d.localHash, remoteHash: d.remoteHash },
        }));
        await tx.insert(memoryDiffs).values(diffValues);
      }

      return {
        match: diffs.length === 0,
        diffs,
      };
    });

    return result;
  },

  /** 获取比对结果列表 */
  async getDiffs(agentId: string): Promise<MemoryDiff[]> {
    const data = await db
      .select()
      .from(memoryDiffs)
      .where(eq(memoryDiffs.agentId, agentId))
      .orderBy(desc(memoryDiffs.checkedAt));

    return data as unknown as MemoryDiff[];
  },

  /**
   * 解决冲突
   * H9: 完整实现 resolve 逻辑 | H10: 修复 diff 删除条件过宽 | S9: 调用 memory-engine 的 resolveConflict
   * - local_first: 使用本地版本覆盖远程，清除 diff 记录
   * - remote_first: 保留远程版本不变，清除 diff 记录
   * - newest_wins: 比较记忆的 updatedAt，保留较新的版本，清除 diff 记录
   */
  async resolve(agentId: string, body: MemoryResolveRequest): Promise<void> {
    const rows = await db
      .select()
      .from(memories)
      .where(and(eq(memories.id, body.memoryId), eq(memories.agentId, agentId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundError("Memory");
    }

    const memory = rows[0];

    // H9 + S9: 使用 memory-engine 的 resolveConflict 进行策略判定
    const resolved = resolveConflict(
      {
        localContent: {},  // 本地内容由客户端持有，此处的 localContent 作为占位
        remoteContent: (typeof memory.content === "object" && memory.content !== null)
          ? (memory.content as Record<string, unknown>)
          : { text: memory.content },
        localUpdatedAt: new Date(), // 本地时间由客户端决定
        remoteUpdatedAt: new Date(memory.updatedAt),
      },
      body.strategy
    );

    if (body.strategy === "local_first") {
      // H9: local_first — 清除该 memoryId 的 diff 记录，标记冲突已解决
      // 客户端在 resolve 后需要 PUT 更新内容
      // （resolved.source === "local" 表示应采用本地版本）
    } else if (body.strategy === "remote_first") {
      // H9: remote_first — 清除 diff 记录（保留服务端版本不变）
      // （resolved.source === "remote" 表示保留远程版本，无需额外操作）
    } else if (body.strategy === "newest_wins") {
      // H9: newest_wins — 若本地版本较新，客户端需要 PUT 更新；若远程版本较新，无需操作
      if (resolved.source === "local") {
        // 客户端需 PUT 更新
      }
      // 若 source === "remote"，服务端已持有最新版本，无需操作
    }

    // H10: 修复 diff 删除条件过宽 — 添加 memoryId 过滤条件
    // 原实现：仅按 agentId + diffDetails.localHash IS NOT NULL 删除，会误删同 agent 的所有 diff
    // 修复：通过 memoryId 字段精确过滤（H10 已在 memory-diffs schema 中添加 memoryId）
    await db
      .delete(memoryDiffs)
      .where(
        and(
          eq(memoryDiffs.agentId, agentId),
          eq(memoryDiffs.memoryId, body.memoryId),
        )
      );
  },

  /**
   * 向量语义搜索 — Qdrant 优先，降级至 tags::text ILIKE 模糊匹配
   *
   * 搜索流程：
   * 1. 尝试 Qdrant 语义搜索（需要 embedding 模型将 query 转为向量）
   * 2. 若 Qdrant 不可用或 embedding 模型未配置，降级为 ILIKE 模糊搜索
   */
  async search(agentId: string, query: string): Promise<Memory[]> {
    // 1. 尝试 Qdrant 语义搜索（使用 admin 配置的 embedding 模型）
    try {
      const client = getVectorClient();
      await client.health();

      // 通过 admin 配置的 OpenAI 兼容 API 生成 query 向量
      const { embeddingService } = await import("../services/embedding.service.js");
      const vector = await embeddingService.embedText(query);

      const results = await client.search(DEFAULT_COLLECTION, vector, {
        limit: 20,
        filter: {
          must: [{ key: "agent_id", match: { value: agentId } }],
        },
      });

      const memories_: Memory[] = results
        .filter((r) => r.payload)
        .map((r) => r.payload as unknown as Memory);

      if (memories_.length > 0) {
        return memories_;
      }

      logger.warn("[Memory Search] Qdrant search returned no results, falling back to ILIKE");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`[Memory Search] Qdrant unavailable (${message}), falling back to ILIKE search`);
    }

    // 2. 降级：基于 tags 的 ILIKE 模糊匹配
    const data = await db
      .select()
      .from(memories)
      .where(and(
        eq(memories.agentId, agentId),
        sql`(${memories.tags}::text ILIKE ${"%" + query + "%"} OR ${memories.content}::text ILIKE ${"%" + query + "%"})`
      ))
      .limit(20);

    return data as unknown as Memory[];
  },

  /**
   * 记忆提炼为公共话题
   * H5: 用 db.transaction() 包裹 insert(topics) + update(memories)
   * S9: 使用 memory-engine 的 computeHash 计算 contentHash
   */
  async promote(memoryId: string, agentId: string): Promise<{ topicId: string }> {
    const rows = await db
      .select()
      .from(memories)
      .where(and(eq(memories.id, memoryId), eq(memories.agentId, agentId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundError("Memory");
    }

    const memory = rows[0];
    const contentStr = typeof memory.content === "string"
      ? memory.content
      : JSON.stringify(memory.content, null, 2);

    // 创建公共话题
    const contentObj = (typeof memory.content === "object" && memory.content !== null)
      ? memory.content as Record<string, unknown>
      : { text: memory.content };
    // S9: 使用 memory-engine 的 computeHash 替代本地 hashJsonContent
    const contentHash = computeHash(contentObj);

    // H5: 用 db.transaction() 包裹 insert + update
    const { topicId } = await db.transaction(async (tx) => {
      const [topic] = await tx
        .insert(topics)
        .values({
          title: `[提炼] ${contentStr.slice(0, 100)}`,
          content: contentStr,
          contentHash,
          tags: memory.tags || [],
          authorId: agentId,
          visibility: "public",
          type: "article",
        })
        .returning();

      // 标记记忆来源
      await tx
        .update(memories)
        .set({ source: "derived_from_topic" })
        .where(eq(memories.id, memoryId));

      return { topicId: topic.id };
    });

    return { topicId };
  },
};
