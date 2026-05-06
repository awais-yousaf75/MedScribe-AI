import { useEffect, useState } from "react";
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

type Page =
  | "login"
  | "register"
  | "dashboard"
  | "doctor-dashboard"
  | "super-admin-dashboard"
  | "hospital-admin-dashboard"
  | "assistant-dashboard"
  | "recording"
  | "transcript"
  | "extraction"
  | "notes"
  | "prescription"
  | "history"
  | "settings"
  | "all-users"
  | "all-hospitals"
  | "pending-doctors"
  | "pending-assistants"
  | "patients";

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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          Your account is pending administrator approval.
          You will receive access once your credentials have been verified.
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
}: {
  title: string;
  description?: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="app-screen-root">
      <div className="app-screen-grain" />
      <div className="app-screen-vignette" />
      <div className="app-screen-card">
        <div className="app-icon-wrap app-icon-wrap-teal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          {description || "This section is being built and will be available soon."}
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
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [currentPatient, setCurrentPatient] = useState<string>("");
  const [currentPatientId, setCurrentPatientId] = useState<string>("");
  const [recordingData, setRecordingData] = useState<any>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);

  const getDisplayName = (
    user: SupabaseUser | null,
    profile: Profile | null
  ) =>
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User";

  const loadCurrentUser = async (showWelcome = false) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentProfile(null);
      setCurrentRole(null);
      setIsCheckingAuth(false);
      setCurrentPage("login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch current user");

      const user = data.user as SupabaseUser;
      const profile = data.profile as Profile;
      const role = profile.role;

      setCurrentUser(user);
      setCurrentProfile(profile);
      setCurrentRole(role);
      setIsAuthenticated(true);

      switch (role) {
        case "super_admin":      setCurrentPage("super-admin-dashboard"); break;
        case "hospital_admin":   setCurrentPage("hospital-admin-dashboard"); break;
        case "doctor":           setCurrentPage("doctor-dashboard"); break;
        case "doctor_assistant": setCurrentPage("assistant-dashboard"); break;
        default:                 setCurrentPage("dashboard");
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
      setCurrentPage("login");
      if (showWelcome) toast.error(err.message || "Authentication failed");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    loadCurrentUser(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin    = () => loadCurrentUser(true);

  const handleRegister = () => {
    toast.success("Account created successfully! Please sign in.");
    setCurrentPage("login");
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
    setCurrentPage("login");
    toast.info("You have been logged out");
  };

  const handleNavigate = (page: string) => {
    if (page === "recording" && currentPage !== "recording") {
      setCurrentPatient("");
      setCurrentPatientId("");
    }
    setCurrentPage(page as Page);
  };

  const handleStartConsultation = (patient: {
    profile_id: string;
    full_name: string;
  }) => {
    setTranscriptData(null);
    setRecordingData(null);
    setCurrentPatient(patient.full_name);
    setCurrentPatientId(patient.profile_id);
    setCurrentPage("recording");
  };

  const handleRecordingComplete = (data: any) => {
    setRecordingData(data);
    setTranscriptData(data as TranscriptData);
    setCurrentPage("transcript");
  };

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

  /* ── NOT AUTHENTICATED ────────────────────────────── */
  if (!isAuthenticated) {
    if (currentPage === "register") {
      return (
        <>
          <RegisterPage
            onRegister={handleRegister}
            onNavigateToLogin={() => setCurrentPage("login")}
          />
          <Toaster position="top-right" />
        </>
      );
    }
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onNavigateToRegister={() => setCurrentPage("register")}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  /* ── SUPER ADMIN ──────────────────────────────────── */
  if (currentRole === "super_admin") {
    return (
      <>
        <SuperAdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
        <Toaster position="top-right" />
      </>
    );
  }

  /* ── HOSPITAL ADMIN ───────────────────────────────── */
  if (currentRole === "hospital_admin") {
    if (currentProfile?.approval_status !== "approved") {
      return (
        <>
          <AwaitingApprovalScreen onLogout={handleLogout} />
          <Toaster position="top-right" />
        </>
      );
    }
    return (
      <>
        <HospitalAdminDashboard
          onLogout={handleLogout}
          onNavigate={(_page: string) => {
            throw new Error("Function not implemented.");
          }}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  /* ── DOCTOR ───────────────────────────────────────── */
  if (currentRole === "doctor") {
    if (currentProfile?.approval_status !== "approved") {
      return (
        <>
          <AwaitingApprovalScreen onLogout={handleLogout} />
          <Toaster position="top-right" />
        </>
      );
    }

    if (currentPage === "recording") {
      return (
        <>
          <LiveRecording
            patientProfileId={currentPatientId}
            patientName={currentPatient}
            onComplete={handleRecordingComplete}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
          <Toaster position="top-right" />
        </>
      );
    }

    if (currentPage === "transcript") {
      return (
        <>
          <TranscriptPage
            data={transcriptData}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
          <Toaster position="top-right" />
        </>
      );
    }

    if (
      currentPage === "extraction" ||
      currentPage === "notes" ||
      currentPage === "history" ||
      currentPage === "settings" ||
      currentPage === "prescription"
    ) {
      return (
        <>
          <ComingSoon
            title="Coming soon"
            description="This section is being built. The transcript flow is fully operational."
            onBack={() => setCurrentPage("doctor-dashboard")}
            onLogout={handleLogout}
          />
          <Toaster position="top-right" />
        </>
      );
    }

    return (
      <>
        <DoctorDashboard
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onStartConsultation={handleStartConsultation}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  /* ── DOCTOR ASSISTANT ─────────────────────────────── */
  if (currentRole === "doctor_assistant") {
    if (currentProfile?.approval_status !== "approved") {
      return (
        <>
          <AwaitingApprovalScreen onLogout={handleLogout} />
          <Toaster position="top-right" />
        </>
      );
    }
    return (
      <>
        <AssistantDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
        <Toaster position="top-right" />
      </>
    );
  }

  /* ── PATIENT ──────────────────────────────────────── */
  if (currentRole === "patient") {
    return (
      <>
        <div className="app-screen-root">
          <div className="app-screen-grain" />
          <div className="app-screen-vignette" />
          <div className="app-screen-card">
            <div className="app-icon-wrap app-icon-wrap-navy">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#1A7C6D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              The patient portal is currently under development.
              You will be notified when it becomes available.
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
        <Toaster position="top-right" />
      </>
    );
  }

  /* ── FALLBACK ─────────────────────────────────────── */
  return (
    <>
      <div className="app-screen-root">
        <div className="app-screen-grain" />
        <div className="app-screen-vignette" />
        <div className="app-screen-card">
          <div className="app-icon-wrap app-icon-wrap-teal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <h1 className="app-screen-heading">Unknown role</h1>
          <p className="app-screen-sub">
            Your account role could not be determined.
            Please contact your administrator.
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
      <Toaster position="top-right" />
    </>
  );
}