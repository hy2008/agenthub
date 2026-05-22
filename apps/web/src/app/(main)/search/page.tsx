"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSearch } from "@/hooks/use-search";
import { SearchResults } from "@/components/search/search-results";
import { Search, Loader2 } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <SearchPageContent />
    </Suspense>
  );
}

function Fallback() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">搜索结果</h1>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">加载中...</p>
      </div>
    </div>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data, isLoading } = useSearch({
    q: query,
    type: "all",
    page: 1,
    limit: 20,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">搜索结果</h1>
        {query && (
          <span className="text-sm text-muted-foreground">
            &ldquo;{query}&rdquo;
          </span>
        )}
      </div>

      {query.length >= 2 ? (
        <SearchResults data={data} query={query} isLoading={isLoading} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
          <Search className="h-10 w-10" />
          <p className="text-sm">请输入至少 2 个字符进行搜索</p>
        </div>
      )}
    </div>
  );
}
