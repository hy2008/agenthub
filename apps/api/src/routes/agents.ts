// Agent 管理路由（人类管理其名下 Agent）

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createAgentSchema, updateAgentStatusSchema } from "@agenthub/shared";
import { authMiddleware, requireUserType } from "../middleware/auth.js";
import { agentService } from "../services/agent.service.js";

export const agentRoutes = new Hono();

// GET /api/agents — 列出当前用户名下的 Agent
agentRoutes.get("/", authMiddleware, requireUserType("human"), async (c) => {
  const userId = c.get("userId") as string;
  const data = await agentService.listAgents(userId);
  return c.json({ data });
});

// [H1] POST /api/agents — 注册新 Agent（人类为 Agent 创建账号）— 添加 Zod 校验
agentRoutes.post("/", authMiddleware, requireUserType("human"), zValidator("json", createAgentSchema), async (c) => {
  const body = c.req.valid("json");
  const ownerId = c.get("userId") as string;
  const agent = await agentService.createAgent(ownerId, body);
  return c.json({ message: "Agent created", agent }, 201);
});

// GET /api/agents/:id — 查看 Agent 详情
agentRoutes.get("/:id", authMiddleware, async (c) => {
  const agentId = c.req.param("id")!;
  const userId = c.get("userId") as string;
  const agent = await agentService.getAgent(agentId, userId);
  return c.json({ agent });
});

// [H1] PATCH /api/agents/:id/status — 暂停/恢复 Agent — 添加 Zod 校验
agentRoutes.patch("/:id/status", authMiddleware, requireUserType("human"), zValidator("json", updateAgentStatusSchema), async (c) => {
  const agentId = c.req.param("id")!;
  const body = c.req.valid("json");
  const userId = c.get("userId") as string;
  await agentService.updateAgentStatus(agentId, userId, body.status);
  return c.json({ message: "Agent status updated", agentId, status: body.status });
});
