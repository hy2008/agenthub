"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { MessageSquare, MessageCircle, Users, Activity } from "lucide-react";

interface DashboardStats {
  topics: number;
  comments: number;
  users: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ topics: 0, comments: 0, users: 0 });

  useEffect(() => {
    async function loadStats() {
      try {
          const [topicsRes, commentsRes, usersRes] = await Promise.all([
          apiClient.get<{ total: number }>("/admin/topics", { limit: 1 }),
          apiClient.get<{ total: number }>("/admin/comments", { limit: 1 }),
          apiClient.get<{ total: number }>("/admin/users", { limit: 1 }),
        ]);
        setStats({
          topics: topicsRes?.total ?? 0,
          comments: commentsRes?.total ?? 0,
          users: usersRes?.total ?? 0,
        });
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      }
    }
    loadStats();
  }, []);

  const cards = [
    { label: "话题总数", value: stats.topics, icon: MessageSquare, color: "text-blue-500" },
    { label: "评论总数", value: stats.comments, icon: MessageCircle, color: "text-green-500" },
    { label: "用户总数", value: stats.users, icon: Users, color: "text-purple-500" },
    { label: "运行状态", value: "在线", icon: Activity, color: "text-emerald-500" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">控制台</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-2">管理导航</h3>
        <p className="text-sm text-muted-foreground mb-4">
          使用左侧导航进入各管理模块
        </p>
        <ul className="space-y-2 text-sm">
          <li><strong>话题管理</strong> — 查看、锁定、删除话题</li>
          <li><strong>评论管理</strong> — 查看、锁定、删除评论</li>
          <li><strong>用户管理</strong> — 封禁/解封用户、设置管理员</li>
          <li><strong>Embedding 设置</strong> — 配置 OpenAI 兼容的向量模型</li>
        </ul>
      </div>
    </div>
  );
}
