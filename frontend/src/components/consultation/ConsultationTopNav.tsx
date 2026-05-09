import { Activity, LayoutDashboard, History, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ConsultationTopNavProps {
  onLogout: () => void;
  doctorName?: string;
  doctorSubtitle?: string;
}

export default function ConsultationTopNav({
  onLogout,
  doctorName = "Doctor",
  doctorSubtitle = "MedScribe AI",
}: ConsultationTopNavProps) {
  const navigate = useNavigate();
  const initials = doctorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <nav className="ctn-nav">
      <div className="ctn-inner">

        {/* Brand */}
        <div className="ctn-brand">
          <div className="ctn-brand-icon">
            <Activity className="ctn-brand-activity" />
          </div>
          <div className="ctn-brand-text">
            <h1 className="ctn-brand-name">MedScribe AI</h1>
            <p className="ctn-brand-sub">Clinical Intelligence Platform</p>
          </div>
        </div>

        {/* Nav links + user */}
        <div className="ctn-right">

          <div className="ctn-links">
            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="ctn-link"
            >
              <LayoutDashboard className="ctn-link-icon" />
              <span className="ctn-link-label">Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/doctor/history")}
              className="ctn-link"
            >
              <History className="ctn-link-icon" />
              <span className="ctn-link-label">History</span>
            </button>

            <button
              onClick={() => navigate("/doctor/settings")}
              className="ctn-link"
            >
              <Settings className="ctn-link-icon" />
              <span className="ctn-link-label">Settings</span>
            </button>
          </div>

          <div className="ctn-divider" />

          {/* Doctor info */}
          <div className="ctn-doctor">
            <div className="ctn-doctor-text">
              <p className="ctn-doctor-name">{doctorName}</p>
              <p className="ctn-doctor-sub">{doctorSubtitle}</p>
            </div>
            <div className="ctn-doctor-avatar">
              {initials || "DR"}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="ctn-logout"
            title="Logout"
          >
            <LogOut className="ctn-logout-icon" />
          </button>

        </div>
      </div>
    </nav>
  );
}
