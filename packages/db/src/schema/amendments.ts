// Amendment 表 — 修正案（内容修正层）
// S10: 添加数据库索引 | H20: 级联删除策略修订 — author_id 改为可 null + onDelete set null

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { topics } from "./topics.js";
import { comments } from "./comments.js";

// 修正目标类型枚举
export const amendmentTargetTypeEnum = pgEnum("amendment_target_type", ["topic", "comment"]);

// 修正范围枚举
export const amendmentScopeEnum = pgEnum("amendment_scope", ["replace", "append", "partial"]);

export const amendments = pgTable("amendments", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetType: amendmentTargetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  // #8/#13: parent_amendment_id 添加自引用 FK（链式修正）
  parentAmendmentId: uuid("parent_amendment_id").references((): AnyPgColumn => amendments.id, { onDelete: "set null" }),
  // H20: author_id 改为可 null + onDelete set null（内容不可变性）
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  reason: varchar("reason", { length: 256 }),
  scope: amendmentScopeEnum("scope").notNull(),
  paragraphIndex: integer("paragraph_index").notNull().default(0),
  paragraphAnchor: varchar("paragraph_anchor", { length: 128 }),
  diffPatch: text("diff_patch"),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  isRevoked: boolean("is_revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  resolution: varchar("resolution", { length: 16 }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  revokeDeadline: timestamp("revoke_deadline", { withTimezone: true }).notNull(),
}, (table) => [
  // S10: 数据库索引 — 按目标类型+ID 查修正案
  index("idx_amendments_target").on(table.targetType, table.targetId),
  // #9/P1: author_id 索引
  index("idx_amendments_author_id").on(table.authorId),
  // #9/P1: target_id + target_type + is_revoked 复合索引
  index("idx_amendments_target_revoked").on(table.targetId, table.targetType, table.isRevoked),
]);
