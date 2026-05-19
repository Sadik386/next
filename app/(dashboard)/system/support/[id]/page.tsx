"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, MessageSquare, Bot, Clock, CheckCircle2, AlertCircle, XCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";

type Note = {
  id: number;
  note: string;
  user: { name: string };
  createdAt: string;
  visibility: string;
};

type SubscriptionRequest = {
  id: number;
  type: string;
  status: string;
  createdAt: string;
  message: string | null;
  currentPlan: string | null;
  requestedPlan: string | null;
  notes: Note[];
};

export default function RequestConversationPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<SubscriptionRequest | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const id = params.id as string;

  useEffect(() => {
    fetchRequest();
  }, [id]);

  async function fetchRequest() {
    try {
      const res = await fetch(`/api/support/requests/${id}`);
      const data = await res.json();
      if (res.ok) {
        setRequest(data.data);
      } else {
        toast.error(data.message || "Failed to load request");
      }
    } catch {
      toast.error("Failed to load request");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!reply) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/support/requests/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: reply }),
      });
      if (res.ok) {
        setReply("");
        toast.success("Reply sent");
        fetchRequest();
      } else {
        toast.error("Failed to send reply");
      }
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <div style={cardStyle}>
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            Loading request details...
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
    return (
      <PageWrapper>
        <div style={cardStyle}>
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            Request not found
          </div>
        </div>
      </PageWrapper>
    );
  }

  const publicNotes = request.notes.filter((note) => note.visibility === "public");

  return (
    <PageWrapper>
      <div style={{ maxWidth: "1180px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--card-bg)",
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={15} />
            Back to Support
          </Button>
          <StatusBadge status={request.status} />
        </div>

        <div style={cardStyle}>
          <div style={{ padding: "20px", borderBottom: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
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
                <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  Support Conversation
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={13} />
                    {formatDate(request.createdAt)}
                  </span>
                  {(request.currentPlan || request.requestedPlan) && (
                    <span>{formatPlanMovement(request.currentPlan, request.requestedPlan)}</span>
                  )}
                </div>
              </div>
              <div style={{
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--input-bg)",
                border: "1px solid var(--card-border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <MessageSquare size={16} style={{ color: "var(--text-muted)" }} />
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                    Messages
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                    {publicNotes.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px" }}>
            <div style={{
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--card-border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
                  color: "var(--brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Original Request
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Submitted {formatDate(request.createdAt)}
                  </div>
                </div>
              </div>
              <p style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
              }}>
                {request.message || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: "16px" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "var(--input-bg)",
                border: "1px solid var(--card-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}>
                <MessageSquare size={16} />
              </div>
              <div>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Conversation History
                </h2>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Messages shared between you and support
                </p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "var(--page-bg)", minHeight: "200px" }}>
            {publicNotes.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  backgroundColor: "var(--input-bg)",
                  border: "1px dashed var(--card-border)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  marginBottom: "12px",
                }}>
                  <MessageSquare size={18} />
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  No public replies yet.
                </p>
              </div>
            ) : (
              <ScrollArea style={{ height: publicNotes.length > 3 ? "min(400px, calc(100vh - 480px))" : "auto" }}>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {publicNotes.map((note) => {
                    const isAdmin = !note.user.name.toLowerCase().includes("customer");
                    return <ConversationMessage key={note.id} note={note} isAdmin={isAdmin} />;
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: "16px" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
              color: "var(--brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Send size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                Reply Composer
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Send a public reply to continue this support conversation.
              </p>
            </div>
          </div>

          <div style={{ padding: "20px" }}>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply..."
              style={{
                width: "100%",
                minHeight: "130px",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid var(--input-border)",
                backgroundColor: "var(--input-bg)",
                color: "var(--text-primary)",
                fontSize: "14px",
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "color-mix(in srgb, var(--brand) 50%, transparent)";
                e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--brand) 15%, transparent)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--input-border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            backgroundColor: "var(--input-bg)",
          }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Replies are visible in the conversation.
            </span>
            <Button
              onClick={handleReply}
              disabled={submitting || !reply}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "var(--brand)",
                color: "var(--brand-text)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: submitting || !reply ? "not-allowed" : "pointer",
                opacity: submitting || !reply ? 0.6 : 1,
                transition: "all 0.15s ease",
                boxShadow: submitting || !reply ? "none" : "0 6px 16px rgba(196,151,58,0.2)",
              }}
            >
              <Send size={14} />
              {submitting ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function ConversationMessage({ note, isAdmin }: { note: Note; isAdmin: boolean }) {
  return (
    <div style={{
      display: "flex",
      gap: "12px",
      justifyContent: isAdmin ? "flex-end" : "flex-start",
      position: "relative",
    }}>
      {!isAdmin && (
        <div style={{
          position: "relative",
          zIndex: 1,
        }}>
          <Avatar style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid var(--card-border)",
            backgroundColor: "var(--input-bg)",
            flexShrink: 0,
          }}>
            <AvatarFallback style={{
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              fontSize: "11px",
              fontWeight: 600,
            }}>
              <User size={14} />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div style={{
        maxWidth: "75%",
        display: "flex",
        flexDirection: "column",
        alignItems: isAdmin ? "flex-end" : "flex-start",
        gap: "4px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          color: "var(--text-muted)",
          padding: "0 4px",
        }}>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "13px" }}>{note.user.name}</span>
          <span style={{
            padding: "2px 7px",
            borderRadius: "999px",
            fontSize: "9px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.3px",
            backgroundColor: isAdmin ? "color-mix(in srgb, var(--brand) 15%, transparent)" : "var(--input-bg)",
            color: isAdmin ? "var(--brand)" : "var(--text-muted)",
            border: `1px solid ${isAdmin ? "color-mix(in srgb, var(--brand) 25%, transparent)" : "var(--card-border)"}`,
          }}>
            {isAdmin ? "Support" : "You"}
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{formatConversationTime(note.createdAt)}</span>
        </div>

        <div style={{
          padding: "14px 16px",
          borderRadius: isAdmin ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
          fontSize: "14px",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          backgroundColor: isAdmin ? "var(--brand)" : "var(--card-bg)",
          color: isAdmin ? "var(--brand-text)" : "var(--text-primary)",
          border: isAdmin ? "none" : "1px solid var(--card-border)",
          boxShadow: isAdmin ? "0 10px 28px rgba(196,151,58,0.22), 0 2px 8px rgba(196,151,58,0.12)" : "0 6px 16px rgba(0,0,0,0.05)",
          transition: "transform 0.15s ease",
        }}>
          {note.note}
        </div>
      </div>

      {isAdmin && (
        <div style={{
          position: "relative",
          zIndex: 1,
        }}>
          <Avatar style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid color-mix(in srgb, var(--brand) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
            color: "var(--brand)",
            flexShrink: 0,
          }}>
            <AvatarFallback style={{
              backgroundColor: "transparent",
              color: "var(--brand)",
              fontSize: "11px",
              fontWeight: 600,
            }}>
              <Bot size={14} />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
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
      gap: "5px",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "11px",
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

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatConversationTime(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  overflow: "hidden",
};