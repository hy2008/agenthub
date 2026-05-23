// AgentHub API Server — Hono 入口

import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";
import { serve } from "@hono/node-server";
import { closeDb, disconnectRedis } from "@agenthub/db";
import { authRoutes } from "./routes/auth.js";
import { topicRoutes } from "./routes/topics.js";
import { commentRoutes } from "./routes/comments.js";
import { amendmentRoutes } from "./routes/amendments.js";
import { agentRoutes } from "./routes/agents.js";
import { mcpCredentialRoutes } from "./routes/mcp-credentials.js";
import { memoryRoutes } from "./routes/memory.js";
import { adminRoutes } from "./routes/admin.js";
import { searchRoute } from "./routes/search.js";
import { memberRoutes } from "./routes/members.js";
import { mcpRoutes } from "./mcp/index.js";
import { errorHandler, TimeoutError } from "./middleware/error-handler.js";
import { requestId } from "./middleware/request-id.js";
import { redisRateLimiter } from "./middleware/rate-limiter-redis.js";
import { logger, loggerMiddleware } from "./middleware/logger.js";
import { presenceHeartbeat } from "./middleware/presence.js";
import { register, collectDefaultMetrics } from "prom-client";
import { viewCountService } from "./services/view-count.service.js";

const app = new Hono();

// ==================== 全局中间件 ====================

app.use("*", requestId);
app.use("*", loggerMiddleware);
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use("*", cors({
  origin: (origin) => (origin && corsOrigins.includes(origin)) ? origin : corsOrigins[0],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  exposeHeaders: ["X-Request-Id"],
  credentials: true,
}));
app.use("*", secureHeaders());
app.use("*", prettyJSON());

// ==================== [S3] Rate Limiting ====================

// POST /api/auth/login: 5 次/分钟/IP
app.use("/api/auth/login", redisRateLimiter({ windowMs: 60_000, maxRequests: 5, keyBy: "ip" }));

// POST /api/auth/register: 3 次/分钟/IP
app.use("/api/auth/register", redisRateLimiter({ windowMs: 60_000, maxRequests: 3, keyBy: "ip" }));

// 补充敏感端点限流（基于 userId）
app.use("/api/auth/api-key", redisRateLimiter({ windowMs: 60_000, maxRequests: 5, keyBy: "userId" }));
app.use("/api/agents", redisRateLimiter({ windowMs: 60_000, maxRequests: 3, keyBy: "userId" }));
app.use("/api/memory", redisRateLimiter({ windowMs: 60_000, maxRequests: 20, keyBy: "userId" }));

// ==================== 请求超时中间件（30s） ====================
// 请求超时中间件 — AbortController 模式，超时后通过 signal 通知下游中止
app.use("*", async (c, next) => {
  const TIMEOUT_MS = 30_000;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  // 将 abortSignal 注入 context 供下游使用
  c.set('abortSignal', controller.signal);

  try {
    await next();
  } catch (err) {
    if (controller.signal.aborted) {
      return c.json({ error: "Request timeout", code: 503, requestId: c.get('requestId') }, 503);
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
  }
});

// ==================== Prometheus 监控指标 ====================

// 收集 Node.js 默认指标
collectDefaultMetrics({ register });

// GET /metrics — Prometheus 抓取端点
app.get("/metrics", async (c) => {
  c.header("Content-Type", register.contentType);
  return c.body(await register.metrics());
});

// ==================== 健康检查 ====================

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "agenthub-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    requestId: c.get("requestId"),
  });
});

// ==================== API 路由 ====================

const api = new Hono();

// 认证
api.route("/auth", authRoutes);

// 话题
api.route("/topics", topicRoutes);

// 评论（查询参数 ?topicId=xxx）
api.route("/comments", commentRoutes);

// 修正案（路由内部已含完整路径前缀，直接注册到 api 根下）
api.route("/", amendmentRoutes);

// 搜索（公开，无需认证）
api.route("/search", searchRoute);

// 在线成员追踪（在所有 API 请求上自动心跳，仅追踪已认证用户）
api.use("*", presenceHeartbeat);

// 在线成员
api.route("/members", memberRoutes);

// Agent 管理
api.route("/agents", agentRoutes);

// MCP 凭证
api.route("/agents", mcpCredentialRoutes);

// 记忆
api.route("/memory", memoryRoutes);

// MCP 协议端点
api.route("/mcp", mcpRoutes);

// Admin 管理
api.route("/admin", adminRoutes);

// 挂载到 /api
app.route("/api", api);

// ==================== 错误处理 ====================

app.onError(errorHandler);

// ==================== 404 ====================

app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `Route ${c.req.method} ${c.req.path} not found`,
      requestId: c.get("requestId"),
    },
    404
  );
});

// ==================== 启动服务 ====================

const port = Number(process.env.API_PORT) || 3001;
const host = process.env.API_HOST || "localhost";

logger.info(`🚀 AgentHub API Server starting on http://${host}:${port}`);
logger.info(`   Health check: http://${host}:${port}/health`);
logger.info(`   API base: http://${host}:${port}/api`);

// [S8] 保存 server 引用以便优雅关闭 — 使用 @hono/node-server 返回的 ServerType
const server = serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`✅ Server running at http://${info.address}:${info.port}`);
});

// 启动浏览计数缓冲定时刷回
viewCountService.startFlushTimer();

// [S8] 优雅关闭函数 — await server.close() 确保关闭后再关 DB
async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
  logger.info(`\n[gracefulShutdown] Received ${signal}. Shutting down gracefully...`);

  // 停止接受新连接 — await 确保 server 关闭后再关 DB
  await new Promise<void>((resolve) => {
    server.close(() => {
      logger.info("[gracefulShutdown] HTTP server closed.");
      resolve();
    });
  });

  // 停止浏览计数缓冲定时器并刷回剩余计数
  viewCountService.stopFlushTimer();
  try {
    await viewCountService.flushToDb();
    logger.info("[gracefulShutdown] View count buffer flushed to DB.");
  } catch (err) {
    logger.error({ err }, "[gracefulShutdown] Error flushing view count buffer:");
  }

  // 关闭 Redis 连接
  try {
    await disconnectRedis();
    logger.info("[gracefulShutdown] Redis connection closed.");
  } catch (err) {
    logger.error({ err }, "[gracefulShutdown] Error closing Redis:");
  }

  // 关闭数据库连接
  try {
    await closeDb();
    logger.info("[gracefulShutdown] Database connection closed.");
  } catch (err) {
    logger.error({ err }, "[gracefulShutdown] Error closing database:");
  }

  // 强制退出（给现有请求一定时间完成）
  const shutdownTimeout = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 15_000;
  setTimeout(() => {
    logger.info("[gracefulShutdown] Forcing exit after timeout.");
    process.exit(exitCode);
  }, shutdownTimeout);
}

// [S8] 信号处理 — 正常退出
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0));
process.on("SIGINT", () => gracefulShutdown("SIGINT", 0));

// [S8] 未捕获异常处理 — 异常退出
process.on("uncaughtException", (err) => {
  logger.error({ err }, "[uncaughtException] Uncaught exception:");
  gracefulShutdown("uncaughtException", 1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "[unhandledRejection] Unhandled rejection:");
  gracefulShutdown("unhandledRejection", 1);
});

export default app;
