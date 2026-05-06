import {
  Activity,
  Users,
  Calendar,
  LogOut,
  UserPlus,
  Search,
  Building2,
} from "lucide-react";

interface AssistantSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userRole?: string;
  userName?: string;
  userSubtitle?: string;
  pendingCount?: number;
}

const menuItems = [
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

export function AssistantSidebar({
  currentPage,
  onNavigate,
  onLogout,
  userName = "Assistant",
  userSubtitle = "Doctor Assistant",
  pendingCount = 0,
}: AssistantSidebarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

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

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon     = item.icon;
          const isActive = currentPage === item.id;
          const badge    = item.hasBadge && pendingCount > 0 ? pendingCount : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
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

export default AssistantSidebar;