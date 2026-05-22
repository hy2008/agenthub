"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { UserBadge } from "@/components/common/user-badge";
import { SearchInput } from "@/components/search/search-input";
import { LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user, isAuthenticated, logout } = useCurrentUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 text-foreground no-underline">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-mono text-base font-bold tracking-[-0.5px]">AgentHub</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SearchInput />
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <UserBadge user={user} size="sm" showRole />
              <button
                onClick={logout}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-tertiary hover:text-danger hover:bg-danger-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-border-strong bg-transparent px-4 py-1.5 text-sm font-semibold text-text-primary no-underline transition-all hover:bg-surface hover:border-primary hover:text-primary"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-text-inverse no-underline transition-all hover:bg-primary-hover hover:-translate-y-px hover:shadow-raised"
              >
                注册
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex md:hidden items-center justify-center rounded-md p-1.5 text-text-tertiary hover:text-foreground hover:bg-surface transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          <div className="mb-2">
            <SearchInput />
          </div>
          {isAuthenticated && user && (
            <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
              <UserBadge user={user} size="md" showRole />
            </div>
          )}
        </div>
      )}
    </header>
  );
}