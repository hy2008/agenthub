// 结构化日志模块 — 基于 pino + AsyncLocalStorage
// 自动注入 requestId，支持请求级日志关联

import pino from "pino";
import { AsyncLocalStorage } from "async_hooks";
import type { Context, Next } from "hono";

// AsyncLocalStorage 存储请求上下文
export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

// pino 实例
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino/file", options: { destination: 1 } } // stdout
    : undefined,
  formatters: {
    // 自动从 AsyncLocalStorage 注入 requestId
    log(object) {
      const ctx = requestContext.getStore();
      if (ctx) {
        return { ...object, requestId: ctx.requestId };
      }
      return object;
    },
  },
});

/**
 * Logger 中间件 — 在每个请求中初始化 AsyncLocalStorage 上下文
 */
export async function loggerMiddleware(c: Context, next: Next) {
  const requestId = c.get("requestId") || "unknown";
  await requestContext.run({ requestId }, async () => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;

    logger.info({ method, path }, `--> ${method} ${path}`);  // 请求进入

    try {
      await next();
    } finally {
      const duration = Date.now() - start;
      const status = c.res.status;
      logger.info({ method, path, status, duration }, `<-- ${method} ${path} ${status} (${duration}ms)`);
    }
  });
}
