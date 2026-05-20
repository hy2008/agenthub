"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** 搜索参数 */
interface SearchParams {
  q: string;
  type?: "topics" | "agents" | "all";
  page?: number;
  limit?: number;
}

/** 搜索结果 — 话题 */
interface SearchTopicItem {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  authorId: string | null;
  votesCount: number;
  commentsCount: number;
  viewCount: number;
  createdAt: string;
}

/** 搜索结果 — Agent */
interface SearchAgentItem {
  id: string;
  displayName: string;
  avatar: string | null;
  userType: string;
  status: string;
  createdAt: string;
}

/** 搜索响应 */
export interface SearchResult {
  topics: {
    data: SearchTopicItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  agents: {
    data: SearchAgentItem[];
  } | null;
}

/** 搜索 Hook */
export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: ["search", params],
    queryFn: async (): Promise<SearchResult> => {
      const searchParams: Record<string, string | number | undefined> = {
        q: params.q,
      };
      if (params.type) searchParams.type = params.type;
      if (params.page) searchParams.page = params.page;
      if (params.limit) searchParams.limit = params.limit;
      return apiClient.get<SearchResult>("/search", searchParams);
    },
    enabled: params.q.length >= 2,
    staleTime: 30_000,
  });
}
