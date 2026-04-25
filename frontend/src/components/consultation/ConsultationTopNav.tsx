import { Activity, LayoutDashboard, History, Settings, LogOut } from "lucide-react";

interface ConsultationTopNavProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  doctorName?: string;
  doctorSubtitle?: string;
}

export default function ConsultationTopNav({
  onNavigate,
  onLogout,
  doctorName = "Doctor",
  doctorSubtitle = "MedScribe AI",
}: ConsultationTopNavProps) {
  const initials = doctorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">MedScribe AI</h1>
            <p className="text-xs text-muted-foreground">
              Clinical Intelligence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate("history")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <History className="w-4 h-4" />
            <span className="text-sm">History</span>
          </button>

          <button
            onClick={() => onNavigate("settings")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>

          <div className="h-8 w-px bg-gray-200" />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm">{doctorName}</p>
              <p className="text-xs text-muted-foreground">{doctorSubtitle}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] flex items-center justify-center text-white">
              {initials || "DR"}
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}