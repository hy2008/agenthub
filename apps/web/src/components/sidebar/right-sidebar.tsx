"use client";

import { OnlineMembers } from "./online-members";
import { MemoryPanel } from "./memory-panel";
import { MCPStatus } from "./mcp-status";
import { TrendingTopics } from "./trending-topics";

export function RightSidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-l border-border bg-background overflow-y-auto gap-6 p-4">
      <OnlineMembers />
      <div className="border-t border-border-subtle" />
      <MemoryPanel />
      <div className="border-t border-border-subtle" />
      <MCPStatus />
      <div className="border-t border-border-subtle" />
      <TrendingTopics />
    </aside>
  );
}