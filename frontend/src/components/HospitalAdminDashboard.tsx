import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
  onLogout: () => void;
}

export function HospitalAdminDashboard({ onLogout }: HospitalAdminDashboardProps) {
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [assistants, setAssistants] = useState<PendingAssistant[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAssistants, setLoadingAssistants] = useState(false);

  const getToken = () => localStorage.getItem("accessToken");

  // ---------- FETCHES ----------

  const fetchPendingDoctors = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingDoctors(true);
      const res = await fetch(
        `${API_URL}/api/hospital-admin/pending-doctors`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

  // ---------- ACTIONS ----------

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
      toast.success("Doctor approved");
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
      toast.success("Assistant approved");
      setAssistants((prev) =>
        prev.filter((a) => a.profile_id !== profileId)
      );
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
      if (!res.ok)
        throw new Error(data.error || "Failed to reject assistant");
      toast.info("Assistant rejected");
      setAssistants((prev) =>
        prev.filter((a) => a.profile_id !== profileId)
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject assistant");
    }
  };

  // ---------- UI helpers ----------

  const renderStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-slate-400">-</span>;
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    if (status === "approved")
      return (
        <span
          className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-100`}
        >
          Approved
        </span>
      );
    if (status === "rejected")
      return (
        <span
          className={`${base} bg-red-50 text-red-700 border border-red-100`}
        >
          Rejected
        </span>
      );
    return (
      <span
        className={`${base} bg-amber-50 text-amber-700 border border-amber-100`}
      >
        Pending
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Hospital Admin Portal
          </h1>
          <p className="text-sm text-slate-500">
            Approve doctors and doctor assistants linked to your hospital.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-red-500 text-red-600 hover:bg-red-50"
          onClick={onLogout}
        >
          Logout
        </Button>
      </header>

      <main className="space-y-8">
        {/* Pending Doctors */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Pending Doctors
              </h2>
              <p className="text-xs text-slate-500">
                Doctors who have applied to work at your hospital.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Total: {doctors.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingDoctors}
                onClick={fetchPendingDoctors}
              >
                Refresh
              </Button>
            </div>
          </div>

          {loadingDoctors ? (
            <p className="text-sm text-slate-500">Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-slate-400">
              No pending doctors at the moment.
            </p>
          ) : (
            <div className="w-full overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full table-fixed text-xs md:text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-left text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-3 w-[22%]">Doctor</th>
                    <th className="py-2.5 px-3 w-[20%]">Specialization</th>
                    <th className="py-2.5 px-3 w-[16%]">License #</th>
                    <th className="py-2.5 px-3 w-[18%]">Hospital</th>
                    <th className="py-2.5 px-3 w-[12%]">Status</th>
                    <th className="py-2.5 px-3 w-[12%] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {doctors.map((d) => (
                    <tr key={d.profile_id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-medium text-slate-900 truncate">
                          {d.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {d.phone || "No phone"}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <span className="truncate block text-slate-700">
                          {d.specialization}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <span className="truncate block text-slate-700">
                          {d.license_number}
                        </span>
                        <span className="truncate block text-[11px] text-slate-400">
                          CNIC: {d.cnic}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-medium text-slate-900 truncate">
                          {d.hospital?.name || "-"}
                        </div>
                        {d.hospital?.address && (
                          <div className="text-[11px] text-slate-500 truncate">
                            {d.hospital.address}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        {renderStatusBadge(d.approval_status)}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveDoctor(d.profile_id)}
                            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectDoctor(d.profile_id)}
                            className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 border border-red-100 hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pending Assistants */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Pending Doctor Assistants
              </h2>
              <p className="text-xs text-slate-500">
                Assistants created by doctors, waiting for your approval.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Total: {assistants.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingAssistants}
                onClick={fetchPendingAssistants}
              >
                Refresh
              </Button>
            </div>
          </div>

          {loadingAssistants ? (
            <p className="text-sm text-slate-500">Loading assistants...</p>
          ) : assistants.length === 0 ? (
            <p className="text-sm text-slate-400">
              No pending doctor assistants at the moment.
            </p>
          ) : (
            <div className="w-full overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full table-fixed text-xs md:text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-left text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-3 w-[26%]">Assistant</th>
                    <th className="py-2.5 px-3 w-[18%]">Phone</th>
                    <th className="py-2.5 px-3 w-[22%]">Doctor</th>
                    <th className="py-2.5 px-3 w-[18%]">Hospital</th>
                    <th className="py-2.5 px-3 w-[8%]">Status</th>
                    <th className="py-2.5 px-3 w-[8%] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {assistants.map((a) => (
                    <tr key={a.profile_id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-medium text-slate-900 truncate">
                          {a.full_name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <span className="truncate block">
                          {a.phone || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-medium text-slate-900 truncate">
                          {a.doctor?.full_name || "Unknown doctor"}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-medium text-slate-900 truncate">
                          {a.hospital?.name || "-"}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        {renderStatusBadge(a.approval_status)}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleApproveAssistant(a.profile_id)
                            }
                            className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRejectAssistant(a.profile_id)
                            }
                            className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 border border-red-100 hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}