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
