import React from "react";
import {
  LayoutDashboard,
  Stethoscope,
  UserCog,
  Building2,
  LogOut,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Button } from "../ui/button";

type Item = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
};

const items: Item[] = [
  { id: "overview", label: "Overview", description: "Hospital summary", icon: LayoutDashboard },
  { id: "pending-doctors", label: "Pending Doctors", description: "Approve/reject doctors", icon: Stethoscope },
  { id: "pending-assistants", label: "Pending Assistants", description: "Approve/reject assistants", icon: UserCog },
  { id: "hospital-profile", label: "Hospital Profile", description: "View hospital details", icon: Building2 },
];

export function HospitalAdminSidebar({
  currentPage,
  onNavigate,
  onLogout,
  userName,
  subtitle,
}: {
  currentPage: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  userName: string;
  subtitle: string;
}) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 shadow-sm flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-teal-200">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-900 font-extrabold text-base leading-tight">MedScribe</p>
            <p className="text-gray-500 text-xs font-medium">Hospital Admin</p>
          </div>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
          <p className="text-gray-900 font-bold text-sm truncate">{userName}</p>
          <p className="text-gray-600 text-xs truncate mt-0.5">{subtitle}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = currentPage === it.id;

          return (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              className={`w-full rounded-2xl px-4 py-3.5 border transition-all flex items-center gap-3 text-left ${
                active
                  ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-teal-200 shadow-md shadow-teal-200"
                  : "bg-white text-gray-700 border-transparent hover:bg-gray-100"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  active ? "bg-white/15" : "bg-gray-100"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-600"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${active ? "text-white" : "text-gray-900"}`}>
                  {it.label}
                </p>
                <p className={`text-xs truncate mt-0.5 ${active ? "text-white/80" : "text-gray-500"}`}>
                  {it.description}
                </p>
              </div>

              {active && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={onLogout}
          className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-md hover:shadow-lg"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

export default HospitalAdminSidebar;