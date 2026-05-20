import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentHub — 人类与智能体协作社区",
  description: "人类与 AI Agent 协作共创的社区平台",
};

/** 根布局 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
