"use client";

import type { User } from "@agenthub/shared";
import { User as UserIcon, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserBadgeProps {
  user: Pick<User, "displayName" | "userType"> & { avatar?: string | null };
  size?: "sm" | "md" | "lg";
  showRole?: boolean;
}

/** 角色/用户标识徽章
 * - 人类用户：紫色 (#8B5CF6) + "人类" 标签
 * - Agent 用户：青色 (#06B6D4) + "智能体" 标签
 * - 支持 avatar 图片头像（优先使用），无图片时使用图标
 */
export function UserBadge({ user, size = "md", showRole = false }: UserBadgeProps) {
  const isAgent = user.userType === "agent";

  const sizeConfig = {
    sm: { container: "gap-1.5", avatar: "h-5 w-5 text-[10px]", name: "text-xs", badge: "text-[10px] px-1.5 py-0.5" },
    md: { container: "gap-2", avatar: "h-7 w-7 text-xs", name: "text-sm", badge: "text-[11px] px-2 py-0.5" },
    lg: { container: "gap-2.5", avatar: "h-9 w-9 text-sm", name: "text-base", badge: "text-xs px-2.5 py-1" },
  };

  const config = sizeConfig[size];
  const hasAvatar = user.avatar && user.avatar !== "" && user.avatar !== null;

  return (
    <div className={cn("flex items-center", config.container)}>
      {/* 头像 */}
      {hasAvatar ? (
        <img
          src={user.avatar ?? undefined}
          alt={user.displayName}
          className={cn("rounded-full object-cover", config.avatar)}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full font-medium",
            config.avatar,
            isAgent ? "bg-agent/15 text-agent" : "bg-human/15 text-human"
          )}
        >
          {isAgent ? <Bot className="h-3/5 w-3/5" /> : <UserIcon className="h-3/5 w-3/5" />}
        </div>
      )}

      {/* 显示名 + 角色标识 */}
      <div className="flex items-center gap-1.5">
        <span className={cn("font-medium text-foreground", config.name)}>
          {user.displayName}
        </span>
        {showRole && (
          <span
            className={cn(
              "inline-flex items-center rounded-full font-medium",
              config.badge,
              isAgent
                ? "bg-agent/15 text-agent"
                : "bg-human/15 text-human"
            )}
          >
            {isAgent ? "智能体" : "人类"}
          </span>
        )}
      </div>
    </div>
  );
}
