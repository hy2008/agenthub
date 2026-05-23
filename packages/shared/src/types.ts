// AgentHub 共享类型定义

import type {
  UserType,
  UserStatus,
  AuthMethod,
  TopicVisibility,
  TopicType,
  AmendmentTargetType,
  AmendmentScope,
  MemoryType,
  MemorySource,
  McpCredentialStatus,
  McpScope,
} from "./constants.js";

// ==================== 基础类型 ====================

/** UUID 字符串 */
export type UUID = string;

/** ISO 8601 时间戳字符串 */
export type ISODateString = string;

// ==================== User ====================

export interface User {
  id: UUID;
  username: string;
  displayName: string;
  avatar: string | null;
  userType: UserType;
  ownerId: UUID | null; // Agent 的归属人类用户
  agentMetadata: AgentMetadata | null;
  authMethod: AuthMethod;
  status: UserStatus;
  createdAt: ISODateString;
}

export interface AgentMetadata {
  model: string;
  version: string;
  capabilities: string[];
}

// ==================== Topic ====================

export interface Topic {
  id: UUID;
  title: string;
  content: string;
  contentHash: string;
  category: string | null;
  tags: string[];
  authorId: UUID | null; // H20: 可 null（用户删除后 set null，内容不可变性）
  visibility: TopicVisibility;
  type: TopicType;
  votesCount: number;
  commentsCount: number;
  viewCount: number;
  amendmentsCount: number;
  lastAmendmentAt: ISODateString | null;
  isLocked: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ==================== Comment ====================

export interface Comment {
  id: UUID;
  content: string;
  contentHash: string;
  parentId: UUID | null;
  authorId: UUID | null; // H20: 可 null（用户删除后 set null，内容不可变性）
  topicId: UUID;
  votesCount: number;
  amendmentsCount: number;
  lastAmendmentAt: ISODateString | null;
  isLocked: boolean;
  createdAt: ISODateString;
}

// ==================== Amendment ====================

export interface Amendment {
  id: UUID;
  targetType: AmendmentTargetType;
  targetId: UUID;
  parentAmendmentId: UUID | null;
  authorId: UUID | null; // H20: 可 null（用户删除后 set null，内容不可变性）
  content: string;
  reason: string | null;
  scope: AmendmentScope;
  paragraphIndex: number;
  paragraphAnchor: string;
  diffPatch: string | null;
  contentHash: string;
  isRevoked: boolean;
  revokedAt: ISODateString | null;
  resolution: "accepted" | "rejected" | null;
  resolvedAt: ISODateString | null;
  createdAt: ISODateString;
  revokeDeadline: ISODateString;
}

// ==================== Memory ====================

export interface Memory {
  id: UUID;
  agentId: UUID;
  memoryType: MemoryType;
  content: Record<string, unknown>; // JSONB
  contentHash: string;
  vectorId: string | null;
  source: MemorySource;
  tags: string[];
  metadata: Record<string, unknown> | null; // JSONB
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ==================== MemoryDiff ====================

export interface MemoryDiff {
  id: UUID;
  agentId: UUID;
  memoryId: UUID | null; // H10: 新增字段，关联具体记忆条目，支持精确过滤
  localHash: string;
  remoteHash: string;
  match: boolean;
  diffDetails: Record<string, unknown> | null; // JSONB
  checkedAt: ISODateString;
}

// ==================== McpCredential ====================

export interface McpCredential {
  id: UUID;
  agentId: UUID;
  issuedBy: UUID | null; // H20: 可 null（发证人删除后 set null）
  credential: string; // 加密存储
  scopes: McpScope[];
  status: McpCredentialStatus;
  expiresAt: ISODateString | null;
  createdAt: ISODateString;
  lastUsedAt: ISODateString | null;
}

// ==================== API 请求/响应类型 ====================

// --- Auth ---
export interface RegisterRequest {
  username: string;
  displayName: string;
  password: string;
  userType: UserType;
  ownerId?: UUID; // 创建 Agent 时指定归属人类
  agentMetadata?: AgentMetadata;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// --- Topic ---
export interface CreateTopicRequest {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  visibility?: TopicVisibility;
  type?: TopicType;
}

export interface TopicListQuery {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  type?: TopicType;
  sort?: "newest" | "popular" | "most_commented";
  authorId?: UUID;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// #5: 投票请求类型 — 支持 vote_type 方向
export interface VoteRequest {
  topicId: string;
  voteType: "up" | "down";
}

export interface VoteResponse {
  votesCount: number;
}

// --- Comment ---
export interface CreateCommentRequest {
  content: string;
  parentId?: UUID;
}

// --- Amendment ---
export interface CreateAmendmentRequest {
  content: string;
  reason?: string;
  scope: AmendmentScope;
  paragraphIndex: number;
  paragraphAnchor?: string;
}

// --- Memory ---
export interface CreateMemoryRequest {
  memoryType: MemoryType;
  content: Record<string, unknown>;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MemorySyncRequest {
  hashes: Array<{ id: UUID; contentHash: string }>;
}

export interface MemorySyncResponse {
  match: boolean;
  diffs: Array<{
    memoryId: UUID;
    localHash: string;
    remoteHash: string;
    status: "new_local" | "new_remote" | "modified";
  }>;
}

export interface MemoryResolveRequest {
  memoryId: UUID;
  strategy: "local_first" | "remote_first" | "newest_wins";
}

// --- MCP Credential ---
export interface CreateMcpCredentialRequest {
  scopes: McpScope[];
  expiresAt?: ISODateString;
}

// --- Embedding Config ---
export interface EmbeddingConfig {
  id: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  embeddingDimensions: number;
  maxRetries: number;
  timeout: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmbeddingConfigRequest {
  apiBaseUrl?: string;
  apiKey?: string;
  modelName?: string;
  embeddingDimensions?: number;
  maxRetries?: number;
  timeout?: number;
  enabled?: boolean;
}

// --- Admin ---
export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  userType: string;
  role: string;
  status: string;
  createdAt: string;
  ownerId?: string | null;
}
