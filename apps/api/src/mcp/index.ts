// MCP 协议端点
// 实现 Model Context Protocol 的 tools/list 和 tools/call

import { Hono } from "hono";
import { authMiddleware, requireUserType } from "../middleware/auth.js";
import { mcpTools, findTool } from "./tools/index.js";

export const mcpRoutes = new Hono();

// 所有 MCP 路由需要 Agent 认证
mcpRoutes.use("*", authMiddleware, requireUserType("agent"));

// POST /api/mcp/tools/list — 列出可用工具
mcpRoutes.post("/tools/list", async (c) => {
  return c.json({
    tools: mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  });
});

// POST /api/mcp/tools/call — 调用工具
mcpRoutes.post("/tools/call", async (c) => {
  const body = await c.req.json();
  const { name, arguments: args } = body;

  if (!name || typeof name !== "string") {
    return c.json({ error: "Missing or invalid 'name' field" }, 400);
  }

  const tool = findTool(name);
  if (!tool) {
    return c.json({ error: `Unknown tool: ${name}` }, 404);
  }

  try {
    const userId = c.get("userId");
    const result = await tool.handler(args || {}, userId);
    return c.json({ result });
  } catch (err: any) {
    return c.json({
      error: err.message || "Tool execution failed",
      toolName: name,
    }, 500);
  }
});
