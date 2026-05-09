import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Stethoscope,
  UserCog,
  Building2,
  LogOut,
  Settings,
} from "lucide-react";

type Item = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const items: Item[] = [
  { id: "overview",          label: "Overview",         icon: LayoutDashboard },
  { id: "doctors",           label: "Doctors",          icon: Stethoscope     },
  { id: "assistants",        label: "Assistants",       icon: UserCog         },
  { id: "hospital-profile",  label: "Hospital Profile", icon: Building2       },
  { id: "settings",          label: "Settings",         icon: Settings        },
];

export function HospitalAdminSidebar({
  onLogout,
  userName,
  subtitle,
}: {
  onLogout: () => void;
  userName: string;
  subtitle: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.split("/").pop() || "overview";
  const initials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "A";

  return (
    <aside className="sidebar">

      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={18} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">MedScribe AI</div>
          <div className="sidebar-logo-sub">Hospital Admin</div>
        </div>
      </div>

      {/* ── User ── */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name">{userName}</div>
          <div className="sidebar-user-role">{subtitle}</div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon     = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/hospital-admin/${item.id}`)}
              className={`sidebar-nav-item${isActive ? " sidebar-nav-item-active" : ""}`}
            >
              <Icon className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
              {isActive && <div className="sidebar-nav-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <LogOut className="sidebar-logout-icon" />
          <span>Sign Out</span>
        </button>

        <div className="sidebar-ornament" aria-hidden="true">
          <span className="sidebar-ornament-line" />
          <span className="sidebar-ornament-dot" />
          <span className="sidebar-ornament-line" />
        </div>
      </div>
    </aside>
  );
}

export default HospitalAdminSidebar;