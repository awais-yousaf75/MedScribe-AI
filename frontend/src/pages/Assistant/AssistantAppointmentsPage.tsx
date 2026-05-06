import { useState } from "react";
import {
  CheckCircle, XCircle, Clock,
  Calendar, RefreshCw, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import type { AppointmentFromAPI } from "../../components/AssistantDashboard";
import { API_URL, getToken } from "../../components/AssistantDashboard";

type ApptFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";

interface Props {
  appointments:          AppointmentFromAPI[];
  loadingAppointments:   boolean;
  pendingCount:          number;
  onRefreshAppointments: () => void;
  onAppointmentsChange:  React.Dispatch<React.SetStateAction<AppointmentFromAPI[]>>;
}

// ── Helpers ───────────────────────────────────────────────────

const formatDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatTime = (t: string) => {
  try {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour   = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  } catch { return t; }
};

const getStatusBadge = (status?: string | null) => {
  if (!status) return <span className="list-item-sub">—</span>;
  const map: Record<string, { cls: string; icon: typeof CheckCircle }> = {
    approved:  { cls: "badge badge-success", icon: CheckCircle },
    pending:   { cls: "badge badge-warning", icon: Clock       },
    rejected:  { cls: "badge badge-error",   icon: XCircle     },
    completed: { cls: "badge badge-info",    icon: CheckCircle },
    cancelled: { cls: "badge badge-neutral", icon: XCircle     },
  };
  const { cls, icon: Icon } = map[status] || map.pending;
  return (
    <span className={cls}>
      <Icon size={11} /> {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function AssistantAppointmentsPage({
  appointments,
  loadingAppointments,
  pendingCount,
  onRefreshAppointments,
  onAppointmentsChange,
}: Props) {

  const [apptFilter, setApptFilter] = useState<ApptFilter>("pending");
  const [handlingId, setHandlingId] = useState<string | null>(null);

  const handleAppointment = async (appointmentId: string, action: "approved" | "rejected") => {
    const token = getToken(); if (!token) return;
    try {
      setHandlingId(appointmentId);
      const res  = await fetch(`${API_URL}/api/appointments/${appointmentId}/handle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to handle appointment");
      toast.success(`Appointment ${action} successfully`);
      onAppointmentsChange((prev) =>
        prev.map((a) => a.id === appointmentId ? { ...a, status: action } : a)
      );
    } catch (err: any) { toast.error(err.message || "Failed to handle appointment"); }
    finally { setHandlingId(null); }
  };

  const filtered = apptFilter === "all"
    ? appointments
    : appointments.filter((a) => a.status === apptFilter);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="icon-wrap icon-wrap-md icon-wrap-teal">
            <Calendar size={18} color="#fff" />
          </div>
          <div>
            <div className="card-title">Appointments</div>
            <div className="card-subtitle">
              {appointments.length} total · {pendingCount} pending
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onRefreshAppointments}
          disabled={loadingAppointments}
        >
          <RefreshCw size={14} className={loadingAppointments ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="ap-filter-tabs" style={{ marginBottom: 20 }}>
        {(["all", "pending", "approved", "rejected", "cancelled"] as ApptFilter[]).map((f) => {
          const count = f === "all"
            ? appointments.length
            : appointments.filter((a) => a.status === f).length;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setApptFilter(f)}
              className={`ap-filter-tab${apptFilter === f ? " ap-filter-tab-active" : ""}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {count > 0 && (
                <span className="tab-badge" style={{ marginLeft: 4 }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loadingAppointments ? (
        <div className="loading-text">Loading appointments…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={36} className="empty-icon" />
          <div className="empty-title">
            No {apptFilter === "all" ? "" : apptFilter} appointments found
          </div>
        </div>
      ) : (
        <div className="appt-list">
          {filtered.map((appt) => {
            const patientName = appt.patient_profiles?.profiles?.full_name || "Unknown";
            const patientCnic = appt.patient_profiles?.cnic                || "—";
            const doctorName  = appt.doctor_profiles?.profiles?.full_name  || "Unknown";
            const isPending   = appt.status === "pending";
            const isHandling  = handlingId  === appt.id;

            return (
              <div key={appt.id} className={`appt-item${isPending ? " ad-appt-pending" : ""}`}>
                <div className="appt-main">
                  <div style={{ flex: 1, minWidth: 0 }}>

                    <div className="appt-patient-meta" style={{ marginBottom: 12 }}>
                      {getStatusBadge(appt.status)}
                      <span className="appt-meta-item">
                        Booked {formatDate(appt.created_at)}
                      </span>
                    </div>

                    <div className="ad-appt-grid">
                      {[
                        { label: "Patient",  value: patientName              },
                        { label: "CNIC",     value: patientCnic, mono: true  },
                        { label: "Doctor",   value: `Dr. ${doctorName}`      },
                        { label: "Hospital", value: appt.hospitals?.name || "—" },
                        { label: "Date",     value: formatDate(appt.appointment_date) },
                        { label: "Time",     value: formatTime(appt.appointment_time) },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="info-label">{item.label}</div>
                          <div
                            className="list-item-title"
                            style={{
                              fontSize: "var(--ms-text-sm)",
                              fontFamily: item.mono ? "var(--ms-font-mono)" : undefined,
                            }}
                          >
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {appt.notes && (
                      <div className="appt-notes" style={{ marginTop: 12 }}>
                        <strong>Notes: </strong>{appt.notes}
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="ad-appt-actions">
                      <button
                        type="button"
                        className="btn btn-sm ap-btn-success"
                        onClick={() => handleAppointment(appt.id, "approved")}
                        disabled={isHandling}
                      >
                        <ThumbsUp size={13} />
                        {isHandling ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm um-delete-btn"
                        onClick={() => handleAppointment(appt.id, "rejected")}
                        disabled={isHandling}
                      >
                        <ThumbsDown size={13} />
                        {isHandling ? "…" : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}