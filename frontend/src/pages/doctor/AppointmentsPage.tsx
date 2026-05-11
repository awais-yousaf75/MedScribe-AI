// src/pages/doctor/AppointmentsPage.tsx
import {
  Building2, Calendar, CalendarDays,
  CheckCircle, Clock, RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_URL, getToken } from "@/lib/constants";

// ── Helpers ───────────────────────────────────────────────────

const formatAppointmentDate = (v: string) => {
  try {
    return new Date(v).toLocaleDateString(undefined, {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
    });
  } catch { return v; }
};

const formatAppointmentTime = (t: string) => {
  try {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour   = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  } catch { return t; }
};

// ── Props ─────────────────────────────────────────────────────

interface Props {
  onStartConsultation: (patient: { profile_id: string; full_name: string }) => void;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function AppointmentsPage({ onStartConsultation }: Props) {
  const [approvedAppointments, setApprovedAppointments] = useState<any[]>([]);
  const [loadingAppointments,  setLoadingAppointments]  = useState(false);

  const fetchApprovedAppointments = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingAppointments(true);
      const res  = await fetch(`${API_URL}/api/appointments/doctor/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load appointments");
      setApprovedAppointments(data.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchApprovedAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Calendar size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Appointments</div>
              <div className="page-header-sub">
                {approvedAppointments.length} approved appointment
                {approvedAppointments.length !== 1 ? "s" : ""}
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
                <Calendar size={18} color="#fff" />
              </div>
              <div>
                <div className="card-title">Approved Appointments</div>
                <div className="card-subtitle">
                  {approvedAppointments.length} appointment
                  {approvedAppointments.length !== 1 ? "s" : ""} waiting
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-icon"
              onClick={fetchApprovedAppointments}
              disabled={loadingAppointments}
            >
              <RefreshCw size={14} className={loadingAppointments ? "animate-spin" : ""} />
            </button>
          </div>

          {loadingAppointments ? (
            <div className="loading-text">Loading appointments…</div>
          ) : approvedAppointments.length === 0 ? (
            <div className="empty-state">
              <Calendar size={36} className="empty-icon" />
              <div className="empty-title">No approved appointments</div>
              <div className="empty-sub">
                Appointments will appear here after your assistant approves them.
              </div>
            </div>
          ) : (
            <div className="appt-list">
              {approvedAppointments.map((appt: any) => {
                const patientProfiles = appt.patient_profiles || {};
                const patientInfo     = patientProfiles.profiles || {};
                const hospitalInfo    = appt.hospitals || {};

                return (
                  <div key={appt.id} className="appt-item">
                    <div className="appt-main">
                      <div className="appt-patient-wrap">
                        <div className="appt-avatar">
                          {patientInfo.full_name?.charAt(0)?.toUpperCase() || "P"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="appt-patient-name">
                            {patientInfo.full_name || "Unknown Patient"}
                          </div>
                          <div className="appt-patient-meta">
                            {patientInfo.phone && (
                              <span className="appt-meta-item">📞 {patientInfo.phone}</span>
                            )}
                            {patientInfo.gender && (
                              <span className="appt-meta-item" style={{ textTransform: "capitalize" }}>
                                {patientInfo.gender}
                              </span>
                            )}
                            {patientProfiles.cnic && (
                              <span className="appt-meta-item">CNIC: {patientProfiles.cnic}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="appt-details">
                        <div className="appt-chip">
                          <CalendarDays size={13} color="var(--ms-teal)" />
                          {formatAppointmentDate(appt.appointment_date)}
                        </div>
                        <div className="appt-chip">
                          <Clock size={13} color="var(--ms-teal)" />
                          {formatAppointmentTime(appt.appointment_time)}
                        </div>
                        <div className="appt-chip">
                          <Building2 size={13} color="var(--ms-teal)" />
                          {hospitalInfo.name || "—"}
                        </div>
                        <span className="badge badge-success">
                          <CheckCircle size={11} /> Approved
                        </span>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            onStartConsultation({
                              profile_id: patientProfiles.profile_id,
                              full_name:  patientInfo.full_name || "Unknown",
                            })
                          }
                        >
                          Start Consultation
                        </button>
                      </div>
                    </div>

                    {appt.notes && (
                      <div className="appt-notes">
                        <strong>Notes: </strong>{appt.notes}
                      </div>
                    )}
                    {patientProfiles.medical_history && (
                      <div className="appt-history">
                        <strong>Medical History: </strong>{patientProfiles.medical_history}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}