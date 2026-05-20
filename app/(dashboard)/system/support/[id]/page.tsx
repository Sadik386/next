"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, MessageSquare, Bot, Clock, CheckCircle2, AlertCircle, XCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";

type Note = {
  id: number;
  note: string;
  user: { id: number; name: string };
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const id = params.id as string;

  useEffect(() => {
    fetchRequest();
  }, [id]);

  useEffect(() => {
    if (request && request.notes.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [request?.notes.length]);

  async function fetchRequest() {
    try {
      const res = await fetch(`/api/support/requests/${id}`);
      const data = await res.json();
      if (res.ok) {
        console.log('API Response:', JSON.stringify(data, null, 2));
        console.log('currentUserId from API:', data.currentUserId);
        console.log('Notes from API:', JSON.stringify(data.data?.notes, null, 2));
        setRequest(data.data);
        setCurrentUserId(data.currentUserId ?? null);
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
        <div style={pageContainerStyle}>
          <div style={loadingStyle}>Loading conversation...</div>
        </div>
      </PageWrapper>
    );
  }

  if (!request) {
    return (
      <PageWrapper>
        <div style={pageContainerStyle}>
          <div style={loadingStyle}>Request not found</div>
        </div>
      </PageWrapper>
    );
  }

  const publicNotes = request.notes.filter((note) => note.visibility === "public");

  return (
    <PageWrapper>
      <div style={layoutContainer}>
        <div style={topBarStyle}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            style={backButtonStyle}
          >
            <ArrowLeft size={14} />
            Back
          </Button>
          <div style={metaPillsStyle}>
            <StatusBadge status={request.status} />
            <span style={typePillStyle}>{getTypeLabel(request.type)}</span>
            <span style={idPillStyle}>#{request.id}</span>
          </div>
          <div style={topRightMetaStyle}>
            {(request.currentPlan || request.requestedPlan) && (
              <span style={planBadgeStyle}>
                {formatPlanMovement(request.currentPlan, request.requestedPlan)}
              </span>
            )}
            <span style={dateStyle}>
              <Clock size={11} />
              {formatDate(request.createdAt)}
            </span>
          </div>
        </div>

        <div style={requestBannerStyle}>
          <span style={requestLabelStyle}>Request:</span>
          <span style={requestTextStyle}>{request.message || "No description"}</span>
        </div>

        <div style={conversationContainer}>
          <div style={conversationHeaderStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={conversationIconStyle}>
                <MessageSquare size={14} />
              </div>
              <span style={conversationTitleStyle}>Conversation</span>
            </div>
            <span style={messageCountStyle}>{publicNotes.length} messages</span>
          </div>

          <div style={messagesAreaStyle}>
            {publicNotes.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={emptyIconWrapperStyle}>
                  <MessageSquare size={20} />
                </div>
                <p style={emptyTitleStyle}>No messages yet</p>
                <p style={emptySubtitleStyle}>Start the conversation below</p>
              </div>
            ) : (
              <div style={threadStyle}>
                {publicNotes.map((note, index) => {
                  const isOwnMessage = currentUserId !== null && note.user.id === currentUserId;
                  const showConnector = index < publicNotes.length - 1 &&
                    publicNotes[index + 1].user.id === note.user.id;
                  console.log('Debug note:', {
                    noteUserId: note.user.id,
                    currentUserId,
                    isOwnMessage,
                    label: isOwnMessage ? "You" : "Accoraze Support"
                  });
                  return (
                    <ConversationMessage 
                      key={note.id} 
                      note={note} 
                      isOwnMessage={isOwnMessage}
                      showConnector={showConnector}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div style={composerWrapperStyle}>
            <div style={composerStyle}>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply..."
                style={composerInputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--brand)";
                  e.target.style.boxShadow = "0 0 0 2px var(--brand-alpha-10)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--input-border)";
                  e.target.style.boxShadow = "none";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <Button
                onClick={handleReply}
                disabled={submitting || !reply}
                style={{
                  ...sendButtonStyle,
                  ...(submitting || !reply ? disabledButtonStyle : {}),
                }}
              >
                <Send size={15} />
              </Button>
            </div>
            <p style={composerHintStyle}>Press Enter to send • Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function ConversationMessage({ 
  note, 
  isOwnMessage, 
  showConnector 
}: { 
  note: Note; 
  isOwnMessage: boolean;
  showConnector?: boolean;
}) {
  return (
    <div style={messageWrapperStyle(isOwnMessage)}>
      <div style={messageRowStyle}>
        {!isOwnMessage && (
          <div style={avatarColumnStyle}>
            <div style={avatarCircleStyle(isOwnMessage)}>
              <Avatar style={avatarStyle}>
                <AvatarFallback style={avatarFallbackBrandStyle}>
                  <Bot size={13} />
                </AvatarFallback>
              </Avatar>
            </div>
            {showConnector && <div style={threadLineStyle} />}
          </div>
        )}

        <div style={messageContentStyle}>
          <div style={messageMetaStyle}>
            <span style={senderNameStyle(isOwnMessage)}>
              {isOwnMessage ? "You" : "Accoraze Support"}
            </span>
            <span style={timeSeparatorStyle}>·</span>
            <span style={timestampStyle}>{formatConversationTime(note.createdAt)}</span>
          </div>
          <div style={bubbleStyle(isOwnMessage)}>
            {note.note}
          </div>
        </div>

        {isOwnMessage && (
          <div style={avatarColumnStyle}>
            <div style={avatarCircleStyle(isOwnMessage)}>
              <Avatar style={avatarStyle}>
                <AvatarFallback style={avatarFallbackStyle}>
                  <User size={13} />
                </AvatarFallback>
              </Avatar>
            </div>
            {showConnector && <div style={threadLineStyle} />}
          </div>
        )}
      </div>
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
      gap: "4px",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "10px",
      fontWeight: 600,
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
    return `→ ${getPlanLabel(requestedPlan)}`;
  }
  return getPlanLabel(currentPlan ?? "");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatConversationTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const pageContainerStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  overflow: "hidden",
};

const loadingStyle: React.CSSProperties = {
  padding: "32px",
  textAlign: "center",
  color: "var(--text-muted)",
  fontSize: "14px",
};

const layoutContainer: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "16px 20px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  minHeight: "calc(100vh - 100px)",
};

const topBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const backButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 10px",
  borderRadius: "6px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};

const metaPillsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const typePillStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "5px",
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "uppercase",
  backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
  color: "var(--brand)",
  border: "1px solid color-mix(in srgb, var(--brand) 20%, transparent)",
};

const idPillStyle: React.CSSProperties = {
  padding: "3px 7px",
  borderRadius: "5px",
  fontSize: "11px",
  fontWeight: 600,
  fontFamily: "monospace",
  backgroundColor: "var(--input-bg)",
  color: "var(--text-muted)",
  border: "1px solid var(--card-border)",
};

const topRightMetaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginLeft: "auto",
};

const planBadgeStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "5px",
  fontSize: "11px",
  fontWeight: 600,
  backgroundColor: "var(--input-bg)",
  color: "var(--text-secondary)",
  border: "1px solid var(--card-border)",
};

const dateStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "11px",
  color: "var(--text-muted)",
};

const requestBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
  border: "1px solid var(--card-border)",
  overflow: "hidden",
};

const requestLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--text-muted)",
  flexShrink: 0,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const requestTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-secondary)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const conversationContainer: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
};

const conversationHeaderStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderBottom: "1px solid var(--card-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const conversationIconStyle: React.CSSProperties = {
  width: "24px",
  height: "24px",
  borderRadius: "6px",
  backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)",
  color: "var(--brand)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const conversationTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const messageCountStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--text-muted)",
};

const messagesAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "16px",
  backgroundColor: "var(--page-bg)",
  minHeight: "140px",
};

const emptyStateStyle: React.CSSProperties = {
  height: "100%",
  minHeight: "200px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

const emptyIconWrapperStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "20px",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text-muted)",
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--text-primary)",
};

const emptySubtitleStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-muted)",
};

const threadStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const messageWrapperStyle = (isOwnMessage: boolean): React.CSSProperties => ({
  display: "flex",
  justifyContent: isOwnMessage ? "flex-end" : "flex-start",
});

const messageRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  maxWidth: "65%",
  alignItems: "flex-start",
};

const avatarColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  flexShrink: 0,
  width: "28px",
};

const avatarCircleStyle = (isOwnMessage: boolean): React.CSSProperties => ({
  width: "28px",
  height: "28px",
  borderRadius: "14px",
  border: isOwnMessage 
    ? "1px solid var(--card-border)"
    : "2px solid color-mix(in srgb, var(--brand) 30%, transparent)",
  backgroundColor: isOwnMessage 
    ? "var(--input-bg)"
    : "color-mix(in srgb, var(--brand) 12%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: isOwnMessage ? "var(--text-muted)" : "var(--brand)",
  overflow: "hidden",
});

const avatarStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
};

const avatarFallbackStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "var(--text-muted)",
  fontSize: "11px",
};

const avatarFallbackBrandStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "var(--brand)",
  fontSize: "11px",
};

const threadLineStyle: React.CSSProperties = {
  width: "2px",
  flex: 1,
  minHeight: "20px",
  backgroundColor: "var(--card-border)",
  marginTop: "4px",
  borderRadius: "1px",
};

const messageContentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  flex: 1,
};

const messageMetaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "0 2px",
};

const senderNameStyle = (isOwnMessage: boolean): React.CSSProperties => ({
  fontSize: "11px",
  fontWeight: 600,
  color: isOwnMessage ? "var(--text-primary)" : "var(--brand)",
});

const timeSeparatorStyle: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: "10px",
};

const timestampStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "var(--text-muted)",
};

const bubbleStyle = (isOwnMessage: boolean): React.CSSProperties => ({
  padding: "10px 14px",
  borderRadius: isOwnMessage ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
  fontSize: "13px",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  backgroundColor: isOwnMessage ? "var(--brand)" : "var(--card-bg)",
  color: isOwnMessage ? "var(--brand-text)" : "var(--text-primary)",
  border: isOwnMessage ? "none" : "1px solid var(--card-border)",
  boxShadow: isOwnMessage ? "0 2px 8px rgba(0,0,0,0.08)" : "0 1px 2px rgba(0,0,0,0.03)",
});

const composerWrapperStyle: React.CSSProperties = {
  position: "sticky",
  bottom: 0,
  padding: "16px 20px",
  borderTop: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  borderRadius: "0 0 15px 15px",
  zIndex: 10,
};

const composerStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  alignItems: "flex-end",
  backgroundColor: "var(--input-bg)",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid var(--card-border)",
};

const composerInputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: "40px",
  maxHeight: "80px",
  padding: "6px 8px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "transparent",
  color: "var(--text-primary)",
  fontSize: "13px",
  lineHeight: 1.4,
  resize: "none",
  outline: "none",
};

const sendButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "38px",
  height: "38px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "var(--brand-text)",
  cursor: "pointer",
  flexShrink: 0,
  transition: "all 0.15s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const disabledButtonStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const composerHintStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "var(--text-muted)",
  marginTop: "6px",
  textAlign: "center",
};