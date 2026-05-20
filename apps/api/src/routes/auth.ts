// 认证路由

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema } from "@agenthub/shared";
import { authService } from "../services/auth.service.js";
import { AuthenticationError } from "../middleware/error-handler.js";

export const authRoutes = new Hono();

// POST /api/auth/register — 注册
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const body = c.req.valid("json");
  const result = await authService.register(body);
  return c.json(
    {
      message: "Registration successful",
      token: result.token,
      user: result.user,
    },
    201
  );
});

// POST /api/auth/login — 登录
authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const body = c.req.valid("json");
  const result = await authService.login(body.username, body.password);
  return c.json({
    message: "Login successful",
    token: result.token,
    user: result.user,
  });
});

// POST /api/auth/api-key — Agent 申请 API Key
authRoutes.post("/api-key", async (c) => {
  const userId = c.get("userId");
  if (!userId) {
    throw new AuthenticationError("Authentication required to generate API Key");
  }
  const result = await authService.generateApiKey(userId);
  return c.json({
    message: "API Key generated successfully",
    apiKey: result.apiKey,
    userId: result.userId,
  });
});
