"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getPlanLabel, getStatusLabel, getTypeLabel } from "@/lib/ui-labels";
import { ChevronRight, Clock, MessageSquare, CheckCircle2, AlertCircle, XCircle, Inbox, Layers } from "lucide-react";

type SubscriptionRequest = {
  id: number;
  type: string;
  status: string;
  createdAt: string;
  message: string | null;
  currentPlan: string | null;
  requestedPlan: string | null;
};

type FilterType = "all" | "open" | "resolved";

export default function SupportPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  async function fetchRequests() {
    try {
      const res = await fetch("/api/support/requests");
      const data = await res.json();
      if (res.ok) {
        setRequests(data.data);
      } else {
        toast.error(data.message || "Failed to load requests");
      }
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const status = r.status.toLowerCase();
    if (activeFilter === "all") return true;
    if (activeFilter === "open") return !["resolved", "approved", "rejected"].includes(status);
    if (activeFilter === "resolved") return ["resolved", "approved"].includes(status);
    return true;
  });

  const openCount = requests.filter(r => !["resolved", "approved", "rejected"].includes(r.status.toLowerCase())).length;
  const resolvedCount = requests.filter(r => ["resolved", "approved"].includes(r.status.toLowerCase())).length;

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  return (
    <PageWrapper>
      <div style={{ maxWidth: "1120px", margin: "0 auto", width: "100%", padding: "0 4px" }}>
        <div style={{ marginBottom: "28px", paddingTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "5px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              backgroundColor: "color-mix(in srgb, var(--brand) 8%, var(--card-bg))",
              color: "var(--brand)",
              border: "1px solid color-mix(in srgb, var(--brand) 15%, var(--card-border))",
            }}>
              <Layers size={11} strokeWidth={2.5} />
              Support Center
            </div>
          </div>
          <h1 style={{ 
            fontSize: "27px", 
            fontWeight: 700, 
            color: "var(--text-primary)", 
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
            marginBottom: "10px",
          }}>
            Support Requests
          </h1>
          <p style={{ 
            fontSize: "14px", 
            color: "var(--text-secondary)", 
            maxWidth: "460px",
            lineHeight: 1.5,
          }}>
            Manage subscription questions and support follow-ups from a clean, centralized inbox.
          </p>
        </div>

        <div style={{ 
          display: "flex", 
          gap: "12px", 
          marginBottom: "24px",
        }}>
          <FilterButton
            label="All"
            value={requests.length}
            isActive={activeFilter === "all"}
            onClick={() => handleFilterClick("all")}
            color="var(--text-secondary)"
          />
          <FilterButton
            label="Open"
            value={openCount}
            isActive={activeFilter === "open"}
            onClick={() => handleFilterClick("open")}
            color="#f59e0b"
          />
          <FilterButton
            label="Resolved"
            value={resolvedCount}
            isActive={activeFilter === "resolved"}
            onClick={() => handleFilterClick("resolved")}
            color="#22c55e"
          />
        </div>

        {loading ? (
          <InboxContainer isEmpty>
            <div style={{ 
              padding: "48px", 
              textAlign: "center", 
              color: "var(--text-muted)", 
              fontSize: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "var(--input-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid var(--card-border)",
                  borderTopColor: "var(--brand)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
              </div>
              Loading requests...
            </div>
          </InboxContainer>
        ) : filteredRequests.length === 0 ? (
          <InboxContainer isEmpty>
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "12px",
                backgroundColor: "color-mix(in srgb, var(--brand) 8%, var(--card-bg))",
                color: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                border: "1px solid var(--card-border)",
              }}>
                <Inbox size={22} strokeWidth={1.5} />
              </div>
              <h2 style={{ 
                fontSize: "15px", 
                fontWeight: 600, 
                color: "var(--text-primary)", 
                marginBottom: "6px" 
              }}>
                No {activeFilter === "all" ? "" : activeFilter} requests
              </h2>
              <p style={{ 
                fontSize: "13px", 
                color: "var(--text-muted)", 
                maxWidth: "300px", 
                margin: "0 auto",
                lineHeight: 1.5 
              }}>
                {activeFilter === "all" 
                  ? "There are no support requests at the moment."
                  : `No ${activeFilter} requests match this filter.`
                }
              </p>
            </div>
          </InboxContainer>
        ) : (
          <InboxContainer>
            <InboxHeader 
              count={filteredRequests.length} 
              activeFilter={activeFilter}
              onClear={() => setActiveFilter("all")}
            />

            <RequestList>
              {filteredRequests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  onClick={() => router.push(`/system/support/${request.id}`)}
                />
              ))}
            </RequestList>

            <InboxFooter />
          </InboxContainer>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PageWrapper>
  );
}

