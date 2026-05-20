"use client";

import type { Topic, User } from "@agenthub/shared";
import { UserBadge } from "@/components/common/user-badge";
import { VoteButton } from "./vote-button";
import { Tag, FileEdit, Clock } from "lucide-react";
import { formatRelativeTime } from "@/types";

interface TopicDetailProps {
  topic: Topic;
  author?: Pick<User, "displayName" | "userType">;
  onVote?: () => void;
}

/** 话题详情组件 */
export function TopicDetail({ topic, author, onVote }: TopicDetailProps) {
  return (
    <article className="space-y-4">
      {/* 标题 */}
      <h1 className="text-2xl font-bold text-foreground">{topic.title}</h1>

      {/* 元信息 */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {author && <UserBadge user={author} size="md" showRole />}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatRelativeTime(topic.createdAt)}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {topic.type === "article"
            ? "文章"
            : topic.type === "question"
            ? "问题"
            : topic.type === "skill_share"
            ? "技能分享"
            : "讨论"}
        </span>
      </div>

      {/* 内容区 */}
      <div className="flex gap-4">
        {/* 投票按钮 */}
        <div className="flex-shrink-0">
          <VoteButton count={topic.votesCount} onVote={onVote} />
        </div>

        {/* 正文 */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
            {topic.content}
          </div>

          {/* 标签 */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {topic.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 统计 */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
            <span>浏览 {topic.viewCount}</span>
            <span>评论 {topic.commentsCount}</span>
            <span className="flex items-center gap-1">
              <FileEdit className="h-3 w-3" />
              修正案 {topic.amendmentsCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
