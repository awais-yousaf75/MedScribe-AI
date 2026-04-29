// src/pages/SuperAdmin/UsersManagementPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Building2,
  Shield,
  Calendar,
  Hash,
  Mail,
  Phone,
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
  last_sign_in_at?: string | null;
  hospital_name?: string | null;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UsersManagementPage({
  onNavigate: _onNavigate, // avoid unused prop warning
}: UsersManagementPageProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUsers, setSearchUsers] = useState("");

  // deletion loading states
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // details modal state
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setUsers((data.users || []) as AppUser[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Patients are NOT visible in table (privacy)
  const visibleUsers = useMemo(
    () => users.filter((u) => u.role !== "patient"),
    [users],
  );

  const anyBusy = loading || bulkDeleting || !!deletingUserId;

  const handleDeleteUser = async (userId: string) => {
    const token = getToken();
    if (!token) return;

    if (deletingUserId || bulkDeleting) return;

    if (
      !window.confirm(
        "Are you sure you want to permanently delete this user and all related data?",
      )
    )
      return;

    try {
      setDeletingUserId(userId);

      const res = await fetch(`${API_URL}/api/superadmin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || "Delete failed");

      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== userId));

      // if the modal is open for this user, close it
      setSelectedUser((prev) => (prev?.id === userId ? null : prev));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteAllUsers = async () => {
    const token = getToken();
    if (!token) return;

    if (bulkDeleting || deletingUserId) return;

    const confirmText = window.prompt(
      "This will delete ALL users (except super_admin).\n\nType: DELETE_ALL_USERS to confirm",
    );
    if (confirmText !== "DELETE_ALL_USERS") return;

    try {
      setBulkDeleting(true);

      const res = await fetch(
        `${API_URL}/api/superadmin/users?confirm=DELETE_ALL_USERS`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      toast.success(
        `Deleted ${data.deleted_profiles || 0} profiles (${data.deleted_auth_users || 0} auth users)`,
      );

      setUsers([]);
      setSelectedUser(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete all users");
    } finally {
      setBulkDeleting(false);
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

  const filteredUsers = visibleUsers.filter((u) => {
    const needle = searchUsers.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(needle) ||
      (u.email || "").toLowerCase().includes(needle)
    );
  });

  // Stats (patients counted but hidden from list)
  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "hospital_admin").length;
    const doctors = users.filter((u) => u.role === "doctor").length;
    const assistants = users.filter(
      (u) => u.role === "doctor_assistant",
    ).length;
    const patients = users.filter((u) => u.role === "patient").length;
    return { admins, doctors, assistants, patients };
  }, [users]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      {/* Details Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold truncate">
                    {selectedUser.full_name || "(no name)"}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.approval_status)}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="rounded-xl hover:bg-white/15 text-white"
                  onClick={() => setSelectedUser(null)}
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">
                    Contact
                  </p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-teal-600" />
                      <span className="break-all">
                        {selectedUser.email || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-teal-600" />
                      <span>{selectedUser.phone || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">
                    Organization
                  </p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>{selectedUser.hospital_name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-600" />
                      <span>{selectedUser.role || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">
                    System
                  </p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-teal-600" />
                      <span className="font-mono break-all">
                        {selectedUser.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">
                    Activity
                  </p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      <span>
                        Created: {formatDateTime(selectedUser.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>
                        Last sign-in:{" "}
                        {formatDateTime(selectedUser.last_sign_in_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </Button>

                <Button
                  className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-lg text-white border-0 disabled:opacity-60"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  disabled={anyBusy}
                >
                  {deletingUserId === selectedUser.id ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                disabled={bulkDeleting}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleDeleteAllUsers}
                disabled={anyBusy}
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-lg text-white border-0 disabled:opacity-60"
              >
                {bulkDeleting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {bulkDeleting ? "Deleting..." : "Delete All Users"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllUsers}
                disabled={anyBusy}
                className="rounded-xl"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Note: Patient accounts are hidden from this list for privacy. Only
            aggregated patient count is shown below.
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
            <p className="text-gray-600 font-semibold">
              No users found (patients are hidden)
            </p>
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
                  {filteredUsers.map((user) => {
                    const rowDeleting = deletingUserId === user.id;

                    return (
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
                              disabled={anyBusy}
                              title="View details"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.id)}
                              className="rounded-xl hover:bg-red-50"
                              disabled={anyBusy}
                              title="Delete"
                            >
                              {rowDeleting ? (
                                <RefreshCw className="w-4 h-4 text-red-600 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-blue-100">
            <p className="text-3xl font-bold text-blue-600">{stats.admins}</p>
            <p className="text-xs text-gray-600 font-semibold">Admins</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-teal-100">
            <p className="text-3xl font-bold text-teal-600">{stats.doctors}</p>
            <p className="text-xs text-gray-600 font-semibold">Doctors</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-orange-100">
            <p className="text-3xl font-bold text-orange-600">
              {stats.assistants}
            </p>
            <p className="text-xs text-gray-600 font-semibold">Assistants</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-200">
            <p className="text-3xl font-bold text-gray-700">{stats.patients}</p>
            <p className="text-xs text-gray-600 font-semibold">
              Patients (hidden)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsersManagementPage;
