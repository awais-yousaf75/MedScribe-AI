import React, { useEffect, useState } from "react";
import {
  Settings, User, Building2, Key, Save, RefreshCw,
  Eye, EyeOff, Mail, Phone, MapPin, CheckCircle, X,
  AlertCircle, Lock, Shield, BadgeCheck, Hash,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────────────────────────────────────────────────
   TYPES — untouched
───────────────────────────────────────────────────────────── */
interface AdminProfile {
  id: string; full_name: string; phone: string;
  gender: string; dob: string; email: string;
}

interface HospitalDetails {
  id: string; name: string; registration_number: string;
  license_number: string; hospital_type: string; address: string;
  contact_email: string; contact_phone: string;
  status: string; created_at: string;
}

type SettingSection = "my-profile" | "hospital-details" | "change-password";

const sectionConfig: {
  id: SettingSection; label: string; description: string; icon: React.ElementType;
}[] = [
  { id: "my-profile",       label: "My Profile",       description: "Personal details",   icon: User     },
  { id: "hospital-details", label: "Hospital Details",  description: "Contact & address",  icon: Building2 },
  { id: "change-password",  label: "Change Password",   description: "Account security",   icon: Key      },
];

/* ─────────────────────────────────────────────────────────────
   SHARED UI — replaced with system classes
───────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   MY PROFILE
───────────────────────────────────────────────────────────── */
function MyProfileSection() {
  const token = localStorage.getItem("accessToken");
  const [profile,  setProfile]  = useState<AdminProfile>({ id: "", full_name: "", phone: "", gender: "", dob: "", email: "" });
  const [original, setOriginal] = useState<AdminProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/my-profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
      const p: AdminProfile = {
        id: data.profile.id, full_name: data.profile.full_name || "",
        phone: data.profile.phone || "", gender: data.profile.gender || "",
        dob: data.profile.dob || "", email: data.profile.email || "",
      };
      setProfile(p); setOriginal(p);
    } catch (e: any) { toast.error(e.message || "Failed to load profile"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const dirty = original !== null && JSON.stringify(profile) !== JSON.stringify(original);

  const handleSave = async () => {
    if (!profile.full_name.trim()) { toast.error("Full name is required"); return; }
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/my-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: profile.full_name.trim(), phone: profile.phone || null, gender: profile.gender || null, dob: profile.dob || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      setOriginal(profile);
      toast.success("Profile updated successfully");
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="do-loading-screen" style={{ minHeight: 240 }}>
        <RefreshCw size={28} className="animate-spin do-loading-icon" />
      </div>
    );
  }

  return (
    <div className="sp-section">

      {/* Banner */}
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
            <button type="button" className="sp-banner-discard" onClick={() => original && setProfile(original)}>
              Discard
            </button>
            <button type="button" className="sp-banner-save" onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Read-only */}
      <SectionCard title="Account Identity" description="Tied to authentication" icon={Shield}>
        <LockedField label="Email Address" value={profile.email} icon={Mail}
          tooltip="Contact Super Admin to update your email." />
      </SectionCard>

      {/* Editable */}
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
  );
}

