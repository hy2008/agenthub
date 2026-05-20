"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Comment, PaginatedResponse, CreateCommentRequest } from "@agenthub/shared";

/** 评论列表查询 */
export function useComments(topicId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["comments", topicId, page, limit],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Comment>>("/comments", {
        topicId,
        page,
        limit,
      }),
    enabled: !!topicId,
  });
}

/** 创建评论 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, data }: { topicId: string; data: CreateCommentRequest }) =>
      apiClient.post<{ message: string; comment: Comment }>(`/comments?topicId=${topicId}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
}
