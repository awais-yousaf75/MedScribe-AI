import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface AdminsManagementPageProps {}

type HospitalAdmin = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at?: string | null;
  hospital_name?: string | null;
};

import { API_URL } from "@/lib/constants";

export function AdminsManagementPage({}: AdminsManagementPageProps) {
  const navigate = useNavigate();
  const [admins,       setAdmins]       = useState<HospitalAdmin[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [searchAdmins,  setSearchAdmins]  = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdmins = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/superadmin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setAdmins((data.users || []).filter((u: any) => u.role === "hospital_admin"));
    } catch (err: any) {
      toast.error(err.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAdminEmail = async (admin: HospitalAdmin) => {
    const token = getToken();
    if (!token) return;
    const next = window.prompt("Enter new email for this admin:", admin.email || "");
    if (!next) return;
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospital-admins/${admin.id}/email`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email: next }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      toast.success("Admin email updated");
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, email: next } : a)));
    } catch (err: any) {
      toast.error(err.message || "Failed to update email");
    }
  };

  const handleDeleteAdmin = async (admin: HospitalAdmin) => {
    const token = getToken();
    if (!token) return;
    const ok = window.confirm(
      `Delete hospital admin "${admin.full_name}"?\n\nThis will permanently delete the user and related data.`,
    );
    if (!ok) return;
    try {
      setDeletingId(admin.id);
      const res = await fetch(`${API_URL}/api/superadmin/users/${admin.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      toast.success("Hospital admin deleted");
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete admin");
    } finally {
      setDeletingId(null);
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

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      (admin.full_name || "").toLowerCase().includes(searchAdmins.toLowerCase()) ||
      (admin.email    || "").toLowerCase().includes(searchAdmins.toLowerCase());
    const matchesStatus = statusFilter === "all" || admin.approval_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-main">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Hospital Admins</div>
              <div className="page-header-sub">
                Manage all hospital administrators in the system
              </div>
            </div>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-icon btn-icon-lg"
              onClick={fetchAdmins}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content">

        {/* Filters */}
        <div className="card card-sm">
          <div className="am-filter-row">
            <div className="search-wrap am-search">
              <Search className="search-icon" />
              <input
                className="search-input"
                placeholder="Search by name or email…"
                value={searchAdmins}
                onChange={(e) => setSearchAdmins(e.target.value)}
              />
            </div>
            <select
              className="field-select am-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="loading-text">Loading admins…</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="empty-state">
            <Shield size={40} className="empty-icon" />
            <div className="empty-title">No admins found</div>
            <div className="empty-sub">
              Try adjusting your search or status filter.
            </div>
          </div>
        ) : (
          <div className="am-grid">
            {filteredAdmins.map((admin) => (
              <div key={admin.id} className="am-card ms-card-hover">

                {/* Card Top */}
                <div className="am-card-top">
                  <div className="icon-wrap icon-wrap-md icon-wrap-navy">
                    <Shield size={18} color="var(--ms-teal)" />
                  </div>
                  <div className="am-card-identity">
                    <div className="am-card-name">{admin.full_name}</div>
                    {getStatusBadge(admin.approval_status)}
                  </div>
                </div>

                {/* Email Row */}
                <div className="am-contact-row">
                  <div className="am-contact-item">
                    <Mail size={14} color="var(--ms-teal)" />
                    <span className="am-contact-text">
                      {admin.email || "No email"}
                    </span>
                  </div>
                  <div className="am-action-row">
                    <button
                      type="button"
                      className="btn btn-icon"
                      onClick={() => handleEditAdminEmail(admin)}
                      disabled={deletingId === admin.id}
                      title="Edit email"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon am-delete-btn"
                      onClick={() => handleDeleteAdmin(admin)}
                      disabled={deletingId === admin.id}
                      title="Delete admin"
                    >
                      {deletingId === admin.id
                        ? <RefreshCw size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </div>
                </div>

                {/* Phone */}
                {admin.phone && (
                  <div className="am-contact-item" style={{ marginTop: 8 }}>
                    <Phone size={14} color="var(--ms-teal)" />
                    <span className="am-contact-text">{admin.phone}</span>
                  </div>
                )}

                {/* Hospital */}
                {admin.hospital_name && (
                  <>
                    <hr className="divider divider-sm" />
                    <div className="info-label">Assigned Hospital</div>
                    <div className="info-value">{admin.hospital_name}</div>
                  </>
                )}

                {/* Date */}
                <hr className="divider divider-sm" />
                <div className="info-label">Created</div>
                <div className="am-date">{formatDate(admin.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminsManagementPage;