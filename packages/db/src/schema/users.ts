// User 表 — 统一用户表（人类 + Agent）
// S10: 添加数据库索引 | H20: 级联删除策略修订

import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  pgEnum,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 用户类型枚举
export const userTypeEnum = pgEnum("user_type", ["human", "agent"]);

// 用户状态枚举
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "deactivated"]);

// 认证方式枚举
export const authMethodEnum = pgEnum("auth_method", ["password", "api_key", "oauth"]);

// 用户角色枚举
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  displayName: varchar("display_name", { length: 64 }).notNull(),
  avatar: varchar("avatar", { length: 512 }),
  userType: userTypeEnum("user_type").notNull().default("human"),
  // #8: owner_id 添加 FK 引用到 users.id（Agent 的归属人类用户）
  ownerId: uuid("owner_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  agentMetadata: jsonb("agent_metadata"), // Agent 专属：{ model, version, capabilities[] }
  passwordHash: text("password_hash").notNull(),
  authMethod: authMethodEnum("auth_method").notNull().default("password"),
  status: userStatusEnum("status").notNull().default("active"),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  // S10: 数据库索引 — 按 ownerId 查询 Agent 列表
  index("idx_users_owner_id").on(table.ownerId),
  // #9/P1: user_type 索引
  index("idx_users_user_type").on(table.userType),
]);
