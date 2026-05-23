// 在线心跳中间件 — 自动追踪已认证用户的活动状态

import type { Context, Next } from "hono";
import { presenceService } from "../services/presence.service.js";

export async function presenceHeartbeat(c: Context, next: Next) {
  await next();

  const userId = c.get("userId") as string | undefined;
  const userType = c.get("userType") as string | undefined;

  if (userId && c.res.status < 400) {
    presenceService.heartbeat(
      userId,
      userId.slice(0, 8),   // displayName fallback
      userType || "human"
    ).catch(() => {});
  }
}
