import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface HospitalsManagementPageProps {
  onViewDetail: (hospitalId: string) => void;
  onNavigate:  (page: string) => void;
}

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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function HospitalsManagementPage({
  onViewDetail,
  onNavigate,
}: HospitalsManagementPageProps) {
  const [allHospitals,          setAllHospitals]          = useState<SystemHospital[]>([]);
  const [loading,               setLoading]               = useState(false);
  const [searchHospitals,       setSearchHospitals]       = useState("");
  const [hospitalStatusFilter,  setHospitalStatusFilter]  = useState("all");

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => { fetchAllHospitals(); }, []);

  const fetchAllHospitals = async () => {
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/superadmin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load hospitals");
      setAllHospitals(data.hospitals as SystemHospital[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to load hospitals");
    } finally {
      setLoading(false);
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

  const filteredHospitals = allHospitals.filter((h) => {
    const matchesSearch = h.name
      .toLowerCase()
      .includes(searchHospitals.toLowerCase());
    const matchesStatus =
      hospitalStatusFilter === "all" || h.status === hospitalStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-main">

      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="page-header-top">
          <div className="page-header-left">
            <div className="icon-wrap icon-wrap-md icon-wrap-teal">
              <Building2 size={18} color="#fff" />
            </div>
            <div>
              <div className="page-header-title">Hospitals Management</div>
              <div className="page-header-sub">
                View and manage all registered hospitals
              </div>
            </div>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate("register-hospital")}
            >
              <Plus size={15} />
              Register Hospital
            </button>
            <button
              type="button"
              className="btn btn-icon btn-icon-lg"
              onClick={fetchAllHospitals}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
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
                placeholder="Search hospitals…"
                value={searchHospitals}
                onChange={(e) => setSearchHospitals(e.target.value)}
              />
            </div>
            <select
              className="field-select am-status-select"
              value={hospitalStatusFilter}
              onChange={(e) => setHospitalStatusFilter(e.target.value)}
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
          <div className="loading-text">Loading hospitals…</div>
        ) : filteredHospitals.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} className="empty-icon" />
            <div className="empty-title">No hospitals found</div>
            <div className="empty-sub">
              Try adjusting your search or status filter.
            </div>
          </div>
        ) : (
          <div className="hm-grid">
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="hm-card ms-card-hover"
                onClick={() => onViewDetail(hospital.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onViewDetail(hospital.id)}
              >
                {/* Card Top */}
                <div className="hm-card-top">
                  <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                    <Building2 size={18} color="#fff" />
                  </div>
                  {getStatusBadge(hospital.status)}
                </div>

                {/* Name */}
                <div className="hm-hospital-name">{hospital.name}</div>

                {/* Reg Number */}
                <div className="hm-reg-number">
                  {hospital.registration_number}
                </div>

                {/* Meta */}
                <div className="hm-meta">
                  <div className="hm-meta-row">
                    <span className="hm-meta-label">Type</span>
                    <span className="hm-meta-value">
                      {hospital.hospital_type || "—"}
                    </span>
                  </div>
                  {hospital.admin && (
                    <div className="hm-meta-row">
                      <span className="hm-meta-label">Admin</span>
                      <span className="hm-meta-value">
                        {hospital.admin.full_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="hm-stats">
                  <div className="hm-stat-item">
                    <div className="hm-stat-value">
                      {hospital.doctors_count ?? 0}
                    </div>
                    <div className="hm-stat-label">Doctors</div>
                  </div>
                  <div className="hm-stat-divider" />
                  <div className="hm-stat-item">
                    <div className="hm-stat-value">
                      {hospital.assistants_count ?? 0}
                    </div>
                    <div className="hm-stat-label">Assistants</div>
                  </div>
                </div>

                {/* View Button */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm hm-view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail(hospital.id);
                  }}
                >
                  <Eye size={14} />
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HospitalsManagementPage;