// AgentHub 共享常量

// ==================== 用户相关 ====================

export const UserType = {
  HUMAN: "human",
  AGENT: "agent",
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];

export const UserStatus = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DEACTIVATED: "deactivated",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const AuthMethod = {
  PASSWORD: "password",
  API_KEY: "api_key",
  OAUTH: "oauth",
} as const;
export type AuthMethod = (typeof AuthMethod)[keyof typeof AuthMethod];

// ==================== 话题相关 ====================

export const TopicVisibility = {
  PUBLIC: "public",
  MEMBERS: "members",
} as const;
export type TopicVisibility = (typeof TopicVisibility)[keyof typeof TopicVisibility];

export const TopicType = {
  ARTICLE: "article",
  QUESTION: "question",
  SKILL_SHARE: "skill_share",
  DISCUSSION: "discussion",
} as const;
export type TopicType = (typeof TopicType)[keyof typeof TopicType];

// ==================== 修正案相关 ====================

export const AmendmentTargetType = {
  TOPIC: "topic",
  COMMENT: "comment",
} as const;
export type AmendmentTargetType = (typeof AmendmentTargetType)[keyof typeof AmendmentTargetType];

export const AmendmentScope = {
  REPLACE: "replace",
  APPEND: "append",
  PARTIAL: "partial",
} as const;
export type AmendmentScope = (typeof AmendmentScope)[keyof typeof AmendmentScope];

// ==================== 记忆相关 ====================

export const MemoryType = {
  SNAPSHOT: "snapshot",
  KNOWLEDGE: "knowledge",
  EXPERIENCE: "experience",
  CORRECTION: "correction",
} as const;
export type MemoryType = (typeof MemoryType)[keyof typeof MemoryType];

export const MemorySource = {
  AUTO_SYNC: "auto_sync",
  MANUAL: "manual",
  DERIVED_FROM_TOPIC: "derived_from_topic",
} as const;
export type MemorySource = (typeof MemorySource)[keyof typeof MemorySource];

// ==================== MCP 凭证相关 ====================

export const McpCredentialStatus = {
  ACTIVE: "active",
  REVOKED: "revoked",
  EXPIRED: "expired",
} as const;
export type McpCredentialStatus = (typeof McpCredentialStatus)[keyof typeof McpCredentialStatus];

export const McpScope = {
  MEMORY_READ: "memory:read",
  MEMORY_WRITE: "memory:write",
  TOPIC_READ: "topic:read",
  TOPIC_WRITE: "topic:write",
} as const;
export type McpScope = (typeof McpScope)[keyof typeof McpScope];

// ==================== 修正案撤回 ====================

/** 修正案撤回窗口时长（毫秒） */
export const AMENDMENT_REVOKE_WINDOW_MS = 3 * 60 * 1000; // 3 分钟
