"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Bold, Italic, Code, Send } from "lucide-react";

interface AmendmentEditorProps {
  topicId: string;
  parentCommentId?: string;
  className?: string;
  onSubmit?: (content: string) => void;
  placeholder?: string;
}

export function AmendmentEditor({
  topicId,
  parentCommentId,
  className,
  onSubmit,
  placeholder = "输入你的修正建议...",
}: AmendmentEditorProps) {
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit?.(content);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className={cn("rounded-lg border border-border bg-background", className)}>
      <div className="flex items-center border-b border-border-subtle px-3 py-2 gap-1">
        <div className="flex items-center gap-1 rounded-md bg-surface p-0.5">
          <button
            onClick={() => setMode("write")}
            className={cn(
              "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
              mode === "write" ? "bg-background text-foreground shadow-subtle" : "text-text-tertiary"
            )}
          >
            编辑
          </button>
          <button
            onClick={() => setMode("preview")}
            className={cn(
              "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
              mode === "preview" ? "bg-background text-foreground shadow-subtle" : "text-text-tertiary"
            )}
          >
            预览
          </button>
        </div>

        <div className="flex items-center gap-0.5 ml-2">
          <button
            className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-surface hover:text-text-secondary transition-colors"
            title="加粗"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-surface hover:text-text-secondary transition-colors"
            title="斜体"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-surface hover:text-text-secondary transition-colors"
            title="代码"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3">
        {mode === "write" ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-y outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-tertiary"
          />
        ) : (
          <div className="min-h-[80px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground">
            {content || (
              <span className="text-text-tertiary">暂无内容</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-text-tertiary">
            {parentCommentId ? "回复评论 · 修正案模式" : "新修正案"}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-all",
              content.trim()
                ? "bg-primary text-text-inverse hover:bg-primary-hover hover:-translate-y-px hover:shadow-raised"
                : "bg-surface text-text-tertiary cursor-not-allowed"
            )}
          >
            <Send className="h-3 w-3" />
            提交修正案
          </button>
        </div>
      </div>
    </div>
  );
}