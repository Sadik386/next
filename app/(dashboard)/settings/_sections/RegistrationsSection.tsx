"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, X, Search, UserPlus } from "lucide-react";

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

export default function RegistrationsSection() {
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: activeTab });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/registrations?${params}`);
      const data = await res.json();
      if (res.ok) {
        setRegistrations(data.registrations);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleApprove = async (id: number) => {
    if (!confirm("Approve this registration request?")) return;
    try {
      const res = await fetch(`/api/admin/registrations/${id}/approve`, { method: "POST" });
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
      <span style={{ background: style.bg, color: style.text, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 500 }}>
        {status}
      </span>
    );
  };

  const pendingCount = registrations.filter(r => r.status === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>Registration Requests</h2>
        {pendingCount > 0 && (
          <span style={{ fontSize: "12px", color: "#b45309", backgroundColor: "#fef3c7", padding: "4px 10px", borderRadius: "12px" }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={searchBox}>
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            style={searchInput}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === tab.value ? "var(--brand)" : "transparent",
              color: activeTab === tab.value ? "white" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={emptyState}>Loading...</div>
      ) : registrations.length === 0 ? (
        <div style={emptyState}>
          <UserPlus size={40} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No registration requests found</p>
        </div>
      ) : (
        <div style={tableCard}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--input-bg)" }}>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Requested</Th>
                <Th>Status</Th>
                <Th>Reviewed By</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg, idx) => (
                <tr key={reg.id} style={{ borderTop: idx > 0 ? "1px solid var(--card-border)" : "none" }}>
                  <td style={cellStyle}>{reg.name}</td>
                  <td style={cellStyle}>{reg.email}</td>
                  <td style={cellStyle}>{formatDate(reg.createdAt)}</td>
                  <td style={cellStyle}>{getStatusBadge(reg.status)}</td>
                  <td style={cellStyle}>{reg.reviewer ? reg.reviewer.name : "-"}</td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    {reg.status === "pending" && (
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button onClick={() => handleApprove(reg.id)} style={approveBtn}>
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => setRejectModal({ open: true, id: reg.id })} style={rejectBtn}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                    {reg.status === "rejected" && reg.rejectReason && (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Reason: {reg.rejectReason}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectModal.open && (
        <div style={modalOverlay} onClick={() => setRejectModal({ open: false, id: null })}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Reject Registration</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Please provide a reason for rejecting this registration request.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={textareaStyle}
            />
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setRejectModal({ open: false, id: null })} style={cancelBtn}>Cancel</button>
              <button onClick={handleReject} disabled={rejecting} style={{ ...rejectBtnConfirm, opacity: rejecting ? 0.7 : 1 }}>
                {rejecting ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const searchBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  maxWidth: "320px",
  flex: 1,
  minWidth: "240px",
};

const searchInput: React.CSSProperties = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "13px",
  color: "var(--text-primary)",
  flex: 1,
};

const tableCard: React.CSSProperties = {
  background: "var(--card-bg)",
  borderRadius: "12px",
  border: "1px solid var(--card-border)",
  overflow: "hidden",
};

const cellStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "14px",
  color: "var(--text-primary)",
  verticalAlign: "middle",
};

const emptyState: React.CSSProperties = {
  textAlign: "center",
  padding: "40px",
  background: "var(--card-bg)",
  borderRadius: "12px",
  border: "1px dashed var(--card-border)",
};

const approveBtn: React.CSSProperties = {
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
};

const rejectBtn: React.CSSProperties = {
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
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalBox: React.CSSProperties = {
  background: "var(--card-bg)",
  borderRadius: "12px",
  padding: "24px",
  width: "400px",
  maxWidth: "90%",
};

const textareaStyle: React.CSSProperties = {
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
};

const cancelBtn: React.CSSProperties = {
  padding: "8px 16px",
  background: "transparent",
  color: "var(--text-secondary)",
  border: "1px solid var(--card-border)",
  borderRadius: "6px",
  fontSize: "13px",
  cursor: "pointer",
};

const rejectBtnConfirm: React.CSSProperties = {
  padding: "8px 16px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{ textAlign: align ?? "left", padding: "12px 16px", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
      {children}
    </th>
  );
}