"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, UserCheck, XCircle } from "lucide-react";
import AuthShell, { AuthPageIntro } from "../../_components/AuthShell";

type InviteStatus = "loading" | "success" | "error";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<InviteStatus>("loading");
  const [message, setMessage] = useState("Processing your invitation.");

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setStatus("error");
      setMessage("Invitation token is missing.");
      return;
    }

    setStatus("loading");
    setMessage("Processing your invitation.");

    fetch("/api/users/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;

        if (data.success) {
          setStatus("success");
          setMessage("Invitation accepted. You now have access to this business workspace.");
          return;
        }

        setStatus("error");
        setMessage(data.error || "Failed to accept invitation.");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setMessage("Something went wrong while accepting this invitation.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthShell
      visualMode="register"
      visualStage={2}
      visualKicker="Team access"
      visualTitle="Join the workspace with a secure invite."
      visualDescription="Accoraze keeps business access controlled with verified, time-limited invitations."
    >
      <div className="auth-flow">
        {status === "loading" && (
          <>
            <AuthPageIntro
              eyebrow="Invitation"
              title="Accepting your invite"
              description="Please wait while Accoraze validates your workspace invitation."
            />

            <div className="auth-status-panel" aria-live="polite">
              <span className="auth-status-icon auth-status-icon--loading" aria-hidden="true">
                <LoaderCircle size={28} />
              </span>
              <h2>Checking invite</h2>
              <p>{message}</p>
            </div>
          </>
        )}

        {status === "success" && (
          <div className="auth-status-panel auth-status-panel--center" aria-live="polite">
            <span className="auth-status-icon auth-status-icon--success" aria-hidden="true">
              <CheckCircle2 size={30} />
            </span>
            <h2>Invitation accepted</h2>
            <p>{message}</p>
            <Link href="/dashboard" className="auth-button auth-button--primary">
              <UserCheck size={16} aria-hidden="true" />
              <span>Go to dashboard</span>
            </Link>
          </div>
        )}

        {status === "error" && (
          <>
            <AuthPageIntro
              eyebrow="Invitation issue"
              title="This invite did not work"
              description="The invitation may be expired, already used, or incomplete."
            />

            <div className="auth-status-panel" aria-live="polite">
              <span className="auth-status-icon auth-status-icon--error" aria-hidden="true">
                <XCircle size={28} />
              </span>
              <h2>Invitation failed</h2>
              <p>{message}</p>
            </div>

            <div className="auth-link-row">
              <ArrowLeft size={14} aria-hidden="true" />
              <Link href="/login" className="auth-link">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}

function AcceptInviteFallback() {
  return (
    <AuthShell
      visualMode="register"
      visualStage={2}
      visualKicker="Team access"
      visualTitle="Join the workspace with a secure invite."
      visualDescription="Accoraze keeps business access controlled with verified, time-limited invitations."
    >
      <div className="auth-status-panel" aria-live="polite">
        <span className="auth-status-icon auth-status-icon--loading" aria-hidden="true">
          <LoaderCircle size={28} />
        </span>
        <h2>Loading invite</h2>
        <p>Preparing your invitation check.</p>
      </div>
    </AuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteFallback />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
