import { useEffect, useState } from "react";
import {
  Building2,
  UserCog,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import Sidebar from "./layout/Sidebar";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type PendingDoctor = {
  profile_id: string;
  full_name: string;
  phone?: string | null;
  specialization: string;
  license_number: string;
  cnic: string;
  approval_status: "pending" | "approved" | "rejected";
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
  } | null;
};

type PendingAssistant = {
  profile_id: string;
  full_name: string;
  phone?: string | null;
  approval_status: "pending" | "approved" | "rejected";
  doctor: {
    id: string;
    full_name: string;
  } | null;
  hospital: {
    id: string;
    name: string;
  } | null;
};

interface HospitalAdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function HospitalAdminDashboard({
  onNavigate,
  onLogout,
}: HospitalAdminDashboardProps) {
  // Data states
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [assistants, setAssistants] = useState<PendingAssistant[]>([]);

  // Loading states
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAssistants, setLoadingAssistants] = useState(false);

  // Admin info (you can fetch this from API if needed)
  const adminInfo = {
    fullName: "Hospital Admin",
    hospitalName: "Medical Center",
    hospitalStatus: "approved",
  };

  const getToken = () => localStorage.getItem("accessToken");

  // ─────────────────────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ─────────────────────────────────────────────────────────────

  const fetchPendingDoctors = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingDoctors(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/pending-doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load pending doctors");
      }
      setDoctors(data.doctors as PendingDoctor[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load pending doctors");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchPendingAssistants = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingAssistants(true);
      const res = await fetch(
        `${API_URL}/api/hospital-admin/pending-assistants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load pending assistants");
      }
      setAssistants(data.assistants as PendingAssistant[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load pending assistants");
    } finally {
      setLoadingAssistants(false);
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
    fetchPendingAssistants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ACTION HANDLERS: DOCTORS
  // ─────────────────────────────────────────────────────────────

  const handleApproveDoctor = async (profileId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/doctors/${profileId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve doctor");
      toast.success("Doctor approved successfully!");
      setDoctors((prev) => prev.filter((d) => d.profile_id !== profileId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve doctor");
    }
  };

  const handleRejectDoctor = async (profileId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/doctors/${profileId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject doctor");
      toast.info("Doctor rejected");
      setDoctors((prev) => prev.filter((d) => d.profile_id !== profileId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject doctor");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ACTION HANDLERS: ASSISTANTS
  // ─────────────────────────────────────────────────────────────

  const handleApproveAssistant = async (profileId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/assistants/${profileId}/approve`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to approve assistant");
      toast.success("Assistant approved successfully!");
      setAssistants((prev) => prev.filter((a) => a.profile_id !== profileId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve assistant");
    }
  };

  const handleRejectAssistant = async (profileId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/hospital-admin/assistants/${profileId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject assistant");
      toast.info("Assistant rejected");
      setAssistants((prev) => prev.filter((a) => a.profile_id !== profileId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject assistant");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-gray-400">-</span>;

    const config: Record<
      string,
      { gradient: string; icon: typeof CheckCircle }
    > = {
      approved: {
        gradient:
          "from-green-50 to-emerald-50 text-green-700 border-green-200",
        icon: CheckCircle,
      },
      pending: {
        gradient:
          "from-yellow-50 to-orange-50 text-yellow-700 border-yellow-200",
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

  // Stats based on current data
  const hospitalStats = {
    pendingDoctors: doctors.length,
    pendingAssistants: assistants.length,
    totalPending: doctors.length + assistants.length,
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      <Sidebar
        currentPage="hospital-admin-dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        userRole="hospital_admin"
        userName={adminInfo.fullName}
        userSubtitle={adminInfo.hospitalName}
      />

      <div className="flex-1 ml-64">
        {/* Header */}
        <div
          className="p-8 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #14B8A6 0%, #06B6D4 50%, #0EA5E9 100%)",
          }}
        >
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-semibold text-white">
                Hospital Admin Dashboard
              </h1>
            </div>
            <p className="text-white/90">
              Manage doctors, assistants, and hospital operations
            </p>
          </div>
        </div>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <Stethoscope className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">
                  {hospitalStats.pendingDoctors}
                </p>
                <p className="text-xs opacity-90">Pending Doctors</p>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <UserCog className="w-8 h-8 mb-3 opacity-80" />
                <p className="text-3xl mb-1 font-bold">
                  {hospitalStats.pendingAssistants}
                </p>
                <p className="text-xs opacity-90">Pending Assistants</p>
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
                <p className="text-3xl mb-1 font-bold">
                  {hospitalStats.totalPending}
                </p>
                <p className="text-xs opacity-90">Total Pending</p>
              </div>
            </div>
          </div>

          {/* Pending Doctors */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -ml-32 -mt-32" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                    }}
                  >
                    <Stethoscope className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-semibold"
                      style={{
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Pending Doctors
                    </h2>
                    <p className="text-sm text-gray-500">
                      Review and approve doctor accounts
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPendingDoctors}
                  disabled={loadingDoctors}
                  className="rounded-xl"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loadingDoctors ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>

              {loadingDoctors ? (
                <div className="text-center py-8 text-gray-500">
                  Loading doctors...
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No pending doctors at the moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Doctor Name
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Contact
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Specialization
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          License #
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          CNIC
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Hospital
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Status
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((doctor) => (
                        <tr
                          key={doctor.profile_id}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-semibold text-gray-800">
                              {doctor.full_name}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-600">
                              {doctor.phone || "No phone"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-gray-800">
                              {doctor.specialization}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">
                              {doctor.license_number}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">
                              {doctor.cnic}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-gray-800">
                              {doctor.hospital?.name || "-"}
                            </p>
                            {doctor.hospital?.address && (
                              <p className="text-xs text-gray-500">
                                {doctor.hospital.address}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(doctor.approval_status)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproveDoctor(doctor.profile_id)
                                }
                                className="rounded-xl text-white border-0"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                                }}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleRejectDoctor(doctor.profile_id)
                                }
                                className="rounded-xl text-white border-0"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
                                }}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Reject
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

          {/* Pending Assistants */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-100 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -mr-32 -mb-32" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                    }}
                  >
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-semibold"
                      style={{
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Pending Assistants
                    </h2>
                    <p className="text-sm text-gray-500">
                      Review and approve assistant accounts
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPendingAssistants}
                  disabled={loadingAssistants}
                  className="rounded-xl"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loadingAssistants ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>

              {loadingAssistants ? (
                <div className="text-center py-8 text-gray-500">
                  Loading assistants...
                </div>
              ) : assistants.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No pending assistants at the moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Assistant Name
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Phone
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Linked Doctor
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Hospital
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">
                          Status
                        </th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assistants.map((assistant) => (
                        <tr
                          key={assistant.profile_id}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-semibold text-gray-800">
                              {assistant.full_name}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-600">
                              {assistant.phone || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-gray-800">
                              {assistant.doctor?.full_name || "Unknown doctor"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm font-medium text-gray-800">
                              {assistant.hospital?.name || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(assistant.approval_status)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproveAssistant(assistant.profile_id)
                                }
                                className="rounded-xl text-white border-0"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                                }}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleRejectAssistant(assistant.profile_id)
                                }
                                className="rounded-xl text-white border-0"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
                                }}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Reject
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

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Info Card - Doctors */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                    }}
                  >
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Doctor Approvals
                    </h3>
                    <p className="text-sm text-gray-500">
                      {doctors.length} pending requests
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Review doctor credentials including medical license, CNIC, and
                  specialization before approving their access to your hospital.
                </p>
              </div>
            </div>

            {/* Info Card - Assistants */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-purple-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                    }}
                  >
                    <UserCog className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Assistant Approvals
                    </h3>
                    <p className="text-sm text-gray-500">
                      {assistants.length} pending requests
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Doctor assistants are created by approved doctors. Verify the
                  linked doctor and approve assistant access to help manage
                  consultations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}