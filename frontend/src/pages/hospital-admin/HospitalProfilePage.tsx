import React, { useEffect, useState } from "react";
import {
  Building2, Mail, MapPin, Phone, Fingerprint, FileText,
  Users, Stethoscope, RefreshCw, UserCog, Activity,
  CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function HospitalProfilePage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");

  const fetchHospital = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/hospital`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load hospital profile");
      setData(json);
    } catch (e: any) {
      toast.error(e.message || "Failed to load hospital profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospital();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Loading ── */
  if (loading && !data) {
    return (
      <div className="page-main">
        <div className="do-loading-screen">
          <RefreshCw size={32} className="animate-spin do-loading-icon" />
          <p className="do-loading-text">Loading hospital profile…</p>
        </div>
      </div>
    );
  }

  const hospital = data?.hospital;
  const stats    = data?.stats;

  const statusMap: Record<string, { cls: string; dot: string; label: string; icon: React.ElementType }> = {
    approved: { cls: "badge badge-success", dot: "ms-dot ms-dot-active",  label: "Active",    icon: CheckCircle2 },
    pending:  { cls: "badge badge-warning", dot: "ms-dot ms-dot-warning", label: "Pending",   icon: Clock        },
    rejected: { cls: "badge badge-error",   dot: "ms-dot ms-dot-error",   label: "Suspended", icon: XCircle      },
  };

  return (
    <div className="page-main">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Building2 size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Hospital Profile</div>
              <div className="page-header-sub">
                Hospital identity &amp; privacy-safe statistics
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-icon btn-icon-lg"
              onClick={fetchHospital}
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

        {!hospital ? (
          <div className="empty-state card">
            <Building2 size={40} className="empty-icon" />
            <div className="empty-title">No Hospital Assigned</div>
            <div className="empty-sub">
              Contact Super Admin to assign a hospital to your account.
            </div>
          </div>
        ) : (
          <>

            {/* ── Identity Card ── */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>

              {/* Banner */}
              <div className="hp-banner">
                <div className="hp-banner-left">
                  <div className="icon-wrap icon-wrap-lg hp-banner-icon">
                    <Building2 size={26} color="#fff" />
                  </div>
                  <div>
                    <div className="hp-hospital-name">{hospital.name}</div>
                    {hospital.hospital_type && (
                      <div className="hp-hospital-type">{hospital.hospital_type}</div>
                    )}
                  </div>
                </div>

                {(() => {
                  const s = statusMap[hospital.status] || statusMap.pending;
                  return (
                    <span className={s.cls}>
                      <span className={s.dot} />
                      {s.label}
                    </span>
                  );
                })()}
              </div>

              {/* Details grid */}
              <div className="hp-details">
                <div className="hp-detail-grid">

                  <div className="hp-detail-item">
                    <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
                      <Fingerprint size={15} color="var(--ms-teal)" />
                    </div>
                    <div>
                      <div className="info-label">Registration #</div>
                      <div className="info-value hp-mono">
                        {hospital.registration_number}
                      </div>
                    </div>
                  </div>

                  <div className="hp-detail-item">
                    <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
                      <FileText size={15} color="var(--ms-teal)" />
                    </div>
                    <div>
                      <div className="info-label">License #</div>
                      <div className="info-value hp-mono">
                        {hospital.license_number || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="hp-detail-item hp-detail-full">
                    <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
                      <MapPin size={15} color="var(--ms-teal)" />
                    </div>
                    <div>
                      <div className="info-label">Address</div>
                      <div className="info-value">{hospital.address || "—"}</div>
                    </div>
                  </div>

                  <div className="hp-detail-item">
                    <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
                      <Mail size={15} color="var(--ms-teal)" />
                    </div>
                    <div>
                      <div className="info-label">Contact Email</div>
                      <div className="info-value" style={{ wordBreak: "break-all" }}>
                        {hospital.contact_email || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="hp-detail-item">
                    <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
                      <Phone size={15} color="var(--ms-teal)" />
                    </div>
                    <div>
                      <div className="info-label">Contact Phone</div>
                      <div className="info-value">{hospital.contact_phone || "—"}</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ── Stats Card ── */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>

              {/* Stats header */}
              <div className="hp-stats-header">
                <div className="icon-wrap icon-wrap-md icon-wrap-muted">
                  <Activity size={18} color="var(--ms-teal)" />
                </div>
                <div>
                  <div className="card-title" style={{ marginBottom: 2 }}>Hospital Statistics</div>
                  <div className="card-subtitle">Privacy-safe aggregate counts</div>
                </div>
              </div>

              <div className="hp-stats-body">
                <div className="hp-stats-grid">
                  {[
                    { icon: Stethoscope, label: "Approved Doctors",     value: stats?.doctorsCount    ?? 0 },
                    { icon: UserCog,     label: "Approved Assistants",  value: stats?.assistantsCount ?? 0 },
                    { icon: Users,       label: "Patients (count only)", value: stats?.patientsCount   ?? 0 },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="stat-card hp-stat-card">
                        <div className="icon-wrap icon-wrap-md icon-wrap-muted hp-stat-icon">
                          <Icon size={18} color="var(--ms-teal)" />
                        </div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Privacy note */}
                <div className="hp-privacy-note">
                  <span className="ms-dot ms-dot-active" style={{ flexShrink: 0 }} />
                  <p className="hp-privacy-text">
                    Patient data is private. Only total count is displayed for compliance.
                  </p>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}