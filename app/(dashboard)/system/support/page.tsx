"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";

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

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Support Requests</h1>
        
        {requests.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No support requests yet.</Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/system/support/${request.id}`)}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{getTypeLabel(request.type)}</p>
                    <p className="text-sm text-muted-foreground truncate">{request.message}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={getStatusLabel(request.status)} />
                    <span className="text-sm text-muted-foreground">{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
