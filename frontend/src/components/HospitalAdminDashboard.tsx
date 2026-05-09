import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import HospitalAdminSidebar from "./layout/HospitalAdminSidebar";
import OverviewPage         from "../pages/HospitalAdmin/OverviewPage";
import HospitalProfilePage  from "../pages/HospitalAdmin/HospitalProfilePage";
import SettingsPage         from "../pages/HospitalAdmin/SettingsPage";
import AssistantsPage       from "../pages/HospitalAdmin/AssistantsPage";
import DoctorsPage          from "../pages/HospitalAdmin/DoctorsPage";
import { toast }            from "sonner";

interface HospitalAdminDashboardProps {
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type DashboardData = {
  admin: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
  };
  hospital: { id: string; name: string; status: string } | null;
  stats: {
    doctorsActive: number;
    doctorsInactive: number;
    assistantsActive: number;
    assistantsInactive: number;
    patientsCount: number;
    assistantsUnlinked: number;
  };
};



export function HospitalAdminDashboard({ onLogout }: HospitalAdminDashboardProps) {
  const location = useLocation();
  const [dashboard,   setDashboard]   = useState<DashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);

  const token = localStorage.getItem("accessToken");

  const fetchDashboard = async () => {
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

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userName = dashboard?.admin?.full_name || "Hospital Admin";
  const subtitle = dashboard?.hospital?.name   || "No hospital assigned";

  return (
    <div className="page-root">
      <HospitalAdminSidebar
        onLogout={onLogout}
        userName={userName}
        subtitle={subtitle}
      />

      <main className="page-main">
        <Routes>
          <Route path="/" element={<Navigate to="/hospital-admin/overview" replace />} />
          <Route 
            path="overview" 
            element={
              <OverviewPage
                dashboard={dashboard}
                loading={loadingDash}
                onRefresh={fetchDashboard}
              />
            } 
          />
          <Route path="doctors" element={<DoctorsPage onRefreshGlobal={fetchDashboard} />} />
          <Route path="assistants" element={<AssistantsPage onRefreshGlobal={fetchDashboard} />} />
          <Route path="hospital-profile" element={<HospitalProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/hospital-admin/overview" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default HospitalAdminDashboard;