function FilterButton({
  label,
  value,
  isActive,
  onClick,
  color,
}: {
  label: string;
  value: number;
  isActive: boolean;
  onClick: () => void;
  color: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 14px",
        cursor: "pointer",
        borderRadius: "7px",
        border: isActive ? "1px solid color-mix(in srgb, var(--brand) 25%, var(--card-border))" : "1px solid transparent",
        backgroundColor: isActive ? "var(--card-bg)" : "transparent",
        boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)" : "none",
        transition: "all 0.2s ease",
        textAlign: "left",
      }}
    >
      <span style={{ 
        fontSize: "13px", 
        fontWeight: 600, 
        color: isActive ? "var(--text-primary)" : isHovered ? "var(--text-secondary)" : "var(--text-muted)",
        transition: "color 0.15s ease",
      }}>
        {value}
      </span>
      <span style={{ 
        fontSize: "12px", 
        fontWeight: 500,
        color: isActive ? color : "var(--text-muted)",
        opacity: isActive ? 1 : 0.7,
        transition: "all 0.15s ease",
      }}>
        {label}
      </span>
    </button>
  );
}

function InboxContainer({ 
  children, 
  isEmpty = false 
}: { 
  children: React.ReactNode; 
  isEmpty?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: "12px",
      boxShadow: isEmpty 
        ? "0 1px 3px rgba(0,0,0,0.04)" 
        : "0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: "linear-gradient(90deg, color-mix(in srgb, var(--brand) 50%, #e5e7eb) 0%, color-mix(in srgb, var(--brand) 20%, #f3f4f6) 50%, transparent 100%)",
        opacity: 0.9,
      }} />
      {children}
    </div>
  );
}

function InboxHeader({ 
  count, 
  activeFilter, 
  onClear 
}: { 
  count: number; 
  activeFilter: FilterType;
  onClear: () => void;
}) {
  return (
    <div style={{ 
      padding: "16px 20px", 
      borderBottom: "1px solid var(--card-border)",
      backgroundColor: "var(--card-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          backgroundColor: "color-mix(in srgb, var(--brand) 10%, var(--card-bg))",
          color: "var(--brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid color-mix(in srgb, var(--brand) 20%, var(--card-border))",
        }}>
          <Inbox size={16} strokeWidth={2} />
        </div>
        <div>
          <h2 style={{ 
            fontSize: "14px", 
            fontWeight: 600, 
            color: "var(--text-primary)", 
            letterSpacing: "-0.1px" 
          }}>
            Request Inbox
          </h2>
          <p style={{ 
            fontSize: "11px", 
            color: "var(--text-muted)", 
            marginTop: "2px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}>
            {count} {count === 1 ? "request" : "requests"}
            {activeFilter !== "all" && (
              <>
                <span style={{ color: "var(--card-border)" }}>·</span>
                <span style={{ color: "var(--brand)", fontWeight: 500 }}>{activeFilter}</span>
              </>
            )}
          </p>
        </div>
      </div>
      {activeFilter !== "all" && (
        <button
          onClick={onClear}
          style={{
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "11px",
            fontWeight: 500,
            backgroundColor: "color-mix(in srgb, var(--brand) 8%, var(--card-bg))",
            color: "var(--brand)",
            border: "1px solid color-mix(in srgb, var(--brand) 20%, var(--card-border))",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "13px", lineHeight: 1 }}>×</span>
          Clear
        </button>
      )}
    </div>
  );
}

function RequestList({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ 
      backgroundColor: "var(--page-bg)",
      padding: "14px 14px 18px",
      display: "flex", 
      flexDirection: "column",
      gap: "10px",
    }}>
      {children}
    </div>
  );
}

