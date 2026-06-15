import React, { useEffect, useMemo, useState } from "react";
import {
  UserCog, RefreshCw, Search, Plus, Trash2, Copy, X,
  Edit3, KeyRound, Link2, Unlink, ShieldOff, ShieldCheck,
  AlertTriangle, User, Phone, Mail, Stethoscope, CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

import { API_URL } from "@/lib/constants";
import { AvatarDisplay } from "@/components/common/AvatarUpload"; // ✅ AVATAR

type StatusFilter = "all" | "active" | "inactive";
type DoctorOption = { profile_id: string; full_name: string };

type Assistant = {
  profile_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender?: string | null;
  dob?: string | null;
  avatar_url?: string | null; // ✅ AVATAR
  approval_status: "approved" | "rejected" | "pending" | string;
  doctor: { id: string; full_name: string; avatar_url?: string | null } | null; // ✅ AVATAR
  created_at?: string | null;
};

const isActive = (s?: string | null) => s === "approved";

const fmtDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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
          <div className="hd-modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeyRound size={16} /> Credentials
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
            <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
              Done
            </button>
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
        <div className="hd-modal-body ap-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function AssistantsPage({ onRefreshGlobal }: { onRefreshGlobal: () => void }) {
  const token = localStorage.getItem("accessToken");

  const [loading,        setLoading]        = useState(false);
  const [assistants,     setAssistants]     = useState<Assistant[]>([]);
  const [doctorOptions,  setDoctorOptions]  = useState<DoctorOption[]>([]);
  const [q,              setQ]              = useState("");
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("all");

  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "", email: "", phone: "", gender: "", dob: "",
    doctor_profile_id: "", generate_password: true, password: "",
  });

  const [showEdit,   setShowEdit]   = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [editTarget, setEditTarget] = useState<Assistant | null>(null);
  const [editForm,   setEditForm]   = useState({ full_name: "", phone: "", gender: "", dob: "" });

  const [linkModal, setLinkModal] = useState<{ open: boolean; assistant: Assistant | null; doctorId: string }>
    ({ open: false, assistant: null, doctorId: "" });

  const [showReset,   setShowReset]   = useState(false);
  const [resetting,   setResetting]   = useState(false);
  const [resetTarget, setResetTarget] = useState<Assistant | null>(null);
  const [resetForm,   setResetForm]   = useState({ generate_password: true, password: "" });

  const [credOpen, setCredOpen] = useState(false);
  const [cred,     setCred]     = useState<{ email: string; password: string | null; generated: boolean }>
    ({ email: "", password: null, generated: false });

  /* ── Fetch ── */
  const fetchAssistants = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/assistants`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assistants");
      setAssistants(data.assistants || []);
    } catch (e: any) { toast.error(e.message || "Failed to load assistants"); }
    finally { setLoading(false); }
  };

  const fetchDoctorOptions = async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_URL}/api/hospital-admin/doctors`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load doctors");
      setDoctorOptions(
        (data.doctors || [])
          .filter((d: any) => d.approval_status === "approved")
          .map((d: any) => ({ profile_id: d.profile_id, full_name: d.full_name }))
      );
    } catch (e: any) { toast.error(e.message || "Failed to load doctor options"); }
  };

  useEffect(() => {
    fetchAssistants();
    fetchDoctorOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Derived ── */
  const activeCount   = assistants.filter((a) => isActive(a.approval_status)).length;
  const inactiveCount = assistants.length - activeCount;
  const unlinkedCount = useMemo(
    () => assistants.filter((a) => isActive(a.approval_status) && !a.doctor).length,
    [assistants]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = assistants;
    if (statusFilter === "active")   list = list.filter((a) => isActive(a.approval_status));
    if (statusFilter === "inactive") list = list.filter((a) => !isActive(a.approval_status));
    if (!s) return list;
    return list.filter((a) =>
      `${a.full_name} ${a.email || ""} ${a.phone || ""} ${a.doctor?.full_name || ""}`.toLowerCase().includes(s)
    );
  }, [q, assistants, statusFilter]);

  const copy = async (text: string) => { await navigator.clipboard.writeText(text); toast.success("Copied"); };

  /* ── Create ── */
  const createAssistant = async () => {
    if (!token) return;
    const f = createForm;
    if (!f.full_name || !f.email) { toast.error("Please fill required fields"); return; }
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(f.email.trim())) { toast.error("Please enter a valid email address"); return; }
    if (!/^[a-zA-Z\s.\-']+$/.test(f.full_name.trim())) { toast.error("Full name must contain only letters, spaces, hyphens, or apostrophes"); return; }
    if (f.phone && !/^[\+]?[\d\s\-\(\)]{7,15}$/.test(f.phone.trim())) { toast.error("Invalid phone number format"); return; }
    if (f.dob) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(f.dob) >= today) { toast.error("Date of birth cannot be today or in the future"); return; }
    }
    if (!f.generate_password && f.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    try {
      setCreating(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/assistants`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: f.full_name, email: f.email, phone: f.phone || null,
          gender: f.gender || null, dob: f.dob || null,
          doctor_profile_id: f.doctor_profile_id || null,
          generate_password: f.generate_password,
          password: f.generate_password ? undefined : f.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to create");
      toast.success("Assistant created");
      setShowCreate(false);
      setCreateForm({ full_name: "", email: "", phone: "", gender: "", dob: "", doctor_profile_id: "", generate_password: true, password: "" });
      setCred({ email: data?.credentials?.email || f.email, password: data?.credentials?.password ?? null, generated: !!data?.credentials?.generated });
      setCredOpen(true);
      await fetchAssistants();
      await fetchDoctorOptions();
      onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed to create"); }
    finally { setCreating(false); }
  };

  /* ── Edit ── */
  const openEdit = (a: Assistant) => {
    setEditTarget(a);
    setEditForm({ full_name: a.full_name || "", phone: a.phone || "", gender: a.gender || "", dob: a.dob || "" });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!token || !editTarget) return;
    if (editForm.full_name && !/^[a-zA-Z\s.\-']+$/.test(editForm.full_name.trim())) {
      toast.error("Full name must contain only letters, spaces, hyphens, or apostrophes"); return;
    }
    if (editForm.phone && !/^[\+]?[\d\s\-\(\)]{7,15}$/.test(editForm.phone.trim())) {
      toast.error("Invalid phone number format"); return;
    }
    if (editForm.dob) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(editForm.dob) >= today) { toast.error("Date of birth cannot be today or in the future"); return; }
    }
    try {
      setEditing(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/assistants/${editTarget.profile_id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: editForm.full_name, phone: editForm.phone || null, gender: editForm.gender || null, dob: editForm.dob || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Assistant updated");
      setShowEdit(false); setEditTarget(null);
      await fetchAssistants();
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setEditing(false); }
  };

  /* ── Link ── */
  const updateLink = async (assistantId: string, doctorId: string | null) => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_URL}/api/hospital-admin/assistants/${assistantId}/link-doctor`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_profile_id: doctorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Link updated");
      await fetchAssistants(); onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  /* ── Activate / Deactivate ── */
  const deactivate = async (a: Assistant) => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_URL}/api/hospital-admin/assistants/${a.profile_id}/deactivate`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Assistant deactivated");
      await fetchAssistants(); onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const activate = async (a: Assistant) => {
    if (!token) return;
    try {
      const res  = await fetch(`${API_URL}/api/hospital-admin/assistants/${a.profile_id}/activate`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Assistant activated");
      await fetchAssistants(); onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  /* ── Reset ── */
  const openReset = (a: Assistant) => { setResetTarget(a); setResetForm({ generate_password: true, password: "" }); setShowReset(true); };

  const doReset = async () => {
    if (!token || !resetTarget) return;
    if (!resetForm.generate_password && resetForm.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    try {
      setResetting(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/assistants/${resetTarget.profile_id}/reset-password`, {
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
  const deleteAssistant = async (a: Assistant) => {
    if (!token) return;
    if (!window.confirm("Delete this assistant permanently? This cannot be undone.")) return;
    try {
      const res  = await fetch(`${API_URL}/api/hospital-admin/assistants/${a.profile_id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed");
      toast.success("Assistant deleted");
      await fetchAssistants(); onRefreshGlobal();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="page-main">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <UserCog size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Assistants</div>
              <div className="page-header-sub">
                Create, link, deactivate and manage assistant credentials
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14} /> Add Assistant
            </button>
            <button
              type="button"
              className="btn btn-icon btn-icon-lg"
              onClick={async () => { await fetchAssistants(); await fetchDoctorOptions(); }}
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
            { label: "Total",    value: assistants.length },
            { label: "Active",   value: activeCount       },
            { label: "Inactive", value: inactiveCount     },
            { label: "Unlinked", value: unlinkedCount     },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Unlinked Alert */}
        {unlinkedCount > 0 && (
          <div className="appt-history" style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div className="icon-wrap icon-wrap-sm icon-wrap-muted" style={{ flexShrink: 0 }}>
              <AlertTriangle size={15} color="var(--ms-warning)" />
            </div>
            <div>
              <div style={{ fontSize: "var(--ms-text-sm)", fontWeight: "var(--ms-weight-semibold)", color: "var(--ms-text)" }}>
                {unlinkedCount} active assistant{unlinkedCount !== 1 ? "s" : ""} not linked to a doctor
              </div>
              <div style={{ fontSize: "var(--ms-text-xs)", color: "var(--ms-text-soft)", marginTop: 3 }}>
                Link them so they can receive appointment requests. Use the <strong>Link</strong> button on each card.
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="card card-sm">
          <div className="ap-controls">
            <div className="search-wrap ap-search">
              <Search className="search-icon" />
              <input
                className="search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, phone, doctor…"
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

        {/* Assistant Cards */}
        {loading ? (
          <div className="loading-text">Loading assistants…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <UserCog size={40} className="empty-icon" />
            <div className="empty-title">No assistants found</div>
            <div className="empty-sub">
              {assistants.length === 0
                ? "Click 'Add Assistant' to create the first one."
                : "Try adjusting your search or filter."}
            </div>
          </div>
        ) : (
          <div className="ap-list">
            {filtered.map((a) => {
              const active   = isActive(a.approval_status);
              const unlinked = active && !a.doctor;

              return (
                <div
                  key={a.profile_id}
                  className={`ap-card${unlinked ? " ap-card-warn" : active ? "" : " ap-card-inactive"}`}
                >
                  {/* Accent bar */}
                  <div className={`ap-accent-bar${unlinked ? " ap-bar-warn" : active ? " ap-bar-active" : " ap-bar-inactive"}`} />

                  <div className="ap-card-inner">
                    {/* Left: info */}
                    <div className="ap-info">
                      {/* ✅ AVATAR — replaced letter div with AvatarDisplay */}
                      <AvatarDisplay url={a.avatar_url} name={a.full_name} size={42} />

                      <div className="ap-info-body">
                        {/* Name + badges */}
                        <div className="ap-name-row">
                          <div className="list-item-title">{a.full_name}</div>
                          <span className={`badge${active ? " badge-success" : " badge-error"}`}>
                            {active ? "Active" : "Inactive"}
                          </span>
                          {unlinked && (
                            <span className="badge badge-warning">
                              <AlertTriangle size={10} /> Unlinked
                            </span>
                          )}
                        </div>

                        {/* Email */}
                        {a.email && (
                          <div className="ap-email-row">
                            <span className="ap-email">{a.email}</span>
                            <button
                              type="button"
                              className="btn btn-icon"
                              style={{ width: 24, height: 24 }}
                              onClick={() => copy(a.email!)}
                              title="Copy email"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        )}

                        {/* Chips */}
                        <div className="ap-chips">
                          <span className={`ap-chip${a.doctor ? " ap-chip-linked" : ""}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {a.doctor ? (
                              <>
                                {/* ✅ AVATAR — small doctor avatar inside chip */}
                                <AvatarDisplay url={a.doctor.avatar_url} name={a.doctor.full_name} size={18} />
                                Dr. {a.doctor.full_name}
                              </>
                            ) : (
                              <>
                                <Stethoscope size={11} />
                                Not linked
                              </>
                            )}
                          </span>
                          {a.phone && (
                            <span className="ap-chip">
                              <Phone size={11} /> {a.phone}
                            </span>
                          )}
                          {a.created_at && (
                            <span className="ap-chip">
                              <CalendarDays size={11} /> {fmtDate(a.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="ap-actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>
                        <Edit3 size={13} /> Edit
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openReset(a)}>
                        <KeyRound size={13} /> Reset
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm ap-btn-link"
                        onClick={() => setLinkModal({ open: true, assistant: a, doctorId: a.doctor?.id || "" })}
                      >
                        <Link2 size={13} /> Link
                      </button>
                      {a.doctor && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateLink(a.profile_id, null)}>
                          <Unlink size={13} /> Unlink
                        </button>
                      )}
                      {active ? (
                        <button type="button" className="btn btn-sm ap-btn-warn" onClick={() => deactivate(a)}>
                          <ShieldOff size={13} /> Deactivate
                        </button>
                      ) : (
                        <button type="button" className="btn btn-sm ap-btn-success" onClick={() => activate(a)}>
                          <ShieldCheck size={13} /> Activate
                        </button>
                      )}
                      <button type="button" className="btn btn-sm um-delete-btn" onClick={() => deleteAssistant(a)}>
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

      {/* ═══════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════ */}

      {/* Create */}
      {showCreate && (
        <ModalShell title="Add New Assistant" icon={UserCog} onClose={() => setShowCreate(false)} wide>
          <div className="form-grid-2">
            <div className="field">
              <label className="field-label">Full Name *</label>
              <input className="field-input" placeholder="Full name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value.replace(/[^a-zA-Z\s.\-']/g, "") })} />
            </div>
            <div className="field">
              <label className="field-label">Email *</label>
              <input type="email" className="field-input" placeholder="assistant@hospital.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Phone</label>
              <input className="field-input" placeholder="+92 300 0000000"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value.replace(/[^0-9+\s()\-]/g, "") })} />
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
              <input type="date" className="field-input"
                value={createForm.dob}
                onChange={(e) => setCreateForm({ ...createForm, dob: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Link Doctor (optional)</label>
              <select className="field-select" value={createForm.doctor_profile_id}
                onChange={(e) => setCreateForm({ ...createForm, doctor_profile_id: e.target.value })}>
                <option value="">No link</option>
                {doctorOptions.map((d) => (
                  <option key={d.profile_id} value={d.profile_id}>Dr. {d.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ap-password-box">
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
            <button type="button" className="btn btn-primary btn-sm" onClick={createAssistant} disabled={creating}>
              {creating ? "Creating…" : "Create Assistant"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Edit */}
      {showEdit && editTarget && (
        <ModalShell title="Edit Assistant" icon={Edit3} onClose={() => setShowEdit(false)} wide>
          <div className="info-item" style={{ marginBottom: 16 }}>
            <div className="info-label">Email (read-only)</div>
            <div className="ap-creds-mono">{editTarget.email || "—"}</div>
          </div>
          <div className="form-grid-2">
            <div className="field">
              <label className="field-label">Full Name</label>
              <input className="field-input" value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value.replace(/[^a-zA-Z\s.\-']/g, "") })} />
            </div>
            <div className="field">
              <label className="field-label">Phone</label>
              <input className="field-input" value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/[^0-9+\s()\-]/g, "") })} />
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
          </div>
          <div className="hd-modal-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowEdit(false)} disabled={editing}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit} disabled={editing}>
              {editing ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Link */}
      {linkModal.open && linkModal.assistant && (
        <ModalShell title="Link to Doctor" icon={Link2} onClose={() => setLinkModal({ open: false, assistant: null, doctorId: "" })}>
          <div className="info-item" style={{ marginBottom: 16 }}>
            <div className="info-label">Assistant</div>
            <div className="list-item-title">{linkModal.assistant.full_name}</div>
            <div className="ap-creds-mono">{linkModal.assistant.email || "—"}</div>
          </div>
          <div className="field" style={{ marginBottom: 20 }}>
            <label className="field-label">Select Doctor</label>
            <select className="field-select" value={linkModal.doctorId}
              onChange={(e) => setLinkModal((p) => ({ ...p, doctorId: e.target.value }))}>
              <option value="">No link (unlink)</option>
              {doctorOptions.map((d) => (
                <option key={d.profile_id} value={d.profile_id}>Dr. {d.full_name}</option>
              ))}
            </select>
          </div>
          <div className="hd-modal-actions">
            <button type="button" className="btn btn-ghost btn-sm"
              onClick={() => setLinkModal({ open: false, assistant: null, doctorId: "" })}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm"
              onClick={async () => {
                await updateLink(linkModal.assistant!.profile_id, linkModal.doctorId || null);
                setLinkModal({ open: false, assistant: null, doctorId: "" });
              }}>
              Save Link
            </button>
          </div>
        </ModalShell>
      )}

      {/* Reset Password */}
      {showReset && resetTarget && (
        <ModalShell title="Reset Password" icon={KeyRound} onClose={() => setShowReset(false)}>
          <div className="info-item" style={{ marginBottom: 16 }}>
            <div className="info-label">Assistant</div>
            <div className="list-item-title">{resetTarget.full_name}</div>
            <div className="ap-creds-mono">{resetTarget.email || "—"}</div>
          </div>
          <div className="ap-password-box">
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