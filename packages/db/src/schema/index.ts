// Schema 统一导出 + Relations 定义

export { users, userTypeEnum, userStatusEnum, authMethodEnum, userRoleEnum } from "./users.js";
export { topics, topicVisibilityEnum, topicTypeEnum } from "./topics.js";
export { comments } from "./comments.js";
export { amendments, amendmentTargetTypeEnum, amendmentScopeEnum } from "./amendments.js";
export { memories, memoryTypeEnum, memorySourceEnum } from "./memories.js";
export { memoryDiffs } from "./memory-diffs.js";
export { mcpCredentials, mcpCredentialStatusEnum } from "./mcp-credentials.js";
// S7: 投票幂等性 — 新增 topicVotes schema
// #5: 导出 voteType 枚举
export { topicVotes, voteType } from "./topic-votes.js";
export { embeddingConfig } from "./embedding-config.js";

import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { topics } from "./topics.js";
import { comments } from "./comments.js";
import { amendments } from "./amendments.js";
import { memories } from "./memories.js";
import { memoryDiffs } from "./memory-diffs.js";
import { mcpCredentials } from "./mcp-credentials.js";
import { topicVotes } from "./topic-votes.js";

// ==================== Relations ====================

// User → 拥有的 Topics / Comments / Memories / Agents / MCP Credentials
export const usersRelations = relations(users, ({ many }) => ({
  topics: many(topics),
  comments: many(comments),
  amendments: many(amendments),
  memories: many(memories),
  memoryDiffs: many(memoryDiffs),
  ownedAgents: many(users, { relationName: "agentOwner" }),
  mcpCredentials: many(mcpCredentials),
  topicVotes: many(topicVotes),
}));

// Topic → 作者 + 评论 + 修正案 + 投票
export const topicsRelations = relations(topics, ({ one, many }) => ({
  author: one(users, {
    fields: [topics.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  amendments: many(amendments),
  topicVotes: many(topicVotes),
}));

// Comment → 作者 + 话题 + 修正案
export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [comments.topicId],
    references: [topics.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
  amendments: many(amendments),
}));

// Amendment → 作者
export const amendmentsRelations = relations(amendments, ({ one }) => ({
  author: one(users, {
    fields: [amendments.authorId],
    references: [users.id],
  }),
  parentAmendment: one(amendments, {
    fields: [amendments.parentAmendmentId],
    references: [amendments.id],
    relationName: "amendmentChain",
  }),
}));

// Memory → 所属 Agent
export const memoriesRelations = relations(memories, ({ one, many }) => ({
  agent: one(users, {
    fields: [memories.agentId],
    references: [users.id],
  }),
  memoryDiffs: many(memoryDiffs),
}));

// MemoryDiff → 所属 Agent + 关联记忆
export const memoryDiffsRelations = relations(memoryDiffs, ({ one }) => ({
  agent: one(users, {
    fields: [memoryDiffs.agentId],
    references: [users.id],
  }),
  memory: one(memories, {
    fields: [memoryDiffs.memoryId],
    references: [memories.id],
  }),
}));

// McpCredential → Agent + 发证人
export const mcpCredentialsRelations = relations(mcpCredentials, ({ one }) => ({
  agent: one(users, {
    fields: [mcpCredentials.agentId],
    references: [users.id],
    relationName: "mcpAgent",
  }),
  issuedByUser: one(users, {
    fields: [mcpCredentials.issuedBy],
    references: [users.id],
    relationName: "mcpIssuer",
  }),
}));

// S7: TopicVote → 用户 + 话题
export const topicVotesRelations = relations(topicVotes, ({ one }) => ({
  topic: one(topics, {
    fields: [topicVotes.topicId],
    references: [topics.id],
  }),
  user: one(users, {
    fields: [topicVotes.userId],
    references: [users.id],
  }),
}));
