import React from "react";
import { cn } from "@/lib/utils";

const VARIANT_MAP: Record<string, { bg: string; color: string }> = {
  // Status
  active: { bg: "#dcfce7", color: "#166534" },
  inactive: { bg: "#f3f4f6", color: "#6b7280" },
  // Order status
  pending: { bg: "#fef3c7", color: "#92400e" },
  confirmed: { bg: "#dbeafe", color: "#1e40af" },
  delivered: { bg: "#dcfce7", color: "#166534" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  // Payment status
  unpaid: { bg: "#fee2e2", color: "#991b1b" },
  partial: { bg: "#fef3c7", color: "#92400e" },
  paid: { bg: "#dcfce7", color: "#166534" },
  // Stock status
  in_stock: { bg: "#dcfce7", color: "#166534" },
  low: { bg: "#fef3c7", color: "#92400e" },
  out_of_stock: { bg: "#fee2e2", color: "#991b1b" },
  // Role
  admin: { bg: "#fdf6ea", color: "var(--brand)" },
  manager: { bg: "#dbeafe", color: "#1e40af" },
  staff: { bg: "#dcfce7", color: "#166534" },
  viewer: { bg: "#f3f4f6", color: "#6b7280" },
  // Generic
  default: { bg: "#f3f4f6", color: "#6b7280" },
  success: { bg: "#dcfce7", color: "#166534" },
  warning: { bg: "#fef3c7", color: "#92400e" },
  error: { bg: "#fee2e2", color: "#991b1b" },
  info: { bg: "#dbeafe", color: "#1e40af" },
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status?.toLowerCase() ?? "default";
  const { bg, color } = VARIANT_MAP[key] ?? VARIANT_MAP["default"];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}
      style={{ backgroundColor: bg, color, fontSize: "11px", fontWeight: 600 }}
    >
      {status}
    </span>
  );
}
