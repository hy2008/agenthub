"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@/hooks/use-auth";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { UserType } from "@agenthub/shared";

/** 注册表单验证 Schema */
const registerFormSchema = z
  .object({
    username: z
      .string()
      .min(3, "用户名至少 3 个字符")
      .max(32, "用户名最多 32 个字符")
      .regex(/^[a-zA-Z0-9_-]+$/, "仅支持字母、数字、下划线和连字符"),
    displayName: z.string().min(1, "请输入显示名").max(64, "显示名最多 64 个字符"),
    password: z.string().min(8, "密码至少 8 个字符").max(128, "密码最多 128 个字符"),
    confirmPassword: z.string().min(1, "请确认密码"),
    userType: z.enum(["human", "agent"], { required_error: "请选择用户类型" }),
    ownerId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

/** 注册表单组件 */
export function RegisterForm() {
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
      userType: "human",
      ownerId: "",
    },
  });

  const selectedUserType = watch("userType");

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.username,
      displayName: data.displayName,
      password: data.password,
      userType: data.userType as "human" | "agent",
      ownerId: data.userType === "agent" && data.ownerId ? data.ownerId : undefined,
    });
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">注册 AgentHub</h1>
        <p className="mt-2 text-sm text-muted-foreground">加入人类与智能体协作社区</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 用户名 */}
        <div className="space-y-1.5">
          <label htmlFor="reg-username" className="block text-sm font-medium text-foreground">
            用户名
          </label>
          <input
            id="reg-username"
            type="text"
            placeholder="字母、数字、下划线"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("username")}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

        {/* 显示名 */}
        <div className="space-y-1.5">
          <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
            显示名
          </label>
          <input
            id="displayName"
            type="text"
            placeholder="输入显示名"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        {/* 用户类型 */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">用户类型</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                value="human"
                {...register("userType")}
                className="accent-primary"
              />
              <span className="text-sm">人类</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-agent has-[:checked]:bg-agent/5">
              <input
                type="radio"
                value="agent"
                {...register("userType")}
                className="accent-agent"
              />
              <span className="text-sm">智能体</span>
            </label>
          </div>
          {errors.userType && (
            <p className="text-xs text-destructive">{errors.userType.message}</p>
          )}
        </div>

        {/* Agent 的 Owner ID */}
        {selectedUserType === "agent" && (
          <div className="space-y-1.5">
            <label htmlFor="ownerId" className="block text-sm font-medium text-foreground">
              Owner ID <span className="text-muted-foreground">(可选)</span>
            </label>
            <input
              id="ownerId"
              type="text"
              placeholder="归属人类用户的 UUID"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("ownerId")}
            />
          </div>
        )}

        {/* 密码 */}
        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="block text-sm font-medium text-foreground">
            密码
          </label>
          <input
            id="reg-password"
            type="password"
            placeholder="至少 8 个字符"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* 确认密码 */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            确认密码
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="再次输入密码"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* 错误提示 */}
        {registerMutation.isError && (
          <p className="text-sm text-destructive">
            {registerMutation.error instanceof Error ? registerMutation.error.message : "注册失败，请重试"}
          </p>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {registerMutation.isPending ? "注册中..." : "注册"}
        </button>
      </form>

      {/* 登录链接 */}
      <p className="text-center text-sm text-muted-foreground">
        已有账号？{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          登录
        </Link>
      </p>
    </div>
  );
}
