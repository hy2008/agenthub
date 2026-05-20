// AgentHub Zod 校验 Schema

import { z } from "zod";
import {
  UserType,
  UserStatus,
  AuthMethod,
  TopicVisibility,
  TopicType,
  AmendmentScope,
  AmendmentTargetType,
  MemoryType,
  MemorySource,
  McpCredentialStatus,
  McpScope,
} from "./constants.js";

// ==================== 通用 ====================

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ==================== Auth ====================

export const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  displayName: z.string().min(1).max(64),
  password: z.string().min(8).max(128),
  userType: z.enum([UserType.HUMAN, UserType.AGENT]),
  ownerId: uuidSchema.optional(),
  agentMetadata: z
    .object({
      model: z.string(),
      version: z.string(),
      capabilities: z.array(z.string()),
    })
    .optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ==================== Topic ====================

export const createTopicSchema = z.object({
  title: z.string().min(1).max(256),
  content: z.string().min(1),
  category: z.string().max(64).optional(),
  tags: z.array(z.string().max(32)).max(10).optional(),
  visibility: z.enum([TopicVisibility.PUBLIC, TopicVisibility.MEMBERS]).optional(),
  type: z
    .enum([TopicType.ARTICLE, TopicType.QUESTION, TopicType.SKILL_SHARE, TopicType.DISCUSSION])
    .optional(),
});

export const topicListQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  tag: z.string().optional(),
  type: z.enum([TopicType.ARTICLE, TopicType.QUESTION, TopicType.SKILL_SHARE, TopicType.DISCUSSION]).optional(),
  sort: z.enum(["newest", "popular", "most_commented"]).optional(),
  authorId: uuidSchema.optional(),
});

// #5: 投票 Schema — 支持 vote_type 方向（up/down）
export const voteSchema = z.object({
  voteType: z.enum(["up", "down"]),
});

// ==================== Comment ====================

export const createCommentSchema = z.object({
  content: z.string().min(1),
  parentId: uuidSchema.optional(),
});

/** 评论列表查询 Schema — topicId 为必选参数 */
export const commentListQuerySchema = paginationSchema.extend({
  topicId: uuidSchema,
});

// ==================== Amendment ====================

export const createAmendmentSchema = z.object({
  content: z.string().min(1),
  reason: z.string().max(256).optional(),
  scope: z.enum([AmendmentScope.REPLACE, AmendmentScope.APPEND, AmendmentScope.PARTIAL]),
  paragraphIndex: z.number().int().min(0),
  paragraphAnchor: z.string().max(128).optional(),
});

/** 修正案列表查询 Schema — 按 targetId 过滤 */
export const amendmentListQuerySchema = paginationSchema.extend({
  targetId: uuidSchema.optional(),
  targetType: z.enum([AmendmentTargetType.TOPIC, AmendmentTargetType.COMMENT]).optional(),
});

// ==================== Memory ====================

export const createMemorySchema = z.object({
  memoryType: z.enum([MemoryType.SNAPSHOT, MemoryType.KNOWLEDGE, MemoryType.EXPERIENCE, MemoryType.CORRECTION]),
  content: z.record(z.unknown()),
  tags: z.array(z.string().max(32)).max(10).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const memorySyncSchema = z.object({
  hashes: z.array(
    z.object({
      id: uuidSchema,
      contentHash: z.string(),
    })
  ),
});

export const memoryResolveSchema = z.object({
  memoryId: uuidSchema,
  strategy: z.enum(["local_first", "remote_first", "newest_wins"]),
});

/** 记忆列表查询 Schema — agentId 从 Context 获取，不暴露在 query 中 */
export const memoryListQuerySchema = paginationSchema.extend({
  memoryType: z.enum([MemoryType.SNAPSHOT, MemoryType.KNOWLEDGE, MemoryType.EXPERIENCE, MemoryType.CORRECTION]).optional(),
  tag: z.string().optional(),
});

// [H2] 记忆更新 Schema — PUT /api/memory/:id
export const updateMemorySchema = z.object({
  content: z.record(z.unknown()).optional(),
  tags: z.array(z.string().max(32)).max(10).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// [H2] 记忆搜索 Schema — POST /api/memory/search
export const memorySearchSchema = z.object({
  query: z.string().min(1),
});

// ==================== Agent ====================

/** Agent 列表查询 Schema */
export const agentListQuerySchema = paginationSchema.extend({
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.DEACTIVATED]).optional(),
});

// [H1] 创建 Agent Schema — POST /api/agents
export const createAgentSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  displayName: z.string().min(1).max(64),
  password: z.string().min(8).max(128),
  agentMetadata: z
    .object({
      model: z.string(),
      version: z.string(),
      capabilities: z.array(z.string()),
    })
    .optional(),
});

// [H1] 更新 Agent 状态 Schema — PATCH /api/agents/:id/status
export const updateAgentStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.DEACTIVATED]),
});

// ==================== MCP Credential ====================

export const createMcpCredentialSchema = z.object({
  scopes: z.array(z.enum([McpScope.MEMORY_READ, McpScope.MEMORY_WRITE, McpScope.TOPIC_READ, McpScope.TOPIC_WRITE])).min(1),
  expiresAt: z.string().datetime().optional(),
});

// [H3] 更新 MCP 凭证 Schema — PATCH /api/agents/:id/mcp-credential
// [H13] 添加必选字段 credentialId，用于指定更新哪个凭证
export const updateMcpCredentialSchema = z.object({
  credentialId: z.string().uuid(),
  scopes: z.array(z.enum([McpScope.MEMORY_READ, McpScope.MEMORY_WRITE, McpScope.TOPIC_READ, McpScope.TOPIC_WRITE])).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const lockContentSchema = z.object({
  isLocked: z.boolean(),
});

// ==================== Embedding Config ====================

export const updateEmbeddingConfigSchema = z.object({
  apiBaseUrl: z.string().url().max(512).optional(),
  apiKey: z.string().min(1).optional(),
  modelName: z.string().max(128).optional(),
  embeddingDimensions: z.number().int().positive().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  timeout: z.number().int().min(1).max(300).optional(),
  enabled: z.boolean().optional(),
});
