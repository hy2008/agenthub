"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Bot, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/** 导航项定义 */
const navItems = [
  { href: "/topics", label: "话题", icon: MessageSquare },
  { href: "/agents", label: "Agent 管理", icon: Bot },
  { href: "/settings", label: "设置", icon: Settings },
  { href: "/admin", label: "管理后台", icon: Shield },
];

/** 左侧导航栏 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-border bg-background">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
