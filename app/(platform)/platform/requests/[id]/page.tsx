"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Lock, MessageSquare, Send, CheckCircle, Clock, AlertCircle, XCircle, RotateCcw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    if (!note) return;
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

  if (!request) return <div>Loading...</div>;

  const STATUS_ICONS: Record<RequestStatus, React.ReactNode> = {
    pending: <Clock size={16} />,
    in_review: <RotateCcw size={16} />,
    contacted: <MessageSquare size={16} />,
    approved: <CheckCircle size={16} />,
    rejected: <XCircle size={16} />,
    resolved: <CheckCircle size={16} />,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
        <ArrowLeft size={16} className="mr-2" /> Back to Requests
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
                <CardTitle className="text-xl">
                    {request.business.name}
                    <p className="text-sm font-normal text-muted-foreground mt-1">Requester: {request.requester.name} ({request.requester.email})</p>
                </CardTitle>
                <StatusBadge status={getStatusLabel(request.status)} className="text-base px-4 py-1" />
              </CardHeader>
              <CardContent className="text-sm space-y-4 pt-6">
                  <div className="flex gap-4 p-4 bg-muted/30 rounded-xl border">
                      <div className="flex-1"><p className="text-muted-foreground text-xs uppercase font-semibold">Type</p><p className="font-semibold mt-1">{getTypeLabel(request.type)}</p></div>
                      {request.requestedPlan && <div className="flex-1"><p className="text-muted-foreground text-xs uppercase font-semibold">Requested Plan</p><p className="font-semibold mt-1 text-primary">{getPlanLabel(request.requestedPlan)}</p></div>}
                  </div>
              </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/10"><CardTitle className="text-lg flex items-center gap-2"><MessageSquare size={18}/> Conversation & Internal Notes</CardTitle></CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-4 mb-8">
                    {request.notes.map(n => (
                    <div key={n.id} className={`p-4 rounded-xl border ${n.visibility === 'internal' ? 'bg-amber-50 border-amber-200' : 'bg-secondary/50'}`}>
                        <div className="flex justify-between text-xs mb-3 text-muted-foreground">
                        <span className={`font-semibold flex items-center gap-1.5 ${n.visibility === 'internal' ? 'text-amber-800' : 'text-foreground'}`}>
                            {n.visibility === 'internal' ? <Lock size={14}/> : <MessageSquare size={14}/>}
                            {n.user.name}
                        </span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-sm leading-relaxed">{n.note}</div>
                    </div>
                    ))}
                </div>

                <div className="border-t pt-4">
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type a message or note..." className="mb-3" />
                    <div className="flex gap-2">
                        <Button onClick={() => addNote('public')} className="flex-1"><Send size={16} className="mr-2"/> Public Reply</Button>
                        <Button onClick={() => addNote('internal')} variant="outline" className="border-amber-200 text-amber-800 hover:bg-amber-50 flex-1"><Lock size={16} className="mr-2"/> Internal Note</Button>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit shadow-sm sticky top-6">
          <CardHeader className="border-b bg-muted/10"><CardTitle className="text-base">Status Workflow</CardTitle></CardHeader>
          <CardContent className="grid gap-2 pt-6">
            {(["pending", "in_review", "approved", "rejected", "resolved"] as RequestStatus[]).map((s) => (
              <Button 
                key={s} 
                variant={request.status === s ? "default" : "ghost"}
                onClick={() => updateStatus(s)}
                className="justify-start w-full gap-2 text-base font-medium"
              >
                {STATUS_ICONS[s]}
                {getStatusLabel(s)}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
