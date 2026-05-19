"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Lock, MessageSquare, Send, CheckCircle, Clock, XCircle, RotateCcw, Building2, User, Mail, Calendar, Tag, FileText, Hash, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getTypeLabel, getPlanLabel } from "@/lib/ui-labels";
import { cn } from "@/lib/utils";

type RequestStatus = "pending" | "in_review" | "contacted" | "approved" | "rejected" | "resolved";

interface SubscriptionRequest {
  id: number;
  business: { name: string; slug: string };
  requester: { name: string; email: string };
  type: string;
  currentPlan: string;
  requestedPlan: string | null;
  message: string | null;
  status: RequestStatus;
  createdAt: string;
  notes: { id: number; note: string; user: { name: string }; createdAt: string; visibility: string }[];
}

const STATUS_CONFIG: { status: RequestStatus; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { status: "pending", label: "Pending", icon: <Clock size={16} />, color: "#b45309", bg: "#fffbeb" },
  { status: "in_review", label: "In Review", icon: <RotateCcw size={16} />, color: "#7c3aed", bg: "#f5f3ff" },
  { status: "contacted", label: "Contacted", icon: <MessageSquare size={16} />, color: "#1d4ed8", bg: "#eff6ff" },
  { status: "approved", label: "Approved", icon: <CheckCircle size={16} />, color: "#15803d", bg: "#f0fdf4" },
  { status: "rejected", label: "Rejected", icon: <XCircle size={16} />, color: "#b91c1c", bg: "#fef2f2" },
  { status: "resolved", label: "Resolved", icon: <CheckCircle size={16} />, color: "#15803d", bg: "#f0fdf4" },
];

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  contacted: "Contacted",
  approved: "Approved",
  rejected: "Rejected",
  resolved: "Resolved",
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<SubscriptionRequest | null>(null);
  const [note, setNote] = useState("");
  const id = params.id as string;

  useEffect(() => {
    fetchRequest();
  }, [id]);

  async function fetchRequest() {
    const res = await fetch(`/api/platform/requests/${id}`);
    const data = await res.json();
    if (res.ok) setRequest(data.data);
  }

  async function updateStatus(status: RequestStatus) {
    const res = await fetch(`/api/platform/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Status updated");
      fetchRequest();
    }
  }

  async function addNote(visibility: "internal" | "public") {
    if (!note.trim()) return;
    const res = await fetch(`/api/platform/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, visibility }),
    });
    if (res.ok) {
      setNote("");
      toast.success(`${visibility === 'internal' ? 'Internal note' : 'Public reply'} added`);
      fetchRequest();
    }
  }

  if (!request) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div>
    </div>
  );

  const currentStatusConfig = STATUS_CONFIG.find(s => s.status === request.status) || STATUS_CONFIG[0];

  return (
    <PageWrapper>
      <div className="min-h-screen bg-slate-50 py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Requests
          </button>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 lg:p-8">
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 rounded-2xl">
                        <Building2 size={24} className="text-slate-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900">{request.business.name}</h1>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm text-slate-500 flex items-center gap-1.5">
                            <User size={14} />
                            {request.requester.name}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-sm text-slate-500 flex items-center gap-1.5">
                            <Mail size={14} />
                            {request.requester.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
                      style={{ backgroundColor: currentStatusConfig.bg, color: currentStatusConfig.color }}
                    >
                      {currentStatusConfig.icon}
                      {currentStatusConfig.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Type</p>
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-slate-400" />
                        <span className="font-semibold text-slate-700">{getTypeLabel(request.type)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Current Plan</p>
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-slate-400" />
                        <span className="font-semibold text-slate-700">{getPlanLabel(request.currentPlan)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Requested</p>
                      <span className="font-semibold text-slate-900">
                        {request.requestedPlan ? getPlanLabel(request.requestedPlan) : "—"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Created</p>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="font-semibold text-slate-700">{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mt-6 p-5 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-500">Initial Message</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{request.message}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 lg:px-8 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={20} className="text-slate-500" />
                    <h2 className="text-xl font-bold text-slate-900">Conversation</h2>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                      {request.notes.length}
                    </span>
                  </div>
                </div>

                <div className="p-6 lg:p-8">
                  <div className="space-y-5 mb-8 max-h-[400px] overflow-y-auto pr-2">
                    {request.notes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-4">
                          <MessageSquare size={28} className="text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">No messages or notes yet</p>
                      </div>
                    ) : (
                      request.notes.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "p-5 rounded-2xl border",
                            n.visibility === 'internal'
                              ? 'bg-amber-50/80 border-amber-100'
                              : 'bg-slate-50 border-slate-100'
                          )}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {n.visibility === 'internal' ? (
                                <Lock size={15} className="text-amber-500" />
                              ) : (
                                <MessageSquare size={15} className="text-slate-500" />
                              )}
                              <span className={cn(
                                "font-semibold",
                                n.visibility === 'internal' ? 'text-amber-800' : 'text-slate-800'
                              )}>
                                {n.user.name}
                              </span>
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium",
                                n.visibility === 'internal'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-200 text-slate-600'
                              )}>
                                {n.visibility === 'internal' ? 'Internal Note' : 'Public Reply'}
                              </span>
                            </div>
                            <span className="text-sm text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-slate-700 leading-relaxed">{n.note}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Type your message or note..."
                      className="bg-white border-slate-200 shadow-sm min-h-[140px] text-base mb-4 rounded-xl resize-none"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <p className="text-sm text-slate-500">
                        <span className="font-medium text-slate-600">Public Reply</span> visible to customer —
                        <span className="font-medium text-amber-600 ml-1">Internal Note</span> only for team
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => addNote('public')}
                          disabled={!note.trim()}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 h-10 rounded-lg"
                        >
                          <Send size={16} className="mr-2" />
                          Public Reply
                        </Button>
                        <Button
                          onClick={() => addNote('internal')}
                          disabled={!note.trim()}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-5 h-10 rounded-lg"
                        >
                          <Lock size={16} className="mr-2" />
                          Internal Note
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <Clock size={18} className="text-slate-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Status Workflow</h3>
                </div>
                <div className="space-y-2">
                  {STATUS_CONFIG.filter(s => s.status !== 'contacted').map((s) => (
                    <button
                      key={s.status}
                      onClick={() => updateStatus(s.status)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                        request.status === s.status
                          ? ""
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      )}
                      style={request.status !== s.status ? {} : { backgroundColor: s.bg, color: s.color }}
                    >
                      {s.icon}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <Hash size={18} className="text-slate-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Request Details</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Request ID</span>
                    <span className="font-mono font-semibold text-slate-700">#{request.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Business</span>
                    <span className="font-mono font-semibold text-slate-700">{request.business.slug}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">Created</span>
                    <span className="font-semibold text-slate-700">{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-500">Messages</span>
                    <span className="font-semibold text-slate-700">{request.notes.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <Building2 size={18} className="text-slate-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Business Info</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Business Name</p>
                    <p className="font-semibold text-slate-800">{request.business.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Requester</p>
                    <p className="font-semibold text-slate-800">{request.requester.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Email</p>
                    <p className="font-semibold text-slate-800">{request.requester.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Current Plan</p>
                    <p className="font-semibold text-slate-800">{getPlanLabel(request.currentPlan)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}