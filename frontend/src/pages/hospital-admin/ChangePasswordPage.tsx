// src/pages/hospital-admin/ChangePasswordPage.tsx
import { useState } from "react";
import {
  Key, Lock, Eye, EyeOff, RefreshCw,
  CheckCircle, X,
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/constants";

function SectionCard({
  title, description, icon: Icon, children,
}: {
  title: string; description?: string;
  icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="sp-card-header">
        <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
          <Icon size={15} color="var(--ms-teal)" />
        </div>
        <div>
          <div className="card-title">{title}</div>
          {description && <div className="card-subtitle">{description}</div>}
        </div>
      </div>
      <div className="sp-card-body">{children}</div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const token = localStorage.getItem("accessToken");
  const [newPass,     setNewPass]     = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving,      setSaving]      = useState(false);

  const strength = (() => {
    if (!newPass) return 0;
    let s = 0;
    if (newPass.length >= 8)          s++;
    if (/[A-Z]/.test(newPass))        s++;
    if (/[0-9]/.test(newPass))        s++;
    if (/[^A-Za-z0-9]/.test(newPass)) s++;
    return s;
  })();

  const strengthColors = ["", "var(--ms-error)", "var(--ms-warning)", "#CA8A04", "var(--ms-success)"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const requirements = [
    { label: "At least 8 characters",      met: newPass.length >= 8          },
    { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(newPass)        },
    { label: "One number (0–9)",           met: /[0-9]/.test(newPass)        },
    { label: "One special character",      met: /[^A-Za-z0-9]/.test(newPass) },
  ];

  const handleSubmit = async () => {
    if (!newPass || !confirm) { toast.error("All fields are required"); return; }
    if (newPass !== confirm)  { toast.error("Passwords do not match"); return; }
    if (newPass.length < 8)   { toast.error("Min 8 characters"); return; }
    if (strength < 2)         { toast.error("Password is too weak"); return; }
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      toast.success("Password changed successfully");
      setNewPass(""); setConfirm("");
    } catch (e: any) { toast.error(e.message || "Failed to change password"); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-main">
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Key size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Change Password</div>
              <div className="page-header-sub">Update your account security</div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="sp-section">
          <div className="sp-danger-banner">
            <div className="icon-wrap icon-wrap-md icon-wrap-navy" style={{ flexShrink: 0 }}>
              <Key size={18} color="var(--ms-error)" />
            </div>
            <div>
              <div className="sp-banner-name">Change Password</div>
              <div className="sp-banner-email">Choose a strong, unique password</div>
            </div>
          </div>

          <SectionCard title="New Password" description="Enter and confirm below" icon={Lock}>
            <div className="sp-password-form">
              <div className="field">
                <label className="field-label">New Password *</label>
                <div className="field-input-wrap">
                  <Lock className="field-icon" size={15} />
                  <input type={showNew ? "text" : "password"} className="field-input field-input-icon sp-pw-input"
                    placeholder="Enter new password" value={newPass}
                    onChange={(e) => setNewPass(e.target.value)} />
                  <button type="button" className="sp-eye-btn" onClick={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPass && (
                  <div className="sp-strength-wrap">
                    <div className="sp-strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="sp-strength-bar"
                          style={{ background: i <= strength ? strengthColors[strength] : "var(--ms-border)" }} />
                      ))}
                    </div>
                    {strengthLabels[strength] && (
                      <div className="sp-strength-label" style={{ color: strengthColors[strength] }}>
                        Strength: {strengthLabels[strength]}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="field">
                <label className="field-label">Confirm Password *</label>
                <div className="field-input-wrap">
                  <Key className="field-icon" size={15} />
                  <input type={showConfirm ? "text" : "password"} className="field-input field-input-icon sp-pw-input"
                    placeholder="Re-enter password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} />
                  <button type="button" className="sp-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirm && newPass && (
                  <div className="sp-match-text" style={{ color: confirm === newPass ? "var(--ms-success)" : "var(--ms-error)" }}>
                    {confirm === newPass
                      ? <><CheckCircle size={12} /> Match</>
                      : <><X size={12} /> Mismatch</>
                    }
                  </div>
                )}
              </div>

              <div className="sp-requirements">
                <div className="info-label" style={{ marginBottom: 10 }}>Requirements</div>
                {requirements.map((r) => (
                  <div key={r.label} className="sp-req-item">
                    <div className={`sp-req-dot${r.met ? " sp-req-met" : ""}`}>
                      {r.met ? <CheckCircle size={11} color="var(--ms-success)" /> : <X size={11} color="var(--ms-text-muted)" />}
                    </div>
                    <span className="sp-req-label" style={{ color: r.met ? "var(--ms-success)" : "var(--ms-text-soft)" }}>
                      {r.label}
                    </span>
                  </div>
                ))}
              </div>

              <button type="button" className="btn btn-sm sp-submit-btn" onClick={handleSubmit}
                disabled={saving || !newPass || !confirm}>
                {saving
                  ? <><RefreshCw size={13} className="animate-spin" /> Updating…</>
                  : <><Key size={13} /> Update Password</>
                }
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}