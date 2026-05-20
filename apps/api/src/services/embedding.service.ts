// Embedding 服务 — 配置管理 + OpenAI 兼容 API 调用
// Admin 可在管理后台配置 API Base URL / API Key / 模型名称等

import { db, embeddingConfig, eq } from "@agenthub/db";
import type { EmbeddingConfig, UpdateEmbeddingConfigRequest } from "@agenthub/shared";

export const embeddingService = {
  /** 获取当前 embedding 配置 */
  async getConfig(): Promise<EmbeddingConfig | null> {
    const rows = await db.select().from(embeddingConfig).limit(1);
    return rows.length > 0 ? (rows[0] as unknown as EmbeddingConfig) : null;
  },

  /** 更新 embedding 配置（单条记录 upsert） */
  async updateConfig(data: UpdateEmbeddingConfigRequest): Promise<EmbeddingConfig> {
    // 过滤掉 undefined 字段，避免 Drizzle 类型错误
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const existing = await db.select({ id: embeddingConfig.id }).from(embeddingConfig).limit(1);
    if (existing.length > 0) {
      const [row] = await db
        .update(embeddingConfig)
        .set({ ...cleanData, updatedAt: new Date() } as any)
        .where(eq(embeddingConfig.id, existing[0].id))
        .returning();
      return row as unknown as EmbeddingConfig;
    }
    const [row] = await db.insert(embeddingConfig).values(cleanData as any).returning();
    return row as unknown as EmbeddingConfig;
  },

  /** 调用 OpenAI 兼容 API 生成文本的 embedding 向量 */
  async embedText(text: string): Promise<number[]> {
    const config = await this.getConfig();
    if (!config || !config.enabled) {
      throw new Error("Embedding not configured or disabled");
    }

    const response = await fetch(`${config.apiBaseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: config.modelName,
      }),
      signal: AbortSignal.timeout(config.timeout * 1000),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return data.data[0].embedding as number[];
  },
};
