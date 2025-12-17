// src/features/doctor/pages/DoctorDashboardPage.tsx
import { useNavigate } from "react-router-dom";
import { DoctorDashboard } from "../../../components/DoctorDashboard";

export function DoctorDashboardPage() {
  const navigate = useNavigate();

  return (
    <DoctorDashboard
      onStartConsultation={() => navigate("/doctor/record")}
      onViewConsultation={() => navigate("/doctor/extraction")}
      onEditNotes={() => navigate("/doctor/notes")}
      onViewAllHistory={() => navigate("/doctor/history")}
    />
  );
}