// MemoryDiff 表 — 记忆比对记录
// S10: 添加数据库索引 | H10: 添加 memoryId 字段以支持精确删除

import {
  pgTable,
  uuid,
  varchar,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { memories } from "./memories.js";

export const memoryDiffs = pgTable("memory_diffs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // H10: 添加 memoryId 字段，用于精确过滤与指定记忆相关的 diff 记录
  memoryId: uuid("memory_id")
    .references(() => memories.id, { onDelete: "cascade" }),
  localHash: varchar("local_hash", { length: 64 }).notNull(),
  remoteHash: varchar("remote_hash", { length: 64 }).notNull(),
  match: boolean("match").notNull(),
  diffDetails: jsonb("diff_details"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  // S10: 数据库索引
  index("idx_memory_diffs_agent_id").on(table.agentId),
  // #11/#15: agent_id + memory_id 复合索引
  index("idx_memory_diffs_agent_memory").on(table.agentId, table.memoryId),
]);
