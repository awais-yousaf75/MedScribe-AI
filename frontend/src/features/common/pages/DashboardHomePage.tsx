// src/features/common/pages/DashboardHomePage.tsx
import { useNavigate } from "react-router-dom";
import { DashboardHome } from "../../../components/DashboardHome";
import { useAuth } from "../../../auth/useAuth";

export function DashboardHomePage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const goToRecord = () => {
    if (role === "doctor") navigate("/doctor/record");
  };

  const goToExtraction = () => {
    if (role === "doctor") navigate("/doctor/extraction");
  };

  const goToNotes = () => {
    if (role === "doctor") navigate("/doctor/notes");
  };

  const goToHistory = () => {
    if (role === "doctor") navigate("/doctor/history");
  };

  return (
    <DashboardHome
      onStartConsultation={goToRecord}
      onViewConsultation={goToExtraction}
      onEditNotes={goToNotes}
      onViewAllHistory={goToHistory}
    />
  );
}