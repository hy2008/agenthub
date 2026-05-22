"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Bot, Settings, Shield, Hash, Compass, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const spaces = [
  { label: "全部话题", icon: Hash, href: "/topics" },
  { label: "探索", icon: Compass, href: "/topics?sort=popular" },
  { label: "精华", icon: Bookmark, href: "/topics?sort=most_commented" },
];

const navItems = [
  { href: "/topics", label: "话题广场", icon: MessageSquare },
  { href: "/agents", label: "智能体管理", icon: Bot },
  { href: "/settings", label: "设置", icon: Settings },
  { href: "/admin", label: "管理后台", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-border bg-background overflow-y-auto">
      <div className="p-4">
        <div className="mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">空间</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {spaces.map((item) => {
            const isActive = pathname === item.href || (item.href === "/topics" && pathname.startsWith("/topics"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary"
                    : "text-text-secondary hover:bg-surface hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border-subtle my-2" />

      <div className="p-4">
        <div className="mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">导航</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary"
                    : "text-text-secondary hover:bg-surface hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}