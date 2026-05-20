// src/pages/assistant/AssistantDashboard.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { UserCog } from "lucide-react";
import { toast } from "sonner";
import AssistantSidebar from "@/components/layout/AssistantSidebar";
import { MyProfilePage } from "@/pages/assistant/MyProfilePage";
import AssistantChangePasswordPage from "@/pages/assistant/ChangePasswordPage";
import { SearchPatientPage } from "@/pages/assistant/SearchPatientPage";
import { RegisterPatientPage } from "@/pages/assistant/RegisterPatientPage";
import { HospitalPatientsPage } from "@/pages/assistant/HospitalPatientsPage";
import { AssistantAppointmentsPage } from "@/pages/assistant/AssistantAppointmentsPage";
import { API_URL, getToken } from "@/lib/constants";
import type { AssistantMeResponse, Patient, AppointmentFromAPI } from "@/types";

interface AssistantDashboardProps {
  onLogout: () => void;
}

export function AssistantDashboard({ onLogout }: AssistantDashboardProps) {
  const location = useLocation();
  const activePage = location.pathname.split("/").pop() || "search-patient";

  const [assistantInfo, setAssistantInfo] =
    useState<AssistantMeResponse | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<AppointmentFromAPI[]>([]);

  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // ── Fetches ───────────────────────────────────────────────

  const fetchAssistantInfo = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/assistant/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setAssistantInfo(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load assistant info");
    }
  };

  const fetchPatients = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingPatients(true);
      const res = await fetch(`${API_URL}/api/assistant/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients(data.patients || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchAppointments = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingAppointments(true);
      const res = await fetch(`${API_URL}/api/appointments/assistant/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to load appointments");
      setAppointments(data.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load appointments");
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchAssistantInfo();
    fetchPatients();
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ───────────────────────────────────────────────

  const assistantName = assistantInfo?.profile.full_name || "Assistant";
  const avatarUrl = (assistantInfo?.profile as any)?.avatar_url || null;
  const pendingCount = appointments.filter(
    (a) => a.status === "pending",
  ).length;

  // ── Page titles ───────────────────────────────────────────

  const pageMeta: Record<string, { title: string; sub: string }> = {
    "my-profile": {
      title: "My Profile",
      sub: "Your profile and assigned doctor",
    },
    "change-password": {
      title: "Change Password",
      sub: "Update your account security",
    },
    "search-patient": {
      title: "Search Patient",
      sub: "Find and verify patient by CNIC",
    },
    "register-patient": {
      title: "Register New Patient",
      sub: "Add a new patient to the system",
    },
    "hospital-patients": {
      title: "Hospital Patients",
      sub: "All patients registered at your hospital",
    },
    appointments: {
      title: "Appointments",
      sub: "Manage and handle appointment requests",
    },
  };

  const meta = pageMeta[activePage] || pageMeta["search-patient"];

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className="page-root">
      <AssistantSidebar
        onLogout={onLogout}
        userRole="doctor_assistant"
        userName={assistantName}
        userSubtitle="Doctor Assistant"
        pendingCount={pendingCount}
        avatarUrl={avatarUrl}
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
                <div className="page-header-title">{meta.title}</div>
                <div className="page-header-sub">
                  {assistantName} · {meta.sub}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="page-content">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/assistant/my-profile" replace />}
            />
            <Route
              path="my-profile"
              element={<MyProfilePage assistantInfo={assistantInfo} />}
            />
            <Route
              path="change-password"
              element={<AssistantChangePasswordPage />}
            />
            <Route
              path="search-patient"
              element={<SearchPatientPage onRefreshPatients={fetchPatients} />}
            />
            <Route
              path="register-patient"
              element={
                <RegisterPatientPage onRefreshPatients={fetchPatients} />
              }
            />
            <Route
              path="hospital-patients"
              element={
                <HospitalPatientsPage
                  patients={patients}
                  loadingPatients={loadingPatients}
                  onRefreshPatients={fetchPatients}
                />
              }
            />
            <Route
              path="appointments"
              element={
                <AssistantAppointmentsPage
                  appointments={appointments}
                  loadingAppointments={loadingAppointments}
                  pendingCount={pendingCount}
                  onRefreshAppointments={fetchAppointments}
                  onAppointmentsChange={setAppointments}
                />
              }
            />
            <Route
              path="*"
              element={<Navigate to="/assistant/my-profile" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default AssistantDashboard;