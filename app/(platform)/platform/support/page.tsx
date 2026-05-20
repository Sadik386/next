"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Search, 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  MessageCircle,
  Filter,
  Loader2,
  Headphones,
  TrendingUp,
  Eye,
  Send
} from "lucide-react";
import { getStatusLabel, getTypeLabel } from "@/lib/ui-labels";

type SupportRequest = {
  id: number;
  type: string;
  status: string;
  currentPlan: string | null;
  requestedPlan: string | null;
  reason: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  business: { id: number; name: string; slug: string };
  user: { id: number; name: string; email: string };
  notes: Array<{ id: number; note: string; visibility: string; createdAt: string; user: { name: string } }>;
};

type StatusFilter = "all" | "open" | "resolved";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "contacted", label: "Contacted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "resolved", label: "Resolved" },
];

export default function SupportInboxPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (search) {
        params.set("search", search);
      }
      
      const res = await fetch(`/api/platform/support?${params}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setRequests(data.data);
      } else {
        toast.error(data.message || "Failed to load support requests");
      }
    } catch {
      toast.error("Failed to load support requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    inReview: requests.filter(r => r.status === "in_review").length,
    contacted: requests.filter(r => r.status === "contacted").length,
    resolved: requests.filter(r => ["resolved", "approved", "rejected"].includes(r.status)).length,
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter === "all") return true;
    if (statusFilter === "open") return !["resolved", "approved", "rejected"].includes(r.status);
    return r.status === statusFilter;
  });

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
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
            <Headphones size={11} strokeWidth={2.5} />
            Platform Operations
          </div>
        </div>
        <h1 style={{ 
          fontSize: "28px", 
          fontWeight: 700, 
          color: "var(--text-primary)", 
          letterSpacing: "-0.5px",
          lineHeight: 1.2,
          marginBottom: "8px",
        }}>
          Support Inbox
        </h1>
        <p style={{ 
          fontSize: "14px", 
          color: "var(--text-secondary)", 
          maxWidth: "480px",
          lineHeight: 1.5,
        }}>
          Manage and respond to support requests from all businesses on the platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", 
        gap: "12px",
        marginBottom: "24px",
      }}>
        <StatCard icon={Inbox} label="Total" value={stats.total} color="var(--text-secondary)" />
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard icon={Eye} label="In Review" value={stats.inReview} color="#3b82f6" />
        <StatCard icon={MessageCircle} label="Contacted" value={stats.contacted} color="#8b5cf6" />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="#22c55e" />
      </div>

      {/* Search and Filters */}
      <div style={{ 
        display: "flex", 
        gap: "12px", 
        marginBottom: "20px",
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <div style={{ 
          position: "relative", 
          flex: "1 1 280px",
          maxWidth: "320px",
        }}>
          <Search size={15} style={{ 
            position: "absolute", 
            left: "12px", 
            top: "50%", 
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }} />
          <input
            type="text"
            placeholder="Search businesses or requesters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 38px",
              fontSize: "13px",
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              outline: "none",
              transition: "border-color 0.2s",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              style={{
                padding: "7px 12px",
                fontSize: "12px",
                fontWeight: 500,
                borderRadius: "6px",
                border: "1px solid",
                borderColor: statusFilter === option.value 
                  ? "color-mix(in srgb, var(--brand) 30%, var(--card-border))" 
                  : "var(--card-border)",
                backgroundColor: statusFilter === option.value 
                  ? "color-mix(in srgb, var(--brand) 8%, var(--card-bg))" 
                  : "var(--card-bg)",
                color: statusFilter === option.value 
                  ? "var(--brand)" 
                  : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inbox */}
      {loading ? (
        <InboxContainer>
          <div style={{ 
            padding: "64px", 
            textAlign: "center", 
            color: "var(--text-muted)", 
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}>
            <Loader2 size={20} className="spin" />
            Loading support requests...
          </div>
        </InboxContainer>
      ) : filteredRequests.length === 0 ? (
        <InboxContainer>
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              backgroundColor: "color-mix(in srgb, var(--brand) 8%, var(--card-bg))",
              color: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Inbox size={20} strokeWidth={1.5} />
            </div>
            <h3 style={{ 
              fontSize: "14px", 
              fontWeight: 600, 
              color: "var(--text-primary)", 
              marginBottom: "6px" 
            }}>
              No support requests
            </h3>
            <p style={{ 
              fontSize: "13px", 
              color: "var(--text-muted)", 
            }}>
              {statusFilter === "all" 
                ? "All support requests have been resolved." 
                : `No ${statusFilter.replace("_", " ")} requests found.`}
            </p>
          </div>
        </InboxContainer>
      ) : (
        <InboxContainer>
          <InboxHeader count={filteredRequests.length} filter={statusFilter} />
          <RequestList>
            {filteredRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                onClick={() => router.push(`/platform/support/${request.id}`)}
              />
            ))}
          </RequestList>
        </InboxContainer>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "16px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "10px",
        transition: "all 0.2s ease",
        boxShadow: hovered 
          ? "0 4px 12px rgba(0,0,0,0.08)" 
          : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "7px",
          backgroundColor: "color-mix(in srgb, var(--page-bg) 60%, var(--card-bg))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
        }}>
          <Icon size={15} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

function InboxContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: "linear-gradient(90deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 30%, var(--page-bg)) 100%)",
      }} />
      {children}
    </div>
  );
}

function InboxHeader({ count, filter }: { count: number; filter: string }) {
  return (
    <div style={{ 
      padding: "14px 20px", 
      borderBottom: "1px solid var(--card-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          backgroundColor: "color-mix(in srgb, var(--brand) 10%, var(--card-bg))",
          color: "var(--brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Inbox size={14} strokeWidth={2} />
        </div>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          {count} {count === 1 ? "request" : "requests"}
        </span>
        {filter !== "all" && (
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            · {filter.replace("_", " ")}
          </span>
        )}
      </div>
    </div>
  );
}

function RequestList({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ 
      backgroundColor: "var(--page-bg)",
      padding: "12px",
      display: "flex", 
      flexDirection: "column",
      gap: "8px",
    }}>
      {children}
    </div>
  );
}

function RequestRow({ request, onClick }: { request: SupportRequest; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  const isOpen = !["resolved", "approved", "rejected"].includes(request.status);
  const latestNote = request.notes?.[0];
  const hasUnread = isOpen && request.notes.length === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "14px 16px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid",
        borderColor: hovered 
          ? "color-mix(in srgb, var(--brand) 20%, var(--card-border))" 
          : "var(--card-border)",
        borderRadius: "9px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        boxShadow: hovered 
          ? "0 3px 8px rgba(0,0,0,0.06)" 
          : "none",
      }}
    >
      {/* Unread indicator */}
      {hasUnread && (
        <div style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "var(--brand)",
          marginTop: "6px",
          flexShrink: 0,
        }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Business & Requester */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
          <span style={{
            padding: "2px 6px",
            borderRadius: "3px",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            backgroundColor: "color-mix(in srgb, var(--brand) 10%, var(--card-bg))",
            color: "var(--brand)",
            border: "1px solid color-mix(in srgb, var(--brand) 15%, var(--card-border))",
          }}>
            {getTypeLabel(request.type)}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
            {request.business.name}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            · {request.user.name}
          </span>
        </div>

        {/* Message preview */}
        <div style={{ 
          fontSize: "13px", 
          color: "var(--text-secondary)",
          lineHeight: 1.4,
          marginBottom: "6px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {request.message || request.reason || "No message"}
        </div>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={10} strokeWidth={2} />
            {new Date(request.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          {request.requestedPlan && (
            <span style={{ color: "var(--brand)" }}>
              {request.currentPlan} → {request.requestedPlan}
            </span>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ flexShrink: 0 }}>
        <StatusBadge status={request.status} />
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  let bgColor = "#fef3c7";
  let textColor = "#92400e";
  let borderColor = "#fcd34d";
  let icon: React.ReactNode = null;

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
      padding: "4px 8px",
      borderRadius: "999px",
      fontSize: "10px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.3px",
      backgroundColor: bgColor,
      color: textColor,
      border: `1px solid ${borderColor}`,
      whiteSpace: "nowrap",
    }}>
      {icon}
      {getStatusLabel(status)}
    </span>
  );
}