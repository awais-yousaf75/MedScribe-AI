import React, { useEffect, useState } from "react";
import { Building2, Mail, MapPin, Phone, Fingerprint, FileText, Users, Stethoscope, LoaderCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
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
      if (!res.ok) throw new Error(json.error || "Failed to load hospital profile");
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <LoaderCircle className="w-10 h-10 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading hospital profile…</p>
        </div>
      </div>
    );
  }

  const hospital = data?.hospital;
  const stats = data?.stats;

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 p-8 shadow-lg">
        <div className="max-w-[1200px] mx-auto flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-extrabold text-white">Hospital Profile</h1>
            </div>
            <p className="text-white/90">Your hospital details and statistics</p>
          </div>
          <Button
            onClick={fetchHospital}
            className="rounded-2xl bg-white/15 hover:bg-white/20 text-white border border-white/20"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-[1200px] mx-auto space-y-6">
        {!hospital ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center text-gray-600">
            No hospital assigned to this admin.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
                    <p className="text-gray-600 mt-1">{hospital.hospital_type || "—"}</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                    {hospital.status?.toUpperCase()}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex gap-3">
                    <Fingerprint className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Registration</p>
                      <p className="font-mono font-semibold text-gray-900">{hospital.registration_number}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex gap-3">
                    <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">License</p>
                      <p className="font-mono font-semibold text-gray-900">{hospital.license_number || "—"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Address</p>
                      <p className="text-gray-900 font-medium">{hospital.address || "—"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex gap-3">
                    <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium">{hospital.contact_email || "—"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 flex gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Phone</p>
                      <p className="text-gray-900 font-medium">{hospital.contact_phone || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 shadow-sm p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Hospital stats</h3>

                <div className="space-y-3">
                  <div className="bg-white/70 border border-white rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">Approved Doctors</span>
                    </div>
                    <span className="text-xl font-black text-gray-900">{stats?.doctorsCount ?? 0}</span>
                  </div>

                  <div className="bg-white/70 border border-white rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium">Approved Assistants</span>
                    </div>
                    <span className="text-xl font-black text-gray-900">{stats?.assistantsCount ?? 0}</span>
                  </div>

                  <div className="bg-white/70 border border-white rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium">Patients (count)</span>
                    </div>
                    <span className="text-xl font-black text-gray-900">{stats?.patientsCount ?? 0}</span>
                  </div>

                  <div className="mt-4 text-xs text-gray-600">
                    Patient data is private. Only total count is displayed.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}