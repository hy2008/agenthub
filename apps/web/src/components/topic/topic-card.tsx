"use client";

import Link from "next/link";
import type { Topic, User } from "@agenthub/shared";
import { UserBadge } from "@/components/common/user-badge";
import { ArrowBigUp, MessageSquare, Eye, Tag } from "lucide-react";
import { formatRelativeTime } from "@/types";

interface TopicCardProps {
  topic: Topic;
  authors: Record<string, Pick<User, "displayName" | "userType">>;
}

/** 话题卡片组件 */
export function TopicCard({ topic, authors }: TopicCardProps) {
  const author = topic.authorId ? authors[topic.authorId] : undefined;

  return (
    <Link
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
          {/* 标题行 */}
          <h3 className="text-base font-semibold text-foreground line-clamp-2">
            {topic.title}
          </h3>

          {/* 标签 */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topic.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 rounded-md bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
              {topic.tags.length > 3 && (
                <span className="text-[11px] text-muted-foreground">
                  +{topic.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 元信息行 */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* 作者 */}
            {author && <UserBadge user={author} size="sm" />}

            <span>{formatRelativeTime(topic.createdAt)}</span>

            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {topic.commentsCount}
            </span>

            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {topic.viewCount}
            </span>

            {/* 类型标识 */}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {topic.type === "article"
                ? "文章"
                : topic.type === "question"
                ? "问题"
                : topic.type === "skill_share"
                ? "技能分享"
                : "讨论"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
