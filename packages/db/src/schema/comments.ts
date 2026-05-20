// Comment 表 — 讨论（公共层）
// S10: 添加数据库索引 | H20: 级联删除策略修订 — author_id 改为可 null + onDelete set null

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { topics } from "./topics.js";

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  // #8/#13: parent_id 添加自引用 FK（嵌套回复）
  parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, { onDelete: "set null" }),
  // H20: author_id 改为可 null + onDelete set null（内容不可变性）
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "set null" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  votesCount: integer("votes_count").notNull().default(0),
  amendmentsCount: integer("amendments_count").notNull().default(0),
  lastAmendmentAt: timestamp("last_amendment_at", { withTimezone: true }),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  // S10: 数据库索引 — 按话题查评论列表
  index("idx_comments_topic_id").on(table.topicId),
  // #9/P1: author_id 索引 + parent_id 索引
  index("idx_comments_author_id").on(table.authorId),
  index("idx_comments_parent_id").on(table.parentId),
]);
