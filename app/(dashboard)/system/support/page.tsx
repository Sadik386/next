"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getStatusLabel, getTypeLabel } from "@/lib/ui-labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageSquare } from "lucide-react";

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

  if (loading) return <div className="p-4 text-center">Loading requests...</div>;

  return (
    <PageWrapper>
      <PageHeader 
        title="Support Requests" 
        subtitle="Manage and respond to customer subscription and support requests."
      />
      
      {requests.length === 0 ? (
        <EmptyState 
          icon={<MessageSquare />}
          title="No support requests"
          description="There are currently no open support or subscription requests to display."
        />
      ) : (
        <div className="grid gap-3">
          {requests.map((request) => (
            <Card 
              key={request.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors" 
              onClick={() => router.push(`/system/support/${request.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{getTypeLabel(request.type)}</span>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">#{request.id}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{request.message || "No description provided"}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm text-muted-foreground">{new Date(request.createdAt).toLocaleDateString()}</span>
                  <StatusBadge status={getStatusLabel(request.status)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
