"use client";

import { useState } from "react";
import type { Comment, User } from "@agenthub/shared";
import { UserBadge } from "@/components/common/user-badge";
import { Loading } from "@/components/common/loading";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCreateComment } from "@/hooks/use-comments";
import { Send, MessageSquare, Heart, Reply } from "lucide-react";
import { formatRelativeTime } from "@/types";
import { cn } from "@/lib/utils";

interface CommentListProps {
  comments: Comment[];
  authors: Record<string, Pick<User, "displayName" | "userType">>;
  topicId: string;
  isLoading: boolean;
}

export function CommentList({ comments, authors, topicId, isLoading }: CommentListProps) {
  const { isAuthenticated, user } = useCurrentUser();
  const createCommentMutation = useCreateComment();
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate(
      { topicId, data: { content: newComment.trim() } },
      { onSuccess: () => setNewComment("") }
    );
  };

  const toggleLike = (commentId: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  if (isLoading) return <Loading text="加载评论中..." />;

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <MessageSquare className="h-4 w-4" />
          评论 ({comments.length})
        </h3>
      </div>

      {isAuthenticated && (
        <div className="px-6 py-4 border-b border-border-subtle">
          <div className="flex gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                user?.userType === "agent"
                  ? "bg-agent-soft border-2 border-agent"
                  : "bg-human-soft border-2 border-human"
              )}
            >
              {user?.userType === "agent" ? (
                <span className="text-sm">🤖</span>
              ) : (
                <span className="text-xs font-bold text-human-text">
                  {user?.displayName?.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full min-h-[72px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-y outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-tertiary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-tertiary">Ctrl + Enter 发送</span>
                <button
                  onClick={handleSubmit}
                  disabled={createCommentMutation.isPending || !newComment.trim()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-all",
                    newComment.trim()
                      ? "bg-primary text-text-inverse hover:bg-primary-hover hover:-translate-y-px hover:shadow-raised"
                      : "bg-surface text-text-tertiary cursor-not-allowed"
                  )}
                >
                  <Send className="h-3 w-3" />
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-center text-sm text-text-tertiary py-12">暂无评论，来发布第一条吧</p>
      ) : (
        <div className="px-6 py-2 divide-y divide-border-subtle">
          {comments.map((comment) => {
            const author = comment.authorId ? authors[comment.authorId] : undefined;
            const isAgent = author?.userType === "agent";
            const isLiked = likedComments.has(comment.id);

            return (
              <div key={comment.id} className="flex gap-3 py-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                    isAgent
                      ? "bg-agent-soft border-2 border-agent"
                      : "bg-human-soft border-2 border-human"
                  )}
                >
                  {isAgent ? (
                    <span className="text-sm">🤖</span>
                  ) : (
                    <span className="text-xs font-bold text-human-text">
                      {author?.displayName?.charAt(0) || "?"}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {author && (
                      <UserBadge user={author} size="sm" />
                    )}
                    <span className="text-xs text-text-tertiary ml-auto">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => toggleLike(comment.id)}
                      className={cn(
                        "flex items-center gap-1 text-[11px] font-medium transition-colors",
                        isLiked
                          ? "text-danger"
                          : "text-text-tertiary hover:text-danger"
                      )}
                    >
                      <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                      赞
                    </button>
                    <button className="flex items-center gap-1 text-[11px] font-medium text-text-tertiary hover:text-text-secondary transition-colors">
                      <Reply className="h-3 w-3" />
                      回复
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}