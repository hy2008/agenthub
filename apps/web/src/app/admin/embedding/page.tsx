"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Save, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

interface EmbeddingConfig {
  id: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  embeddingDimensions: number;
  maxRetries: number;
  timeout: number;
  enabled: boolean;
}

export default function AdminEmbedding() {
  const [config, setConfig] = useState<EmbeddingConfig>({
    id: "",
    apiBaseUrl: "https://api.openai.com/v1",
    apiKey: "",
    modelName: "text-embedding-3-small",
    embeddingDimensions: 1536,
    maxRetries: 3,
    timeout: 30,
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiClient.get<{ data: EmbeddingConfig | null }>("/admin/embedding-config")
      .then((res) => {
        if (res.data) setConfig({ ...config, ...res.data });
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiClient.put("/admin/embedding-config", config);
      setMessage({ type: "success", text: "Embedding 配置已保存" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "保存失败" });
    }
    finally { setSaving(false); }
  };

  const testConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await apiClient.post<{ ok: boolean; hasModel?: boolean; message: string }>("/admin/embedding/test", {
        apiBaseUrl: config.apiBaseUrl,
        apiKey: config.apiKey,
        modelName: config.modelName,
      });
      setMessage({
        type: res.ok ? "success" : "error",
        text: res.message,
      });
    } catch (e: any) {
      setMessage({ type: "error", text: `连接异常: ${e.message}` });
    }
    finally { setTesting(false); }
  };

  if (!loaded) return <p className="text-muted-foreground">加载中...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Embedding 设置</h2>
      <p className="text-sm text-muted-foreground mb-6">
        配置 AI Embedding 模型，用于记忆的向量化语义搜索。支持任何兼容 OpenAI API 格式的服务（如 OpenAI、Azure OpenAI、本地 Ollama 等）。
      </p>

      <div className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">API Base URL</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={config.apiBaseUrl}
            onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">API Key</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="sk-..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">模型名称</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={config.modelName}
            onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
            placeholder="text-embedding-3-small"
          />
          <p className="text-xs text-muted-foreground mt-1">如 text-embedding-3-small、text-embedding-ada-002 或本地模型名称</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">向量维度</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              type="number"
              value={config.embeddingDimensions}
              onChange={(e) => setConfig({ ...config, embeddingDimensions: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">最大重试</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              type="number"
              value={config.maxRetries}
              onChange={(e) => setConfig({ ...config, maxRetries: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">超时(秒)</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              type="number"
              value={config.timeout}
              onChange={(e) => setConfig({ ...config, timeout: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enabled"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="enabled" className="text-sm">启用 Embedding（关闭后搜索降级为关键词匹配）</label>
        </div>

        {message && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : "保存配置"}
          </button>
          <button
            onClick={testConnection}
            disabled={testing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
            {testing ? "测试中..." : "测试连接"}
          </button>
        </div>
      </div>
    </div>
  );
}
