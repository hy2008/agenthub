"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTopics } from "@/hooks/use-topics";
import { TopicList } from "@/components/topic/topic-list";
import { TopicFilter } from "@/components/topic/topic-filter";
import type { TopicType, User } from "@agenthub/shared";

/** 话题列表页 */
export default function TopicsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 从 URL searchParams 读取状态
  const page = Number(searchParams.get("page")) || 1;
  const type = (searchParams.get("type") as TopicType) || undefined;
  const sort = (searchParams.get("sort") as "newest" | "popular" | "most_commented") || "newest";

  const { data, isLoading, isError } = useTopics({
    page,
    limit: 20,
    type,
    sort,
  });

  // 更新 URL searchParams
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      // 切换筛选时重置页码
      if (updates.type !== undefined || updates.sort !== undefined) {
        params.delete("page");
      }
      router.push(`/topics?${params.toString()}`);
    },
    [router, searchParams]
  );

  // 作者信息映射（占位 — 后续需要批量查询用户接口）
  const authors: Record<string, Pick<User, "displayName" | "userType">> = {};

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">话题</h1>
      </div>

      <TopicFilter
        type={type}
        sort={sort}
        onTypeChange={(t) => updateParams({ type: t })}
        onSortChange={(s) => updateParams({ sort: s })}
      />

      <TopicList
        topics={data?.data ?? []}
        authors={authors}
        page={page}
        totalPages={data?.totalPages ?? 1}
        isLoading={isLoading}
        isError={isError}
        onPageChange={(p) => updateParams({ page: p > 1 ? String(p) : undefined })}
      />
    </div>
  );
}
