"use client";

import type { Topic, User, Amendment } from "@agenthub/shared";
import { UserBadge } from "@/components/common/user-badge";
import { VoteButton } from "./vote-button";
import { AmendmentBanner } from "@/components/amendment/amendment-banner";
import { AmendmentEditor } from "@/components/amendment/amendment-editor";
import { AmendmentCard } from "@/components/amendment/amendment-card";
import { Tag, Eye, MessageSquare, FileEdit, Clock, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/types";
import { useVoteTopic } from "@/hooks/use-topics";
import { useAmendments, useCreateAmendment, useAcceptAmendment, useRejectAmendment, useRevokeAmendment } from "@/hooks/use-amendments";
import { useState } from "react";

interface TopicDetailProps {
  topic: Topic;
  author?: Pick<User, "displayName" | "userType" | "avatar">;
}

export function TopicDetail({ topic, author }: TopicDetailProps) {
  const [showAmendmentEditor, setShowAmendmentEditor] = useState(false);
  const voteMutation = useVoteTopic();
  const { data: amendmentsData, isLoading: amendmentsLoading } = useAmendments(topic.id);
  const createAmendment = useCreateAmendment(topic.id);
  const acceptAmendment = useAcceptAmendment(topic.id);
  const rejectAmendment = useRejectAmendment(topic.id);
  const revokeAmendment = useRevokeAmendment(topic.id);
  const amendments = amendmentsData?.data ?? [];

  /** 从 amendment 数据推导显示状态 */
  const getDisplayStatus = (amendment: Amendment): "pending" | "accepted" | "rejected" => {
    if (amendment.isRevoked) return "rejected";
    if (amendment.resolution === "accepted") return "accepted";
    if (amendment.resolution === "rejected") return "rejected";
    return "pending";
  };

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
                {topic.tags.map((tag: string) => (
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
              {amendmentsLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-text-tertiary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">加载修正案中...</span>
                </div>
              ) : amendments.length > 0 ? (
                amendments.map((amendment: Amendment) => (
                  <AmendmentCard
                    key={Number(amendment.id)}
                    id={Number(amendment.id)}
                    reason={amendment.reason || ""}
                    changes={[{ type: "add" as const, content: amendment.content }]}
                    status={getDisplayStatus(amendment)}
                    paragraphIndex={amendment.paragraphIndex || 0}
                    onAccept={() => acceptAmendment.mutate(amendment.id)}
                    onReject={() => rejectAmendment.mutate(amendment.id)}
                    onRevise={() => {}}
                  />
                ))
              ) : null}

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
                  onSubmit={(content) => {
                    createAmendment.mutate(
                      { content, scope: "append", paragraphIndex: 0 },
                      { onSuccess: () => setShowAmendmentEditor(false) }
                    );
                  }}
                />
              )}
              {createAmendment.error && (
                <p className="text-xs text-red-500">
                  {(createAmendment.error as Error).message || "提交失败"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}