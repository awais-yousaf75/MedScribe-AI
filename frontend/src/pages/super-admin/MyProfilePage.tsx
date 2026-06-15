// src/pages/super-admin/MyProfilePage.tsx
import { useEffect, useRef, useState } from "react";
import {
  User,
  Shield,
  Mail,
  Lock,
  Save,
  RefreshCw,
  Camera,
  Phone,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL, getToken } from "@/lib/constants";

interface MyProfile {
  id:         string;
  full_name:  string;
  phone:      string;
  email:      string;
  avatar_url: string | null;
}

// ── Reusable section card ──────────────────────────────────
function SectionCard({
  title,
  description,
  icon: Icon,
  iconColor = "var(--ms-teal)",
  children,
}: {
  title:        string;
  description?: string;
  icon:         React.ElementType;
  iconColor?:   string;
  children:     React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 10,
        overflow: "hidden",
        border: "1px solid var(--ms-border, #e8edf3)",
        borderRadius: 16,
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
        background: "#fff",
      }}
    >
      <div
        className="card-header"
        style={{ borderBottom: "1px solid var(--ms-border, #e8edf3)" }}
      >
        <div className="card-header-left">
          <div
            className="icon-wrap icon-wrap-md"
            style={{
              background:
                iconColor === "var(--ms-teal)"
                  ? "#D5EDE9"
                  : "rgba(26,26,46,0.06)",
            }}
          >
            <Icon size={17} color={iconColor} />
          </div>
          <div>
            <div className="card-title">{title}</div>
            {description && <div className="card-subtitle">{description}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  );
}

