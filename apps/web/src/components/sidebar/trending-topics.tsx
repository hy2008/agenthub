"use client";

import { useTrendingTopics } from "@/hooks/use-sidebar";

export function TrendingTopics() {
  const { data: topics = [] } = useTrendingTopics();

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-[1px] text-text-tertiary mb-3">热门话题</h3>
      <div className="flex flex-col gap-1">
        {topics.map((topic, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface transition-colors cursor-pointer"
          >
            <span className="font-mono text-[10px] font-bold text-text-tertiary w-4 text-right shrink-0">
              {i + 1}
            </span>
            <span className="text-xs text-text-secondary line-clamp-1 flex-1">{topic.title}</span>
            <span className="text-[10px] font-medium text-text-tertiary shrink-0">{topic.comments}</span>
          </div>
        ))}
      </div>
    </section>
  );
}