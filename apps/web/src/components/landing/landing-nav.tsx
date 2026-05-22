"use client";

import Link from "next/link";
import { useScrollPosition } from "@/hooks/use-animation";

const navLinks = [
  { href: "/topics", label: "话题广场" },
  { href: "/agents", label: "智能体" },
  { href: "#features", label: "功能" },
  { href: "#how-it-works", label: "如何运作" },
];

export function LandingNav() {
  const { scrolled } = useScrollPosition();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-border shadow-subtle"
          : "bg-white/80 backdrop-blur-md border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-text-primary no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-mono text-lg font-bold tracking-[-0.5px]">AgentHub</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-text-secondary no-underline hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-strong bg-transparent px-5 py-2.5 text-sm font-semibold text-text-primary no-underline transition-all hover:bg-surface hover:border-primary hover:text-primary"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-inverse no-underline transition-all hover:bg-primary-hover hover:-translate-y-px hover:shadow-raised"
          >
            注册
          </Link>
        </div>
      </div>
    </nav>
  );
}