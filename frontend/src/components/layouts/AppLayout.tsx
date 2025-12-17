// src/components/layout/AppLayout.tsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { Button } from "../ui/button";

export function AppLayout() {
  const { profile, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Simple role-based nav (extend as needed)
  const navItems =
    role === "doctor"
      ? [{ label: "Dashboard", to: "/doctor/dashboard" }]
      : role === "doctor_assistant"
      ? [{ label: "Dashboard", to: "/assistant/dashboard" }]
      : role === "hospital_admin"
      ? [{ label: "Dashboard", to: "/hospital-admin/dashboard" }]
      : role === "super_admin"
      ? [{ label: "Dashboard", to: "/super-admin/dashboard" }]
      : [{ label: "Dashboard", to: "/app/dashboard" }];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900">MedScribe AI</span>
            {role && (
              <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                {role.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-sm text-slate-700">
                {profile.full_name}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto flex gap-6 px-4 py-6">
          <nav className="w-48 shrink-0 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "block rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}