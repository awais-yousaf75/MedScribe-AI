// pages/HospitalsManagementPage.tsx
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
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

interface HospitalsManagementPageProps {
  onViewDetail: (hospitalId: string) => void;
  onNavigate: (page: string) => void;
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
  const [allHospitals, setAllHospitals] = useState<SystemHospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHospitals, setSearchHospitals] = useState("");
  const [hospitalStatusFilter, setHospitalStatusFilter] = useState("all");

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchAllHospitals();
  }, []);

  const fetchAllHospitals = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoading(true);
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

  const filteredHospitals = allHospitals.filter((h) => {
    const matchesSearch = h.name
      .toLowerCase()
      .includes(searchHospitals.toLowerCase());
    const matchesStatus =
      hospitalStatusFilter === "all" || h.status === hospitalStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-teal-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-white" />
                <h1 className="text-3xl text-white font-bold">
                  Hospitals Management
                </h1>
              </div>
              <p className="text-white/90 text-lg">
                View and manage all registered hospitals
              </p>
            </div>
            <Button
              onClick={() => onNavigate("register-hospital")}
              className="rounded-xl bg-white hover:bg-gray-50 text-green-600 font-semibold shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Register New Hospital
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100">
          <div className="flex flex-wrap gap-4 items-center justify-between">
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
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search hospitals..."
                  value={searchHospitals}
                  onChange={(e) => setSearchHospitals(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-2 focus:border-green-400 focus:outline-none"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAllHospitals}
              disabled={loading}
              className="rounded-xl"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Hospitals List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <p className="text-gray-500">Loading hospitals...</p>
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">No hospitals found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-100 hover:border-green-300 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => onViewDetail(hospital.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  {getStatusBadge(hospital.status)}
                </div>

                {/* Hospital Name */}
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                  {hospital.name}
                </h3>

                {/* Registration Number */}
                <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block mb-3 text-gray-600">
                  {hospital.registration_number}
                </p>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Type:</span>
                    {hospital.hospital_type || "-"}
                  </p>
                  {hospital.admin && (
                    <p className="flex items-center gap-2">
                      <span className="font-semibold">Admin:</span>
                      {hospital.admin.full_name}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {hospital.doctors_count ?? 0}
                    </p>
                    <p className="text-xs text-gray-500">Doctors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {hospital.assistants_count ?? 0}
                    </p>
                    <p className="text-xs text-gray-500">Assistants</p>
                  </div>
                </div>

                {/* View Button */}
                <Button
                  className="w-full mt-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:shadow-lg text-white border-0"
                  onClick={(e: { stopPropagation: () => void }) => {
                    e.stopPropagation();
                    onViewDetail(hospital.id);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HospitalsManagementPage;
