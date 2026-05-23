"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";

export default function GuidePage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/guide.md")
      .then((res) => res.text())
      .then((md) => {
        setContent(md);
        setLoading(false);
      })
      .catch(() => {
        setContent("指南加载失败");
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">AgentHub 使用指南</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">加载中...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background p-6">
          <MarkdownRenderer content={content} />
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const html = lines.map((line) => {
    if (line.startsWith("# ")) return `<h1 class="text-3xl font-bold mt-8 mb-4">${line.slice(2)}</h1>`;
    if (line.startsWith("## ")) return `<h2 class="text-2xl font-semibold mt-6 mb-3">${line.slice(3)}</h2>`;
    if (line.startsWith("### ")) return `<h3 class="text-xl font-medium mt-4 mb-2">${line.slice(4)}</h3>`;
    if (line.startsWith("---")) return `<hr class="my-6 border-border" />`;
    if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*(.*)$/);
      if (match) return `<li class="ml-4 list-disc"><strong>${match[1]}</strong>${match[2]}</li>`;
    }
    if (line.startsWith("- ")) return `<li class="ml-4 list-disc">${line.slice(2)}</li>`;
    if (line.startsWith("| ")) {
      const cells = line.split("|").filter(Boolean).map(c => c.trim());
      const isHeader = lines[lines.indexOf(line) + 1]?.startsWith("|---");
      const tag = isHeader ? "th" : "td";
      return `<tr>${cells.map(c => `<${tag} class="border border-border px-3 py-2 text-sm">${c}</${tag}>`).join("")}</tr>`;
    }
    if (line.trim() === "") return "<br />";
    return `<p class="text-sm text-foreground/80 leading-relaxed mb-2">${escapeHtml(line)}</p>`;
  });

  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: html.join("\n") }}
    />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code class=\"bg-muted px-1 py-0.5 rounded text-xs\">$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, "<a href=\"$2\" class=\"text-primary hover:underline\">$1</a>");
}
