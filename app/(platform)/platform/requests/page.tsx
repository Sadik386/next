"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, Clock, CheckCircle, AlertCircle, BarChart3, Users, Inbox, ArrowUpRight, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";
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
  notes: { note: string; user: { name: string }; createdAt: string }[];
}

interface AnalyticsSummary {
  total: number;
  pending: number;
  in_review: number;
  resolved: number;
}

const STATUS_CONFIG: Record<RequestStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-50 text-amber-700", text: "text-amber-700", dot: "bg-amber-500" },
  in_review: { bg: "bg-violet-50 text-violet-700", text: "text-violet-700", dot: "bg-violet-500" },
  contacted: { bg: "bg-blue-50 text-blue-700", text: "text-blue-700", dot: "bg-blue-500" },
  approved: { bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected: { bg: "bg-red-50 text-red-700", text: "text-red-700", dot: "bg-red-500" },
  resolved: { bg: "bg-slate-100 text-slate-600", text: "text-slate-600", dot: "bg-slate-400" },
};

export default function SubscriptionRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<RequestStatus | "all">("all");
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({ total: 0, pending: 0, in_review: 0, resolved: 0 });

  const fetchRequests = async () => {
    let url = `/api/platform/requests?search=${search}`;
    if (activeTab !== "all") url += `&status=${activeTab}`;

    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) {
      setRequests(data.data.items);
      if (data.data.analytics) {
        setAnalytics(data.data.analytics);
      } else {
        const items = data.data.items as SubscriptionRequest[];
        setAnalytics({
          total: items.length,
          pending: items.filter(i => i.status === 'pending').length,
          in_review: items.filter(i => i.status === 'in_review').length,
          resolved: items.filter(i => i.status === 'resolved').length,
        });
      }
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, activeTab]);

  const tabs: { value: RequestStatus | "all"; label: string; count?: number }[] = [
    { value: "all", label: "All Requests" },
    { value: "pending", label: "Pending", count: analytics.pending },
    { value: "in_review", label: "In Review", count: analytics.in_review },
    { value: "resolved", label: "Resolved", count: analytics.resolved },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Subscription Requests</h1>
            <p className="text-slate-500 mt-1.5">Manage and respond to business upgrade requests</p>
            
          </div>
          <div className="w-full lg:w-96">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search businesses or emails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-11 bg-white border-slate-200 shadow-sm text-base rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.total}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl">
                <BarChart3 size={22} className="text-slate-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock size={22} className="text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-violet-600 uppercase tracking-wide">In Review</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.in_review}</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-xl">
                <AlertCircle size={22} className="text-violet-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Resolved</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{analytics.resolved}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle size={22} className="text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all",
                activeTab === tab.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 text-xs rounded-md",
                  activeTab === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-200 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto mb-5">
                <Inbox size={32} className="text-slate-400" />
              </div>
              <p className="text-slate-700 font-medium text-lg">No requests found</p>
              <p className="text-slate-400 mt-2">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            requests.map((req) => {
              const statusStyle = STATUS_CONFIG[req.status];
              return (
                <div
                  key={req.id}
                  onClick={() => router.push(`/platform/requests/${req.id}`)}
                  className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex flex-col items-center gap-3 pt-1">
                      <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", statusStyle.dot)} />
                    </div>

                    <div className="p-2.5 bg-slate-100 rounded-xl flex-shrink-0">
                      <Building2 size={20} className="text-slate-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-semibold text-slate-900">{req.business.name}</span>
                        {req.requestedPlan && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                            <ArrowUpRight size={12} />
                            {getPlanLabel(req.requestedPlan)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Users size={14} />
                          {req.requester.name}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate">{req.requester.email}</span>
                      </div>

                      {req.message && (
                        <p className="text-sm text-slate-400 mt-2 line-clamp-2">{req.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-5 flex-shrink-0">
                      <div className="hidden lg:flex items-center gap-5 text-sm">
                        <span className="font-medium text-slate-600">{getTypeLabel(req.type)}</span>
                        <span className="text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn("px-3 py-1.5 rounded-full text-xs font-semibold", statusStyle.bg)}>
                          {getStatusLabel(req.status)}
                        </span>
                        <div className="p-2 rounded-xl text-slate-300 group-hover:bg-slate-100 group-hover:text-slate-600 transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}