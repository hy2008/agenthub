// 搜索路由 — 公开搜索（不需要认证）

import { Hono } from "hono";
import { searchService } from "../services/search.service.js";

export const searchRoute = new Hono();

searchRoute.get("/", async (c) => {
  const q = c.req.query("q") || "";
  const typeParam = c.req.query("type") || "all";
  const pageParam = c.req.query("page") || "1";
  const limitParam = c.req.query("limit") || "20";

  // 参数校验
  if (!q || q.length < 1 || q.length > 200) {
    return c.json({ code: 1, message: "搜索词长度须在 1-200 之间" }, 400);
  }

  const validTypes = ["topics", "agents", "all"];
  const type = validTypes.includes(typeParam) ? typeParam as "topics" | "agents" | "all" : "all";
  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(limitParam, 10) || 20));

  const [topicsResult, agentsResult] = await Promise.all([
    (type === "topics" || type === "all")
      ? searchService.searchTopics(q, page, limit)
      : null,
    (type === "agents" || type === "all")
      ? searchService.searchAgents(q)
      : null,
  ]);

  return c.json({ code: 0, data: { topics: topicsResult, agents: agentsResult } });
});
