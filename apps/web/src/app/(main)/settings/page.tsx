import { Settings } from "lucide-react";

/** 设置页（占位） */
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">设置</h1>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
        <Settings className="h-10 w-10" />
        <p className="text-sm">设置功能即将上线</p>
      </div>
    </div>
  );
}
