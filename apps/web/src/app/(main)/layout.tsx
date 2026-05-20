import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

/** 主布局（Header + Sidebar + main content） */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
