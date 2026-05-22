"use client";

import { UserBadge } from "@/components/common/user-badge";
import type { User } from "@agenthub/shared";
import { Check, X, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";

interface AmendmentChange {
  type: "add" | "modify" | "delete";
  content: string;
  original?: string;
}

interface AmendmentCardProps {
  id: number;
  proposer?: Pick<User, "displayName" | "userType">;
  reason: string;
  changes: AmendmentChange[];
  status: "pending" | "accepted" | "rejected";
  paragraphIndex?: number;
  className?: string;
  onAccept?: () => void;
  onReject?: () => void;
  onRevise?: () => void;
}

const changeStyles: Record<string, { prefix: string; className: string }> = {
  add: { prefix: "+", className: "bg-success-50 text-success-text" },
  modify: { prefix: "~", className: "bg-warning-50 text-warning-text" },
  delete: { prefix: "-", className: "bg-danger-50 text-danger-text line-through" },
};

export function AmendmentCard({
  id,
  proposer,
  reason,
  changes,
  status,
  paragraphIndex,
  className,
  onAccept,
  onReject,
  onRevise,
}: AmendmentCardProps) {
  return (
    <div
      className={cn(
        "ml-5 border border-amendment-border bg-amendment-bg rounded-md",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 rounded-full bg-amendment-border/50 px-2.5 py-0.5">
            <FileEdit className="h-3 w-3 text-amendment-text" />
            <span className="text-[11px] font-semibold text-amendment-text">修正案 #{id}</span>
          </div>
          {paragraphIndex !== undefined && (
            <span className="text-[11px] text-text-tertiary">段落 {paragraphIndex}</span>
          )}
          {proposer && (
            <div className="ml-auto">
              <UserBadge user={proposer} size="sm" />
            </div>
          )}
        </div>

        {reason && (
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">
            <span className="font-semibold text-foreground">理由：</span>
            {reason}
          </p>
        )}

        <div className="space-y-2">
          {changes.map((change, i) => {
            const style = changeStyles[change.type];
            return (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-5 w-5 rounded-full font-mono text-[10px] font-bold border shrink-0 mt-px",
                    change.type === "add"
                      ? "bg-success-50 text-success-text border-success/30"
                      : change.type === "modify"
                      ? "bg-warning-50 text-warning-text border-warning/30"
                      : "bg-danger-50 text-danger-text border-danger/30"
                  )}
                >
                  {style.prefix}
                </span>
                <div className="flex-1 text-xs leading-relaxed">
                  {change.type === "modify" && change.original && (
                    <span className="line-through text-text-tertiary mr-1 block text-[11px]">
                      {change.original}
                    </span>
                  )}
                  <span className={style.className}>
                    {change.content}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {status === "pending" && onAccept && onReject && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amendment-border/50">
            <button
              onClick={onAccept}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-text-inverse hover:bg-primary-hover transition-colors"
            >
              <Check className="h-3 w-3" />
              接受
            </button>
            {onRevise && (
              <button
                onClick={onRevise}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-surface transition-colors"
              >
                请求修订
              </button>
            )}
            <button
              onClick={onReject}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-[11px] font-semibold text-danger-text hover:bg-danger-50 transition-colors ml-auto"
            >
              <X className="h-3 w-3" />
              撤回
            </button>
          </div>
        )}

        {status === "accepted" && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-amendment-border/50 text-[11px] font-semibold text-success-text">
            <Check className="h-3 w-3" />
            已接受
          </div>
        )}
      </div>
    </div>
  );
}