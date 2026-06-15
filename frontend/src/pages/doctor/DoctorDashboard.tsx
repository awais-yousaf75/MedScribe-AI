// src/pages/doctor/DoctorDashboard.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "sonner";
import DoctorLayout from "@/components/layout/DoctorLayout";
import OverviewPage from "@/pages/doctor/OverviewPage";
import PatientsPage from "@/pages/doctor/PatientsPage";
import AvailabilityPage from "@/pages/doctor/AvailabilityPage";
import AppointmentsPage from "@/pages/doctor/AppointmentsPage";
import AssistantsPage from "@/pages/doctor/AssistantsPage";
import DoctorMyProfilePage from "@/pages/doctor/MyProfilePage";
import DoctorChangePasswordPage from "@/pages/doctor/ChangePasswordPage";
import LiveRecording from "@/components/consultation/LiveRecording";
import TranscriptPage, {
  type TranscriptData,
} from "@/components/consultation/TranscriptPage";
import AIExtraction from "@/components/consultation/AIExtraction";
import MedicalNotesEditor from "@/components/common/MedicalNotesEditor";
import PrescriptionPreview from "@/components/common/PrescriptionPreview";
import ConsultationHistory from "@/components/consultation/ConsultationHistory";
import { API_URL, getToken } from "@/lib/constants";
import type { Assistant, DoctorMeResponse, Patient } from "@/types";

// ── Coming Soon ───────────────────────────────────────────────

