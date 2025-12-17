// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";

import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";

import { AppLayout } from "../components/layouts/AppLayout";

import { RequireAuth } from "../auth/guards/RequireAuth";
import { RequireRole } from "../auth/guards/ReuireRole";
import { RequireApproval } from "../auth/guards/RequireApproval";
import { RedirectIfAuthenticated } from "../auth/guards/RedirectIfAuthenticated";

import { DoctorDashboardPage } from "../features/doctor/pages/doctorHome";
import { DoctorRecordPage } from "../features/doctor/pages/recordingScreen";
import { DoctorExtractionPage } from "../features/doctor/pages/extractionPage";

import { AssistantDashboardPage } from "../features/assistant/pages/AssistantDashboardPage";
import { HospitalAdminDashboardPage } from "../features/hospitalAdmin/pages/HospitalAdminDashboardPage";
import { SuperAdminDashboardPage } from "../features/superAdmin/pages/SuperAdminDashboardPage";

import { AccessDeniedPage } from "../features/common/pages/AccessDeniedPage";
import { AwaitingApprovalPage } from "../features/common/pages/AwaitingApprovalPage";
import { NotFoundPage } from "../features/common/pages/NotFoundPage";
import { DashboardHomePage } from "../features/common/pages/DashboardHomePage";

export const router = createBrowserRouter([
  // Public
  {
    path: "/",
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: "/login",
    element: (
      <RedirectIfAuthenticated>
        <LoginPage />
      </RedirectIfAuthenticated>
    ),
  },
  {
    path: "/register",
    element: (
      <RedirectIfAuthenticated>
        <RegisterPage />
      </RedirectIfAuthenticated>
    ),
  },

  // Generic authenticated (e.g. patient / fallback)
  {
    path: "/app",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardHomePage />,
      },
    ],
  },

  // Doctor
  {
    path: "/doctor",
    element: (
      <RequireAuth>
        <RequireRole allowed={["doctor"]}>
          <RequireApproval>
            <AppLayout />
          </RequireApproval>
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { path: "dashboard", element: <DoctorDashboardPage /> },
      { path: "record", element: <DoctorRecordPage /> },
      { path: "extraction", element: <DoctorExtractionPage /> },
    //   { path: "notes", element: <DoctorNotesPage /> },
    //   { path: "history", element: <DoctorHistoryPage /> },
    ],
  },

  // Doctor assistant
  {
    path: "/assistant",
    element: (
      <RequireAuth>
        <RequireRole allowed={["doctor_assistant"]}>
          <RequireApproval>
            <AppLayout />
          </RequireApproval>
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { path: "dashboard", element: <AssistantDashboardPage /> },
      // add assistant routes later
    ],
  },

  // Hospital admin
  {
    path: "/hospital-admin",
    element: (
      <RequireAuth>
        <RequireRole allowed={["hospital_admin"]}>
          <RequireApproval>
            <AppLayout />
          </RequireApproval>
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { path: "dashboard", element: <HospitalAdminDashboardPage /> },
      // add more hospital admin routes later
    ],
  },

  // Super admin (no approval guard)
  {
    path: "/super-admin",
    element: (
      <RequireAuth>
        <RequireRole allowed={["super_admin"]}>
          <AppLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { path: "dashboard", element: <SuperAdminDashboardPage /> },
      // add more super admin routes later
    ],
  },

  // Shared utility pages
  {
    path: "/access-denied",
    element: <AccessDeniedPage />,
  },
  {
    path: "/pending-approval",
    element: <AwaitingApprovalPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);