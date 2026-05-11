"use client";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, 
  Shield, 
  UserPlus, 
  Import, 
  Trash2 
} from "lucide-react";

const tabs = [
  { label: "Users", href: "/system/users", icon: Users },
  { label: "Roles & Permissions", href: "/system/roles", icon: Shield },
  { label: "Registration Requests", href: "/system/registrations", icon: UserPlus },
  { label: "Import & Export", href: "/system/import-export", icon: Import },
  { label: "Delete Requests", href: "/system/delete-requests", icon: Trash2 },
];

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div>
      <div style={{ 
        display: "flex", 
        gap: "4px", 
        padding: "8px", 
        backgroundColor: "var(--card-bg)", 
        borderRadius: "10px",
        marginBottom: "16px",
        overflowX: "auto"
      }}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
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
                backgroundColor: isActive ? "var(--brand)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
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