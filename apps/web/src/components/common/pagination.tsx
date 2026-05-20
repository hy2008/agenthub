"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** 基于页码的分页组件 */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          page <= 1
            ? "text-muted-foreground cursor-not-allowed"
            : "text-foreground hover:bg-accent"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        上一页
      </button>

      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          page >= totalPages
            ? "text-muted-foreground cursor-not-allowed"
            : "text-foreground hover:bg-accent"
        )}
      >
        下一页
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
