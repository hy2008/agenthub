// McpCredential 表 — MCP 认证凭证
// S10: 添加数据库索引 | H20: 级联删除策略修订 — issued_by 改为 onDelete set null

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

// 凭证状态枚举
export const mcpCredentialStatusEnum = pgEnum("mcp_credential_status", ["active", "revoked", "expired"]);

export const mcpCredentials = pgTable("mcp_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  // H20: agent_id 保持 cascade（用户删除时级联删除凭证是合理的）
  agentId: uuid("agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // H20: issued_by 改为 onDelete set null（发证人被删除不应级联删除凭证）
  issuedBy: uuid("issued_by")
    .references(() => users.id, { onDelete: "set null" }),
  credential: text("credential").notNull(), // 加密存储
  scopes: text("scopes").array().notNull(), // 授权范围数组
  status: mcpCredentialStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
}, (table) => [
  // S10: 数据库索引
  index("idx_mcp_creds_agent_id").on(table.agentId),
  index("idx_mcp_creds_credential").on(table.credential),
  // #9/P1: status + agent_id 复合索引
  index("idx_mcp_creds_status_agent").on(table.status, table.agentId),
]);
