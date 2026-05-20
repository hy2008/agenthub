// 浏览计数缓冲服务 — Redis INCR + 定时刷回 DB
// Redis 不可用时 fallback 到直接 DB UPDATE

import { getRedis, isRedisAvailable, db, topics, eq, sql } from "@agenthub/db";

const FLUSH_INTERVAL_MS = 60_000;
const PREFIX = "view_count:";
let flushTimer: ReturnType<typeof setInterval> | null = null;

export const viewCountService = {
  /**
   * 增加指定话题的浏览计数
   * Redis 可用时写入 Redis 缓冲，否则直接更新 DB
   */
  async increment(topicId: string): Promise<void> {
    const redis = getRedis();
    if (redis && isRedisAvailable()) {
      try {
        await redis.incr(`${PREFIX}${topicId}`);
        return;
      } catch {
        // fallback to DB
      }
    }
    // Fallback: direct DB update
    await db
      .update(topics)
      .set({ viewCount: sql`${topics.viewCount} + 1` })
      .where(eq(topics.id, topicId));
  },

  /**
   * 获取 Redis 中缓冲的浏览计数增量
   * 返回 null 表示 Redis 中无此 key 或 Redis 不可用
   */
  async getCount(topicId: string): Promise<number | null> {
    const redis = getRedis();
    if (redis && isRedisAvailable()) {
      try {
        const val = await redis.get(`${PREFIX}${topicId}`);
        return val ? parseInt(val, 10) : null;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * 将 Redis 中所有缓冲的浏览计数增量刷回 DB
   * 使用 SCAN 遍历所有 view_count:* key
   */
  async flushToDb(): Promise<void> {
    const redis = getRedis();
    if (!redis || !isRedisAvailable()) return;

    try {
      const keys: string[] = [];
      let cursor = "0";
      do {
        const [nextCursor, batch] = await redis.scan(cursor, "MATCH", `${PREFIX}*`, "COUNT", 100);
        cursor = nextCursor;
        keys.push(...batch);
      } while (cursor !== "0");

      for (const key of keys) {
        const val = await redis.get(key);
        if (!val) continue;
        const delta = parseInt(val, 10);
        if (isNaN(delta) || delta === 0) {
          await redis.del(key);
          continue;
        }
        const topicId = key.replace(PREFIX, "");

        await db
          .update(topics)
          .set({ viewCount: sql`${topics.viewCount} + ${delta}` })
          .where(eq(topics.id, topicId));

        await redis.del(key);
      }
    } catch (err) {
      console.error("[ViewCount] Flush error:", err);
    }
  },

  /**
   * 启动定时刷回任务（每 60s 执行一次）
   */
  startFlushTimer(): void {
    if (flushTimer) return;
    flushTimer = setInterval(() => this.flushToDb(), FLUSH_INTERVAL_MS);
  },

  /**
   * 停止定时刷回任务
   */
  stopFlushTimer(): void {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  },
};
