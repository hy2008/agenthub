"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, Plus, X, Loader2 } from "lucide-react";
import { useAgents, useUpdateAgentStatus, useMcpCredentials } from "@/hooks/use-agents";
import { AgentCard } from "@/components/agent/agent-card";
import { AgentCreateForm } from "@/components/agent/agent-create-form";
import { AgentDetail } from "@/components/agent/agent-detail";

/** Agent 管理页 */
export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const updateStatus = useUpdateAgentStatus();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [detailAgentId, setDetailAgentId] = useState<string | null>(null);

  // 从 URL 读取 ?id= 参数打开详情
  const searchParams = useSearchParams();
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setDetailAgentId(id);
    }
  }, [searchParams]);

  // 处理暂停/恢复
  const handleToggleStatus = (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    updateStatus.mutate({ id: agentId, status: newStatus });
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-agent" />
          <h1 className="text-2xl font-bold text-foreground">我的智能体</h1>
          {agents && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {agents.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          创建智能体
        </button>
      </div>

      {/* 创建表单 */}
      {showCreateForm && (
        <div className="mb-6">
          <AgentCreateForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* 加载中 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">加载中...</p>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && agents && agents.length === 0 && !showCreateForm && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
          <Bot className="h-10 w-10" />
          <p className="text-sm">暂无智能体</p>
          <p className="text-xs text-muted-foreground/60">
            点击上方按钮创建你的第一个智能体
          </p>
        </div>
      )}

      {/* Agent 列表 */}
      {!isLoading && agents && agents.length > 0 && (
        <div className="space-y-3">
          {agents.map((agent) => (
            <AgentCardWrapper
              key={agent.id}
              agent={agent}
              onToggleStatus={handleToggleStatus}
              onViewDetail={setDetailAgentId}
            />
          ))}
        </div>
      )}

      {/* Agent 详情 Modal */}
      {detailAgentId && (
        <AgentDetail
          agentId={detailAgentId}
          onClose={() => setDetailAgentId(null)}
        />
      )}
    </div>
  );
}

/** 包装 AgentCard，添加 MCP Key 数量查询 */
function AgentCardWrapper({
  agent,
  onToggleStatus,
  onViewDetail,
}: {
  agent: import("@agenthub/shared").User;
  onToggleStatus: (id: string, status: string) => void;
  onViewDetail: (id: string) => void;
}) {
  const { data: credentials } = useMcpCredentials(agent.id);
  const mcpKeyCount = credentials?.filter((c) => c.status === "active").length ?? 0;

  return (
    <AgentCard
      agent={agent}
      mcpKeyCount={mcpKeyCount}
      onToggleStatus={onToggleStatus}
      onViewDetail={onViewDetail}
    />
  );
}
