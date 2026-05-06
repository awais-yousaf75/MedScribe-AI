import React from "react";
import {
  LayoutDashboard,
  Stethoscope,
  UserCog,
  Building2,
  LogOut,
  ChevronRight,
  Settings,
  HeartPulse,
} from "lucide-react";

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
    description: "Link & manage assistants",
    icon: UserCog,
    accent: "purple",
  },
  {
    id: "hospital-profile",
    label: "Hospital Profile",
    description: "Identity & contact info",
    icon: Building2,
    accent: "indigo",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Profile & security",
    icon: Settings,
    accent: "gray",
  },
];

const accentMap: Record<
  Accent,
  { activeBg: string; activeRing: string; iconBg: string; dot: string }
> = {
  teal: {
    activeBg:   "from-teal-500 to-cyan-500",
    activeRing: "ring-teal-100",
    iconBg:     "bg-teal-50 text-teal-600",
    dot:        "bg-teal-500",
  },
  blue: {
    activeBg:   "from-blue-500 to-cyan-500",
    activeRing: "ring-blue-100",
    iconBg:     "bg-blue-50 text-blue-600",
    dot:        "bg-blue-500",
  },
  purple: {
    activeBg:   "from-violet-500 to-purple-500",
    activeRing: "ring-violet-100",
    iconBg:     "bg-violet-50 text-violet-600",
    dot:        "bg-violet-500",
  },
  indigo: {
    activeBg:   "from-indigo-500 to-blue-500",
    activeRing: "ring-indigo-100",
    iconBg:     "bg-indigo-50 text-indigo-600",
    dot:        "bg-indigo-500",
  },
  gray: {
    activeBg:   "from-gray-700 to-gray-800",
    activeRing: "ring-gray-200",
    iconBg:     "bg-gray-100 text-gray-600",
    dot:        "bg-gray-500",
  },
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
    <aside className="fixed left-0 top-0 h-screen w-72 flex flex-col z-50"
      style={{ background: "#0f172a" }}>

      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        {/* Logo row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}>
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-[15px] leading-tight tracking-tight">
              MedScribe
            </p>
            <p className="text-slate-400 text-[11px] font-medium mt-0.5">
              Hospital Admin
            </p>
          </div>
        </div>

        {/* User card */}
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}>
              {userName?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">
                {userName}
              </p>
              <p className="text-slate-400 text-[11px] truncate mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          {/* Online pill */}
          <div className="flex items-center gap-2 mt-3 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium">
              Active session
            </span>
          </div>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="mx-5 mb-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

      {/* ── Nav label ─────────────────────────────────────── */}
      <p className="px-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        Navigation
      </p>

      {/* ── Menu ──────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
        {items.map((item) => {
          const Icon   = item.icon;
          const active = currentPage === item.id;
          const ac     = accentMap[item.accent];

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl
                transition-all duration-200 text-left group relative
                ${active
                  ? `bg-gradient-to-r ${ac.activeBg} shadow-lg ring-4 ${ac.activeRing}`
                  : "hover:bg-white/5"
                }`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                flex-shrink-0 transition-all
                ${active ? "bg-white/20" : ac.iconBg}`}>
                <Icon className={`w-4 h-4 ${active ? "text-white" : ""}`} />
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight truncate
                  ${active ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                  {item.label}
                </p>
                <p className={`text-[11px] truncate mt-0.5
                  ${active ? "text-white/70" : "text-slate-500 group-hover:text-slate-400"}`}>
                  {item.description}
                </p>
              </div>

              {/* Arrow */}
              {active && (
                <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Logout ────────────────────────────────────────── */}
      <div className="p-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            text-sm font-semibold text-rose-400 transition-all
            hover:bg-rose-500/10 hover:text-rose-300"
          style={{ border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default HospitalAdminSidebar;