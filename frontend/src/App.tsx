import { useEffect, useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { Layout } from "./components/Layout";
import { DashboardHome } from "./components/DashboardHome";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { HospitalAdminDashboard } from "./components/HospitalAdminDashboard";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { toast } from "sonner";
import { AssistantDashboard } from "./components/AssistantDashboard";

type Page =
  | "login"
  | "register"
  | "dashboard"
  | "record"
  | "extraction"
  | "notes"
  | "prescription"
  | "history"
  | "settings"
  | "superadmin";

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

function AwaitingApprovalScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Account Under Review
        </h1>
        <p className="text-sm text-slate-500">
          Your account is currently pending approval. You&apos;ll receive access
          to the portal once an administrator has approved your account.
        </p>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
          onClick={onLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const getDisplayName = (user: SupabaseUser | null, profile: Profile | null) =>
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch current user");
      }

      const user = data.user as SupabaseUser;
      const profile = data.profile as Profile;
      const role = profile.role;

      setCurrentUser(user);
      setCurrentProfile(profile);
      setCurrentRole(role);
      setIsAuthenticated(true);

      // Default main page after login (actual UI branch is below)
      if (role === "super_admin") {
        setCurrentPage("superadmin");
      } else {
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
      if (showWelcome) {
        toast.error(err.message || "Authentication failed");
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // On first load, check if there's an existing token
  useEffect(() => {
    loadCurrentUser(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = () => {
    // Called by LoginPage after successful /api/auth/login
    loadCurrentUser(true);
  };

  const handleRegister = () => {
    toast.success("Account created successfully! Please sign in.");
    setCurrentPage("login");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentProfile(null);
    setCurrentRole(null);
    setCurrentPage("login");
    toast.info("You have been logged out");
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  const handleStartConsultation = () => {
    setCurrentPage("record");
  };

  const handleEditNotes = () => {
    setCurrentPage("notes");
  };

  const handleViewConsultationDetails = () => {
    setCurrentPage("extraction");
  };

  const handleViewAllHistory = () => {
    setCurrentPage("history");
  };

  // While checking token on initial load
  if (isCheckingAuth) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-gray-500">Loading...</p>
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  // Not authenticated yet
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

  // ---------- ROLE-BASED DASHBOARDS ----------

  // Super admin → dedicated portal
  if (currentRole === "super_admin") {
    return (
      <>
        <SuperAdminDashboard onLogout={handleLogout} />
        <Toaster position="top-right" />
      </>
    );
  }

  // Hospital admin
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
        <HospitalAdminDashboard onLogout={handleLogout} />
        <Toaster position="top-right" />
      </>
    );
  }

  // Doctor
  if (currentRole === "doctor") {
    if (currentProfile?.approval_status !== "approved") {
      return (
        <>
          <AwaitingApprovalScreen onLogout={handleLogout} />
          <Toaster position="top-right" />
        </>
      );
    }

    // Approved doctor → DoctorDashboard inside Layout
    return (
      <>
        <Layout
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        >
          {currentPage === "dashboard" && (
            <DoctorDashboard
              onStartConsultation={handleStartConsultation}
              onViewConsultation={handleViewConsultationDetails}
              onEditNotes={handleEditNotes}
              onViewAllHistory={handleViewAllHistory}
            />
          )}
          {/* other doctor pages (record, extraction, notes...) still use currentPage logic */}
        </Layout>
        <Toaster position="top-right" />
      </>
    );
  }

  // Other roles (patient, doctor_assistant, etc.) → existing generic layout
  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {currentPage === "dashboard" && (
          <DashboardHome
            onStartConsultation={handleStartConsultation}
            onViewConsultation={handleViewConsultationDetails}
            onEditNotes={handleEditNotes}
            onViewAllHistory={handleViewAllHistory}
          />
        )}
        {/* other pages (record, extraction, notes...) rendered here as needed */}
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}