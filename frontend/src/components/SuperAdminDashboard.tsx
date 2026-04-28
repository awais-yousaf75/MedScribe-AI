import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Plus,
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import Sidebar from "./layout/Sidebar";
import { HospitalRegistrationPage } from "./HospitalRegistrationPage";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type PendingHospitalAdmin = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at?: string;
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
    status: "pending" | "approved" | "rejected";
    admin_profile_id: string;
    registration_number?: string;
  } | null;
};

type PendingHospital = {
  id: string;
  name: string;
  address: string | null;
  hospital_type: string | null;
  registration_number: string;
  license_number?: string | null;
  contact_email?: string;
  contact_phone?: string;
  status: "pending" | "approved" | "rejected";
  admin_profile_id: string;
  created_at?: string;
  admin: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    approval_status: "pending" | "approved" | "rejected";
    role: string;
  } | null;
  isDuplicate?: boolean;
  duplicateType?: string | null;
  duplicateInfo?: any;
};

type AppUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  approval_status: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  hospital_name?: string | null;
};

type SystemHospital = {
  id: string;
  name: string;
  address: string | null;
  hospital_type: string | null;
  registration_number: string;
  license_number?: string | null;
  contact_email?: string;
  contact_phone?: string;
  status: "pending" | "approved" | "rejected";
  admin_profile_id: string;
  admin: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    approval_status: "pending" | "approved" | "rejected";
    role: string;
  } | null;
  doctors_count?: number;
  assistants_count?: number;
};

