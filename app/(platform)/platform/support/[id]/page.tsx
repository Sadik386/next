"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Send,
  StickyNote,
  Building2,
  User,
  Mail,
  Calendar,
  Activity,
  Loader2,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";

type RequestNote = {
  id: number;
  note: string;
  visibility: string;
  createdAt: string;
  user: { name: string };
};

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
  notes: RequestNote[];
};

const STATUSES = [
  { value: "pending", label: "Pending", color: "#f59e0b" },
  { value: "in_review", label: "In Review", color: "#3b82f6" },
  { value: "contacted", label: "Contacted", color: "#8b5cf6" },
  { value: "approved", label: "Approved", color: "#22c55e" },
  { value: "rejected", label: "Rejected", color: "#ef4444" },
  { value: "resolved", label: "Resolved", color: "#22c55e" },
];

export default function SupportWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

  async function fetchRequest() {
    try {
      const res = await fetch(`/api/platform/support/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRequest(data.data);
      } else {
        toast.error(data.message || "Failed to load request");
        router.push("/platform/support");
      }
    } catch {
      toast.error("Failed to load request");
      router.push("/platform/support");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    if (!request) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/platform/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          adminNote: message || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequest({ ...request, status: newStatus });
        toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
      setShowStatusMenu(false);
    }
  }

  async function sendReply() {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/platform/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: request?.status,
          adminNote: message,
          userId: 1,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("");
        await fetchRequest();
        toast.success(isInternal ? "Internal note added" : "Reply sent");
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 size={20} className="spin" />
      </div>
    );
  }

  if (!request) return null;

  const currentStatus = STATUSES.find(s => s.value === request.status);
  const statusIndex = STATUSES.findIndex(s => s.value === request.status);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => router.push("/platform/support")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          <ArrowLeft size={16} />
          Back to Support
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ 
              fontSize: "24px", 
              fontWeight: 700, 
              color: "var(--text-primary)", 
              letterSpacing: "-0.3px",
              marginBottom: "4px",
            }}>
              Support Request #{request.id}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Building2 size={14} />
                {request.business.name}
              </span>
              <span>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <User size={14} />
                {request.user.name}
              </span>
            </div>
          </div>

          {/* Status Workflow */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={updating}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: currentStatus?.color + "15",
                color: currentStatus?.color,
                border: `1px solid ${currentStatus?.color}30`,
                borderRadius: "8px",
                cursor: updating ? "not-allowed" : "pointer",
                opacity: updating ? 0.7 : 1,
              }}
            >
              {updating && <Loader2 size={14} className="spin" />}
              {currentStatus?.label}
              <ChevronDown size={14} />
            </button>

            {showStatusMenu && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: "10px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: "6px",
                minWidth: "180px",
                zIndex: 50,
              }}>
                {STATUSES.map((status, idx) => (
                  <button
                    key={status.value}
                    onClick={() => updateStatus(status.value)}
                    disabled={updating}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: status.value === request.status ? status.color : "var(--text-primary)",
                      backgroundColor: status.value === request.status ? status.color + "10" : "transparent",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%", 
                      backgroundColor: status.color,
                    }} />
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px" }}>
        {/* Left: Conversation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Initial Request */}
          <RequestCard request={request} />

          {/* Timeline */}
          <div ref={timelineRef} style={{ 
            backgroundColor: "var(--card-bg)", 
            border: "1px solid var(--card-border)", 
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            <Timeline request={request} />
          </div>

          {/* Composer */}
          <Composer
            message={message}
            setMessage={setMessage}
            isInternal={isInternal}
            setIsInternal={setIsInternal}
            onSend={sendReply}
            loading={updating}
          />
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Sidebar request={request} statusIndex={statusIndex} />
        </div>
      </div>

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

function RequestCard({ request }: { request: SupportRequest }) {
  return (
    <div style={{
      backgroundColor: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: "12px",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 20px",
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
            <Mail size={14} strokeWidth={2} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Initial Request
          </span>
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {new Date(request.createdAt).toLocaleDateString(undefined, { 
            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" 
          })}
        </span>
      </div>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span style={{
            padding: "3px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            backgroundColor: "color-mix(in srgb, var(--brand) 10%, var(--card-bg))",
            color: "var(--brand)",
          }}>
            {getTypeLabel(request.type)}
          </span>
          {request.requestedPlan && (
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {getPlanLabel(request.currentPlan || "")} → {getPlanLabel(request.requestedPlan)}
            </span>
          )}
        </div>
        {request.reason && (
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
            {request.reason}
          </div>
        )}
        {request.message && (
          <div style={{ 
            fontSize: "14px", 
            color: "var(--text-secondary)", 
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}>
            {request.message}
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ request }: { request: SupportRequest }) {
  const notes = request.notes || [];

  if (notes.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
        No activity yet
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "0",
        position: "relative",
      }}>
        {/* Timeline line */}
        <div style={{
          position: "absolute",
          left: "15px",
          top: "24px",
          bottom: "24px",
          width: "2px",
          backgroundColor: "var(--card-border)",
        }} />

        {notes.map((note, idx) => {
          const isPublic = note.visibility === "public";
          const isSystem = note.note.startsWith("Status changed from");

          return (
            <div key={note.id} style={{ 
              display: "flex", 
              gap: "14px", 
              paddingBottom: idx < notes.length - 1 ? "24px" : "0",
              position: "relative",
            }}>
              {/* Timeline dot */}
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: isSystem 
                  ? "var(--page-bg)" 
                  : isPublic 
                    ? "#dcfce7" 
                    : "#fef3c7",
                border: "2px solid",
                borderColor: isSystem 
                  ? "var(--card-border)" 
                  : isPublic 
                    ? "#86efac" 
                    : "#fcd34d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                zIndex: 1,
              }}>
                {isSystem ? (
                  <Activity size={12} strokeWidth={2} color="var(--text-muted)" />
                ) : isPublic ? (
                  <Send size={12} strokeWidth={2} color="#166534" />
                ) : (
                  <StickyNote size={12} strokeWidth={2} color="#92400e" />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  marginBottom: "6px",
                  flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {note.user.name}
                  </span>
                  <span style={{
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "9px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    backgroundColor: isSystem 
                      ? "var(--page-bg)" 
                      : isPublic 
                        ? "#dcfce7" 
                        : "#fef3c7",
                    color: isSystem 
                      ? "var(--text-muted)" 
                      : isPublic 
                        ? "#166534" 
                        : "#92400e",
                    border: "1px solid",
                    borderColor: isSystem 
                      ? "var(--card-border)" 
                      : isPublic 
                        ? "#86efac" 
                        : "#fcd34d",
                  }}>
                    {isSystem ? "System" : isPublic ? "Reply" : "Internal Note"}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(note.createdAt).toLocaleDateString(undefined, { 
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                    })}
                  </span>
                </div>
                <div style={{ 
                  fontSize: "13px", 
                  color: "var(--text-secondary)", 
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}>
                  {note.note}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Composer({ 
  message, 
  setMessage, 
  isInternal, 
  setIsInternal, 
  onSend, 
  loading 
}: { 
  message: string; 
  setMessage: (v: string) => void; 
  isInternal: boolean; 
  setIsInternal: (v: boolean) => void; 
  onSend: () => void; 
  loading: boolean; 
}) {
  return (
    <div style={{
      backgroundColor: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: "12px",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          Reply or Note
        </div>
      </div>
      <div style={{ padding: "20px" }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isInternal ? "Add an internal note..." : "Write a reply to the customer..."}
          rows={4}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontFamily: "inherit",
            backgroundColor: "var(--input-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            outline: "none",
            resize: "vertical",
            minHeight: "100px",
            marginBottom: "12px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => setIsInternal(!isInternal)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 500,
              backgroundColor: isInternal ? "#fef3c7" : "transparent",
              color: isInternal ? "#92400e" : "var(--text-muted)",
              border: "1px solid",
              borderColor: isInternal ? "#fcd34d" : "var(--card-border)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            <StickyNote size={14} />
            {isInternal ? "Internal Note" : "Internal Note"}
          </button>
          <button
            onClick={onSend}
            disabled={loading || !message.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: message.trim() ? (isInternal ? "#f59e0b" : "var(--brand)") : "var(--card-border)",
              color: message.trim() ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "8px",
              cursor: message.trim() ? "pointer" : "not-allowed",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading && <Loader2 size={14} className="spin" />}
            {isInternal ? "Add Note" : "Send Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ request, statusIndex }: { request: SupportRequest; statusIndex: number }) {
  return (
    <>
      {/* Workflow State */}
      <div style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Workflow State
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {STATUSES.map((status, idx) => (
              <div 
                key={status.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  backgroundColor: idx <= statusIndex ? status.color + "10" : "transparent",
                }}
              >
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: idx < statusIndex ? status.color : "var(--card-border)",
                }} />
                <span style={{ 
                  fontSize: "12px", 
                  fontWeight: idx === statusIndex ? 600 : 400,
                  color: idx <= statusIndex ? status.color : "var(--text-muted)",
                }}>
                  {status.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Request Details */}
      <div style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Request Details
          </div>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <DetailRow icon={Building2} label="Business" value={request.business.name} />
          <DetailRow icon={User} label="Requester" value={request.user.name} />
          <DetailRow icon={Mail} label="Email" value={request.user.email} />
          <DetailRow icon={Calendar} label="Created" value={new Date(request.createdAt).toLocaleDateString()} />
          {request.requestedPlan && (
            <DetailRow 
              icon={Activity} 
              label="Plan Change" 
              value={`${getPlanLabel(request.currentPlan || "")} → ${getPlanLabel(request.requestedPlan)}`} 
            />
          )}
        </div>
      </div>

      {/* Activity Stats */}
      <div style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            Activity
          </div>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", gap: "16px" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
              {request.notes.length}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Notes</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
              {Math.floor((new Date().getTime() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Days Open</div>
          </div>
        </div>
      </div>
    </>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <Icon size={14} strokeWidth={2} color="var(--text-muted)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </div>
      </div>
    </div>
  );
}