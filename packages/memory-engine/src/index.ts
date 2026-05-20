// 记忆引擎 — 核心模块
// 提供内容 hash 计算、同步比对、差异分析、冲突解决

import { createHash } from "crypto";

// ==================== Hash 计算 ====================

/**
 * 稳定序列化对象（递归按键排序），确保语义相等对象产生相同 hash
 * 支持嵌套对象的 key 排序
 */
function stableStringify(content: Record<string, unknown>): string {
  return JSON.stringify(content, (_key, value) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(value).sort()) {
        sorted[k] = (value as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return value;
  });
}

/**
 * 计算任意内容的 SHA-256 hash
 */
export function computeHash(content: string | Record<string, unknown>): string {
  const str = typeof content === "string" ? content : stableStringify(content);
  return createHash("sha256").update(str).digest("hex");
}

/**
 * 批量计算 hash
 */
export function computeHashes(items: Array<{ id: string; content: string | Record<string, unknown> }>): Map<string, string> {
  const result = new Map<string, string>();
  for (const item of items) {
    result.set(item.id, computeHash(item.content));
  }
  return result;
}

// ==================== 同步比对 ====================

export interface SyncItem {
  id: string;
  contentHash: string;
}

export interface SyncDiff {
  memoryId: string;
  localHash: string;
  remoteHash: string;
  status: "new_local" | "new_remote" | "modified" | "unchanged";
}

/**
 * 同步比对：对比本地与服务端的 hash 列表
 * @param localItems Agent 本地提交的 hash 列表
 * @param remoteItems 服务端存储的 hash 列表
 * @returns 差异列表
 */
export function syncCompare(localItems: SyncItem[], remoteItems: SyncItem[]): SyncDiff[] {
  const remoteMap = new Map(remoteItems.map((item) => [item.id, item.contentHash]));
  const localMap = new Map(localItems.map((item) => [item.id, item.contentHash]));
  const diffs: SyncDiff[] = [];
  const processedIds = new Set<string>();

  // 检查本地项
  for (const local of localItems) {
    processedIds.add(local.id);
    const remoteHash = remoteMap.get(local.id);

    if (!remoteHash) {
      // 服务端不存在此条目
      diffs.push({
        memoryId: local.id,
        localHash: local.contentHash,
        remoteHash: "",
        status: "new_local",
      });
    } else if (remoteHash === local.contentHash) {
      // 一致
      // 不加入 diffs（unchanged 项不需要操作）
    } else {
      // 不一致
      diffs.push({
        memoryId: local.id,
        localHash: local.contentHash,
        remoteHash,
        status: "modified",
      });
    }
  }

  // 检查服务端独有的条目
  for (const remote of remoteItems) {
    if (!processedIds.has(remote.id)) {
      diffs.push({
        memoryId: remote.id,
        localHash: "",
        remoteHash: remote.contentHash,
        status: "new_remote",
      });
    }
  }

  return diffs;
}

// ==================== 差异分析 ====================

export interface DiffDetail {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  type: "added" | "removed" | "changed";
}

/**
 * 对比两个 JSON 对象的字段级差异
 */
export function diffObjects(
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): DiffDetail[] {
  const details: DiffDetail[] = [];
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);

  for (const key of allKeys) {
    const hasLocal = key in local;
    const hasRemote = key in remote;

    if (hasLocal && !hasRemote) {
      details.push({ field: key, localValue: local[key], remoteValue: undefined, type: "removed" });
    } else if (!hasLocal && hasRemote) {
      details.push({ field: key, localValue: undefined, remoteValue: remote[key], type: "added" });
    } else if (JSON.stringify(local[key]) !== JSON.stringify(remote[key])) {
      details.push({ field: key, localValue: local[key], remoteValue: remote[key], type: "changed" });
    }
  }

  return details;
}

// ==================== 冲突解决 ====================

export type ResolveStrategy = "local_first" | "remote_first" | "newest_wins";

export interface ResolveContext {
  localContent: Record<string, unknown>;
  remoteContent: Record<string, unknown>;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
}

/**
 * 根据策略解决冲突，返回应采纳的内容
 */
export function resolveConflict(
  context: ResolveContext,
  strategy: ResolveStrategy
): { content: Record<string, unknown>; source: "local" | "remote" } {
  switch (strategy) {
    case "local_first":
      return { content: context.localContent, source: "local" };
    case "remote_first":
      return { content: context.remoteContent, source: "remote" };
    case "newest_wins":
      return context.localUpdatedAt > context.remoteUpdatedAt
        ? { content: context.localContent, source: "local" }
        : { content: context.remoteContent, source: "remote" };
  }
}

// ==================== 统一导出 ====================

export const MemoryEngine = {
  computeHash,
  computeHashes,
  syncCompare,
  diffObjects,
  resolveConflict,
};

export default MemoryEngine;