type SystemStats = {
  totalAdmins: number;
  totalHospitals: number;
  totalUsers: number;
  pendingApprovals: number;
};

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function SuperAdminDashboard({
  onNavigate,
  onLogout,
}: SuperAdminDashboardProps) {
  // Show registration page state
  const [showRegistrationPage, setShowRegistrationPage] = useState(false);

  // Search states
  const [searchUsers, setSearchUsers] = useState("");
  const [searchHospitals, setSearchHospitals] = useState("");
  const [hospitalStatusFilter, setHospitalStatusFilter] = useState("all");

  // Data states
  const [admins, setAdmins] = useState<PendingHospitalAdmin[]>([]);
  const [hospitals, setHospitals] = useState<PendingHospital[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [allHospitals, setAllHospitals] = useState<SystemHospital[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalAdmins: 0,
    totalHospitals: 0,
    totalUsers: 0,
    pendingApprovals: 0,
  });

  // Loading states
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAllHospitals, setLoadingAllHospitals] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Action loading states
  const [approvingAdmin, setApprovingAdmin] = useState<string | null>(null);
  const [rejectingAdmin, setRejectingAdmin] = useState<string | null>(null);
  const [approvingHospital, setApprovingHospital] = useState<string | null>(null);
  const [rejectingHospital, setRejectingHospital] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("accessToken");

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ─────────────────────────────────────────────────────────────
  // DUPLICATE / RULE VIOLATION MAPS
  // ─────────────────────────────────────────────────────────────

  const approvedHospitals = useMemo(
    () => allHospitals.filter((h) => h.status === "approved"),
    [allHospitals]
  );

  const approvedNameSet = useMemo(() => {
    return new Set(approvedHospitals.map((h) => norm(h.name)));
  }, [approvedHospitals]);

  const approvedRegistrationSet = useMemo(() => {
    return new Set(approvedHospitals.map((h) => h.registration_number));
  }, [approvedHospitals]);

  const approvedHospitalByAdmin = useMemo(() => {
    const map = new Map<string, SystemHospital>();
    for (const h of approvedHospitals) {
      if (h.admin_profile_id) map.set(h.admin_profile_id, h);
    }
    return map;
  }, [approvedHospitals]);

  const pendingNameCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of hospitals) {
      const key = norm(h.name);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [hospitals]);

  // ─────────────────────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ─────────────────────────────────────────────────────────────

  const fetchStats = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingStats(true);
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
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingAdmins = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingAdmins(true);
      const res = await fetch(
        `${API_URL}/api/superadmin/pending-hospital-admins`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load admins");
      setAdmins(data.admins as PendingHospitalAdmin[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load admins");
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchPendingHospitals = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingHospitals(true);
      const res = await fetch(`${API_URL}/api/superadmin/pending-hospitals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load hospitals");
      setHospitals(data.hospitals as PendingHospital[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load hospitals");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchAllUsers = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingUsers(true);
      const res = await fetch(`${API_URL}/api/superadmin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users as AppUser[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAllHospitals = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingAllHospitals(true);
      const res = await fetch(`${API_URL}/api/superadmin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load hospitals");
      setAllHospitals(data.hospitals as SystemHospital[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load hospitals");
    } finally {
      setLoadingAllHospitals(false);
    }
  };

  const refreshAll = () => {
    fetchStats();
    fetchPendingAdmins();
    fetchPendingHospitals();
    fetchAllUsers();
    fetchAllHospitals();
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ACTION HANDLERS: ADMINS
  // ─────────────────────────────────────────────────────────────

  const handleApproveAdmin = async (profileId: string) => {
    const token = getToken();
    if (!token) return;

    const existing = approvedHospitalByAdmin.get(profileId);
    if (existing) {
      toast.error(
        `Cannot approve: this admin already manages "${existing.name}". One admin can manage only one hospital.`
      );
      return;
    }

    setApprovingAdmin(profileId);
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospital-admins/${profileId}/approve`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || data.error || "Failed to approve admin");
        return;
      }

      toast.success("Hospital admin approved");
      setAdmins((prev) => prev.filter((a) => a.id !== profileId));
      fetchPendingHospitals();
      fetchAllUsers();
      fetchAllHospitals();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve admin");
    } finally {
      setApprovingAdmin(null);
    }
  };

  const handleRejectAdmin = async (profileId: string) => {
    const token = getToken();
    if (!token) return;

    setRejectingAdmin(profileId);
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospital-admins/${profileId}/reject`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject admin");
      toast.info("Hospital admin rejected");
      setAdmins((prev) => prev.filter((a) => a.id !== profileId));
      setHospitals((prev) =>
        prev.filter((h) => h.admin_profile_id !== profileId)
      );
      fetchAllUsers();
      fetchAllHospitals();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject admin");
    } finally {
      setRejectingAdmin(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ACTION HANDLERS: HOSPITALS
  // ─────────────────────────────────────────────────────────────

  const handleApproveHospital = async (hospitalId: string) => {
    const token = getToken();
    if (!token) return;

    const target = hospitals.find((h) => h.id === hospitalId);
    if (target) {
      const key = norm(target.name);
      const duplicateApprovedName = approvedNameSet.has(key);
      const duplicateApprovedReg = approvedRegistrationSet.has(
        target.registration_number
      );
      const adminApproved = approvedHospitalByAdmin.get(target.admin_profile_id);
      const adminAlreadyHasApproved =
        !!adminApproved && adminApproved.id !== target.id;

      if (duplicateApprovedReg) {
        toast.error(
          `Cannot approve: Registration number "${target.registration_number}" is already used by another approved hospital.`
        );
        return;
      }
      if (duplicateApprovedName) {
        toast.error(
          `Cannot approve: "${target.name}" is already approved in the system (duplicate hospital name).`
        );
        return;
      }
      if (adminAlreadyHasApproved) {
        toast.error(
          `Cannot approve: this admin already manages "${adminApproved?.name}". One admin can manage only one hospital.`
        );
        return;
      }
    }

    setApprovingHospital(hospitalId);
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospitals/${hospitalId}/approve`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || data.error || "Failed to approve hospital");
        return;
      }

      toast.success("Hospital approved");
      setHospitals((prev) => prev.filter((h) => h.id !== hospitalId));
      fetchAllHospitals();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve hospital");
    } finally {
      setApprovingHospital(null);
    }
  };

  const handleRejectHospital = async (hospitalId: string) => {
    const token = getToken();
    if (!token) return;

    setRejectingHospital(hospitalId);
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospitals/${hospitalId}/reject`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject hospital");
      toast.info("Hospital rejected");
      setHospitals((prev) => prev.filter((h) => h.id !== hospitalId));
      fetchAllHospitals();
      fetchStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject hospital");
    } finally {
      setRejectingHospital(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ACTION HANDLERS: USERS
  // ─────────────────────────────────────────────────────────────

  const handleDeleteUser = async (userId: string) => {
    const token = getToken();
    if (!token) return;
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this user and all related data?"
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/api/superadmin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setAdmins((prev) => prev.filter((a) => a.id !== userId));
      setHospitals((prev) => prev.filter((h) => h.admin_profile_id !== userId));
      setAllHospitals((prev) =>
        prev.filter((h) => h.admin_profile_id !== userId)
      );
      fetchStats();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete user");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-gray-400">-</span>;

    const styles: Record<string, string> = {
      approved:
        "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
      pending:
        "bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border-yellow-200",
      rejected: "bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200",
    };

    const icons: Record<string, typeof CheckCircle> = {
      approved: CheckCircle,
      pending: Clock,
      rejected: XCircle,
    };

    const Icon = icons[status] || Clock;
    const style = styles[status] || styles.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border shadow-sm ${style}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role?: string | null) => {
    if (!role) return <span className="text-xs text-gray-400">-</span>;

    const styles: Record<string, string> = {
      super_admin:
        "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-300",
      hospital_admin:
        "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-300",
      doctor:
        "bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 border border-teal-300",
      doctor_assistant:
        "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-300",
      patient:
        "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300",
    };

    const style = styles[role] || styles.patient;

    return (
      <span className={`px-3 py-1 rounded-lg text-xs shadow-sm ${style}`}>
        {role.replace(/_/g, " ")}
      </span>
    );
  };

  // Filter functions
  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredHospitals = allHospitals.filter((h) => {
    const matchesSearch = h.name
      .toLowerCase()
      .includes(searchHospitals.toLowerCase());
    const matchesStatus =
      hospitalStatusFilter === "all" || h.status === hospitalStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Computed stats from data
  const computedStats = {
    totalAdmins: users.filter(
      (u) =>
        u.role === "hospital_admin" && u.approval_status === "approved"
    ).length,
    totalHospitals: allHospitals.length,
    totalUsers: users.length,
    pendingApprovals: admins.length + hospitals.length,
  };

  // ─────────────────────────────────────────────────────────────
  // CONDITIONAL RENDER: Show registration page if needed
  // ─────────────────────────────────────────────────────────────

  if (showRegistrationPage) {
    return (
      <HospitalRegistrationPage
        onBack={() => {
          setShowRegistrationPage(false);
          refreshAll();
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: DASHBOARD
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      <Sidebar
        currentPage="super-admin-dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        userRole="super_admin"
        userName="Super Admin"
        userSubtitle="System Administrator"
      />

      <div className="flex-1 ml-64">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 p-8 shadow-lg">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8 text-white" />
                  <h1 className="text-3xl text-white font-semibold">
                    Super Admin Dashboard
                  </h1>
                </div>
                <p className="text-white/90">
                  Manage all users, hospitals, and system-wide approvals
                </p>
              </div>
              <Button
                onClick={() => setShowRegistrationPage(true)}
                className="rounded-xl bg-white hover:bg-gray-50 text-purple-600 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Register Hospital & Admin
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          {/* System Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Shield className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">
                  {computedStats.totalAdmins}
                </p>
                <p className="text-xs opacity-90">Hospital Admins</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Building2 className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">
                  {computedStats.totalHospitals}
                </p>
                <p className="text-xs opacity-90">Hospitals</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Users className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">
                  {computedStats.totalUsers}
                </p>
                <p className="text-xs opacity-90">Total Users</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Clock className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">
                  {computedStats.pendingApprovals}
                </p>
                <p className="text-xs opacity-90">Pending Approvals</p>
              </div>
            </div>
          </div>

          {/* Pending Hospital Admins */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl bg-clip-text text-transparent font-semibold">
                      Pending Hospital Admins
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Review and approve hospital administrator requests
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPendingAdmins}
                  disabled={loadingAdmins}
                  className="rounded-xl"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      loadingAdmins ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>

              {loadingAdmins ? (
                <div className="text-center py-8 text-gray-500">
                  Loading admins...
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No pending hospital admins at the moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Admin Name
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Contact
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Requested Hospital
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Hospital Type
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Reg #
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Status
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => {
                        const adminAlreadyHasApproved =
                          approvedHospitalByAdmin.get(admin.id);
                        const hospitalName = admin.hospital?.name ?? "";
                        const hospitalReg = admin.hospital?.registration_number ?? "";
                        const nameKey = hospitalName
                          ? norm(hospitalName)
                          : "";
                        const duplicateApprovedName = hospitalName
                          ? approvedNameSet.has(nameKey)
                          : false;
                        const duplicateApprovedReg = hospitalReg
                          ? approvedRegistrationSet.has(hospitalReg)
                          : false;

                        const blockApprove =
                          !!adminAlreadyHasApproved ||
                          duplicateApprovedName ||
                          duplicateApprovedReg;

                        const warnReason = adminAlreadyHasApproved
                          ? `Admin already manages "${adminAlreadyHasApproved.name}".`
                          : duplicateApprovedReg
                            ? `Registration number duplicates an already approved hospital.`
                            : duplicateApprovedName
                              ? `Hospital name duplicates an already approved hospital.`
                              : null;

                        return (
                          <tr
                            key={admin.id}
                            className={`border-b border-gray-100 transition-colors ${
                              warnReason
                                ? "bg-gradient-to-r from-red-50/40 to-orange-50/40"
                                : "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50"
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-800">
                                  {admin.full_name}
                                </p>
                                {warnReason && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 rounded-lg text-xs border border-orange-300">
                                    <AlertTriangle className="w-3 h-3" />
                                    Check
                                  </span>
                                )}
                              </div>
                              {warnReason && (
                                <p className="text-xs mt-1 text-red-600">
                                  {warnReason}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm">{admin.email || "-"}</p>
                              <p className="text-xs text-muted-foreground">
                                {admin.phone || "-"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-medium">
                                {admin.hospital?.name || "Pending hospital"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-muted-foreground">
                                {admin.hospital?.hospital_type || "-"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                                {admin.hospital?.registration_number || "-"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(admin.approval_status)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveAdmin(admin.id)}
                                  disabled={
                                    blockApprove ||
                                    approvingAdmin === admin.id ||
                                    rejectingAdmin === admin.id
                                  }
                                  className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg text-white border-0 disabled:opacity-50"
                                >
                                  {approvingAdmin === admin.id ? (
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRejectAdmin(admin.id)}
                                  disabled={
                                    approvingAdmin === admin.id ||
                                    rejectingAdmin === admin.id
                                  }
                                  className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg text-white border-0"
                                >
                                  {rejectingAdmin === admin.id ? (
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pending Hospitals */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-teal-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-teal-100 to-green-100 rounded-full blur-3xl opacity-30 -ml-32 -mt-32" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl bg-clip-text text-transparent font-semibold">
                      Pending Hospitals
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Approve or reject hospital registrations
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPendingHospitals}
                  disabled={loadingHospitals}
                  className="rounded-xl"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      loadingHospitals ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>

              {loadingHospitals ? (
                <div className="text-center py-8 text-gray-500">
                  Loading hospitals...
                </div>
              ) : hospitals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No pending hospitals at the moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Hospital Name
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Reg #
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Type
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Contact
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Admin
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Status
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {hospitals.map((h) => {
                        const key = norm(h.name);
                        const duplicateApprovedName = approvedNameSet.has(key);
                        const duplicateApprovedReg = approvedRegistrationSet.has(
                          h.registration_number
                        );
                        const duplicatePending =
                          (pendingNameCounts.get(key) || 0) > 1;

                        const adminApproved = approvedHospitalByAdmin.get(
                          h.admin_profile_id
                        );
                        const adminAlreadyHasApproved =
                          !!adminApproved && adminApproved.id !== h.id;

                        const blockApprove =
                          duplicateApprovedName ||
                          duplicateApprovedReg ||
                          adminAlreadyHasApproved;

                        const isDuplicate =
                          duplicateApprovedName ||
                          duplicateApprovedReg ||
                          duplicatePending;

                        return (
                          <tr
                            key={h.id}
                            className={`border-b border-gray-100 transition-colors ${
                              blockApprove || duplicatePending
                                ? "bg-gradient-to-r from-red-50/40 to-orange-50/40"
                                : "hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-green-50/50"
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-800">
                                  {h.name}
                                </p>
                                {isDuplicate && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 rounded-lg text-xs border border-orange-300">
                                    <AlertTriangle className="w-3 h-3" />
                                    Duplicate
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                                {h.registration_number}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm text-muted-foreground">
                                {h.hospital_type || "-"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-xs text-muted-foreground">
                                {h.contact_email
                                  ? h.contact_email.substring(0, 20) + "..."
                                  : "-"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {h.contact_phone || "-"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-sm font-medium">
                                {h.admin?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {h.admin?.email || "-"}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(h.status)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveHospital(h.id)}
                                  disabled={
                                    blockApprove ||
                                    approvingHospital === h.id ||
                                    rejectingHospital === h.id
                                  }
                                  className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg text-white border-0 disabled:opacity-50"
                                >
                                  {approvingHospital === h.id ? (
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRejectHospital(h.id)}
                                  disabled={
                                    approvingHospital === h.id ||
                                    rejectingHospital === h.id
                                  }
                                  className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg text-white border-0"
                                >
                                  {rejectingHospital === h.id ? (
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* All Users */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-100 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -mr-32 -mb-32" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent font-semibold">
                      All Users
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Manage all system users
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      className="pl-10 h-11 bg-gradient-to-r from-gray-50 to-purple-50 border-2 focus:border-purple-400"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAllUsers}
                    disabled={loadingUsers}
                    className="rounded-xl"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        loadingUsers ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No users found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Full Name
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Email
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Role
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Hospital
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Status
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground">
                          Created
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-muted-foreground text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-semibold text-gray-800">
                              {user.full_name || "(no name)"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">
                              {user.email || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">
                              {user.hospital_name || "N/A"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(user.approval_status)}
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => {}}
                                size="sm"
                                variant="ghost"
                                className="rounded-xl hover:bg-blue-50"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id)}
                                className="rounded-xl text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* All Hospitals */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-green-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100 to-teal-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl bg-clip-text text-transparent font-semibold">
                      All Hospitals
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      View and manage hospitals
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={hospitalStatusFilter}
                    onChange={(e) =>
                      setHospitalStatusFilter(e.target.value)
                    }
                    className="h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search hospitals..."
                      value={searchHospitals}
                      onChange={(e) =>
                        setSearchHospitals(e.target.value)
                      }
                      className="pl-10 h-11 bg-gradient-to-r from-gray-50 to-green-50 border-2 focus:border-green-400"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAllHospitals}
                    disabled={loadingAllHospitals}
                    className="rounded-xl"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        loadingAllHospitals ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {loadingAllHospitals ? (
                <div className="text-center py-8 text-gray-500">
                  Loading hospitals...
                </div>
              ) : filteredHospitals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No hospitals found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Hospital Name
                        </th>
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Reg #
                        </th>
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Type
                        </th>
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Contact Email
                        </th>
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Contact Phone
                        </th>
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Admin
                        </th>
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Doctors
                        </th>
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Assistants
                        </th>
                        <th className="py-3 px-4 font-semibold text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.map((hospital) => (
                        <tr
                          key={hospital.id}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-semibold text-gray-800">
                              {hospital.name}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                              {hospital.registration_number}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-muted-foreground">
                              {hospital.hospital_type || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-xs text-muted-foreground break-all">
                              {hospital.contact_email || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-xs text-muted-foreground">
                              {hospital.contact_phone || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium">
                              {hospital.admin?.full_name || "Unknown"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-blue-600">
                              {hospital.doctors_count ?? 0}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-purple-600">
                              {hospital.assistants_count ?? 0}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(hospital.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;