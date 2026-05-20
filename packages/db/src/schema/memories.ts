// Memory 表 — 记忆条目（私有层）
// S10: 添加数据库索引

import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

// 记忆类型枚举
export const memoryTypeEnum = pgEnum("memory_type", ["snapshot", "knowledge", "experience", "correction"]);

// 记忆来源枚举
export const memorySourceEnum = pgEnum("memory_source", ["auto_sync", "manual", "derived_from_topic"]);

export const memories = pgTable("memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memoryType: memoryTypeEnum("memory_type").notNull(),
  content: jsonb("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  vectorId: varchar("vector_id", { length: 128 }),
  source: memorySourceEnum("source").notNull().default("manual"),
  tags: text("tags").array().notNull().default(sql`'{}'`),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  // S10: 数据库索引
  index("idx_memories_agent_id").on(table.agentId),
  index("idx_memories_agent_created").on(table.agentId, table.createdAt),
  // #9/P1: agent_id + memory_type 复合索引
  index("idx_memories_agent_type").on(table.agentId, table.memoryType),
]);
