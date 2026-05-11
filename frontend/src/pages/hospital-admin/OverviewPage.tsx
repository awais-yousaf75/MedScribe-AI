import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, RefreshCw, Stethoscope, UserCog, Users,
  ArrowRight, AlertTriangle, Link2, TrendingUp, Activity,
  CheckCircle2, XCircle,
} from "lucide-react";

export default function OverviewPage({
  dashboard, loading, onRefresh,
}: {
  dashboard: any;
  loading: boolean;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const stats = dashboard?.stats || {
    doctorsActive: 0, doctorsInactive: 0,
    assistantsActive: 0, assistantsInactive: 0,
    patientsCount: 0, assistantsUnlinked: 0,
  };

  const hospital = dashboard?.hospital;

  const statCards = [
    {
      label:    "Active Doctors",
      value:    stats.doctorsActive,
      sub:      `${stats.doctorsInactive} inactive`,
      icon:     Stethoscope,
      btnLabel: "Manage Doctors",
      page:     "doctors" as const,
    },
    {
      label:    "Active Assistants",
      value:    stats.assistantsActive,
      sub:      `${stats.assistantsInactive} inactive`,
      icon:     UserCog,
      btnLabel: "Manage Assistants",
      page:     "assistants" as const,
    },
    {
      label:    "Total Patients",
      value:    stats.patientsCount,
      sub:      "Count only — data is private",
      icon:     Users,
      btnLabel: null,
      page:     null,
    },
  ];

  const hospitalStatus = hospital?.status;
  const statusBadgeCls =
    hospitalStatus === "approved" ? "badge badge-success" :
    hospitalStatus === "pending"  ? "badge badge-warning" :
                                    "badge badge-error";

  const pct = (a: number, b: number) =>
    a + b > 0 ? `${Math.round((a / (a + b)) * 100)}%` : "0%";

  return (
    <div className="page-main">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Overview</div>
              <div className="page-header-sub">
                {hospital ? `Managing · ${hospital.name}` : "No hospital assigned"}
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-icon btn-icon-lg"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Hospital status strip */}
        {hospital && (
          <div className="ov-hospital-strip">
            <Building2 size={16} color="var(--ms-teal)" style={{ flexShrink: 0 }} />
            <div className="ov-strip-name">{hospital.name}</div>
            <span className={statusBadgeCls}>
              {hospitalStatus?.charAt(0).toUpperCase() + hospitalStatus?.slice(1)}
            </span>
            <button
              type="button"
              className="ov-strip-link"
              onClick={() => navigate(`../${"hospital-profile".replace(/['"]/g, '')}`)}
            >
              View Profile <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content">

        {/* Stat cards */}
        <div className="ov-stat-grid">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card ov-stat-card">
                <div className="ov-stat-top">
                  <div className="icon-wrap icon-wrap-md icon-wrap-muted">
                    <Icon size={18} color="var(--ms-teal)" />
                  </div>
                  <div className="stat-value" style={{ fontSize: "var(--ms-text-4xl)" }}>
                    {loading ? <span style={{ color: "var(--ms-border)" }}>—</span> : card.value}
                  </div>
                </div>
                <div className="list-item-title" style={{ marginBottom: 3 }}>{card.label}</div>
                <div className="list-item-sub">{card.sub}</div>

                {card.btnLabel && card.page ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm ov-stat-btn"
                    onClick={() => navigate(`../${card.page!.replace(/['"]/g, '')}`)}
                  >
                    {card.btnLabel} <ArrowRight size={13} />
                  </button>
                ) : (
                  <div className="ov-privacy-pill">Patient data is private</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Health panels */}
        <div className="ov-health-grid">

          {/* Doctors */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div className="card-header-left">
                <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
                  <Stethoscope size={15} color="var(--ms-teal)" />
                </div>
                <div>
                  <div className="card-title">Doctor Health</div>
                  <div className="card-subtitle">Active vs inactive breakdown</div>
                </div>
              </div>
            </div>

            <div className="ov-health-rows">
              <div className="ov-health-row">
                <div className="ov-health-label">
                  <CheckCircle2 size={14} color="var(--ms-success)" />
                  <span>Active</span>
                </div>
                <div className="ov-health-bar-wrap">
                  <div className="ov-progress-track">
                    <div
                      className="ov-progress-fill ov-progress-success"
                      style={{ width: pct(stats.doctorsActive, stats.doctorsInactive) }}
                    />
                  </div>
                  <span className="ov-health-count">{stats.doctorsActive}</span>
                </div>
              </div>
              <div className="ov-health-row">
                <div className="ov-health-label">
                  <XCircle size={14} color="var(--ms-error)" />
                  <span>Inactive</span>
                </div>
                <div className="ov-health-bar-wrap">
                  <div className="ov-progress-track">
                    <div
                      className="ov-progress-fill ov-progress-error"
                      style={{ width: pct(stats.doctorsInactive, stats.doctorsActive) }}
                    />
                  </div>
                  <span className="ov-health-count">{stats.doctorsInactive}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm ov-health-btn"
              onClick={() => navigate(`../${"doctors".replace(/['"]/g, '')}`)}
            >
              Go to Doctors <ArrowRight size={13} />
            </button>
          </div>

          {/* Assistants */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div className="card-header-left">
                <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
                  <UserCog size={15} color="var(--ms-teal)" />
                </div>
                <div>
                  <div className="card-title">Assistant Health</div>
                  <div className="card-subtitle">Active vs inactive breakdown</div>
                </div>
              </div>
            </div>

            <div className="ov-health-rows">
              <div className="ov-health-row">
                <div className="ov-health-label">
                  <CheckCircle2 size={14} color="var(--ms-success)" />
                  <span>Active</span>
                </div>
                <div className="ov-health-bar-wrap">
                  <div className="ov-progress-track">
                    <div
                      className="ov-progress-fill ov-progress-success"
                      style={{ width: pct(stats.assistantsActive, stats.assistantsInactive) }}
                    />
                  </div>
                  <span className="ov-health-count">{stats.assistantsActive}</span>
                </div>
              </div>
              <div className="ov-health-row">
                <div className="ov-health-label">
                  <XCircle size={14} color="var(--ms-error)" />
                  <span>Inactive</span>
                </div>
                <div className="ov-health-bar-wrap">
                  <div className="ov-progress-track">
                    <div
                      className="ov-progress-fill ov-progress-error"
                      style={{ width: pct(stats.assistantsInactive, stats.assistantsActive) }}
                    />
                  </div>
                  <span className="ov-health-count">{stats.assistantsInactive}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm ov-health-btn"
              onClick={() => navigate(`../${"assistants".replace(/['"]/g, '')}`)}
            >
              Go to Assistants <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Alert — unlinked assistants */}
        {stats.assistantsUnlinked > 0 && (
          <div className="card ov-alert-card">
            <div className="ov-alert-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="icon-wrap icon-wrap-md icon-wrap-muted">
                  <AlertTriangle size={18} color="var(--ms-warning)" />
                </div>
                <div>
                  <div className="ov-alert-title">Action Required</div>
                  <div className="ov-alert-sub">
                    {stats.assistantsUnlinked} assistant
                    {stats.assistantsUnlinked !== 1 ? "s" : ""} not linked to a doctor
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm ap-btn-warn"
                onClick={() => navigate(`../${"assistants".replace(/['"]/g, '')}`)}
              >
                <Link2 size={13} /> Link Now
              </button>
            </div>

            <div className="ov-alert-body">
              <div className="ov-alert-count-box">
                <div className="info-label">Unlinked Assistants</div>
                <div className="stat-value" style={{ fontSize: "var(--ms-text-5xl)", marginTop: 8 }}>
                  {stats.assistantsUnlinked}
                </div>
                <div className="list-item-sub" style={{ marginTop: 8 }}>
                  Cannot be routed to consultations until linked to a doctor
                </div>
              </div>

              <div className="ov-alert-steps">
                <div className="info-label">How to fix</div>
                <ol className="ov-steps-list">
                  {[
                    <>Open the <strong>Assistants</strong> page</>,
                    <>Click <strong>Link</strong> on each unlinked assistant</>,
                    <>Select the correct doctor and save</>,
                  ].map((text, i) => (
                    <li key={i} className="ov-step-item">
                      <span className="ov-step-num">{i + 1}</span>
                      <span className="list-item-sub" style={{ color: "var(--ms-text-soft)" }}>{text}</span>
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 14, color: "var(--ms-teal)" }}
                  onClick={() => navigate(`../${"assistants".replace(/['"]/g, '')}`)}
                >
                  Go to Assistants <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hospital quick card */}
        <div className="card ov-hospital-card">
          <div className="icon-wrap icon-wrap-lg icon-wrap-teal" style={{ flexShrink: 0 }}>
            <Building2 size={24} color="#fff" />
          </div>
          <div className="ov-hospital-info">
            <div className="info-label">Your Hospital</div>
            <div className="ov-hospital-name">{hospital?.name || "Not assigned"}</div>
            {hospital?.status && (
              <div className="list-item-sub" style={{ marginTop: 3 }}>
                Status:{" "}
                <span style={{ color: hospital.status === "approved" ? "var(--ms-success)" : "var(--ms-warning)", fontWeight: 600 }}>
                  {hospital.status}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`../${"hospital-profile".replace(/['"]/g, '')}`)}
            style={{ flexShrink: 0 }}
          >
            View Profile <ArrowRight size={13} />
          </button>
        </div>

        {/* Summary row */}
        <div className="workspace ov-summary">
          <TrendingUp size={16} color="var(--ms-teal)" style={{ flexShrink: 0 }} />
          <p className="ov-summary-text">
            <strong style={{ color: "var(--ms-text-inverse)" }}>{stats.doctorsActive} doctors</strong>
            {" "}and{" "}
            <strong style={{ color: "var(--ms-text-inverse)" }}>{stats.assistantsActive} assistants</strong>
            {" "}are currently active serving{" "}
            <strong style={{ color: "var(--ms-text-inverse)" }}>{stats.patientsCount} patients</strong>
            {" "}at your hospital.
          </p>
        </div>

      </div>
    </div>
  );
}