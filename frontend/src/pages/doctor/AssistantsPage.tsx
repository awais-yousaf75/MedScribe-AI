// src/pages/doctor/AssistantsPage.tsx
import { RefreshCw, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { API_URL, getToken } from "@/lib/constants";
import type { Assistant } from "@/types";
import { AvatarDisplay } from "@/components/common/AvatarUpload"; // ✅ AVATAR

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
  assistants:          Assistant[];
  loadingAssistants:   boolean;
  onRefreshAssistants: () => void;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function AssistantsPage({
  assistants,
  loadingAssistants,
  onRefreshAssistants,
}: Props) {
  const [assistantForm, setAssistantForm] = useState({
    fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [creatingAssistant, setCreatingAssistant] = useState(false);

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    if (!assistantForm.fullName.trim() || !/^[a-zA-Z\s.\-']+$/.test(assistantForm.fullName.trim())) {
      toast.error("Full name must contain only letters, spaces, hyphens, or apostrophes"); return;
    }
    if (!assistantForm.email.trim() || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(assistantForm.email.trim())) {
      toast.error("Please enter a valid email address"); return;
    }
    if (assistantForm.phone && !/^[\+]?[\d\s\-\(\)]{7,15}$/.test(assistantForm.phone.trim())) {
      toast.error("Invalid phone number format"); return;
    }
    if (assistantForm.password.length < 8) {
      toast.error("Password must be at least 8 characters"); return;
    }
    if (assistantForm.password !== assistantForm.confirmPassword) {
      toast.error("Passwords do not match"); return;
    }
    try {
      setCreatingAssistant(true);
      const res = await fetch(`${API_URL}/api/doctor/assistants`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: assistantForm.fullName,
          email:    assistantForm.email,
          phone:    assistantForm.phone,
          password: assistantForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create assistant");
      toast.success("Assistant created and pending approval");
      setAssistantForm({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
      onRefreshAssistants();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingAssistant(false);
    }
  };

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-navy">
              <UserPlus size={18} color="var(--ms-teal)" />
            </div>
            <div>
              <div className="page-header-title">My Assistants</div>
              <div className="page-header-sub">
                {assistants.length} assistant{assistants.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-navy">
                <UserPlus size={18} color="var(--ms-teal)" />
              </div>
              <div>
                <div className="card-title">My Assistants</div>
                <div className="card-subtitle">
                  {assistants.length} assistant{assistants.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-icon"
              onClick={onRefreshAssistants}
              disabled={loadingAssistants}
            >
              <RefreshCw size={14} className={loadingAssistants ? "ms-spinner" : ""} />
            </button>
          </div>

          {loadingAssistants ? (
            <div className="loading-text">Loading assistants…</div>
          ) : assistants.length === 0 ? (
            <div className="loading-text">No assistants yet.</div>
          ) : (
            <div className="list-grid-2" style={{ marginBottom: 24 }}>
              {assistants.map((a) => (
                <div key={a.profile_id} className="list-item">
                  {/* ✅ AVATAR — added avatar before name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <AvatarDisplay
                      url={(a as any).avatar_url}
                      name={a.full_name}
                      size={36}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div className="list-item-title">{a.full_name}</div>
                      <div className="list-item-sub">{a.phone || "No phone"}</div>
                    </div>
                  </div>
                  {getStatusBadge(a.approval_status)}
                </div>
              ))}
            </div>
          )}

          <hr className="divider" />
          <div className="form-section-title">Add New Assistant</div>

          <form onSubmit={handleCreateAssistant}>
            <div className="form-grid-2" style={{ marginBottom: 20 }}>
              <div className="field">
                <label className="field-label">Full Name *</label>
                <input
                  className="field-input"
                  placeholder="Full name"
                  value={assistantForm.fullName}
                  onChange={(e) => setAssistantForm((p) => ({ ...p, fullName: e.target.value.replace(/[^a-zA-Z\s.\-']/g, "") }))}
                  required
                  disabled={creatingAssistant}
                />
              </div>
              <div className="field">
                <label className="field-label">Email *</label>
                <input
                  type="email"
                  className="field-input"
                  placeholder="Email address"
                  value={assistantForm.email}
                  onChange={(e) => setAssistantForm((p) => ({ ...p, email: e.target.value }))}
                  required
                  disabled={creatingAssistant}
                />
              </div>
              <div className="field">
                <label className="field-label">Phone</label>
                <input
                  className="field-input"
                  placeholder="Phone number"
                  value={assistantForm.phone}
                  onChange={(e) => setAssistantForm((p) => ({ ...p, phone: e.target.value.replace(/[^0-9+\s()\-]/g, "") }))}
                  disabled={creatingAssistant}
                />
              </div>
              <div className="field">
                <label className="field-label">Password *</label>
                <input
                  type="password"
                  className="field-input"
                  placeholder="Password"
                  value={assistantForm.password}
                  onChange={(e) => setAssistantForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  disabled={creatingAssistant}
                />
              </div>
              <div className="field form-full">
                <label className="field-label">Confirm Password *</label>
                <input
                  type="password"
                  className="field-input"
                  placeholder="Confirm password"
                  value={assistantForm.confirmPassword}
                  onChange={(e) => setAssistantForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  disabled={creatingAssistant}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={creatingAssistant}
            >
              <UserPlus size={16} />
              {creatingAssistant ? "Creating…" : "Create Assistant"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}