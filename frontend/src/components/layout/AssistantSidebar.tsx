// src/components/layout/AssistantSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity, Calendar, LogOut, UserPlus, Search, Building2, UserCog, Key,
} from "lucide-react";
import { AvatarDisplay } from "@/components/common/AvatarUpload";

interface AssistantSidebarProps {
  onLogout: () => void;
  userRole?: string;
  userName?: string;
  userSubtitle?: string;
  pendingCount?: number;
  avatarUrl?: string | null;
}

const mainNav = [
  { id: "assistant-search-patient",     label: "Search Patient",       icon: Search    },
  { id: "assistant-register-patient",   label: "Register New Patient", icon: UserPlus  },
  { id: "assistant-hospital-patients",  label: "Hospital Patients",    icon: Building2 },
  { id: "assistant-appointments",       label: "Appointments",         icon: Calendar, hasBadge: true },
];

const bottomNav = [
  { id: "assistant-my-profile",      label: "My Profile",      icon: UserCog },
  { id: "assistant-change-password", label: "Change Password", icon: Key     },
];

export function AssistantSidebar({
  onLogout,
  userName = "Assistant",
  userSubtitle = "Doctor Assistant",
  pendingCount = 0,
  avatarUrl,
}: AssistantSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const rawPage = location.pathname.split("/").pop() || "search-patient";
  const currentPage = rawPage === "assistant" ? "assistant-search-patient" : `assistant-${rawPage}`;

  const renderNavItem = (item: any) => {
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

      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={18} color="#fff" />
        </div>
        <div>
          <div className="sidebar-logo-text">MedScribe AI</div>
          <div className="sidebar-logo-sub">Assistant Portal</div>
        </div>
      </div>

      <div className="sidebar-user">
        <AvatarDisplay url={avatarUrl} name={userName} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-user-name">{userName}</div>
          <div className="sidebar-user-role">{userSubtitle}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Patients</div>
        {mainNav.map(renderNavItem)}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>General</div>
        {bottomNav.map(renderNavItem)}
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

export default AssistantSidebar;