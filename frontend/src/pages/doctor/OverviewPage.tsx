// src/pages/doctor/OverviewPage.tsx
import { Activity, Edit, FileText, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DoctorMeResponse } from "@/types";

// ── Helpers ───────────────────────────────────────────────────

const getStatusBadge = (status?: string | null) => {
  if (!status) return <span className="list-item-sub">—</span>;
  const map: Record<string, string> = {
    approved: "badge badge-success",
    pending:  "badge badge-warning",
    rejected: "badge badge-error",
  };
  return (
    <span className={map[status] || map.pending}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ── Props ─────────────────────────────────────────────────────

interface Props {
  doctorInfo: DoctorMeResponse | null;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function OverviewPage({ doctorInfo }: Props) {
  const navigate = useNavigate();

  const doctorName     = doctorInfo?.profile.full_name || doctorInfo?.user.email || "Doctor";
  const specialization = doctorInfo?.doctor_profile?.specialization || "—";
  const license        = doctorInfo?.doctor_profile?.license_number || "—";
  const cnic           = doctorInfo?.doctor_profile?.cnic || "—";
  const phone          = doctorInfo?.profile.phone || "—";
  const hospital       = doctorInfo?.hospital;

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Overview</div>
              <div className="page-header-sub">
                {doctorName} · {specialization}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">

        {/* Doctor Profile Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <Activity size={18} color="#fff" />
              </div>
              <div>
                <div className="card-title">{doctorName}</div>
                <div className="card-subtitle">{specialization}</div>
              </div>
            </div>
            {getStatusBadge(doctorInfo?.doctor_profile?.approval_status)}
          </div>

          <div className="info-grid info-grid-4">
            {[
              { label: "License",  value: license               },
              { label: "CNIC",     value: cnic                  },
              { label: "Phone",    value: phone                 },
              { label: "Hospital", value: hospital?.name || "—" },
            ].map((item) => (
              <div key={item.label} className="info-item">
                <div className="info-label">{item.label}</div>
                <div className="info-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Consultation Workspace */}
        <div className="workspace">
          <div className="workspace-title">Consultation Workspace</div>
          <div className="workspace-sub">AI-powered clinical tools</div>
          <div className="workspace-grid">
            {[
              { page: "recording",  icon: Activity,  label: "Start Consultation", sub: "Begin recording" },
              { page: "extraction", icon: FileText,  label: "Latest Extraction",  sub: "AI insights"     },
              { page: "notes",      icon: Edit,      label: "Edit Notes",         sub: "Documentation"   },
              { page: "history",    icon: History,   label: "History",            sub: "Past records"    },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  type="button"
                  className="workspace-btn"
                  onClick={() => navigate("/doctor/" + item.page)}
                >
                  <div className="workspace-btn-icon">
                    <Icon size={20} color="#fff" />
                  </div>
                  <div className="workspace-btn-label">{item.label}</div>
                  <div className="workspace-btn-sub">{item.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}