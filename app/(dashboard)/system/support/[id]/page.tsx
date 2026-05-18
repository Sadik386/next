"use client";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getStatusLabel, getTypeLabel, getPlanLabel } from "@/lib/ui-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  if (loading) return <div>Loading...</div>;
  if (!request) return <div>Request not found</div>;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <Button variant="ghost" className="pl-0" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-2" /> Back to Support
        </Button>

        <Card className="border-primary/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
            <CardTitle className="text-xl">Request #{request.id}</CardTitle>
            <StatusBadge status={getStatusLabel(request.status)} className="text-sm px-3 py-1" />
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
              <div className="flex gap-6 text-sm text-muted-foreground border-b pb-4">
                  <p><span className="font-semibold text-foreground">Type:</span> {getTypeLabel(request.type)}</p>
                  {request.requestedPlan && (
                      <p><span className="font-semibold text-foreground">Requested Plan:</span> {getPlanLabel(request.requestedPlan)}</p>
                  )}
              </div>
              <div>
                  <p className="font-semibold text-foreground mb-2">Original Request</p>
                  <div className="p-4 bg-muted/30 rounded-xl text-muted-foreground italic border-l-4 border-primary/50">
                      {request.message}
                  </div>
              </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h3 className="font-semibold flex items-center gap-2 text-lg"><MessageCircle size={20} className="text-primary"/> Conversation History</h3>
          {request.notes.filter(n => n.visibility === 'public').map((note) => (
            <div key={note.id} className="flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2 text-xs text-muted-foreground ml-1">
                  <span className="font-bold text-foreground">{note.user.name}</span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <div className="bg-primary/10 text-primary-foreground p-4 rounded-2xl rounded-tl-sm text-sm max-w-[85%] shadow-sm">
                  {note.note}
              </div>
            </div>
          ))}
        </div>

        <Card className="shadow-md border-primary/20">
          <CardContent className="pt-6">
              <Textarea 
                  value={reply} 
                  onChange={(e) => setReply(e.target.value)} 
                  placeholder="Type your reply to our team..."
                  className="mb-4 min-h-[120px] focus:ring-primary/50"
              />
              <Button onClick={handleReply} disabled={submitting} className="w-full sm:w-auto px-6">
                  <Send size={16} className="mr-2" /> Send Message
              </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
