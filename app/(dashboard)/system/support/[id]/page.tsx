"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, MessageSquare, Bot, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <Card className={surfaceCardClass}>
          <CardContent className="p-8 text-center text-sm font-medium text-[var(--text-secondary)]">
            Loading request details...
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  if (!request) {
    return (
      <PageWrapper>
        <Card className={surfaceCardClass}>
          <CardContent className="p-8 text-center text-sm font-medium text-[var(--text-secondary)]">
            Request not found
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  const publicNotes = request.notes.filter((note) => note.visibility === "public");

  return (
    <PageWrapper>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-8 sm:gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            className="h-10 w-fit rounded-xl px-3 text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)] hover:shadow-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} />
            Back to Support
          </Button>
          <StatusPill status={request.status} />
        </div>

        <Card className={surfaceCardClass}>
          <CardHeader className="px-5 py-6 sm:px-7 sm:py-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <TypePill type={request.type} />
                  <Badge className="rounded-full border border-[#e7ebf0] bg-white px-3 py-1 font-mono text-[11px] font-semibold text-[#7b8493] shadow-sm hover:bg-white">
                    #{request.id}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[28px]">
                  Support Conversation
                </CardTitle>
                <CardDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm leading-6 text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-2">
                    <Clock size={15} />
                    {formatDate(request.createdAt)}
                  </span>
                  {(request.currentPlan || request.requestedPlan) && (
                    <span>{formatPlanMovement(request.currentPlan, request.requestedPlan)}</span>
                  )}
                </CardDescription>
              </div>
              <div className="rounded-2xl border border-[#e8eaef] bg-[#f8fafc] px-4 py-3 shadow-sm">
                <div className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  Public replies
                </div>
                <div className="mt-1 text-2xl font-bold leading-none text-[var(--text-primary)]">
                  {publicNotes.length}
                </div>
              </div>
            </div>
          </CardHeader>
          <Separator className="bg-[#eef1f5]" />
          <CardContent className="p-5 sm:p-7">
            <div className="rounded-2xl border border-[#e8edf3] bg-[#f8fafc] p-5 shadow-inner shadow-slate-100/80">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ece3cf] bg-[#fff8e8] text-[var(--brand)] shadow-sm">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Original Request
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Submitted {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-[var(--text-secondary)]">
                {request.message || "No description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className={surfaceCardClass}>
          <CardHeader className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-lg font-semibold tracking-normal text-[var(--text-primary)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e6edf5] bg-[#f7f9fc] text-[#687386] shadow-sm">
                    <MessageSquare size={18} />
                  </span>
                  Conversation History
                </CardTitle>
                <CardDescription className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Public messages shared between the customer and support.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator className="bg-[#eef1f5]" />
          <CardContent className="bg-[#fbfcfe] p-0">
            <ScrollArea className={publicNotes.length > 4 ? "h-[min(620px,calc(100vh-260px))]" : ""}>
              <div className="p-4 sm:p-7">
                {publicNotes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#dce3eb] bg-white px-5 py-10 text-center text-sm font-medium text-[var(--text-secondary)] shadow-sm">
                    No public replies yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-7">
                    {publicNotes.map((note) => {
                      const isAdmin = !note.user.name.toLowerCase().includes("customer");
                      return <ConversationMessage key={note.id} note={note} isAdmin={isAdmin} />;
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className={surfaceCardClass}>
          <CardHeader className="px-5 py-5 sm:px-7 sm:py-6">
            <CardTitle className="text-lg font-semibold tracking-normal text-[var(--text-primary)]">
              Reply Composer
            </CardTitle>
            <CardDescription className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Send a public reply to continue this support conversation.
            </CardDescription>
          </CardHeader>
          <Separator className="bg-[#eef1f5]" />
          <CardContent className="p-5 sm:p-7">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply..."
              className="min-h-[168px] resize-y rounded-2xl border-[#e1e6ee] bg-[#fbfcfe] px-4 py-4 text-[15px] leading-7 text-[var(--text-primary)] shadow-inner shadow-slate-100/80 transition placeholder:text-[#9aa4b5] focus-visible:border-[#d4b46a] focus-visible:ring-4 focus-visible:ring-[#C4973A]/15 focus-visible:ring-offset-0"
            />
          </CardContent>
          <Separator className="bg-[#eef1f5]" />
          <CardFooter className="flex flex-col gap-3 bg-[#fbfcfe] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-sm text-[var(--text-secondary)]">
              Replies are visible in the customer conversation.
            </p>
            <Button
              onClick={handleReply}
              disabled={submitting || !reply}
              className="h-11 w-full rounded-xl bg-[var(--brand)] px-5 font-semibold text-[var(--brand-text)] shadow-[0_14px_28px_rgba(196,151,58,0.22)] transition hover:bg-[var(--brand-hover)] sm:w-auto"
            >
              <Send size={16} />
              {submitting ? "Sending..." : "Send Reply"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageWrapper>
  );
}

function ConversationMessage({ note, isAdmin }: { note: Note; isAdmin: boolean }) {
  return (
    <div className={`flex gap-3 sm:gap-4 ${isAdmin ? "justify-end" : "justify-start"}`}>
      {!isAdmin && <MessageAvatar name={note.user.name} isAdmin={false} />}
      <div className={`min-w-0 max-w-[calc(100%-3.25rem)] sm:max-w-[76%] ${isAdmin ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div className={`flex flex-wrap items-center gap-2 px-1 text-xs text-[var(--text-muted)] ${isAdmin ? "justify-end text-right" : ""}`}>
          <span className="font-semibold text-[var(--text-primary)]">{note.user.name}</span>
          <Badge className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-sm ${isAdmin ? "border-[#ece3cf] bg-[#fff8e8] text-[#8a6519] hover:bg-[#fff8e8]" : "border-[#dce3eb] bg-white text-[#687386] hover:bg-white"}`}>
            {isAdmin ? "Admin" : "Customer"}
          </Badge>
          <span>{formatConversationTime(note.createdAt)}</span>
        </div>
        <div className={`min-w-24 rounded-[22px] px-4 py-3 text-[15px] leading-7 shadow-[0_16px_34px_rgba(17,19,24,0.08)] sm:px-5 ${isAdmin ? "rounded-tr-md bg-[var(--brand)] text-[var(--brand-text)] shadow-[0_18px_38px_rgba(196,151,58,0.24)]" : "rounded-tl-md border border-[#e3e9f0] bg-white text-[var(--text-primary)]"}`}>
          <p className="whitespace-pre-wrap break-words">{note.note}</p>
        </div>
      </div>
      {isAdmin && <MessageAvatar name={note.user.name} isAdmin />}
    </div>
  );
}

function MessageAvatar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  return (
    <Avatar className={`h-10 w-10 border shadow-sm sm:h-11 sm:w-11 ${isAdmin ? "border-[#ece3cf] bg-[#fff8e8] text-[var(--brand)]" : "border-[#dce3eb] bg-white text-[#687386]"}`}>
      <AvatarFallback className="bg-transparent text-xs font-bold">
        {isAdmin ? <Bot size={17} /> : getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

function TypePill({ type }: { type: string }) {
  return (
    <Badge className="rounded-full border border-[#ece3cf] bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold text-[#8a6519] shadow-sm hover:bg-[#fff8e8]">
      {getTypeLabel(type)}
    </Badge>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <Badge className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm ${getStatusBadgeClass(status)}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {getStatusLabel(status)}
    </Badge>
  );
}

function getStatusBadgeClass(status: string): string {
  const key = status.toLowerCase();
  if (key === "approved" || key === "resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50";
  }
  if (key === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50";
  }
  if (key === "contacted" || key === "in_review") {
    return "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50";
  }
  return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50";
}

function formatPlanMovement(currentPlan: string | null, requestedPlan: string | null): string {
  if (currentPlan && requestedPlan) {
    return `${getPlanLabel(currentPlan)} to ${getPlanLabel(requestedPlan)}`;
  }
  if (requestedPlan) {
    return `Requested plan: ${getPlanLabel(requestedPlan)}`;
  }
  return `Current plan: ${getPlanLabel(currentPlan ?? "")}`;
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

function getInitials(name: string): string {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "?";
}

const surfaceCardClass =
  "overflow-hidden rounded-2xl border border-[#e8eaef] bg-white text-[var(--text-primary)] shadow-[0_22px_70px_rgba(17,19,24,0.08)]";
