"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { User, McpCredential } from "@agenthub/shared";

/** Agent 列表查询 */
export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: User[] }>("/agents");
      return res.data;
    },
  });
}

/** 创建 Agent */
export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      username: string;
      displayName: string;
      password: string;
      agentMetadata?: { model: string; version: string; capabilities: string[] };
    }) => {
      const res = await apiClient.post<{ message: string; agent: User }>("/agents", data);
      return res.agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

/** 更新 Agent 状态 */
export function useUpdateAgentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch<{ message: string; agentId: string; status: string }>(
        `/agents/${id}/status`,
        { status }
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

/** 查看 Agent 详情 */
export function useAgentDetail(agentId: string) {
  return useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const res = await apiClient.get<{ agent: User }>(`/agents/${agentId}`);
      return res.agent;
    },
    enabled: !!agentId,
  });
}

/** MCP 凭证列表 */
export function useMcpCredentials(agentId: string) {
  return useQuery({
    queryKey: ["mcp-credentials", agentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: McpCredential[] }>(`/agents/${agentId}/mcp-credential`);
      return res.data;
    },
    enabled: !!agentId,
  });
}

/** 创建 MCP 凭证 */
export function useCreateMcpCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentId,
      scopes,
      expiresAt,
    }: {
      agentId: string;
      scopes: string[];
      expiresAt?: string;
    }) => {
      const res = await apiClient.post<{
        message: string;
        credential: McpCredential;
        rawKey: string;
      }>(`/agents/${agentId}/mcp-credential`, { scopes, expiresAt });
      return res;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["mcp-credentials", vars.agentId] });
    },
  });
}

/** 撤销 MCP 凭证 */
export function useRevokeMcpCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentId,
      credentialId,
    }: {
      agentId: string;
      credentialId?: string;
    }) => {
      const params = credentialId ? `?credentialId=${credentialId}` : "";
      const res = await apiClient.delete<{ message: string; agentId: string; credentialId: string }>(
        `/agents/${agentId}/mcp-credential${params}`
      );
      return res;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["mcp-credentials", vars.agentId] });
    },
  });
}
