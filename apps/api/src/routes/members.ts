// 在线成员路由

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { presenceService } from "../services/presence.service.js";

export const memberRoutes = new Hono();

// GET /api/members/online — 获取在线成员列表
memberRoutes.get("/online", async (c) => {
  const members = await presenceService.getOnlineMembers();
  return c.json(members);
});

// POST /api/members/heartbeat — 客户端主动心跳
memberRoutes.post("/heartbeat", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;
  const userType = c.get("userType") as string | undefined;
  await presenceService.heartbeat(
    userId,
    userId.slice(0, 8),
    userType || "human"
  );
  const count = await presenceService.getOnlineCount();
  return c.json({ ok: true, onlineCount: count });
});
