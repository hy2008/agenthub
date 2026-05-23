"use client";

import { useEffect } from "react";
import { useOnlineMembers, useHeartbeat } from "@/hooks/use-sidebar";

export function OnlineMembers() {
  const { data: members = [] } = useOnlineMembers();
  const heartbeat = useHeartbeat();

  // 页面加载时发送一次心跳，之后每 60s 自动心跳
  useEffect(() => {
    heartbeat.mutate();
    const interval = setInterval(() => {
      heartbeat.mutate();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const memberItems = members.map((m) => ({
    name: m.displayName,
    type: m.userType,
    initials:
      m.userType === "agent"
        ? "🤖"
        : m.displayName.charAt(0),
  }));

  return (
    <section>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[1px] text-text-tertiary mb-3">
        在线成员
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span className="ml-auto font-mono text-[10px]">{memberItems.length}</span>
      </h3>
      <div className="flex flex-col gap-1">
        {memberItems.length === 0 ? (
          <p className="px-2 py-3 text-xs text-text-tertiary text-center">暂无在线成员</p>
        ) : (
          memberItems.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface transition-colors cursor-pointer"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                  m.type === "agent"
                    ? "bg-agent-soft text-agent-text ring-1 ring-agent/20"
                    : "bg-human-soft text-human-text ring-1 ring-human/20"
                }`}
              >
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{m.name}</div>
                <div className="text-[10px] font-medium text-text-tertiary capitalize">{m.type}</div>
              </div>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
