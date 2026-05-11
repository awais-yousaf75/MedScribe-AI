// src/App.tsx
import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { LoginPage } from "@/pages/auth/LoginPage";
//import { RegisterPage } from "@/pages/auth/RegisterPage";
import { SuperAdminDashboard } from "@/pages/super-admin/SuperAdminDashboard";
import { HospitalAdminDashboard } from "@/pages/hospital-admin/HospitalAdminDashboard";
import { DoctorDashboard } from "@/pages/doctor/DoctorDashboard";
import { AssistantDashboard } from "@/pages/assistant/AssistantDashboard";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import type { UserRole, SupabaseUser, Profile } from "@/types";
import { API_URL } from "@/lib/constants";

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

  // ── Helpers ───────────────────────────────────────────────

  const getDisplayName = (user: SupabaseUser | null, profile: Profile | null) =>
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User";

  const getDefaultRoute = (role: UserRole | null) => {
    switch (role) {
      case "super_admin":
        return "/super-admin";
      case "hospital_admin":
        return "/hospital-admin";
      case "doctor":
        return "/doctor/dashboard";
      case "doctor_assistant":
        return "/assistant";
      case "patient":
        return "/patient";
      default:
        return "/login";
    }
  };

  // ── Auth ──────────────────────────────────────────────────

  const loadCurrentUser = async (showWelcome = false) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentProfile(null);
      setCurrentRole(null);
      setIsCheckingAuth(false);
      if (location.pathname !== "/register") navigate("/login");
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

      if (
        location.pathname === "/" ||
        location.pathname === "/login" ||
        location.pathname === "/register"
      ) {
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

  // ── Handlers ──────────────────────────────────────────────

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
    navigate("/login");
    toast.info("You have been logged out");
  };

  /* ── LOADING ── */
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

  /* ── ROUTES ── */
  return (
    <>
      <Routes>
        {/* ── Auth ── */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        {/* <Route
          path="/register"
          element={<RegisterPage onRegister={handleRegister} />}
        /> */}

        {/* ── Super Admin ── */}
        <Route
          path="/super-admin/*"
          element={
            isAuthenticated && currentRole === "super_admin" ? (
              <SuperAdminDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ── Hospital Admin ── */}
        <Route
          path="/hospital-admin/*"
          element={
            isAuthenticated && currentRole === "hospital_admin" ? (
              currentProfile?.approval_status !== "approved" ? (
                <AwaitingApprovalScreen onLogout={handleLogout} />
              ) : (
                <HospitalAdminDashboard onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ── Assistant ── */}
        <Route
          path="/assistant/*"
          element={
            isAuthenticated && currentRole === "doctor_assistant" ? (
              currentProfile?.approval_status !== "approved" ? (
                <AwaitingApprovalScreen onLogout={handleLogout} />
              ) : (
                <AssistantDashboard onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ── Doctor ──
            DoctorDashboard owns its own layout, sidebar,
            consultation pipeline state, and all subroutes.
        ── */}
        <Route
          path="/doctor/*"
          element={
            isAuthenticated && currentRole === "doctor" ? (
              currentProfile?.approval_status !== "approved" ? (
                <AwaitingApprovalScreen onLogout={handleLogout} />
              ) : (
                <DoctorDashboard onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ── Patient ── */}
        <Route
          path="/patient/*"
          element={
            isAuthenticated && currentRole === "patient" ? (
              <div className="app-screen-root">
                <div className="app-screen-grain" />
                <div className="app-screen-vignette" />
                <div className="app-screen-card">
                  <div className="app-icon-wrap app-icon-wrap-navy">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1A7C6D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="app-screen-eyebrow">
                    <span className="app-screen-eyebrow-line" />
                    <span className="app-screen-eyebrow-text">
                      Patient Portal
                    </span>
                    <span className="app-screen-eyebrow-line" />
                  </div>
                  <h1 className="app-screen-heading">
                    {getDisplayName(currentUser, currentProfile)}
                  </h1>
                  <p className="app-screen-sub">
                    The patient portal is currently under development.
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
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ── Root redirect ── */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? getDefaultRoute(currentRole) : "/login"}
              replace
            />
          }
        />

        {/* ── 404 ── */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <div className="app-screen-root">
                <div className="app-screen-grain" />
                <div className="app-screen-vignette" />
                <div className="app-screen-card">
                  <div className="app-icon-wrap app-icon-wrap-teal">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="app-screen-eyebrow">
                    <span className="app-screen-eyebrow-line" />
                    <span className="app-screen-eyebrow-text">
                      MedScribe AI
                    </span>
                    <span className="app-screen-eyebrow-line" />
                  </div>
                  <h1 className="app-screen-heading">Page Not Found</h1>
                  <p className="app-screen-sub">
                    The page you are looking for does not exist or you do not
                    have permission to view it.
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
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
