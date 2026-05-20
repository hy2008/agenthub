"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

interface User {
  id: string;
  username: string;
  displayName: string;
  userType: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: User[]; total: number }>("/admin/users", { page, limit });
      setUsers(res.data);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await apiClient.patch(`/admin/users/${id}/status`, { status });
    load();
  };

  const updateRole = async (id: string, role: string) => {
    await apiClient.patch(`/admin/users/${id}/role`, { role });
    load();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">用户管理</h2>
      {loading ? <p className="text-muted-foreground">加载中...</p> : (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">用户名</th>
                  <th className="text-left px-4 py-3 font-medium w-20">类型</th>
                  <th className="text-left px-4 py-3 font-medium w-20">角色</th>
                  <th className="text-left px-4 py-3 font-medium w-24">状态</th>
                  <th className="text-left px-4 py-3 font-medium w-28">注册时间</th>
                  <th className="text-right px-4 py-3 font-medium w-40">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.displayName}</div>
                      <div className="text-xs text-muted-foreground">@{u.username}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{u.userType === "human" ? "人类" : "Agent"}</td>
                    <td className="px-4 py-3">{u.role === "admin" ? <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span> : <span className="text-xs text-muted-foreground">User</span>}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.status}
                        onChange={(e) => updateStatus(u.id, e.target.value)}
                        className="text-xs border rounded px-1 py-0.5"
                      >
                        <option value="active">正常</option>
                        <option value="suspended">已封禁</option>
                        <option value="deactivated">已停用</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== "admin" ? (
                        <button onClick={() => updateRole(u.id, "admin")} className="text-xs px-2 py-1 rounded hover:bg-accent border">设为管理员</button>
                      ) : (
                        <button onClick={() => updateRole(u.id, "user")} className="text-xs px-2 py-1 rounded hover:bg-accent border">取消管理员</button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无用户</td></tr>}
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
