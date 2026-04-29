import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, CheckCircle, XCircle, Stethoscope } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
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
  hospital: { id: string; name: string; address: string | null; hospital_type: string | null } | null;
};

export default function PendingDoctorsPage({ onRefreshGlobal }: { onRefreshGlobal: () => void }) {
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const token = localStorage.getItem("accessToken");

  const fetchPendingDoctors = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/pending-doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load pending doctors");
      setDoctors(data.doctors || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load pending doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return doctors;
    return doctors.filter((d) =>
      [d.full_name, d.specialization, d.license_number, d.cnic, d.phone || ""].join(" ").toLowerCase().includes(s)
    );
  }, [q, doctors]);

  const approve = async (profileId: string) => {
    if (!token) return;
    try {
      setActingId(profileId);
      const res = await fetch(`${API_URL}/api/hospital-admin/doctors/${profileId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve doctor");
      toast.success("Doctor approved");
      setDoctors((p) => p.filter((x) => x.profile_id !== profileId));
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve doctor");
    } finally {
      setActingId(null);
    }
  };

  const reject = async (profileId: string) => {
    if (!token) return;
    try {
      setActingId(profileId);
      const res = await fetch(`${API_URL}/api/hospital-admin/doctors/${profileId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject doctor");
      toast.info("Doctor rejected");
      setDoctors((p) => p.filter((x) => x.profile_id !== profileId));
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject doctor");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Stethoscope className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-extrabold text-white">Pending Doctors</h1>
            </div>
            <p className="text-white/90">Approve or reject doctor requests</p>
          </div>

          <Button
            onClick={fetchPendingDoctors}
            disabled={loading}
            className="rounded-2xl bg-white/15 hover:bg-white/20 text-white border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search doctors..." className="pl-10 h-11" />
            </div>
            <div className="text-sm text-gray-600">
              Total pending: <span className="font-bold">{filtered.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="py-3 px-4 font-semibold">Doctor</th>
                  <th className="py-3 px-4 font-semibold">Specialization</th>
                  <th className="py-3 px-4 font-semibold">License</th>
                  <th className="py-3 px-4 font-semibold">CNIC</th>
                  <th className="py-3 px-4 font-semibold">Hospital</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-500">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-500">No pending doctors</td></tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.profile_id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900">{d.full_name}</p>
                        <p className="text-xs text-gray-500">{d.phone || "No phone"}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">{d.specialization}</td>
                      <td className="py-4 px-4 text-sm text-gray-700 font-mono">{d.license_number}</td>
                      <td className="py-4 px-4 text-sm text-gray-700 font-mono">{d.cnic}</td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-gray-900">{d.hospital?.name || "-"}</p>
                        <p className="text-xs text-gray-500">{d.hospital?.hospital_type || ""}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={actingId === d.profile_id}
                            onClick={() => approve(d.profile_id)}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            disabled={actingId === d.profile_id}
                            onClick={() => reject(d.profile_id)}
                            className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white border-0"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}