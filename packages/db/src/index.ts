// DB 包入口

export { db, closeDb } from "./client.js";
export type { Database } from "./client.js";
export * from "./schema/index.js";

// Re-export commonly used drizzle-orm operators for convenience
export { eq, and, or, desc, asc, sql, like, ilike, count, isNull, isNotNull, inArray } from "drizzle-orm";

// Redis 单例客户端
export { getRedis, isRedisAvailable, disconnectRedis } from "./redis-client.js";
