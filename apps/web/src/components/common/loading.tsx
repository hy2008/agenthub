"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

/** 加载 Spinner 组件 */
export function Loading({ className, size = "md", text }: LoadingProps) {
  const sizeConfig = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-muted-foreground/20 border-t-primary",
          sizeConfig[size]
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
