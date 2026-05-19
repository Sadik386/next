"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getPlanLabel, getStatusLabel, getTypeLabel } from "@/lib/ui-labels";
import { ChevronRight, Clock, Inbox, MessageSquare, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

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
      <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
              color: "var(--brand)",
              border: "1px solid color-mix(in srgb, var(--brand) 20%, transparent)",
            }}>
              <MessageSquare size={12} />
              Support Center
            </span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Support Requests
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Manage your subscription questions and support follow-ups from one clean inbox.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
          <StatCard
            icon={<Inbox size={16} />}
            label="Total Requests"
            value={requests.length}
            color="#687386"
            isActive={activeFilter === "all"}
            onClick={() => handleFilterClick("all")}
          />
          <StatCard
            icon={<AlertCircle size={16} />}
            label="Open"
            value={openCount}
            color="#f59e0b"
            isActive={activeFilter === "open"}
            onClick={() => handleFilterClick("open")}
          />
          <StatCard
            icon={<CheckCircle2 size={16} />}
            label="Resolved"
            value={resolvedCount}
            color="#22c55e"
            isActive={activeFilter === "resolved"}
            onClick={() => handleFilterClick("resolved")}
          />
        </div>

        {loading ? (
          <div style={cardStyle}>
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
              Loading requests...
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={cardStyle}>
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
                color: "var(--brand)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}>
                <MessageSquare size={20} />
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                No {activeFilter === "all" ? "" : activeFilter} requests
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "280px", margin: "0 auto", lineHeight: 1.5 }}>
                {activeFilter === "all" 
                  ? "There are currently no support requests to display."
                  : `No ${activeFilter} requests match this filter.`
                }
              </p>
            </div>
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--card-border)", opacity: 0.7 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
                    color: "var(--brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Inbox size={15} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Request Inbox
                    </h2>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
                      {filteredRequests.length} {filteredRequests.length === 1 ? "request" : "requests"}
                    </p>
                  </div>
                </div>
                {activeFilter !== "all" && (
                  <button
                    onClick={() => setActiveFilter("all")}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 500,
                      backgroundColor: "var(--input-bg)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--card-border)",
                      cursor: "pointer",
                    }}
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: "var(--page-bg)" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {filteredRequests.map((request, index) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    onClick={() => router.push(`/system/support/${request.id}`)}
                    isLast={index === filteredRequests.length - 1}
                  />
                ))}
              </div>
            </div>

            <div style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--card-border)",
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Open a request to view the conversation.
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                Updated from support requests
              </span>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  isActive: boolean;
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
        ...cardStyle,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        border: isActive 
          ? "1px solid color-mix(in srgb, var(--brand) 40%, transparent)"
          : "1px solid var(--card-border)",
        backgroundColor: isActive 
          ? "color-mix(in srgb, var(--brand) 6%, var(--card-bg))"
          : "var(--card-bg)",
        boxShadow: isActive 
          ? "0 2px 8px rgba(196,151,58,0.1)" 
          : isHovered 
            ? "0 2px 6px rgba(0,0,0,0.04)" 
            : "none",
        transition: "all 0.15s ease",
        textAlign: "left",
      }}
    >
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "6px",
        backgroundColor: isActive ? `${color}20` : `${color}12`,
        color: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>
          {label}
        </div>
      </div>
    </button>
  );
}

function RequestRow({
  request,
  onClick,
  isLast,
}: {
  request: SubscriptionRequest;
  onClick: () => void;
  isLast: boolean;
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
        gap: "12px",
        padding: "14px 20px",
        backgroundColor: isHovered ? "var(--input-bg)" : "transparent",
        border: "none",
        borderBottom: isLast ? "none" : "1px solid var(--card-border)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
          <span style={{
            padding: "2px 6px",
            borderRadius: "999px",
            fontSize: "9px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.2px",
            backgroundColor: "color-mix(in srgb, var(--brand) 8%, transparent)",
            color: "var(--brand)",
            border: "1px solid color-mix(in srgb, var(--brand) 15%, transparent)",
          }}>
            {getTypeLabel(request.type)}
          </span>
          <span style={{
            padding: "1px 5px",
            borderRadius: "3px",
            fontSize: "10px",
            fontWeight: 600,
            fontFamily: "monospace",
            backgroundColor: "var(--input-bg)",
            color: "var(--text-muted)",
            border: "1px solid var(--card-border)",
          }}>
            #{request.id}
          </span>
          <StatusBadge status={request.status} />
        </div>
        <div style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: "2px",
        }}>
          {request.message || "No description provided"}
        </div>
        {(request.currentPlan || request.requestedPlan) && (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.8 }}>
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
        }}>
          <Clock size={11} />
          {new Date(request.createdAt).toLocaleDateString()}
        </div>
        <div style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          backgroundColor: isHovered ? "color-mix(in srgb, var(--brand) 8%, transparent)" : "var(--input-bg)",
          border: `1px solid ${isHovered ? "color-mix(in srgb, var(--brand) 20%, transparent)" : "var(--card-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isHovered ? "var(--brand)" : "var(--text-muted)",
          transition: "all 0.15s ease",
        }}>
          <ChevronRight size={13} />
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
    icon = <CheckCircle2 size={9} />;
  } else if (key === "rejected") {
    bgColor = "#fee2e2";
    textColor = "#991b1b";
    borderColor = "#fca5a5";
    icon = <XCircle size={9} />;
  } else if (key === "contacted" || key === "in_review") {
    bgColor = "#e0f2fe";
    textColor = "#075985";
    borderColor = "#7dd3fc";
    icon = <AlertCircle size={9} />;
  }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "3px",
      padding: "2px 6px",
      borderRadius: "999px",
      fontSize: "9px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.2px",
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

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  overflow: "hidden",
};