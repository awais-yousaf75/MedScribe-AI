// pages/DashboardOverviewPage.tsx
import React, { useState, useEffect } from "react";
import {
  Shield,
  Building2,
  Users,
  Clock,
  TrendingUp,
  Activity,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

type SystemStats = {
  totalAdmins: number;
  totalHospitals: number;
  totalUsers: number;
  pendingApprovals: number;
};

interface DashboardOverviewPageProps {
  onNavigate: (page: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function DashboardOverviewPage({
  onNavigate,
}: DashboardOverviewPageProps) {
  const [stats, setStats] = useState<SystemStats>({
    totalAdmins: 0,
    totalHospitals: 0,
    totalUsers: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/superadmin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stats");
      setStats({
        totalAdmins: data.totalAdmins || 0,
        totalHospitals: data.totalHospitals || 0,
        totalUsers: data.totalUsers || 0,
        pendingApprovals: data.pendingApprovals || 0,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Hospital Admins",
      value: stats.totalAdmins,
      icon: Shield,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      textColor: "text-purple-700",
      action: () => onNavigate("admins-management"),
    },
    {
      label: "Total Hospitals",
      value: stats.totalHospitals,
      icon: Building2,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      textColor: "text-blue-700",
      action: () => onNavigate("hospitals-management"),
    },
    {
      label: "System Users",
      value: stats.totalUsers,
      icon: Users,
      gradient: "from-teal-500 to-teal-600",
      bgGradient: "from-teal-50 to-teal-100",
      textColor: "text-teal-700",
      action: () => onNavigate("users-management"),
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: Clock,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      textColor: "text-orange-700",
      action: () => onNavigate("pending-approvals"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Activity className="w-8 h-8 text-white" />
            <h1 className="text-3xl text-white font-bold">
              Dashboard Overview
            </h1>
          </div>
          <p className="text-white/90 text-lg">
            Real-time system statistics and key metrics
          </p>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={idx}
                onClick={card.action}
                className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 shadow-lg text-white relative overflow-hidden group cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-10 h-10 opacity-80" />
                    <TrendingUp className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-4xl font-bold mb-2">{card.value}</p>
                  <p className="text-sm text-white/90">{card.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "View All Admins",
                description: "Manage hospital admins",
                action: () => onNavigate("admins-management"),
                icon: Shield,
                color: "purple",
              },
              {
                label: "View All Hospitals",
                description: "Manage all hospitals",
                action: () => onNavigate("hospitals-management"),
                icon: Building2,
                color: "blue",
              },
              {
                label: "View All Users",
                description: "Manage system users",
                action: () => onNavigate("users-management"),
                icon: Users,
                color: "teal",
              },
              {
                label: "Pending Approvals",
                description: "Review pending items",
                action: () => onNavigate("pending-approvals"),
                icon: Clock,
                color: "orange",
              },
            ].map((action, idx) => {
              const colorMap: Record<string, string> = {
                purple:
                  "from-purple-50 to-purple-100 text-purple-600 border-purple-200",
                blue: "from-blue-50 to-blue-100 text-blue-600 border-blue-200",
                teal: "from-teal-50 to-teal-100 text-teal-600 border-teal-200",
                orange:
                  "from-orange-50 to-orange-100 text-orange-600 border-orange-200",
              };
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={action.action}
                  className={`bg-gradient-to-br ${colorMap[action.color]} border-2 rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:scale-102 group`}
                >
                  <Icon className="w-6 h-6 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-sm mb-1">{action.label}</p>
                  <p className="text-xs opacity-70">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-3xl p-8 border-2 border-green-200 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                System Healthy
              </h3>
              <p className="text-green-700 mb-3">
                All systems operational. {stats.pendingApprovals} items pending
                review.
              </p>
              <Button
                onClick={() => onNavigate("pending-approvals")}
                className="rounded-xl bg-gradient-to-r from-green-600 to-teal-600 hover:shadow-lg text-white border-0"
              >
                Review Pending Items →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverviewPage;
