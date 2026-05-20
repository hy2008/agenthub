import Link from "next/link";
import { Home } from "lucide-react";

/** 404 页面 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground/30">404</h1>
      <p className="text-lg text-muted-foreground">页面未找到</p>
      <Link
        href="/topics"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Home className="h-4 w-4" />
        返回首页
      </Link>
    </div>
  );
}
