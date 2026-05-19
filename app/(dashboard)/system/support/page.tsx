"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getPlanLabel, getStatusLabel, getTypeLabel } from "@/lib/ui-labels";
import { ChevronRight, Clock, Inbox, MessageSquare } from "lucide-react";

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

  return (
    <PageWrapper>
      <div className="flex flex-col gap-6 pb-8">
        <SupportHero requestCount={requests.length} loading={loading} />

        {loading ? (
          <Card className={surfaceCardClass}>
            <CardContent className="p-8 text-center text-sm font-medium text-[var(--text-secondary)]">
              Loading requests...
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card className={surfaceCardClass}>
            <CardContent className="px-5 py-12 sm:px-8">
              <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ece3cf] bg-[#fff8e8] text-[var(--brand)] shadow-[0_12px_28px_rgba(196,151,58,0.14)]">
                  <MessageSquare size={24} strokeWidth={1.8} />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  No support requests
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  There are currently no open support or subscription requests to display.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className={surfaceCardClass}>
            <CardHeader className="px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ece3cf] bg-[#fff8e8] text-[var(--brand)] shadow-[0_12px_28px_rgba(196,151,58,0.12)]">
                    <Inbox size={20} strokeWidth={1.9} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-semibold tracking-normal text-[var(--text-primary)]">
                      Request Inbox
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)]">
                      Review the latest customer messages and subscription requests.
                    </CardDescription>
                  </div>
                </div>
                <Badge className="w-fit rounded-full border border-[#e6edf5] bg-[#f7f9fc] px-3 py-1 text-xs font-semibold text-[#536173] shadow-sm hover:bg-[#f7f9fc]">
                  {requests.length} {requests.length === 1 ? "request" : "requests"}
                </Badge>
              </div>
            </CardHeader>
            <Separator className="bg-[#eef1f5]" />
            <CardContent className="bg-[#fbfcfe] p-3 sm:p-4">
              <div className="flex flex-col gap-3">
                {requests.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    className="group grid w-full gap-4 rounded-2xl border border-[#e7ebf0] bg-white p-4 text-left shadow-[0_10px_26px_rgba(17,19,24,0.04)] transition-all duration-200 hover:border-[#ece3cf] hover:bg-[#fffaf0] hover:shadow-[0_18px_38px_rgba(17,19,24,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C4973A]/15 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"
                    onClick={() => router.push(`/system/support/${request.id}`)}
                  >
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <TypePill type={request.type} />
                        <Badge className="rounded-full border border-[#e7ebf0] bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-[#7b8493] shadow-sm hover:bg-white">
                          #{request.id}
                        </Badge>
                        <StatusPill status={request.status} />
                      </div>
                      <p className="truncate text-[15px] font-semibold leading-6 text-[var(--text-primary)]">
                        {request.message || "No description provided"}
                      </p>
                      {(request.currentPlan || request.requestedPlan) && (
                        <p className="mt-1.5 text-sm leading-5 text-[var(--text-secondary)]">
                          {formatPlanMovement(request.currentPlan, request.requestedPlan)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-muted)] sm:justify-end">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#f7f9fc] px-3 py-1.5 text-xs font-medium text-[#687386]">
                        <Clock size={14} />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7ebf0] bg-white text-[#8a94a6] shadow-sm transition-all group-hover:translate-x-0.5 group-hover:border-[#e6d8b7] group-hover:text-[var(--brand)]">
                        <ChevronRight size={17} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
            <Separator className="bg-[#eef1f5]" />
            <CardFooter className="flex flex-col gap-2 px-5 py-4 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <span>Open a request to view the conversation and respond.</span>
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Updated from support requests
              </span>
            </CardFooter>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

function SupportHero({ requestCount, loading }: { requestCount: number; loading: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e6edf5] bg-white px-3 py-1 text-xs font-semibold uppercase text-[#687386] shadow-sm">
          <MessageSquare size={13} />
          Support center
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[28px]">
          Support Requests
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Manage customer subscription questions and support follow-ups from one clean inbox.
        </p>
      </div>
      <div className="w-fit rounded-2xl border border-[#e8eaef] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(17,19,24,0.06)]">
        <div className="text-2xl font-bold leading-none text-[var(--text-primary)]">
          {loading ? "-" : requestCount}
        </div>
        <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
          total requests
        </div>
      </div>
    </div>
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
    <Badge className={`rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm ${getStatusBadgeClass(status)}`}>
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

const surfaceCardClass =
  "overflow-hidden rounded-2xl border border-[#e8eaef] bg-white text-[var(--text-primary)] shadow-[0_22px_70px_rgba(17,19,24,0.08)]";
