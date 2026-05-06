import { useState } from "react";
import { EnhancedSidebar } from "./layout/EnhancedSidebar";
import { DashboardOverviewPage } from "../pages/SuperAdmin/DashboardOverviewPage";
import { HospitalRegistrationPage } from "../pages/HospitalAdmin/HospitalRegistrationPage";
import { HospitalDetailPage } from "../pages/SuperAdmin/HospitalDetailPage";
import { HospitalsManagementPage } from "../pages/SuperAdmin/HospitalsManagementPage";
import { AdminsManagementPage } from "../pages/SuperAdmin/AdminsManagementPage";
import { UsersManagementPage } from "../pages/SuperAdmin/UsersManagementPage";

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export function SuperAdminDashboard({
  onNavigate,
  onLogout,
}: SuperAdminDashboardProps) {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedHospitalId(null);
  };

  const handleViewHospitalDetail = (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setCurrentPage("hospital-detail");
  };

  const handleLogout = () => {
    onLogout();
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverviewPage onNavigate={handleNavigate} />;

      case "hospitals-management":
        return (
          <HospitalsManagementPage
            onViewDetail={handleViewHospitalDetail}
            onNavigate={handleNavigate}
          />
        );

      case "hospital-detail":
        return selectedHospitalId ? (
          <HospitalDetailPage
            hospitalId={selectedHospitalId}
            onBack={() => handleNavigate("hospitals-management")}
          />
        ) : (
          <HospitalsManagementPage
            onViewDetail={handleViewHospitalDetail}
            onNavigate={handleNavigate}
          />
        );

      case "admins-management":
        return <AdminsManagementPage onNavigate={handleNavigate} />;

      case "users-management":
        return <UsersManagementPage onNavigate={handleNavigate} />;

      case "register-hospital":
        return (
          <HospitalRegistrationPage
            onBack={() => handleNavigate("hospitals-management")}
          />
        );

      default:
        return <DashboardOverviewPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="page-root">
      <EnhancedSidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userRole="super_admin"
        userName="Super Admin"
        userSubtitle="System Administrator"
      />
      <div className="page-main">
        {renderPage()}
      </div>
    </div>
  );
}

export default SuperAdminDashboard;