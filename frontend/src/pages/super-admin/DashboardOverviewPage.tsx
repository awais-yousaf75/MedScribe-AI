import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Building2,
  Users,
  Clock,
  Activity,
  LoaderCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

type SystemStats = {
  totalAdmins: number;
  totalHospitals: number;
  totalUsers: number;
  pendingApprovals: number;
};

interface DashboardOverviewPageProps {}

import { API_URL } from "@/lib/constants";

export function DashboardOverviewPage({}: DashboardOverviewPageProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats>({
    totalAdmins: 0,
    totalHospitals: 0,
    totalUsers: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/superadmin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load stats");
      setStats({
        totalAdmins:      data.totalAdmins      || 0,
        totalHospitals:   data.totalHospitals   || 0,
        totalUsers:       data.totalUsers       || 0,
        pendingApprovals: data.pendingApprovals || 0,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="page-main">
        <div className="do-loading-screen">
          <LoaderCircle size={36} className="animate-spin do-loading-icon" />
          <p className="do-loading-text">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label:  "Hospital Admins",
      value:  stats.totalAdmins,
      icon:   Shield,
      action: () => navigate("../admins-management"),
    },
    {
      label:  "Total Hospitals",
      value:  stats.totalHospitals,
      icon:   Building2,
      action: () => navigate("../hospitals-management"),
    },
    {
      label:  "System Users",
      value:  stats.totalUsers,
      icon:   Users,
      action: () => navigate("../users-management"),
    },
    {
      label:  "Pending Approvals",
      value:  stats.pendingApprovals,
      icon:   Clock,
      action: () => navigate("../pending-approvals"),
    },
  ];

  const quickActions = [
    { label: "Manage Admins",     description: "View all hospital admins",  icon: Shield,    action: () => navigate("../admins-management")    },
    { label: "Manage Hospitals",  description: "View all hospitals",         icon: Building2, action: () => navigate("../hospitals-management") },
    { label: "Manage Users",      description: "View all system users",      icon: Users,     action: () => navigate("../users-management")     },
    { label: "Pending Approvals", description: "Review items pending review",icon: Clock,     action: () => navigate("../pending-approvals")    },
  ];

  return (
    <div className="page-main">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Activity size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Dashboard Overview</div>
              <div className="page-header-sub">
                Real-time system statistics and key metrics
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content">

        {/* Stats Grid */}
        <div className="stat-grid">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                type="button"
                onClick={card.action}
                className="stat-card do-stat-btn"
              >
                <div className="do-stat-top">
                  <div className="icon-wrap icon-wrap-sm icon-wrap-muted">
                    <Icon size={16} color="var(--ms-teal)" />
                  </div>
                </div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-navy">
                <Activity size={18} color="var(--ms-teal)" />
              </div>
              <div>
                <div className="card-title">Quick Actions</div>
                <div className="card-subtitle">Navigate to key sections</div>
              </div>
            </div>
          </div>

          <div className="do-qa-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.action}
                  className="do-qa-btn"
                >
                  <div className="icon-wrap icon-wrap-sm icon-wrap-muted do-qa-icon">
                    <Icon size={15} color="var(--ms-teal)" />
                  </div>
                  <div className="do-qa-label">{action.label}</div>
                  <div className="do-qa-sub">{action.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* System Health */}
        <div className="card do-health-card">
          <div className="do-health-inner">
            <div className="icon-wrap icon-wrap-lg icon-wrap-teal">
              <CheckCircle size={24} color="#fff" />
            </div>
            <div className="do-health-content">
              <div className="do-health-title">System Operational</div>
              <div className="do-health-sub">
                All services running normally.{" "}
                {stats.pendingApprovals > 0
                  ? `${stats.pendingApprovals} item${stats.pendingApprovals !== 1 ? "s" : ""} pending review.`
                  : "No pending items."}
              </div>
              {stats.pendingApprovals > 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm do-health-btn"
                  onClick={() => navigate("../pending-approvals")}
                >
                  Review Pending Items
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardOverviewPage;