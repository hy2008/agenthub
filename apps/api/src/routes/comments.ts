// 评论路由

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createCommentSchema, commentListQuerySchema } from "@agenthub/shared";
import { authMiddleware } from "../middleware/auth.js";
import { commentService } from "../services/comment.service.js";

export const commentRoutes = new Hono();

// GET /api/comments — 评论列表（topicId 为必选 query 参数，带分页保护）
commentRoutes.get("/", zValidator("query", commentListQuerySchema), async (c) => {
  const query = c.req.valid("query");
  const result = await commentService.list(query.topicId, query.page, query.limit);
  return c.json(result);
});

// POST /api/comments — 发表评论
commentRoutes.post("/", authMiddleware, zValidator("json", createCommentSchema), async (c) => {
  const body = c.req.valid("json");
  const userId = c.get("userId");
  const topicId = c.req.query("topicId");
  if (!topicId) {
    return c.json({ message: "topicId query parameter is required" }, 400);
  }
  const comment = await commentService.create(topicId, userId, body);
  return c.json({ message: "Comment created", comment }, 201);
});
