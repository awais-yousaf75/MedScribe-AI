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
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function UsersManagementPage({
  onNavigate: _onNavigate,
}: UsersManagementPageProps) {
  const [users,         setUsers]         = useState<AppUser[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [searchUsers,   setSearchUsers]   = useState("");
  const [deletingUserId,setDeletingUserId]= useState<string | null>(null);
  const [bulkDeleting,  setBulkDeleting]  = useState(false);
  const [selectedUser,  setSelectedUser]  = useState<AppUser | null>(null);

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllUsers = async () => {
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/superadmin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers((data.users || []) as AppUser[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const visibleUsers = useMemo(
    () => users.filter((u) => u.role !== "patient"),
    [users],
  );

  const anyBusy = loading || bulkDeleting || !!deletingUserId;

  const handleDeleteUser = async (userId: string) => {
    const token = getToken();
    if (!token || deletingUserId || bulkDeleting) return;
    if (!window.confirm("Are you sure you want to permanently delete this user and all related data?")) return;
    try {
      setDeletingUserId(userId);
      const res  = await fetch(`${API_URL}/api/superadmin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Delete failed");
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUser((prev) => (prev?.id === userId ? null : prev));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteAllUsers = async () => {
    const token = getToken();
    if (!token || bulkDeleting || deletingUserId) return;
    const confirmText = window.prompt(
      "This will delete ALL users (except super_admin).\n\nType: DELETE_ALL_USERS to confirm",
    );
    if (confirmText !== "DELETE_ALL_USERS") return;
    try {
      setBulkDeleting(true);
      const res  = await fetch(`${API_URL}/api/superadmin/users?confirm=DELETE_ALL_USERS`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      toast.success(`Deleted ${data.deleted_profiles || 0} profiles (${data.deleted_auth_users || 0} auth users)`);
      setUsers([]);
      setSelectedUser(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete all users");
    } finally {
      setBulkDeleting(false);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="list-item-sub">—</span>;
    const map: Record<string, { cls: string; icon: typeof CheckCircle }> = {
      approved: { cls: "badge badge-success", icon: CheckCircle },
      pending:  { cls: "badge badge-warning", icon: Clock       },
      rejected: { cls: "badge badge-error",   icon: XCircle     },
    };
    const { cls, icon: Icon } = map[status] || map.pending;
    return (
      <span className={cls}>
        <Icon size={11} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role?: string | null) => {
    if (!role) return <span className="list-item-sub">—</span>;
    const map: Record<string, string> = {
      hospital_admin:   "badge badge-info",
      doctor:           "badge badge-success",
      doctor_assistant: "badge badge-warning",
      patient:          "badge badge-neutral",
    };
    return (
      <span className={map[role] || "badge badge-neutral"}>
        {role.replace(/_/g, " ")}
      </span>
    );
  };

  const filteredUsers = visibleUsers.filter((u) => {
    const needle = searchUsers.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(needle) ||
      (u.email    || "").toLowerCase().includes(needle)
    );
  });

  const stats = useMemo(() => ({
    admins:     users.filter((u) => u.role === "hospital_admin").length,
    doctors:    users.filter((u) => u.role === "doctor").length,
    assistants: users.filter((u) => u.role === "doctor_assistant").length,
    patients:   users.filter((u) => u.role === "patient").length,
  }), [users]);

  return (
    <div className="page-main">

      {/* ── USER DETAIL MODAL ── */}
      {selectedUser && (
        <div
          className="hd-modal-backdrop"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="hd-modal um-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="hd-modal-header">
              <div style={{ minWidth: 0 }}>
                <div className="hd-modal-title">
                  {selectedUser.full_name || "(no name)"}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {getRoleBadge(selectedUser.role)}
                  {getStatusBadge(selectedUser.approval_status)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-icon hd-modal-close"
                onClick={() => setSelectedUser(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="hd-modal-body">
              <div className="form-grid-2">

                {/* Contact */}
                <div className="info-item">
                  <div className="info-label">Contact</div>
                  <div className="um-detail-rows">
                    <div className="um-detail-row">
                      <Mail size={14} color="var(--ms-teal)" />
                      <span className="um-detail-text">{selectedUser.email || "—"}</span>
                    </div>
                    <div className="um-detail-row">
                      <Phone size={14} color="var(--ms-teal)" />
                      <span className="um-detail-text">{selectedUser.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Organization */}
                <div className="info-item">
                  <div className="info-label">Organization</div>
                  <div className="um-detail-rows">
                    <div className="um-detail-row">
                      <Building2 size={14} color="var(--ms-teal)" />
                      <span className="um-detail-text">{selectedUser.hospital_name || "N/A"}</span>
                    </div>
                    <div className="um-detail-row">
                      <Shield size={14} color="var(--ms-teal)" />
                      <span className="um-detail-text">{selectedUser.role || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* System */}
                <div className="info-item">
                  <div className="info-label">System ID</div>
                  <div className="um-detail-rows">
                    <div className="um-detail-row">
                      <Hash size={14} color="var(--ms-teal)" />
                      <span className="um-detail-text um-mono">{selectedUser.id}</span>
                    </div>
                  </div>
                </div>

                {/* Activity */}
                <div className="info-item">
                  <div className="info-label">Activity</div>
                  <div className="um-detail-rows">
                    <div className="um-detail-row">
                      <Calendar size={14} color="var(--ms-teal)" />
                      <span className="um-detail-text">Created: {formatDateTime(selectedUser.created_at)}</span>
                    </div>
                    <div className="um-detail-row">
                      <Clock size={14} color="var(--ms-teal)" />
                      <span className="um-detail-text">Last sign-in: {formatDateTime(selectedUser.last_sign_in_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="hd-modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-sm um-delete-btn"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  disabled={anyBusy}
                >
                  {deletingUserId === selectedUser.id
                    ? <RefreshCw size={14} className="animate-spin" />
                    : <Trash2 size={14} />
                  }
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Users size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">All Users</div>
              <div className="page-header-sub">
                Manage all system users across all hospitals
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-sm um-delete-btn"
              onClick={handleDeleteAllUsers}
              disabled={anyBusy}
            >
              {bulkDeleting
                ? <RefreshCw size={14} className="animate-spin" />
                : <Trash2 size={14} />
              }
              {bulkDeleting ? "Deleting…" : "Delete All"}
            </button>
            <button
              type="button"
              className="btn btn-icon btn-icon-lg"
              onClick={fetchAllUsers}
              disabled={anyBusy}
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content">

        {/* Stats */}
        <div className="stat-grid">
          {[
            { label: "Admins",              value: stats.admins     },
            { label: "Doctors",             value: stats.doctors    },
            { label: "Assistants",          value: stats.assistants },
            { label: "Patients (hidden)",   value: stats.patients   },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Note */}
        <div className="card card-sm">
          <div className="search-wrap">
            <Search className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by name or email…"
              value={searchUsers}
              onChange={(e) => setSearchUsers(e.target.value)}
              disabled={bulkDeleting}
            />
          </div>
          <div className="um-note">
            Patient accounts are hidden from this list for privacy.
            Only the aggregated count is shown above.
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-text">Loading users…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <Users size={40} className="empty-icon" />
            <div className="empty-title">No users found</div>
            <div className="empty-sub">Patients are hidden from this view.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Hospital</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const rowDeleting = deletingUserId === user.id;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="list-item-title">
                          {user.full_name || "(no name)"}
                        </div>
                      </td>
                      <td>
                        <div className="list-item-title" style={{ fontSize: "var(--ms-text-sm)" }}>
                          {user.email || "—"}
                        </div>
                        <div className="list-item-sub">{user.phone || "—"}</div>
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        <div className="list-item-sub">
                          {user.hospital_name || "N/A"}
                        </div>
                      </td>
                      <td>{getStatusBadge(user.approval_status)}</td>
                      <td>
                        <div className="list-item-sub">
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td>
                        <div className="um-actions">
                          <button
                            type="button"
                            className="btn btn-icon"
                            disabled={anyBusy}
                            title="View details"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-icon um-delete-icon-btn"
                            disabled={anyBusy}
                            title="Delete"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            {rowDeleting
                              ? <RefreshCw size={14} className="animate-spin" />
                              : <Trash2 size={14} />
                            }
                          </button>
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
  );
}

export default UsersManagementPage;