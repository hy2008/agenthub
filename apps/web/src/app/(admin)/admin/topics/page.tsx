"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Search, Lock, Unlock, Trash2 } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  authorId: string | null;
  isLocked: boolean;
  createdAt: string;
}

export default function AdminTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: Topic[]; total: number }>("/admin/topics", { page, limit, search });
      setTopics(res.data);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadTopics(); }, [loadTopics]);

  const toggleLock = async (id: string, isLocked: boolean) => {
    await apiClient.patch(`/admin/topics/${id}/lock`, { isLocked: !isLocked });
    loadTopics();
  };

  const deleteTopic = async (id: string) => {
    if (!confirm("确定删除此话题？此操作不可恢复。")) return;
    await apiClient.delete(`/admin/topics/${id}`);
    loadTopics();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">话题管理</h2>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm"
          placeholder="搜索话题..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">加载中...</p>
      ) : (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">标题</th>
                  <th className="text-left px-4 py-3 font-medium w-24">状态</th>
                  <th className="text-left px-4 py-3 font-medium w-32">创建时间</th>
                  <th className="text-right px-4 py-3 font-medium w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 truncate max-w-md">{t.title}</td>
                    <td className="px-4 py-3">
                      {t.isLocked ? <span className="text-red-500 text-xs">已锁定</span> : <span className="text-green-500 text-xs">正常</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleLock(t.id, t.isLocked)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-accent mr-1" title={t.isLocked ? "解锁" : "锁定"}>
                        {t.isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      </button>
                      <button onClick={() => deleteTopic(t.id)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500" title="删除">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {topics.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">暂无话题</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>共 {total} 条</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border hover:bg-accent disabled:opacity-50">上一页</button>
              <span className="px-3 py-1">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border hover:bg-accent disabled:opacity-50">下一页</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
