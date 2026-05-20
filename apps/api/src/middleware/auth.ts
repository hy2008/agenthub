// JWT + API Key 认证中间件

import type { Context, Next } from "hono";
import { AuthenticationError, AuthorizationError } from "./error-handler.js";
import { authService } from "../services/auth.service.js";

type UserType = "human" | "agent";

/**
 * 强制认证中间件 — 支持 Bearer Token 或 X-API-Key 认证
 *
 * 优先级：
 * 1. 检测 X-API-Key 请求头 → SHA-256 hash → 查询 mcp_credentials 表
 * 2. 检测 Authorization: Bearer 头 → JWT 验证
 * 3. 都没有 → 抛出 AuthenticationError
 */
export async function authMiddleware(c: Context, next: Next) {
  // --- 优先尝试 API Key 认证 ---
  const apiKey = c.req.header("X-API-Key");
  if (apiKey) {
    const result = await authService.verifyApiKey(apiKey);
    if (result) {
      c.set("userId", result.userId);
      c.set("userType", result.userType as UserType);
      await next();
      return;
    }
    throw new AuthenticationError("Invalid or expired API Key");
  }

  // --- JWT Bearer Token 认证 ---
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);

  // 使用 authService.verifyToken 替换临时 base64 解析
  const payload = authService.verifyToken(token);

  if (!payload) {
    throw new AuthenticationError("Invalid or expired token");
  }

  c.set("userId", payload.userId);
  c.set("userType", payload.userType as UserType);

  await next();
}

/**
 * 可选认证 — 不强制要求登录
 * 若携带合法 Bearer Token 或 X-API-Key 则写入 Context，否则跳过
 */
export async function optionalAuth(c: Context, next: Next) {
  // 尝试 API Key
  const apiKey = c.req.header("X-API-Key");
  if (apiKey) {
    const result = await authService.verifyApiKey(apiKey);
    if (result) {
      c.set("userId", result.userId);
      c.set("userType", result.userType as UserType);
    }
    await next();
    return;
  }

  // 尝试 JWT
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);
    if (payload) {
      c.set("userId", payload.userId);
      c.set("userType", payload.userType as UserType);
    }
  }

  await next();
}

/**
 * 角色校验中间件 — 验证当前用户类型是否在允许列表中
 * 需在 authMiddleware 之后使用
 */
export function requireUserType(...types: string[]) {
  return async (c: Context, next: Next) => {
    const userType = c.get("userType");
    if (!userType || !types.includes(userType)) {
      throw new AuthorizationError("Insufficient permissions");
    }
    await next();
  };
}
