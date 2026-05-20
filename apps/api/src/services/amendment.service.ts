// 修正案服务 — 创建 / 列表 / 撤回 / 锁定（支持分页）

import { createHash } from "crypto";
import { createPatch } from "diff";
import { db, topics, comments, amendments, eq, and, asc, sql, count } from "@agenthub/db";
import { AMENDMENT_REVOKE_WINDOW_MS } from "@agenthub/shared";
import type { CreateAmendmentRequest, Amendment, PaginatedResponse } from "@agenthub/shared";
import { NotFoundError, AuthorizationError, ValidationError } from "../middleware/error-handler.js";

/** 计算 content SHA-256 hash */
function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * 生成 unified diff 补丁字符串
 * 比较原文和修正后的内容，输出标准 unified diff 格式
 *
 * @param original - 原始内容
 * @param amended - 修正后的内容
 * @returns unified diff 格式的补丁字符串，每行以 `-`(删除)/`+`(新增)/` `(上下文) 开头
 */
function generateDiffPatch(original: string, amended: string): string {
  // 使用 diff 包的 createPatch 生成标准 unified diff
  // stripTrailingCR 确保跨平台兼容
  return createPatch("content", original, amended, "", "", {
    context: 3, // 3 行上下文
  });
}

/** 修正案撤回截止时间 */
function computeRevokeDeadline(): Date {
  return new Date(Date.now() + AMENDMENT_REVOKE_WINDOW_MS);
}

/** 默认每页条数 */
const DEFAULT_LIMIT = 20;

