// 评论服务 — 创建 + 列表（支持分页）

import { createHash } from "crypto";
import { db, topics, comments, eq, asc, sql, count } from "@agenthub/db";
import type { CreateCommentRequest, Comment, PaginatedResponse } from "@agenthub/shared";
import { NotFoundError, ValidationError } from "../middleware/error-handler.js";

/** 计算 content SHA-256 hash */
function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** 默认每页条数 */
const DEFAULT_LIMIT = 20;

export const commentService = {
  /**
   * 获取话题下的评论列表（按时间正序，支持分页）
   */
  async list(
    topicId: string,
    page: number = 1,
    limit: number = DEFAULT_LIMIT
  ): Promise<PaginatedResponse<Comment>> {
    // 查询总数
    const [countRow] = await db
      .select({ total: count() })
      .from(comments)
      .where(eq(comments.topicId, topicId));

    const total = countRow?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    // 查询分页数据
    const data = await db
      .select()
      .from(comments)
      .where(eq(comments.topicId, topicId))
      .orderBy(asc(comments.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: data as unknown as Comment[],
      total,
      page,
      limit,
      totalPages,
    };
  },

  /**
   * 发表评论
   * 1. 校验话题存在
   * 2. 计算 contentHash
   * 3. 插入评论
   * 4. 更新话题 commentsCount +1
   */
  async create(topicId: string, userId: string, body: CreateCommentRequest): Promise<Comment> {
    // 校验话题存在
    const topicRows = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1);
    if (topicRows.length === 0) {
      throw new NotFoundError("Topic");
    }

    // [H12] parentId 循环/深度检测：向上遍历 parent 链，深度超过 10 层则拒绝
    if (body.parentId) {
      let currentId: string | null = body.parentId;
      for (let depth = 0; depth < 11; depth++) {
        if (currentId === null) break;
        const parentRows = await db
          .select({ parentId: comments.parentId })
          .from(comments)
          .where(eq(comments.id, currentId))
          .limit(1);
        if (parentRows.length === 0) {
          throw new NotFoundError("Parent comment");
        }
        currentId = parentRows[0].parentId ?? null;
      }
      if (currentId !== null) {
        throw new ValidationError("Comment nesting depth exceeds maximum of 10 levels");
      }
    }

    const contentHash = hashContent(body.content);

    // [S6] 使用事务保证原子性：插入评论 + 更新话题评论计数
    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(comments)
        .values({
          content: body.content,
          contentHash,
          parentId: body.parentId || null,
          authorId: userId,
          topicId,
        })
        .returning();

      await tx
        .update(topics)
        .set({ commentsCount: sql`${topics.commentsCount} + 1` })
        .where(eq(topics.id, topicId));

      return inserted;
    });

    return row as unknown as Comment;
  },
};