function ComingSoonInsideLayout({
  title,
  description,
  onBack,
  onLogout,
}: {
  title: string;
  description?: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="dl-page">
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div>
              <h1 className="page-header-title">{title}</h1>
              <p className="page-header-sub">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
      <div className="page-content">
        <div className="aix-state-card">
          <div className="aix-state-icon aix-state-icon-loading">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="aix-state-body">
            <h2 className="aix-state-title">{title}</h2>
            <p className="aix-state-sub">
              {description ||
                "This section is being built and will be available soon."}
            </p>
          </div>
          <div className="aix-state-actions">
            <button className="btn btn-secondary btn-md" onClick={onBack}>
              Go back
            </button>
            <button className="btn btn-danger btn-md" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface DoctorDashboardProps {
  onLogout: () => void;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function DoctorDashboard({ onLogout }: DoctorDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.split("/").pop() || "dashboard";

  const [doctorInfo, setDoctorInfo] = useState<DoctorMeResponse | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // ── Consultation pipeline state ───────────────────────────

  const [currentPatient, setCurrentPatient] = useState<string>("");
  const [currentPatientId, setCurrentPatientId] = useState<string>("");
  const [recordingData, setRecordingData] = useState<any>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(
    null,
  );
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractionEditedText, setExtractionEditedText] = useState<string>("");
  const [soapNotes, setSoapNotes] = useState<string>("");
  const [prescriptionData, setPrescriptionData] = useState<any>(null);

  // ── Fetches ───────────────────────────────────────────────

  const fetchDoctorInfo = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/doctor/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load doctor info");
      setDoctorInfo(data as DoctorMeResponse);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchAssistants = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingAssistants(true);
      const res = await fetch(`${API_URL}/api/doctor/assistants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assistants");
      setAssistants((data.assistants || []) as Assistant[]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingAssistants(false);
    }
  };

  const fetchPatients = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingPatients(true);
      const res = await fetch(`${API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients((data.patients || []) as Patient[]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchDoctorInfo();
    fetchAssistants();
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Consultation handlers ─────────────────────────────────

  const handleStartConsultation = (patient: {
    profile_id: string;
    full_name: string;
  }) => {
    setTranscriptData(null);
    setRecordingData(null);
    setExtractedData(null);
    setExtractionEditedText("");
    setSoapNotes("");
    setPrescriptionData(null);
    setCurrentPatient(patient.full_name);
    setCurrentPatientId(patient.profile_id);
    navigate("/doctor/recording");
  };

  const handleRecordingComplete = (data: any) => {
    setRecordingData(data);
    setTranscriptData(data as TranscriptData);
  };

  const handlePipelineComplete = useCallback(
    (result: any) => {
      setExtractedData(result.extracted_data ?? null);
      setPrescriptionData(result.prescription ?? null);
      setTimeout(() => navigate("/doctor/prescription"), 0);
    },
    [navigate],
  );

  // ── Derived ───────────────────────────────────────────────

  const doctorName =
    doctorInfo?.profile.full_name || doctorInfo?.user.email || "Doctor";
  const doctorEmail = doctorInfo?.user.email || "";
  const avatarUrl = (doctorInfo?.profile as any)?.avatar_url || null;

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <DoctorLayout
      activePage={activePage}
      onLogout={onLogout}
      doctorName={doctorName}
      doctorEmail={doctorEmail}
      avatarUrl={avatarUrl}
    >
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* ── Main pages ── */}
        <Route
          path="dashboard"
          element={<OverviewPage doctorInfo={doctorInfo} />}
        />
        <Route
          path="patients"
          element={
            <PatientsPage
              patients={patients}
              loadingPatients={loadingPatients}
              onRefresh={fetchPatients}
              onStartConsultation={handleStartConsultation}
            />
          }
        />
        <Route
          path="assistants"
          element={
            <AssistantsPage
              assistants={assistants}
              loadingAssistants={loadingAssistants}
              onRefreshAssistants={fetchAssistants}
            />
          }
        />
        <Route path="availability" element={<AvailabilityPage />} />
        <Route
          path="appointments"
          element={
            <AppointmentsPage onStartConsultation={handleStartConsultation} />
          }
        />

        {/* ── Consultation flow — sidebar stays visible ── */}
        <Route
          path="recording"
          element={
            <LiveRecording
              patientProfileId={currentPatientId}
              patientName={currentPatient}
              onComplete={handleRecordingComplete}
              onLogout={onLogout}
            />
          }
        />
        <Route
          path="transcript"
          element={
            <TranscriptPage
              data={transcriptData}
              onLogout={onLogout}
              onPipelineComplete={handlePipelineComplete}
            />
          }
        />
        <Route
          path="extraction"
          element={
            <AIExtraction
              patientName={currentPatient}
              recordingData={recordingData}
              onLogout={onLogout}
              onExtractionComplete={(data: any) => {
                setExtractedData(data);
                setPrescriptionData(null);
              }}
              onExtractionEdited={setExtractionEditedText}
            />
          }
        />
        <Route
          path="notes"
          element={
            <MedicalNotesEditor
              patientName={currentPatient}
              recordingData={recordingData}
              extractedData={extractedData}
              onLogout={onLogout}
              onNotesFinalized={setSoapNotes}
            />
          }
        />
        <Route
          path="prescription"
          element={
            <PrescriptionPreview
              patientName={currentPatient}
              recordingData={recordingData}
              extractedData={extractedData}
              pregeneratedData={prescriptionData}
              soapNotes={soapNotes}
              extractionEditedText={extractionEditedText}
              patientInfo={{ full_name: currentPatient }}
              onLogout={onLogout}
            />
          }
        />
        <Route
          path="history"
          element={<ConsultationHistory onLogout={onLogout} />}
        />

        {/* ── Profile & Security ── */}
        <Route path="my-profile"      element={<DoctorMyProfilePage />} />
        <Route path="change-password" element={<DoctorChangePasswordPage />} />

        {/* ── Old settings route — keep for backward compat ── */}
        <Route
          path="settings"
          element={
            <ComingSoonInsideLayout
              title="Settings"
              description="Use the My Profile and Change Password options in the sidebar."
              onBack={() => navigate("/doctor/my-profile")}
              onLogout={onLogout}
            />
          }
        />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DoctorLayout>
  );
}

export default DoctorDashboard;