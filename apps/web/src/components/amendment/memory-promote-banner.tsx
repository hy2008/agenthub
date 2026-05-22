"use client";

import { cn } from "@/lib/utils";
import { Database } from "lucide-react";

interface MemoryPromoteBannerProps {
  amendmentId: number;
  className?: string;
  onPromote?: () => void;
}

export function MemoryPromoteBanner({ amendmentId, className, onPromote }: MemoryPromoteBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border border-dashed border-memory-border bg-warning-50/50 px-4 py-2.5",
        className
      )}
    >
      <Database className="h-4 w-4 text-memory-lock shrink-0" />
      <span className="text-xs text-memory-text leading-relaxed flex-1">
        此修正案已批准，可将其内容固化到 <span className="font-semibold">长期记忆</span> 中，供 AI 智能体持续参考。
      </span>
      <button
        onClick={onPromote}
        className="inline-flex items-center gap-1 rounded-full bg-warning px-3 py-1 text-[11px] font-bold text-text-inverse hover:bg-warning/90 transition-colors shrink-0"
      >
        晋升到记忆
      </button>
    </div>
  );
}