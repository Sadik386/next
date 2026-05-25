"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Loader2, Eye, EyeOff, User, Lock, Clock } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

type UserProfile = {
  id: number;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  dob: string | null;
  address: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  totalLogins: number;
};

type TabId = "profile" | "security" | "activity";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "activity", label: "Activity", icon: Clock },
];

function getPasswordStrength(password: string): { level: string; color: string; score: number } {
  if (!password) return { level: "", color: "", score: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { level: "Weak", color: "#dc2626", score };
  if (score <= 2) return { level: "Medium", color: "#f59e0b", score };
  return { level: "Strong", color: "#16a34a", score };
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const activeTab = (searchParams.get("tab") as TabId) || "profile";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) { router.push("/login"); return; }
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setFormData({
            name: data.user.name || "",
            username: data.user.username || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            gender: data.user.gender || "",
            dob: data.user.dob ? data.user.dob.split("T")[0] : "",
            address: data.user.address || "",
          });
        }
      } catch { toast.error("Failed to load profile"); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [router]);

  const handleTabChange = (tabId: TabId) => {
    const url = tabId === "profile" ? "/profile" : `/profile?tab=${tabId}`;
    router.push(url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { toast.error("Name and email are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to update"); return; }
      toast.success("Profile updated successfully");
      if (data.user) setUser(data.user);
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) { toast.error("All password fields required"); return; }
    if (passwordData.newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to change"); return; }
      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--brand)" }} />
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <>
      <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>My Profile</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid var(--card-border)", paddingBottom: "0px" }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  backgroundColor: activeTab === tab.id ? "var(--card-bg)" : "transparent",
                  color: activeTab === tab.id ? "var(--brand)" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  borderBottom: activeTab === tab.id ? "2px solid var(--brand)" : "2px solid transparent",
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <UserAvatar 
                  name={user?.name} 
                  role={user?.role} 
                  size={64} 
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>{user?.name}</div>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{user?.email}</div>
                </div>
                
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Username</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 234 567 8900" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={labelStyle}>Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, marginTop: "16px", opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                  Save Changes
                </button>
              </form>
            </div>

            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Account Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                <div>
                  <div style={infoLabelStyle}>User ID</div>
                  <div style={infoValueStyle}>#{user?.id}</div>
                </div>
                <div>
                  <div style={infoLabelStyle}>Created</div>
                  <div style={infoValueStyle}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</div>
                </div>
                <div>
                  <div style={infoLabelStyle}>Last Updated</div>
                  <div style={infoValueStyle}>{user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "N/A"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={sectionTitleStyle}>Password & Security</h3>
              {!showPasswordForm && (
                <button onClick={() => setShowPasswordForm(true)} style={linkBtnStyle}>Change Password</button>
              )}
            </div>

            {showPasswordForm ? (
              <form onSubmit={handlePasswordSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Current Password *</label>
                    <div style={{ position: "relative" }}>
                      <input type={showPasswords.current ? "text" : "password"} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} style={{ ...inputStyle, paddingRight: "40px" }} />
                      <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))} style={eyeBtnStyle}>
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div></div>
                  <div>
                    <label style={labelStyle}>New Password *</label>
                    <div style={{ position: "relative" }}>
                      <input type={showPasswords.new ? "text" : "password"} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} style={{ ...inputStyle, paddingRight: "40px" }} />
                      <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))} style={eyeBtnStyle}>
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordData.newPassword && (
                      <div style={{ marginTop: "4px", fontSize: "12px", color: passwordStrength.color }}>
                        Strength: {passwordStrength.level} ({passwordStrength.score}/5)
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm New Password *</label>
                    <div style={{ position: "relative" }}>
                      <input type={showPasswords.confirm ? "text" : "password"} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} style={{ ...inputStyle, paddingRight: "40px" }} />
                      <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))} style={eyeBtnStyle}>
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowPasswordForm(false)} style={btnSecondary}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                    {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                    Update Password
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "var(--input-bg)", borderRadius: "8px" }}>
                <Lock size={20} style={{ color: "var(--text-muted)" }} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>Password</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Last changed recently</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>Login Activity</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={infoRowStyle}>
                <div>
                  <div style={infoLabelStyle}>Last Login</div>
                  <div style={infoValueStyle}>
                    {user?.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
                      : "Never"}
                  </div>
                </div>
                <div>
                  <div style={infoLabelStyle}>IP Address</div>
                  <div style={{ ...infoValueStyle, fontFamily: "monospace" }}>{user?.lastLoginIp || "N/A"}</div>
                </div>
                <div>
                  <div style={infoLabelStyle}>Total Logins</div>
                  <div style={infoValueStyle}>{user?.totalLogins ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "20px",
};



const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  color: "var(--text-secondary)",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--text-primary)",
  fontSize: "14px",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 16px",
  background: "var(--brand)",
  color: "white",
  borderRadius: "8px",
  border: "none",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 16px",
  background: "transparent",
  color: "var(--text-secondary)",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
};

const linkBtnStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--brand)",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
};

const eyeBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "16px",
};

const infoLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-muted)",
  marginBottom: "4px",
};

const infoValueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "var(--text-primary)",
  fontWeight: 500,
};

const infoRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  padding: "16px",
  background: "var(--input-bg)",
  borderRadius: "8px",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "var(--text-muted)" }}>
        Loading...
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}