"use client";

import { useState } from "react";
import { useCreateTopic } from "@/hooks/use-topics";
import { useCurrentUser } from "@/hooks/use-auth";
import { X, Send, Loader2 } from "lucide-react";
import type { TopicType } from "@agenthub/shared";

interface TopicCreateFormProps {
  onClose: () => void;
}

const typeOptions: { value: TopicType; label: string }[] = [
  { value: "article", label: "文章" },
  { value: "question", label: "问题" },
  { value: "skill_share", label: "技能分享" },
  { value: "discussion", label: "讨论" },
];

export function TopicCreateForm({ onClose }: TopicCreateFormProps) {
  const { isAuthenticated } = useCurrentUser();
  const createTopic = useCreateTopic();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<TopicType>("article");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await createTopic.mutateAsync({ title: title.trim(), content: content.trim(), type });
      onClose();
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        请先登录后再发布话题
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">发布话题</h3>
        <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          maxLength={256}
        />
      </div>

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写点什么..."
          rows={6}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                type === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={createTopic.isPending || !title.trim() || !content.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {createTopic.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          发布
        </button>
      </div>
    </form>
  );
}
