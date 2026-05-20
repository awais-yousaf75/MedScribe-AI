// src/pages/super-admin/MyProfilePage.tsx
import { useEffect, useState } from "react";
import {
  User, Shield, Mail, Lock, Save, RefreshCw, BadgeCheck, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL, getToken } from "@/lib/constants";
import AvatarUpload from "@/components/common/AvatarUpload";

interface MyProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
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
  label, value, icon: Icon,
}: {
  label: string; value: string; icon?: React.ElementType;
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
          className={`field-input sp-locked-input${Icon ? " field-input-icon" : ""}`}
        />
      </div>
    </div>
  );
}

export default function MyProfilePage() {
  const token = getToken();
  const [profile, setProfile] = useState<MyProfile>({
    id: "", full_name: "", phone: "", email: "", avatar_url: null,
  });
  const [original, setOriginal] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");

      const p: MyProfile = {
        id: data.profile.id,
        full_name: data.profile.full_name || "",
        phone: data.profile.phone || "",
        email: data.user?.email || "",
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

  const dirty = original !== null &&
    (profile.full_name !== original.full_name ||
     profile.phone !== original.phone);

  const handleSave = async () => {
    if (!profile.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    try {
      setSaving(true);
      // Reuse hospital-admin endpoint style — actually we use direct profile update.
      // For SuperAdmin we just update the profiles table via a generic profile route:
      // Since we don't have one, we'll piggyback by calling the supabase profile via a
      // dedicated SuperAdmin endpoint (using existing patterns) - but simpler:
      // Call profile/me PATCH via a NEW backend endpoint OR reuse direct DB update.
      // ────────────────────────────────────────────────────────────────────────
      // Easiest: call a new shared endpoint, but for now we use the existing
      // userProfile shared endpoint. Since we only added avatar there, let's
      // add a basic update endpoint inline using existing profile route.
      // For SuperAdmin, we make a direct call to /api/profile/me PATCH endpoint
      // ────────────────────────────────────────────────────────────────────────

      const res = await fetch(`${API_URL}/api/profile/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profile.full_name.trim(),
          phone: profile.phone || null,
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
              <div className="page-header-sub">Manage your account</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="sp-section">

          <SectionCard
            title="Profile Picture"
            description="Personalize your account"
            icon={Camera}
          >
            <AvatarUpload
              currentAvatarUrl={profile.avatar_url}
              userName={profile.full_name || "Super Admin"}
              onChange={handleAvatarChange}
              size="lg"
            />
          </SectionCard>

          <div className="sp-profile-banner">
            <div className="sp-avatar-lg">
              {profile.full_name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="sp-banner-info">
              <div className="sp-banner-name">{profile.full_name || "Super Admin"}</div>
              <div className="sp-banner-email">{profile.email}</div>
              <div className="sp-banner-role">
                <BadgeCheck size={13} /> System Administrator
              </div>
            </div>
          </div>

          <SectionCard title="Account Identity" description="Tied to authentication" icon={Shield}>
            <LockedField label="Email Address" value={profile.email} icon={Mail} />
          </SectionCard>

          <SectionCard title="Personal Information" description="Update your details" icon={User}>
            <div className="form-grid-2">
              <div className="field form-full">
                <label className="field-label">Full Name *</label>
                <input
                  className="field-input"
                  placeholder="Your full name"
                  value={profile.full_name}
                  onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div className="field">
                <label className="field-label">Phone Number</label>
                <input
                  className="field-input"
                  placeholder="+92 XXX XXXXXXX"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="sp-save-bar">
              <div className={`sp-save-status${dirty ? " sp-status-dirty" : " sp-status-clean"}`}>
                {dirty ? "Unsaved changes" : "All saved"}
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving || !dirty}
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}