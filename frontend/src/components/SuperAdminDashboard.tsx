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
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import Sidebar from "./layout/Sidebar";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type PendingHospitalAdmin = {
  id: string;
  full_name: string;
  phone?: string;
  gender?: string;
  dob?: string;
  approval_status: "pending" | "approved" | "rejected";
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
    status: "pending" | "approved" | "rejected";
    admin_profile_id: string;
  } | null;
};

type PendingHospital = {
  id: string;
  name: string;
  address: string | null;
  hospital_type: string | null;
  status: "pending" | "approved" | "rejected";
  admin_profile_id: string;
  admin: {
    id: string;
    full_name: string;
    phone?: string;
    approval_status: "pending" | "approved" | "rejected";
    role: string;
  } | null;
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
};

type SystemHospital = {
  id: string;
  name: string;
  address: string | null;
  hospital_type: string | null;
  status: "pending" | "approved" | "rejected";
  admin_profile_id: string;
  admin: {
    id: string;
    full_name: string;
    phone?: string;
    approval_status: "pending" | "approved" | "rejected";
    role: string;
  } | null;
};

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Normalize for duplicate checks (case-insensitive + trim + collapse spaces)
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function SuperAdminDashboard({
  onNavigate,
  onLogout,
}: SuperAdminDashboardProps) {
  // Search states
  const [searchUsers, setSearchUsers] = useState("");
  const [searchHospitals, setSearchHospitals] = useState("");
  const [hospitalStatusFilter, setHospitalStatusFilter] = useState("all");

  // Data states
  const [admins, setAdmins] = useState<PendingHospitalAdmin[]>([]);
  const [hospitals, setHospitals] = useState<PendingHospital[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [allHospitals, setAllHospitals] = useState<SystemHospital[]>([]);

  // Loading states
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAllHospitals, setLoadingAllHospitals] = useState(false);

  const getToken = () => localStorage.getItem("accessToken");

  // ─────────────────────────────────────────────────────────────
  // DUPLICATE / RULE VIOLATION MAPS (computed client-side)
  // ─────────────────────────────────────────────────────────────

  const approvedHospitals = useMemo(
    () => allHospitals.filter((h) => h.status === "approved"),
    [allHospitals]
  );

  const approvedNameSet = useMemo(() => {
    return new Set(approvedHospitals.map((h) => norm(h.name)));
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
      const raw = data.users as AppUser[];
      setUsers(
        raw.filter(
          (u) => u.role !== "super_admin" && u.approval_status === "approved"
        )
      );
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

  useEffect(() => {
    fetchPendingAdmins();
    fetchPendingHospitals();
    fetchAllUsers();
    fetchAllHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ACTION HANDLERS: ADMINS
  // ─────────────────────────────────────────────────────────────

  const handleApproveAdmin = async (profileId: string) => {
    const token = getToken();
    if (!token) return;

    // client-side protection (admin already manages an approved hospital)
    const existing = approvedHospitalByAdmin.get(profileId);
    if (existing) {
      toast.error(
        `Cannot approve: this admin already manages "${existing.name}". One admin can manage only one hospital.`
      );
      return;
    }

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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve admin");
    }
  };

  const handleRejectAdmin = async (profileId: string) => {
    const token = getToken();
    if (!token) return;
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject admin");
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
      const duplicateApproved = approvedNameSet.has(key);
      const adminApproved = approvedHospitalByAdmin.get(target.admin_profile_id);
      const adminAlreadyHasApproved =
        !!adminApproved && adminApproved.id !== target.id;

      if (duplicateApproved) {
        toast.error(
          `Cannot approve: "${target.name}" is already approved in the system (duplicate hospital).`
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve hospital");
    }
  };

  const handleRejectHospital = async (hospitalId: string) => {
    const token = getToken();
    if (!token) return;
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject hospital");
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleUpdateUserApproval = async (userId: string, status: "rejected") => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/superadmin/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approval_status: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      toast.success(`User marked as ${status}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update user status");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-gray-400">-</span>;

    const config: Record<string, { gradient: string; icon: typeof CheckCircle }> =
      {
        approved: {
          gradient: "from-green-50 to-emerald-50 text-green-700 border-green-200",
          icon: CheckCircle,
        },
        pending: {
          gradient: "from-yellow-50 to-orange-50 text-yellow-700 border-yellow-200",
          icon: Clock,
        },
        rejected: {
          gradient: "from-red-50 to-pink-50 text-red-700 border-red-200",
          icon: XCircle,
        },
      };

    const { gradient, icon: Icon } = config[status] || config.pending;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm bg-gradient-to-r ${gradient}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role?: string | null) => {
    if (!role) return <span className="text-xs text-gray-400">-</span>;

    const config: Record<string, string> = {
      super_admin: "from-purple-100 to-purple-200 text-purple-700 border-purple-300",
      hospital_admin: "from-blue-100 to-blue-200 text-blue-700 border-blue-300",
      doctor: "from-teal-100 to-teal-200 text-teal-700 border-teal-300",
      doctor_assistant: "from-orange-100 to-orange-200 text-orange-700 border-orange-300",
      patient: "from-gray-100 to-gray-200 text-gray-700 border-gray-300",
    };

    const gradient = config[role] || config.patient;

    return (
      <span
        className={`px-3 py-1 rounded-lg text-xs font-medium shadow-sm bg-gradient-to-r border capitalize ${gradient}`}
      >
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
    const matchesSearch = h.name.toLowerCase().includes(searchHospitals.toLowerCase());
    const matchesStatus = hospitalStatusFilter === "all" || h.status === hospitalStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPendingApprovals = admins.length + hospitals.length;

  // ─────────────────────────────────────────────────────────────
  // RENDER
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
        {/* Header */}
        <div
          className="p-8 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)",
          }}
        >
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-semibold text-white">
                Super Admin Dashboard
              </h1>
            </div>
            <p className="text-white/90">
              Manage all users, hospitals, and system-wide approvals
            </p>
          </div>
        </div>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Shield className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">{admins.length}</p>
                <p className="text-xs opacity-90">Pending Admins</p>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Building2 className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">{allHospitals.length}</p>
                <p className="text-xs opacity-90">Total Hospitals</p>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Users className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">{users.length}</p>
                <p className="text-xs opacity-90">Approved Users</p>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Clock className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">{totalPendingApprovals}</p>
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
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                    }}
                  >
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Pending Hospital Admins
                    </h2>
                    <p className="text-sm text-gray-500">
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
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingAdmins ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {loadingAdmins ? (
                <div className="text-center py-8 text-gray-500">Loading admins...</div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No pending hospital admins at the moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Admin Name</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Contact</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Hospital</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Type</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Admin Status</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Hospital Status</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => {
                        const adminAlreadyHasApproved = approvedHospitalByAdmin.get(admin.id);
                        const hospitalName = admin.hospital?.name ?? "";
                        const nameKey = hospitalName ? norm(hospitalName) : "";
                        const duplicateApprovedName =
                          hospitalName ? approvedNameSet.has(nameKey) : false;

                        const blockApprove = !!adminAlreadyHasApproved;

                        const warnReason =
                          adminAlreadyHasApproved
                            ? `Admin already manages "${adminAlreadyHasApproved.name}".`
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
                                <p className="font-semibold text-gray-800">{admin.full_name}</p>
                                {warnReason && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border"
                                    style={{
                                      background: "linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)",
                                      borderColor: "#fca5a5",
                                      color: "#dc2626",
                                    }}
                                    title={warnReason}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    Check
                                  </span>
                                )}
                              </div>
                              {warnReason && <p className="text-xs mt-1 text-red-600">{warnReason}</p>}
                            </td>

                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-600">{admin.phone || "No phone"}</p>
                            </td>

                            <td className="py-4 px-4">
                              <p className="text-sm font-medium text-gray-800">
                                {admin.hospital?.name || "Pending hospital"}
                              </p>
                              {admin.hospital?.address && (
                                <p className="text-xs text-gray-500">{admin.hospital.address}</p>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-500">
                                {admin.hospital?.hospital_type || "-"}
                              </p>
                            </td>

                            <td className="py-4 px-4">{getStatusBadge(admin.approval_status)}</td>
                            <td className="py-4 px-4">{getStatusBadge(admin.hospital?.status)}</td>

                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveAdmin(admin.id)}
                                  disabled={blockApprove}
                                  className="rounded-xl text-white border-0 disabled:opacity-50"
                                  style={{
                                    background: blockApprove
                                      ? "#9ca3af"
                                      : "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                                  }}
                                  title={blockApprove ? warnReason || "Blocked" : "Approve admin"}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => handleRejectAdmin(admin.id)}
                                  className="rounded-xl text-white border-0"
                                  style={{
                                    background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
                                  }}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
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
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)",
                    }}
                  >
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #14b8a6 0%, #10b981 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Pending Hospitals
                    </h2>
                    <p className="text-sm text-gray-500">
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
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingHospitals ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {loadingHospitals ? (
                <div className="text-center py-8 text-gray-500">Loading hospitals...</div>
              ) : hospitals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No pending hospitals at the moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Hospital Name</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Type</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Address</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Admin</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Status</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hospitals.map((h) => {
                        const key = norm(h.name);
                        const duplicateApproved = approvedNameSet.has(key);
                        const duplicatePending = (pendingNameCounts.get(key) || 0) > 1;

                        const adminApproved = approvedHospitalByAdmin.get(h.admin_profile_id);
                        const adminAlreadyHasApproved =
                          !!adminApproved && adminApproved.id !== h.id;

                        const blockApprove = duplicateApproved || adminAlreadyHasApproved;

                        const reason =
                          duplicateApproved
                            ? `Blocked: "${h.name}" already exists as an approved hospital.`
                            : adminAlreadyHasApproved
                              ? `Blocked: admin already manages "${adminApproved?.name}".`
                              : duplicatePending
                                ? `Warning: multiple pending requests with the same name.`
                                : null;

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
                                <p className="font-semibold text-gray-800">{h.name}</p>
                                {(blockApprove || duplicatePending) && (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border"
                                    style={{
                                      background: blockApprove
                                        ? "linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)"
                                        : "linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)",
                                      borderColor: blockApprove ? "#fca5a5" : "#fcd34d",
                                      color: blockApprove ? "#dc2626" : "#d97706",
                                    }}
                                    title={reason || undefined}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    {blockApprove ? "Blocked" : "Duplicate"}
                                  </span>
                                )}
                              </div>
                              {reason && <p className="text-xs mt-1 text-red-600">{reason}</p>}
                            </td>

                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-500">{h.hospital_type || "-"}</p>
                            </td>

                            <td className="py-4 px-4">
                              <p className="text-sm text-gray-500">{h.address || "-"}</p>
                            </td>

                            <td className="py-4 px-4">
                              <p className="text-sm font-medium text-gray-800">
                                {h.admin?.full_name || "Unknown admin"}
                              </p>
                              {h.admin?.phone && (
                                <p className="text-xs text-gray-500">{h.admin.phone}</p>
                              )}
                            </td>

                            <td className="py-4 px-4">{getStatusBadge(h.status)}</td>

                            <td className="py-4 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveHospital(h.id)}
                                  disabled={blockApprove}
                                  className="rounded-xl text-white border-0 disabled:opacity-50"
                                  style={{
                                    background: blockApprove
                                      ? "#9ca3af"
                                      : "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                                  }}
                                  title={blockApprove ? reason || "Blocked" : "Approve hospital"}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => handleRejectHospital(h.id)}
                                  className="rounded-xl text-white border-0"
                                  style={{
                                    background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
                                  }}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-4 text-xs text-gray-500">
                    <p className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      “Blocked” means approval would violate system rules:
                      duplicate hospital name or admin already manages another hospital.
                    </p>
                  </div>
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
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)" }}
                  >
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      All Users
                    </h2>
                    <p className="text-sm text-gray-500">Manage all approved system users</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      className="pl-10 h-11 border-2 focus:border-purple-400"
                      style={{ background: "linear-gradient(90deg, #fafafa 0%, #faf5ff 100%)" }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAllUsers}
                    disabled={loadingUsers}
                    className="rounded-xl"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Full Name</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Email</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Role</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Status</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Last Sign In</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500 text-right">Actions</th>
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
                            {user.phone && (
                              <p className="text-xs text-gray-500">{user.phone}</p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">{user.email || "-"}</p>
                          </td>
                          <td className="py-4 px-4">{getRoleBadge(user.role)}</td>
                          <td className="py-4 px-4">{getStatusBadge(user.approval_status)}</td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">
                              {user.last_sign_in_at || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateUserApproval(user.id, "rejected")}
                                className="rounded-xl text-amber-600 hover:bg-amber-50"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id)}
                                className="rounded-xl text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)" }}
                  >
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      All Hospitals
                    </h2>
                    <p className="text-sm text-gray-500">View and manage all hospitals</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <select
                    value={hospitalStatusFilter}
                    onChange={(e) => setHospitalStatusFilter(e.target.value)}
                    className="h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium focus:border-green-400 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search hospitals..."
                      value={searchHospitals}
                      onChange={(e) => setSearchHospitals(e.target.value)}
                      className="pl-10 h-11 border-2 focus:border-green-400"
                      style={{ background: "linear-gradient(90deg, #fafafa 0%, #f0fdf4 100%)" }}
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAllHospitals}
                    disabled={loadingAllHospitals}
                    className="rounded-xl"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAllHospitals ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              {loadingAllHospitals ? (
                <div className="text-center py-8 text-gray-500">Loading hospitals...</div>
              ) : filteredHospitals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No hospitals found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Hospital Name</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Type</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Address</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Admin</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.map((hospital) => (
                        <tr
                          key={hospital.id}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-teal-50/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-semibold text-gray-800">{hospital.name}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">{hospital.hospital_type || "-"}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">{hospital.address || "-"}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-gray-800">
                              {hospital.admin?.full_name || "Unknown admin"}
                            </p>
                            {hospital.admin?.phone && (
                              <p className="text-xs text-gray-500">{hospital.admin.phone}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              Admin: {hospital.admin?.approval_status || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">{getStatusBadge(hospital.status)}</td>
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