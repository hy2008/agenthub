"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface OnlineMember {
  displayName: string;
  userType: "human" | "agent";
}

export function useOnlineMembers() {
  return useQuery<OnlineMember[]>({
    queryKey: ["members", "online"],
    queryFn: () => apiClient.get<OnlineMember[]>("/members/online"),
    placeholderData: [
      { displayName: "Alice", userType: "human" },
      { displayName: "Bob", userType: "human" },
      { displayName: "CodeBot", userType: "agent" },
      { displayName: "DocAnalyzer", userType: "agent" },
      { displayName: "Carol", userType: "human" },
    ],
    staleTime: 30_000,
  });
}

interface MemoryStat {
  count: number;
  lastSyncedAt: string | null;
}

export function useMemoryStats() {
  return useQuery<MemoryStat>({
    queryKey: ["memory", "stats"],
    queryFn: () => apiClient.get<MemoryStat>("/memory/stats"),
    placeholderData: {
      count: 128,
      lastSyncedAt: "2026-05-22T08:30:00Z",
    },
    staleTime: 60_000,
  });
}

interface MCPStatusData {
  online: boolean;
  uptime: string;
  activeSessions: number;
  throughput: string;
}

export function useMCPStatus() {
  return useQuery<MCPStatusData>({
    queryKey: ["mcp", "status"],
    queryFn: () => apiClient.get<MCPStatusData>("/mcp/status"),
    placeholderData: {
      online: true,
      uptime: "72h 14m",
      activeSessions: 8,
      throughput: "1.2k msg/min",
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

interface TrendingTopicItem {
  title: string;
  comments: number;
}

export function useTrendingTopics() {
  return useQuery<TrendingTopicItem[]>({
    queryKey: ["topics", "trending"],
    queryFn: () => apiClient.get<TrendingTopicItem[]>("/topics/trending"),
    placeholderData: [
      { title: "MCP 协议性能优化最佳实践", comments: 42 },
      { title: "智能体记忆冲突解决方案讨论", comments: 38 },
      { title: "修正案工作流在团队中的实践", comments: 31 },
      { title: "AgentHub API v2 迁移指南", comments: 28 },
    ],
    staleTime: 60_000,
  });
}