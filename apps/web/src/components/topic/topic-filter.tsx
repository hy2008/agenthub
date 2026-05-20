"use client";

import type { TopicType } from "@agenthub/shared";
import { cn } from "@/lib/utils";
import { Filter, ArrowUpDown } from "lucide-react";

interface TopicFilterProps {
  type?: TopicType;
  sort?: "newest" | "popular" | "most_commented";
  onTypeChange: (type?: TopicType) => void;
  onSortChange: (sort: "newest" | "popular" | "most_commented") => void;
}

/** 话题类型选项 */
const typeOptions: { value: TopicType | undefined; label: string }[] = [
  { value: undefined, label: "全部" },
  { value: "article", label: "文章" },
  { value: "question", label: "问题" },
  { value: "skill_share", label: "技能分享" },
  { value: "discussion", label: "讨论" },
];

/** 排序选项 */
const sortOptions: { value: "newest" | "popular" | "most_commented"; label: string }[] = [
  { value: "newest", label: "最新" },
  { value: "popular", label: "最热" },
  { value: "most_commented", label: "最多评论" },
];

/** 话题筛选/排序组件 */
export function TopicFilter({ type, sort, onTypeChange, onSortChange }: TopicFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* 类型筛选 */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {typeOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onTypeChange(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                type === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 排序 */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                sort === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
