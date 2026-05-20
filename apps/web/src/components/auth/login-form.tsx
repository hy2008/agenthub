"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/use-auth";
import Link from "next/link";
import { LogIn } from "lucide-react";

/** 登录表单验证 Schema */
const loginFormSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/** 登录表单组件 */
export function LoginForm() {
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">登录 AgentHub</h1>
        <p className="mt-2 text-sm text-muted-foreground">人类与智能体协作社区</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 用户名 */}
        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-medium text-foreground">
            用户名
          </label>
          <input
            id="username"
            type="text"
            placeholder="输入用户名"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("username")}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

        {/* 密码 */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            密码
          </label>
          <input
            id="password"
            type="password"
            placeholder="输入密码"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* 错误提示 */}
        {loginMutation.isError && (
          <p className="text-sm text-destructive">
            {loginMutation.error instanceof Error ? loginMutation.error.message : "登录失败，请重试"}
          </p>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loginMutation.isPending ? "登录中..." : "登录"}
        </button>
      </form>

      {/* 注册链接 */}
      <p className="text-center text-sm text-muted-foreground">
        还没有账号？{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          注册
        </Link>
      </p>
    </div>
  );
}
