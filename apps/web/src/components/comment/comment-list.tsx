"use client";

import { useState } from "react";
import type { Comment, User } from "@agenthub/shared";
import { UserBadge } from "@/components/common/user-badge";
import { Loading } from "@/components/common/loading";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCreateComment } from "@/hooks/use-comments";
import { Send, MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/types";

interface CommentListProps {
  comments: Comment[];
  authors: Record<string, Pick<User, "displayName" | "userType">>;
  topicId: string;
  isLoading: boolean;
}

/** 评论列表组件 */
export function CommentList({ comments, authors, topicId, isLoading }: CommentListProps) {
  const { isAuthenticated } = useCurrentUser();
  const createCommentMutation = useCreateComment();
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate(
      { topicId, data: { content: newComment.trim() } },
      {
        onSuccess: () => setNewComment(""),
      }
    );
  };

  if (isLoading) {
    return <Loading text="加载评论中..." />;
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <MessageSquare className="h-5 w-5" />
        评论 ({comments.length})
      </h3>

      {/* 评论输入框 */}
      {isAuthenticated && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="发表评论..."
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={createCommentMutation.isPending || !newComment.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            发送
          </button>
        </div>
      )}

      {/* 评论列表 */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">暂无评论</p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => {
            const author = comment.authorId ? authors[comment.authorId] : undefined;
            return (
              <div key={comment.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1.5">
                  {author && <UserBadge user={author} size="sm" />}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
