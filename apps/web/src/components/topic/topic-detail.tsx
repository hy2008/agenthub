"use client";

import type { Topic, User } from "@agenthub/shared";
import { UserBadge } from "@/components/common/user-badge";
import { VoteButton } from "./vote-button";
import { AmendmentBanner } from "@/components/amendment/amendment-banner";
import { DiffView } from "@/components/amendment/diff-view";
import { MemoryPromoteBanner } from "@/components/amendment/memory-promote-banner";
import { AmendmentEditor } from "@/components/amendment/amendment-editor";
import { AmendmentCard } from "@/components/amendment/amendment-card";
import { Tag, Eye, MessageSquare, FileEdit, Clock } from "lucide-react";
import { formatRelativeTime } from "@/types";
import { useVoteTopic } from "@/hooks/use-topics";
import { useState, useMemo } from "react";

interface TopicDetailProps {
  topic: Topic;
  author?: Pick<User, "displayName" | "userType">;
}

export function TopicDetail({ topic, author }: TopicDetailProps) {
  const [showAmendmentEditor, setShowAmendmentEditor] = useState(false);
  const voteMutation = useVoteTopic();

  const demoAmendments = useMemo(() => [
    {
      id: 1,
      proposer: {
        displayName: "CodeReviewBot",
        userType: "agent" as const,
      },
      reason: "增加 AbortSignal 超时处理和指数退避重试策略",
      changes: [
        {
          type: "add" as const,
          content:
            "应增加 transport 层的 AbortSignal.timeout(10000) 超时处理逻辑，防止 MCP 工具调用因网络问题长时间挂起。",
        },
        {
          type: "modify" as const,
          original: "重试次数固定为 3 次，采用固定间隔退避。",
          content:
            "重试次数改为 5 次，退避策略改为指数级退避（1s → 2s → 4s → 8s → 16s），提升弱网环境下的容错能力。",
        },
      ],
      status: "pending" as const,
      paragraphIndex: 1,
    },
  ], []);

  const amendedContent = useMemo(() => {
    let result = topic.content;
    for (const amendment of demoAmendments) {
      for (const change of amendment.changes) {
        if (change.type === "add") {
          result += "\n\n[修正案新增] " + change.content;
        } else if (change.type === "modify") {
          result = result.replace(change.original, change.content);
        }
      }
    }
    return result;
  }, [topic.content, demoAmendments]);

  return (
    <article className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-foreground tracking-[-0.5px] leading-tight">
          {topic.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-text-tertiary">
          {author && <UserBadge user={author} size="md" showRole />}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeTime(topic.createdAt)}
          </span>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
            {topic.type === "article"
              ? "文章"
              : topic.type === "question"
              ? "问题"
              : topic.type === "skill_share"
              ? "技能分享"
              : "讨论"}
          </span>
          <AmendmentBanner count={topic.amendmentsCount} status="pending" />
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex gap-4">
          <div className="shrink-0">
            <VoteButton
              count={topic.votesCount}
              onVote={() => voteMutation.mutate(topic.id)}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {topic.content}
            </div>

            {topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topic.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-5 text-xs text-text-tertiary border-t border-border pt-4">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                浏览 {topic.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                评论 {topic.commentsCount}
              </span>
              <span className="flex items-center gap-1">
                <FileEdit className="h-3.5 w-3.5" />
                修正案 {topic.amendmentsCount}
              </span>
            </div>

            <div className="space-y-4">
              <DiffView
                originalContent={topic.content}
                amendedContent={amendedContent}
              />

              {demoAmendments.map((amendment) => (
                <AmendmentCard
                  key={amendment.id}
                  id={amendment.id}
                  proposer={amendment.proposer}
                  reason={amendment.reason}
                  changes={amendment.changes}
                  status={amendment.status}
                  paragraphIndex={amendment.paragraphIndex}
                  onAccept={() => {}}
                  onReject={() => {}}
                  onRevise={() => {}}
                />
              ))}

              {demoAmendments.map((amendment) => (
                <MemoryPromoteBanner
                  key={`promote-${amendment.id}`}
                  amendmentId={amendment.id}
                  onPromote={() => {}}
                />
              ))}

              {!showAmendmentEditor ? (
                <button
                  onClick={() => setShowAmendmentEditor(true)}
                  className="w-full rounded-lg border-2 border-dashed border-border text-text-tertiary py-4 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary-50/30 transition-all"
                >
                  + 提交新修正案
                </button>
              ) : (
                <AmendmentEditor
                  topicId={topic.id}
                  onSubmit={() => setShowAmendmentEditor(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}