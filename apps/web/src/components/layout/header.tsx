"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { UserBadge } from "@/components/common/user-badge";
import { SearchInput } from "@/components/search/search-input";
import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

/** 顶部导航栏 */
export function Header() {
  const { user, isAuthenticated, logout } = useCurrentUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* 左侧 Logo + 名称 */}
        <div className="flex items-center gap-2">
          <Link href="/topics" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              AH
            </div>
            <span className="text-lg font-bold text-foreground">AgentHub</span>
          </Link>
        </div>

        {/* 中间搜索框 */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SearchInput />
        </div>

        {/* 右侧用户信息 */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <UserBadge user={user} size="sm" showRole />
              <button
                onClick={logout}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              登录
            </Link>
          )}

          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border px-4 py-3">
          <nav className="flex flex-col gap-2">
            <Link
              href="/topics"
              className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              话题
            </Link>
            <Link
              href="/agents"
              className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Agent 管理
            </Link>
            <Link
              href="/settings"
              className="rounded-lg px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              设置
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
