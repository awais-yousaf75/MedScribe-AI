// src/pages/super-admin/SuperAdminDashboard.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { EnhancedSidebar }          from "@/components/layout/EnhancedSidebar";
import { DashboardOverviewPage }    from "@/pages/super-admin/DashboardOverviewPage";
import { HospitalRegistrationPage } from "@/pages/hospital-admin/HospitalRegistrationPage";
import { HospitalDetailPage }       from "@/pages/super-admin/HospitalDetailPage";
import { HospitalsManagementPage }  from "@/pages/super-admin/HospitalsManagementPage";
import { AdminsManagementPage }     from "@/pages/super-admin/AdminsManagementPage";
import { UsersManagementPage }      from "@/pages/super-admin/UsersManagementPage";
import MyProfilePage                from "@/pages/super-admin/MyProfilePage";
import { API_URL, getToken }        from "@/lib/constants";

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

export function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  const [userName, setUserName]   = useState("Super Admin");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_URL}/api/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile?.full_name) setUserName(d.profile.full_name);
        if (d?.profile?.avatar_url) setAvatarUrl(d.profile.avatar_url);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-root">
      <EnhancedSidebar
        onLogout={onLogout}
        userRole="super_admin"
        userName={userName}
        userSubtitle="System Administrator"
        avatarUrl={avatarUrl}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
        <Route path="dashboard"             element={<DashboardOverviewPage />} />
        <Route path="hospitals-management"  element={<HospitalsManagementPage />} />
        <Route path="hospital-detail/:id"   element={<HospitalDetailPage />} />
        <Route path="admins-management"     element={<AdminsManagementPage />} />
        <Route path="users-management"      element={<UsersManagementPage />} />
        <Route path="register-hospital"     element={<HospitalRegistrationPage />} />
        <Route path="my-profile"            element={<MyProfilePage />} />
        <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default SuperAdminDashboard;