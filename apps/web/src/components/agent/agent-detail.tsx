"use client";

import { useState } from "react";
import { X, Key, Bot, Plus, Loader2, AlertTriangle, Trash2, Shield } from "lucide-react";
import type { User, McpCredential } from "@agenthub/shared";
import {
  useAgentDetail,
  useMcpCredentials,
  useCreateMcpCredential,
  useRevokeMcpCredential,
} from "@/hooks/use-agents";
import { formatRelativeTime } from "@/types";

interface AgentDetailProps {
  agentId: string;
  onClose: () => void;
}

/** Agent 详情面板（Modal） */
export function AgentDetail({ agentId, onClose }: AgentDetailProps) {
  const { data: agent, isLoading: agentLoading } = useAgentDetail(agentId);
  const { data: credentials, isLoading: credsLoading } = useMcpCredentials(agentId);
  const createCred = useCreateMcpCredential();
  const revokeCred = useRevokeMcpCredential();

  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["memory:read", "topic:read"]);

  const allScopes = ["memory:read", "memory:write", "topic:read", "topic:write"];

  const handleCreateKey = async () => {
    const res = await createCred.mutateAsync({
      agentId,
      scopes: selectedScopes,
    });
    setNewRawKey(res.rawKey);
    setShowCreateKey(false);
  };

  const handleRevokeKey = async (credentialId: string) => {
    await revokeCred.mutateAsync({ agentId, credentialId });
  };

  if (agentLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="flex items-center gap-2 text-white" onClick={(e) => e.stopPropagation()}>
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="rounded-xl bg-background p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-muted-foreground">未找到 Agent 信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-background border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{agent.displayName}</h2>
              <p className="text-xs text-muted-foreground">@{agent.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-secondary p-3">
                <span className="text-muted-foreground">状态</span>
                <p className="font-medium text-foreground mt-0.5">
                  {agent.status === "active" ? "活跃" : agent.status === "suspended" ? "已暂停" : "已停用"}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <span className="text-muted-foreground">类型</span>
                <p className="font-medium text-foreground mt-0.5">
                  {agent.userType === "agent" ? "智能体" : "人类"}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <span className="text-muted-foreground">创建时间</span>
                <p className="font-medium text-foreground mt-0.5">{formatRelativeTime(agent.createdAt)}</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <span className="text-muted-foreground">认证方式</span>
                <p className="font-medium text-foreground mt-0.5">{agent.authMethod}</p>
              </div>
            </div>

            {/* Agent 元数据 */}
            {agent.agentMetadata && (
              <div className="mt-3 rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">元数据</span>
                <div className="mt-1 text-sm text-foreground space-y-0.5">
                  <p>模型: {agent.agentMetadata.model}</p>
                  <p>版本: {agent.agentMetadata.version}</p>
                  {agent.agentMetadata.capabilities.length > 0 && (
                    <p>能力: {agent.agentMetadata.capabilities.join(", ")}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MCP Key 管理 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Key className="h-4 w-4" />
                MCP Key 管理
              </h3>
              {!showCreateKey && (
                <button
                  onClick={() => setShowCreateKey(true)}
                  className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  创建 Key
                </button>
              )}
            </div>

            {/* 新创建的 Key 显示 */}
            {newRawKey && (
              <div className="mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-yellow-600">请立即复制 MCP Key</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      此密钥仅显示一次，关闭后将无法再次查看
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 rounded bg-yellow-500/10 px-3 py-2 text-xs font-mono text-foreground break-all select-all">
                        {newRawKey}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(newRawKey);
                        }}
                        className="shrink-0 rounded-lg bg-yellow-500/20 px-3 py-2 text-xs font-medium text-yellow-600 hover:bg-yellow-500/30 transition-colors"
                      >
                        复制
                      </button>
                    </div>
                    <button
                      onClick={() => setNewRawKey(null)}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      我已复制，关闭提示
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 创建 Key 表单 */}
            {showCreateKey && (
              <div className="mb-3 rounded-lg border border-border bg-secondary p-4">
                <h4 className="text-sm font-medium text-foreground mb-3">选择权限范围</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {allScopes.map((scope) => (
                    <button
                      key={scope}
                      onClick={() =>
                        setSelectedScopes((prev) =>
                          prev.includes(scope)
                            ? prev.filter((s) => s !== scope)
                            : [...prev, scope]
                        )
                      }
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedScopes.includes(scope)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {scope}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateKey}
                    disabled={selectedScopes.length === 0 || createCred.isPending}
                    className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {createCred.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    确认创建
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateKey(false);
                      setSelectedScopes(["memory:read", "topic:read"]);
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    取消
                  </button>
                </div>
                {createCred.error && (
                  <p className="mt-2 text-xs text-red-500">
                    {(createCred.error as Error).message || "创建失败"}
                  </p>
                )}
              </div>
            )}

            {/* 凭证列表 */}
            {credsLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载凭证...
              </div>
            ) : credentials && credentials.length > 0 ? (
              <div className="space-y-2">
                {credentials.map((cred: McpCredential) => (
                  <div
                    key={cred.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
                  >
                    <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-foreground">
                          {cred.id.slice(0, 8)}...
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            cred.status === "active"
                              ? "bg-green-500/15 text-green-600"
                              : "bg-gray-500/15 text-gray-500"
                          }`}
                        >
                          {cred.status === "active" ? "有效" : "已撤销"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>范围: {cred.scopes.join(", ")}</span>
                        {cred.expiresAt && <span>过期: {formatRelativeTime(cred.expiresAt)}</span>}
                      </div>
                    </div>
                    {cred.status === "active" && (
                      <button
                        onClick={() => handleRevokeKey(cred.id)}
                        disabled={revokeCred.isPending}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="撤销"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                暂无 MCP Key，点击上方按钮创建
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
