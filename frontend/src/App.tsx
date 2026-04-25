import { useEffect, useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { HospitalAdminDashboard } from "./components/HospitalAdminDashboard";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { AssistantDashboard } from "./components/AssistantDashboard";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { toast } from "sonner";

// NEW: consultation pages
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

// ─────────────────────────────────────────────────────────────
// AWAITING APPROVAL SCREEN
// ─────────────────────────────────────────────────────────────

function AwaitingApprovalScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-md w-full bg-white border-2 border-orange-100 rounded-3xl shadow-xl p-8 space-y-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)",
            }}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Account Under Review
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Your account is currently pending approval. You'll receive access to
            the portal once an administrator has approved your account.
          </p>

          <Button
            variant="outline"
            className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-12 px-8"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMING SOON (for pages you haven’t wired yet)
// ─────────────────────────────────────────────────────────────

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-lg w-full bg-white border-2 border-blue-100 rounded-3xl shadow-xl p-8 space-y-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
            }}
          >
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">
            {description || "This page will be available soon."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="outline"
              className="rounded-xl h-12"
              onClick={onBack}
            >
              Back
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-12 border-red-500 text-red-600 hover:bg-red-50"
              onClick={onLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Consultation workflow state
  const [currentPatient, setCurrentPatient] = useState<string>("");
  const [currentPatientId, setCurrentPatientId] = useState<string>(""); // Added ID state
  const [recordingData, setRecordingData] = useState<any>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(
    null
  );

  const getDisplayName = (user: SupabaseUser | null, profile: Profile | null) =>
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User";

  // ─────────────────────────────────────────────────────────────
  // AUTH CHECK
  // ─────────────────────────────────────────────────────────────

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

      // Route based on role
      switch (role) {
        case "super_admin":
          setCurrentPage("super-admin-dashboard");
          break;
        case "hospital_admin":
          setCurrentPage("hospital-admin-dashboard");
          break;
        case "doctor":
          setCurrentPage("doctor-dashboard");
          break;
        case "doctor_assistant":
          setCurrentPage("assistant-dashboard");
          break;
        default:
          setCurrentPage("dashboard");
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

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleLogin = () => loadCurrentUser(true);

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
    // If navigating manually to recording without selecting a patient, clear patient data
    if (page === "recording" && currentPage !== "recording") {
      setCurrentPatient("");
      setCurrentPatientId("");
    }
    setCurrentPage(page as Page);
  };

  // Consultation workflow handlers
  const handleStartConsultation = (patient: { profile_id: string; full_name: string }) => {
    setTranscriptData(null);
    setRecordingData(null);

    setCurrentPatient(patient.full_name);
    setCurrentPatientId(patient.profile_id);
    
    setCurrentPage("recording");
  };

  const handleRecordingComplete = (data: any) => {
    // data should include transcript etc
    setRecordingData(data);
    setTranscriptData(data as TranscriptData);
    setCurrentPage("transcript");
  };

  // ─────────────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────────────

  if (isCheckingAuth) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
              }}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500">Loading MedScribe AI...</p>
          </div>
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // NOT AUTHENTICATED
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // SUPER ADMIN
  // ─────────────────────────────────────────────────────────────

  if (currentRole === "super_admin") {
    return (
      <>
        <SuperAdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
        <Toaster position="top-right" />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // HOSPITAL ADMIN
  // ─────────────────────────────────────────────────────────────

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
        <HospitalAdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
        <Toaster position="top-right" />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DOCTOR
  // ─────────────────────────────────────────────────────────────

  if (currentRole === "doctor") {
    if (currentProfile?.approval_status !== "approved") {
      return (
        <>
          <AwaitingApprovalScreen onLogout={handleLogout} />
          <Toaster position="top-right" />
        </>
      );
    }

    // Doctor routing (NEW)
    if (currentPage === "recording") {
      return (
        <>
          <LiveRecording
            patientProfileId={currentPatientId} // CONNECTED ID
            patientName={currentPatient}        // CONNECTED NAME
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

    // Optional pages not wired yet
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
            title="This page is coming soon"
            description="The transcript flow is working now. Extraction/notes/history will be connected next."
            onBack={() => setCurrentPage("doctor-dashboard")}
            onLogout={handleLogout}
          />
          <Toaster position="top-right" />
        </>
      );
    }

    // Default doctor dashboard
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

  // ─────────────────────────────────────────────────────────────
  // DOCTOR ASSISTANT
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // PATIENT (fallback)
  // ─────────────────────────────────────────────────────────────

  if (currentRole === "patient") {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
          <div className="max-w-md w-full bg-white border-2 border-blue-100 rounded-3xl shadow-xl p-8 space-y-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
                }}
              >
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome, {getDisplayName(currentUser, currentProfile)}!
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Patient portal coming soon. Stay tuned for updates!
              </p>
              <Button
                variant="outline"
                className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-12 px-8"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // FALLBACK
  // ─────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to MedScribe AI
          </h1>
          <p className="text-gray-500 mb-6">Your role: {currentRole || "Unknown"}</p>
          <Button
            variant="outline"
            className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-12 px-8"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}