// src/pages/SuperAdmin/HospitalDetailPage.tsx
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Stethoscope,
  AlertCircle,
  LoaderCircle,
  Fingerprint,
  ShieldCheck,
  Globe,
  Plus,
  X,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

interface Hospital {
  id: string;
  name: string;
  address: string | null;
  hospital_type: string | null;
  registration_number: string;
  license_number?: string | null;
  contact_email?: string;
  contact_phone?: string;
  status: "pending" | "approved" | "rejected";
  admin_profile_id: string | null;
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
}

interface HospitalDetailPageProps {
  hospitalId: string;
  onBack: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function HospitalDetailPage({
  hospitalId,
  onBack,
}: HospitalDetailPageProps) {
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState(0);

  // NEW: assign admin modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [newCreds, setNewCreds] = useState<{
    email: string;
    password: string | null;
    generated: boolean;
  } | null>(null);

  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    password: "",
    generate_password: true,
  });

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchHospitalDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  const fetchHospitalDetails = async () => {
    const token = getToken();
    if (!token) {
      setError("Session expired. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/api/superadmin/hospitals/${hospitalId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Server returned an invalid response. Check API route.",
        );
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load details");

      setHospital(data.hospital);
      setPatients(data.patients_count || 0);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAdminModal = () => {
    setNewCreds(null);
    setAdminForm({
      full_name: "",
      email: "",
      phone: "",
      gender: "",
      dob: "",
      password: "",
      generate_password: true,
    });
    setShowAdminModal(true);
  };

  const assignNewAdmin = async () => {
    const token = getToken();
    if (!token) return;

    if (!hospital) return;

    if (!adminForm.full_name || !adminForm.email) {
      toast.error("Full name and email are required");
      return;
    }

    const replacing = !!hospital.admin_profile_id; // if hospital already has admin, we replace

    const ok = replacing
      ? window.confirm(
          "This hospital already has an admin. Do you want to replace the admin?",
        )
      : true;

    if (!ok) return;

    try {
      setSavingAdmin(true);

      const endpoint = `${API_URL}/api/superadmin/hospitals/${hospital.id}/admin${
        replacing ? "?replace=true" : ""
      }`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: adminForm.full_name,
          email: adminForm.email,
          phone: adminForm.phone || null,
          gender: adminForm.gender || null,
          dob: adminForm.dob || null,
          password: adminForm.generate_password ? null : adminForm.password,
          generate_password: adminForm.generate_password,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || "Failed to assign admin");

      toast.success("Hospital admin assigned successfully");

      if (data.credentials) {
        setNewCreds(data.credentials);
      }

      // refresh hospital details to show new admin
      await fetchHospitalDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to assign admin");
    } finally {
      setSavingAdmin(false);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    const styles: Record<string, string> = {
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status || "pending"]}`}
      >
        {status?.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <LoaderCircle className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Fetching Hospital Records...
        </p>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="p-8 bg-white h-screen">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 hover:bg-gray-100 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="max-w-md mx-auto text-center border-2 border-dashed border-gray-200 rounded-3xl p-12">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button
            onClick={fetchHospitalDetails}
            className="bg-indigo-600 text-white rounded-xl"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Assign Admin Modal */}
      {showAdminModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !savingAdmin && setShowAdminModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Assign Hospital Admin</h3>
                <p className="text-white/90 text-sm">
                  Create a new admin and assign to this hospital
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/15 rounded-xl"
                onClick={() => !savingAdmin && setShowAdminModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    Full Name *
                  </label>
                  <Input
                    value={adminForm.full_name}
                    onChange={(e) =>
                      setAdminForm((p) => ({ ...p, full_name: e.target.value }))
                    }
                    className="mt-1"
                    disabled={savingAdmin}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    Email *
                  </label>
                  <Input
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="mt-1"
                    disabled={savingAdmin}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    Phone
                  </label>
                  <Input
                    value={adminForm.phone}
                    onChange={(e) =>
                      setAdminForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="mt-1"
                    disabled={savingAdmin}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    Gender
                  </label>
                  <select
                    value={adminForm.gender}
                    onChange={(e) =>
                      setAdminForm((p) => ({ ...p, gender: e.target.value }))
                    }
                    disabled={savingAdmin}
                    className="mt-1 w-full h-11 px-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium focus:border-indigo-400 focus:outline-none disabled:opacity-60"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    DOB
                  </label>
                  <Input
                    type="date"
                    value={adminForm.dob}
                    onChange={(e) =>
                      setAdminForm((p) => ({ ...p, dob: e.target.value }))
                    }
                    className="mt-1"
                    disabled={savingAdmin}
                  />
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={adminForm.generate_password}
                    onChange={(e) =>
                      setAdminForm((p) => ({
                        ...p,
                        generate_password: e.target.checked,
                      }))
                    }
                    disabled={savingAdmin}
                  />
                  <span className="text-sm text-gray-700">
                    Generate password automatically
                  </span>
                </div>

                {!adminForm.generate_password && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) =>
                        setAdminForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      className="mt-1"
                      disabled={savingAdmin}
                    />
                  </div>
                )}
              </div>

              {newCreds && (
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <KeyRound className="w-4 h-4" />
                    Credentials (copy now)
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    <div>
                      <span className="font-semibold">Email:</span>{" "}
                      {newCreds.email}
                    </div>
                    <div>
                      <span className="font-semibold">Password:</span>{" "}
                      {newCreds.password ? newCreds.password : "(not shown)"}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => !savingAdmin && setShowAdminModal(false)}
                  disabled={savingAdmin}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl bg-indigo-600 text-white"
                  onClick={assignNewAdmin}
                  disabled={savingAdmin}
                >
                  {savingAdmin ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Admin
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            className="hover:bg-gray-100 rounded-xl text-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
          </Button>
          <div className="flex items-center gap-3">
            {getStatusBadge(hospital.status)}
            <span className="text-gray-300">|</span>
            <p className="text-xs text-gray-500 font-mono">
              ID: {hospital.id.split("-")[0]}...
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 space-y-8">
        {/* TOP PORTION: Header & Admin Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hospital Identity Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Building2 size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Building2 size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    {hospital.name}
                  </h1>
                  <p className="text-indigo-600 font-semibold">
                    {hospital.hospital_type}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">
                      Location
                    </p>
                    <p className="text-gray-700 font-medium">
                      {hospital.address || "No address provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Fingerprint className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">
                      Registration Number
                    </p>
                    <p className="text-gray-700 font-mono font-bold text-lg">
                      {hospital.registration_number}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Light Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                <ShieldCheck className="text-indigo-600" size={20} />{" "}
                Administrator
              </h3>

              <Button
                onClick={openAdminModal}
                className="rounded-xl bg-indigo-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {hospital.admin ? "Replace" : "Assign"}
              </Button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-white border-2 border-white shadow-md flex items-center justify-center text-indigo-600">
                <User size={28} />
              </div>
              <div className="min-w-0">
                <p className="text-gray-900 font-bold truncate">
                  {hospital.admin?.full_name || "No admin assigned"}
                </p>
                <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider">
                  Hospital Admin
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-xl border border-white">
                <Mail size={16} className="text-indigo-400" />
                <span className="text-sm truncate">
                  {hospital.admin?.email || "No email"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-xl border border-white">
                <Phone size={16} className="text-indigo-400" />
                <span className="text-sm">
                  {hospital.admin?.phone || "No contact"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Stethoscope size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">
                {hospital.doctors_count || 0}
              </p>
              <p className="text-sm text-gray-500 font-medium">
                Approved Doctors
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">
                {hospital.assistants_count || 0}
              </p>
              <p className="text-sm text-gray-500 font-medium">
                Doctor Assistants
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{patients}</p>
              <p className="text-sm text-gray-500 font-medium">
                Total Patients
              </p>
            </div>
          </div>
        </div>

        {/* Contact & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail size={18} />
                  <span className="font-medium text-sm">Official Email</span>
                </div>
                <span className="text-gray-900 font-semibold">
                  {hospital.contact_email || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone size={18} />
                  <span className="font-medium text-sm">Official Phone</span>
                </div>
                <span className="text-gray-900 font-semibold">
                  {hospital.contact_phone || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-600">
                  <Globe size={18} />
                  <span className="font-medium text-sm">License Number</span>
                </div>
                <span className="text-gray-900 font-semibold">
                  {hospital.license_number || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
            <div className="absolute bottom-0 right-0 p-4 opacity-10">
              <ShieldCheck size={180} />
            </div>
            <h3 className="text-xl font-bold mb-4">Verification Status</h3>
            <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
              This hospital is currently <strong>{hospital.status}</strong>.
              {hospital.status === "approved"
                ? " All medical staff and assistants are permitted to use system features."
                : " Review the pending documentation to finalize the approval process."}
            </p>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                  System Activity
                </span>
              </div>
              <p className="text-sm font-medium">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HospitalDetailPage;
