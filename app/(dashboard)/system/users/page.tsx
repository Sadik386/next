"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, X, Search, Shield, Power } from "lucide-react";

type RoleName = "super_admin" | "admin" | "manager" | "store_keeper" | "staff";

type User = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  isFounder: boolean;
  createdAt: string;
  role: { id: number; name: RoleName; label: string };
  membershipStatus?: string;
};

type AssignableRole = { id: number; name: RoleName; label: string };

type CurrentUser = { id: number; name: string; email: string; role: RoleName };

const ROLE_LABELS: Record<RoleName, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  store_keeper: "Store Keeper",
  staff: "Staff",
};

const DEFAULT_ROLE_COLOR = {
  bg: "#f3f4f6",
  fg: "#4b5563",
  avatar: "#6b7280",
};

const ROLE_COLORS: Record<RoleName, { bg: string; fg: string; avatar: string }> = {
  super_admin: { bg: "#ede9fe", fg: "#6d28d9", avatar: "#8b5cf6" },
  admin: { bg: "#e0e7ff", fg: "#4338ca", avatar: "#6366f1" },
  manager: { bg: "#d1fae5", fg: "#047857", avatar: "#10b981" },
  store_keeper: { bg: "#fef3c7", fg: "#b45309", avatar: "#f59e0b" },
  staff: { bg: "#f3f4f6", fg: "#4b5563", avatar: "#6b7280" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roleName: "" as RoleName | "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    roleName: "" as RoleName | "",
  });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<RoleName | "">("");
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [removeSaving, setRemoveSaving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.items ?? []);
    }
    setLoading(false);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d.user));
    fetch("/api/users/assignable-roles")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAssignableRoles(d.roles ?? []));
  }, []);

  const canCreate = assignableRoles.length > 0;
  const canInvite = assignableRoles.length > 0;

  function canRemoveUser(targetRole: RoleName): boolean {
    if (!me) return false;
    if (me.role !== "super_admin" && me.role !== "admin") return false;
    if (targetRole === "super_admin") return false;
    if (me.role === "admin" && targetRole === "admin") return false;
    return true;
  }

  function canRemoveUserById(userId: number, userRole: RoleName): boolean {
    if (!me) return false;
    if (me.id === userId) return false;
    return canRemoveUser(userRole);
  }

  function openCreate() {
    setCreateForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      roleName: assignableRoles[0]?.name ?? "",
    });
    setCreateError(null);
    setCreateOpen(true);
  }

  function openInvite() {
    setInviteForm({
      email: "",
      roleName: assignableRoles[0]?.name ?? "",
    });
    setInviteError(null);
    setInviteOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const name = createForm.name.trim();
    const email = createForm.email.trim();
    if (!name) return setCreateError("Name is required");
    if (!email) return setCreateError("Email is required");
    if (!createForm.roleName) return setCreateError("Role is required");
    if (createForm.password.length < 8)
      return setCreateError("Password must be at least 8 characters");
    if (createForm.password !== createForm.confirmPassword)
      return setCreateError("Passwords do not match");

    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password: createForm.password,
        roleName: createForm.roleName,
      }),
    });
    setCreating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCreateError(data.error ?? "Create failed");
      return;
    }
    setCreateOpen(false);
    load();
  }

  function openRoleModal(user: User) {
    setRoleTarget(user);
    setNewRole("");
    setRoleError(null);
  }

  async function submitRoleChange() {
    if (!roleTarget || !newRole) return;
    setRoleSaving(true);
    setRoleError(null);
    const res = await fetch(`/api/users/${roleTarget.id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleName: newRole }),
    });
    setRoleSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setRoleError(data.error ?? "Update failed");
      return;
    }
    setRoleTarget(null);
    load();
  }

  async function submitStatusChange() {
    if (!statusTarget) return;
    setStatusSaving(true);
    setStatusError(null);
    const res = await fetch(`/api/users/${statusTarget.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !statusTarget.isActive }),
    });
    setStatusSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatusError(data.error ?? "Update failed");
      return;
    }
    setStatusTarget(null);
    load();
  }

  async function submitRemoveFromBusiness() {
    if (!removeTarget) return;
    setRemoveSaving(true);
    setRemoveError(null);
    const res = await fetch(`/api/users/${removeTarget.id}/deactivate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    setRemoveSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setRemoveError(data.error ?? "Failed to remove user from business");
      return;
    }
    setRemoveTarget(null);
    load();
  }

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    const email = inviteForm.email.trim();
    if (!email) return setInviteError("Email is required");
    if (!inviteForm.roleName) return setInviteError("Role is required");
    setInviting(true);
    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, roleName: inviteForm.roleName }),
    });
    setInviting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setInviteError(data.error ?? "Invite failed");
      return;
    }
    setInviteOpen(false);
    load();
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Users
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Manage system users and their roles
          </p>
        </div>
        {(canCreate || canInvite) && (
          <div style={{ display: "flex", gap: "6px" }}>
            {canCreate && (
              <button onClick={openCreate} style={btnPrimary}>
                <Plus size={14} /> New User
              </button>
            )}
            {canInvite && (
              <button onClick={openInvite} style={{ ...btnSecondary, marginLeft: "0" }}>
                <Plus size={14} /> Invite User
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div
          style={{
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
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: "var(--text-primary)",
              flex: 1,
            }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={filterSelect}
        >
          <option value="">All Roles</option>
          {(Object.keys(ROLE_LABELS) as RoleName[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      <div
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--input-bg)" }}>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Joined</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={emptyCell}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const userRoleName = u.role?.name;
                const roleColor = userRoleName && ROLE_COLORS[userRoleName]
                  ? {
                      bg: ROLE_COLORS[userRoleName].bg,
                      fg: ROLE_COLORS[userRoleName].fg,
                      avatar: ROLE_COLORS[userRoleName].avatar,
                    }
                  : DEFAULT_ROLE_COLOR;
                const isMe = me?.id === u.id;
                const isFounder = u.isFounder;
                const isPending = u.membershipStatus === "pending";
                const isDeactivated = u.membershipStatus === "deactivated";
                const canModify = !isFounder || isMe;
                const showActions = !isMe && canModify && u.role.name !== "super_admin" && !isPending && !isDeactivated;
                const canRemove = canRemoveUserById(u.id, u.role.name) && !isPending && !isDeactivated;
                return (
                  <tr key={u.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: roleColor.avatar,
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {(u.name[0] ?? "?").toUpperCase()}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "var(--text-primary)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            {u.name}
                            {isFounder && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 600,
                                  padding: "2px 6px",
                                  borderRadius: "999px",
                                  backgroundColor: "#fef3c7",
                                  color: "#92400e",
                                }}
                                title="System founder account"
                              >
                                👑 Founder
                              </span>
                            )}
                            {isMe && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-muted)",
                                  fontWeight: 400,
                                }}
                              >
                                (you)
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: "999px",
                          backgroundColor: roleColor.bg,
                          color: roleColor.fg,
                        }}
                      >
                        {ROLE_LABELS[u.role.name]}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      {u.membershipStatus === "pending" ? (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: "999px",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                          }}
                        >
                          Pending
                        </span>
                      ) : u.membershipStatus === "deactivated" ? (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: "999px",
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                          }}
                        >
                          Deactivated
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: "999px",
                            backgroundColor: u.isActive ? "#dcfce7" : "#fee2e2",
                            color: u.isActive ? "#166534" : "#991b1b",
                          }}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td style={{ ...cellStyle, color: "var(--text-secondary)" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>
                      {showActions || canRemove ? (
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {showActions && (
                            <>
                              <button
                                onClick={() => openRoleModal(u)}
                                style={smallBtn}
                                title="Change role"
                              >
                                <Shield size={12} /> Change Role
                              </button>
                              <button
                                onClick={() => {
                                  setStatusTarget(u);
                                  setStatusError(null);
                                }}
                                style={{
                                  ...smallBtn,
                                  color: u.isActive ? "#dc2626" : "#16a34a",
                                  borderColor: u.isActive ? "#fecaca" : "#bbf7d0",
                                }}
                                title={u.isActive ? "Deactivate" : "Activate"}
                              >
                                <Power size={12} /> {u.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </>
                          )}
                          {canRemove && (
                            <button
                              onClick={() => {
                                setRemoveTarget(u);
                                setRemoveError(null);
                              }}
                              style={{
                                ...smallBtn,
                                color: "#dc2626",
                                borderColor: "#fecaca",
                              }}
                              title="Remove from business"
                            >
                              <X size={12} /> Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <>
          <div onClick={() => setCreateOpen(false)} style={modalOverlay} />
          <div style={{ ...modalBox, width: "440px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Create User
              </h3>
              <button onClick={() => setCreateOpen(false)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submitCreate} style={{ display: "grid", gap: "12px" }}>
              <div>
                <Label required>Full Name</Label>
                <input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <Label required>Email</Label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, email: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <Label required>Password</Label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Min 8 characters"
                  style={inputStyle}
                />
              </div>
              <div>
                <Label required>Confirm Password</Label>
                <input
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <Label required>Role</Label>
                <select
                  value={createForm.roleName}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      roleName: e.target.value as RoleName,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">Select role</option>
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {escapeHtml(r.label)}
                    </option>
                  ))}
                </select>
              </div>
              {createError && <div style={errorBox}>{createError}</div>}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "4px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  style={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ ...btnPrimary, opacity: creating ? 0.6 : 1 }}
                >
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {inviteOpen && (
        <>
          <div onClick={() => setInviteOpen(false)} style={modalOverlay} />
          <div style={{ ...modalBox, width: "400px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Invite Existing User
              </h3>
              <button onClick={() => setInviteOpen(false)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
              Add an existing user to this business. They will receive a notification and must accept the invite to gain access.
            </p>
            <form onSubmit={submitInvite} style={{ display: "grid", gap: "12px" }}>
              <div>
                <Label required>Email</Label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((f) => ({ ...f, email: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <Label required>Role</Label>
                <select
                  value={inviteForm.roleName}
                  onChange={(e) =>
                    setInviteForm((f) => ({
                      ...f,
                      roleName: e.target.value as RoleName,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">Select role</option>
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {escapeHtml(r.label)}
                    </option>
                  ))}
                </select>
              </div>
              {inviteError && <div style={errorBox}>{inviteError}</div>}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "4px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  style={btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  style={{ ...btnPrimary, opacity: inviting ? 0.6 : 1 }}
                >
                  {inviting ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {roleTarget && (
        <>
          <div onClick={() => setRoleTarget(null)} style={modalOverlay} />
          <div style={modalBox}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Change Role
              </h3>
              <button onClick={() => setRoleTarget(null)} style={iconButton}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
              <strong style={{ color: "var(--text-primary)" }}>{roleTarget.name}</strong>
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
              Current role: {ROLE_LABELS[roleTarget.role.name]}
            </p>
            <Label required>New Role</Label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as RoleName)}
              style={inputStyle}
            >
              <option value="">Select a role</option>
              {assignableRoles
                .filter((r) => r.name !== roleTarget.role.name)
                .map((r) => (
                  <option key={r.id} value={r.name}>
                    {escapeHtml(r.label)}
                  </option>
                ))}
            </select>
            {roleError && <div style={{ ...errorBox, marginTop: "10px" }}>{roleError}</div>}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "16px",
              }}
            >
              <button onClick={() => setRoleTarget(null)} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={submitRoleChange}
                disabled={!newRole || roleSaving}
                style={{ ...btnPrimary, opacity: !newRole || roleSaving ? 0.6 : 1 }}
              >
                {roleSaving ? "Saving..." : "Confirm Change"}
              </button>
            </div>
          </div>
        </>
      )}

      {statusTarget && (
        <>
          <div onClick={() => setStatusTarget(null)} style={modalOverlay} />
          <div style={modalBox}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              {statusTarget.isActive ? "Deactivate" : "Activate"} {statusTarget.name}?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
              {statusTarget.isActive
                ? "This user will no longer be able to sign in until reactivated."
                : "This user will be able to sign in again."}
            </p>
            {statusError && <div style={errorBox}>{statusError}</div>}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <button onClick={() => setStatusTarget(null)} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={submitStatusChange}
                disabled={statusSaving}
                style={{
                  ...btnPrimary,
                  backgroundColor: statusTarget.isActive ? "#dc2626" : "var(--brand)",
                  opacity: statusSaving ? 0.6 : 1,
                }}
              >
                {statusSaving
                  ? "Saving..."
                  : statusTarget.isActive
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </>
      )}

      {removeTarget && (
        <>
          <div onClick={() => setRemoveTarget(null)} style={modalOverlay} />
          <div style={modalBox}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "8px",
              }}
            >
              Remove {removeTarget.name} from this business?
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
              This will remove this user's access to this business. Their global account will not be deleted. They can be re-invited later if needed.
            </p>
            {removeError && <div style={errorBox}>{removeError}</div>}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <button onClick={() => setRemoveTarget(null)} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={submitRemoveFromBusiness}
                disabled={removeSaving}
                style={{
                  ...btnPrimary,
                  backgroundColor: "#dc2626",
                  opacity: removeSaving ? 0.6 : 1,
                }}
              >
                {removeSaving ? "Removing..." : "Remove from Business"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--input-bg)",
  fontSize: "13px",
  color: "var(--text-primary)",
  outline: "none",
};

const filterSelect: React.CSSProperties = {
  ...inputStyle,
  width: "auto",
  minWidth: "140px",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "7px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "white",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const smallBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "5px 9px",
  borderRadius: "6px",
  border: "1px solid var(--card-border)",
  backgroundColor: "transparent",
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};

const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  color: "var(--text-primary)",
  verticalAlign: "middle",
};

const emptyCell: React.CSSProperties = {
  padding: "32px",
  textAlign: "center",
  color: "var(--text-muted)",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.4)",
  zIndex: 110,
};

const modalBox: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "var(--card-bg)",
  borderRadius: "12px",
  padding: "20px",
  width: "400px",
  maxWidth: "90vw",
  zIndex: 111,
  border: "1px solid var(--card-border)",
};

const iconButton: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
};

const errorBox: React.CSSProperties = {
  padding: "8px 12px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "6px",
  fontSize: "12px",
};

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      style={{
        textAlign: align ?? "left",
        padding: "10px 12px",
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </th>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "12px",
        fontWeight: 500,
        color: "var(--text-secondary)",
        marginBottom: "5px",
      }}
    >
      {children}
      {required && <span style={{ color: "#dc2626" }}> *</span>}
    </label>
  );
}