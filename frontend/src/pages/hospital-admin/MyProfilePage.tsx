// src/pages/hospital-admin/MyProfilePage.tsx
import { useEffect, useState } from "react";
import {
  User, Shield, Mail, Lock, Save, RefreshCw,
  CheckCircle, AlertCircle, BadgeCheck, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/constants";
import AvatarUpload from "@/components/common/AvatarUpload";

interface AdminProfile {
  id: string; full_name: string; phone: string;
  gender: string; dob: string; email: string;
  avatar_url: string | null;
}

function SectionCard({
  title, description, icon: Icon, children,
}: {
  title: string; description?: string;
  icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="sp-card-header">
        <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
          <Icon size={15} color="var(--ms-teal)" />
        </div>
        <div>
          <div className="card-title">{title}</div>
          {description && <div className="card-subtitle">{description}</div>}
        </div>
      </div>
      <div className="sp-card-body">{children}</div>
    </div>
  );
}

function LockedField({
  label, value, icon: Icon, tooltip,
}: {
  label: string; value: string;
  icon?: React.ElementType; tooltip?: string;
}) {
  return (
    <div className="field">
      <div className="sp-locked-label-row">
        <label className="field-label">{label}</label>
        <span className="sp-permanent-badge">
          <Lock size={9} /> Permanent
        </span>
      </div>
      <div className="field-input-wrap">
        {Icon && <Icon className="field-icon" size={15} />}
        <input
          readOnly
          value={value || "—"}
          title={tooltip}
          className={`field-input sp-locked-input${Icon ? " field-input-icon" : ""}`}
        />
      </div>
      {tooltip && <div className="field-error" style={{ color: "var(--ms-text-muted)" }}>{tooltip}</div>}
    </div>
  );
}

function SaveBar({
  dirty, saving, onDiscard, onSave,
}: {
  dirty: boolean; saving: boolean;
  onDiscard: () => void; onSave: () => void;
}) {
  return (
    <div className="sp-save-bar">
      <div className={`sp-save-status${dirty ? " sp-status-dirty" : " sp-status-clean"}`}>
        {dirty
          ? <><AlertCircle size={13} /> Unsaved changes</>
          : <><CheckCircle size={13} /> All saved</>
        }
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {dirty && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDiscard}>
            Discard
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onSave}
          disabled={saving || !dirty}
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const token = localStorage.getItem("accessToken");
  const [profile,  setProfile]  = useState<AdminProfile>({
    id: "", full_name: "", phone: "", gender: "", dob: "", email: "",
    avatar_url: null,
  });
  const [original, setOriginal] = useState<AdminProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Fetch admin profile
      const res  = await fetch(`${API_URL}/api/hospital-admin/my-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");

      // Fetch /me to get avatar_url (shared profile)
      const meRes = await fetch(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      const avatarUrl = meData?.profile?.avatar_url || null;

      const p: AdminProfile = {
        id: data.profile.id,
        full_name: data.profile.full_name || "",
        phone: data.profile.phone || "",
        gender: data.profile.gender || "",
        dob: data.profile.dob || "",
        email: data.profile.email || "",
        avatar_url: avatarUrl,
      };
      setProfile(p);
      setOriginal(p);
    } catch (e: any) { toast.error(e.message || "Failed to load profile"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  // Note: avatar changes are NOT counted as 'dirty'
  // because they save immediately via the API
  const dirty = original !== null &&
    JSON.stringify({ ...profile, avatar_url: null }) !==
    JSON.stringify({ ...original, avatar_url: null });

  const handleSave = async () => {
    if (!profile.full_name.trim()) { toast.error("Full name is required"); return; }
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/my-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: profile.full_name.trim(),
          phone: profile.phone || null,
          gender: profile.gender || null,
          dob: profile.dob || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      setOriginal(profile);
      toast.success("Profile updated successfully");
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = (newUrl: string | null) => {
    setProfile((p) => ({ ...p, avatar_url: newUrl }));
    setOriginal((o) => (o ? { ...o, avatar_url: newUrl } : o));
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
              <div className="page-header-sub">Manage your personal details</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="sp-section">

          {/* ── AVATAR CARD ── */}
          <SectionCard
            title="Profile Picture"
            description="Personalize your account with a profile picture"
            icon={Camera}
          >
            <AvatarUpload
              currentAvatarUrl={profile.avatar_url}
              userName={profile.full_name || "Admin"}
              onChange={handleAvatarChange}
              size="lg"
            />
          </SectionCard>

          {/* ── BANNER ── */}
          <div className="sp-profile-banner">
            <div className="sp-avatar-lg">
              {profile.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="sp-banner-info">
              <div className="sp-banner-name">{profile.full_name || "Hospital Admin"}</div>
              <div className="sp-banner-email">{profile.email}</div>
              <div className="sp-banner-role">
                <BadgeCheck size={13} /> Hospital Administrator
              </div>
            </div>
            {dirty && (
              <div className="sp-banner-actions">
                <button type="button" className="sp-banner-discard" onClick={() => original && setProfile(original)}>Discard</button>
                <button type="button" className="sp-banner-save" onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  Save
                </button>
              </div>
            )}
          </div>

          <SectionCard title="Account Identity" description="Tied to authentication" icon={Shield}>
            <LockedField label="Email Address" value={profile.email} icon={Mail}
              tooltip="Contact Super Admin to update your email." />
          </SectionCard>

          <SectionCard title="Personal Information" description="Update your details" icon={User}>
            <div className="form-grid-2">
              <div className="field form-full">
                <label className="field-label">Full Name *</label>
                <input className="field-input" placeholder="Your full name"
                  value={profile.full_name}
                  onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">Phone Number</label>
                <input className="field-input" placeholder="+92 XXX XXXXXXX"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">Date of Birth</label>
                <input type="date" className="field-input"
                  value={profile.dob}
                  onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))} />
              </div>
              <div className="field">
                <label className="field-label">Gender</label>
                <select className="field-select"
                  value={profile.gender}
                  onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <SaveBar dirty={dirty} saving={saving}
              onDiscard={() => original && setProfile(original)}
              onSave={handleSave} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}