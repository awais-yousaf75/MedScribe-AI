import React, { useEffect, useMemo, useState } from "react";
import {
  UserCog,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Copy,
  X,
  Edit3,
  KeyRound,
  Link2,
  Unlink,
  ShieldOff,
  ShieldCheck,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Stethoscope,
  CalendarDays,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type StatusFilter = "all" | "active" | "inactive";
type DoctorOption = { profile_id: string; full_name: string };

type Assistant = {
  profile_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender?: string | null;
  dob?: string | null;
  approval_status: "approved" | "rejected" | "pending" | string;
  doctor: { id: string; full_name: string } | null;
  created_at?: string | null;
};

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
   MODAL SHELL
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
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl overflow-hidden`}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
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
          style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}
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
                  border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>

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
              hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}
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
          focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400
          ${disabled
            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white border-gray-200 hover:border-gray-300 text-gray-900"
          }
          ${Icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5"}`}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function AssistantsPage({
  onRefreshGlobal,
}: {
  onRefreshGlobal: () => void;
}) {
  const token = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
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
    doctor_profile_id: "",
    generate_password: true,
    password: "",
  });

  // edit
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<Assistant | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    gender: "",
    dob: "",
  });

  // link
  const [linkModal, setLinkModal] = useState<{
    open: boolean;
    assistant: Assistant | null;
    doctorId: string;
  }>({ open: false, assistant: null, doctorId: "" });

  // reset
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetTarget, setResetTarget] = useState<Assistant | null>(null);
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
  const fetchAssistants = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to load assistants");
      setAssistants(data.assistants || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load assistants");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorOptions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/hospital-admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to load doctors");
      const opts: DoctorOption[] = (data.doctors || [])
        .filter((d: any) => d.approval_status === "approved")
        .map((d: any) => ({
          profile_id: d.profile_id,
          full_name: d.full_name,
        }));
      setDoctorOptions(opts);
    } catch (e: any) {
      toast.error(e.message || "Failed to load doctor options");
    }
  };

  useEffect(() => {
    fetchAssistants();
    fetchDoctorOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Derived ────────────────────────────────────────────── */
  const activeCount = assistants.filter((a) =>
    isActive(a.approval_status)
  ).length;
  const inactiveCount = assistants.length - activeCount;

  const unlinkedCount = useMemo(
    () =>
      assistants.filter(
        (a) => isActive(a.approval_status) && !a.doctor
      ).length,
    [assistants]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = assistants;
    if (statusFilter === "active")
      list = list.filter((a) => isActive(a.approval_status));
    if (statusFilter === "inactive")
      list = list.filter((a) => !isActive(a.approval_status));
    if (!s) return list;
    return list.filter((a) =>
      `${a.full_name} ${a.email || ""} ${a.phone || ""} ${a.doctor?.full_name || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, assistants, statusFilter]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  /* ── Create ─────────────────────────────────────────────── */
  const createAssistant = async () => {
    if (!token) return;
    const f = createForm;
    if (!f.full_name || !f.email) {
      toast.error("Please fill required fields");
      return;
    }
    if (!f.generate_password && f.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      setCreating(true);
      const res = await fetch(
        `${API_URL}/api/hospital-admin/assistants`,
        {
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
            doctor_profile_id: f.doctor_profile_id || null,
            generate_password: f.generate_password,
            password: f.generate_password ? undefined : f.password,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.message || data.error || "Failed to create"
        );
      toast.success("Assistant created");
      setShowCreate(false);
      setCreateForm({
        full_name: "",
        email: "",
        phone: "",
        gender: "",
        dob: "",
        doctor_profile_id: "",
        generate_password: true,
        password: "",
      });
      setCred({
        email: data?.credentials?.email || f.email,
        password: data?.credentials?.password ?? null,
        generated: !!data?.credentials?.generated,
      });
      setCredOpen(true);
      await fetchAssistants();
      await fetchDoctorOptions();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  /* ── Edit ───────────────────────────────────────────────── */
  const openEdit = (a: Assistant) => {
    setEditTarget(a);
    setEditForm({
      full_name: a.full_name || "",
      phone: a.phone || "",
      gender: a.gender || "",
      dob: a.dob || "",
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!token || !editTarget) return;
    try {
      setEditing(true);
      const res = await fetch(
        `${API_URL}/api/hospital-admin/assistants/${editTarget.profile_id}`,
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
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Assistant updated");
      setShowEdit(false);
      setEditTarget(null);
      await fetchAssistants();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setEditing(false);
    }
  };

  /* ── Link / Unlink ──────────────────────────────────────── */
  const updateLink = async (
    assistantId: string,
    doctorId: string | null
  ) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/assistants/${assistantId}/link-doctor`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ doctor_profile_id: doctorId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Link updated");
      await fetchAssistants();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  /* ── Activate / Deactivate ──────────────────────────────── */
  const deactivate = async (a: Assistant) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/assistants/${a.profile_id}/deactivate`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Assistant deactivated");
      await fetchAssistants();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const activate = async (a: Assistant) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/assistants/${a.profile_id}/activate`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Assistant activated");
      await fetchAssistants();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  /* ── Reset Password ─────────────────────────────────────── */
  const openReset = (a: Assistant) => {
    setResetTarget(a);
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
        `${API_URL}/api/hospital-admin/assistants/${resetTarget.profile_id}/reset-password`,
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
  const deleteAssistant = async (a: Assistant) => {
    if (!token) return;
    if (
      !window.confirm(
        "Delete this assistant permanently? This cannot be undone."
      )
    )
      return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/assistants/${a.profile_id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Assistant deleted");
      await fetchAssistants();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

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
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#c026d3)",
                  }}
                >
                  <UserCog className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Assistants
                </h1>
              </div>
              <p className="text-slate-400 text-sm ml-12">
                Create, link, deactivate and manage assistant credentials
              </p>
            </div>

            <div className="flex gap-2 ml-12 sm:ml-0">
              <button
                onClick={async () => {
                  await fetchAssistants();
                  await fetchDoctorOptions();
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                  font-medium text-slate-300 hover:text-white hover:bg-white/10
                  transition-all disabled:opacity-50"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                  font-semibold text-white shadow-sm hover:opacity-90
                  transition-opacity"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#c026d3)",
                }}
              >
                <Plus className="w-4 h-4" />
                Add Assistant
              </button>
            </div>
          </div>

          {/* Mini stats */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: assistants.length, color: "text-white" },
              { label: "Active", value: activeCount, color: "text-emerald-400" },
              { label: "Inactive", value: inactiveCount, color: "text-rose-400" },
              { label: "Unlinked", value: unlinkedCount, color: "text-amber-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-[11px] text-slate-400 font-medium">
                  {s.label}
                </p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6 max-w-[1400px] mx-auto space-y-5">

        {/* ── Unlinked Alert ──────────────────────────────── */}
        {unlinkedCount > 0 && (
          <div
            className="rounded-2xl overflow-hidden border border-amber-200"
            style={{
              background:
                "linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)",
            }}
          >
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {unlinkedCount} active assistant
                    {unlinkedCount !== 1 ? "s" : ""} not linked
                  </p>
                  <p className="text-xs text-amber-700">
                    Link them to doctors so they can receive appointment
                    requests
                  </p>
                </div>
              </div>
              <span className="text-xs text-amber-700 font-medium px-3 py-1.5 bg-amber-100 rounded-lg flex-shrink-0">
                Use the <strong>Link</strong> button below
              </span>
            </div>
          </div>
        )}

        {/* ── Controls ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, email, phone, doctor..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200
                    text-sm text-gray-900 focus:outline-none focus:ring-2
                    focus:ring-violet-400/50 focus:border-violet-400
                    bg-gray-50 hover:bg-white transition-colors"
                />
              </div>

              <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl">
                {(["all", "active", "inactive"] as StatusFilter[]).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
                        ${
                          statusFilter === f
                            ? "bg-white shadow-sm text-gray-900"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  )
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 font-medium">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Assistant Cards ─────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading assistants...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <UserCog className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">
              No assistants found
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {assistants.length === 0
                ? "Click 'Add Assistant' to create the first one."
                : "Try adjusting your search or filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => {
              const active = isActive(a.approval_status);
              const unlinked = active && !a.doctor;

              return (
                <div
                  key={a.profile_id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden
                    transition-all hover:shadow-md ${
                      unlinked
                        ? "border-amber-200"
                        : active
                        ? "border-gray-100"
                        : "border-rose-100"
                    }`}
                >
                  {/* Accent top */}
                  <div
                    className={`h-0.5 w-full ${
                      unlinked
                        ? "bg-gradient-to-r from-amber-400 to-orange-400"
                        : active
                        ? "bg-gradient-to-r from-violet-500 to-purple-500"
                        : "bg-gradient-to-r from-rose-400 to-pink-400"
                    }`}
                  />

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                      {/* ── Left: Info ────────────────────── */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center
                            justify-center flex-shrink-0 font-bold text-sm ${
                              active
                                ? "bg-violet-50 text-violet-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                        >
                          {a.full_name?.charAt(0)?.toUpperCase() || "A"}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Name + badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold text-gray-900 text-sm truncate">
                              {a.full_name}
                            </p>

                            {/* Status badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5
                                rounded-full text-[10px] font-bold uppercase tracking-wide
                                ${
                                  active
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-600 border border-rose-200"
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  active
                                    ? "bg-emerald-500"
                                    : "bg-rose-500"
                                }`}
                              />
                              {active ? "Active" : "Inactive"}
                            </span>

                            {/* Unlinked badge */}
                            {unlinked && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5
                                rounded-full text-[10px] font-bold uppercase tracking-wide
                                bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Unlinked
                              </span>
                            )}
                          </div>

                          {/* Email */}
                          {a.email && (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs text-gray-500 font-mono truncate">
                                {a.email}
                              </p>
                              <button
                                onClick={() => copy(a.email!)}
                                className="flex items-center gap-1 px-1.5 py-0.5
                                  rounded text-[10px] text-gray-400
                                  hover:text-gray-600 hover:bg-gray-100
                                  transition-colors flex-shrink-0"
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}

                          {/* Detail chips */}
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {/* Linked doctor */}
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1
                                rounded-lg text-[11px] font-medium ${
                                  a.doctor
                                    ? "text-blue-700 bg-blue-50"
                                    : "text-gray-400 bg-gray-50"
                                }`}
                            >
                              <Stethoscope className="w-3 h-3" />
                              {a.doctor
                                ? `Dr. ${a.doctor.full_name}`
                                : "Not linked"}
                            </span>

                            {a.phone && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1
                                rounded-lg text-[11px] font-medium text-gray-500 bg-gray-50">
                                <Phone className="w-3 h-3" />
                                {a.phone}
                              </span>
                            )}

                            {a.created_at && (
                              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1
                                rounded-lg text-[11px] font-medium text-gray-400 bg-gray-50">
                                <CalendarDays className="w-3 h-3" />
                                {fmtDate(a.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Right: Actions ────────────────── */}
                      <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap flex-shrink-0">
                        <button
                          onClick={() => openEdit(a)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                            text-xs font-semibold text-gray-700 bg-gray-50
                            hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => openReset(a)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                            text-xs font-semibold text-gray-700 bg-gray-50
                            hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reset</span>
                        </button>

                        <button
                          onClick={() =>
                            setLinkModal({
                              open: true,
                              assistant: a,
                              doctorId: a.doctor?.id || "",
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                            text-xs font-semibold text-violet-700 bg-violet-50
                            hover:bg-violet-100 transition-colors border border-violet-200"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Link</span>
                        </button>

                        {a.doctor && (
                          <button
                            onClick={() =>
                              updateLink(a.profile_id, null)
                            }
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                              text-xs font-semibold text-gray-700 bg-gray-50
                              hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Unlink</span>
                          </button>
                        )}

                        {active ? (
                          <button
                            onClick={() => deactivate(a)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                              text-xs font-semibold text-amber-700 bg-amber-50
                              hover:bg-amber-100 transition-colors border border-amber-200"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              Deactivate
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => activate(a)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                              text-xs font-semibold text-emerald-700 bg-emerald-50
                              hover:bg-emerald-100 transition-colors border border-emerald-200"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              Activate
                            </span>
                          </button>
                        )}

                        <button
                          onClick={() => deleteAssistant(a)}
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

      {/* ── Create ────────────────────────────────────────── */}
      {showCreate && (
        <ModalShell
          title="Add New Assistant"
          gradient="#7c3aed,#c026d3"
          icon={UserCog}
          onClose={() => setShowCreate(false)}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Full Name" required />
                <TextInput
                  value={createForm.full_name}
                  onChange={(v) =>
                    setCreateForm({ ...createForm, full_name: v })
                  }
                  placeholder="Full name"
                  icon={User}
                />
              </div>
              <div>
                <FieldLabel label="Email" required />
                <TextInput
                  type="email"
                  value={createForm.email}
                  onChange={(v) =>
                    setCreateForm({ ...createForm, email: v })
                  }
                  placeholder="assistant@hospital.com"
                  icon={Mail}
                />
              </div>
              <div>
                <FieldLabel label="Phone" />
                <TextInput
                  value={createForm.phone}
                  onChange={(v) =>
                    setCreateForm({ ...createForm, phone: v })
                  }
                  placeholder="+92 300 0000000"
                  icon={Phone}
                />
              </div>
              <div>
                <FieldLabel label="Gender" />
                <select
                  value={createForm.gender}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      gender: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white
                    text-sm text-gray-900 px-4 py-2.5 focus:outline-none
                    focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400
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
                  onChange={(v) =>
                    setCreateForm({ ...createForm, dob: v })
                  }
                />
              </div>
              <div>
                <FieldLabel label="Link Doctor (optional)" />
                <select
                  value={createForm.doctor_profile_id}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      doctor_profile_id: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white
                    text-sm text-gray-900 px-4 py-2.5 focus:outline-none
                    focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400
                    hover:border-gray-300 transition-all"
                >
                  <option value="">No link</option>
                  {doctorOptions.map((d) => (
                    <option key={d.profile_id} value={d.profile_id}>
                      Dr. {d.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
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
                    className="w-4 h-4 rounded border-gray-300 text-violet-600
                      focus:ring-violet-400"
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

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="px-5 py-2.5 rounded-xl text-sm font-medium
                  text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAssistant}
                disabled={creating}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold
                  text-white shadow-sm hover:opacity-90 transition-opacity
                  disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#c026d3)",
                }}
              >
                {creating ? "Creating..." : "Create Assistant"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ── Edit ──────────────────────────────────────────── */}
      {showEdit && editTarget && (
        <ModalShell
          title="Edit Assistant"
          gradient="#7c3aed,#c026d3"
          icon={Edit3}
          onClose={() => setShowEdit(false)}
        >
          <div className="space-y-5">
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
                  onChange={(v) =>
                    setEditForm({ ...editForm, full_name: v })
                  }
                  icon={User}
                />
              </div>
              <div>
                <FieldLabel label="Phone" />
                <TextInput
                  value={editForm.phone}
                  onChange={(v) =>
                    setEditForm({ ...editForm, phone: v })
                  }
                  icon={Phone}
                />
              </div>
              <div>
                <FieldLabel label="Gender" />
                <select
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      gender: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white
                    text-sm text-gray-900 px-4 py-2.5 focus:outline-none
                    focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400
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
                  onChange={(v) =>
                    setEditForm({ ...editForm, dob: v })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEdit(false)}
                disabled={editing}
                className="px-5 py-2.5 rounded-xl text-sm font-medium
                  text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editing}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold
                  text-white shadow-sm hover:opacity-90 transition-opacity
                  disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#c026d3)",
                }}
              >
                {editing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ── Link ──────────────────────────────────────────── */}
      {linkModal.open && linkModal.assistant && (
        <ModalShell
          title="Link to Doctor"
          gradient="#7c3aed,#c026d3"
          icon={Link2}
          onClose={() =>
            setLinkModal({ open: false, assistant: null, doctorId: "" })
          }
          maxWidth="max-w-md"
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Assistant
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {linkModal.assistant.full_name}
              </p>
              <p className="text-xs text-gray-500 font-mono break-all">
                {linkModal.assistant.email || "—"}
              </p>
            </div>

            <div>
              <FieldLabel label="Select Doctor" />
              <select
                value={linkModal.doctorId}
                onChange={(e) =>
                  setLinkModal((p) => ({
                    ...p,
                    doctorId: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-200 bg-white
                  text-sm text-gray-900 px-4 py-2.5 focus:outline-none
                  focus:ring-2 focus:ring-violet-400/50 focus:border-violet-400
                  hover:border-gray-300 transition-all"
              >
                <option value="">No link (unlink)</option>
                {doctorOptions.map((d) => (
                  <option key={d.profile_id} value={d.profile_id}>
                    Dr. {d.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() =>
                  setLinkModal({
                    open: false,
                    assistant: null,
                    doctorId: "",
                  })
                }
                className="px-5 py-2.5 rounded-xl text-sm font-medium
                  text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await updateLink(
                    linkModal.assistant!.profile_id,
                    linkModal.doctorId || null
                  );
                  setLinkModal({
                    open: false,
                    assistant: null,
                    doctorId: "",
                  });
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold
                  text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#c026d3)",
                }}
              >
                Save Link
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ── Reset Password ────────────────────────────────── */}
      {showReset && resetTarget && (
        <ModalShell
          title="Reset Password"
          gradient="#7c3aed,#c026d3"
          icon={KeyRound}
          onClose={() => setShowReset(false)}
          maxWidth="max-w-md"
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Assistant
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
                    className="w-4 h-4 rounded border-gray-300 text-violet-600
                      focus:ring-violet-400"
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
                className="px-5 py-2.5 rounded-xl text-sm font-medium
                  text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={doReset}
                disabled={resetting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold
                  text-white shadow-sm hover:opacity-90 transition-opacity
                  disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#c026d3)",
                }}
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