// ── Locked field ──────────────────────────────────────────
function LockedField({
  label,
  value,
  icon: Icon,
  tooltip,
}: {
  label:    string;
  value:    string;
  icon?:    React.ElementType;
  tooltip?: string;
}) {
  return (
    <div className="field">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <label className="field-label" style={{ marginBottom: 0 }}>
          {label}
        </label>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 999,
            background: "var(--ms-bg-subtle, #f6f9fc)",
            color: "var(--ms-text-muted, #667085)",
            border: "1px solid var(--ms-border, #e8edf3)",
          }}
        >
          <Lock size={9} /> Permanent
        </span>
      </div>
      <div className="field-input-wrap">
        {Icon && <Icon className="field-icon" size={15} />}
        <input
          readOnly
          value={value || "—"}
          title={tooltip}
          className={`field-input${Icon ? " field-input-icon" : ""}`}
          style={{
            background: "var(--ms-bg-subtle, #f6f9fc)",
            cursor: "not-allowed",
            color: "var(--ms-text-muted, #667085)",
          }}
        />
      </div>
      {tooltip && (
        <div
          style={{
            fontSize: 11,
            color: "var(--ms-text-muted, #98a2b3)",
            marginTop: 6,
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

// ── Save Bar ──────────────────────────────────────────────
function SaveBar({
  dirty,
  saving,
  onDiscard,
  onSave,
}: {
  dirty:     boolean;
  saving:    boolean;
  onDiscard: () => void;
  onSave:    () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 20,
        paddingTop: 16,
        borderTop: "1px solid var(--ms-border, #e8edf3)",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
          color: dirty ? "#d97706" : "#059669",
        }}
      >
        {dirty ? (
          <>
            <AlertCircle size={13} /> Unsaved changes
          </>
        ) : (
          <>
            <CheckCircle size={13} /> All saved
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {dirty && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onDiscard}
          >
            Discard
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onSave}
          disabled={saving || !dirty}
        >
          {saving ? (
            <RefreshCw size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function MyProfilePage() {
  const token = getToken();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<MyProfile>({
    id: "", full_name: "", phone: "", email: "", avatar_url: null,
  });
  const [original,  setOriginal]  = useState<MyProfile | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing,  setRemoving]  = useState(false);

  const busy = uploading || removing;

  const initials =
    (profile.full_name || profile.email || "S")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() || "")
      .join("") || "S";

  // ── Fetch profile ───────────────────────────────────────
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");

      const p: MyProfile = {
        id:         data.profile.id,
        full_name:  data.profile.full_name || "",
        phone:      data.profile.phone     || "",
        email:      data.user?.email       || "",
        avatar_url: data.profile.avatar_url || null,
      };
      setProfile(p);
      setOriginal(p);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const dirty =
    original !== null &&
    (profile.full_name !== original.full_name ||
      profile.phone    !== original.phone);

  // ── Save personal info ──────────────────────────────────
  const handleSave = async () => {
    if (!profile.full_name.trim()) { toast.error("Full name is required"); return; }
    if (!/^[a-zA-Z\s.\-']+$/.test(profile.full_name.trim())) { toast.error("Full name must contain only letters, spaces, hyphens, or apostrophes"); return; }
    if (profile.phone && !/^[\+]?[\d\s\-\(\)]{7,15}$/.test(profile.phone.trim())) { toast.error("Invalid phone number format"); return; }
    try {
      setSaving(true);
      const res  = await fetch(`${API_URL}/api/profile/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profile.full_name.trim(),
          phone:     profile.phone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setOriginal(profile);
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload avatar ───────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed"); return; }
    if (file.size > 5 * 1024 * 1024)     { toast.error("Image must be under 5MB"); return; }
    if (!token)                          { toast.error("Not authenticated"); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res  = await fetch(`${API_URL}/api/profile/avatar`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setProfile ((p) => ({ ...p, avatar_url: data.avatar_url }));
      setOriginal((o) => (o ? { ...o, avatar_url: data.avatar_url } : o));
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Remove avatar ───────────────────────────────────────
  const handleRemoveAvatar = async () => {
    if (!profile.avatar_url) return;
    if (!window.confirm("Remove profile picture?")) return;
    if (!token) return;

    try {
      setRemoving(true);
      const res  = await fetch(`${API_URL}/api/profile/avatar`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remove failed");

      setProfile ((p) => ({ ...p, avatar_url: null }));
      setOriginal((o) => (o ? { ...o, avatar_url: null } : o));
      toast.success("Profile picture removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-main">
        <div className="do-loading-screen" style={{ minHeight: 240 }}>
          <RefreshCw size={28} className="animate-spin do-loading-icon" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="page-main">
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <User size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">My Profile</div>
              <div className="page-header-sub">Manage your account</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="sp-section">

          {/* ── HERO PROFILE CARD ──────────────────────────── */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: "hidden",
              border: "1px solid var(--ms-border, #e8edf3)",
              borderRadius: 20,
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
              background: "#fff",
            }}
          >
            {/* Top Banner — same as other roles */}
            <div
              style={{
                position: "relative",
                padding: "24px 28px 64px",
                background:
                  "linear-gradient(135deg, var(--ms-navy) 0%, var(--ms-teal) 100%)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -40, right: -40,
                  width: 160, height: 160,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -30, left: -30,
                  width: 100, height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                }}
              />

              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: 6,
                    }}
                  >
                    Super Admin Profile
                  </div>

                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.2,
                      marginBottom: 6,
                    }}
                  >
                    {profile.full_name || "Super Admin"}
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    <ShieldCheck size={14} />
                    System Administrator
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 999,
                    padding: "5px 12px",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Shield size={12} />
                  Super Admin
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ position: "relative", padding: "0 28px 28px" }}>

              {/* Avatar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: -56,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 112,
                    height: 112,
                    borderRadius: "50%",
                    background: "#fff",
                    padding: 4,
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.15)",
                  }}
                >
                  <div
                    onClick={() => !busy && fileInputRef.current?.click()}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: profile.avatar_url
                        ? `url(${profile.avatar_url}) center/cover no-repeat`
                        : "linear-gradient(135deg, var(--ms-teal) 0%, var(--ms-navy) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 34,
                      fontWeight: 700,
                      cursor: busy ? "wait" : "pointer",
                      position: "relative",
                      overflow: "hidden",
                      letterSpacing: 1,
                    }}
                    onMouseEnter={(e) => {
                      const o = e.currentTarget.querySelector(".av-hover") as HTMLElement;
                      if (o) o.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      const o = e.currentTarget.querySelector(".av-hover") as HTMLElement;
                      if (o) o.style.opacity = "0";
                    }}
                  >
                    {!profile.avatar_url && initials}

                    <div
                      className="av-hover"
                      style={{
                        position:   "absolute",
                        inset:      0,
                        background: "rgba(0,0,0,0.55)",
                        display:    "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap:        4,
                        color:      "#fff",
                        opacity:    0,
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      <Camera size={20} />
                      <span style={{ fontSize: 10, fontWeight: 600 }}>Change</span>
                    </div>

                    {busy && (
                      <div
                        style={{
                          position:   "absolute",
                          inset:      0,
                          background: "rgba(0,0,0,0.55)",
                          display:    "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color:      "#fff",
                        }}
                      >
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => !busy && fileInputRef.current?.click()}
                    disabled={busy}
                    style={{
                      position:   "absolute",
                      bottom:     2,
                      right:      2,
                      width:      32,
                      height:     32,
                      borderRadius: "50%",
                      background: "var(--ms-teal)",
                      border:     "3px solid #fff",
                      color:      "#fff",
                      display:    "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:     busy ? "not-allowed" : "pointer",
                      boxShadow:  "0 4px 10px rgba(15, 23, 42, 0.18)",
                      padding:    0,
                    }}
                    title="Change profile picture"
                  >
                    <Camera size={14} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </div>
              </div>

              {/* Name + role */}
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--ms-text-primary, #1a1a2e)",
                    marginBottom: 6,
                  }}
                >
                  {profile.full_name || "Super Admin"}
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 999,
                    background: "var(--ms-bg-subtle, #f6f9fc)",
                    border: "1px solid var(--ms-border, #e8edf3)",
                    color: "var(--ms-text-muted, #667085)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <ShieldCheck size={12} color="var(--ms-teal)" />
                  System Administrator
                </div>
              </div>

              {/* Avatar action buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 12,
                  marginBottom: 6,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => !busy && fileInputRef.current?.click()}
                  disabled={busy}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: "1px solid var(--ms-border, #e8edf3)",
                    background: "#fff",
                    color: "var(--ms-text-primary, #1a1a2e)",
                    cursor: busy ? "not-allowed" : "pointer",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  <Camera size={13} color="var(--ms-teal)" />
                  {profile.avatar_url ? "Change Photo" : "Upload Photo"}
                </button>

                {profile.avatar_url && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={busy}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      background: "#fff",
                      color: "#dc2626",
                      cursor: busy ? "not-allowed" : "pointer",
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                )}
              </div>

              <div
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "var(--ms-text-muted, #98a2b3)",
                  marginBottom: 22,
                }}
              >
                JPG, PNG or WEBP · Max 5MB
              </div>

              {/* Contact Info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1px solid var(--ms-border, #e8edf3)",
                    background:
                      "linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)",
                  }}
                >
                  <div
                    style={{
                      width: 38, height: 38,
                      borderRadius: 10,
                      background: "rgba(22, 163, 165, 0.10)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={16} color="var(--ms-teal)" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--ms-text-muted, #98a2b3)",
                        marginBottom: 3,
                      }}
                    >
                      Email Address
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ms-text-primary, #1a1a2e)",
                        wordBreak: "break-word",
                      }}
                    >
                      {profile.email || "—"}
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          </div>

          {/* ── ACCOUNT IDENTITY ───────────────────────────── */}
          <SectionCard
            title="Account Identity"
            description="Tied to your authentication account"
            icon={Shield}
          >
            <LockedField
              label="Email Address"
              value={profile.email}
              icon={Mail}
              tooltip="Email is used for system access and cannot be changed here."
            />
          </SectionCard>

          {/* ── PERSONAL INFORMATION ───────────────────────── */}
          <SectionCard
            title="Personal Information"
            description="Update your personal details"
            icon={User}
          >
            <div className="form-grid-2">
              <div className="field form-full">
                <label className="field-label">Full Name *</label>
                <input
                  className="field-input"
                  placeholder="Your full name"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, full_name: e.target.value.replace(/[^a-zA-Z\s.\-']/g, "") }))
                  }
                />
              </div>
              
            </div>

            <SaveBar
              dirty={dirty}
              saving={saving}
              onDiscard={() => original && setProfile(original)}
              onSave={handleSave}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}