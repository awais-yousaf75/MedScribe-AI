import React from "react";
import {
  LayoutDashboard,
  Stethoscope,
  UserCog,
  Building2,
  LogOut,
  ChevronRight,
  Activity,
  Settings,
} from "lucide-react";
import { Button } from "../ui/button";

type Accent = "teal" | "blue" | "purple" | "indigo" | "gray";

type Item = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: Accent;
};

const items: Item[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Hospital summary",
    icon: LayoutDashboard,
    accent: "teal",
  },
  {
    id: "doctors",
    label: "Doctors",
    description: "Create & manage doctors",
    icon: Stethoscope,
    accent: "blue",
  },
  {
    id: "assistants",
    label: "Assistants",
    description: "Create, link & manage assistants",
    icon: UserCog,
    accent: "purple",
  },
  {
    id: "hospital-profile",
    label: "Hospital Profile",
    description: "Hospital identity & contact",
    icon: Building2,
    accent: "indigo",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Profile & account security",
    icon: Settings,
    accent: "gray",
  },
];

const accentStyles: Record<Accent, { ring: string; grad: string }> = {
  teal: { ring: "ring-teal-200", grad: "from-teal-600 to-cyan-600" },
  blue: { ring: "ring-blue-200", grad: "from-blue-600 to-cyan-600" },
  purple: { ring: "ring-purple-200", grad: "from-purple-600 to-pink-600" },
  indigo: { ring: "ring-indigo-200", grad: "from-indigo-600 to-purple-600" },
  gray: { ring: "ring-gray-200", grad: "from-gray-700 to-gray-900" },
};

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
            <p className="text-gray-900 font-extrabold text-base leading-tight">
              MedScribe
            </p>
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
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = currentPage === it.id;
          const accent = accentStyles[it.accent];

          return (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              className={`w-full rounded-2xl px-4 py-3.5 border transition-all
                flex items-center gap-3 text-left group ${
                  active
                    ? `bg-gradient-to-r ${accent.grad} text-white border-transparent shadow-md ring-4 ${accent.ring}`
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  active
                    ? "bg-white/15"
                    : "bg-gray-100 group-hover:bg-gray-200"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active ? "text-white" : "text-gray-700"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    active ? "text-white" : "text-gray-900"
                  }`}
                >
                  {it.label}
                </p>
                <p
                  className={`text-xs truncate mt-0.5 ${
                    active ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {it.description}
                </p>
              </div>

              {active && (
                <ChevronRight className="w-4 h-4 text-white/80 flex-shrink-0" />
              )}
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