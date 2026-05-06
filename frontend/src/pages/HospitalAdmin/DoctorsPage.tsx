import React, { useEffect, useMemo, useState } from "react";
import {
  Stethoscope,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Copy,
  X,
  Edit3,
  KeyRound,
  ShieldOff,
  ShieldCheck,
  Activity,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  Mail,
  Hash,
  BadgeCheck,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type Doctor = {
  profile_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender?: string | null;
  dob?: string | null;
  specialization: string;
  license_number: string;
  cnic: string;
  approval_status: "approved" | "rejected" | "pending" | string;
  created_at?: string | null;
};

type StatusFilter = "all" | "active" | "inactive";

const isActive = (s?: string | null) => s === "approved";

const fmtDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/* ─────────────────────────────────────────────────────────────
   MODAL SHELL — reusable backdrop + card
   ───────────────────────────────────────────────────────────── */
function ModalShell({
  title,
  gradient,
  icon: Icon,
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  gradient: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl overflow-hidden
          animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between`}
          style={{ background: `linear-gradient(135deg,${gradient})` }}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-white" />
              </div>
            )}
            <p className="font-bold text-white text-sm">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20
              flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CREDENTIALS MODAL
   ───────────────────────────────────────────────────────────── */
function CredentialsModal({
  open,
  onClose,
  email,
  password,
  generated,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
  password: string | null;
  generated: boolean;
}) {
  if (!open) return null;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-white" />
            <p className="font-bold text-white text-sm">Credentials</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20
              flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Email */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Email
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-sm text-gray-900 break-all">
                {email}
              </p>
              <button
                onClick={() => copy(email)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                  text-xs font-medium text-gray-600 bg-white border
                  border-gray-200 hover:bg-gray-100 transition-colors
                  flex-shrink-0"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </p>
            {generated ? (
              <>
                <p className="text-[11px] text-amber-600 font-medium mb-2">
                  ⚠ Shown only once — copy it now
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {password || "—"}
                  </p>
                  {password && (
                    <button
                      onClick={() => copy(password)}
                      className="flex items-center gap-1.5 px-3 py-1.5
                        rounded-lg text-xs font-medium text-gray-600 bg-white
                        border border-gray-200 hover:bg-gray-100
                        transition-colors flex-shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Password was set manually (not displayed).
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-blue-500 to-cyan-500
              hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FIELD HELPERS
   ───────────────────────────────────────────────────────────── */
function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
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
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border text-sm transition-all
          focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400
          ${disabled ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 hover:border-gray-300 text-gray-900"}
          ${Icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5"}`}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function DoctorsPage({
  onRefreshGlobal,
}: {
  onRefreshGlobal: () => void;
}) {
  const token = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // create
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    specialization: "",
    license_number: "",
    cnic: "",
    generate_password: true,
    password: "",
  });

  // edit
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    gender: "",
    dob: "",
    specialization: "",
    license_number: "",
    cnic: "",
  });

  // reset password
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetTarget, setResetTarget] = useState<Doctor | null>(null);
  const [resetForm, setResetForm] = useState({
    generate_password: true,
    password: "",
  });

  // credentials
  const [credOpen, setCredOpen] = useState(false);
  const [cred, setCred] = useState<{
    email: string;
    password: string | null;
    generated: boolean;
  }>({ email: "", password: null, generated: false });

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchDoctors = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load doctors");
      setDoctors(data.doctors || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = doctors;
    if (statusFilter === "active")
      list = list.filter((d) => isActive(d.approval_status));
    if (statusFilter === "inactive")
      list = list.filter((d) => !isActive(d.approval_status));
    if (!s) return list;
    return list.filter((d) =>
      `${d.full_name} ${d.email || ""} ${d.phone || ""} ${d.specialization} ${d.license_number} ${d.cnic}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, doctors, statusFilter]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  /* ── Create ─────────────────────────────────────────────── */
  const createDoctor = async () => {
    if (!token) return;
    const f = createForm;
    if (
      !f.full_name ||
      !f.email ||
      !f.specialization ||
      !f.license_number ||
      !f.cnic
    ) {
      toast.error("Please fill required fields");
      return;
    }
    if (!f.generate_password && f.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/doctors`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: f.full_name,
          email: f.email,
          phone: f.phone || null,
          gender: f.gender || null,
          dob: f.dob || null,
          specialization: f.specialization,
          license_number: f.license_number,
          cnic: f.cnic,
          generate_password: f.generate_password,
          password: f.generate_password ? undefined : f.password,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || "Failed to create");
      toast.success("Doctor created");
      setShowCreate(false);
      setCreateForm({
        full_name: "",
        email: "",
        phone: "",
        gender: "",
        dob: "",
        specialization: "",
        license_number: "",
        cnic: "",
        generate_password: true,
        password: "",
      });
      setCred({
        email: data?.credentials?.email || f.email,
        password: data?.credentials?.password ?? null,
        generated: !!data?.credentials?.generated,
      });
      setCredOpen(true);
      await fetchDoctors();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  /* ── Edit ───────────────────────────────────────────────── */
  const openEdit = (d: Doctor) => {
    setEditTarget(d);
    setEditForm({
      full_name: d.full_name || "",
      phone: d.phone || "",
      gender: d.gender || "",
      dob: d.dob || "",
      specialization: d.specialization || "",
      license_number: d.license_number || "",
      cnic: d.cnic || "",
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!token || !editTarget) return;
    try {
      setEditing(true);
      const res = await fetch(
        `${API_URL}/api/hospital-admin/doctors/${editTarget.profile_id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: editForm.full_name,
            phone: editForm.phone || null,
            gender: editForm.gender || null,
            dob: editForm.dob || null,
            specialization: editForm.specialization,
            license_number: editForm.license_number,
            cnic: editForm.cnic,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Doctor updated");
      setShowEdit(false);
      setEditTarget(null);
      await fetchDoctors();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setEditing(false);
    }
  };

  /* ── Activate / Deactivate ─────────────────────────────── */
  const deactivate = async (d: Doctor) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/doctors/${d.profile_id}/deactivate`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Doctor deactivated");
      await fetchDoctors();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const activate = async (d: Doctor) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/doctors/${d.profile_id}/activate`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Doctor activated");
      await fetchDoctors();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  /* ── Reset Password ────────────────────────────────────── */
  const openReset = (d: Doctor) => {
    setResetTarget(d);
    setResetForm({ generate_password: true, password: "" });
    setShowReset(true);
  };

  const doReset = async () => {
    if (!token || !resetTarget) return;
    if (!resetForm.generate_password && resetForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setResetting(true);
      const res = await fetch(
        `${API_URL}/api/hospital-admin/doctors/${resetTarget.profile_id}/reset-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            generate_password: resetForm.generate_password,
            password: resetForm.generate_password
              ? undefined
              : resetForm.password,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Password reset");
      setShowReset(false);
      setCred({
        email: data?.credentials?.email || resetTarget.email || "",
        password: data?.credentials?.password ?? null,
        generated: !!data?.credentials?.generated,
      });
      setCredOpen(true);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setResetting(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────── */
  const deleteDoctor = async (d: Doctor) => {
    if (!token) return;
    if (
      !window.confirm(
        "Delete this doctor permanently? This cannot be undone."
      )
    )
      return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/doctors/${d.profile_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Doctor deleted");
      await fetchDoctors();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  /* ── Counts ─────────────────────────────────────────────── */
  const activeCount = doctors.filter((d) => isActive(d.approval_status)).length;
  const inactiveCount = doctors.length - activeCount;

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div
        className="px-4 sm:px-8 py-8 shadow-sm"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
                >
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Doctors
                </h1>
              </div>
              <p className="text-slate-400 text-sm ml-12">
                Create, edit, deactivate and reset doctor credentials
              </p>
            </div>

            <div className="flex gap-2 ml-12 sm:ml-0">
              <button
                onClick={fetchDoctors}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                  font-medium text-slate-300 hover:text-white hover:bg-white/10
                  transition-all disabled:opacity-50"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                  font-semibold text-white shadow-sm
                  hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
              >
                <Plus className="w-4 h-4" />
                Add Doctor
              </button>
            </div>
          </div>

          {/* Mini stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 ml-0">
            {[
              { label: "Total", value: doctors.length, color: "text-white" },
              { label: "Active", value: activeCount, color: "text-emerald-400" },
              { label: "Inactive", value: inactiveCount, color: "text-rose-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6 max-w-[1400px] mx-auto space-y-5">

        {/* ── Controls ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, email, phone, specialization..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200
                    text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50
                    focus:border-blue-400 bg-gray-50 hover:bg-white transition-colors"
                />
              </div>

              <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl">
                {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
                      ${statusFilter === f
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 font-medium">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Cards grid (responsive — cards on mobile, table feel on desktop) ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading doctors...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Stethoscope className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No doctors found</p>
            <p className="text-gray-400 text-xs mt-1">
              {doctors.length === 0
                ? "Click 'Add Doctor' to create the first one."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => {
              const active = isActive(d.approval_status);

              return (
                <div
                  key={d.profile_id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden
                    transition-all hover:shadow-md ${
                      active ? "border-gray-100" : "border-rose-100"
                    }`}
                >
                  {/* Accent top */}
                  <div
                    className={`h-0.5 w-full ${
                      active
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : "bg-gradient-to-r from-rose-400 to-pink-400"
                    }`}
                  />

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                      {/* ── Left: Info ────────────────────────── */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center
                            flex-shrink-0 font-bold text-sm ${
                              active
                                ? "bg-blue-50 text-blue-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                        >
                          {d.full_name?.charAt(0)?.toUpperCase() || "D"}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Name + status */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold text-gray-900 text-sm truncate">
                              {d.full_name}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5
                                rounded-full text-[10px] font-bold uppercase tracking-wide
                                ${active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-600 border border-rose-200"
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  active ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              {active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          {/* Email */}
                          {d.email && (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs text-gray-500 font-mono truncate">
                                {d.email}
                              </p>
                              <button
                                onClick={() => copy(d.email!)}
                                className="flex items-center gap-1 px-1.5 py-0.5
                                  rounded text-[10px] font-medium text-gray-400
                                  hover:text-gray-600 hover:bg-gray-100
                                  transition-colors flex-shrink-0"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}

                          {/* Detail chips */}
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1
                              rounded-lg text-[11px] font-medium text-blue-700 bg-blue-50">
                              <Activity className="w-3 h-3" />
                              {d.specialization}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1
                              rounded-lg text-[11px] font-medium text-gray-600 bg-gray-50">
                              <BadgeCheck className="w-3 h-3" />
                              {d.license_number}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1
                              rounded-lg text-[11px] font-medium text-gray-600 bg-gray-50">
                              <Hash className="w-3 h-3" />
                              {d.cnic}
                            </span>
                            {d.phone && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1
                                rounded-lg text-[11px] font-medium text-gray-500 bg-gray-50">
                                <Phone className="w-3 h-3" />
                                {d.phone}
                              </span>
                            )}
                            {d.created_at && (
                              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1
                                rounded-lg text-[11px] font-medium text-gray-400 bg-gray-50">
                                <CalendarDays className="w-3 h-3" />
                                {fmtDate(d.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Right: Actions ────────────────────── */}
                      <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap flex-shrink-0">
                        <button
                          onClick={() => openEdit(d)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                            text-xs font-semibold text-gray-700 bg-gray-50
                            hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => openReset(d)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                            text-xs font-semibold text-gray-700 bg-gray-50
                            hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reset</span>
                        </button>

                        {active ? (
                          <button
                            onClick={() => deactivate(d)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                              text-xs font-semibold text-amber-700 bg-amber-50
                              hover:bg-amber-100 transition-colors border border-amber-200"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Deactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => activate(d)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                              text-xs font-semibold text-emerald-700 bg-emerald-50
                              hover:bg-emerald-100 transition-colors border border-emerald-200"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Activate</span>
                          </button>
                        )}

                        <button
                          onClick={() => deleteDoctor(d)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                            text-xs font-semibold text-rose-600 bg-rose-50
                            hover:bg-rose-100 transition-colors border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
         MODALS
         ═══════════════════════════════════════════════════════ */}

      {/* ── Create Doctor ─────────────────────────────────── */}
      {showCreate && (
        <ModalShell
          title="Add New Doctor"
          gradient="#3b82f6,#06b6d4"
          icon={Stethoscope}
          onClose={() => setShowCreate(false)}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Full Name" required />
                <TextInput
                  value={createForm.full_name}
                  onChange={(v) => setCreateForm({ ...createForm, full_name: v })}
                  placeholder="Dr. John Doe"
                  icon={User}
                />
              </div>
              <div>
                <FieldLabel label="Email" required />
                <TextInput
                  type="email"
                  value={createForm.email}
                  onChange={(v) => setCreateForm({ ...createForm, email: v })}
                  placeholder="doctor@hospital.com"
                  icon={Mail}
                />
              </div>
              <div>
                <FieldLabel label="Phone" />
                <TextInput
                  value={createForm.phone}
                  onChange={(v) => setCreateForm({ ...createForm, phone: v })}
                  placeholder="+92 300 0000000"
                  icon={Phone}
                />
              </div>
              <div>
                <FieldLabel label="Gender" />
                <select
                  value={createForm.gender}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, gender: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white
                    text-sm px-4 py-2.5 focus:outline-none focus:ring-2
                    focus:ring-blue-400/50 focus:border-blue-400
                    hover:border-gray-300 transition-all"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <FieldLabel label="Date of Birth" />
                <TextInput
                  type="date"
                  value={createForm.dob}
                  onChange={(v) => setCreateForm({ ...createForm, dob: v })}
                />
              </div>
              <div />
              <div>
                <FieldLabel label="Specialization" required />
                <TextInput
                  value={createForm.specialization}
                  onChange={(v) =>
                    setCreateForm({ ...createForm, specialization: v })
                  }
                  placeholder="Cardiology"
                  icon={Activity}
                />
              </div>
              <div>
                <FieldLabel label="License #" required />
                <TextInput
                  value={createForm.license_number}
                  onChange={(v) =>
                    setCreateForm({ ...createForm, license_number: v })
                  }
                  placeholder="PMC-12345"
                  icon={BadgeCheck}
                />
              </div>
              <div>
                <FieldLabel label="CNIC" required />
                <TextInput
                  value={createForm.cnic}
                  onChange={(v) => setCreateForm({ ...createForm, cnic: v })}
                  placeholder="42301-1234567-1"
                  icon={Hash}
                />
              </div>
            </div>

            {/* Password section */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Password</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Generate automatically or set manually
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.generate_password}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        generate_password: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600
                      focus:ring-blue-400"
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    Auto-generate
                  </span>
                </label>
              </div>
              {!createForm.generate_password && (
                <div className="mt-3">
                  <FieldLabel label="Manual Password" />
                  <TextInput
                    type="password"
                    value={createForm.password}
                    onChange={(v) =>
                      setCreateForm({ ...createForm, password: v })
                    }
                    placeholder="Min 6 characters"
                    icon={KeyRound}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600
                  hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createDoctor}
                disabled={creating}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white
                  shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
              >
                {creating ? "Creating..." : "Create Doctor"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ── Edit Doctor ───────────────────────────────────── */}
      {showEdit && editTarget && (
        <ModalShell
          title="Edit Doctor"
          gradient="#3b82f6,#06b6d4"
          icon={Edit3}
          onClose={() => setShowEdit(false)}
        >
          <div className="space-y-5">
            {/* Read-only email */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Email (read-only)
              </p>
              <p className="text-sm font-mono text-gray-700 break-all">
                {editTarget.email || "—"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Full Name" />
                <TextInput
                  value={editForm.full_name}
                  onChange={(v) => setEditForm({ ...editForm, full_name: v })}
                  icon={User}
                />
              </div>
              <div>
                <FieldLabel label="Phone" />
                <TextInput
                  value={editForm.phone}
                  onChange={(v) => setEditForm({ ...editForm, phone: v })}
                  icon={Phone}
                />
              </div>
              <div>
                <FieldLabel label="Gender" />
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gender: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white
                    text-sm px-4 py-2.5 focus:outline-none focus:ring-2
                    focus:ring-blue-400/50 focus:border-blue-400
                    hover:border-gray-300 transition-all"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <FieldLabel label="Date of Birth" />
                <TextInput
                  type="date"
                  value={editForm.dob}
                  onChange={(v) => setEditForm({ ...editForm, dob: v })}
                />
              </div>
              <div>
                <FieldLabel label="Specialization" />
                <TextInput
                  value={editForm.specialization}
                  onChange={(v) =>
                    setEditForm({ ...editForm, specialization: v })
                  }
                  icon={Activity}
                />
              </div>
              <div>
                <FieldLabel label="License #" />
                <TextInput
                  value={editForm.license_number}
                  onChange={(v) =>
                    setEditForm({ ...editForm, license_number: v })
                  }
                  icon={BadgeCheck}
                />
              </div>
              <div>
                <FieldLabel label="CNIC" />
                <TextInput
                  value={editForm.cnic}
                  onChange={(v) => setEditForm({ ...editForm, cnic: v })}
                  icon={Hash}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEdit(false)}
                disabled={editing}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600
                  hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editing}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white
                  shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
              >
                {editing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ── Reset Password ────────────────────────────────── */}
      {showReset && resetTarget && (
        <ModalShell
          title="Reset Password"
          gradient="#3b82f6,#06b6d4"
          icon={KeyRound}
          onClose={() => setShowReset(false)}
          maxWidth="max-w-md"
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Doctor
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {resetTarget.full_name}
              </p>
              <p className="text-xs text-gray-500 font-mono break-all">
                {resetTarget.email || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Password Mode
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Generate or set manually
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetForm.generate_password}
                    onChange={(e) =>
                      setResetForm({
                        ...resetForm,
                        generate_password: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-blue-600
                      focus:ring-blue-400"
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    Auto-generate
                  </span>
                </label>
              </div>
              {!resetForm.generate_password && (
                <div className="mt-3">
                  <FieldLabel label="New Password" />
                  <TextInput
                    type="password"
                    value={resetForm.password}
                    onChange={(v) =>
                      setResetForm({ ...resetForm, password: v })
                    }
                    placeholder="Min 6 characters"
                    icon={KeyRound}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReset(false)}
                disabled={resetting}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600
                  hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={doReset}
                disabled={resetting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white
                  shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)" }}
              >
                {resetting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ── Credentials ───────────────────────────────────── */}
      <CredentialsModal
        open={credOpen}
        onClose={() => setCredOpen(false)}
        email={cred.email}
        password={cred.password}
        generated={cred.generated}
      />
    </div>
  );
}