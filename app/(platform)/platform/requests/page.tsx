"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";

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

export default function SubscriptionRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<RequestStatus | "all">("all");

  const fetchRequests = async () => {
    let url = `/api/platform/requests?search=${search}`;
    if (activeTab !== "all") url += `&status=${activeTab}`;

    const res = await fetch(url);
    const data = await res.json();
    if (res.ok) setRequests(data.data.items);
  };

  useEffect(() => {
    fetchRequests();
  }, [search, activeTab]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Subscription Requests</h1>
        <input 
          placeholder="Search business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--input-border)", fontSize: "13px" }}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {(["all", "pending", "in_review", "resolved"] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: "6px 14px", borderRadius: "8px", border: "none", fontSize: "13px",
              backgroundColor: activeTab === tab ? "var(--brand)" : "var(--card-bg)",
              color: activeTab === tab ? "white" : "var(--text-secondary)",
              cursor: "pointer"
            }}
          >
            {tab === 'all' ? 'All' : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--card-border)" }}>
        {requests.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            No requests found.
          </div>
        ) : requests.map((req) => (
          <div key={req.id} 
            onClick={() => router.push(`/platform/requests/${req.id}`)}
            style={{ padding: "12px 16px", borderBottom: "1px solid var(--card-border)", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "2px" }}>{req.business.name}</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "8px" }}>
                <span>{getTypeLabel(req.type)}</span>
                {req.requestedPlan && <span style={{ color: "var(--brand)" }}>→ {getPlanLabel(req.requestedPlan)}</span>}
              </div>
              {req.message && (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {req.message}
                </div>
              )}
            </div>
            <StatusBadge status={getStatusLabel(req.status)} />
            <div style={{ fontSize: "12px", color: "var(--text-muted)", width: "80px", textAlign: "right" }}>{new Date(req.createdAt).toLocaleDateString()}</div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>
        ))}
      </div>
    </div>
  );
}
