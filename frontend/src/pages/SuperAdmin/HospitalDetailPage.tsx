import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  Stethoscope,
  AlertCircle,
  LoaderCircle,
  Fingerprint,
  ShieldCheck,
  Globe,
  Plus,
  X,
  RefreshCw,
  KeyRound,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface Hospital {
  id: string;
  name: string;
  address: string | null;
  hospital_type: string | null;
  registration_number: string;
  license_number?: string | null;
  contact_email?: string;
  contact_phone?: string;
  status: "pending" | "approved" | "rejected";
  admin_profile_id: string | null;
  admin: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    approval_status: "pending" | "approved" | "rejected";
    role: string;
  } | null;
  doctors_count?: number;
  assistants_count?: number;
}

interface HospitalDetailPageProps {
  hospitalId: string;
  onBack: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function HospitalDetailPage({ hospitalId, onBack }: HospitalDetailPageProps) {
  const [hospital,       setHospital]       = useState<Hospital | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [patients,       setPatients]       = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [savingAdmin,    setSavingAdmin]    = useState(false);
  const [newCreds,       setNewCreds]       = useState<{
    email: string;
    password: string | null;
    generated: boolean;
  } | null>(null);

  const [adminForm, setAdminForm] = useState({
    full_name:         "",
    email:             "",
    phone:             "",
    gender:            "",
    dob:               "",
    password:          "",
    generate_password: true,
  });

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchHospitalDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  const fetchHospitalDetails = async () => {
    const token = getToken();
    if (!token) { setError("Session expired. Please login again."); setLoading(false); return; }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/superadmin/hospitals/${hospitalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response. Check API route.");
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load details");
      setHospital(data.hospital);
      setPatients(data.patients_count || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAdminModal = () => {
    setNewCreds(null);
    setAdminForm({ full_name: "", email: "", phone: "", gender: "", dob: "", password: "", generate_password: true });
    setShowAdminModal(true);
  };

  const assignNewAdmin = async () => {
    const token = getToken();
    if (!token || !hospital) return;
    if (!adminForm.full_name || !adminForm.email) { toast.error("Full name and email are required"); return; }
    const replacing = !!hospital.admin_profile_id;
    const ok = replacing ? window.confirm("This hospital already has an admin. Do you want to replace the admin?") : true;
    if (!ok) return;
    try {
      setSavingAdmin(true);
      const endpoint = `${API_URL}/api/superadmin/hospitals/${hospital.id}/admin${replacing ? "?replace=true" : ""}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:         adminForm.full_name,
          email:             adminForm.email,
          phone:             adminForm.phone  || null,
          gender:            adminForm.gender || null,
          dob:               adminForm.dob    || null,
          password:          adminForm.generate_password ? null : adminForm.password,
          generate_password: adminForm.generate_password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to assign admin");
      toast.success("Hospital admin assigned successfully");
      if (data.credentials) setNewCreds(data.credentials);
      await fetchHospitalDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="page-main">
        <div className="do-loading-screen">
          <LoaderCircle size={36} className="animate-spin do-loading-icon" />
          <p className="do-loading-text">Fetching hospital records…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !hospital) {
    return (
      <div className="page-main">
        <div className="page-content">
          <button
            type="button"
            className="btn btn-ghost btn-sm hd-back-btn"
            onClick={onBack}
          >
            <ArrowLeft size={15} />
            Back to list
          </button>
          <div className="empty-state">
            <AlertCircle size={40} className="empty-icon" />
            <div className="empty-title">Something went wrong</div>
            <div className="empty-sub">{error}</div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 16 }}
              onClick={fetchHospitalDetails}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Status badge ── */
  const statusBadge = () => {
    const map: Record<string, string> = {
      approved: "badge badge-success",
      pending:  "badge badge-warning",
      rejected: "badge badge-error",
    };
    return (
      <span className={map[hospital.status] || "badge badge-neutral"}>
        {hospital.status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="page-main">

      {/* ── ASSIGN ADMIN MODAL ── */}
      {showAdminModal && (
        <div
          className="hd-modal-backdrop"
          onClick={() => !savingAdmin && setShowAdminModal(false)}
        >
          <div
            className="hd-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="hd-modal-header">
              <div>
                <div className="hd-modal-title">Assign Hospital Admin</div>
                <div className="hd-modal-sub">Create a new admin and assign to this hospital</div>
              </div>
              <button
                type="button"
                className="btn btn-icon hd-modal-close"
                onClick={() => !savingAdmin && setShowAdminModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="hd-modal-body">
              <div className="form-grid-2">
                <div className="field">
                  <label className="field-label">Full Name *</label>
                  <input
                    className="field-input"
                    value={adminForm.full_name}
                    onChange={(e) => setAdminForm((p) => ({ ...p, full_name: e.target.value }))}
                    disabled={savingAdmin}
                    placeholder="Full name"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Email *</label>
                  <input
                    type="email"
                    className="field-input"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={savingAdmin}
                    placeholder="Email address"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Phone</label>
                  <input
                    className="field-input"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm((p) => ({ ...p, phone: e.target.value }))}
                    disabled={savingAdmin}
                    placeholder="Phone number"
                  />
                </div>
                <div className="field">
                  <label className="field-label">Gender</label>
                  <select
                    className="field-select"
                    value={adminForm.gender}
                    onChange={(e) => setAdminForm((p) => ({ ...p, gender: e.target.value }))}
                    disabled={savingAdmin}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Date of Birth</label>
                  <input
                    type="date"
                    className="field-input"
                    value={adminForm.dob}
                    onChange={(e) => setAdminForm((p) => ({ ...p, dob: e.target.value }))}
                    disabled={savingAdmin}
                  />
                </div>
                <div className="field" style={{ justifyContent: "flex-end", paddingBottom: 4 }}>
                  <label className="hd-checkbox-label">
                    <input
                      type="checkbox"
                      className="hd-checkbox"
                      checked={adminForm.generate_password}
                      onChange={(e) => setAdminForm((p) => ({ ...p, generate_password: e.target.checked }))}
                      disabled={savingAdmin}
                    />
                    Generate password automatically
                  </label>
                </div>
                {!adminForm.generate_password && (
                  <div className="field form-full">
                    <label className="field-label">Password</label>
                    <input
                      type="password"
                      className="field-input"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))}
                      disabled={savingAdmin}
                      placeholder="Enter password"
                    />
                  </div>
                )}
              </div>

              {/* Credentials display */}
              {newCreds && (
                <div className="hd-creds-box">
                  <div className="hd-creds-title">
                    <KeyRound size={14} />
                    Credentials — copy now
                  </div>
                  <div className="hd-creds-row">
                    <span className="hd-creds-key">Email:</span>
                    <span className="hd-creds-val">{newCreds.email}</span>
                  </div>
                  <div className="hd-creds-row">
                    <span className="hd-creds-key">Password:</span>
                    <span className="hd-creds-val">{newCreds.password || "(not shown)"}</span>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="hd-modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => !savingAdmin && setShowAdminModal(false)}
                  disabled={savingAdmin}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={assignNewAdmin}
                  disabled={savingAdmin}
                >
                  {savingAdmin ? (
                    <><RefreshCw size={14} className="animate-spin" /> Saving…</>
                  ) : (
                    <><Plus size={14} /> Assign Admin</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP NAV BAR ── */}
      <div className="hd-topbar">
        <button
          type="button"
          className="btn btn-ghost btn-sm hd-back-btn"
          onClick={onBack}
        >
          <ArrowLeft size={15} />
          Back to list
        </button>
        <div className="hd-topbar-right">
          {statusBadge()}
          <span className="hd-topbar-id">ID: {hospital.id.split("-")[0]}…</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content">

        {/* Hospital Identity + Admin — top row */}
        <div className="hd-top-grid">

          {/* Hospital Identity */}
          <div className="card hd-identity-card">
            <div className="hd-identity-top">
              <div className="icon-wrap icon-wrap-lg icon-wrap-teal">
                <Building2 size={24} color="#fff" />
              </div>
              <div>
                <div className="hd-hospital-name">{hospital.name}</div>
                <div className="hd-hospital-type">{hospital.hospital_type}</div>
              </div>
            </div>
            <div className="hd-identity-meta">
              <div className="hd-meta-item">
                <MapPin size={15} color="var(--ms-text-muted)" />
                <div>
                  <div className="info-label">Location</div>
                  <div className="info-value">{hospital.address || "No address provided"}</div>
                </div>
              </div>
              <div className="hd-meta-item">
                <Fingerprint size={15} color="var(--ms-text-muted)" />
                <div>
                  <div className="info-label">Registration Number</div>
                  <div className="info-value hd-mono">{hospital.registration_number}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Card */}
          <div className="card hd-admin-card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="icon-wrap icon-wrap-md icon-wrap-navy">
                  <ShieldCheck size={18} color="var(--ms-teal)" />
                </div>
                <div className="card-title">Administrator</div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openAdminModal}
              >
                <Plus size={14} />
                {hospital.admin ? "Replace" : "Assign"}
              </button>
            </div>

            <div className="hd-admin-profile">
              <div className="icon-wrap icon-wrap-md icon-wrap-muted">
                <User size={18} color="var(--ms-text-muted)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="list-item-title">
                  {hospital.admin?.full_name || "No admin assigned"}
                </div>
                <div className="list-item-sub">Hospital Administrator</div>
              </div>
            </div>

            <div className="hd-contact-list">
              <div className="hd-contact-item">
                <Mail size={14} color="var(--ms-teal)" />
                <span className="hd-contact-text">{hospital.admin?.email || "No email"}</span>
              </div>
              <div className="hd-contact-item">
                <Phone size={14} color="var(--ms-teal)" />
                <span className="hd-contact-text">{hospital.admin?.phone || "No contact"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="hd-stats-grid">
          {[
            { icon: Stethoscope, label: "Approved Doctors",   value: hospital.doctors_count    || 0 },
            { icon: Users,       label: "Doctor Assistants",  value: hospital.assistants_count || 0 },
            { icon: TrendingUp,  label: "Total Patients",     value: patients                       },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div className="hd-stat-inner">
                  <div className="icon-wrap icon-wrap-md icon-wrap-muted">
                    <Icon size={18} color="var(--ms-teal)" />
                  </div>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact + Verification */}
        <div className="hd-bottom-grid">

          {/* Contact Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="icon-wrap icon-wrap-md icon-wrap-muted">
                  <Mail size={16} color="var(--ms-teal)" />
                </div>
                <div>
                  <div className="card-title">Contact Information</div>
                </div>
              </div>
            </div>
            <div className="hd-contact-grid">
              {[
                { icon: Mail,  label: "Official Email",  value: hospital.contact_email  || "N/A" },
                { icon: Phone, label: "Official Phone",  value: hospital.contact_phone  || "N/A" },
                { icon: Globe, label: "License Number",  value: hospital.license_number || "N/A" },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="hd-contact-row">
                    <div className="hd-contact-row-left">
                      <Icon size={15} color="var(--ms-text-muted)" />
                      <span className="hd-contact-row-label">{row.label}</span>
                    </div>
                    <span className="hd-contact-row-value">{row.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Status */}
          <div className="workspace hd-verification">
            <div className="hd-verify-top">
              <div className="icon-wrap icon-wrap-lg icon-wrap-teal">
                <ShieldCheck size={24} color="#fff" />
              </div>
              <div>
                <div className="workspace-title">Verification Status</div>
                <div className="workspace-sub">
                  This hospital is currently{" "}
                  <strong style={{ color: "var(--ms-text-inverse)" }}>
                    {hospital.status}
                  </strong>
                  .{" "}
                  {hospital.status === "approved"
                    ? "All medical staff and assistants are permitted to use system features."
                    : "Review the pending documentation to finalize the approval process."}
                </div>
              </div>
            </div>

            <div className="hd-verify-pulse">
              <span className="hd-pulse-dot" />
              <div>
                <div className="hd-pulse-label">System Activity</div>
                <div className="hd-pulse-date">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default HospitalDetailPage;