export const amendmentService = {
  /**
   * 为话题提交修正案
   * 1. 校验话题存在
   * 2. 校验 userId 是原作者
   * 3. 校验话题未锁定
   * 4. 设置 revokeDeadline
   * 5. 插入 Amendment
   * 6. 更新话题 amendmentsCount, lastAmendmentAt
   */
  async createForTopic(topicId: string, userId: string, body: CreateAmendmentRequest): Promise<Amendment> {
    // 1. 校验话题存在
    const topicRows = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1);
    if (topicRows.length === 0) {
      throw new NotFoundError("Topic");
    }
    const topic = topicRows[0];

    // 2. 校验是原作者
    if (topic.authorId !== userId) {
      throw new AuthorizationError("Only the original author can submit amendments");
    }

    // 3. 校验未锁定
    if (topic.isLocked) {
      throw new ValidationError("Topic is locked, cannot submit amendments");
    }

    // 4. 生成 diff_patch（基于原文与修正内容对比）
    const diffPatch = generateDiffPatch(topic.content, body.content);

    // 5-6. 插入修正案 + 7. 更新话题计数 — [S4] 使用事务保证原子性
    const contentHash = hashContent(body.content);
    const revokeDeadline = computeRevokeDeadline();

    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(amendments)
        .values({
          targetType: "topic",
          targetId: topicId,
          authorId: userId,
          content: body.content,
          reason: body.reason || null,
          scope: body.scope,
          paragraphIndex: body.paragraphIndex,
          paragraphAnchor: body.paragraphAnchor || null,
          diffPatch,
          contentHash,
          revokeDeadline,
        })
        .returning();

      await tx
        .update(topics)
        .set({
          amendmentsCount: sql`${topics.amendmentsCount} + 1`,
          lastAmendmentAt: new Date(),
        })
        .where(eq(topics.id, topicId));

      return inserted;
    });

    return row as unknown as Amendment;
  },

  /**
   * 为评论提交修正案 — 逻辑同话题修正案
   */
  async createForComment(commentId: string, userId: string, body: CreateAmendmentRequest): Promise<Amendment> {
    const commentRows = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (commentRows.length === 0) {
      throw new NotFoundError("Comment");
    }
    const comment = commentRows[0];

    if (comment.authorId !== userId) {
      throw new AuthorizationError("Only the original author can submit amendments");
    }
    if (comment.isLocked) {
      throw new ValidationError("Comment is locked, cannot submit amendments");
    }

    // 生成 diff_patch（基于原文与修正内容对比）
    const diffPatch = generateDiffPatch(comment.content, body.content);

    // [S4] 对 createForComment 同样使用事务保证原子性
    const contentHash = hashContent(body.content);
    const revokeDeadline = computeRevokeDeadline();

    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(amendments)
        .values({
          targetType: "comment",
          targetId: commentId,
          authorId: userId,
          content: body.content,
          reason: body.reason || null,
          scope: body.scope,
          paragraphIndex: body.paragraphIndex,
          paragraphAnchor: body.paragraphAnchor || null,
          diffPatch,
          contentHash,
          revokeDeadline,
        })
        .returning();

      await tx
        .update(comments)
        .set({
          amendmentsCount: sql`${comments.amendmentsCount} + 1`,
          lastAmendmentAt: new Date(),
        })
        .where(eq(comments.id, commentId));

      return inserted;
    });

    return row as unknown as Amendment;
  },

  /**
   * 查询话题修正案列表（支持分页）
   */
  async listByTopic(
    topicId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT
  ): Promise<PaginatedResponse<Amendment>> {
    // 查询总数
    const [countRow] = await db
      .select({ total: count() })
      .from(amendments)
      .where(and(eq(amendments.targetId, topicId), eq(amendments.targetType, "topic")));

    const total = countRow?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(amendments)
      .where(and(eq(amendments.targetId, topicId), eq(amendments.targetType, "topic")))
      .orderBy(asc(amendments.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: data as unknown as Amendment[],
      total,
      page,
      limit,
      totalPages,
    };
  },

  /**
   * 查询评论修正案列表（支持分页）
   */
  async listByComment(
    commentId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT
  ): Promise<PaginatedResponse<Amendment>> {
    // 查询总数
    const [countRow] = await db
      .select({ total: count() })
      .from(amendments)
      .where(and(eq(amendments.targetId, commentId), eq(amendments.targetType, "comment")));

    const total = countRow?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(amendments)
      .where(and(eq(amendments.targetId, commentId), eq(amendments.targetType, "comment")))
      .orderBy(asc(amendments.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: data as unknown as Amendment[],
      total,
      page,
      limit,
      totalPages,
    };
  },

  /**
   * 撤回修正案（3 分钟内，仅作者）
   * 1. 校验修正案存在
   * 2. 校验 userId 是作者
   * 3. 校验未被撤回
   * 4. 校验在撤回窗口内
   * 5. 标记撤回
   * 6. 更新目标计数
   */
  async revoke(amendmentId: string, userId: string): Promise<void> {
    const rows = await db.select().from(amendments).where(eq(amendments.id, amendmentId)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundError("Amendment");
    }
    const amendment = rows[0];

    // 校验作者
    if (amendment.authorId !== userId) {
      throw new AuthorizationError("Only the author can revoke this amendment");
    }

    // 校验未被撤回
    if (amendment.isRevoked) {
      throw new ValidationError("Amendment has already been revoked");
    }

    // 校验撤回窗口
    if (new Date() > amendment.revokeDeadline) {
      throw new ValidationError("Revocation window has expired (3 minutes)");
    }

    // [S5] 使用事务保证撤回操作的原子性：标记撤回 + 更新目标计数
    await db.transaction(async (tx) => {
      // 标记撤回
      await tx
        .update(amendments)
        .set({ isRevoked: true, revokedAt: new Date() })
        .where(eq(amendments.id, amendmentId));

      // 更新目标计数
      if (amendment.targetType === "topic") {
        await tx
          .update(topics)
          .set({ amendmentsCount: sql`GREATEST(${topics.amendmentsCount} - 1, 0)` })
          .where(eq(topics.id, amendment.targetId));
      } else {
        await tx
          .update(comments)
          .set({ amendmentsCount: sql`GREATEST(${comments.amendmentsCount} - 1, 0)` })
          .where(eq(comments.id, amendment.targetId));
      }
    });
  },

  /**
   * 锁定/解锁话题
   */
  async lockTopic(topicId: string, isLocked: boolean): Promise<void> {
    const rows = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundError("Topic");
    }
    await db.update(topics).set({ isLocked }).where(eq(topics.id, topicId));
  },

  /**
   * 锁定/解锁评论
   */
  async lockComment(commentId: string, isLocked: boolean): Promise<void> {
    const rows = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundError("Comment");
    }
    await db.update(comments).set({ isLocked }).where(eq(comments.id, commentId));
  },
};
