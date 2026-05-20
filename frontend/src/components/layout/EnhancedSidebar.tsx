// src/components/layout/EnhancedSidebar.tsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  Building2,
  Users,
  LogOut,
  BarChart3,
  User,
} from "lucide-react";
import ProductLogo from "../common/ProductLogo";
import { AvatarDisplay } from "../common/AvatarUpload";

interface EnhancedSidebarProps {
  onLogout: () => void;
  userRole?: string;
  userName?: string;
  userSubtitle?: string;
  avatarUrl?: string | null;
}

const menuItems = [
  { id: "dashboard",             label: "Dashboard Overview",  icon: BarChart3 },
  { id: "hospitals-management",  label: "Hospitals Management", icon: Building2 },
  { id: "admins-management",     label: "Hospital Admins",      icon: Shield    },
  { id: "users-management",      label: "All Users",            icon: Users     },
];

const settingsItems = [
  { id: "my-profile", label: "My Profile", icon: User },
];

export function EnhancedSidebar({
  onLogout,
  userName = "Admin",
  userSubtitle = "System Administrator",
  avatarUrl,
}: EnhancedSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.split("/").pop() || "dashboard";

  const renderItem = (item: { id: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => navigate(`/super-admin/${item.id}`)}
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
        <ProductLogo className="sidebar-logo-icon" />
        <div>
          <div className="sidebar-logo-text">MedScribe AI</div>
          <div className="sidebar-logo-sub">Administration</div>
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
        <div className="sidebar-section-label">Management</div>
        {menuItems.map(renderItem)}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Settings</div>
        {settingsItems.map(renderItem)}
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

export default EnhancedSidebar;
