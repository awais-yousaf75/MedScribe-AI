import React, { useEffect, useState } from "react";
import {
  Settings,
  User,
  Building2,
  Key,
  ChevronRight,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  X,
  AlertCircle,
  Lock,
  Shield,
  BadgeCheck,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────── */
interface AdminProfile {
  id: string;
  full_name: string;
  phone: string;
  gender: string;
  dob: string;
  email: string;
}

interface HospitalDetails {
  id: string;
  name: string;
  registration_number: string;
  license_number: string;
  hospital_type: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  created_at: string;
}

type SettingSection = "my-profile" | "hospital-details" | "change-password";

const sectionConfig: {
  id: SettingSection;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}[] = [
  {
    id: "my-profile",
    label: "My Profile",
    description: "Personal details",
    icon: User,
    gradient: "linear-gradient(135deg,#14b8a6,#06b6d4)",
  },
  {
    id: "hospital-details",
    label: "Hospital Details",
    description: "Contact & address",
    icon: Building2,
    gradient: "linear-gradient(135deg,#3b82f6,#6366f1)",
  },
  {
    id: "change-password",
    label: "Change Password",
    description: "Account security",
    icon: Key,
    gradient: "linear-gradient(135deg,#e11d48,#f43f5e)",
  },
];

/* ─────────────────────────────────────────────────────────────
   SHARED UI
   ───────────────────────────────────────────────────────────── */
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text", disabled, icon: Icon,
}: {
  value: string; onChange?: (v: string) => void; placeholder?: string;
  type?: string; disabled?: boolean; icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      )}
      <input
        type={type} value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className={`w-full rounded-xl border text-sm transition-all
          focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400
          ${disabled ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                     : "bg-white border-gray-200 hover:border-gray-300 text-gray-900"}
          ${Icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5"}`}
      />
    </div>
  );
}

function SelectInput({
  value, onChange, options, disabled,
}: {
  value: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean;
}) {
  return (
    <select
      value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled}
      className={`w-full rounded-xl border text-sm px-4 py-2.5 transition-all
        focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 appearance-none
        ${disabled ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                   : "bg-white border-gray-200 hover:border-gray-300 text-gray-900 cursor-pointer"}`}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function LockedField({
  label, value, icon: Icon, tooltip,
}: {
  label: string; value: string; icon?: React.ElementType; tooltip?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</label>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50
          border border-amber-200 px-2 py-0.5 rounded-full">
          <Lock className="w-2.5 h-2.5" /> Permanent
        </span>
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
        )}
        <input readOnly value={value || "—"} title={tooltip}
          className={`w-full rounded-xl border border-gray-100 bg-gray-50 text-gray-500
            text-sm cursor-not-allowed select-none ${Icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5"}`}
        />
      </div>
      {tooltip && <p className="text-[11px] text-gray-400 mt-1">{tooltip}</p>}
    </div>
  );
}

function SectionCard({
  title, description, icon: Icon, gradient, children,
}: {
  title: string; description?: string; icon: React.ElementType;
  gradient: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient }}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MY PROFILE
   ───────────────────────────────────────────────────────────── */
