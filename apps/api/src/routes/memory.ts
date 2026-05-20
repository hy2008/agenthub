// 记忆路由

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createMemorySchema, memorySyncSchema, memoryResolveSchema, memoryListQuerySchema, updateMemorySchema, memorySearchSchema } from "@agenthub/shared";
import { authMiddleware, requireUserType } from "../middleware/auth.js";
import { memoryService } from "../services/memory.service.js";

export const memoryRoutes = new Hono();

// 所有记忆路由需要 Agent 身份认证
memoryRoutes.use("*", authMiddleware, requireUserType("agent"));

// GET /api/memory — 获取记忆列表（带分页保护）
memoryRoutes.get("/", zValidator("query", memoryListQuerySchema), async (c) => {
  const agentId = c.get("userId");
  const query = c.req.valid("query");
  const result = await memoryService.list(agentId, query.page, query.limit, query.memoryType, query.tag);
  return c.json(result);
});

// POST /api/memory — 写入记忆
memoryRoutes.post("/", zValidator("json", createMemorySchema), async (c) => {
  const body = c.req.valid("json");
  const agentId = c.get("userId");
  const memory = await memoryService.create(agentId, body);
  return c.json({ message: "Memory created", memory }, 201);
});

// GET /api/memory/:id — 单条记忆
memoryRoutes.get("/:id", async (c) => {
  const memoryId = c.req.param("id");
  const agentId = c.get("userId");
  const memory = await memoryService.getById(memoryId, agentId);
  return c.json({ memory });
});

// [H2] PUT /api/memory/:id — 更新记忆 — 添加 Zod 校验
memoryRoutes.put("/:id", zValidator("json", updateMemorySchema), async (c) => {
  const memoryId = c.req.param("id");
  const body = c.req.valid("json");
  const agentId = c.get("userId");
  const memory = await memoryService.update(memoryId, agentId, body);
  return c.json({ message: "Memory updated", memory });
});

// DELETE /api/memory/:id — 删除记忆
memoryRoutes.delete("/:id", async (c) => {
  const memoryId = c.req.param("id");
  const agentId = c.get("userId");
  await memoryService.delete(memoryId, agentId);
  return c.json({ message: "Memory deleted" });
});

// POST /api/memory/sync — 触发同步比对
memoryRoutes.post("/sync", zValidator("json", memorySyncSchema), async (c) => {
  const body = c.req.valid("json");
  const agentId = c.get("userId");
  const result = await memoryService.sync(agentId, body);
  return c.json(result);
});

// GET /api/memory/diff — 获取比对结果
memoryRoutes.get("/diff", async (c) => {
  const agentId = c.get("userId");
  const data = await memoryService.getDiffs(agentId);
  return c.json({ data });
});

// POST /api/memory/resolve — 解决冲突
memoryRoutes.post("/resolve", zValidator("json", memoryResolveSchema), async (c) => {
  const body = c.req.valid("json");
  const agentId = c.get("userId");
  await memoryService.resolve(agentId, body);
  return c.json({ message: "Conflict resolved", memoryId: body.memoryId, strategy: body.strategy });
});

// [H2] POST /api/memory/search — 向量语义搜索 — 添加 Zod 校验
memoryRoutes.post("/search", zValidator("json", memorySearchSchema), async (c) => {
  const body = c.req.valid("json");
  const agentId = c.get("userId");
  const data = await memoryService.search(agentId, body.query);
  return c.json({ data });
});

// POST /api/memory/:id/promote — 记忆提炼为公共话题
memoryRoutes.post("/:id/promote", async (c) => {
  const memoryId = c.req.param("id");
  const agentId = c.get("userId");
  const result = await memoryService.promote(memoryId, agentId);
  return c.json({ message: "Memory promoted to topic", ...result }, 201);
});
