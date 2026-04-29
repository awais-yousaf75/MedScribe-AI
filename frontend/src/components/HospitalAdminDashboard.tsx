import React, { useEffect, useState } from "react";
import HospitalAdminSidebar from "../components/layout/HospitalAdminSidebar";
import HospitalAdminOverviewPage from "../pages/HospitalAdmin/OverviewPage";
import PendingDoctorsPage from "../pages/HospitalAdmin/PendingDoctorsPage";
import PendingAssistantsPage from "../pages/HospitalAdmin/PendingAssistantsPage";
import HospitalProfilePage from "../pages/HospitalAdmin/HospitalProfilePage";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type DashboardData = {
  admin: { id: string; full_name: string; phone: string | null; email: string | null };
  hospital: { id: string; name: string; status: string } | null;
  stats: {
    pendingDoctors: number;
    pendingAssistants: number;
    approvedDoctors: number;
    approvedAssistants: number;
    patientsCount: number;
    totalPending: number;
  };
};

export function HospitalAdminDashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [page, setPage] = useState("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);

  const token = localStorage.getItem("accessToken");

  const fetchDashboard = async () => {
    if (!token) return;
    try {
      setLoadingDash(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/dashboard`, {
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
  const subtitle = dashboard?.hospital?.name || "No hospital assigned";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      <HospitalAdminSidebar
        currentPage={page}
        onNavigate={setPage}
        onLogout={onLogout}
        userName={userName}
        subtitle={subtitle}
      />

      <main className="ml-72">
        {page === "overview" && (
          <HospitalAdminOverviewPage dashboard={dashboard} loading={loadingDash} onRefresh={fetchDashboard} onNavigate={setPage} />
        )}

        {page === "pending-doctors" && (
          <PendingDoctorsPage onRefreshGlobal={fetchDashboard} />
        )}

        {page === "pending-assistants" && (
          <PendingAssistantsPage onRefreshGlobal={fetchDashboard} />
        )}

        {page === "hospital-profile" && (
          <HospitalProfilePage />
        )}
      </main>
    </div>
  );
}

export default HospitalAdminDashboard;