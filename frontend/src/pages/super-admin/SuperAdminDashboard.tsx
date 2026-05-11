// src/components/SuperAdminDashboard.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { EnhancedSidebar }          from "@/components/layout/EnhancedSidebar";
import { DashboardOverviewPage }    from "@/pages/super-admin/DashboardOverviewPage";
import { HospitalRegistrationPage } from "@/pages/hospital-admin/HospitalRegistrationPage";
import { HospitalDetailPage }       from "@/pages/super-admin/HospitalDetailPage";
import { HospitalsManagementPage }  from "@/pages/super-admin/HospitalsManagementPage";
import { AdminsManagementPage }     from "@/pages/super-admin/AdminsManagementPage";
import { UsersManagementPage }      from "@/pages/super-admin/UsersManagementPage";

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  return (
    <div className="page-root">
      <EnhancedSidebar
        onLogout={onLogout}
        userRole="super_admin"
        userName="Super Admin"
        userSubtitle="System Administrator"
      />

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/super-admin/dashboard" replace />}
        />
        <Route path="dashboard" element={<DashboardOverviewPage />} />
        <Route
          path="hospitals-management"
          element={<HospitalsManagementPage />}
        />
        <Route path="hospital-detail/:id" element={<HospitalDetailPage />} />
        <Route path="admins-management" element={<AdminsManagementPage />} />
        <Route path="users-management" element={<UsersManagementPage />} />
        <Route
          path="register-hospital"
          element={<HospitalRegistrationPage />}
        />
        <Route
          path="*"
          element={<Navigate to="/super-admin/dashboard" replace />}
        />
      </Routes>
    </div>
  );
}

export default SuperAdminDashboard;
