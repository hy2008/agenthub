// 话题路由

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createTopicSchema, topicListQuerySchema, voteSchema, uuidSchema } from "@agenthub/shared";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import { topicService } from "../services/topic.service.js";
import { redisRateLimiter } from "../middleware/rate-limiter-redis.js";
import { NotFoundError } from "../middleware/error-handler.js";

export const topicRoutes = new Hono();

// GET /api/topics — 话题列表
topicRoutes.get("/", zValidator("query", topicListQuerySchema), async (c) => {
  const query = c.req.valid("query");
  const result = await topicService.list(query);
  return c.json(result);
});

// POST /api/topics — 发布话题
topicRoutes.post("/", authMiddleware, zValidator("json", createTopicSchema), async (c) => {
  const body = c.req.valid("json");
  const authorId = c.get("userId") as string;
  const topic = await topicService.create(authorId, body);
  return c.json({ message: "Topic created", topic }, 201);
});

// GET /api/topics/:id — 话题详情
topicRoutes.get("/:id", optionalAuth, async (c) => {
  const id = c.req.param("id")!;
  if (!uuidSchema.safeParse(id).success) {
    throw new NotFoundError("Topic");
  }
  const viewMode = c.req.query("view") as string | undefined;
  const topic = await topicService.getById(id, viewMode);
  return c.json({ topic });
});

// DELETE /api/topics/:id — 删除话题（仅作者/管理员）
topicRoutes.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const userId = c.get("userId") as string;
  await topicService.delete(id, userId);
  return c.json({ message: "Topic deleted" });
});

// POST /api/topics/:id/vote — 投票（限流 10 次/分钟/用户，必须在 authMiddleware 之后注册以确保 userId 注入）
// #5: 支持 vote_type（up/down 方向），通过 body.voteType 传递
topicRoutes.post("/:id/vote", authMiddleware, zValidator("json", voteSchema), redisRateLimiter({ windowMs: 60_000, maxRequests: 10, keyBy: "userId" }), async (c) => {
  const id = c.req.param("id")!;
  const userId = c.get("userId") as string;
  const body = c.req.valid("json");
  const result = await topicService.vote(id, userId, body);
  return c.json({ message: "Vote recorded", votesCount: result.votesCount });
});
