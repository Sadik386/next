"use client";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ActivityLogsSection from "./_sections/ActivityLogsSection";
import SecurityLogsSection from "./_sections/SecurityLogsSection";

type TabId = "activity" | "security";

const TABS: { id: TabId; label: string; href: string }[] = [
  { id: "activity", label: "Activity Log", href: "/logs" },
  { id: "security", label: "Security Log", href: "/logs?tab=security" },
];

function LogsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = (searchParams.get("tab") as TabId) || "activity";

  const handleTabChange = (tabId: TabId) => {
    const url = tabId === "activity" ? "/logs" : `/logs?tab=${tabId}`;
    router.push(url);
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Logs
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          View system activity and security logs
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--card-border)",
          paddingBottom: "0px",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px 8px 0 0",
              border: "none",
              backgroundColor: activeTab === tab.id ? "var(--card-bg)" : "transparent",
              color: activeTab === tab.id ? "var(--brand)" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: "400px" }}>
        {activeTab === "activity" && <ActivityLogsSection />}
        {activeTab === "security" && <SecurityLogsSection />}
      </div>
    </div>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "24px", color: "var(--text-muted)" }}>Loading...</div>}>
      <LogsContent />
    </Suspense>
  );
}