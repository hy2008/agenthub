// TopicVotes 表 — 话题投票幂等性（S7: 投票幂等性）
// #5: 添加 vote_type 列支持投票方向变更

import {
  pgTable,
  pgEnum,
  uuid,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users.js";
import { topics } from "./topics.js";

// #5: 投票方向枚举
export const voteType = pgEnum("vote_type", ["up", "down"]);

export const topicVotes = pgTable("topic_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // #5: 新增 vote_type 列，支持 up/down 方向
  voteType: voteType("vote_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  // uniqueIndex 保持不变 (topicId, userId)
  uniqueIndex("topic_votes_user_topic_unique").on(table.topicId, table.userId),
  // #5: 新增 createdAt 索引用于排序
  index("idx_topic_votes_created_at").on(table.createdAt),
]);
