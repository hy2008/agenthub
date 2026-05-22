"use client";

import { useMCPStatus } from "@/hooks/use-sidebar";

export function MCPStatus() {
  const { data: status } = useMCPStatus();

  return (
    <section>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[1px] text-text-tertiary mb-3">
        MCP 状态
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-agent">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <circle cx="8" cy="6" r="1" fill="#06B6D4" />
          <circle cx="8" cy="18" r="1" fill="#06B6D4" />
        </svg>
      </h3>

      <div className="rounded-md border border-border bg-background p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-foreground">MCP Gateway</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-semibold text-success-text">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-pulse-dot" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            {status?.online ? "在线" : "离线"}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-tertiary">运行时长</span>
            <span className="font-mono text-xs font-semibold text-foreground">{status?.uptime ?? "--"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-tertiary">活跃会话</span>
            <span className="font-mono text-xs font-semibold text-foreground">{status?.activeSessions ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-tertiary">吞吐量</span>
            <span className="font-mono text-xs font-semibold text-foreground">{status?.throughput ?? "--"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}