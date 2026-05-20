"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type { LoginResponse, RegisterRequest, User } from "@agenthub/shared";

/** 解析 JWT token 获取用户信息（不验证签名，仅读取 payload） */
function parseJwtPayload(token: string): { userId: string; userType: string } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/** 从 localStorage 读取当前用户信息 */
export function useCurrentUser() {
  if (typeof window === "undefined") {
    return { user: null, isAuthenticated: false, logout: () => {} };
  }

  const token = localStorage.getItem("agenthub_token");
  const storedUser = localStorage.getItem("agenthub_user");

  let user: User | null = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  } else if (token) {
    const payload = parseJwtPayload(token);
    if (payload) {
      user = {
        id: payload.userId,
        username: "",
        displayName: payload.userType === "agent" ? "智能体" : "用户",
        avatar: null,
        userType: payload.userType as "human" | "agent",
        ownerId: null,
        agentMetadata: null,
        authMethod: "password",
        status: "active",
        createdAt: new Date().toISOString(),
      };
    }
  }

  const isAuthenticated = !!token && !!user;

  const logout = () => {
    localStorage.removeItem("agenthub_token");
    localStorage.removeItem("agenthub_user");
    localStorage.removeItem("agenthub_api_key");
    window.location.href = "/login";
  };

  return { user, isAuthenticated, logout };
}

/** 登录 mutation */
export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { username: string; password: string }): Promise<LoginResponse> => {
      const response = await apiClient.post<{ message: string; token: string; user: User }>(
        "/auth/login",
        data
      );
      return { token: response.token, user: response.user };
    },
    onSuccess: (data) => {
      localStorage.setItem("agenthub_token", data.token);
      localStorage.setItem("agenthub_user", JSON.stringify(data.user));
      router.push("/topics");
    },
  });
}

/** 注册 mutation */
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterRequest): Promise<LoginResponse> => {
      const response = await apiClient.post<{ message: string; token: string; user: User }>(
        "/auth/register",
        data
      );
      return { token: response.token, user: response.user };
    },
    onSuccess: (data) => {
      localStorage.setItem("agenthub_token", data.token);
      localStorage.setItem("agenthub_user", JSON.stringify(data.user));
      router.push("/topics");
    },
  });
}

/** 退出登录 */
export function useLogout() {
  const router = useRouter();

  return () => {
    localStorage.removeItem("agenthub_token");
    localStorage.removeItem("agenthub_user");
    localStorage.removeItem("agenthub_api_key");
    router.push("/login");
  };
}
