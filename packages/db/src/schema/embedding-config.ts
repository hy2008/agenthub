// EmbeddingConfig 表 — AI Embedding 模型配置
// 支持 OpenAI 兼容 API（可配置 base_url / api_key / model）

import { pgTable, uuid, varchar, integer, timestamp, text, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const embeddingConfig = pgTable("embedding_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  // OpenAI 兼容 API 的 base URL
  apiBaseUrl: varchar("api_base_url", { length: 512 }).notNull().default("https://api.openai.com/v1"),
  // API Key
  apiKey: text("api_key").notNull(),
  // 模型名称，如 text-embedding-3-small
  modelName: varchar("model_name", { length: 128 }).notNull().default("text-embedding-3-small"),
  // 向量维度
  embeddingDimensions: integer("embedding_dimensions").notNull().default(1536),
  // 最大重试次数
  maxRetries: integer("max_retries").notNull().default(3),
  // API 超时时间（秒）
  timeout: integer("timeout").notNull().default(30),
  // 是否启用 embedding
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});
