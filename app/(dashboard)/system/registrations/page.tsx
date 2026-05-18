"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, X, UserPlus } from "lucide-react";

type RegistrationRequest = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewer: { id: number; name: string; email: string } | null;
};

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations?status=${activeTab}`);
      const data = await res.json();
      if (res.ok) {
        setRegistrations(data.registrations);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleApprove = async (id: number) => {
    if (!confirm("Approve this registration request?")) return;
    try {
      const res = await fetch(`/api/admin/registrations/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        fetchRegistrations();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!rejectModal.id) return;
    if (!rejectReason.trim()) {
      alert("Please provide a reason");
      return;
    }
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/registrations/${rejectModal.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setRejectModal({ open: false, id: null });
        setRejectReason("");
        fetchRegistrations();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      pending: { bg: "#fef3c7", text: "#b45309" },
      approved: { bg: "#dcfce7", text: "#16a34a" },
      rejected: { bg: "#fee2e2", text: "#dc2626" },
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        style={{
          background: style.bg,
          color: style.text,
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "capitalize",
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
          Registration Requests
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Manage user registration requests awaiting approval
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--card-border)",
          paddingBottom: "12px",
        }}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === tab.value ? "var(--brand)" : "transparent",
              color: activeTab === tab.value ? "var(--brand-text)" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading...
        </div>
      ) : registrations.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "var(--card-bg)",
            borderRadius: "12px",
            border: "1px dashed var(--card-border)",
          }}
        >
          <UserPlus size={40} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No registration requests found</p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--card-bg)",
            borderRadius: "12px",
            border: "1px solid var(--card-border)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--page-bg)" }}>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Requested
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Reviewed By
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg, idx) => (
                <tr
                  key={reg.id}
                  style={{
                    borderTop: idx > 0 ? "1px solid var(--card-border)" : "none",
                  }}
                >
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "var(--text-primary)" }}>
                    {reg.name}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {reg.email}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {formatDate(reg.createdAt)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>{getStatusBadge(reg.status)}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {reg.reviewer ? reg.reviewer.name : "-"}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {reg.status === "pending" && (
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleApprove(reg.id)}
                          style={{
                            padding: "6px 12px",
                            background: "#dcfce7",
                            color: "#16a34a",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, id: reg.id })}
                          style={{
                            padding: "6px 12px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                    {reg.status === "rejected" && reg.rejectReason && (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Reason: {reg.rejectReason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setRejectModal({ open: false, id: null })}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "12px",
              padding: "24px",
              width: "400px",
              maxWidth: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Reject Registration</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Please provide a reason for rejecting this registration request.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                fontSize: "14px",
                minHeight: "100px",
                resize: "vertical",
                marginBottom: "16px",
              }}
            />
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setRejectModal({ open: false, id: null })}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                style={{
                  padding: "8px 16px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: rejecting ? "not-allowed" : "pointer",
                  opacity: rejecting ? 0.7 : 1,
                }}
              >
                {rejecting ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}