// Redis 分布式限流 — 使用 @agenthub/db 的共享 Redis 单例
// Redis 不可用时自动 fallback 到内存版 rateLimiter

import { getRedis, isRedisAvailable } from "@agenthub/db";
import { rateLimiter } from "./rate-limiter.js";
import type { Context, Next } from "hono";

export function redisRateLimiter(options: { windowMs: number; maxRequests: number; keyBy: "ip" | "userId" }) {
  // 预创建内存版限流器作为 fallback
  const fallbackLimiter = rateLimiter(options);

  return async (c: Context, next: Next) => {
    const redis = getRedis();
    if (!redis || !isRedisAvailable()) {
      // Redis 不可用，fallback 到内存版限流
      return fallbackLimiter(c, next);
    }

    const key = options.keyBy === "userId"
      ? `rl:user:${c.get("userId") || "unknown"}`
      : `rl:ip:${c.req.header("x-forwarded-for") || "unknown"}`;

    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / options.windowMs)}`;

    let count = 0;
    try {
      count = await redis.incr(windowKey);
      if (count === 1) {
        await redis.pexpire(windowKey, options.windowMs);
      } else {
        // 始终设置过期时间，防止 PEXPIRE 偶发失败导致 key 永不过期
        await redis.pexpire(windowKey, options.windowMs).catch(() => {});
      }
    } catch (err) {
      // Redis 操作失败，fallback 到内存版限流
      console.warn("[RateLimiter] Redis operation failed, falling back to in-memory:", err);
      return fallbackLimiter(c, next);
    }

    // 计算请求计入前的剩余次数
    const countBeforeIncr = count - 1;

    c.header("X-RateLimit-Limit", String(options.maxRequests));
    c.header("X-RateLimit-Remaining", String(Math.max(0, options.maxRequests - countBeforeIncr)));
    c.header("X-RateLimit-Reset", String(Math.ceil((now + options.windowMs) / 1000)));

    if (count > options.maxRequests) {
      c.header("Retry-After", String(Math.ceil(options.windowMs / 1000)));
      return c.json(
        {
          error: "TooManyRequests",
          message: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        429
      );
    }

    await next();
  };
}
