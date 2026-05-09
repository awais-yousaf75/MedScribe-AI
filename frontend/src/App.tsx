import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { HospitalAdminDashboard } from "./components/HospitalAdminDashboard";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { AssistantDashboard } from "./components/AssistantDashboard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

import LiveRecording from "./components/consultation/LiveRecording";
import TranscriptPage, {
  type TranscriptData,
} from "./components/consultation/TranscriptPage";
import AIExtraction from "./components/consultation/AIExtraction";
import MedicalNotesEditor from "./components/notes/MedicalNotesEditor";
import PrescriptionPreview from "./components/prescription/PrescriptionPreview";
import DoctorLayout from "./components/layout/DoctorLayout";
import ConsultationHistory from "./components/consultation/ConsultationHistory";

type UserRole =
  | "doctor"
  | "patient"
  | "doctor_assistant"
  | "hospital_admin"
  | "super_admin";

interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
}

interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  gender?: string;
  dob?: string;
  role: UserRole;
  approval_status: "pending" | "approved" | "rejected";
  [key: string]: any;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────────────────────────────────────────────────
   AWAITING APPROVAL SCREEN
───────────────────────────────────────────────────────────── */
function AwaitingApprovalScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="app-screen-root">
      <div className="app-screen-grain" />
      <div className="app-screen-vignette" />
      <div className="app-screen-card">
        <div className="app-icon-wrap app-icon-wrap-gold">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="app-screen-eyebrow">
          <span className="app-screen-eyebrow-line" />
          <span className="app-screen-eyebrow-text">Access Pending</span>
          <span className="app-screen-eyebrow-line" />
        </div>
        <h1 className="app-screen-heading">Account Under Review</h1>
        <p className="app-screen-sub">
          Your account is pending administrator approval. You will receive
          access once your credentials have been verified.
        </p>
        <div className="app-btn-row">
          <button className="app-btn-danger" onClick={onLogout}>
            Sign out
          </button>
        </div>
        <div className="app-screen-footer">
          <span className="app-footer-line" />
          <span className="app-footer-dot" />
          <span className="app-footer-line" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COMING SOON SCREEN
