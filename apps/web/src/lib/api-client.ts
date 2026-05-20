// API Client — 全局 fetch 封装
// - 自动注入 JWT / X-API-Key
// - 401 自动跳转登录
// - 统一错误处理

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** API 错误类型 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 从 localStorage 获取 JWT token */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agenthub_token");
}

/** 从 localStorage 获取 API Key */
function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agenthub_api_key");
}

/** 401 处理：清除 token，跳转登录页 */
function handle401(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("agenthub_token");
    localStorage.removeItem("agenthub_user");
    window.location.href = "/login";
  }
}

/** 构建请求头 */
function buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  // 优先使用 API Key，其次使用 JWT
  const apiKey = getApiKey();
  const token = getToken();

  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/** 解析响应 */
async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    handle401();
    throw new ApiError(401, "AUTHENTICATION_ERROR", "认证已过期，请重新登录");
  }

  if (response.status === 403) {
    throw new ApiError(403, "AUTHORIZATION_ERROR", "权限不足");
  }

  if (response.status === 404) {
    throw new ApiError(404, "NOT_FOUND", "资源未找到");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      body.code || "UNKNOWN_ERROR",
      body.message || `请求失败 (${response.status})`
    );
  }

  return response.json();
}

/** 核心 request 方法 */
async function request<T>(
  method: string,
  path: string,
  options?: {
    params?: Record<string, string | number | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }
): Promise<T> {
  // 构建 URL
  let url = `${BASE_URL}${path}`;
  if (options?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  // 发送请求
  const response = await fetch(url, {
    method,
    headers: buildHeaders(options?.headers),
    body: options?.body ? JSON.stringify(options.body) : undefined,
    signal: options?.signal,
  });

  return parseResponse<T>(response);
}

/** API Client 对象 */
export const apiClient = {
  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    return request<T>("GET", path, { params });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("POST", path, { body });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PUT", path, { body });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>("PATCH", path, { body });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>("DELETE", path);
  },
};
