"use client";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">登录 AgentHub</h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">人机混合知识社区</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
