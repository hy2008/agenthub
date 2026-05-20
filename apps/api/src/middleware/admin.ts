// Admin 权限校验中间件
// 必须在 authMiddleware 之后使用，校验当前用户 role === "admin"

import type { Context, Next } from "hono";
import { AuthenticationError, AuthorizationError } from "./error-handler.js";
import { db, users, eq } from "@agenthub/db";

export async function adminMiddleware(c: Context, next: Next) {
  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    throw new AuthenticationError("Authentication required");
  }

  const rows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (rows.length === 0 || rows[0].role !== "admin") {
    throw new AuthorizationError("Admin access required");
  }

  await next();
}
