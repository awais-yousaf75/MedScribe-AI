// src/components/layout/AssistantSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
  Calendar,
  LogOut,
  UserPlus,
  Search,
  Building2,
  UserCog,
} from "lucide-react";

interface AssistantSidebarProps {
  onLogout: () => void;
  userRole?: string;
  userName?: string;
  userSubtitle?: string;
  pendingCount?: number;
}

const mainNav = [
  {
    id: "assistant-search-patient",
    label: "Search Patient",
    icon: Search,
  },
  {
    id: "assistant-register-patient",
    label: "Register New Patient",
    icon: UserPlus,
  },
  {
    id: "assistant-hospital-patients",
    label: "Hospital Patients",
    icon: Building2,
  },
  {
    id: "assistant-appointments",
    label: "Appointments",
    icon: Calendar,
    hasBadge: true,
  },
];

const bottomNav = [
  {
    id: "assistant-my-profile",
    label: "My Profile",
    icon: UserCog,
  },
];

export function AssistantSidebar({
  onLogout,
  userName = "Assistant",
  userSubtitle = "Doctor Assistant",
  pendingCount = 0,
}: AssistantSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const rawPage = location.pathname.split("/").pop() || "search-patient";
  const currentPage = rawPage === "assistant" ? "assistant-search-patient" : `assistant-${rawPage}`;

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const renderNavItem = (item: (typeof mainNav)[0]) => {
    const Icon     = item.icon;
    const isActive = currentPage === item.id;
    const badge    = item.hasBadge && pendingCount > 0 ? pendingCount : null;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => navigate(`/assistant/${item.id.replace("assistant-", "")}`)}
        className={`sidebar-nav-item${isActive ? " sidebar-nav-item-active" : ""}`}
      >
        <Icon className="sidebar-nav-icon" />
        <span className="sidebar-nav-label">{item.label}</span>
        {badge && (
          <span className="tab-badge" style={{ marginLeft: "auto" }}>
            {badge}
          </span>
        )}
        {isActive && <div className="sidebar-nav-indicator" />}
      </button>
    );
  };

  return (
    <aside className="sidebar">

      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={18} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">MedScribe AI</div>
          <div className="sidebar-logo-sub">Assistant Portal</div>
        </div>
      </div>

      {/* ── User ── */}
      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name">{userName}</div>
          <div className="sidebar-user-role">{userSubtitle}</div>
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Patients</div>
        {mainNav.map(renderNavItem)}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>
          General
        </div>
        {bottomNav.map(renderNavItem)}
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

export default AssistantSidebar;