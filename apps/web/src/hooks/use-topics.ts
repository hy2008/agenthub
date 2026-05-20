"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Topic, TopicListQuery, PaginatedResponse, CreateTopicRequest } from "@agenthub/shared";

/** 话题列表查询 */
export function useTopics(query: TopicListQuery) {
  return useQuery({
    queryKey: ["topics", query],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Topic>>("/topics", {
        page: query.page,
        limit: query.limit,
        category: query.category,
        tag: query.tag,
        type: query.type,
        sort: query.sort,
        authorId: query.authorId,
      }),
  });
}

/** 创建话题 */
export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTopicRequest) =>
      apiClient.post<{ message: string; topic: Topic }>("/topics", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
}

/** 投票话题 */
export function useVoteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (topicId: string) =>
      apiClient.post<{ message: string }>(`/topics/${topicId}/vote`),
    onSuccess: (_data, topicId) => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
    },
  });
}
