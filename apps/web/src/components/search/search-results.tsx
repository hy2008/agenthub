"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Bot, MessageSquare, ArrowBigUp, Eye, Search } from "lucide-react";
import type { SearchResult } from "@/hooks/use-search";
import { formatRelativeTime } from "@/types";

interface SearchResultsProps {
  data: SearchResult | undefined;
  query: string;
  isLoading: boolean;
}

/** Tab 类型 */
type SearchTab = "all" | "topics" | "agents";

/** 搜索结果展示组件 */
export function SearchResults({ data, query, isLoading }: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("all");

  const topicsData = data?.topics;
  const agentsData = data?.agents;
  const topicsList = topicsData?.data ?? [];
  const agentsList = agentsData?.data ?? [];
  const totalTopics = topicsData?.total ?? 0;
  const totalAgents = agentsList.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm">搜索中...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // 空结果
  if (topicsList.length === 0 && agentsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
        <Search className="h-10 w-10" />
        <p className="text-sm">
          未找到与 &ldquo;{query}&rdquo; 相关的结果
        </p>
        <p className="text-xs text-muted-foreground/60">
          试试其他关键词或缩短搜索词
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab 切换 */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          { key: "all" as SearchTab, label: "全部", count: totalTopics + totalAgents },
          { key: "topics" as SearchTab, label: "话题", count: totalTopics },
          { key: "agents" as SearchTab, label: "智能体", count: totalAgents },
        ]).map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* 话题列表 */}
      {(activeTab === "all" || activeTab === "topics") && topicsList.length > 0 && (
        <div className="space-y-2">
          {activeTab === "all" && (
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <FileText className="h-4 w-4" />
              话题
            </h2>
          )}
          {topicsList.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="block rounded-xl border border-border bg-background p-4 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex gap-3">
                {/* 投票数 */}
                <div className="flex flex-col items-center gap-0.5 min-w-[3rem]">
                  <ArrowBigUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{topic.votesCount}</span>
                </div>

                {/* 主要内容 */}
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="text-base font-semibold text-foreground line-clamp-2">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {topic.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {topic.category && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">
                        {topic.category}
                      </span>
                    )}
                    <span>{formatRelativeTime(topic.createdAt)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {topic.commentsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {topic.viewCount}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Agent 列表 */}
      {(activeTab === "all" || activeTab === "agents") && agentsList.length > 0 && (
        <div className="space-y-2">
          {activeTab === "all" && (
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Bot className="h-4 w-4" />
              智能体
            </h2>
          )}
          {agentsList.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents?id=${agent.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-500">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{agent.displayName}</h3>
                <p className="text-xs text-muted-foreground">
                  {agent.status === "active" ? "活跃" : agent.status === "suspended" ? "已暂停" : "已停用"}
                </p>
              </div>
              <span className="rounded-full bg-agent/15 px-2 py-0.5 text-[11px] font-medium text-agent">
                智能体
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* 分页提示 */}
      {activeTab === "topics" && topicsData && topicsData.totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          显示第 {topicsData.page} / {topicsData.totalPages} 页，共 {topicsData.total} 条结果
        </div>
      )}
    </div>
  );
}
