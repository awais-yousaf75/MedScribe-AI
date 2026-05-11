// src/pages/doctor/PatientsPage.tsx
import { RefreshCw, Search, Users } from "lucide-react";
import { useState } from "react";
import type { Patient } from "@/types";

// ── Helpers ───────────────────────────────────────────────────

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatGender = (value?: string | null) => {
  if (!value) return "—";
  const g = value.toLowerCase();
  if (g === "m" || g === "male")   return "Male";
  if (g === "f" || g === "female") return "Female";
  return value;
};

// ── Props ─────────────────────────────────────────────────────

interface Props {
  patients:        Patient[];
  loadingPatients: boolean;
  onRefresh:       () => void;
  onStartConsultation: (patient: { profile_id: string; full_name: string }) => void;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function PatientsPage({
  patients,
  loadingPatients,
  onRefresh,
  onStartConsultation,
}: Props) {
  const [patientSearch, setPatientSearch] = useState("");

  const search = patientSearch.trim().toLowerCase();
  const visiblePatients = search
    ? patients.filter(
        (p) =>
          (p.full_name?.toLowerCase() || "").includes(search) ||
          (p.cnic?.toLowerCase()      || "").includes(search) ||
          (p.phone?.toLowerCase()     || "").includes(search),
      )
    : patients;

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Users size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Patients</div>
              <div className="page-header-sub">
                {patients.length} patients in your hospital
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <Users size={18} color="#fff" />
              </div>
              <div>
                <div className="card-title">Patients</div>
                <div className="card-subtitle">
                  {patients.length} patients in your hospital
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-icon"
              onClick={onRefresh}
              disabled={loadingPatients}
            >
              <RefreshCw size={14} className={loadingPatients ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="search-wrap" style={{ marginBottom: 16 }}>
            <Search className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by name, CNIC, or phone…"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
          </div>

          {loadingPatients ? (
            <div className="loading-text">Loading patients…</div>
          ) : visiblePatients.length === 0 ? (
            <div className="empty-state">
              <Users size={36} className="empty-icon" />
              <div className="empty-title">
                {patients.length === 0
                  ? "No patients registered yet."
                  : "No patients match your search."}
              </div>
            </div>
          ) : (
            <div className="scroll-list">
              {visiblePatients.map((patient) => (
                <div key={patient.id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div className="list-item-title">{patient.full_name}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px 16px", marginTop: 6 }}>
                      {[
                        { label: "CNIC",   value: patient.cnic                  },
                        { label: "Phone",  value: patient.phone   || "—"        },
                        { label: "Gender", value: formatGender(patient.gender)  },
                        { label: "DOB",    value: formatDate(patient.dob)       },
                      ].map((m) => (
                        <div key={m.label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span className="info-label" style={{ textTransform: "none", letterSpacing: 0 }}>
                            {m.label}:
                          </span>
                          <span className="list-item-sub" style={{ color: "var(--ms-text)", fontWeight: 500 }}>
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onStartConsultation({ profile_id: patient.id, full_name: patient.full_name })}
                  >
                    Start Consultation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}