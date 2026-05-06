import { useState } from "react";
import {
  UserCog, Building2, Search, UserPlus,
  CheckCircle, AlertCircle,
  Users as UsersIcon, RefreshCw, Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AssistantMeResponse,
  Patient,
  ExistingPatientSearchResult,
} from "../../components/AssistantDashboard";
import { API_URL, getToken } from "../../components/AssistantDashboard";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface AssistantPatientsPageProps {
  assistantInfo:    AssistantMeResponse | null;
  patients:         Patient[];
  loadingPatients:  boolean;
  onRefreshPatients: () => void;
}

// ─────────────────────────────────────────────────────────────
// HELPERS  (same as original)
// ─────────────────────────────────────────────────────────────

const formatDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function AssistantPatientsPage({
  assistantInfo,
  patients,
  loadingPatients,
  onRefreshPatients,
}: AssistantPatientsPageProps) {

  const [creating,          setCreating]          = useState(false);
  const [searchingExisting, setSearchingExisting] = useState(false);

  const [patientSearch,  setPatientSearch]  = useState("");
  const [existingCnic,   setExistingCnic]   = useState("");
  const [existingResult, setExistingResult] = useState<ExistingPatientSearchResult | null>(null);
  const [verificationError, setVerificationError] = useState("");

  const [newPatientForm, setNewPatientForm] = useState({
    fullName: "", cnic: "", phone: "", gender: "", dob: "",
  });

  // ── Derived ───────────────────────────────────────────────

  const doctor   = assistantInfo?.doctor;
  const hospital = assistantInfo?.hospital;

  const search          = patientSearch.trim().toLowerCase();
  const visiblePatients = search
    ? patients.filter((p) =>
        (p.full_name?.toLowerCase() || "").includes(search) ||
        (p.cnic?.toLowerCase()      || "").includes(search) ||
        (p.phone?.toLowerCase()     || "").includes(search)
      )
    : patients;

  // ── Status badge ─────────────────────────────────────────

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="list-item-sub">—</span>;
    const map: Record<string, { cls: string; icon: typeof CheckCircle }> = {
      approved: { cls: "badge badge-success", icon: CheckCircle },
      pending:  { cls: "badge badge-warning", icon: CheckCircle },
      rejected: { cls: "badge badge-error",   icon: CheckCircle },
    };
    const { cls, icon: Icon } = map[status] || map.pending;
    return (
      <span className={cls}>
        <Icon size={11} /> {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ── Handlers ──────────────────────────────────────────────

  const handleSearchExisting = async () => {
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    const cnic = existingCnic.trim();
    if (!cnic)  { toast.error("Enter a CNIC to search"); return; }
    try {
      setSearchingExisting(true); setExistingResult(null); setVerificationError("");
      const res  = await fetch(`${API_URL}/api/assistant/patients/search?cnic=${encodeURIComponent(cnic)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search patient");
      setExistingResult(data);
      if (!data.found) setVerificationError("No patient found with this CNIC");
    } catch (err: any) { toast.error(err.message || "Failed to search patient"); }
    finally { setSearchingExisting(false); }
  };

  const handleLinkExisting = async () => {
    const token = getToken();
    if (!token || !existingResult?.found || !existingResult.patient) return;
    const p = existingResult.patient;
    try {
      setCreating(true);
      const res  = await fetch(`${API_URL}/api/assistant/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: p.full_name, cnic: p.cnic, phone: p.phone, gender: p.gender, dob: p.dob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add patient");
      if      (data.status === "linked")         toast.success("Existing patient linked to this hospital.");
      else if (data.status === "already_exists") toast.info("Patient already registered here.");
      else                                       toast.success("Patient registered.");
      setExistingCnic(""); setExistingResult(null); setVerificationError("");
      onRefreshPatients();
    } catch (err: any) { toast.error(err.message || "Failed to link patient"); }
    finally { setCreating(false); }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    try {
      setCreating(true);
      const payload: any = { fullName: newPatientForm.fullName.trim(), cnic: newPatientForm.cnic.trim() };
      if (newPatientForm.phone.trim()) payload.phone  = newPatientForm.phone.trim();
      if (newPatientForm.gender)       payload.gender = newPatientForm.gender;
      if (newPatientForm.dob)          payload.dob    = newPatientForm.dob;
      const res  = await fetch(`${API_URL}/api/assistant/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add patient");
      if      (data.status === "created")        toast.success("New patient registered.");
      else if (data.status === "linked")         toast.success("Patient linked to this hospital.");
      else if (data.status === "already_exists") toast.info("Patient already here.");
      else                                       toast.success("Patient saved.");
      setNewPatientForm({ fullName: "", cnic: "", phone: "", gender: "", dob: "" });
      onRefreshPatients();
    } catch (err: any) { toast.error(err.message || "Failed to add patient"); }
    finally { setCreating(false); }
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <>
      {/* Assistant Profile Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <UserCog size={18} color="#fff" />
            </div>
            <div>
              <div className="card-title">{assistantInfo?.profile.full_name || "Assistant"}</div>
              <div className="card-subtitle">Doctor Assistant</div>
            </div>
          </div>
          {getStatusBadge(assistantInfo?.profile.approval_status)}
        </div>

        <div className="list-grid-2">
          {/* Doctor */}
          <div className="info-item">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Stethoscope size={14} color="var(--ms-teal)" />
              <div className="info-label" style={{ marginBottom: 0 }}>Assigned Doctor</div>
            </div>
            {doctor ? (
              <>
                <div className="list-item-title">{doctor.full_name}</div>
                <div className="list-item-sub">{doctor.phone || "No phone"}</div>
              </>
            ) : (
              <div className="list-item-sub">No doctor assigned</div>
            )}
          </div>

          {/* Hospital */}
          <div className="info-item">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Building2 size={14} color="var(--ms-teal)" />
              <div className="info-label" style={{ marginBottom: 0 }}>Hospital</div>
            </div>
            {hospital ? (
              <>
                <div className="list-item-title">{hospital.name}</div>
                <div className="list-item-sub">{hospital.address || "No address"}</div>
              </>
            ) : (
              <div className="list-item-sub">No hospital linked</div>
            )}
          </div>
        </div>
      </div>

      {/* Search Existing Patient */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Search size={18} color="#fff" />
            </div>
            <div>
              <div className="card-title">Search Existing Patient</div>
              <div className="card-subtitle">Find and verify patient by CNIC</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <Search className="search-icon" />
            <input
              className="search-input"
              placeholder="Enter CNIC (e.g., 42301-1234567-8)"
              value={existingCnic}
              onChange={(e) => setExistingCnic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchExisting()}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSearchExisting}
            disabled={searchingExisting}
          >
            <Search size={14} />
            {searchingExisting ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Found */}
        {existingResult?.found && existingResult.patient && (
          <div className="ad-found-box">
            <div className="ad-found-title">
              <CheckCircle size={15} color="var(--ms-success)" /> Patient Found
            </div>
            <div className="info-grid info-grid-4" style={{ marginBottom: 16 }}>
              {[
                { label: "Full Name", value: existingResult.patient.full_name },
                { label: "CNIC",      value: existingResult.patient.cnic      },
                { label: "Phone",     value: existingResult.patient.phone || "—" },
                { label: "DOB",       value: existingResult.patient.dob   || "—" },
              ].map((item) => (
                <div key={item.label} className="info-item">
                  <div className="info-label">{item.label}</div>
                  <div className="info-value">{item.value}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-md"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleLinkExisting}
              disabled={creating}
            >
              <CheckCircle size={15} />
              {creating ? "Adding…" : "Add to This Hospital"}
            </button>
          </div>
        )}

        {/* Not found */}
        {!existingResult?.found && verificationError && (
          <div className="ad-not-found-box">
            <AlertCircle size={16} color="var(--ms-warning)" />
            <span className="ad-not-found-text">{verificationError}</span>
          </div>
        )}
      </div>

      {/* Register New Patient */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-navy">
              <UserPlus size={18} color="var(--ms-teal)" />
            </div>
            <div>
              <div className="card-title">Register New Patient</div>
              <div className="card-subtitle">Add a new patient to the system</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddPatient}>
          <div className="form-grid-2" style={{ marginBottom: 20 }}>
            <div className="field">
              <label className="field-label">Full Name *</label>
              <input
                className="field-input"
                placeholder="Full name"
                value={newPatientForm.fullName}
                onChange={(e) => setNewPatientForm((p) => ({ ...p, fullName: e.target.value }))}
                required
                disabled={creating}
              />
            </div>
            <div className="field">
              <label className="field-label">CNIC *</label>
              <input
                className="field-input"
                placeholder="42301-1234567-1"
                value={newPatientForm.cnic}
                onChange={(e) => setNewPatientForm((p) => ({ ...p, cnic: e.target.value }))}
                required
                disabled={creating}
              />
            </div>
            <div className="field">
              <label className="field-label">Phone</label>
              <input
                className="field-input"
                placeholder="+92 300 0000000"
                value={newPatientForm.phone}
                onChange={(e) => setNewPatientForm((p) => ({ ...p, phone: e.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="field">
              <label className="field-label">Gender</label>
              <select
                className="field-select"
                value={newPatientForm.gender}
                onChange={(e) => setNewPatientForm((p) => ({ ...p, gender: e.target.value }))}
                disabled={creating}
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
                value={newPatientForm.dob}
                onChange={(e) => setNewPatientForm((p) => ({ ...p, dob: e.target.value }))}
                disabled={creating}
              />
            </div>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary btn-md"
                style={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
                disabled={creating}
              >
                <UserPlus size={15} />
                {creating ? "Registering…" : "Register Patient"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Patients List */}
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
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
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
        ) : visiblePatients.length === 0 ? (
          <div className="empty-state">
            <UsersIcon size={36} className="empty-icon" />
            <div className="empty-title">
              {patients.length === 0 ? "No patients registered yet." : "No patients match your search."}
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
                {visiblePatients.map((patient) => (
                  <tr key={patient.id}>
                    <td><div className="list-item-title">{patient.full_name}</div></td>
                    <td>
                      <span style={{ fontFamily: "var(--ms-font-mono)", fontSize: "var(--ms-text-sm)", color: "var(--ms-text-soft)" }}>
                        {patient.cnic}
                      </span>
                    </td>
                    <td><div className="list-item-sub">{patient.phone || "—"}</div></td>
                    <td><div className="list-item-sub" style={{ textTransform: "capitalize" }}>{patient.gender || "—"}</div></td>
                    <td><div className="list-item-sub">{formatDate(patient.dob)}</div></td>
                    <td><div className="list-item-sub">{formatDate(patient.created_at)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}