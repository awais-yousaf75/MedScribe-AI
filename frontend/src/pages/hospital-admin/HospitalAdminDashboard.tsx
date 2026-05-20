// src/pages/hospital-admin/HospitalAdminDashboard.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { toast } from "sonner";
import HospitalAdminSidebar from "@/components/layout/HospitalAdminSidebar";
import OverviewPage         from "@/pages/hospital-admin/OverviewPage";
import HospitalProfilePage  from "@/pages/hospital-admin/HospitalProfilePage";
import AssistantsPage       from "@/pages/hospital-admin/AssistantsPage";
import DoctorsPage          from "@/pages/hospital-admin/DoctorsPage";
import MyProfilePage        from "@/pages/hospital-admin/MyProfilePage";
import HospitalDetailsPage  from "@/pages/hospital-admin/HospitalDetailsPage";
import ChangePasswordPage   from "@/pages/hospital-admin/ChangePasswordPage";
import { API_URL, getToken } from "@/lib/constants";

type DashboardData = {
  admin: { id: string; full_name: string; phone: string | null; email: string | null };
  hospital: { id: string; name: string; status: string } | null;
  stats: {
    doctorsActive: number; doctorsInactive: number;
    assistantsActive: number; assistantsInactive: number;
    patientsCount: number; assistantsUnlinked: number;
  };
};

interface HospitalAdminDashboardProps {
  onLogout: () => void;
}

export function HospitalAdminDashboard({ onLogout }: HospitalAdminDashboardProps) {
  const [dashboard,   setDashboard]   = useState<DashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);

  const fetchDashboard = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingDash(true);
      const res  = await fetch(`${API_URL}/api/hospital-admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
      setDashboard(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load dashboard");
    } finally {
      setLoadingDash(false);
    }
  };

  const fetchAvatar = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.profile?.avatar_url) setAvatarUrl(data.profile.avatar_url);
    } catch {}
  };

  useEffect(() => {
    fetchDashboard();
    fetchAvatar();
  }, []);

  const userName = dashboard?.admin?.full_name || "Hospital Admin";
  const subtitle = dashboard?.hospital?.name   || "No hospital assigned";

  return (
    <div className="page-root">
      <HospitalAdminSidebar
        onLogout={onLogout}
        userName={userName}
        subtitle={subtitle}
        avatarUrl={avatarUrl}
      />

      <main className="page-main">
        <Routes>
          <Route path="/"                 element={<Navigate to="/hospital-admin/overview" replace />} />
          <Route path="overview"          element={<OverviewPage dashboard={dashboard} loading={loadingDash} onRefresh={fetchDashboard} />} />
          <Route path="doctors"           element={<DoctorsPage onRefreshGlobal={fetchDashboard} />} />
          <Route path="assistants"        element={<AssistantsPage onRefreshGlobal={fetchDashboard} />} />
          <Route path="hospital-profile"  element={<HospitalProfilePage />} />
          <Route path="my-profile"        element={<MyProfilePage />} />
          <Route path="hospital-details"  element={<HospitalDetailsPage />} />
          <Route path="change-password"   element={<ChangePasswordPage />} />
          <Route path="*"                 element={<Navigate to="/hospital-admin/overview" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default HospitalAdminDashboard;