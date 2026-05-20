import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Shield,
  Building2,
  Users,
  LogOut,
  BarChart3,
} from "lucide-react";
import ProductLogo from "../common/ProductLogo";

interface EnhancedSidebarProps {
  onLogout: () => void;
  userRole?: string;
  userName?: string;
  userSubtitle?: string;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard Overview",
    icon: BarChart3,
  },
  {
    id: "hospitals-management",
    label: "Hospitals Management",
    icon: Building2,
  },
  {
    id: "admins-management",
    label: "Hospital Admins",
    icon: Shield,
  },
  {
    id: "users-management",
    label: "All Users",
    icon: Users,
  },
];

export function EnhancedSidebar({
  onLogout,
  userRole = "super_admin",
  userName = "Admin",
  userSubtitle = "System Administrator",
}: EnhancedSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.split("/").pop() || "dashboard";
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
        <ProductLogo className="sidebar-logo-icon" />
        <div>
          <div className="sidebar-logo-text">MedScribe AI</div>
          <div className="sidebar-logo-sub">Administration</div>
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

export default EnhancedSidebar;