/* ─────────────────────────────────────────────────────────────
   HOSPITAL DETAILS
───────────────────────────────────────────────────────────── */
function HospitalDetailsSection() {
  const token = localStorage.getItem("accessToken");
  const [hospital,  setHospital]  = useState<HospitalDetails>({
    id: "", name: "", registration_number: "", license_number: "",
    hospital_type: "", address: "", contact_email: "", contact_phone: "",
    status: "", created_at: "",
  });
  const [original,  setOriginal]  = useState<HospitalDetails | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  const fetchHospital = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/hospital`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch hospital");
      const h: HospitalDetails = {
        id: data.hospital.id, name: data.hospital.name || "",
        registration_number: data.hospital.registration_number || "",
        license_number: data.hospital.license_number || "",
        hospital_type: data.hospital.hospital_type || "",
        address: data.hospital.address || "",
        contact_email: data.hospital.contact_email || "",
        contact_phone: data.hospital.contact_phone || "",
        status: data.hospital.status || "",
        created_at: data.hospital.created_at || "",
      };
      setHospital(h); setOriginal(h);
    } catch (e: any) { toast.error(e.message || "Failed to load hospital details"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHospital(); }, []);

  const dirty = original !== null && JSON.stringify(hospital) !== JSON.stringify(original);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/hospital-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ address: hospital.address || null, contact_email: hospital.contact_email || null, contact_phone: hospital.contact_phone || null, hospital_type: hospital.hospital_type || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setOriginal(hospital);
      toast.success("Hospital details updated");
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="do-loading-screen" style={{ minHeight: 240 }}>
        <RefreshCw size={28} className="animate-spin do-loading-icon" />
      </div>
    );
  }

  if (!hospital.id) {
    return (
      <div className="empty-state card">
        <Building2 size={40} className="empty-icon" />
        <div className="empty-title">No Hospital Assigned</div>
        <div className="empty-sub">Contact Super Admin.</div>
      </div>
    );
  }

  return (
    <div className="sp-section">

      {/* Banner */}
      <div className="sp-hospital-banner">
        <div className="icon-wrap icon-wrap-lg icon-wrap-teal" style={{ flexShrink: 0 }}>
          <Building2 size={24} color="#fff" />
        </div>
        <div className="sp-banner-info">
          <div className="sp-banner-name">{hospital.name}</div>
          <div className="sp-banner-email">
            {hospital.hospital_type ? hospital.hospital_type + " · " : ""}
            Registered {hospital.created_at
              ? new Date(hospital.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : "—"}
          </div>
        </div>
        {dirty && (
          <div className="sp-banner-actions">
            <button type="button" className="sp-banner-discard" onClick={() => original && setHospital(original)}>
              Discard
            </button>
            <button type="button" className="sp-banner-save" onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Permanent */}
      <SectionCard title="Permanent Details" description="Cannot be changed after registration" icon={Lock}>
        <div className="form-grid-2">
          <LockedField label="Hospital Name" value={hospital.name} icon={Building2}
            tooltip="Contact Super Admin for name change." />
          <LockedField label="Registration #" value={hospital.registration_number} icon={Hash}
            tooltip="Assigned by regulatory authority." />
          <LockedField label="License #" value={hospital.license_number || "Not provided"} icon={BadgeCheck}
            tooltip="Contact Super Admin if incorrect." />
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard title="Contact Information" description="Public contact details" icon={Phone}>
        <div className="form-grid-2">
          <div className="field">
            <label className="field-label">Contact Email</label>
            <input type="email" className="field-input" placeholder="contact@hospital.com"
              value={hospital.contact_email}
              onChange={(e) => setHospital((h) => ({ ...h, contact_email: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field-label">Contact Phone</label>
            <input className="field-input" placeholder="+92 XXX XXXXXXX"
              value={hospital.contact_phone}
              onChange={(e) => setHospital((h) => ({ ...h, contact_phone: e.target.value }))} />
          </div>
          <div className="field form-full">
            <label className="field-label">Hospital Type</label>
            <select className="field-select" value={hospital.hospital_type}
              onChange={(e) => setHospital((h) => ({ ...h, hospital_type: e.target.value }))}>
              <option value="">— Select —</option>
              <option value="general">General Hospital</option>
              <option value="specialty">Specialty Hospital</option>
              <option value="teaching">Teaching Hospital</option>
              <option value="clinic">Clinic / Polyclinic</option>
              <option value="rehabilitation">Rehabilitation Center</option>
              <option value="psychiatric">Psychiatric Hospital</option>
              <option value="children">Children's Hospital</option>
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard title="Physical Address" description="Hospital location" icon={MapPin}>
        <div className="field">
          <label className="field-label">Full Address</label>
          <textarea
            className="field-textarea"
            rows={3}
            placeholder="Street, Area, City, Province, Postal Code"
            value={hospital.address}
            onChange={(e) => setHospital((h) => ({ ...h, address: e.target.value }))}
          />
          <div className="field-error" style={{ color: "var(--ms-text-muted)" }}>
            Include complete address for patient visibility.
          </div>
        </div>
        <SaveBar dirty={dirty} saving={saving}
          onDiscard={() => original && setHospital(original)}
          onSave={handleSave} />
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHANGE PASSWORD
───────────────────────────────────────────────────────────── */
function ChangePasswordSection() {
  const token = localStorage.getItem("accessToken");
  const [newPass,      setNewPass]      = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [saving,       setSaving]       = useState(false);

  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 8)          s++;
    if (/[A-Z]/.test(newPass))        s++;
    if (/[0-9]/.test(newPass))        s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return s;
  })();

  const strengthColors = ["", "var(--ms-error)", "var(--ms-warning)", "#CA8A04", "var(--ms-success)"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthText   = ["", "var(--ms-error)", "var(--ms-warning)", "#CA8A04", "var(--ms-success)"];

  const requirements = [
    { label: "At least 8 characters",      met: newPass.length >= 8          },
    { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(newPass)        },
    { label: "One number (0–9)",           met: /[0-9]/.test(newPass)        },
    { label: "One special character",      met: /[^A-Za-z0-9]/.test(newPass) },
  ];

  const handleSubmit = async () => {
    if (!newPass || !confirm) { toast.error("All fields are required"); return; }
    if (newPass !== confirm)  { toast.error("Passwords do not match"); return; }
    if (newPass.length < 8)   { toast.error("Min 8 characters"); return; }
    if (strength < 2)         { toast.error("Password is too weak"); return; }
    try {
      setSaving(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      toast.success("Password changed successfully");
      setNewPass(""); setConfirm("");
    } catch (e: any) { toast.error(e.message || "Failed to change password"); }
    finally { setSaving(false); }
  };

  return (
    <div className="sp-section">

      {/* Banner */}
      <div className="sp-danger-banner">
        <div className="icon-wrap icon-wrap-md icon-wrap-navy" style={{ flexShrink: 0 }}>
          <Key size={18} color="var(--ms-error)" />
        </div>
        <div>
          <div className="sp-banner-name">Change Password</div>
          <div className="sp-banner-email">Choose a strong, unique password</div>
        </div>
      </div>

      <SectionCard title="New Password" description="Enter and confirm below" icon={Lock}>
        <div className="sp-password-form">

          {/* New password */}
          <div className="field">
            <label className="field-label">New Password *</label>
            <div className="field-input-wrap">
              <Lock className="field-icon" size={15} />
              <input
                type={showNew ? "text" : "password"}
                className="field-input field-input-icon sp-pw-input"
                placeholder="Enter new password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <button
                type="button"
                className="sp-eye-btn"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {newPass && (
              <div className="sp-strength-wrap">
                <div className="sp-strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="sp-strength-bar"
                      style={{ background: i <= strength ? strengthColors[strength] : "var(--ms-border)" }}
                    />
                  ))}
                </div>
                {strengthLabels[strength] && (
                  <div className="sp-strength-label" style={{ color: strengthText[strength] }}>
                    Strength: {strengthLabels[strength]}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm */}
          <div className="field">
            <label className="field-label">Confirm Password *</label>
            <div className="field-input-wrap">
              <Key className="field-icon" size={15} />
              <input
                type={showConfirm ? "text" : "password"}
                className="field-input field-input-icon sp-pw-input"
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <button
                type="button"
                className="sp-eye-btn"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirm && newPass && (
              <div className="sp-match-text" style={{ color: confirm === newPass ? "var(--ms-success)" : "var(--ms-error)" }}>
                {confirm === newPass
                  ? <><CheckCircle size={12} /> Match</>
                  : <><X size={12} /> Mismatch</>
                }
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="sp-requirements">
            <div className="info-label" style={{ marginBottom: 10 }}>Requirements</div>
            {requirements.map((r) => (
              <div key={r.label} className="sp-req-item">
                <div className={`sp-req-dot${r.met ? " sp-req-met" : ""}`}>
                  {r.met
                    ? <CheckCircle size={11} color="var(--ms-success)" />
                    : <X size={11} color="var(--ms-text-muted)" />
                  }
                </div>
                <span className="sp-req-label" style={{ color: r.met ? "var(--ms-success)" : "var(--ms-text-soft)" }}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-sm sp-submit-btn"
            onClick={handleSubmit}
            disabled={saving || !newPass || !confirm}
          >
            {saving
              ? <><RefreshCw size={13} className="animate-spin" /> Updating…</>
              : <><Key size={13} /> Update Password</>
            }
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN SETTINGS PAGE
───────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>("my-profile");

  return (
    <div className="page-main">

      {/* ── HEADER + TABS ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Settings size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Settings</div>
              <div className="page-header-sub">
                Manage your profile, hospital details and account security
              </div>
            </div>
          </div>
        </div>

        <div className="tabs">
          {sectionConfig.map((sec) => {
            const Icon   = sec.icon;
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`tab${active ? " tab-active" : ""}`}
                onClick={() => setActiveSection(sec.id)}
              >
                <Icon size={14} />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content">
        {activeSection === "my-profile"       && <MyProfileSection />}
        {activeSection === "hospital-details"  && <HospitalDetailsSection />}
        {activeSection === "change-password"   && <ChangePasswordSection />}
      </div>
    </div>
  );
}