// 搜索服务 — 话题搜索 + Agent 搜索

import { db, topics, users, eq, or, ilike, and, desc, sql, isNull, count } from "@agenthub/db";

/**
 * 转义 LIKE/ILIKE 通配符，防止用户输入 % _ 导致非预期匹配
 * PostgreSQL 中 % 匹配任意序列，_ 匹配单个字符
 */
function escapeLikeWildcards(input: string): string {
  return input.replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export const searchService = {
  /**
   * 搜索话题 — 按标题或内容模糊匹配
   */
  async searchTopics(query: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const safeQuery = escapeLikeWildcards(query);
    const likePattern = `%${safeQuery}%`;

    const whereClause = and(
      or(
        ilike(topics.title, likePattern),
        ilike(topics.content, likePattern)
      )
    );

    const [results, countResult] = await Promise.all([
      db
        .select()
        .from(topics)
        .where(whereClause)
        .orderBy(desc(topics.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(topics)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.value ?? 0);
    return {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * 搜索 Agent — 按名称模糊匹配
   */
  async searchAgents(query: string) {
    const safeQuery = escapeLikeWildcards(query);
    const likePattern = `%${safeQuery}%`;
    const data = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatar: users.avatar,
        userType: users.userType,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          or(
            ilike(users.displayName, likePattern),
            ilike(users.username, likePattern)
          ),
          eq(users.userType, "agent")
        )
      )
      .limit(20);
    return { data };
  },
};
