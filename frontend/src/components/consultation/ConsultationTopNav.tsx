import { Activity, LayoutDashboard, History, Settings, LogOut } from "lucide-react";

interface ConsultationTopNavProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  doctorName?: string;
  doctorSubtitle?: string;
}

export default function ConsultationTopNav({
  onNavigate,
  onLogout,
  doctorName = "Doctor",
  doctorSubtitle = "MedScribe AI",
}: ConsultationTopNavProps) {
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
              onClick={() => onNavigate("dashboard")}
              className="ctn-link"
            >
              <LayoutDashboard className="ctn-link-icon" />
              <span className="ctn-link-label">Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate("history")}
              className="ctn-link"
            >
              <History className="ctn-link-icon" />
              <span className="ctn-link-label">History</span>
            </button>

            <button
              onClick={() => onNavigate("settings")}
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
