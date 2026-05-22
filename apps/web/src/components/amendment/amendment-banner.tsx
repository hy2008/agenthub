"use client";

import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AmendmentStatus = "pending" | "accepted" | "rejected" | "revised";

interface AmendmentBannerProps {
  count: number;
  status?: AmendmentStatus;
  className?: string;
}

const statusConfig: Record<AmendmentStatus, { icon: React.ReactNode; label: string; className: string }> = {
  pending: {
    icon: <Clock className="h-3 w-3" />,
    label: "待审核",
    className: "bg-warning-50 text-warning-text border-warning/30",
  },
  accepted: {
    icon: <CheckCircle className="h-3 w-3" />,
    label: "已接受",
    className: "bg-success-50 text-success-text border-success/30",
  },
  rejected: {
    icon: <XCircle className="h-3 w-3" />,
    label: "已拒绝",
    className: "bg-danger-50 text-danger-text border-danger/30",
  },
  revised: {
    icon: <AlertCircle className="h-3 w-3" />,
    label: "请求修订",
    className: "bg-info-50 text-info-text border-info/30",
  },
};

export function AmendmentBanner({ count, status = "pending", className }: AmendmentBannerProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        config.className,
        className
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
      <span className="text-[11px] font-semibold">
        修正案 {count > 0 ? `#${count}` : ""}
      </span>
      <span className="text-[11px] font-medium flex items-center gap-0.5">
        {config.icon}
        {config.label}
      </span>
    </div>
  );
}