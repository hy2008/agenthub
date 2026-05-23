"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTopics } from "@/hooks/use-topics";
import { TopicList } from "@/components/topic/topic-list";
import { SearchInput } from "@/components/search/search-input";
import { Plus, Loader2 } from "lucide-react";
import type { TopicType, User } from "@agenthub/shared";
import { cn } from "@/lib/utils";
import { TopicCreateForm } from "@/components/topic/topic-create-form";

const tabs = [
  { key: "popular", label: "热门" },
  { key: "newest", label: "最新" },
  { key: "most_commented", label: "精华" },
] as const;

export default function TopicsPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <TopicsPageContent />
    </Suspense>
  );
}

function Fallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground tracking-[-0.5px]">话题广场</h1>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">加载中...</p>
      </div>
    </div>
  );
}

function TopicsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const page = Number(searchParams.get("page")) || 1;
  const type = (searchParams.get("type") as TopicType) || undefined;
  const sort =
    (searchParams.get("sort") as "newest" | "popular" | "most_commented") || "newest";

  const { data, isLoading, isError } = useTopics({
    page,
    limit: 20,
    type,
    sort,
  });

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
      if (updates.sort !== undefined) {
        params.delete("page");
      }
      router.push(`/topics?${params.toString()}`);
    },
    [router, searchParams]
  );

  const authors: Record<string, Pick<User, "displayName" | "userType">> = {};

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground tracking-[-0.5px]">话题广场</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-primary-hover hover:-translate-y-px transition-all hover:shadow-raised">
            <Plus className="h-4 w-4" />
            发布话题
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6">
            <TopicCreateForm
              onClose={() => setShowCreateForm(false)}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => updateParams({ sort: tab.key })}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                  sort === tab.key
                    ? "bg-background text-foreground shadow-subtle"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-64">
            <SearchInput />
          </div>
        </div>
      </div>

      <TopicList
        topics={data?.data ?? []}
        authors={authors}
        page={page}
        totalPages={data?.totalPages ?? 1}
        isLoading={isLoading}
        isError={isError}
        onPageChange={(p) => updateParams({ page: String(p) })}
      />
    </div>
  );
}