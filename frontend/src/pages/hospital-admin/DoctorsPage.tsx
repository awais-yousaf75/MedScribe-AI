import React, { useEffect, useMemo, useState } from "react";
import {
  Stethoscope, RefreshCw, Search, Plus, Trash2, Copy, X,
  Edit3, KeyRound, ShieldOff, ShieldCheck, Activity,
  User, Phone, Mail, Hash, BadgeCheck, CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

import { API_URL } from "@/lib/constants";
import { AvatarDisplay } from "@/components/common/AvatarUpload"; // ✅ AVATAR

type Doctor = {
  profile_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender?: string | null;
  dob?: string | null;
  avatar_url?: string | null; // ✅ AVATAR
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
    year: "numeric", month: "short", day: "numeric",
  });
};

/* ─────────────────────────────────────────────────────────────
   CREDENTIALS MODAL
───────────────────────────────────────────────────────────── */
function CredentialsModal({
  open, onClose, email, password, generated,
}: {
  open: boolean; onClose: () => void;
  email: string; password: string | null; generated: boolean;
}) {
  if (!open) return null;
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  return (
    <div className="hd-modal-backdrop" onClick={onClose}>
      <div className="hd-modal ap-creds-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hd-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeyRound size={16} color="var(--ms-text-inverse)" />
            <span className="hd-modal-title">Credentials</span>
          </div>
          <button type="button" className="btn btn-icon hd-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="hd-modal-body">
          <div className="info-item">
            <div className="info-label">Email</div>
            <div className="ap-creds-row">
              <span className="ap-creds-mono">{email}</span>
              <button type="button" className="btn btn-icon btn-secondary" onClick={() => copy(email)}>
                <Copy size={13} />
              </button>
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Password</div>
            {generated ? (
              <>
                <div className="ap-warn-text">⚠ Shown only once — copy it now</div>
                <div className="ap-creds-row" style={{ marginTop: 8 }}>
                  <span className="ap-creds-mono">{password || "—"}</span>
                  {password && (
                    <button type="button" className="btn btn-icon btn-secondary" onClick={() => copy(password)}>
                      <Copy size={13} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="list-item-sub" style={{ marginTop: 6 }}>
                Password was set manually (not displayed).
              </div>
            )}
          </div>
          <div className="hd-modal-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODAL SHELL
───────────────────────────────────────────────────────────── */
function ModalShell({
  title, icon: Icon, children, onClose, wide = false,
}: {
  title: string; icon?: React.ElementType;
  children: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  return (
    <div className="hd-modal-backdrop" onClick={onClose}>
      <div
        className={`hd-modal${wide ? " ap-modal-wide" : " ap-modal-sm"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hd-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {Icon && (
              <div className="icon-wrap icon-wrap-sm icon-wrap-navy">
                <Icon size={14} color="var(--ms-teal)" />
              </div>
            )}
            <div className="hd-modal-title">{title}</div>
          </div>
          <button type="button" className="btn btn-icon hd-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="hd-modal-body ap-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function DoctorsPage({ onRefreshGlobal }: { onRefreshGlobal: () => void }) {
  const token = localStorage.getItem("accessToken");

  const [loading,      setLoading]      = useState(false);
  const [doctors,      setDoctors]      = useState<Doctor[]>([]);
  const [q,            setQ]            = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "", email: "", phone: "", gender: "", dob: "",
    specialization: "", license_number: "", cnic: "",
    generate_password: true, password: "",
  });

  const [showEdit,   setShowEdit]   = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [editTarget, setEditTarget] = useState<Doctor | null>(null);
  const [editForm,   setEditForm]   = useState({
    full_name: "", phone: "", gender: "", dob: "",
    specialization: "", license_number: "", cnic: "",
  });

  const [showReset,   setShowReset]   = useState(false);
  const [resetting,   setResetting]   = useState(false);
  const [resetTarget, setResetTarget] = useState<Doctor | null>(null);
  const [resetForm,   setResetForm]   = useState({ generate_password: true, password: "" });

  const [credOpen, setCredOpen] = useState(false);
  const [cred,     setCred]     = useState<{ email: string; password: string | null; generated: boolean }>
    ({ email: "", password: null, generated: false });

  /* ── Fetch ── */
  const fetchDoctors = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load doctors");
      setDoctors(data.doctors || []);
    } catch (e: any) { toast.error(e.message || "Failed to load doctors"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = doctors;
    if (statusFilter === "active")   list = list.filter((d) => isActive(d.approval_status));
    if (statusFilter === "inactive") list = list.filter((d) => !isActive(d.approval_status));
    if (!s) return list;
    return list.filter((d) =>
      `${d.full_name} ${d.email || ""} ${d.phone || ""} ${d.specialization} ${d.license_number} ${d.cnic}`
        .toLowerCase().includes(s)
    );
  }, [q, doctors, statusFilter]);

  const copy = async (text: string) => { await navigator.clipboard.writeText(text); toast.success("Copied"); };

  /* ── Create ── */
  const createDoctor = async () => {
    if (!token) return;
    const f = createForm;
    if (!f.full_name || !f.email || !f.specialization || !f.license_number || !f.cnic) {
      toast.error("Please fill required fields"); return;
    }
    if (!f.generate_password && f.password.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    try {
      setCreating(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/doctors`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: f.full_name, email: f.email, phone: f.phone || null,
          gender: f.gender || null, dob: f.dob || null,
          specialization: f.specialization, license_number: f.license_number, cnic: f.cnic,
          generate_password: f.generate_password,
          password: f.generate_password ? undefined : f.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to create");
      toast.success("Doctor created");
      setShowCreate(false);
      setCreateForm({ full_name: "", email: "", phone: "", gender: "", dob: "", specialization: "", license_number: "", cnic: "", generate_password: true, password: "" });
      setCred({ email: data?.credentials?.email || f.email, password: data?.credentials?.password ?? null, generated: !!data?.credentials?.generated });
      setCredOpen(true);
      await fetchDoctors();
      onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed to create"); }
    finally { setCreating(false); }
  };

  /* ── Edit ── */
  const openEdit = (d: Doctor) => {
    setEditTarget(d);
    setEditForm({ full_name: d.full_name || "", phone: d.phone || "", gender: d.gender || "", dob: d.dob || "", specialization: d.specialization || "", license_number: d.license_number || "", cnic: d.cnic || "" });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!token || !editTarget) return;
    try {
      setEditing(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/doctors/${editTarget.profile_id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: editForm.full_name, phone: editForm.phone || null, gender: editForm.gender || null, dob: editForm.dob || null, specialization: editForm.specialization, license_number: editForm.license_number, cnic: editForm.cnic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Doctor updated");
      setShowEdit(false); setEditTarget(null);
      await fetchDoctors();
    } catch (e: any) { toast.error(e.message || "Failed to update"); }
    finally { setEditing(false); }
  };

  /* ── Activate / Deactivate ── */
  const deactivate = async (d: Doctor) => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_URL}/api/hospital-admin/doctors/${d.profile_id}/deactivate`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Doctor deactivated");
      await fetchDoctors(); onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const activate = async (d: Doctor) => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_URL}/api/hospital-admin/doctors/${d.profile_id}/activate`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Doctor activated");
      await fetchDoctors(); onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  /* ── Reset ── */
  const openReset = (d: Doctor) => { setResetTarget(d); setResetForm({ generate_password: true, password: "" }); setShowReset(true); };

  const doReset = async () => {
    if (!token || !resetTarget) return;
    if (!resetForm.generate_password && resetForm.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    try {
      setResetting(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/doctors/${resetTarget.profile_id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ generate_password: resetForm.generate_password, password: resetForm.generate_password ? undefined : resetForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Password reset");
      setShowReset(false);
      setCred({ email: data?.credentials?.email || resetTarget.email || "", password: data?.credentials?.password ?? null, generated: !!data?.credentials?.generated });
      setCredOpen(true);
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setResetting(false); }
  };

  /* ── Delete ── */
  const deleteDoctor = async (d: Doctor) => {
    if (!token) return;
    if (!window.confirm("Delete this doctor permanently? This cannot be undone.")) return;
    try {
      const res  = await fetch(`${API_URL}/api/hospital-admin/doctors/${d.profile_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Doctor deleted");
      await fetchDoctors(); onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const activeCount   = doctors.filter((d) => isActive(d.approval_status)).length;
  const inactiveCount = doctors.length - activeCount;

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="page-main">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Stethoscope size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Doctors</div>
              <div className="page-header-sub">
                Create, edit, deactivate and reset doctor credentials
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14} /> Add Doctor
            </button>
            <button
              type="button"
              className="btn btn-icon btn-icon-lg"
              onClick={fetchDoctors}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content">

        {/* Stats */}
        <div className="stat-grid">
          {[
            { label: "Total",    value: doctors.length },
            { label: "Active",   value: activeCount    },
            { label: "Inactive", value: inactiveCount  },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="card card-sm">
          <div className="ap-controls">
            <div className="search-wrap ap-search">
              <Search className="search-icon" />
              <input
                className="search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, phone, specialization…"
              />
            </div>
            <div className="ap-filter-tabs">
              {(["all", "active", "inactive"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`ap-filter-tab${statusFilter === f ? " ap-filter-tab-active" : ""}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="list-item-sub">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Doctor Cards */}
        {loading ? (
          <div className="loading-text">Loading doctors…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Stethoscope size={40} className="empty-icon" />
            <div className="empty-title">No doctors found</div>
            <div className="empty-sub">
              {doctors.length === 0
                ? "Click 'Add Doctor' to create the first one."
                : "Try adjusting your search or filter."}
            </div>
          </div>
        ) : (
          <div className="ap-list">
            {filtered.map((d) => {
              const active = isActive(d.approval_status);
              return (
                <div
                  key={d.profile_id}
                  className={`ap-card${active ? "" : " ap-card-inactive"}`}
                >
                  <div className={`ap-accent-bar${active ? " ap-bar-active" : " ap-bar-inactive"}`} />

                  <div className="ap-card-inner">
                    {/* Left: info */}
                    <div className="ap-info">
                      {/* ✅ AVATAR — replaced letter div with AvatarDisplay */}
                      <AvatarDisplay url={d.avatar_url} name={d.full_name} size={42} />

                      <div className="ap-info-body">
                        <div className="ap-name-row">
                          <div className="list-item-title">{d.full_name}</div>
                          <span className={`badge${active ? " badge-success" : " badge-error"}`}>
                            {active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {d.email && (
                          <div className="ap-email-row">
                            <span className="ap-email">{d.email}</span>
                            <button
                              type="button"
                              className="btn btn-icon"
                              style={{ width: 24, height: 24 }}
                              onClick={() => copy(d.email!)}
                              title="Copy email"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        )}

                        <div className="ap-chips">
                          <span className="ap-chip ap-chip-linked">
                            <Activity size={11} /> {d.specialization}
                          </span>
                          <span className="ap-chip">
                            <BadgeCheck size={11} /> {d.license_number}
                          </span>
                          <span className="ap-chip">
                            <Hash size={11} /> {d.cnic}
                          </span>
                          {d.phone && (
                            <span className="ap-chip">
                              <Phone size={11} /> {d.phone}
                            </span>
                          )}
                          {d.created_at && (
                            <span className="ap-chip">
                              <CalendarDays size={11} /> {fmtDate(d.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="ap-actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}>
                        <Edit3 size={13} /> Edit
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openReset(d)}>
                        <KeyRound size={13} /> Reset
                      </button>
                      {active ? (
                        <button type="button" className="btn btn-sm ap-btn-warn" onClick={() => deactivate(d)}>
                          <ShieldOff size={13} /> Deactivate
                        </button>
                      ) : (
                        <button type="button" className="btn btn-sm ap-btn-success" onClick={() => activate(d)}>
                          <ShieldCheck size={13} /> Activate
                        </button>
                      )}
                      <button type="button" className="btn btn-sm um-delete-btn" onClick={() => deleteDoctor(d)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════ */}

      {/* Create */}
      {showCreate && (
        <ModalShell title="Add New Doctor" icon={Stethoscope} onClose={() => setShowCreate(false)} wide>
          <div className="form-grid-2" style={{ marginBottom: 20 }}>
            <div className="field">
              <label className="field-label">Full Name *</label>
              <input className="field-input" placeholder="Dr. John Doe"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Email *</label>
              <input type="email" className="field-input" placeholder="doctor@hospital.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Phone</label>
              <input className="field-input" placeholder="+92 300 0000000"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Gender</label>
              <select className="field-select" value={createForm.gender}
                onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Date of Birth</label>
              <input type="date" className="field-input" value={createForm.dob}
                onChange={(e) => setCreateForm({ ...createForm, dob: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Specialization *</label>
              <input className="field-input" placeholder="Cardiology"
                value={createForm.specialization}
                onChange={(e) => setCreateForm({ ...createForm, specialization: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">License # *</label>
              <input className="field-input" placeholder="PMC-12345"
                value={createForm.license_number}
                onChange={(e) => setCreateForm({ ...createForm, license_number: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">CNIC *</label>
              <input className="field-input" placeholder="42301-1234567-1"
                value={createForm.cnic}
                onChange={(e) => setCreateForm({ ...createForm, cnic: e.target.value })} />
            </div>
          </div>

          <div className="ap-password-box" style={{ marginBottom: 20 }}>
            <div className="ap-password-top">
              <div>
                <div className="form-section-title" style={{ marginBottom: 2 }}>Password</div>
                <div className="list-item-sub">Generate automatically or set manually</div>
              </div>
              <label className="hd-checkbox-label">
                <input type="checkbox" className="hd-checkbox"
                  checked={createForm.generate_password}
                  onChange={(e) => setCreateForm({ ...createForm, generate_password: e.target.checked })} />
                Auto-generate
              </label>
            </div>
            {!createForm.generate_password && (
              <div className="field" style={{ marginTop: 14 }}>
                <label className="field-label">Manual Password</label>
                <input type="password" className="field-input" placeholder="Min 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>
            )}
          </div>

          <div className="hd-modal-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={createDoctor} disabled={creating}>
              {creating ? "Creating…" : "Create Doctor"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Edit */}
      {showEdit && editTarget && (
        <ModalShell title="Edit Doctor" icon={Edit3} onClose={() => setShowEdit(false)} wide>
          <div className="info-item" style={{ marginBottom: 16 }}>
            <div className="info-label">Email (read-only)</div>
            <div className="ap-creds-mono">{editTarget.email || "—"}</div>
          </div>
          <div className="form-grid-2" style={{ marginBottom: 20 }}>
            <div className="field">
              <label className="field-label">Full Name</label>
              <input className="field-input" value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Phone</label>
              <input className="field-input" value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Gender</label>
              <select className="field-select" value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label">Date of Birth</label>
              <input type="date" className="field-input" value={editForm.dob}
                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Specialization</label>
              <input className="field-input" value={editForm.specialization}
                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">License #</label>
              <input className="field-input" value={editForm.license_number}
                onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">CNIC</label>
              <input className="field-input" value={editForm.cnic}
                onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })} />
            </div>
          </div>
          <div className="hd-modal-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowEdit(false)} disabled={editing}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit} disabled={editing}>
              {editing ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Reset Password */}
      {showReset && resetTarget && (
        <ModalShell title="Reset Password" icon={KeyRound} onClose={() => setShowReset(false)}>
          <div className="info-item" style={{ marginBottom: 16 }}>
            <div className="info-label">Doctor</div>
            <div className="list-item-title">{resetTarget.full_name}</div>
            <div className="ap-creds-mono">{resetTarget.email || "—"}</div>
          </div>
          <div className="ap-password-box" style={{ marginBottom: 20 }}>
            <div className="ap-password-top">
              <div>
                <div className="form-section-title" style={{ marginBottom: 2 }}>Password Mode</div>
                <div className="list-item-sub">Generate or set manually</div>
              </div>
              <label className="hd-checkbox-label">
                <input type="checkbox" className="hd-checkbox"
                  checked={resetForm.generate_password}
                  onChange={(e) => setResetForm({ ...resetForm, generate_password: e.target.checked })} />
                Auto-generate
              </label>
            </div>
            {!resetForm.generate_password && (
              <div className="field" style={{ marginTop: 14 }}>
                <label className="field-label">New Password</label>
                <input type="password" className="field-input" placeholder="Min 6 characters"
                  value={resetForm.password}
                  onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} />
              </div>
            )}
          </div>
          <div className="hd-modal-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowReset(false)} disabled={resetting}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={doReset} disabled={resetting}>
              {resetting ? "Resetting…" : "Reset Password"}
            </button>
          </div>
        </ModalShell>
      )}

      <CredentialsModal
        open={credOpen} onClose={() => setCredOpen(false)}
        email={cred.email} password={cred.password} generated={cred.generated}
      />
    </div>
  );
}