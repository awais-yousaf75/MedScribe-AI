// src/pages/assistant/AssistantProfileCard.tsx
import {
  UserCog,
  Stethoscope,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  BadgeCheck,
  Camera,
} from "lucide-react";
import { useState, useRef } from "react";
import type { AssistantMeResponse } from "@/types";
import { toast } from "sonner";
import { API_URL, getToken } from "@/lib/constants";

interface Props {
  assistantInfo: AssistantMeResponse | null;
}

const getStatusBadge = (status?: string | null) => {
  if (!status) return <span className="badge badge-muted">Unknown</span>;

  const map: Record<
    string,
    { cls: string; icon: typeof CheckCircle; label: string }
  > = {
    approved: { cls: "badge badge-success", icon: CheckCircle, label: "Approved" },
    pending:  { cls: "badge badge-warning", icon: Clock,       label: "Pending"  },
    rejected: { cls: "badge badge-error",   icon: XCircle,     label: "Rejected" },
  };

  const { cls, icon: Icon, label } = map[status] || map.pending;

  return (
    <span className={cls}>
      <Icon size={11} /> {label}
    </span>
  );
};

export function AssistantProfileCard({ assistantInfo }: Props) {
  const profile  = assistantInfo?.profile;
  const doctor   = assistantInfo?.doctor;
  const hospital = assistantInfo?.hospital;
  const user     = assistantInfo?.user;

  const [avatarUrl, setAvatarUrl]   = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = (profile?.full_name || user?.email || "A")
    .charAt(0)
    .toUpperCase();

  // ── Upload handler ────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setAvatarUrl(data.avatar_url);
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="sp-section">

      {/* ── Profile Hero Card ─────────────────────────────── */}
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
        {/* Top Banner */}
        <div
          style={{
            position: "relative",
            padding: "24px 28px 64px",
            background:
              "linear-gradient(135deg, var(--ms-navy) 0%, var(--ms-teal) 100%)",
            overflow: "hidden",
          }}
        >
          {/* Decorative shapes */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 100,
              height: 100,
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
                Assistant Profile
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
                {profile?.full_name || "Assistant"}
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
                <UserCog size={14} />
                Doctor Assistant
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 999,
                padding: "4px 8px",
                backdropFilter: "blur(8px)",
              }}
            >
              {getStatusBadge(profile?.approval_status)}
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            position: "relative",
            padding: "0 28px 28px",
          }}
        >
          {/* Avatar — circular, with hover-only edit overlay */}
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
              {/* Avatar itself */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: avatarUrl
                    ? `url(${avatarUrl}) center/cover no-repeat`
                    : "linear-gradient(135deg, var(--ms-teal) 0%, var(--ms-navy) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 38,
                  fontWeight: 700,
                  cursor: uploading ? "not-allowed" : "pointer",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector(".avatar-overlay") as HTMLElement;
                  if (overlay) overlay.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector(".avatar-overlay") as HTMLElement;
                  if (overlay) overlay.style.opacity = "0";
                }}
              >
                {!avatarUrl && initial}

                {/* Hover overlay */}
                <div
                  className="avatar-overlay"
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
                  <Camera size={22} />
                  <span style={{ fontSize: 10, fontWeight: 600 }}>
                    {uploading ? "Uploading…" : "Change"}
                  </span>
                </div>
              </div>

              {/* Camera badge */}
              <button
                type="button"
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
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
                  cursor:     uploading ? "not-allowed" : "pointer",
                  boxShadow:  "0 4px 10px rgba(15, 23, 42, 0.18)",
                  padding:    0,
                }}
                title="Change profile picture"
              >
                <Camera size={14} />
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
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
              {profile?.full_name || "Assistant"}
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
              <UserCog size={12} color="var(--ms-teal)" />
              Doctor Assistant
            </div>
          </div>

          {/* Helper text */}
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "var(--ms-text-muted, #98a2b3)",
              marginBottom: 22,
              marginTop: 4,
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
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
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
                  {user?.email || "—"}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid var(--ms-border, #e8edf3)",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(22, 163, 165, 0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Phone size={16} color="var(--ms-teal)" />
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
                  Phone Number
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ms-text-primary, #1a1a2e)",
                    wordBreak: "break-word",
                  }}
                >
                  {profile?.phone || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Assigned Doctor Card ─────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Stethoscope size={18} color="#fff" />
            </div>
            <div>
              <div className="card-title">Assigned Doctor</div>
              <div className="card-subtitle">Your supervising physician</div>
            </div>
          </div>
        </div>

        {doctor ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 20px",
              background: "var(--ms-bg-subtle, #f8f9fa)",
              borderRadius: 10,
              margin: "0 16px 16px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--ms-teal) 0%, var(--ms-navy) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 18,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {doctor.full_name?.charAt(0)?.toUpperCase() || "D"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--ms-text-primary, #1a1a2e)",
                  }}
                >
                  {doctor.full_name}
                </span>
                <BadgeCheck size={14} color="var(--ms-teal)" />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "var(--ms-text-muted, #888)",
                }}
              >
                <Phone size={11} />
                {doctor.phone || "No phone"}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "24px 20px",
              textAlign: "center",
              color: "var(--ms-text-muted, #888)",
              fontSize: 13,
              margin: "0 16px 16px",
              background: "var(--ms-bg-subtle, #f8f9fa)",
              borderRadius: 10,
            }}
          >
            <Stethoscope
              size={24}
              color="var(--ms-text-muted, #ccc)"
              style={{ marginBottom: 8 }}
            />
            <div>No doctor assigned yet</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              Contact your hospital admin for assignment
            </div>
          </div>
        )}
      </div>

      {/* ── Hospital Card ────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-navy">
              <Building2 size={18} color="#fff" />
            </div>
            <div>
              <div className="card-title">Hospital</div>
              <div className="card-subtitle">Your workplace</div>
            </div>
          </div>
          {hospital && getStatusBadge(hospital.status)}
        </div>

        {hospital ? (
          <div
            style={{
              padding: "16px 20px",
              background: "var(--ms-bg-subtle, #f8f9fa)",
              borderRadius: 10,
              margin: "0 16px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, var(--ms-navy) 0%, var(--ms-teal) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 size={18} color="#fff" />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--ms-text-primary, #1a1a2e)",
                  }}
                >
                  {hospital.name}
                </div>
                {hospital.hospital_type && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ms-teal)",
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {hospital.hospital_type}
                  </div>
                )}
              </div>
            </div>

            {hospital.address && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--ms-text-muted, #888)",
                  paddingTop: 10,
                  borderTop: "1px solid var(--ms-border, #eee)",
                }}
              >
                <MapPin size={12} style={{ marginTop: 1, flexShrink: 0 }} />
                {hospital.address}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: "24px 20px",
              textAlign: "center",
              color: "var(--ms-text-muted, #888)",
              fontSize: 13,
              margin: "0 16px 16px",
              background: "var(--ms-bg-subtle, #f8f9fa)",
              borderRadius: 10,
            }}
          >
            <Building2
              size={24}
              color="var(--ms-text-muted, #ccc)"
              style={{ marginBottom: 8 }}
            />
            <div>No hospital linked</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              Contact admin to link your account
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

