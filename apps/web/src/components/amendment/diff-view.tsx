"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, GitMerge, Columns } from "lucide-react";

type DiffViewMode = "original" | "diff" | "merged";

interface DiffViewProps {
  originalContent: string;
  amendedContent?: string;
  className?: string;
}

export function DiffView({ originalContent, amendedContent, className }: DiffViewProps) {
  const [mode, setMode] = useState<DiffViewMode>("original");

  const tabs: { key: DiffViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "original", label: "原始内容", icon: <FileText className="h-3.5 w-3.5" /> },
    { key: "diff", label: "差异对比", icon: <Columns className="h-3.5 w-3.5" /> },
    { key: "merged", label: "合并结果", icon: <GitMerge className="h-3.5 w-3.5" /> },
  ];

  const paragraphs = originalContent.split("\n\n").filter(Boolean);
  const amendedParagraphs = amendedContent?.split("\n\n").filter(Boolean) ?? paragraphs;

  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      <div className="flex items-center border-b border-border bg-surface px-3 py-2 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === tab.key
                ? "bg-background text-foreground shadow-subtle"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {mode === "original" && (
          <div className="space-y-3">
            {paragraphs.map((para, i) => (
              <ParagraphBlock key={i} index={i + 1} content={para} />
            ))}
          </div>
        )}

        {mode === "diff" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-tertiary mb-2">原始</div>
              <div className="space-y-2">
                {paragraphs.map((para, i) => (
                  <div key={i} className="text-xs text-text-secondary leading-relaxed bg-surface-raised rounded-md p-3 border border-border">
                    {para}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[1px] text-text-tertiary mb-2">最新版本</div>
              <div className="space-y-2">
                {amendedParagraphs.map((para, i) => {
                  const changed = para !== paragraphs[i];
                  return (
                    <div
                      key={i}
                      className={cn(
                        "text-xs leading-relaxed rounded-md p-3 border",
                        changed
                          ? "bg-amendment-bg border-amendment-border text-foreground"
                          : "bg-surface-raised border-border text-text-secondary"
                      )}
                    >
                      {changed && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amendment-text mb-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amendment-text" />
                          已修改
                        </span>
                      )}
                      {para}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {mode === "merged" && (
          <div className="space-y-3">
            {amendedParagraphs.map((para, i) => (
              <ParagraphBlock key={i} index={i + 1} content={para} highlight />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ParagraphBlock({
  index,
  content,
  highlight,
}: {
  index: number;
  content: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-md p-3 transition-all group",
        highlight
          ? "bg-amendment-bg/50 border border-amendment-border"
      : "bg-surface-raised border-l-[3px] border-l-text-tertiary"
      )}
    >
      <span className="absolute -top-2 -left-2 w-5 h-5 bg-background border border-border rounded-full font-mono text-[9px] font-bold text-text-tertiary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {index}
      </span>
      <p className="text-sm text-text-secondary leading-relaxed">{content}</p>
    </div>
  );
}