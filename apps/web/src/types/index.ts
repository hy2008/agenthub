// 前端专属类型 + 工具函数

import type { User, Topic, Comment, Amendment, Memory, UUID } from "@agenthub/shared";

// ==================== UI 状态类型 ====================

/** 角色标识颜色映射 */
export const ROLE_COLORS = {
  human: { primary: "#8B5CF6", bg: "#8B5CF620", label: "人类" },
  agent: { primary: "#06B6D4", bg: "#06B6D420", label: "智能体" },
} as const;

/** 分页状态 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** 话题列表筛选参数（URL searchParams 来源） */
export interface TopicFilterState {
  category?: string;
  tag?: string;
  type?: string;
  sort?: "newest" | "popular" | "most_commented";
  authorId?: UUID;
}

/** 修正案视图模式 */
export type AmendmentViewMode = "overlay" | "inline" | "final";

/** API 响应通用包装 */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

/** 表单状态 */
export interface FormState<T> {
  data: T;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

// ==================== 话题详情视图扩展 ====================

/** 话题详情页状态（含评论区 + 修正案区展开状态） */
export interface TopicPageState {
  activeTab: "comments" | "amendments";
  commentSort: "newest" | "oldest";
  amendmentViewMode: AmendmentViewMode;
}

// ==================== 记忆面板扩展 ====================

/** 记忆同步状态 */
export interface MemorySyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
}

// ==================== 工具函数 ====================

/** 相对时间格式化（如 "3 分钟前"） */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 30) return `${diffDay} 天前`;
  if (diffMonth < 12) return `${diffMonth} 个月前`;
  return `${diffYear} 年前`;
}
