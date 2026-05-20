// 向量搜索层 — Qdrant 集成
// 提供 Qdrant 客户端连接、集合管理、向量 upsert/search/delete

// ==================== 类型定义 ====================

export interface VectorConfig {
  url: string;
  apiKey?: string;
  collectionName?: string;
  dimension?: number;
}

export interface VectorPoint {
  id: string;
  vector: number[];
  payload?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
}

export interface CollectionInfo {
  name: string;
  vectorCount: number;
  dimension: number;
  status: string;
}

// ==================== Qdrant 客户端 ====================

/**
 * Qdrant HTTP 客户端 — 轻量级实现，不依赖官方 SDK
 * 通过 REST API 直接与 Qdrant 交互
 */
export class QdrantClient {
  private baseUrl: string;
  private apiKey?: string;
  private headers: Record<string, string>;

  constructor(config: VectorConfig) {
    this.baseUrl = config.url.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.headers = {
      "Content-Type": "application/json",
      ...(this.apiKey ? { "api-key": this.apiKey } : {}),
    };
  }

  /** 通用请求方法 */
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Qdrant request failed: ${response.status} ${text}`);
    }

    return response.json() as Promise<T>;
  }

  /** 健康检查 */
  async health(): Promise<{ status: string }> {
    return this.request("GET", "/healthz");
  }

  /** 列出所有集合 */
  async listCollections(): Promise<Array<{ name: string }>> {
    const result = await this.request<{ collections: Array<{ name: string }> }>("GET", "/collections");
    return result.collections;
  }

  /** 创建集合 */
  async createCollection(name: string, dimension: number): Promise<void> {
    await this.request("PUT", `/collections/${name}`, {
      vectors: {
        size: dimension,
        distance: "Cosine",
      },
    });
  }

  /** 删除集合 */
  async deleteCollection(name: string): Promise<void> {
    await this.request("DELETE", `/collections/${name}`);
  }

  /** 获取集合信息 */
  async getCollectionInfo(name: string): Promise<CollectionInfo> {
    const result = await this.request<{
      result: {
        status: string;
        vectors_count: number;
        config: { params: { vectors: { size: number } } };
      };
    }>("GET", `/collections/${name}`);
    return {
      name,
      vectorCount: result.result.vectors_count,
      dimension: result.result.config.params.vectors.size,
      status: result.result.status,
    };
  }

  /** 批量 upsert 向量 */
  async upsert(collectionName: string, points: VectorPoint[]): Promise<void> {
    await this.request("PUT", `/collections/${collectionName}/points`, {
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload || {},
      })),
    });
  }

  /** 搜索向量 */
  async search(
    collectionName: string,
    vector: number[],
    options?: { limit?: number; filter?: Record<string, unknown> }
  ): Promise<SearchResult[]> {
    const result = await this.request<{
      result: Array<{ id: string; score: number; payload?: Record<string, unknown> }>;
    }>("POST", `/collections/${collectionName}/points/search`, {
      vector,
      limit: options?.limit || 10,
      filter: options?.filter,
      with_payload: true,
    });
    return result.result.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload,
    }));
  }

  /** 删除向量 */
  async deletePoints(collectionName: string, ids: string[]): Promise<void> {
    await this.request("POST", `/collections/${collectionName}/points/delete`, {
      points: ids,
    });
  }
}

// ==================== 默认集合名 ====================

export const DEFAULT_COLLECTION = "agenthub_memories";
export const DEFAULT_DIMENSION = 1536; // OpenAI ada-002 维度

// ==================== 向量服务 ====================

let clientInstance: QdrantClient | null = null;

/**
 * 获取 Qdrant 客户端单例
 */
export function getVectorClient(config?: VectorConfig): QdrantClient {
  if (!clientInstance) {
    const url = config?.url || process.env.QDRANT_URL || "http://localhost:6333";
    const apiKey = config?.apiKey || process.env.QDRANT_API_KEY || undefined;
    clientInstance = new QdrantClient({ url, apiKey });
  }
  return clientInstance;
}

/**
 * 初始化集合（如不存在则创建）
 */
export async function ensureCollection(
  client: QdrantClient,
  name: string = DEFAULT_COLLECTION,
  dimension: number = DEFAULT_DIMENSION
): Promise<void> {
  const collections = await client.listCollections();
  const exists = collections.some((c) => c.name === name);
  if (!exists) {
    await client.createCollection(name, dimension);
  }
}

// ==================== 统一导出 ====================

export const VectorService = {
  QdrantClient,
  getVectorClient,
  ensureCollection,
  DEFAULT_COLLECTION,
  DEFAULT_DIMENSION,
};

export default VectorService;
