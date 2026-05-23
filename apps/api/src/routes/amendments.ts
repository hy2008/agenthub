// 修正案路由

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createAmendmentSchema, amendmentListQuerySchema, lockContentSchema } from "@agenthub/shared";
import { authMiddleware, requireUserType } from "../middleware/auth.js";
import { amendmentService } from "../services/amendment.service.js";

export const amendmentRoutes = new Hono();

// POST /api/topics/:topicId/amendments — 提交话题修正案（仅作者）
amendmentRoutes.post("/topics/:topicId/amendments", authMiddleware, zValidator("json", createAmendmentSchema), async (c) => {
  const topicId = c.req.param("topicId")!;
  const body = c.req.valid("json");
  const userId = c.get("userId") as string;
  const amendment = await amendmentService.createForTopic(topicId, userId, body);
  return c.json({ message: "Amendment submitted", amendment }, 201);
});

// POST /api/comments/:commentId/amendments — 提交评论修正案（仅作者）
amendmentRoutes.post("/comments/:commentId/amendments", authMiddleware, zValidator("json", createAmendmentSchema), async (c) => {
  const commentId = c.req.param("commentId")!;
  const body = c.req.valid("json");
  const userId = c.get("userId") as string;
  const amendment = await amendmentService.createForComment(commentId, userId, body);
  return c.json({ message: "Amendment submitted", amendment }, 201);
});

// GET /api/topics/:topicId/amendments — 查询话题修正案列表（带分页保护）
amendmentRoutes.get("/topics/:topicId/amendments", zValidator("query", amendmentListQuerySchema), async (c) => {
  const topicId = c.req.param("topicId")!;
  const query = c.req.valid("query");
  const result = await amendmentService.listByTopic(topicId, query.page, query.limit);
  return c.json(result);
});

// GET /api/comments/:commentId/amendments — 查询评论修正案列表（带分页保护）
amendmentRoutes.get("/comments/:commentId/amendments", zValidator("query", amendmentListQuerySchema), async (c) => {
  const commentId = c.req.param("commentId")!;
  const query = c.req.valid("query");
  const result = await amendmentService.listByComment(commentId, query.page, query.limit);
  return c.json(result);
});

// POST /api/amendments/:id/revoke — 撤回修正案（3分钟内，仅作者）
amendmentRoutes.post("/:id/revoke", authMiddleware, async (c) => {
  const amendmentId = c.req.param("id")!;
  const userId = c.get("userId") as string;
  await amendmentService.revoke(amendmentId, userId);
  return c.json({ message: "Amendment revoked" });
});

// POST /api/amendments/:id/accept — 接受修正案（话题作者/管理员）
amendmentRoutes.post("/:id/accept", authMiddleware, async (c) => {
  const amendmentId = c.req.param("id")!;
  const userId = c.get("userId") as string;
  await amendmentService.accept(amendmentId, userId);
  return c.json({ message: "Amendment accepted" });
});

// POST /api/amendments/:id/reject — 拒绝修正案（话题作者/管理员）
amendmentRoutes.post("/:id/reject", authMiddleware, async (c) => {
  const amendmentId = c.req.param("id")!;
  const userId = c.get("userId") as string;
  await amendmentService.reject(amendmentId, userId);
  return c.json({ message: "Amendment rejected" });
});

// PATCH /api/topics/:topicId/lock — 锁定/解锁话题（管理员）
amendmentRoutes.patch("/topics/:topicId/lock", authMiddleware, requireUserType("human"), zValidator("json", lockContentSchema), async (c) => {
  const topicId = c.req.param("topicId")!;
  const body = c.req.valid("json");
  await amendmentService.lockTopic(topicId, body.isLocked);
  return c.json({ message: body.isLocked ? "Topic locked" : "Topic unlocked", topicId, isLocked: body.isLocked });
});

// PATCH /api/comments/:commentId/lock — 锁定/解锁评论（管理员）
amendmentRoutes.patch("/comments/:commentId/lock", authMiddleware, requireUserType("human"), zValidator("json", lockContentSchema), async (c) => {
  const commentId = c.req.param("commentId")!;
  const body = c.req.valid("json");
  await amendmentService.lockComment(commentId, body.isLocked);
  return c.json({ message: body.isLocked ? "Comment locked" : "Comment unlocked", commentId, isLocked: body.isLocked });
});
