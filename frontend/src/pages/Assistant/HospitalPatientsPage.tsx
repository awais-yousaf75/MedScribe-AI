import { Search, Users as UsersIcon, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { Patient } from "@/types";

interface Props {
  patients:         Patient[];
  loadingPatients:  boolean;
  onRefreshPatients: () => void;
}

const formatDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export function HospitalPatientsPage({ patients, loadingPatients, onRefreshPatients }: Props) {

  const [search, setSearch] = useState("");

  const visible = search.trim()
    ? patients.filter((p) =>
        (p.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (p.cnic?.toLowerCase()      || "").includes(search.toLowerCase()) ||
        (p.phone?.toLowerCase()     || "").includes(search.toLowerCase())
      )
    : patients;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="icon-wrap icon-wrap-md icon-wrap-teal">
            <UsersIcon size={18} color="#fff" />
          </div>
          <div>
            <div className="card-title">Hospital Patients</div>
            <div className="card-subtitle">{patients.length} registered</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="search-wrap" style={{ width: 280 }}>
            <Search className="search-icon" />
            <input
              className="search-input"
              placeholder="Search name, CNIC, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-icon"
            onClick={onRefreshPatients}
            disabled={loadingPatients}
          >
            <RefreshCw size={14} className={loadingPatients ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loadingPatients ? (
        <div className="loading-text">Loading patients…</div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <UsersIcon size={36} className="empty-icon" />
          <div className="empty-title">
            {patients.length === 0
              ? "No patients registered yet."
              : "No patients match your search."}
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>CNIC</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className="list-item-title">{patient.full_name}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--ms-font-mono)", fontSize: "var(--ms-text-sm)", color: "var(--ms-text-soft)" }}>
                      {patient.cnic}
                    </span>
                  </td>
                  <td><div className="list-item-sub">{patient.phone || "—"}</div></td>
                  <td>
                    <div className="list-item-sub" style={{ textTransform: "capitalize" }}>
                      {patient.gender || "—"}
                    </div>
                  </td>
                  <td><div className="list-item-sub">{formatDate(patient.dob)}</div></td>
                  <td><div className="list-item-sub">{formatDate(patient.created_at)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}