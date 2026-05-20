"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, FileText, Bot } from "lucide-react";
import { useSearch } from "@/hooks/use-search";

/** 搜索输入框 — 带 debounce + 下拉建议 */
export function SearchInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 搜索查询
  const { data, isLoading } = useSearch({
    q: debouncedQuery,
    type: "all",
    limit: 5,
  });

  // 构建建议列表
  const suggestions: Array<{
    id: string;
    type: "topic" | "agent";
    title: string;
    subtitle?: string;
  }> = [];

  if (data?.topics?.data) {
    for (const topic of data.topics.data) {
      suggestions.push({
        id: topic.id,
        type: "topic",
        title: topic.title,
        subtitle: topic.category || undefined,
      });
    }
  }

  if (data?.agents?.data) {
    for (const agent of data.agents.data) {
      suggestions.push({
        id: agent.id,
        type: "agent",
        title: agent.displayName,
        subtitle: "智能体",
      });
    }
  }

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const item = suggestions[selectedIndex];
          if (item.type === "topic") {
            router.push(`/topics/${item.id}`);
          } else {
            router.push(`/agents?id=${item.id}`);
          }
          setShowDropdown(false);
          setQuery("");
        } else if (query.trim().length >= 2) {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          setShowDropdown(false);
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    },
    [selectedIndex, suggestions, query, router]
  );

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        placeholder="搜索话题、智能体..."
        className="w-full rounded-lg border border-input bg-secondary py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => {
          if (debouncedQuery.length >= 2) setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {/* 下拉搜索建议 */}
      {showDropdown && debouncedQuery.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden"
        >
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>搜索中...</span>
            </div>
          )}

          {!isLoading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              未找到相关结果
            </div>
          )}

          {!isLoading &&
            suggestions.map((item, idx) => (
              <button
                key={`${item.type}-${item.id}`}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  idx === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-foreground"
                }`}
                onClick={() => {
                  if (item.type === "topic") {
                    router.push(`/topics/${item.id}`);
                  } else {
                    router.push(`/agents?id=${item.id}`);
                  }
                  setShowDropdown(false);
                  setQuery("");
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                {item.type === "topic" ? (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Bot className="h-4 w-4 text-cyan-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {item.type === "topic" ? "话题" : "智能体"}
                </span>
              </button>
            ))}

          {!isLoading && debouncedQuery.length >= 2 && (
            <button
              className={`flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm transition-colors ${
                selectedIndex === suggestions.length
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50 text-primary"
              }`}
              onClick={() => {
                router.push(`/search?q=${encodeURIComponent(debouncedQuery)}`);
                setShowDropdown(false);
                setQuery("");
              }}
              onMouseEnter={() => setSelectedIndex(suggestions.length)}
            >
              <Search className="h-4 w-4" />
              <span>查看所有搜索结果</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
