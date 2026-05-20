// 话题服务 — CRUD + 列表 + 投票
// S7: 投票幂等性 — 使用 topic_votes 表防重复投票 | H11: 浏览计数 TODO 标记
// #5: 投票支持 vote_type 方向变更（up/down）+ 事务级 upsert 修复 #6 TOCTOU

import { createHash } from "crypto";
import { db, topics, comments, amendments, topicVotes, eq, and, desc, asc, sql, ilike, count } from "@agenthub/db";
import type { TopicListQuery, CreateTopicRequest, PaginatedResponse, Topic, Amendment, VoteRequest, VoteResponse } from "@agenthub/shared";
import { NotFoundError, AuthorizationError, ConflictError } from "../middleware/error-handler.js";
import { viewCountService } from "./view-count.service.js";

/** 计算 content SHA-256 hash */
function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** 话题详情统一返回类型 */
type TopicDetailResponse = {
  id: string;
  title: string;
  authorId: string | null;
  category: string | null;
  tags: string[];
  createdAt: Date;
  originalContent: string;
  amendments?: Amendment[];
  latestContent?: string;
  amendmentsCount?: number;
  /** 保持向下兼容的原始字段 */
  content?: string;
};

export const topicService = {
  /**
   * 话题列表 — 支持分页、筛选、排序
   */
  async list(query: TopicListQuery): Promise<PaginatedResponse<Topic>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    if (query.category) {
      conditions.push(eq(topics.category, query.category));
    }
    if (query.tag) {
      conditions.push(sql`${topics.tags} @> ARRAY[${query.tag}]::text[]`);
    }
    if (query.type) {
      conditions.push(eq(topics.type, query.type));
    }
    if (query.authorId) {
      conditions.push(eq(topics.authorId, query.authorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 排序
    const sortColumn = query.sort === "popular"
      ? desc(topics.votesCount)
      : query.sort === "most_commented"
        ? desc(topics.commentsCount)
        : desc(topics.createdAt);

    // 查询总数
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(topics)
      .where(whereClause);

    // 查询分页数据
    const data = await db
      .select()
      .from(topics)
      .where(whereClause)
      .orderBy(sortColumn)
      .limit(limit)
      .offset(offset);

    return {
      data: data as unknown as Topic[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * 创建话题
   */
  async create(authorId: string, body: CreateTopicRequest): Promise<Topic> {
    const contentHash = hashContent(body.content);

    const [row] = await db
      .insert(topics)
      .values({
        title: body.title,
        content: body.content,
        contentHash,
        category: body.category || null,
        tags: body.tags || [],
        authorId,
        visibility: body.visibility || "public",
        type: body.type || "article",
      })
      .returning();

    return row as unknown as Topic;
  },

  /**
   * 话题详情 — 支持修正案三种展示模式
   * - stacked: 附加所有未撤回修正案列表
   * - diff: 返回原始内容 + 各修正案的 diffPatch
   * - latest: 将所有未撤回修正案按顺序应用到内容上
   */
  async getById(id: string, viewMode?: string): Promise<TopicDetailResponse> {
    const rows = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundError("Topic");
    }

    const topic = rows[0] as unknown as Topic;

    // 所有模式共有的基础字段
    const base: TopicDetailResponse = {
      id: topic.id,
      title: topic.title,
      authorId: topic.authorId,
      category: topic.category,
      tags: topic.tags,
      createdAt: topic.createdAt as unknown as Date,
      originalContent: topic.content,
      content: topic.content, // 保持向下兼容
    };

    // stacked 模式：返回原始话题 + 未撤回修正案列表
    if (viewMode === "stacked") {
      const amendmentList = await db
        .select()
        .from(amendments)
        .where(and(eq(amendments.targetId, id), eq(amendments.targetType, "topic"), eq(amendments.isRevoked, false)))
        .orderBy(asc(amendments.createdAt));
      return {
        ...base,
        amendments: amendmentList as unknown as Amendment[],
      };
    }

    // diff 模式：返回原始内容 + 修正案列表（含已撤回，含 diffPatch）
    if (viewMode === "diff") {
      const amendmentList = await db
        .select()
        .from(amendments)
        .where(and(eq(amendments.targetId, id), eq(amendments.targetType, "topic")))
        .orderBy(asc(amendments.createdAt));
      return {
        ...base,
        amendments: amendmentList as unknown as Amendment[],
      };
    }

    // latest 模式：按顺序应用所有未撤回修正案
    if (viewMode === "latest") {
      const amendmentList = await db
        .select()
        .from(amendments)
        .where(and(
          eq(amendments.targetId, id),
          eq(amendments.targetType, "topic"),
          eq(amendments.isRevoked, false),
        ))
        .orderBy(asc(amendments.createdAt));

      // 按 scope 顺序应用修正案
      let latestContent = topic.content;
      for (const am of amendmentList) {
        if (am.scope === "replace") {
          latestContent = am.content; // 完全替换
        } else if (am.scope === "append") {
          latestContent += `\n\n${am.content}`; // 追加
        } else if (am.scope === "partial" && am.paragraphIndex != null) {
          // 部分替换：按段落索引替换
          const paragraphs = latestContent.split("\n\n");
          paragraphs[am.paragraphIndex] = am.content;
          latestContent = paragraphs.join("\n\n");
        }
      }

      return {
        ...base,
        latestContent,
        amendments: amendmentList as unknown as Amendment[],
        amendmentsCount: amendmentList.length,
      };
    }

    // 默认（无 viewMode）：返回原始话题

    // H11: 浏览计数 — 通过 Redis 缓冲 + 定时刷回优化，避免每次读取触发写操作
    await viewCountService.increment(id);

    return { ...base };
  },

  /**
   * 删除话题（仅作者/管理员）
   * 注意：H20 后 authorId 可能为 null，需处理 null 情况
   */
  async delete(id: string, userId: string): Promise<void> {
    const rows = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundError("Topic");
    }
    // H20: authorId 可能为 null（用户删除后 set null），此时不允许任何人删除
    if (rows[0].authorId !== userId) {
      throw new AuthorizationError("Only the author can delete this topic");
    }
    await db.delete(topics).where(eq(topics.id, id));
  },

  /**
   * 投票 — #5/#6: 支持 vote_type 方向变更 + 事务级 upsert 修复 TOCTOU
   * 在事务中：
   * 1. 获取当前投票记录（如果有）
   * 2. 计算 votesCount 的 delta
   * 3. 使用 delete+insert 模式实现 upsert（兼容 Drizzle ORM）
   * 4. 原子更新 topics.votesCount
   */
  async vote(id: string, userId: string, body: { voteType: "up" | "down" }): Promise<VoteResponse> {
    // 校验话题存在
    const topicRows = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
    if (topicRows.length === 0) {
      throw new NotFoundError("Topic");
    }

    return await db.transaction(async (tx) => {
      // 获取当前投票记录（如果有）
      const existing = await tx
        .select({ voteType: topicVotes.voteType })
        .from(topicVotes)
        .where(and(eq(topicVotes.topicId, id), eq(topicVotes.userId, userId)))
        .limit(1);

      const oldVoteType = existing[0]?.voteType;
      const newVoteType = body.voteType;

      // 如果是相同方向的投票，直接返回（幂等）
      if (oldVoteType === newVoteType) {
        return { votesCount: topicRows[0].votesCount };
      }

      // 计算投票变化的差值
      let delta = 0;
      if (!oldVoteType) {
        // 新投票
        delta = newVoteType === "up" ? 1 : -1;
      } else {
        // 变更投票方向：计算净变化
        // up→down: -2, down→up: +2
        const oldDelta = oldVoteType === "up" ? 1 : -1;
        const newDelta = newVoteType === "up" ? 1 : -1;
        delta = newDelta - oldDelta;
      }

      // 先删除旧投票（如果有），再插入新投票
      // 使用 delete+insert 而非 onConflictDoUpdate，以确保 Drizzle ORM 兼容性
      await tx.delete(topicVotes).where(and(
        eq(topicVotes.topicId, id),
        eq(topicVotes.userId, userId)
      ));

      await tx.insert(topicVotes).values({
        topicId: id,
        userId,
        voteType: newVoteType,
      });

      // 原子更新投票计数
      await tx
        .update(topics)
        .set({ votesCount: sql`${topics.votesCount} + ${delta}` })
        .where(eq(topics.id, id));

      // 返回新计数
      const updated = await tx
        .select({ votesCount: topics.votesCount })
        .from(topics)
        .where(eq(topics.id, id))
        .limit(1);

      return { votesCount: updated[0].votesCount };
    });
  },
};
