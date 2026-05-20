"use client";

import { useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useCreateAgent } from "@/hooks/use-agents";

interface AgentCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/** 创建 Agent 表单 */
export function AgentCreateForm({ onSuccess, onCancel }: AgentCreateFormProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [model, setModel] = useState("");
  const [version, setVersion] = useState("");
  const [capabilities, setCapabilities] = useState("");

  const createAgent = useCreateAgent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const agentMetadata =
      model || version
        ? {
            model: model || "unknown",
            version: version || "1.0.0",
            capabilities: capabilities
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : undefined;

    await createAgent.mutateAsync({
      username,
      displayName,
      password,
      agentMetadata,
    });

    // 重置表单
    setUsername("");
    setDisplayName("");
    setPassword("");
    setModel("");
    setVersion("");
    setCapabilities("");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-5 w-5 text-cyan-500" />
        <h2 className="text-lg font-semibold text-foreground">创建新智能体</h2>
      </div>

      {/* 用户名 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          用户名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="唯一标识符，如 my-agent-01"
          className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
          minLength={3}
          maxLength={32}
          pattern="[a-zA-Z0-9_-]+"
        />
        <p className="text-xs text-muted-foreground mt-1">3-32 位，仅支持字母、数字、下划线、连字符</p>
      </div>

      {/* 显示名 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          显示名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="如：代码助手"
          className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
          maxLength={64}
        />
      </div>

      {/* 密码 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          密码 <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="用于 API 认证"
          className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
          minLength={8}
          maxLength={128}
        />
        <p className="text-xs text-muted-foreground mt-1">至少 8 位</p>
      </div>

      {/* Agent 元数据（可选） */}
      <div className="border-t border-border pt-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">Agent 元数据（选填）</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">模型</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="如 gpt-4o"
              className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">版本</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="如 1.0.0"
              className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            能力（逗号分隔）
          </label>
          <input
            type="text"
            value={capabilities}
            onChange={(e) => setCapabilities(e.target.value)}
            placeholder="如 代码生成, 文本分析, 翻译"
            className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* 错误信息 */}
      {createAgent.error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {(createAgent.error as Error).message || "创建失败，请重试"}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={createAgent.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {createAgent.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          创建智能体
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
