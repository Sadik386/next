"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

export default function SupportPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);

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

  const openCount = requests.filter(r => !["resolved", "approved", "rejected"].includes(r.status.toLowerCase())).length;
  const resolvedCount = requests.filter(r => ["resolved", "approved"].includes(r.status.toLowerCase())).length;

  return (
    <PageWrapper>
      <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "24px" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <StatCard
            icon={<Inbox size={18} />}
            label="Total Requests"
            value={requests.length}
            color="#687386"
          />
          <StatCard
            icon={<AlertCircle size={18} />}
            label="Open"
            value={openCount}
            color="#f59e0b"
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Resolved"
            value={resolvedCount}
            color="#22c55e"
          />
        </div>

        {loading ? (
          <div style={cardStyle}>
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
              Loading requests...
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div style={cardStyle}>
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
                color: "var(--brand)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}>
                <MessageSquare size={24} />
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                No support requests
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "320px", margin: "0 auto", lineHeight: 1.5 }}>
                There are currently no open support or subscription requests to display.
              </p>
            </div>
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "8px",
                    backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
                    color: "var(--brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Inbox size={17} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      Request Inbox
                    </h2>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Review your messages and subscription requests
                    </p>
                  </div>
                </div>
                <span style={{
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 600,
                  backgroundColor: "var(--input-bg)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--card-border)",
                }}>
                  {requests.length} {requests.length === 1 ? "request" : "requests"}
                </span>
              </div>
            </div>

            <div style={{ backgroundColor: "var(--page-bg)" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {requests.map((request, index) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    onClick={() => router.push(`/system/support/${request.id}`)}
                    isLast={index === requests.length - 1}
                  />
                ))}
              </div>
            </div>

            <div style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--card-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
            }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Open a request to view the conversation and respond.
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{
      ...cardStyle,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    }}>
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        backgroundColor: `${color}15`,
        color: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
          {label}
        </div>
      </div>
    </div>
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
        gap: "16px",
        padding: "16px 20px",
        backgroundColor: isHovered ? "var(--input-bg)" : "transparent",
        border: "none",
        borderBottom: isLast ? "none" : "1px solid var(--card-border)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: isHovered ? "0 4px 12px rgba(0, 0, 0, 0.06)" : "none",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
          <span style={{
            padding: "3px 8px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
            color: "var(--brand)",
            border: "1px solid color-mix(in srgb, var(--brand) 20%, transparent)",
          }}>
            {getTypeLabel(request.type)}
          </span>
          <span style={{
            padding: "2px 6px",
            borderRadius: "4px",
            fontSize: "11px",
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
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: "4px",
        }}>
          {request.message || "No description provided"}
        </div>
        {(request.currentPlan || request.requestedPlan) && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {formatPlanMovement(request.currentPlan, request.requestedPlan)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "12px",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}>
          <Clock size={13} />
          {new Date(request.createdAt).toLocaleDateString()}
        </div>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          backgroundColor: isHovered ? "color-mix(in srgb, var(--brand) 10%, transparent)" : "var(--input-bg)",
          border: `1px solid ${isHovered ? "color-mix(in srgb, var(--brand) 30%, transparent)" : "var(--card-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isHovered ? "var(--brand)" : "var(--text-muted)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isHovered ? "translateX(2px)" : "translateX(0)",
        }}>
          <ChevronRight size={15} />
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
    icon = <CheckCircle2 size={10} />;
  } else if (key === "rejected") {
    bgColor = "#fee2e2";
    textColor = "#991b1b";
    borderColor = "#fca5a5";
    icon = <XCircle size={10} />;
  } else if (key === "contacted" || key === "in_review") {
    bgColor = "#e0f2fe";
    textColor = "#075985";
    borderColor = "#7dd3fc";
    icon = <AlertCircle size={10} />;
  }

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "3px 8px",
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

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  overflow: "hidden",
};