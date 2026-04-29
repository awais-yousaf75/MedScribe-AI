// components/layout/EnhancedSidebar.tsx
import React from "react";
import {
  Shield,
  Building2,
  Users,
  Clock,
  LogOut,
  ChevronRight,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { Button } from "../ui/button";

interface EnhancedSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
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
    description: "System statistics",
  },
  {
    id: "hospitals-management",
    label: "Hospitals Management",
    icon: Building2,
    description: "All hospitals",
  },
  {
    id: "admins-management",
    label: "Hospital Admins",
    icon: Shield,
    description: "Manage admins",
  },
  {
    id: "users-management",
    label: "All Users",
    icon: Users,
    description: "System users",
  },
];

export function EnhancedSidebar({
  currentPage,
  onNavigate,
  onLogout,
  userRole = "super_admin",
  userName = "Admin",
  userSubtitle = "System Administrator",
}: EnhancedSidebarProps) {
  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl border-r border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">MediAdmin</h1>
            <p className="text-gray-400 text-xs">Hospital Management</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-xl p-3 border border-purple-500/30">
          <p className="text-white font-semibold text-sm">{userName}</p>
          <p className="text-gray-300 text-xs">{userSubtitle}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-4 py-4 rounded-xl transition-all duration-200 group flex items-center justify-between ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/30"
                  : "text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className="w-5 h-5" />
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p
                    className={`text-xs ${
                      isActive ? "text-purple-100" : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-purple-200 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <Button
          onClick={onLogout}
          className="w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/30 text-white border-0"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default EnhancedSidebar;