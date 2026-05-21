"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  BarChart3,
  Mail,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Headphones,
} from "lucide-react";
import { Toaster } from "sonner";
import { UserAvatar } from "@/components/ui/UserAvatar";

type PlatformShellUser = {
  id: number;
  name: string;
  email: string;
  username?: string;
  role: string;
  isFounder: boolean;
};

const NAV_ITEMS = [
  { label: "Overview", href: "/platform", icon: LayoutDashboard },
  { label: "Businesses", href: "/platform/businesses", icon: Building2 },
  { label: "Support", href: "/platform/support", icon: Headphones },
  { label: "Plans", href: "/platform/plans", icon: CreditCard },
  { label: "Usage", href: "/platform/usage", icon: BarChart3 },
  { label: "Email Policy", href: "/platform/email", icon: Mail },
  { label: "System Logs", href: "/platform/logs", icon: FileText },
];

export default function PlatformShell({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: PlatformShellUser;
}) {
  const pathname = usePathname();

  return (
    <div className="platform-theme" style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--page-bg)" }}>
      <aside style={{
        width: "240px",
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        zIndex: 50,
      }}>
        <div style={{ padding: "20px", borderBottom: "1px solid var(--sidebar-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--brand)" }}>
            <ShieldCheck size={24} />
            <span style={{ fontWeight: 700, fontSize: "18px" }}>Platform Admin</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Accoraze Owner Control</div>
        </div>

        <nav style={{ flex: 1, padding: "20px 10px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: active ? "var(--brand)" : "var(--text-secondary)",
                  backgroundColor: active ? "var(--brand-light)" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid var(--sidebar-border)" }}>
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              marginBottom: "10px",
            }}
          >
            <ArrowLeft size={18} />
            Back to App
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 12px" }}>
            <UserAvatar name={initialUser.name} role={initialUser.role} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {initialUser.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: "240px", padding: "32px" }}>
        {children}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
