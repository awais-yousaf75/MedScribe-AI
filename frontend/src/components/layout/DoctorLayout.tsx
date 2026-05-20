// src/components/layout/DoctorLayout.tsx
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Mic,
  FileText,
  Brain,
  ClipboardList,
  History,
  Settings,
  Users,
  LogOut,
  Calendar,
  CalendarDays,
  UserPlus,
} from "lucide-react";
import ProductLogo from "../common/ProductLogo";

interface DoctorLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onLogout: () => void;
  doctorName?: string;
  doctorEmail?: string;
}

export default function DoctorLayout({
  children,
  activePage,
  onLogout,
  doctorName = "Dr. Ahmed Hassan",
  doctorEmail = "ahmed@hospital.com",
}: DoctorLayoutProps) {
  const navigate = useNavigate();
  const initials = doctorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const mainNav = [
    { id: "dashboard",    label: "Dashboard",      icon: LayoutDashboard },
    { id: "patients",     label: "Patients",        icon: Users           },
    { id: "assistants",   label: "My Assistants",   icon: UserPlus        },
    { id: "appointments", label: "Appointments",    icon: Calendar        },
    { id: "availability", label: "Availability",    icon: CalendarDays    },
  ];

  const consultationNav = [
    { id: "recording",    label: "Recording",    icon: Mic          },
    { id: "transcript",   label: "Transcript",   icon: FileText     },
    { id: "extraction",   label: "AI Extraction",icon: Brain        },
    { id: "notes",        label: "SOAP Notes",   icon: ClipboardList},
    { id: "prescription", label: "Prescription", icon: FileText     },
  ];

  const bottomNav = [
    { id: "history",  label: "History",  icon: History  },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const consultationPages = [
    "recording", "transcript", "extraction", "notes", "prescription",
  ];
  const isInConsultation = consultationPages.includes(activePage);

  return (
    <div className="page-root">
      {/* ── Sidebar ── */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <ProductLogo className="sidebar-logo-icon" />
          <div>
            <div className="sidebar-logo-text">MedScribe AI</div>
            <div className="sidebar-logo-sub">Clinical Platform</div>
          </div>
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">{doctorName}</div>
            <div className="sidebar-user-role">Doctor</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>

          {mainNav.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/doctor/${item.id}`)}
              className={`sidebar-nav-item ${
                activePage === item.id && !isInConsultation
                  ? "sidebar-nav-item-active"
                  : ""
              }`}
            >
              <item.icon className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
              {activePage === item.id && !isInConsultation && (
                <span className="sidebar-nav-indicator" />
              )}
            </button>
          ))}

          {/* Consultation flow */}
          {isInConsultation && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 8 }}>
                Consultation Flow
              </div>
              {consultationNav.map((item) => {
                const isActive    = activePage === item.id;
                const stepIndex   = consultationPages.indexOf(item.id);
                const currentIndex = consultationPages.indexOf(activePage);
                const isCompleted = stepIndex < currentIndex;
                const isUpcoming  = stepIndex > currentIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => { if (!isUpcoming) navigate(`/doctor/${item.id}`); }}
                    disabled={isUpcoming}
                    className={`sidebar-nav-item ${isActive ? "sidebar-nav-item-active" : ""} ${isUpcoming ? "dl-nav-upcoming" : ""}`}
                  >
                    <item.icon className={`sidebar-nav-icon ${isCompleted ? "dl-icon-completed" : ""}`} />
                    <span className="sidebar-nav-label">{item.label}</span>
                    {isActive    && <span className="sidebar-nav-indicator" />}
                    {isCompleted && !isActive && <span className="dl-check">✓</span>}
                  </button>
                );
              })}
            </>
          )}

          {/* General */}
          <div className="sidebar-section-label" style={{ marginTop: 8 }}>
            General
          </div>
          {bottomNav.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/doctor/${item.id}`)}
              className={`sidebar-nav-item ${activePage === item.id ? "sidebar-nav-item-active" : ""}`}
            >
              <item.icon className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
              {activePage === item.id && <span className="sidebar-nav-indicator" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={onLogout}>
            <LogOut className="sidebar-logout-icon" />
            <span>Sign Out</span>
          </button>
          <div className="sidebar-ornament">
            <span className="sidebar-ornament-line" />
            <span className="sidebar-ornament-dot" />
            <span className="sidebar-ornament-line" />
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="page-main">{children}</main>
    </div>
  );
}