───────────────────────────────────────────────────────────── */
function ComingSoon({
  title,
  description,
  onBack,
  onLogout,
  insideLayout = false,
}: {
  title: string;
  description?: string;
  onBack: () => void;
  onLogout: () => void;
  insideLayout?: boolean;
}) {
  if (insideLayout) {
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

  return (
    <div className="app-screen-root">
      <div className="app-screen-grain" />
      <div className="app-screen-vignette" />
      <div className="app-screen-card">
        <div className="app-icon-wrap app-icon-wrap-teal">
          <svg
            width="22"
            height="22"
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
        <div className="app-screen-eyebrow">
          <span className="app-screen-eyebrow-line" />
          <span className="app-screen-eyebrow-text">In Development</span>
          <span className="app-screen-eyebrow-line" />
        </div>
        <h1 className="app-screen-heading">{title}</h1>
        <p className="app-screen-sub">
          {description ||
            "This section is being built and will be available soon."}
        </p>
        <div className="app-btn-row app-btn-row--horizontal">
          <button className="app-btn-ghost" onClick={onBack}>
            Go back
          </button>
          <button className="app-btn-danger" onClick={onLogout}>
            Sign out
          </button>
        </div>
        <div className="app-screen-footer">
          <span className="app-footer-line" />
          <span className="app-footer-dot" />
          <span className="app-footer-line" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────────────────────── */
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [currentPatient, setCurrentPatient] = useState<string>("");
  const [currentPatientId, setCurrentPatientId] = useState<string>("");
  const [recordingData, setRecordingData] = useState<any>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  // Stores the full prescription object from pipeline OR from
  // PrescriptionPreview's own generation — never the full pipeline result
  const [prescriptionData, setPrescriptionData] = useState<any>(null);

  const getDisplayName = (
    user: SupabaseUser | null,
    profile: Profile | null
  ) =>
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User";

  const getDefaultRoute = (role: UserRole | null) => {
    switch (role) {
      case "super_admin": return "/super-admin";
      case "hospital_admin": return "/hospital-admin";
      case "doctor": return "/doctor/dashboard";
      case "doctor_assistant": return "/assistant";
      case "patient": return "/patient";
      default: return "/login";
    }
  };

  const loadCurrentUser = async (showWelcome = false) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentProfile(null);
      setCurrentRole(null);
      setIsCheckingAuth(false);
      if (location.pathname !== '/register') {
        navigate('/login');
      }
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to fetch current user");

      const user = data.user as SupabaseUser;
      const profile = data.profile as Profile;
      const role = profile.role;

      setCurrentUser(user);
      setCurrentProfile(profile);
      setCurrentRole(role);
      setIsAuthenticated(true);

      if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
        navigate(getDefaultRoute(role));
      }

      if (showWelcome) {
        toast.success(`Welcome back, ${getDisplayName(user, profile)}!`);
      }
    } catch (err: any) {
      console.error(err);
      localStorage.removeItem("accessToken");
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentProfile(null);
      setCurrentRole(null);
      navigate("/login");
      if (showWelcome) toast.error(err.message || "Authentication failed");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    loadCurrentUser(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = () => loadCurrentUser(true);

  const handleRegister = () => {
    toast.success("Account created successfully! Please sign in.");
    navigate("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentProfile(null);
    setCurrentRole(null);
    setCurrentPatient("");
    setCurrentPatientId("");
    setRecordingData(null);
    setTranscriptData(null);
    setExtractedData(null);
    setPrescriptionData(null);
    navigate("/login");
    toast.info("You have been logged out");
  };



  const handleStartConsultation = (patient: {
    profile_id: string;
    full_name: string;
  }) => {
    setTranscriptData(null);
    setRecordingData(null);
    setExtractedData(null);
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
      const extracted = result.extracted_data ?? null;
      const prescription = result.prescription ?? null;

      setExtractedData(extracted);
      setPrescriptionData(prescription);

      setTimeout(() => {
        navigate("/doctor/prescription");
      }, 0);
    },
    [navigate]
  );

  /* ── LOADING ──────────────────────────────────────── */
  if (isCheckingAuth) {
    return (
      <>
        <div className="app-screen-root">
          <div className="app-screen-grain" />
          <div className="app-screen-vignette" />
          <div className="app-loading-center">
            <div className="app-loading-ring" />
            <p className="app-loading-text">MedScribe AI</p>
          </div>
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  /* ── ROUTES ───────────────────────────────────────── */
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />

        {/* SUPER ADMIN */}
        <Route path="/super-admin/*" element={
          isAuthenticated && currentRole === "super_admin" ? (
            <SuperAdminDashboard onLogout={handleLogout} />
          ) : <Navigate to="/login" />
        } />

        {/* HOSPITAL ADMIN */}
        <Route path="/hospital-admin/*" element={
          isAuthenticated && currentRole === "hospital_admin" ? (
            currentProfile?.approval_status !== "approved" ? (
              <AwaitingApprovalScreen onLogout={handleLogout} />
            ) : (
              <HospitalAdminDashboard onLogout={handleLogout} />
            )
          ) : <Navigate to="/login" />
        } />

        {/* ASSISTANT */}
        <Route path="/assistant/*" element={
          isAuthenticated && currentRole === "doctor_assistant" ? (
            currentProfile?.approval_status !== "approved" ? (
              <AwaitingApprovalScreen onLogout={handleLogout} />
            ) : (
              <AssistantDashboard onLogout={handleLogout} />
            )
          ) : <Navigate to="/login" />
        } />

        {/* DOCTOR */}
        <Route path="/doctor/*" element={
          isAuthenticated && currentRole === "doctor" ? (
            currentProfile?.approval_status !== "approved" ? (
              <AwaitingApprovalScreen onLogout={handleLogout} />
            ) : (
              <DoctorLayout
                activePage={location.pathname.split("/").pop() || "dashboard"}
                onLogout={handleLogout}
                doctorName={getDisplayName(currentUser, currentProfile)}
                doctorEmail={currentUser?.email || ""}
              >
                <Routes>
                  <Route path="dashboard" element={<DoctorDashboard onLogout={handleLogout} onStartConsultation={handleStartConsultation} />} />
                  <Route path="recording" element={<LiveRecording patientProfileId={currentPatientId} patientName={currentPatient} onComplete={handleRecordingComplete} onLogout={handleLogout} />} />
                  <Route path="transcript" element={<TranscriptPage data={transcriptData} onLogout={handleLogout} onPipelineComplete={handlePipelineComplete} />} />
                  <Route path="extraction" element={<AIExtraction patientName={currentPatient} recordingData={recordingData} onLogout={handleLogout} onExtractionComplete={(data: any) => { setExtractedData(data); setPrescriptionData(null); }} />} />
                  <Route path="notes" element={<MedicalNotesEditor patientName={currentPatient} recordingData={recordingData} extractedData={extractedData} onLogout={handleLogout} />} />
                  <Route path="prescription" element={<PrescriptionPreview patientName={currentPatient} recordingData={recordingData} extractedData={extractedData} pregeneratedData={prescriptionData} patientInfo={{ full_name: currentPatient }} onLogout={handleLogout} />} />
                  <Route path="history" element={<ConsultationHistory onLogout={handleLogout} />} />
                  <Route path="settings" element={<ComingSoon insideLayout title="Settings" description="Account and application settings are coming soon." onBack={() => navigate("/doctor/dashboard")} onLogout={handleLogout} />} />
                  <Route path="patients" element={<ComingSoon insideLayout title="Patients" description="Your patient list and management tools are coming soon." onBack={() => navigate("/doctor/dashboard")} onLogout={handleLogout} />} />
                  <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
                </Routes>
              </DoctorLayout>
            )
          ) : <Navigate to="/login" />
        } />

        {/* PATIENT */}
        <Route path="/patient/*" element={
          isAuthenticated && currentRole === "patient" ? (
            <div className="app-screen-root">
              <div className="app-screen-grain" />
              <div className="app-screen-vignette" />
              <div className="app-screen-card">
                <div className="app-icon-wrap app-icon-wrap-navy">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A7C6D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="app-screen-eyebrow">
                  <span className="app-screen-eyebrow-line" />
                  <span className="app-screen-eyebrow-text">Patient Portal</span>
                  <span className="app-screen-eyebrow-line" />
                </div>
                <h1 className="app-screen-heading">
                  {getDisplayName(currentUser, currentProfile)}
                </h1>
                <p className="app-screen-sub">
                  The patient portal is currently under development. You will be notified when it becomes available.
                </p>
                <div className="app-btn-row">
                  <button className="app-btn-danger" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
                <div className="app-screen-footer">
                  <span className="app-footer-line" />
                  <span className="app-footer-dot" />
                  <span className="app-footer-line" />
                </div>
              </div>
            </div>
          ) : <Navigate to="/login" />
        } />

        {/* FALLBACK ROOT REDIRECT */}
        <Route path="/" element={<Navigate to={isAuthenticated ? getDefaultRoute(currentRole) : "/login"} />} />
        
        {/* CATCH ALL (404-like) */}
        <Route path="*" element={
          isAuthenticated ? (
            <div className="app-screen-root">
              <div className="app-screen-grain" />
              <div className="app-screen-vignette" />
              <div className="app-screen-card">
                <div className="app-icon-wrap app-icon-wrap-teal">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="app-screen-eyebrow">
                  <span className="app-screen-eyebrow-line" />
                  <span className="app-screen-eyebrow-text">MedScribe AI</span>
                  <span className="app-screen-eyebrow-line" />
                </div>
                <h1 className="app-screen-heading">Page Not Found</h1>
                <p className="app-screen-sub">
                  The page you are looking for does not exist or you do not have permission to view it.
                </p>
                <div className="app-btn-row">
                  <button className="app-btn-danger" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
                <div className="app-screen-footer">
                  <span className="app-footer-line" />
                  <span className="app-footer-dot" />
                  <span className="app-footer-line" />
                </div>
              </div>
            </div>
          ) : <Navigate to="/login" />
        } />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}