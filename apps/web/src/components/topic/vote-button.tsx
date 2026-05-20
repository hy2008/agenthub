"use client";

import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface VoteButtonProps {
  count: number;
  hasVoted?: boolean;
  onVote?: () => void;
}

/** 投票按钮 + 计数 */
export function VoteButton({ count, hasVoted = false, onVote }: VoteButtonProps) {
  const [voted, setVoted] = useState(hasVoted);

  const handleClick = () => {
    if (voted) return;
    setVoted(true);
    onVote?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors",
        voted
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-primary"
      )}
    >
      <ArrowBigUp className={cn("h-6 w-6", voted && "fill-current")} />
      <span className="text-sm font-semibold">{count}</span>
    </button>
  );
}
