import React, { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Fingerprint,
  FileText,
  Users,
  Stethoscope,
  RefreshCw,
  UserCog,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function HospitalProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("accessToken");

  const fetchHospital = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/hospital`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Failed to load hospital profile");
      setData(json);
    } catch (e: any) {
      toast.error(e.message || "Failed to load hospital profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospital();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">
            Loading hospital profile…
          </p>
        </div>
      </div>
    );
  }

  const hospital = data?.hospital;
  const stats = data?.stats;

  // Status config
  const statusMap: Record<string, { label: string; icon: React.ElementType; bg: string; text: string; dot: string }> = {
    approved: { label: "Active",    icon: CheckCircle2, bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
    pending:  { label: "Pending",   icon: Clock,        bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
    rejected: { label: "Suspended", icon: XCircle,      bg: "bg-rose-50",     text: "text-rose-700",    dot: "bg-rose-500"    },
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div
        className="px-4 sm:px-8 py-8 shadow-sm"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Hospital Profile
                </h1>
              </div>
              <p className="text-slate-400 text-sm ml-12">
                Hospital identity &amp; privacy-safe statistics
              </p>
            </div>

            <button
              onClick={fetchHospital}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                font-medium text-slate-300 hover:text-white hover:bg-white/10
                transition-all disabled:opacity-50 self-start sm:self-auto"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-8 max-w-[1200px] mx-auto">
        {!hospital ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-900 font-bold text-base">
              No Hospital Assigned
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Contact Super Admin to assign a hospital to your account.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Identity Card ──────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Banner */}
              <div
                className="px-6 sm:px-8 py-6"
                style={{ background: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur
                      flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {hospital.name}
                      </h2>
                      {hospital.hospital_type && (
                        <p className="text-white/70 text-sm capitalize mt-0.5">
                          {hospital.hospital_type}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  {(() => {
                    const s = statusMap[hospital.status] || statusMap.pending;
                    const Icon = s.icon;
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5
                          rounded-full text-xs font-bold ${s.bg} ${s.text} flex-shrink-0`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Details grid */}
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Registration */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <Fingerprint className="w-4.5 h-4.5 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Registration #
                      </p>
                      <p className="text-sm font-bold text-gray-900 font-mono mt-1">
                        {hospital.registration_number}
                      </p>
                    </div>
                  </div>

                  {/* License */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4.5 h-4.5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        License #
                      </p>
                      <p className="text-sm font-bold text-gray-900 font-mono mt-1">
                        {hospital.license_number || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-start gap-3 sm:col-span-2">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4.5 h-4.5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Address
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {hospital.address || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4.5 h-4.5 text-cyan-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Contact Email
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1 break-all">
                        {hospital.contact_email || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Contact Phone
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {hospital.contact_phone || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats Card ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Stats header */}
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Hospital Statistics
                  </h3>
                  <p className="text-xs text-gray-400">
                    Privacy-safe aggregate counts
                  </p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Doctors */}
                  <div className="rounded-xl p-5 text-center"
                    style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "1px solid #bfdbfe" }}>
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                      {stats?.doctorsCount ?? 0}
                    </p>
                    <p className="text-xs font-medium text-blue-700 mt-1">
                      Approved Doctors
                    </p>
                  </div>

                  {/* Assistants */}
                  <div className="rounded-xl p-5 text-center"
                    style={{ background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "1px solid #ddd6fe" }}>
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                      <UserCog className="w-6 h-6 text-violet-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                      {stats?.assistantsCount ?? 0}
                    </p>
                    <p className="text-xs font-medium text-violet-700 mt-1">
                      Approved Assistants
                    </p>
                  </div>

                  {/* Patients */}
                  <div className="rounded-xl p-5 text-center"
                    style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1px solid #a7f3d0" }}>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-black text-gray-900">
                      {stats?.patientsCount ?? 0}
                    </p>
                    <p className="text-xs font-medium text-emerald-700 mt-1">
                      Patients (count only)
                    </p>
                  </div>
                </div>

                {/* Privacy note */}
                <div className="mt-5 rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    Patient data is private. Only total count is displayed for
                    compliance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}