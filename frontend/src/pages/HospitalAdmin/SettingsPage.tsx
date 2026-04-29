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
  Pencil,
  BadgeCheck,
  Hash,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// SECTION TAB CONFIG
// ─────────────────────────────────────────────────────────────

const sections: {
  id: SettingSection;
  label: string;
  description: string;
  icon: React.ElementType;
  grad: string;
  ring: string;
}[] = [
  {
    id: "my-profile",
    label: "My Profile",
    description: "Your personal details",
    icon: User,
    grad: "from-teal-600 to-cyan-600",
    ring: "ring-teal-200",
  },
  {
    id: "hospital-details",
    label: "Hospital Details",
    description: "Contact & address info",
    icon: Building2,
    grad: "from-blue-600 to-indigo-600",
    ring: "ring-blue-200",
  },
  {
    id: "change-password",
    label: "Change Password",
    description: "Update your password",
    icon: Key,
    grad: "from-rose-600 to-pink-600",
    ring: "ring-rose-200",
  },
];

// ─────────────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────────────

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  icon: Icon,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border text-sm text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          transition-all
          ${disabled
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-white border-gray-200 hover:border-gray-300"
          }
          ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`w-full rounded-xl border text-sm text-gray-900 px-4 py-3
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
        transition-all appearance-none
        ${disabled
          ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-white border-gray-200 hover:border-gray-300 cursor-pointer"
        }`}
    >
      <option value="">— Select —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Read-only display field — locked, shows a badge */
function LockedField({
  label,
  value,
  icon: Icon,
  tooltip,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  tooltip?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {label}
        </label>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <Lock className="w-2.5 h-2.5" />
          Permanent
        </span>
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
        )}
        <input
          readOnly
          value={value || "—"}
          title={tooltip}
          className={`w-full rounded-xl border border-gray-100 bg-gray-50 text-gray-500
            text-sm cursor-not-allowed select-none
            ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
        />
      </div>
      {tooltip && (
        <p className="text-[11px] text-gray-400 mt-1">{tooltip}</p>
      )}
    </div>
  );
}

/** Section card container */
function SectionCard({
  title,
  description,
  icon: Icon,
  iconGrad,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  iconGrad: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <div
          className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${iconGrad} flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MY PROFILE SECTION
// ─────────────────────────────────────────────────────────────

function MyProfileSection() {
  const token = localStorage.getItem("accessToken");

  const [profile, setProfile] = useState<AdminProfile>({
    id: "",
    full_name: "",
    phone: "",
    gender: "",
    dob: "",
    email: "",
  });
  const [original, setOriginal] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── fetch ────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/my-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
      const p: AdminProfile = {
        id: data.profile.id,
        full_name: data.profile.full_name || "",
        phone: data.profile.phone || "",
        gender: data.profile.gender || "",
        dob: data.profile.dob || "",
        email: data.profile.email || "",
      };
      setProfile(p);
      setOriginal(p);
    } catch (e: any) {
      toast.error(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty =
    original !== null && JSON.stringify(profile) !== JSON.stringify(original);

  // ── save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profile.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/my-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  const handleDiscard = () => {
    if (original) setProfile(original);
  };

  // ── render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar / identity banner */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl p-6 flex items-center gap-5 shadow-lg shadow-teal-100">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-black text-white">
            {profile.full_name?.charAt(0)?.toUpperCase() || "A"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-extrabold text-lg truncate">
            {profile.full_name || "Hospital Admin"}
          </p>
          <p className="text-white/75 text-sm truncate">{profile.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <BadgeCheck className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-xs font-medium">
              Hospital Administrator
            </span>
          </div>
        </div>
        {dirty && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDiscard}
              className="text-white/70 hover:text-white text-sm font-medium transition px-3 py-1.5 rounded-xl hover:bg-white/10"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-teal-700 font-semibold text-sm
                px-4 py-1.5 rounded-xl hover:bg-teal-50 transition shadow-md disabled:opacity-70"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Read-only — email */}
      <SectionCard
        title="Account Identity"
        description="These details are tied to your authentication account"
        icon={Shield}
        iconGrad="from-gray-600 to-gray-800"
      >
        <LockedField
          label="Email Address"
          value={profile.email}
          icon={Mail}
          tooltip="Email cannot be changed. Contact Super Admin if you need to update it."
        />
      </SectionCard>

      {/* Editable — personal info */}
      <SectionCard
        title="Personal Information"
        description="Update your name and contact details"
        icon={User}
        iconGrad="from-teal-600 to-cyan-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <FieldLabel label="Full Name" required />
            <TextInput
              value={profile.full_name}
              onChange={(v) => setProfile((p) => ({ ...p, full_name: v }))}
              placeholder="Your full name"
              icon={User}
            />
          </div>

          <div>
            <FieldLabel label="Phone Number" />
            <TextInput
              value={profile.phone}
              onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
              placeholder="+92 XXX XXXXXXX"
              icon={Phone}
            />
          </div>

          <div>
            <FieldLabel label="Date of Birth" />
            <TextInput
              value={profile.dob}
              onChange={(v) => setProfile((p) => ({ ...p, dob: v }))}
              type="date"
            />
          </div>

          <div>
            <FieldLabel label="Gender" />
            <SelectInput
              value={profile.gender}
              onChange={(v) => setProfile((p) => ({ ...p, gender: v }))}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>
        </div>

        {/* Action row */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
          {dirty ? (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span>You have unsaved changes</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" />
              <span>All changes saved</span>
            </div>
          )}

          <div className="flex gap-3">
            {dirty && (
              <button
                onClick={handleDiscard}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition px-4 py-2 rounded-xl hover:bg-gray-100"
              >
                Discard
              </button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0 h-10 px-6 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOSPITAL DETAILS SECTION
// ─────────────────────────────────────────────────────────────

function HospitalDetailsSection() {
  const token = localStorage.getItem("accessToken");

  const [hospital, setHospital] = useState<HospitalDetails>({
    id: "",
    name: "",
    registration_number: "",
    license_number: "",
    hospital_type: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    status: "",
    created_at: "",
  });
  const [original, setOriginal] = useState<HospitalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── fetch ────────────────────────────────────────────────────
  const fetchHospital = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/hospital`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch hospital");

      const h: HospitalDetails = {
        id: data.hospital.id,
        name: data.hospital.name || "",
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

  useEffect(() => {
    fetchHospital();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty =
    original !== null && JSON.stringify(hospital) !== JSON.stringify(original);

  // ── save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(
        `${API_URL}/api/hospital-admin/hospital-details`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address: hospital.address || null,
            contact_email: hospital.contact_email || null,
            contact_phone: hospital.contact_phone || null,
            hospital_type: hospital.hospital_type || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setOriginal(hospital);
      toast.success("Hospital details updated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (original) setHospital(original);
  };

  // ── status badge ─────────────────────────────────────────────
  const statusConfig: Record<
    string,
    { label: string; bg: string; text: string; dot: string }
  > = {
    approved: {
      label: "Active",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    pending: {
      label: "Pending",
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    rejected: {
      label: "Suspended",
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
    },
  };
  const statusStyle =
    statusConfig[hospital.status] || statusConfig["pending"];

  // ── render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  if (!hospital.id) {
    return (
      <div className="bg-white rounded-3xl border border-amber-200 p-10 text-center">
        <Building2 className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <p className="text-base font-bold text-gray-900">
          No Hospital Assigned
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Contact Super Admin to assign a hospital to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hospital identity banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 flex items-center gap-5 shadow-lg shadow-blue-100">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-extrabold text-lg truncate">
            {hospital.name}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
              ${statusStyle.bg} ${statusStyle.text}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
              />
              {statusStyle.label}
            </span>
            {hospital.hospital_type && (
              <span className="text-white/70 text-xs font-medium capitalize">
                {hospital.hospital_type}
              </span>
            )}
          </div>
          <p className="text-white/60 text-xs mt-1">
            Registered:{" "}
            {hospital.created_at
              ? new Date(hospital.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>
        {dirty && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDiscard}
              className="text-white/70 hover:text-white text-sm font-medium transition px-3 py-1.5 rounded-xl hover:bg-white/10"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm
                px-4 py-1.5 rounded-xl hover:bg-blue-50 transition shadow-md disabled:opacity-70"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Permanent / read-only info */}
      <SectionCard
        title="Permanent Details"
        description="These fields are set during hospital registration and cannot be changed"
        icon={Lock}
        iconGrad="from-gray-600 to-gray-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <LockedField
            label="Hospital Name"
            value={hospital.name}
            icon={Building2}
            tooltip="Hospital name is fixed after registration. Contact Super Admin to request a name change."
          />
          <LockedField
            label="Registration Number"
            value={hospital.registration_number}
            icon={Hash}
            tooltip="Assigned by the regulatory authority. Cannot be modified."
          />
          <LockedField
            label="License Number"
            value={hospital.license_number || "Not provided"}
            icon={BadgeCheck}
            tooltip="Legal license number. Contact Super Admin if this is incorrect."
          />
        </div>
      </SectionCard>

      {/* Editable contact info */}
      <SectionCard
        title="Contact Information"
        description="Update your hospital's public contact details"
        icon={Phone}
        iconGrad="from-blue-600 to-indigo-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <FieldLabel label="Contact Email" />
            <TextInput
              value={hospital.contact_email}
              onChange={(v) =>
                setHospital((h) => ({ ...h, contact_email: v }))
              }
              placeholder="contact@hospital.com"
              type="email"
              icon={Mail}
            />
          </div>

          <div>
            <FieldLabel label="Contact Phone" />
            <TextInput
              value={hospital.contact_phone}
              onChange={(v) =>
                setHospital((h) => ({ ...h, contact_phone: v }))
              }
              placeholder="+92 XXX XXXXXXX"
              icon={Phone}
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel label="Hospital Type" />
            <SelectInput
              value={hospital.hospital_type}
              onChange={(v) =>
                setHospital((h) => ({ ...h, hospital_type: v }))
              }
              options={[
                { value: "general", label: "General Hospital" },
                { value: "specialty", label: "Specialty Hospital" },
                { value: "teaching", label: "Teaching Hospital" },
                { value: "clinic", label: "Clinic / Polyclinic" },
                { value: "rehabilitation", label: "Rehabilitation Center" },
                { value: "psychiatric", label: "Psychiatric Hospital" },
                { value: "children", label: "Children's Hospital" },
              ]}
            />
          </div>
        </div>
      </SectionCard>

      {/* Editable address */}
      <SectionCard
        title="Physical Address"
        description="Update your hospital's location"
        icon={MapPin}
        iconGrad="from-emerald-600 to-teal-600"
      >
        <div>
          <FieldLabel label="Full Address" />
          <textarea
            value={hospital.address}
            onChange={(e) =>
              setHospital((h) => ({ ...h, address: e.target.value }))
            }
            placeholder="Street, Area, City, Province, Postal Code, Country"
            rows={3}
            className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 text-sm
              px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
              transition resize-none hover:border-gray-300"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Include street, area, city, province and postal code for complete
            address
          </p>
        </div>

        {/* Save actions */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
          {dirty ? (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span>You have unsaved changes</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" />
              <span>All changes saved</span>
            </div>
          )}
          <div className="flex gap-3">
            {dirty && (
              <button
                onClick={handleDiscard}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                Discard
              </button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 h-10 px-6 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CHANGE PASSWORD SECTION
// ─────────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const token = localStorage.getItem("accessToken");

  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // password strength
  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 8) s++;
    if (/[A-Z]/.test(newPass)) s++;
    if (/[0-9]/.test(newPass)) s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return s;
  })();

  const strengthMeta = [
    { label: "", color: "bg-gray-200", text: "" },
    { label: "Weak", color: "bg-red-500", text: "text-red-600" },
    { label: "Fair", color: "bg-amber-500", text: "text-amber-600" },
    { label: "Good", color: "bg-yellow-500", text: "text-yellow-600" },
    { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
  ][strength];

  const requirements = [
    { label: "At least 8 characters", met: newPass.length >= 8 },
    { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(newPass) },
    { label: "One number (0–9)", met: /[0-9]/.test(newPass) },
    {
      label: "One special character (!@#$...)",
      met: /[^A-Za-z0-9]/.test(newPass),
    },
  ];

  const handleSubmit = async () => {
    if (!newPass || !confirm) {
      toast.error("All fields are required");
      return;
    }
    if (newPass !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (strength < 2) {
      toast.error("Password is too weak");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        `${API_URL}/api/hospital-admin/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword: newPass }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      toast.success("Password changed successfully");
      setNewPass("");
      setConfirm("");
    } catch (e: any) {
      toast.error(e.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-3xl p-6 flex items-center gap-4 shadow-lg shadow-rose-100">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
          <Key className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-white font-extrabold text-base">
            Change Password
          </p>
          <p className="text-white/75 text-sm mt-0.5">
            Choose a strong, unique password to keep your admin account secure
          </p>
        </div>
      </div>

      <SectionCard
        title="New Password"
        description="Enter and confirm your new password below"
        icon={Lock}
        iconGrad="from-rose-600 to-pink-600"
      >
        <div className="max-w-md space-y-5">
          {/* New password */}
          <div>
            <FieldLabel label="New Password" required />
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type={showNew ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 text-sm
                  pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500
                  focus:border-transparent transition hover:border-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Strength meter */}
            {newPass && (
              <div className="mt-2.5 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                        i <= strength
                          ? strengthMeta.color
                          : "bg-gray-100"
                      }`}
                    />
                  ))}
                </div>
                {strengthMeta.label && (
                  <p
                    className={`text-xs font-semibold ${strengthMeta.text}`}
                  >
                    Password strength: {strengthMeta.label}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <FieldLabel label="Confirm New Password" required />
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 text-sm
                  pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500
                  focus:border-transparent transition hover:border-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showConfirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirm && newPass && (
              <p
                className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${
                  confirm === newPass
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {confirm === newPass ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Passwords match
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" /> Passwords do not match
                  </>
                )}
              </p>
            )}
          </div>

          {/* Requirements checklist */}
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
              Requirements
            </p>
            {requirements.map((req) => (
              <div key={req.label} className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    req.met ? "bg-emerald-100" : "bg-gray-100"
                  }`}
                >
                  {req.met ? (
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <X className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    req.met ? "text-emerald-700" : "text-gray-500"
                  }`}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !newPass || !confirm}
            className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white border-0 h-12 font-semibold disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Key className="w-4 h-4 mr-2" />
            )}
            {saving ? "Updating Password..." : "Update Password"}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SETTINGS PAGE
// ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingSection>("my-profile");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100/50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 px-8 py-8 shadow-lg">
        <div className="max-w-[1300px] mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Settings className="w-7 h-7 text-white" />
            <h1 className="text-2xl font-extrabold text-white">Settings</h1>
          </div>
          <p className="text-white/75 text-sm">
            Manage your profile, hospital details and account security
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* ── Left Navigation ──────────────────────────────── */}
          <div className="w-64 flex-shrink-0 sticky top-8">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 px-2">
                  Settings
                </p>
              </div>
              <nav className="p-3 space-y-1">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const active = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl
                        transition-all text-left group ${
                          active
                            ? `bg-gradient-to-r ${sec.grad} text-white shadow-md ring-4 ${sec.ring}`
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                          transition-all ${
                            active
                              ? "bg-white/20"
                              : "bg-gray-100 group-hover:bg-gray-200"
                          }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            active ? "text-white" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            active ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {sec.label}
                        </p>
                        <p
                          className={`text-xs truncate mt-0.5 ${
                            active ? "text-white/70" : "text-gray-400"
                          }`}
                        >
                          {sec.description}
                        </p>
                      </div>
                      {active && (
                        <ChevronRight className="w-4 h-4 text-white/70 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ── Main Content ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {activeSection === "my-profile" && <MyProfileSection />}
            {activeSection === "hospital-details" && (
              <HospitalDetailsSection />
            )}
            {activeSection === "change-password" && (
              <ChangePasswordSection />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}