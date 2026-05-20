// MCP 凭证管理路由

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createMcpCredentialSchema, updateMcpCredentialSchema } from "@agenthub/shared";
import { authMiddleware, requireUserType } from "../middleware/auth.js";
import { mcpCredentialService } from "../services/mcp-credential.service.js";

export const mcpCredentialRoutes = new Hono();

// POST /api/agents/:id/mcp-credential — 为 Agent 生成 MCP 凭证
mcpCredentialRoutes.post("/:id/mcp-credential", authMiddleware, requireUserType("human"), zValidator("json", createMcpCredentialSchema), async (c) => {
  const agentId = c.req.param("id")!;
  const body = c.req.valid("json");
  const issuedBy = c.get("userId") as string;
  const result = await mcpCredentialService.create(agentId, issuedBy, body);
  return c.json({
    message: "MCP credential created",
    credential: result.credential,
    rawKey: result.rawKey, // 仅此一次返回明文
  }, 201);
});

// GET /api/agents/:id/mcp-credential — 查看 Agent 的 MCP 凭证状态
mcpCredentialRoutes.get("/:id/mcp-credential", authMiddleware, async (c) => {
  const agentId = c.req.param("id")!;
  const userId = c.get("userId") as string;
  const data = await mcpCredentialService.getStatus(agentId, userId);
  return c.json({ data });
});

// DELETE /api/agents/:id/mcp-credential — 撤销 Agent 的 MCP 凭证
// [H13] 支持 query param ?credentialId=xxx 仅撤销指定凭证
mcpCredentialRoutes.delete("/:id/mcp-credential", authMiddleware, requireUserType("human"), async (c) => {
  const agentId = c.req.param("id")!;
  const userId = c.get("userId") as string;
  const credentialId = c.req.query("credentialId");
  await mcpCredentialService.revoke(agentId, userId, credentialId);
  return c.json({ message: "MCP credentials revoked", agentId, credentialId: credentialId || "all" });
});

// [H3] PATCH /api/agents/:id/mcp-credential — 续期/修改 MCP 凭证 — 添加 Zod 校验
// [H13] body 中必须包含 credentialId 字段，仅更新指定凭证
mcpCredentialRoutes.patch("/:id/mcp-credential", authMiddleware, requireUserType("human"), zValidator("json", updateMcpCredentialSchema), async (c) => {
  const agentId = c.req.param("id")!;
  const body = c.req.valid("json");
  const userId = c.get("userId") as string;
  const { credentialId, ...updateBody } = body;
  await mcpCredentialService.update(agentId, userId, credentialId, updateBody);
  return c.json({ message: "MCP credential updated", agentId, credentialId });
});
