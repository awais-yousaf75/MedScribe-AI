import { useState } from "react";
import { UserPlus, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { API_URL, getToken } from "@/lib/constants";

interface Props {
  onRefreshPatients: () => void;
}

function generatePassword(length = 12): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "@#$!";
  const all = upper + lower + digits + special;

  // Guarantee at least one of each required char type
  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  const rest = Array.from(
    { length: length - required.length },
    () => all[Math.floor(Math.random() * all.length)],
  );

  // Shuffle so required chars aren't always at the start
  return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
}

export function RegisterPatientPage({ onRefreshPatients }: Props) {
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>(() =>
    generatePassword(),
  );

  const [form, setForm] = useState({
    fullName: "",
    cnic: "",
    phone: "",
    gender: "",
    dob: "",
    email: "",
  });

  // ── Helpers ───────────────────────────────────────────────

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("Password copied to clipboard");
  };

  const handleRegeneratePassword = () => {
    setGeneratedPassword(generatePassword());
    toast.info("New password generated");
  };

  // ── Handler ───────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    const nameRegex = /^[a-zA-Z\s.\-']+$/;
    if (!nameRegex.test(form.fullName.trim())) {
      toast.error("Full name must contain only letters, spaces, hyphens, or apostrophes");
      return;
    }

    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnicRegex.test(form.cnic.trim())) {
      toast.error("CNIC must be in format: 42301-1234567-1");
      return;
    }

    if (form.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
      if (!phoneRegex.test(form.phone.trim())) {
        toast.error("Invalid phone number format");
        return;
      }
    }

    if (form.dob) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.dob) >= today) {
        toast.error("Date of birth cannot be today or in the future");
        return;
      }
    }

    try {
      setCreating(true);

      const payload: any = {
        fullName: form.fullName.trim(),
        cnic: form.cnic.trim(),
        password: generatedPassword, // always send generated password
      };

      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.gender) payload.gender = form.gender;
      if (form.dob) payload.dob = form.dob;

      const res = await fetch(`${API_URL}/api/assistant/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add patient");

      if (data.status === "created") {
        toast.success("New patient registered successfully.");
      } else if (data.status === "linked") {
        toast.success("Patient linked to this hospital.");
      } else if (data.status === "already_exists") {
        toast.info("Patient already registered here.");
      } else {
        toast.success("Patient saved.");
      }

      // Reset form and generate fresh password for next registration
      setForm({
        fullName: "",
        cnic: "",
        phone: "",
        gender: "",
        dob: "",
        email: "",
      });
      setGeneratedPassword(generatePassword());
      setShowPassword(false);
      onRefreshPatients();
    } catch (err: any) {
      toast.error(err.message || "Failed to add patient");
    } finally {
      setCreating(false);
    }
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
          {/* Full Name */}
          <div className="field">
            <label className="field-label">Full Name *</label>
            <input
              className="field-input"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value.replace(/[^a-zA-Z\s.\-']/g, "") }))
              }
              required
              disabled={creating}
            />
          </div>

          {/* CNIC */}
          <div className="field">
            <label className="field-label">CNIC *</label>
            <input
              className="field-input"
              placeholder="42301-1234567-1"
              value={form.cnic}
              onChange={(e) => setForm((p) => ({ ...p, cnic: e.target.value.replace(/[^0-9\-]/g, "") }))}
              required
              disabled={creating}
            />
          </div>

          {/* Email */}
          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email"
              className="field-input"
              placeholder="patient@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              disabled={creating}
            />
          </div>

          {/* Phone */}
          <div className="field">
            <label className="field-label">Phone</label>
            <input
              className="field-input"
              placeholder="+92 300 0000000"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value.replace(/[^0-9+\s()\-]/g, "") }))
              }
              disabled={creating}
            />
          </div>

          {/* Gender */}
          <div className="field">
            <label className="field-label">Gender</label>
            <select
              className="field-select"
              value={form.gender}
              onChange={(e) =>
                setForm((p) => ({ ...p, gender: e.target.value }))
              }
              disabled={creating}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date of Birth */}
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

          {/* Generated Password — spans full width */}
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">
              System-Generated Password
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 400,
                  color: "var(--ms-text-muted, #888)",
                }}
              >
                Share this with the patient so they can log in
              </span>
            </label>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Password display */}
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  className="field-input"
                  type={showPassword ? "text" : "password"}
                  value={generatedPassword}
                  readOnly
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: showPassword ? 1 : 2,
                    paddingRight: 40,
                    backgroundColor: "var(--ms-bg-subtle, #f8f9fa)",
                    cursor: "default",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={creating}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--ms-text-muted, #888)",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Copy button */}
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={handleCopyPassword}
                disabled={creating}
                title="Copy password"
                style={{ flexShrink: 0 }}
              >
                <Copy size={14} />
                Copy
              </button>

              {/* Regenerate button */}
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={handleRegeneratePassword}
                disabled={creating}
                title="Generate new password"
                style={{ flexShrink: 0 }}
              >
                <RefreshCw size={14} />
                New
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-md"
          style={{ width: "100%", justifyContent: "center" }}
          disabled={creating}
        >
          <UserPlus size={15} />
          {creating ? "Registering…" : "Register Patient"}
        </button>
      </form>
    </div>
  );
}
