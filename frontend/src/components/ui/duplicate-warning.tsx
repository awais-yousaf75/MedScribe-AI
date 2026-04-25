// src/components/ui/duplicate-warning.tsx

import { AlertTriangle, Info, XCircle } from "lucide-react";

interface DuplicateWarningProps {
  type: "hospital" | "admin";
  status: "approved" | "pending" | "rejected";
  name: string;
  message?: string;
}

export function DuplicateWarning({ type, status, name, message }: DuplicateWarningProps) {
  const getConfig = () => {
    if (status === "approved") {
      return {
        icon: XCircle,
        bg: "from-red-50 to-red-100",
        border: "border-red-200",
        text: "text-red-700",
        title: type === "hospital" 
          ? `"${name}" is already registered`
          : `Admin already manages another hospital`,
      };
    }
    if (status === "pending") {
      return {
        icon: AlertTriangle,
        bg: "from-amber-50 to-orange-100",
        border: "border-amber-200",
        text: "text-amber-700",
        title: type === "hospital"
          ? `"${name}" has a pending registration`
          : `Admin has a pending hospital registration`,
      };
    }
    return {
      icon: Info,
      bg: "from-gray-50 to-gray-100",
      border: "border-gray-200",
      text: "text-gray-700",
      title: `"${name}" status: ${status}`,
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border bg-gradient-to-r ${config.bg} ${config.border}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />
      <div className={`text-sm ${config.text}`}>
        <p className="font-semibold">{config.title}</p>
        {message && <p className="mt-1 text-xs opacity-80">{message}</p>}
      </div>
    </div>
  );
}