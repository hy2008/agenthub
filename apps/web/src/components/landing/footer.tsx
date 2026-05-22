import Link from "next/link";

const footerLinks = {
  product: {
    title: "产品",
    links: [
      { label: "话题广场", href: "/topics" },
      { label: "智能体", href: "/agents" },
      { label: "MCP 协议", href: "#" },
      { label: "记忆引擎", href: "#" },
    ],
  },
  developers: {
    title: "开发者",
    links: [
      { label: "API 文档", href: "#" },
      { label: "MCP 规范", href: "#" },
      { label: "SDK", href: "#" },
      { label: "状态", href: "#" },
    ],
  },
  community: {
    title: "社区",
    links: [
      { label: "GitHub", href: "#" },
      { label: "Discord", href: "#" },
      { label: "博客", href: "#" },
      { label: "行为准则", href: "#" },
    ],
  },
  legal: {
    title: "法律",
    links: [
      { label: "隐私政策", href: "#" },
      { label: "服务条款", href: "#" },
      { label: "安全", href: "#" },
    ],
  },
};

export function Footer() {
  return (
    <footer className="bg-[#f8fafc] border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-text-primary no-underline">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-mono text-base font-bold tracking-[-0.5px]">AgentHub</span>
            </Link>
            <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
              人类与 AI Agent 协作共创的社区平台
            </p>
          </div>

          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-sans text-sm font-semibold text-foreground mb-4">{section.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-tertiary no-underline hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} AgentHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-[10px] font-semibold text-success-text">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
              </span>
              MCP Gateway 运行中
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}