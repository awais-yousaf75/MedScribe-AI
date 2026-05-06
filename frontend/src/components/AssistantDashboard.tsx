import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { toast } from "sonner";
import AssistantSidebar from "../components/layout/AssistantSidebar";
import { AssistantProfileCard }    from "../pages/Assistant/AssistantProfileCard";
import { SearchPatientPage }       from "../pages/Assistant/SearchPatientPage";
import { RegisterPatientPage }     from "../pages/Assistant/RegisterPatientPage";
import { HospitalPatientsPage }    from "../pages/Assistant/HospitalPatientsPage";
import { AssistantAppointmentsPage } from "../pages/Assistant/AssistantAppointmentsPage";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type AssistantMeResponse = {
  user: { id: string; email: string };
  profile: {
    id: string; full_name: string; phone?: string;
    role: string; approval_status: "pending" | "approved" | "rejected";
  };
  assistant_link: {
    doctor_profile_id: string; hospital_id: string;
    approval_status: "pending" | "approved" | "rejected";
  } | null;
  doctor:   { id: string; full_name: string; phone?: string } | null;
  hospital: { id: string; name: string; address: string | null; hospital_type: string | null; status: string } | null;
};

export type Patient = {
  id: string; full_name: string; phone?: string | null;
  gender?: string | null; dob?: string | null;
  cnic: string; created_at: string;
};

export type ExistingPatientSearchResult = {
  found: boolean;
  patient?: { id: string; full_name: string; phone?: string | null; gender?: string | null; dob?: string | null; cnic: string };
  hospitals?: { id: string; name: string }[];
};

export type AppointmentFromAPI = {
  id: string; appointment_date: string; appointment_time: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  notes: string | null; created_at: string;
  patient_profiles: { profile_id: string; cnic: string; profiles: { full_name: string; phone: string | null; gender: string | null; dob: string | null } };
  doctor_profiles:  { profile_id: string; specialization: string; profiles: { full_name: string } };
  hospitals: { id: string; name: string };
};

export type AssistantPage =
  | "assistant-search-patient"
  | "assistant-register-patient"
  | "assistant-hospital-patients"
  | "assistant-appointments";

interface AssistantDashboardProps {
  onNavigate: (page: string) => void;
  onLogout:   () => void;
}

export const API_URL  = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const getToken = () => localStorage.getItem("accessToken");

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function AssistantDashboard({ onNavigate, onLogout }: AssistantDashboardProps) {

  const [activePage, setActivePage] = useState<AssistantPage>("assistant-search-patient");

  const [assistantInfo, setAssistantInfo] = useState<AssistantMeResponse | null>(null);
  const [patients,      setPatients]      = useState<Patient[]>([]);
  const [appointments,  setAppointments]  = useState<AppointmentFromAPI[]>([]);

  const [loading,             setLoading]             = useState(false);
  const [loadingPatients,     setLoadingPatients]     = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // ── Fetches ───────────────────────────────────────────────

  const fetchAssistantInfo = async () => {
    const token = getToken(); if (!token) return;
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/assistant/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setAssistantInfo(data);
    } catch (err: any) { toast.error(err.message || "Failed to load assistant info"); }
    finally { setLoading(false); }
  };

  const fetchPatients = async () => {
    const token = getToken(); if (!token) return;
    try {
      setLoadingPatients(true);
      const res  = await fetch(`${API_URL}/api/assistant/patients`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients(data.patients || []);
    } catch (err: any) { toast.error(err.message || "Failed to load patients"); }
    finally { setLoadingPatients(false); }
  };

  const fetchAppointments = async () => {
    const token = getToken(); if (!token) return;
    try {
      setLoadingAppointments(true);
      const res  = await fetch(`${API_URL}/api/appointments/assistant/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load appointments");
      setAppointments(data.data || []);
    } catch (err: any) { toast.error(err.message || "Failed to load appointments"); }
    finally { setLoadingAppointments(false); }
  };

  useEffect(() => {
    fetchAssistantInfo();
    fetchPatients();
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ───────────────────────────────────────────────

  const assistantName = assistantInfo?.profile.full_name || "Assistant";
  const pendingCount  = appointments.filter((a) => a.status === "pending").length;

  // ── Page titles ───────────────────────────────────────────

  const pageMeta: Record<AssistantPage, { title: string; sub: string }> = {
    "assistant-search-patient":   { title: "Search Patient",       sub: "Find and verify patient by CNIC"          },
    "assistant-register-patient": { title: "Register New Patient",  sub: "Add a new patient to the system"          },
    "assistant-hospital-patients":{ title: "Hospital Patients",     sub: "All patients registered at your hospital" },
    "assistant-appointments":     { title: "Appointments",          sub: "Manage and handle appointment requests"   },
  };

  const { title, sub } = pageMeta[activePage];

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className="page-root">
      <AssistantSidebar
        currentPage={activePage}
        onNavigate={(page) => setActivePage(page as AssistantPage)}
        onLogout={onLogout}
        userRole="doctor_assistant"
        userName={assistantName}
        userSubtitle="Doctor Assistant"
        pendingCount={pendingCount}
      />

      <div className="page-main">

        {/* ── HEADER ── */}
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <UserCog size={18} color="#fff" />
              </div>
              <div>
                <div className="page-header-title">{title}</div>
                <div className="page-header-sub">
                  {assistantName} · {sub}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="page-content">

          {/* Profile card always visible at top */}
          <AssistantProfileCard assistantInfo={assistantInfo} />

          {activePage === "assistant-search-patient" && (
            <SearchPatientPage
              onRefreshPatients={fetchPatients}
            />
          )}

          {activePage === "assistant-register-patient" && (
            <RegisterPatientPage
              onRefreshPatients={fetchPatients}
            />
          )}

          {activePage === "assistant-hospital-patients" && (
            <HospitalPatientsPage
              patients={patients}
              loadingPatients={loadingPatients}
              onRefreshPatients={fetchPatients}
            />
          )}

          {activePage === "assistant-appointments" && (
            <AssistantAppointmentsPage
              appointments={appointments}
              loadingAppointments={loadingAppointments}
              pendingCount={pendingCount}
              onRefreshAppointments={fetchAppointments}
              onAppointmentsChange={setAppointments}
            />
          )}
        </div>
      </div>
    </div>
  );
}