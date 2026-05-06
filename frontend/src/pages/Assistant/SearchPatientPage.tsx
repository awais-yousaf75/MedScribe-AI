import { useState } from "react";
import { Search, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { ExistingPatientSearchResult } from "../../components/AssistantDashboard";
import { API_URL, getToken } from "../../components/AssistantDashboard";

interface Props {
  onRefreshPatients: () => void;
}

export function SearchPatientPage({ onRefreshPatients }: Props) {

  const [searching,         setSearching]         = useState(false);
  const [creating,          setCreating]           = useState(false);
  const [existingCnic,      setExistingCnic]       = useState("");
  const [existingResult,    setExistingResult]     = useState<ExistingPatientSearchResult | null>(null);
  const [verificationError, setVerificationError]  = useState("");

  // ── Handlers ──────────────────────────────────────────────

  const handleSearch = async () => {
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    const cnic = existingCnic.trim();
    if (!cnic)  { toast.error("Enter a CNIC to search"); return; }
    try {
      setSearching(true); setExistingResult(null); setVerificationError("");
      const res  = await fetch(
        `${API_URL}/api/assistant/patients/search?cnic=${encodeURIComponent(cnic)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search patient");
      setExistingResult(data);
      if (!data.found) setVerificationError("No patient found with this CNIC");
    } catch (err: any) { toast.error(err.message || "Failed to search patient"); }
    finally { setSearching(false); }
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

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
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

      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <Search className="search-icon" />
          <input
            className="search-input"
            placeholder="Enter CNIC (e.g., 42301-1234567-8)"
            value={existingCnic}
            onChange={(e) => setExistingCnic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSearch}
          disabled={searching}
        >
          <Search size={14} />
          {searching ? "Searching…" : "Search"}
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
              { label: "Full Name", value: existingResult.patient.full_name        },
              { label: "CNIC",      value: existingResult.patient.cnic             },
              { label: "Phone",     value: existingResult.patient.phone     || "—" },
              { label: "DOB",       value: existingResult.patient.dob       || "—" },
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
  );
}