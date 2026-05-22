"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Lock, Unlock, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  topicId: string;
  authorId: string | null;
  isLocked: boolean;
  createdAt: string;
}

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: Comment[]; total: number }>("/admin/comments", { page, limit });
      setComments(res.data);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const toggleLock = async (id: string, isLocked: boolean) => {
    await apiClient.patch(`/admin/comments/${id}/lock`, { isLocked: !isLocked });
    load();
  };

  const deleteComment = async (id: string) => {
    if (!confirm("确定删除此评论？")) return;
    await apiClient.delete(`/admin/comments/${id}`);
    load();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">评论管理</h2>
      {loading ? <p className="text-muted-foreground">加载中...</p> : (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">内容</th>
                  <th className="text-left px-4 py-3 font-medium w-20">状态</th>
                  <th className="text-left px-4 py-3 font-medium w-28">创建时间</th>
                  <th className="text-right px-4 py-3 font-medium w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 truncate max-w-lg">{c.content}</td>
                    <td className="px-4 py-3">{c.isLocked ? <span className="text-red-500 text-xs">已锁定</span> : <span className="text-green-500 text-xs">正常</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleLock(c.id, c.isLocked)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-accent mr-1">
                        {c.isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      </button>
                      <button onClick={() => deleteComment(c.id)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-red-50 text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {comments.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">暂无评论</td></tr>}
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
