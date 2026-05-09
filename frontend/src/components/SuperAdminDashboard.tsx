import { Routes, Route, Navigate } from "react-router-dom";
import { EnhancedSidebar } from "./layout/EnhancedSidebar";
import { DashboardOverviewPage } from "../pages/SuperAdmin/DashboardOverviewPage";
import { HospitalRegistrationPage } from "../pages/HospitalAdmin/HospitalRegistrationPage";
import { HospitalDetailPage } from "../pages/SuperAdmin/HospitalDetailPage";
import { HospitalsManagementPage } from "../pages/SuperAdmin/HospitalsManagementPage";
import { AdminsManagementPage } from "../pages/SuperAdmin/AdminsManagementPage";
import { UsersManagementPage } from "../pages/SuperAdmin/UsersManagementPage";

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

export function SuperAdminDashboard({
  onLogout,
}: SuperAdminDashboardProps) {


  const handleLogout = () => {
    onLogout();
  };

  // Render inner routes
  const renderRoutes = () => (
    <Routes>
      <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardOverviewPage />} />
      <Route 
        path="hospitals-management" 
        element={<HospitalsManagementPage />} 
      />
      <Route 
        path="hospital-detail/:id" 
        element={<HospitalDetailPage />} 
      />
      <Route path="admins-management" element={<AdminsManagementPage />} />
      <Route path="users-management" element={<UsersManagementPage />} />
      <Route path="register-hospital" element={<HospitalRegistrationPage />} />
      <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
    </Routes>
  );



  return (
    <div className="page-root">
      <EnhancedSidebar
        onLogout={handleLogout}
        userRole="super_admin"
        userName="Super Admin"
        userSubtitle="System Administrator"
      />
      <div className="page-main">
        {renderRoutes()}
      </div>
    </div>
  );
}

export default SuperAdminDashboard;