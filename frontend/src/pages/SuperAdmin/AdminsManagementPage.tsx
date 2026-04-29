// pages/AdminsManagementPage.tsx
import React, { useState, useEffect } from "react";
import {
  Shield,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

interface AdminsManagementPageProps {
  onNavigate: (page: string) => void;
}

type HospitalAdmin = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at?: string;
  hospital?: {
    id: string;
    name: string;
    hospital_type?: string;
  } | null;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AdminsManagementPage({
  onNavigate,
}: AdminsManagementPageProps) {
  const [admins, setAdmins] = useState<HospitalAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchAdmins, setSearchAdmins] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/superadmin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Filter only hospital admins
      const hospitalAdmins = (data.users || []).filter(
        (u: any) => u.role === "hospital_admin",
      );
      setAdmins(hospitalAdmins);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load admins");
    } finally {
      setLoading(false);
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

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.full_name?.toLowerCase().includes(searchAdmins.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchAdmins.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || admin.approval_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-3xl text-white font-bold">
              Hospital Admins Management
            </h1>
          </div>
          <p className="text-white/90 text-lg">
            Manage all hospital administrators in the system
          </p>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 px-4 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium focus:border-purple-400 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search admins..."
                  value={searchAdmins}
                  onChange={(e) => setSearchAdmins(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-2 focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdmins}
              disabled={loading}
              className="rounded-xl"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Admins List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <p className="text-gray-500">Loading admins...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No admins found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdmins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all"
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {admin.full_name}
                    </h3>
                    {getStatusBadge(admin.approval_status)}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {admin.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-purple-600" />
                      {admin.email}
                    </p>
                  )}
                  {admin.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-purple-600" />
                      {admin.phone}
                    </p>
                  )}
                </div>

                {/* Hospital Info */}
                {admin.hospital && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      Assigned Hospital
                    </p>
                    <p className="font-semibold text-gray-800">
                      {admin.hospital.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {admin.hospital.hospital_type || "N/A"}
                    </p>
                  </div>
                )}

                {/* Created Date */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-700">
                    {formatDate(admin.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminsManagementPage;
