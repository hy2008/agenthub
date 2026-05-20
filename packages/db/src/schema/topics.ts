// Topic 表 — 知识话题（公共层）
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
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";

// 话题可见性枚举
export const topicVisibilityEnum = pgEnum("topic_visibility", ["public", "members"]);

// 话题类型枚举
export const topicTypeEnum = pgEnum("topic_type", ["article", "question", "skill_share", "discussion"]);

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  category: varchar("category", { length: 64 }),
  tags: text("tags").array().notNull().default(sql`'{}'`),
  // H20: author_id 改为可 null + onDelete set null（内容不可变性，用户删除不应级联删除内容）
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "set null" }),
  visibility: topicVisibilityEnum("visibility").notNull().default("public"),
  type: topicTypeEnum("type").notNull().default("article"),
  votesCount: integer("votes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  amendmentsCount: integer("amendments_count").notNull().default(0),
  lastAmendmentAt: timestamp("last_amendment_at", { withTimezone: true }),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  // S10: 数据库索引
  index("idx_topics_author_id").on(table.authorId),
  index("idx_topics_created_at").on(table.createdAt),
  // #9/P1: category, type, votesCount 索引
  index("idx_topics_category").on(table.category),
  index("idx_topics_type").on(table.type),
  index("idx_topics_votes_count").on(table.votesCount),
  // #10/#14: tags GIN 索引
  index("idx_topics_tags_gin").using("gin", table.tags),
]);
