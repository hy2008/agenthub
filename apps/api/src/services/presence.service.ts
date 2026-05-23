// 在线用户追踪服务 — Redis 心跳 + TTL
// Redis 不可用时降级为内存 Map

import { getRedis, isRedisAvailable, db, users, eq, sql } from "@agenthub/db";

const HEARTBEAT_TTL = 120; // 2 分钟无心跳视为离线
const PREFIX = "presence:";
const ONLINE_THRESHOLD_S = 120; // 与 HEARTBEAT_TTL 一致

// 内存降级方案
const memoryStore = new Map<string, { displayName: string; userType: string; lastSeen: number }>();

export const presenceService = {
  /** 记录用户心跳 */
  async heartbeat(userId: string, displayName: string, userType: string): Promise<void> {
    const redis = getRedis();
    if (redis && isRedisAvailable()) {
      const key = `${PREFIX}${userId}`;
      await redis
        .multi()
        .hset(key, {
          displayName,
          userType,
          lastSeen: Date.now(),
        })
        .expire(key, HEARTBEAT_TTL)
        .exec();
    } else {
      // 内存降级
      memoryStore.set(userId, { displayName, userType, lastSeen: Date.now() });
      // 清理过期
      const now = Date.now();
      for (const [id, data] of memoryStore) {
        if (now - data.lastSeen > HEARTBEAT_TTL * 1000) {
          memoryStore.delete(id);
        }
      }
    }
  },

  /** 获取在线成员列表 */
  async getOnlineMembers(): Promise<{ displayName: string; userType: "human" | "agent" }[]> {
    const redis = getRedis();
    if (redis && isRedisAvailable()) {
      const keys = await redis.keys(`${PREFIX}*`);
      if (keys.length === 0) return [];

      const results = await Promise.all(
        keys.map(async (key) => {
          const data = await redis.hgetall(key);
          return data;
        })
      );

      return results
        .filter((r) => r.displayName && r.userType)
        .map((r) => ({
          displayName: r.displayName as string,
          userType: (r.userType === "agent" ? "agent" : "human") as "human" | "agent",
        }));
    }

    // 内存降级
    const now = Date.now();
    const online: { displayName: string; userType: "human" | "agent" }[] = [];
    for (const [, data] of memoryStore) {
      if (now - data.lastSeen <= HEARTBEAT_TTL * 1000) {
        online.push({
          displayName: data.displayName,
          userType: (data.userType === "agent" ? "agent" : "human") as "human" | "agent",
        });
      }
    }
    return online;
  },

  /** 获取在线人数 */
  async getOnlineCount(): Promise<number> {
    const members = await this.getOnlineMembers();
    return members.length;
  },
};
