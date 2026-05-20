"use client";

import type { Topic, User } from "@agenthub/shared";
import { TopicCard } from "./topic-card";
import { Pagination } from "@/components/common/pagination";
import { Loading } from "@/components/common/loading";
import { FileQuestion } from "lucide-react";

interface TopicListProps {
  topics: Topic[];
  authors: Record<string, Pick<User, "displayName" | "userType">>;
  page: number;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  onPageChange: (page: number) => void;
}

/** 话题列表组件 */
export function TopicList({
  topics,
  authors,
  page,
  totalPages,
  isLoading,
  isError,
  onPageChange,
}: TopicListProps) {
  if (isLoading) {
    return <Loading text="加载话题中..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <FileQuestion className="h-10 w-10" />
        <p className="text-sm">加载失败，请稍后重试</p>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
        <FileQuestion className="h-10 w-10" />
        <p className="text-sm">暂无话题</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} authors={authors} />
      ))}
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
