import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, CheckCircle, XCircle, UserCog } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type PendingAssistant = {
  profile_id: string;
  full_name: string;
  phone?: string | null;
  approval_status: "pending" | "approved" | "rejected";
  doctor: { id: string; full_name: string } | null;
  hospital: { id: string; name: string } | null;
};

export default function PendingAssistantsPage({ onRefreshGlobal }: { onRefreshGlobal: () => void }) {
  const [assistants, setAssistants] = useState<PendingAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const token = localStorage.getItem("accessToken");

  const fetchPendingAssistants = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/pending-assistants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load pending assistants");
      setAssistants(data.assistants || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load pending assistants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAssistants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return assistants;
    return assistants.filter((a) =>
      [a.full_name, a.phone || "", a.doctor?.full_name || "", a.hospital?.name || ""]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q, assistants]);

  const approve = async (profileId: string) => {
    if (!token) return;
    try {
      setActingId(profileId);
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants/${profileId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve assistant");
      toast.success("Assistant approved");
      setAssistants((p) => p.filter((x) => x.profile_id !== profileId));
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve assistant");
    } finally {
      setActingId(null);
    }
  };

  const reject = async (profileId: string) => {
    if (!token) return;
    try {
      setActingId(profileId);
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants/${profileId}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject assistant");
      toast.info("Assistant rejected");
      setAssistants((p) => p.filter((x) => x.profile_id !== profileId));
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject assistant");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UserCog className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-extrabold text-white">Pending Assistants</h1>
            </div>
            <p className="text-white/90">Approve or reject assistant requests</p>
          </div>

          <Button
            onClick={fetchPendingAssistants}
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
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assistants..." className="pl-10 h-11" />
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
                  <th className="py-3 px-4 font-semibold">Assistant</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold">Linked Doctor</th>
                  <th className="py-3 px-4 font-semibold">Hospital</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-10 text-center text-gray-500">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-gray-500">No pending assistants</td></tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.profile_id} className="border-b border-gray-100 hover:bg-purple-50/40 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900">{a.full_name}</p>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">{a.phone || "-"}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">{a.doctor?.full_name || "Unknown"}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">{a.hospital?.name || "-"}</td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={actingId === a.profile_id}
                            onClick={() => approve(a.profile_id)}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            disabled={actingId === a.profile_id}
                            onClick={() => reject(a.profile_id)}
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