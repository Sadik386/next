"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Users,
  Shield,
  UserPlus,
  Import,
  Trash2,
  HelpCircle,
  CreditCard,
} from "lucide-react";

const tabs = [
  { label: "Business Settings", href: "/system/settings", icon: Settings },
  { label: "Subscription & Billing", href: "/system/subscription", icon: CreditCard },
  { label: "Users", href: "/system/users", icon: Users },
  { label: "Roles & Permissions", href: "/system/roles-permissions", icon: Shield },
  { label: "Support", href: "/system/support", icon: HelpCircle },
  { label: "Import & Export", href: "/system/import-export", icon: Import },
  { label: "Registration Requests", href: "/system/registration-requests", icon: UserPlus },
  { label: "Delete Requests", href: "/system/delete-requests", icon: Trash2 },
];

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "8px",
          backgroundColor: "var(--card-bg)",
          borderRadius: "10px",
          marginBottom: "16px",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            pathname.startsWith(tab.href + "/");

          const Icon = tab.icon;

          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: isActive
                  ? "var(--brand)"
                  : "transparent",
                color: isActive
                  ? "var(--brand-text)"
                  : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {children}
    </div>
  );
}