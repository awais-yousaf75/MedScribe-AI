// src/components/layout/HospitalAdminSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Stethoscope,
  UserCog,
  Building2,
  LogOut,
  User,
  Key,
} from "lucide-react";

const mainNav = [
  { id: "overview",          label: "Overview",          icon: LayoutDashboard },
  { id: "doctors",           label: "Doctors",           icon: Stethoscope     },
  { id: "assistants",        label: "Assistants",        icon: UserCog         },
  { id: "hospital-profile",  label: "Hospital Profile",  icon: Building2       },
];

const settingsNav = [
  { id: "my-profile",        label: "My Profile",        icon: User            },
  { id: "hospital-details",  label: "Hospital Details",   icon: Building2       },
  { id: "change-password",   label: "Change Password",    icon: Key             },
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

  const renderNavItem = (item: { id: string; label: string; icon: React.ElementType }) => {
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
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={18} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">MedScribe AI</div>
          <div className="sidebar-logo-sub">Hospital Admin</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name">{userName}</div>
          <div className="sidebar-user-role">{subtitle}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Management</div>
        {mainNav.map(renderNavItem)}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Settings</div>
        {settingsNav.map(renderNavItem)}
      </nav>

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