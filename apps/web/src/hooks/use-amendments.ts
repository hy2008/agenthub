"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Amendment, PaginatedResponse } from "@agenthub/shared";

/** 话题修正案列表查询 */
export function useAmendments(topicId: string) {
  return useQuery({
    queryKey: ["amendments", topicId],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Amendment>>(`/topics/${topicId}/amendments`),
    enabled: !!topicId,
  });
}

/** 创建修正案 */
export function useCreateAmendment(topicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { content: string; reason?: string; scope: string; paragraphIndex: number }) =>
      apiClient.post<{ message: string; amendment: Amendment }>(`/topics/${topicId}/amendments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amendments", topicId] });
      queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
    },
  });
}

/** 接受修正案 */
export function useAcceptAmendment(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amendmentId: string) =>
      apiClient.post(`/amendments/${amendmentId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amendments", topicId] });
    },
  });
}

/** 拒绝/撤回修正案 */
export function useRejectAmendment(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amendmentId: string) =>
      apiClient.post(`/amendments/${amendmentId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amendments", topicId] });
    },
  });
}

/** 撤回修正案（仅作者3分钟内） */
export function useRevokeAmendment(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amendmentId: string) =>
      apiClient.post(`/amendments/${amendmentId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amendments", topicId] });
    },
  });
}
