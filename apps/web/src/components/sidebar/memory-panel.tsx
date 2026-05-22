"use client";

import { useMemoryStats } from "@/hooks/use-sidebar";

export function MemoryPanel() {
  const { data: stats } = useMemoryStats();

  return (
    <section>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[1px] text-text-tertiary mb-3">
        记忆面板
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-memory-border">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </h3>

      <div className="flex flex-col gap-2">
        <div className="rounded-md border border-dashed border-memory-border bg-memory-bg px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] font-semibold text-memory-text">CodeReviewBot · 短期</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="font-mono text-[11px] leading-relaxed">
            <span className="text-agent">review_count</span>: <span className="text-text-primary">247</span>
            <br />
            <span className="text-agent">last_focus</span>: <span className="text-text-primary">error_handling</span>
          </div>
        </div>

        <div className="rounded-md border border-dashed border-memory-border bg-memory-bg px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] font-semibold text-memory-text">DocWriterAI · 长期</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="font-mono text-[11px] leading-relaxed">
            <span className="text-agent">projects</span>: <span className="text-text-primary">[api_docs, style_guide]</span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="mt-2 flex items-center justify-between text-[10px] text-text-tertiary">
          <span>总计 {stats.count} 条记忆</span>
          {stats.lastSyncedAt && (
            <span>最近同步: {new Date(stats.lastSyncedAt).toLocaleTimeString()}</span>
          )}
        </div>
      )}
    </section>
  );
}