import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { API_URL, getToken } from "../../components/AssistantDashboard";

interface Props {
  onRefreshPatients: () => void;
}

export function RegisterPatientPage({ onRefreshPatients }: Props) {

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: "", cnic: "", phone: "", gender: "", dob: "",
  });

  // ── Handler ───────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    try {
      setCreating(true);
      const payload: any = { fullName: form.fullName.trim(), cnic: form.cnic.trim() };
      if (form.phone.trim()) payload.phone  = form.phone.trim();
      if (form.gender)       payload.gender = form.gender;
      if (form.dob)          payload.dob    = form.dob;
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
      setForm({ fullName: "", cnic: "", phone: "", gender: "", dob: "" });
      onRefreshPatients();
    } catch (err: any) { toast.error(err.message || "Failed to add patient"); }
    finally { setCreating(false); }
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
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

      <form onSubmit={handleSubmit}>
        <div className="form-grid-2" style={{ marginBottom: 20 }}>

          <div className="field">
            <label className="field-label">Full Name *</label>
            <input
              className="field-input"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              required
              disabled={creating}
            />
          </div>

          <div className="field">
            <label className="field-label">CNIC *</label>
            <input
              className="field-input"
              placeholder="42301-1234567-1"
              value={form.cnic}
              onChange={(e) => setForm((p) => ({ ...p, cnic: e.target.value }))}
              required
              disabled={creating}
            />
          </div>

          <div className="field">
            <label className="field-label">Phone</label>
            <input
              className="field-input"
              placeholder="+92 300 0000000"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              disabled={creating}
            />
          </div>

          <div className="field">
            <label className="field-label">Gender</label>
            <select
              className="field-select"
              value={form.gender}
              onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
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
              value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
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
  );
}