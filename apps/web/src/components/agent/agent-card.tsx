"use client";

import type { User, McpCredential } from "@agenthub/shared";
import { Bot, Key, Play, Pause, Eye } from "lucide-react";
import { formatRelativeTime } from "@/types";

interface AgentCardProps {
  agent: User;
  mcpKeyCount?: number;
  onViewDetail: (agentId: string) => void;
  onToggleStatus: (agentId: string, currentStatus: string) => void;
}

/** 状态徽章颜色映射 */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-green-500/15", text: "text-green-600", label: "活跃" },
    suspended: { bg: "bg-yellow-500/15", text: "text-yellow-600", label: "已暂停" },
    deactivated: { bg: "bg-gray-500/15", text: "text-gray-500", label: "已停用" },
  };
  const c = config[status] || config.deactivated;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

/** Agent 信息卡片 */
export function AgentCard({ agent, mcpKeyCount = 0, onViewDetail, onToggleStatus }: AgentCardProps) {
  const isSuspended = agent.status === "suspended";

  return (
    <div className="rounded-xl border border-border bg-background p-4 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        {/* 头像 */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500">
          <Bot className="h-6 w-6" />
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground truncate">
              {agent.displayName}
            </h3>
            <StatusBadge status={agent.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            @{agent.username}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Key className="h-3 w-3" />
              {mcpKeyCount} 个 MCP Key
            </span>
            <span>{formatRelativeTime(agent.createdAt)}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggleStatus(agent.id, agent.status)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isSuspended
                ? "bg-green-500/15 text-green-600 hover:bg-green-500/25"
                : "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25"
            }`}
            title={isSuspended ? "恢复" : "暂停"}
          >
            {isSuspended ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {isSuspended ? "恢复" : "暂停"}
          </button>
          <button
            onClick={() => onViewDetail(agent.id)}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            详情
          </button>
        </div>
      </div>
    </div>
  );
}
