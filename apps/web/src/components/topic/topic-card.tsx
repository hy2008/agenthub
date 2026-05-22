"use client";

import Link from "next/link";
import type { Topic, User } from "@agenthub/shared";
import { UserBadge } from "@/components/common/user-badge";
import { ArrowBigUp, MessageSquare, Eye, Pin } from "lucide-react";
import { formatRelativeTime } from "@/types";
import { useVoteTopic } from "@/hooks/use-topics";

const tagColorMap: Record<string, string> = {
  mcp: "bg-agent-soft text-agent-text",
  agent: "bg-agent-soft text-agent-text",
  memory: "bg-warning-50 text-warning-text",
  memory_engine: "bg-warning-50 text-warning-text",
  amendment: "bg-success-50 text-success-text",
  knowledge: "bg-success-50 text-success-text",
  api: "bg-info-50 text-info-text",
  sdk: "bg-info-50 text-info-text",
  security: "bg-danger-50 text-danger-text",
  design: "bg-human-soft text-human-text",
  human: "bg-human-soft text-human-text",
  protocol: "bg-primary-50 text-primary",
  community: "bg-primary-50 text-primary",
  tutorial: "bg-tech-50 text-tech",
  guide: "bg-tech-50 text-tech",
};

const tagIcons: Record<string, string> = {
  mcp: "🔌",
  agent: "🤖",
  memory: "🧠",
  memory_engine: "🧠",
  amendment: "📝",
  knowledge: "📚",
  api: "⚡",
  sdk: "📦",
  security: "🔒",
  design: "🎨",
  human: "👤",
  protocol: "📡",
  community: "💬",
  tutorial: "📖",
  guide: "📖",
};

interface TopicCardProps {
  topic: Topic;
  authors: Record<string, Pick<User, "displayName" | "userType">>;
}

function getTagStyle(tag: string): string {
  const key = tag.toLowerCase().replace(/\s+/g, "_");
  return tagColorMap[key] || "bg-surface text-text-secondary";
}

function getTagIcon(tag: string): string {
  const key = tag.toLowerCase().replace(/\s+/g, "_");
  return tagIcons[key] || "";
}

export function TopicCard({ topic, authors }: TopicCardProps) {
  const author = topic.authorId ? authors[topic.authorId] : undefined;
  const voteMutation = useVoteTopic();

  return (
    <Link
      href={`/topics/${topic.id}`}
      className="block group"
    >
      <article className="rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-raised hover:bg-surface/50 group-hover:-translate-y-px">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-0.5 min-w-[3rem] pt-0.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                voteMutation.mutate(topic.id);
              }}
              className="rounded-md p-1 text-text-tertiary hover:text-primary hover:bg-primary-50 transition-colors"
              aria-label="投票"
            >
              <ArrowBigUp className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {topic.votesCount}
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-2">
              {topic.isLocked && (
                <span className="inline-flex items-center gap-0.5 shrink-0 rounded-full bg-warning-50 border border-warning/30 px-2 py-0.5 text-[10px] font-bold text-warning-text">
                  <Pin className="h-2.5 w-2.5" />
                  已锁定
                </span>
              )}
              <h3 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                {topic.title}
              </h3>
            </div>

            {topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topic.tags.slice(0, 4).map((tag) => {
                  const icon = getTagIcon(tag);
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getTagStyle(tag)}`}
                    >
                      {icon && <span className="text-[10px]">{icon}</span>}
                      {tag}
                    </span>
                  );
                })}
                {topic.tags.length > 4 && (
                  <span className="text-[11px] text-text-tertiary self-center">
                    +{topic.tags.length - 4}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
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
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary">
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
      </article>
    </Link>
  );
}