function InboxFooter() {
  return (
    <div style={{
      padding: "12px 20px",
      borderTop: "1px solid var(--card-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "var(--card-bg)",
      flexWrap: "wrap",
      gap: "6px",
    }}>
      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
        <MessageSquare size={11} strokeWidth={1.5} />
        Open a request to view the conversation
      </span>
      <span style={{ fontSize: "10px", color: "var(--text-muted)", opacity: 0.6 }}>
        Updated from support requests
      </span>
    </div>
  );
}

function RequestRow({
  request,
  onClick,
}: {
  request: SubscriptionRequest;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 18px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid",
        borderColor: isHovered 
          ? "color-mix(in srgb, var(--brand) 25%, var(--card-border))" 
          : "var(--card-border)",
        borderRadius: "10px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        position: "relative",
        boxShadow: isHovered 
          ? "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04), 0 0 0 1px color-mix(in srgb, var(--brand) 10%, var(--card-border))" 
          : "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)",
        transform: isHovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      
      <div style={{ flex: 1, minWidth: 0, paddingRight: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span style={{
            padding: "3px 7px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            backgroundColor: "color-mix(in srgb, var(--brand) 10%, var(--card-bg))",
            color: "var(--brand)",
            border: "1px solid color-mix(in srgb, var(--brand) 15%, var(--card-border))",
          }}>
            {getTypeLabel(request.type)}
          </span>
          <span style={{
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "10px",
            fontWeight: 500,
            fontFamily: "var(--font-mono, monospace)",
            backgroundColor: "var(--input-bg)",
            color: "var(--text-muted)",
            border: "1px solid var(--card-border)",
          }}>
            #{request.id}
          </span>
          <StatusBadge status={request.status} />
        </div>
        
        <div style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: "5px",
          letterSpacing: "-0.1px",
          lineHeight: 1.4,
        }}>
          {request.message || "No description provided"}
        </div>
        
        {(request.currentPlan || request.requestedPlan) && (
          <div style={{ 
            fontSize: "11px", 
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "2px",
          }}>
            <span style={{ 
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}>
              {request.requestedPlan ? `Upgrading` : `On`}
            </span>
            {formatPlanMovement(request.currentPlan, request.requestedPlan)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "11px",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
          padding: "4px 9px",
          backgroundColor: "color-mix(in srgb, var(--page-bg) 50%, var(--card-bg))",
          borderRadius: "5px",
          border: "1px solid var(--card-border)",
        }}>
          <Clock size={10} strokeWidth={2} />
          {new Date(request.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
        
        <div style={{
          width: "26px",
          height: "26px",
          borderRadius: "6px",
          backgroundColor: isHovered ? "var(--brand)" : "color-mix(in srgb, var(--page-bg) 40%, var(--card-bg))",
          border: "1px solid",
          borderColor: isHovered ? "var(--brand)" : "var(--card-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isHovered ? "#fff" : "var(--text-muted)",
          transition: "all 0.18s ease",
          flexShrink: 0,
        }}>
          <ChevronRight size={13} strokeWidth={2} />
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  let bgColor = "#fef3c7";
  let textColor = "#92400e";
  let borderColor = "#fcd34d";
  let icon = null;

  if (key === "approved" || key === "resolved") {
    bgColor = "#dcfce7";
    textColor = "#166534";
    borderColor = "#86efac";
    icon = <CheckCircle2 size={10} strokeWidth={2.5} />;
  } else if (key === "rejected") {
    bgColor = "#fee2e2";
    textColor = "#991b1b";
    borderColor = "#fca5a5";
    icon = <XCircle size={10} strokeWidth={2.5} />;
  } else if (key === "contacted" || key === "in_review") {
    bgColor = "#e0f2fe";
    textColor = "#075985";
    borderColor = "#7dd3fc";
    icon = <AlertCircle size={10} strokeWidth={2.5} />;
  }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 7px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.3px",
      backgroundColor: bgColor,
      color: textColor,
      border: `1px solid ${borderColor}`,
    }}>
      {icon}
      {getStatusLabel(status)}
    </span>
  );
}

function formatPlanMovement(currentPlan: string | null, requestedPlan: string | null): string {
  if (currentPlan && requestedPlan) {
    return `${getPlanLabel(currentPlan)} → ${getPlanLabel(requestedPlan)}`;
  }
  if (requestedPlan) {
    return `Requested: ${getPlanLabel(requestedPlan)}`;
  }
  return `Current: ${getPlanLabel(currentPlan ?? "")}`;
}