function MyProfileSection() {
  const token = localStorage.getItem("accessToken");
  const [profile, setProfile] = useState<AdminProfile>({
    id: "", full_name: "", phone: "", gender: "", dob: "", email: "",
  });
  const [original, setOriginal] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/my-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
      const p: AdminProfile = {
        id: data.profile.id, full_name: data.profile.full_name || "",
        phone: data.profile.phone || "", gender: data.profile.gender || "",
        dob: data.profile.dob || "", email: data.profile.email || "",
      };
      setProfile(p);
      setOriginal(p);
    } catch (e: any) {
      toast.error(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
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
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-7 h-7 text-teal-500 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center
          justify-center flex-shrink-0 font-black text-xl text-white">
          {profile.full_name?.charAt(0)?.toUpperCase() || "A"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg truncate">
            {profile.full_name || "Hospital Admin"}
          </p>
          <p className="text-white/70 text-sm truncate">{profile.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-white/70" />
            <span className="text-white/70 text-xs font-medium">Hospital Administrator</span>
          </div>
        </div>
        {dirty && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => original && setProfile(original)}
              className="text-white/70 hover:text-white text-sm font-medium px-3 py-1.5
                rounded-lg hover:bg-white/10 transition-all">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-white text-teal-700 font-semibold text-sm
                px-4 py-1.5 rounded-lg shadow-md disabled:opacity-70 transition-all">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Read-only */}
      <SectionCard title="Account Identity" description="Tied to authentication"
        icon={Shield} gradient="linear-gradient(135deg,#475569,#334155)">
        <LockedField label="Email Address" value={profile.email} icon={Mail}
          tooltip="Contact Super Admin to update your email." />
      </SectionCard>

      {/* Editable */}
      <SectionCard title="Personal Information" description="Update your details"
        icon={User} gradient="linear-gradient(135deg,#14b8a6,#06b6d4)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FieldLabel label="Full Name" required />
            <TextInput value={profile.full_name}
              onChange={(v) => setProfile((p) => ({ ...p, full_name: v }))}
              placeholder="Your full name" icon={User} />
          </div>
          <div>
            <FieldLabel label="Phone Number" />
            <TextInput value={profile.phone}
              onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
              placeholder="+92 XXX XXXXXXX" icon={Phone} />
          </div>
          <div>
            <FieldLabel label="Date of Birth" />
            <TextInput value={profile.dob}
              onChange={(v) => setProfile((p) => ({ ...p, dob: v }))} type="date" />
          </div>
          <div>
            <FieldLabel label="Gender" />
            <SelectInput value={profile.gender}
              onChange={(v) => setProfile((p) => ({ ...p, gender: v }))}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]} />
          </div>
        </div>

        {/* Save bar */}
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className={`flex items-center gap-2 text-xs font-medium
            ${dirty ? "text-amber-600" : "text-emerald-600"}`}>
            {dirty
              ? <><AlertCircle className="w-3.5 h-3.5" /> Unsaved changes</>
              : <><CheckCircle className="w-3.5 h-3.5" /> All saved</>}
          </div>
          <div className="flex gap-2">
            {dirty && (
              <button onClick={() => original && setProfile(original)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-2
                  rounded-lg hover:bg-gray-100 transition-colors">
                Discard
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs
                font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}>
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   HOSPITAL DETAILS
   ───────────────────────────────────────────────────────────── */
function HospitalDetailsSection() {
  const token = localStorage.getItem("accessToken");
  const [hospital, setHospital] = useState<HospitalDetails>({
    id: "", name: "", registration_number: "", license_number: "",
    hospital_type: "", address: "", contact_email: "", contact_phone: "",
    status: "", created_at: "",
  });
  const [original, setOriginal] = useState<HospitalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchHospital = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/hospital`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      setHospital(h);
      setOriginal(h);
    } catch (e: any) {
      toast.error(e.message || "Failed to load hospital details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospital(); }, []);

  const dirty = original !== null && JSON.stringify(hospital) !== JSON.stringify(original);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/hospital-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          address: hospital.address || null,
          contact_email: hospital.contact_email || null,
          contact_phone: hospital.contact_phone || null,
          hospital_type: hospital.hospital_type || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setOriginal(hospital);
      toast.success("Hospital details updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!hospital.id) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-900 font-bold">No Hospital Assigned</p>
        <p className="text-gray-400 text-sm mt-1">Contact Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center
          justify-center flex-shrink-0">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg truncate">{hospital.name}</p>
          <p className="text-white/60 text-xs mt-0.5">
            {hospital.hospital_type ? hospital.hospital_type + " · " : ""}
            Registered {hospital.created_at
              ? new Date(hospital.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })
              : "—"}
          </p>
        </div>
        {dirty && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => original && setHospital(original)}
              className="text-white/70 hover:text-white text-sm font-medium px-3 py-1.5
                rounded-lg hover:bg-white/10 transition-all">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm
                px-4 py-1.5 rounded-lg shadow-md disabled:opacity-70 transition-all">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Permanent */}
      <SectionCard title="Permanent Details" description="Cannot be changed after registration"
        icon={Lock} gradient="linear-gradient(135deg,#475569,#334155)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LockedField label="Hospital Name" value={hospital.name} icon={Building2}
            tooltip="Contact Super Admin for name change." />
          <LockedField label="Registration #" value={hospital.registration_number} icon={Hash}
            tooltip="Assigned by regulatory authority." />
          <LockedField label="License #" value={hospital.license_number || "Not provided"} icon={BadgeCheck}
            tooltip="Contact Super Admin if incorrect." />
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard title="Contact Information" description="Public contact details"
        icon={Phone} gradient="linear-gradient(135deg,#3b82f6,#6366f1)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel label="Contact Email" />
            <TextInput value={hospital.contact_email}
              onChange={(v) => setHospital((h) => ({ ...h, contact_email: v }))}
              placeholder="contact@hospital.com" type="email" icon={Mail} />
          </div>
          <div>
            <FieldLabel label="Contact Phone" />
            <TextInput value={hospital.contact_phone}
              onChange={(v) => setHospital((h) => ({ ...h, contact_phone: v }))}
              placeholder="+92 XXX XXXXXXX" icon={Phone} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel label="Hospital Type" />
            <SelectInput value={hospital.hospital_type}
              onChange={(v) => setHospital((h) => ({ ...h, hospital_type: v }))}
              options={[
                { value: "general",        label: "General Hospital"       },
                { value: "specialty",      label: "Specialty Hospital"     },
                { value: "teaching",       label: "Teaching Hospital"      },
                { value: "clinic",         label: "Clinic / Polyclinic"    },
                { value: "rehabilitation", label: "Rehabilitation Center"  },
                { value: "psychiatric",    label: "Psychiatric Hospital"   },
                { value: "children",       label: "Children's Hospital"    },
              ]} />
          </div>
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard title="Physical Address" description="Hospital location"
        icon={MapPin} gradient="linear-gradient(135deg,#10b981,#14b8a6)">
        <div>
          <FieldLabel label="Full Address" />
          <textarea value={hospital.address}
            onChange={(e) => setHospital((h) => ({ ...h, address: e.target.value }))}
            placeholder="Street, Area, City, Province, Postal Code"
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 text-sm
              px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400
              transition resize-none hover:border-gray-300" />
          <p className="text-[11px] text-gray-400 mt-1.5">
            Include complete address for patient visibility.
          </p>
        </div>

        {/* Save bar */}
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className={`flex items-center gap-2 text-xs font-medium
            ${dirty ? "text-amber-600" : "text-emerald-600"}`}>
            {dirty
              ? <><AlertCircle className="w-3.5 h-3.5" /> Unsaved changes</>
              : <><CheckCircle className="w-3.5 h-3.5" /> All saved</>}
          </div>
          <div className="flex gap-2">
            {dirty && (
              <button onClick={() => original && setHospital(original)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-2
                  rounded-lg hover:bg-gray-100 transition-colors">
                Discard
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !dirty}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs
                font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHANGE PASSWORD
   ───────────────────────────────────────────────────────────── */
function ChangePasswordSection() {
  const token = localStorage.getItem("accessToken");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 8)          s++;
    if (/[A-Z]/.test(newPass))        s++;
    if (/[0-9]/.test(newPass))        s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return s;
  })();

  const strengthColors = ["bg-gray-200", "bg-rose-500", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthText   = ["", "text-rose-600", "text-amber-600", "text-yellow-600", "text-emerald-600"];

  const requirements = [
    { label: "At least 8 characters",      met: newPass.length >= 8          },
    { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(newPass)        },
    { label: "One number (0–9)",           met: /[0-9]/.test(newPass)        },
    { label: "One special character",      met: /[^A-Za-z0-9]/.test(newPass) },
  ];

  const handleSubmit = async () => {
    if (!newPass || !confirm) { toast.error("All fields are required"); return; }
    if (newPass !== confirm)  { toast.error("Passwords do not match");  return; }
    if (newPass.length < 8)   { toast.error("Min 8 characters");       return; }
    if (strength < 2)         { toast.error("Password is too weak");   return; }
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      toast.success("Password changed successfully");
      setNewPass(""); setConfirm("");
    } catch (e: any) {
      toast.error(e.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg,#e11d48,#f43f5e)" }}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center
          justify-center flex-shrink-0">
          <Key className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-white font-bold">Change Password</p>
          <p className="text-white/70 text-sm mt-0.5">
            Choose a strong, unique password
          </p>
        </div>
      </div>

      <SectionCard title="New Password" description="Enter and confirm below"
        icon={Lock} gradient="linear-gradient(135deg,#e11d48,#f43f5e)">
        <div className="max-w-md space-y-4">
          {/* New */}
          <div>
            <FieldLabel label="New Password" required />
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type={showNew ? "text" : "password"} value={newPass}
                onChange={(e) => setNewPass(e.target.value)} placeholder="Enter new password"
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 text-sm
                  pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/50
                  focus:border-rose-400 hover:border-gray-300 transition-all" />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPass && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all
                      ${i <= strength ? strengthColors[strength] : "bg-gray-100"}`} />
                  ))}
                </div>
                {strengthLabels[strength] && (
                  <p className={`text-xs font-semibold ${strengthText[strength]}`}>
                    Strength: {strengthLabels[strength]}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <FieldLabel label="Confirm Password" required />
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type={showConfirm ? "text" : "password"} value={confirm}
                onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password"
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 text-sm
                  pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/50
                  focus:border-rose-400 hover:border-gray-300 transition-all" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirm && newPass && (
              <p className={`text-xs font-semibold mt-1 flex items-center gap-1
                ${confirm === newPass ? "text-emerald-600" : "text-rose-500"}`}>
                {confirm === newPass
                  ? <><CheckCircle className="w-3 h-3" /> Match</>
                  : <><X className="w-3 h-3" /> Mismatch</>}
              </p>
            )}
          </div>

          {/* Requirements */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Requirements
            </p>
            {requirements.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center
                  ${r.met ? "bg-emerald-100" : "bg-gray-100"}`}>
                  {r.met
                    ? <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                    : <X className="w-2.5 h-2.5 text-gray-400" />}
                </div>
                <span className={`text-xs font-medium ${r.met ? "text-emerald-700" : "text-gray-500"}`}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={saving || !newPass || !confirm}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white
              disabled:opacity-50 transition-opacity"
            style={{ background: "linear-gradient(135deg,#e11d48,#f43f5e)" }}>
            {saving
              ? <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
                </span>
              : <span className="flex items-center justify-center gap-2">
                  <Key className="w-3.5 h-3.5" /> Update Password
                </span>}
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
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="px-4 sm:px-8 py-8 shadow-sm"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}>
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Settings
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-12">
            Manage your profile, hospital details and account security
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Sidebar Nav ─────────────────────────────── */}
          <div className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-2">
                  Settings
                </p>
              </div>
              <nav className="p-3 space-y-1">
                {sectionConfig.map((sec) => {
                  const Icon = sec.icon;
                  const active = activeSection === sec.id;

                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl
                        transition-all text-left group
                        ${active
                          ? "shadow-md"
                          : "hover:bg-gray-50"
                        }`}
                      style={active ? { background: sec.gradient } : undefined}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                        flex-shrink-0 transition-all
                        ${active ? "bg-white/20" : "bg-gray-100 group-hover:bg-gray-200"}`}>
                        <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate
                          ${active ? "text-white" : "text-gray-900"}`}>
                          {sec.label}
                        </p>
                        <p className={`text-[11px] truncate mt-0.5
                          ${active ? "text-white/70" : "text-gray-400"}`}>
                          {sec.description}
                        </p>
                      </div>
                      {active && (
                        <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ── Content ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {activeSection === "my-profile"       && <MyProfileSection />}
            {activeSection === "hospital-details"  && <HospitalDetailsSection />}
            {activeSection === "change-password"   && <ChangePasswordSection />}
          </div>
        </div>
      </div>
    </div>
  );
}