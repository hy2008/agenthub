// [S3] 简易滑动窗口限流中间件

import type { Context, Next } from "hono";

/** 单条请求记录 */
interface RequestLog {
  timestamp: number;
}

/** 限流配置 */
interface RateLimiterOptions {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大请求数 */
  maxRequests: number;
  /** 限流键来源：ip 或 userId */
  keyBy: "ip" | "userId";
}

/** [N12] 分层存储：Map<windowMs, Map<key, RequestLog[]>>，避免不同 window 交叉清理 */
const store = new Map<number, Map<string, RequestLog[]>>();

/** 获取或创建指定窗口的分层存储 */
function getOrCreateWindowStore(windowMs: number): Map<string, RequestLog[]> {
  if (!store.has(windowMs)) {
    store.set(windowMs, new Map());
  }
  return store.get(windowMs)!;
}

/**
 * 获取客户端 IP 地址
 */
function getClientIp(c: Context): string {
  // 尝试从常见代理头获取
  const forwarded = c.req.header("X-Forwarded-For");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = c.req.header("X-Real-IP");
  if (realIp) {
    return realIp.trim();
  }
  // Hono 内置的 remote address
  return "unknown";
}

/**
 * 获取限流键
 */
function getRateLimitKey(c: Context, keyBy: "ip" | "userId"): string {
  if (keyBy === "userId") {
    const userId = c.get("userId") as string | undefined;
    return userId ? `user:${userId}` : `ip:${getClientIp(c)}`;
  }
  return `ip:${getClientIp(c)}`;
}

/**
 * 滑动窗口限流中间件工厂函数
 *
 * 使用方式：
 *   app.use("/api/auth/login", rateLimiter({ windowMs: 60_000, maxRequests: 5, keyBy: "ip" }))
 */
export function rateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests, keyBy } = options;
  const windowStore = getOrCreateWindowStore(windowMs);

  return async (c: Context, next: Next) => {
    const now = Date.now();

    const key = getRateLimitKey(c, keyBy);
    const logs = windowStore.get(key) || [];

    // 过滤掉窗口外的记录
    const recentLogs = logs.filter((log) => now - log.timestamp < windowMs);

    // 设置响应头（限流信息）
    const remaining = Math.max(0, maxRequests - recentLogs.length);
    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(now + windowMs));

    if (recentLogs.length >= maxRequests) {
      c.header("Retry-After", String(Math.ceil(windowMs / 1000)));
      return c.json(
        {
          error: "TooManyRequests",
          message: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        429
      );
    }

    // 记录本次请求
    recentLogs.push({ timestamp: now });
    windowStore.set(key, recentLogs);

    await next();
  };
}

// [N12] 独立定时清理 — 每 60s 扫描所有分层 store，防止无流量期间内存泄漏
const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [windowMs, windowStore] of store) {
    for (const [key, logs] of windowStore) {
      const filtered = logs.filter((log) => now - log.timestamp < windowMs);
      if (filtered.length === 0) {
        windowStore.delete(key);
      } else {
        windowStore.set(key, filtered);
      }
    }
  }
}, CLEANUP_INTERVAL);
