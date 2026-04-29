// pages/UsersManagementPage.tsx
import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

interface UsersManagementPageProps {
  onNavigate: (page: string) => void;
}

type AppUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  approval_status: string | null;
  created_at: string | null;
  hospital_name?: string | null;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function UsersManagementPage({ onNavigate }: UsersManagementPageProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUsers, setSearchUsers] = useState("");

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const token = getToken();
    if (!token) return;
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this user and all related data?",
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete user");
    }
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-gray-400">-</span>;

    const styles: Record<string, string> = {
      approved:
        "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200",
      pending:
        "bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border-yellow-200",
      rejected:
        "bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200",
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

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUsers.toLowerCase()),
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-white" />
            <h1 className="text-3xl text-white font-bold">
              All Users Management
            </h1>
          </div>
          <p className="text-white/90 text-lg">
            Manage all system users across all hospitals
          </p>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-teal-100">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-2 focus:border-teal-400 focus:outline-none"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllUsers}
              disabled={loading}
              className="rounded-xl"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No users found</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border-2 border-teal-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-200">
                  <tr className="text-left">
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">
                      User
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">
                      Contact
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">
                      Hospital
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700">
                      Created
                    </th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-cyan-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <p className="font-semibold text-gray-800">
                          {user.full_name || "(no name)"}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-600">
                          {user.email || "-"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.phone || "-"}
                        </p>
                      </td>
                      <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-600">
                          {user.hospital_name || "N/A"}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(user.approval_status)}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(user.id)}
                            className="rounded-xl hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg text-white">
            <p className="text-3xl font-bold">
              {users.filter((u) => u.role === "hospital_admin").length}
            </p>
            <p className="text-xs opacity-90">Admins</p>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 shadow-lg text-white">
            <p className="text-3xl font-bold">
              {users.filter((u) => u.role === "doctor").length}
            </p>
            <p className="text-xs opacity-90">Doctors</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 shadow-lg text-white">
            <p className="text-3xl font-bold">
              {users.filter((u) => u.role === "doctor_assistant").length}
            </p>
            <p className="text-xs opacity-90">Assistants</p>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-5 shadow-lg text-white">
            <p className="text-3xl font-bold">
              {users.filter((u) => u.role === "patient").length}
            </p>
            <p className="text-xs opacity-90">Patients</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsersManagementPage;
