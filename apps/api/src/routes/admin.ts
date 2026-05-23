// Admin 管理路由 — 话题/评论/用户管理 + Embedding 配置
// 所有路由使用 adminMiddleware 保护（需先通过 authMiddleware）

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  updateEmbeddingConfigSchema,
} from "@agenthub/shared";
import { db, topics, comments, users, eq, like, or, desc, count } from "@agenthub/db";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";
import { embeddingService } from "../services/embedding.service.js";

export const adminRoutes = new Hono();

// 所有 admin 路由都需要认证 + 管理员权限
adminRoutes.use("*", authMiddleware, adminMiddleware);

// ==================== 话题管理 ====================

// GET /api/admin/topics — 话题列表（分页，含所有状态）
adminRoutes.get("/topics", async (c) => {
  const page = Number(c.req.query("page")) || 1;
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const search = c.req.query("search") || "";
  const offset = (page - 1) * limit;

  const whereClause = search
    ? or(like(topics.title, `%${search}%`), like(topics.content, `%${search}%`))
    : undefined;

  const [countRow] = await db
    .select({ total: count() })
    .from(topics)
    .where(whereClause);
  const total = countRow?.total ?? 0;

  const data = await db
    .select()
    .from(topics)
    .where(whereClause)
    .orderBy(desc(topics.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// PATCH /api/admin/topics/:id/lock — 锁定/解锁话题
adminRoutes.patch("/topics/:id/lock", async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const isLocked = Boolean(body.isLocked);
  await db.update(topics).set({ isLocked }).where(eq(topics.id, id));
  return c.json({ message: `Topic ${isLocked ? "locked" : "unlocked"}` });
});

// DELETE /api/admin/topics/:id — 强制删除话题
adminRoutes.delete("/topics/:id", async (c) => {
  const id = c.req.param("id")!;
  await db.delete(topics).where(eq(topics.id, id));
  return c.json({ message: "Topic deleted" });
});

// ==================== 评论管理 ====================

// GET /api/admin/comments — 评论列表（分页）
adminRoutes.get("/comments", async (c) => {
  const page = Number(c.req.query("page")) || 1;
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const offset = (page - 1) * limit;

  const [countRow] = await db.select({ total: count() }).from(comments);
  const total = countRow?.total ?? 0;

  const data = await db
    .select()
    .from(comments)
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// PATCH /api/admin/comments/:id/lock — 锁定/解锁评论
adminRoutes.patch("/comments/:id/lock", async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const isLocked = Boolean(body.isLocked);
  await db.update(comments).set({ isLocked }).where(eq(comments.id, id));
  return c.json({ message: `Comment ${isLocked ? "locked" : "unlocked"}` });
});

// DELETE /api/admin/comments/:id — 强制删除评论
adminRoutes.delete("/comments/:id", async (c) => {
  const id = c.req.param("id")!;
  await db.delete(comments).where(eq(comments.id, id));
  return c.json({ message: "Comment deleted" });
});

// ==================== 用户管理 ====================

// GET /api/admin/users — 用户列表（分页）
adminRoutes.get("/users", async (c) => {
  const page = Number(c.req.query("page")) || 1;
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const offset = (page - 1) * limit;

  const [countRow] = await db.select({ total: count() }).from(users);
  const total = countRow?.total ?? 0;

  const data = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// PATCH /api/admin/users/:id/status — 修改用户状态（封禁/解封）
adminRoutes.patch("/users/:id/status", async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const status = body.status as string;
  if (!["active", "suspended", "deactivated"].includes(status)) {
    return c.json({ error: "Invalid status" }, 400);
  }
  await db.update(users).set({ status: status as any }).where(eq(users.id, id));
  return c.json({ message: `User status updated to ${status}` });
});

// PATCH /api/admin/users/:id/role — 设置用户角色
adminRoutes.patch("/users/:id/role", async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const role = body.role as string;
  if (!["admin", "user"].includes(role)) {
    return c.json({ error: "Invalid role" }, 400);
  }
  await db.update(users).set({ role: role as any }).where(eq(users.id, id));
  return c.json({ message: `User role updated to ${role}` });
});

// ==================== Embedding 配置 ====================

// GET /api/admin/embedding-config — 获取 embedding 配置
adminRoutes.get("/embedding-config", async (c) => {
  const config = await embeddingService.getConfig();
  return c.json({ data: config });
});

// PUT /api/admin/embedding-config — 更新 embedding 配置
adminRoutes.put("/embedding-config", zValidator("json", updateEmbeddingConfigSchema), async (c) => {
  const body = c.req.valid("json");
  const config = await embeddingService.updateConfig(body);
  return c.json({ data: config, message: "Embedding config updated" });
});

// POST /api/admin/embedding/test — 测试 embedding 连接（服务端代理，避免 Mixed Content）
adminRoutes.post("/embedding/test", async (c) => {
  const body = await c.req.json();
  const { apiBaseUrl, apiKey, modelName } = body as { apiBaseUrl: string; apiKey: string; modelName: string };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${apiBaseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json() as any;
      const hasModel = data.data?.some((m: any) => m.id === modelName);
      return c.json({ ok: true, hasModel, message: hasModel ? `连接成功，模型 ${modelName} 可用` : `连接成功，但 ${modelName} 不可用` });
    } else {
      return c.json({ ok: false, message: `API 连接失败: ${res.status} ${res.statusText}` });
    }
  } catch (e: any) {
    return c.json({ ok: false, message: `连接异常: ${e.message}` });
  }
});
