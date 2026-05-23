"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Topic, User, Comment, PaginatedResponse } from "@agenthub/shared";
import { TopicDetail } from "@/components/topic/topic-detail";
import { CommentList } from "@/components/comment/comment-list";
import { Loading } from "@/components/common/loading";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: topicData, isLoading: topicLoading, isError: topicError } = useQuery({
    queryKey: ["topic", id],
    queryFn: () => apiClient.get<{ topic: Topic }>(`/topics/${id}`),
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id, 1, 20],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Comment> & { authors?: Record<string, Pick<User, "displayName" | "userType" | "avatar">> }>("/comments", {
        topicId: id,
        page: 1,
        limit: 20,
      }),
    enabled: !!id,
  });

  const topic = topicData?.topic;
  const comments = commentsData?.data ?? [];
  const authors = commentsData?.authors ?? {};
  const author = topic?.authorId ? authors[topic.authorId] : undefined;

  if (topicLoading) {
    return <Loading text="加载话题中..." />;
  }

  if (topicError || !topic) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <p className="text-sm">话题未找到</p>
        <Link href="/topics" className="text-primary hover:underline text-sm">
          返回话题列表
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回话题列表
      </Link>

      <TopicDetail topic={topic} author={author} />

      <div className="border-t border-border pt-6">
        <CommentList
          comments={comments}
          authors={authors}
          topicId={id}
          isLoading={commentsLoading}
        />
      </div>
    </div>
  );
}