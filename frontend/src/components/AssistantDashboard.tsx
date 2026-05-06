import { useEffect, useState } from "react";
import {
  UserCog,
  User,
  Building2,
  Search,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users as UsersIcon,
  RefreshCw,
  Stethoscope,
  Calendar,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import Sidebar from "./layout/Sidebar";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type AssistantMeResponse = {
  user: { id: string; email: string };
  profile: {
    id: string;
    full_name: string;
    phone?: string;
    role: string;
    approval_status: "pending" | "approved" | "rejected";
  };
  assistant_link: {
    doctor_profile_id: string;
    hospital_id: string;
    approval_status: "pending" | "approved" | "rejected";
  } | null;
  doctor: { id: string; full_name: string; phone?: string } | null;
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
    status: string;
  } | null;
};

type Patient = {
  id: string;
  full_name: string;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  cnic: string;
  created_at: string;
};

type ExistingPatientSearchResult = {
  found: boolean;
  patient?: {
    id: string;
    full_name: string;
    phone?: string | null;
    gender?: string | null;
    dob?: string | null;
    cnic: string;
  };
  hospitals?: { id: string; name: string }[];
};

// Nested shape from /appointments/assistant/all
type AppointmentFromAPI = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  patient_profiles: {
    profile_id: string;
    cnic: string;
    profiles: {
      full_name: string;
      phone: string | null;
      gender: string | null;
      dob: string | null;
    };
  };
  doctor_profiles: {
    profile_id: string;
    specialization: string;
    profiles: { full_name: string };
  };
  hospitals: { id: string; name: string };
};

interface AssistantDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function AssistantDashboard({ onNavigate, onLogout }: AssistantDashboardProps) {
  // ── Tab state ─────────────────────────────────────────────
  type Tab = "patients" | "appointments";
  const [activeTab, setActiveTab] = useState<Tab>("patients");

  // ── Data states ───────────────────────────────────────────
  const [assistantInfo, setAssistantInfo] = useState<AssistantMeResponse | null>(null);
  const [patients,      setPatients]      = useState<Patient[]>([]);
  const [appointments,  setAppointments]  = useState<AppointmentFromAPI[]>([]);

  // ── Loading ───────────────────────────────────────────────
  const [loading,             setLoading]             = useState(false);
  const [loadingPatients,     setLoadingPatients]     = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [creating,            setCreating]            = useState(false);
  const [searchingExisting,   setSearchingExisting]   = useState(false);
  const [handlingId,          setHandlingId]          = useState<string | null>(null);

  // ── Appointment filter ────────────────────────────────────
  type ApptFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";
  const [apptFilter, setApptFilter] = useState<ApptFilter>("pending");

  // ── Patient search ────────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState("");

  // ── Existing patient search ───────────────────────────────
  const [existingCnic,     setExistingCnic]     = useState("");
  const [existingResult,   setExistingResult]   = useState<ExistingPatientSearchResult | null>(null);
  const [verificationError,setVerificationError]= useState("");

  // ── New patient form ──────────────────────────────────────
  const [newPatientForm, setNewPatientForm] = useState({
    fullName: "", cnic: "", phone: "", gender: "", dob: "",
  });

  const getToken = () => localStorage.getItem("accessToken");

  // ─────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────

  const fetchAssistantInfo = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/assistant/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setAssistantInfo(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load assistant info");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingPatients(true);
      const res  = await fetch(`${API_URL}/api/assistant/patients`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients(data.patients || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchAppointments = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingAppointments(true);
      const res  = await fetch(`${API_URL}/api/appointments/assistant/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load appointments");
      setAppointments(data.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load appointments");
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchAssistantInfo();
    fetchPatients();
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────
  // HANDLE APPOINTMENT (approve / reject)
  // ─────────────────────────────────────────────────────────

  const handleAppointment = async (
    appointmentId: string,
    action: "approved" | "rejected"
  ) => {
    const token = getToken();
    if (!token) return;
    try {
      setHandlingId(appointmentId);
      const res = await fetch(
        `${API_URL}/api/appointments/${appointmentId}/handle`,
        {
          method:  "PATCH",
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to handle appointment");
      toast.success(`Appointment ${action} successfully`);
      // Update locally
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: action } : a
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to handle appointment");
    } finally {
      setHandlingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────
  // EXISTING PATIENT SEARCH
  // ─────────────────────────────────────────────────────────

  const handleSearchExisting = async () => {
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    const cnic = existingCnic.trim();
    if (!cnic) { toast.error("Enter a CNIC to search"); return; }
    try {
      setSearchingExisting(true);
      setExistingResult(null);
      setVerificationError("");
      const res  = await fetch(
        `${API_URL}/api/assistant/patients/search?cnic=${encodeURIComponent(cnic)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search patient");
      setExistingResult(data);
      if (!data.found) setVerificationError("No patient found with this CNIC");
    } catch (err: any) {
      toast.error(err.message || "Failed to search patient");
    } finally {
      setSearchingExisting(false);
    }
  };

  const handleLinkExisting = async () => {
    const token = getToken();
    if (!token || !existingResult?.found || !existingResult.patient) return;
    const p = existingResult.patient;
    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/assistant/patients`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName: p.full_name, cnic: p.cnic, phone: p.phone, gender: p.gender, dob: p.dob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add patient");
      if (data.status === "linked")          toast.success("Existing patient linked to this hospital.");
      else if (data.status === "already_exists") toast.info("Patient already registered here.");
      else                                   toast.success("Patient registered.");
      setExistingCnic(""); setExistingResult(null); setVerificationError("");
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || "Failed to link patient");
    } finally {
      setCreating(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // NEW PATIENT REGISTRATION
  // ─────────────────────────────────────────────────────────

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    try {
      setCreating(true);
      const payload: any = {
        fullName: newPatientForm.fullName.trim(),
        cnic:     newPatientForm.cnic.trim(),
      };
      if (newPatientForm.phone.trim()) payload.phone  = newPatientForm.phone.trim();
      if (newPatientForm.gender)       payload.gender = newPatientForm.gender;
      if (newPatientForm.dob)          payload.dob    = newPatientForm.dob;

      const res  = await fetch(`${API_URL}/api/assistant/patients`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add patient");

      if (data.status === "created")           toast.success("New patient registered.");
      else if (data.status === "linked")       toast.success("Patient linked to this hospital.");
      else if (data.status === "already_exists") toast.info("Patient already here.");
      else                                     toast.success("Patient saved.");

      setNewPatientForm({ fullName: "", cnic: "", phone: "", gender: "", dob: "" });
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || "Failed to add patient");
    } finally {
      setCreating(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-gray-400">-</span>;
    const config: Record<string, { className: string; icon: typeof CheckCircle }> = {
      approved:  { className: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle },
      pending:   { className: "bg-yellow-100 text-yellow-700 border-yellow-200",icon: Clock       },
      rejected:  { className: "bg-red-100 text-red-700 border-red-200",         icon: XCircle     },
      completed: { className: "bg-blue-100 text-blue-700 border-blue-200",      icon: CheckCircle },
      cancelled: { className: "bg-gray-100 text-gray-600 border-gray-200",      icon: XCircle     },
    };
    const { className, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${className}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (v?: string | null) => {
    if (!v) return "-";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const formatTime = (t: string) => {
    try {
      const [h, m]  = t.split(":").map(Number);
      const period  = h >= 12 ? "PM" : "AM";
      const hour    = h % 12 === 0 ? 12 : h % 12;
      return `${hour}:${String(m).padStart(2, "0")} ${period}`;
    } catch { return t; }
  };

  // Derived
  const assistantName   = assistantInfo?.profile.full_name || "Assistant";
  const doctor          = assistantInfo?.doctor;
  const hospital        = assistantInfo?.hospital;

  const search          = patientSearch.trim().toLowerCase();
  const visiblePatients = search
    ? patients.filter((p) =>
        (p.full_name?.toLowerCase() || "").includes(search) ||
        (p.cnic?.toLowerCase()      || "").includes(search) ||
        (p.phone?.toLowerCase()     || "").includes(search)
      )
    : patients;

  const filteredAppointments = apptFilter === "all"
    ? appointments
    : appointments.filter((a) => a.status === apptFilter);

  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      <Sidebar
        currentPage="assistant-dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        userRole="doctor_assistant"
        userName={assistantName}
        userSubtitle="Doctor Assistant"
      />

      <div className="flex-1 ml-64">
        {/* Header */}
        <div
          className="p-8 shadow-lg"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #FB923C 50%, #F97316 100%)" }}
        >
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <UserCog className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-semibold text-white">
                Doctor Assistant Dashboard
              </h1>
            </div>
            <p className="text-white/90">Manage patients and appointments</p>

            {/* Tab Bar */}
            <div className="flex gap-2 mt-6">
              {[
                { id: "patients",      label: "Patients",      icon: UsersIcon },
                { id: "appointments",  label: `Appointments${pendingCount > 0 ? ` (${pendingCount})` : ""}`, icon: Calendar },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-orange-700 shadow-lg"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">

          {/* ── PATIENTS TAB ──────────────────────────────── */}
          {activeTab === "patients" && (
            <>
              {/* Assistant Profile */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-orange-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
                <div className="relative">
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
                    >
                      <UserCog className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2
                        className="text-2xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor:  "transparent",
                        }}
                      >
                        {assistantName}
                      </h2>
                      <p className="text-sm text-gray-500">Doctor Assistant</p>
                    </div>
                    {getStatusBadge(assistantInfo?.profile.approval_status)}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Doctor */}
                    <div className="p-4 rounded-2xl border-2 border-blue-100"
                      style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-semibold text-blue-700">Assigned Doctor</p>
                      </div>
                      {doctor ? (
                        <>
                          <p className="font-semibold text-gray-800">{doctor.full_name}</p>
                          <p className="text-xs text-gray-500">{doctor.phone || "No phone"}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">No doctor assigned</p>
                      )}
                    </div>

                    {/* Hospital */}
                    <div className="p-4 rounded-2xl border-2 border-teal-100"
                      style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        <p className="text-sm font-semibold text-teal-700">Hospital</p>
                      </div>
                      {hospital ? (
                        <>
                          <p className="font-semibold text-gray-800">{hospital.name}</p>
                          <p className="text-xs text-gray-500">{hospital.address || "No address"}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">No hospital linked</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Existing Patient */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-green-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-green-100 to-teal-100 rounded-full blur-3xl opacity-30 -ml-32 -mt-32" />
                <div className="relative">
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)" }}
                    >
                      <Search className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2
                        className="text-2xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor:  "transparent",
                        }}
                      >
                        Search Existing Patient
                      </h2>
                      <p className="text-sm text-gray-500">Find and verify patient by CNIC</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter CNIC (e.g., 42301-1234567-8)"
                        value={existingCnic}
                        onChange={(e) => setExistingCnic(e.target.value)}
                        className="h-12 border-2"
                        onKeyDown={(e) => e.key === "Enter" && handleSearchExisting()}
                      />
                    </div>
                    <Button
                      onClick={handleSearchExisting}
                      disabled={searchingExisting}
                      className="h-12 px-8 text-white"
                      style={{ background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)" }}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {searchingExisting ? "Searching..." : "Search"}
                    </Button>
                  </div>

                  {existingResult?.found && existingResult.patient && (
                    <div className="mt-4 p-6 rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" /> Patient Found
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: "Full Name", value: existingResult.patient.full_name },
                          { label: "CNIC",      value: existingResult.patient.cnic      },
                          { label: "Phone",     value: existingResult.patient.phone || "-" },
                          { label: "DOB",       value: existingResult.patient.dob   || "-" },
                        ].map((item) => (
                          <div key={item.label} className="p-3 bg-white rounded-xl shadow-sm">
                            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                            <p className="font-semibold text-gray-800">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={handleLinkExisting}
                        disabled={creating}
                        className="w-full h-11 text-white"
                        style={{ background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)" }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {creating ? "Adding..." : "Add to This Hospital"}
                      </Button>
                    </div>
                  )}

                  {!existingResult?.found && verificationError && (
                    <div className="mt-4 flex items-center gap-2 p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-700">{verificationError}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Register New Patient */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-100 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -mr-32 -mb-32" />
                <div className="relative">
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
                    >
                      <UserPlus className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2
                        className="text-2xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor:  "transparent",
                        }}
                      >
                        Register New Patient
                      </h2>
                      <p className="text-sm text-gray-500">Add a new patient to the system</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddPatient} className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        placeholder="Full name"
                        value={newPatientForm.fullName}
                        onChange={(e) => setNewPatientForm((p) => ({ ...p, fullName: e.target.value }))}
                        required disabled={creating} className="h-11 border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNIC *</Label>
                      <Input
                        placeholder="42301-1234567-1"
                        value={newPatientForm.cnic}
                        onChange={(e) => setNewPatientForm((p) => ({ ...p, cnic: e.target.value }))}
                        required disabled={creating} className="h-11 border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+92 300 0000000"
                        value={newPatientForm.phone}
                        onChange={(e) => setNewPatientForm((p) => ({ ...p, phone: e.target.value }))}
                        disabled={creating} className="h-11 border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <select
                        value={newPatientForm.gender}
                        onChange={(e) => setNewPatientForm((p) => ({ ...p, gender: e.target.value }))}
                        className="w-full h-11 px-3 rounded-xl border-2 border-gray-200 bg-white"
                        disabled={creating}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <input
                        type="date"
                        value={newPatientForm.dob}
                        onChange={(e) => setNewPatientForm((p) => ({ ...p, dob: e.target.value }))}
                        className="w-full h-11 px-3 rounded-xl border-2 border-gray-200 bg-white text-sm"
                        disabled={creating}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        disabled={creating}
                        className="h-11 w-full text-white"
                        style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {creating ? "Registering..." : "Register Patient"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Patients List */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)" }}
                      >
                        <UsersIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2
                          className="text-2xl font-semibold"
                          style={{
                            background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor:  "transparent",
                          }}
                        >
                          Hospital Patients
                        </h2>
                        <p className="text-sm text-gray-500">{patients.length} registered</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search name, CNIC, phone..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="pl-10 h-11 border-2"
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchPatients} disabled={loadingPatients} className="rounded-xl">
                        <RefreshCw className={`w-4 h-4 ${loadingPatients ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  {loadingPatients ? (
                    <div className="text-center py-8 text-gray-400">Loading patients...</div>
                  ) : visiblePatients.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      {patients.length === 0 ? "No patients registered yet." : "No patients match your search."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b-2 border-gray-200">
                          <tr className="text-left">
                            {["Patient Name", "CNIC", "Phone", "Gender", "Date of Birth", "Registered"].map((h) => (
                              <th key={h} className="py-3 px-4 text-sm font-semibold text-gray-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePatients.map((patient) => (
                            <tr key={patient.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                              <td className="py-4 px-4 font-semibold text-gray-800">{patient.full_name}</td>
                              <td className="py-4 px-4 text-sm text-gray-500 font-mono">{patient.cnic}</td>
                              <td className="py-4 px-4 text-sm text-gray-500">{patient.phone || "-"}</td>
                              <td className="py-4 px-4 text-sm text-gray-500 capitalize">{patient.gender || "-"}</td>
                              <td className="py-4 px-4 text-sm text-gray-500">{formatDate(patient.dob)}</td>
                              <td className="py-4 px-4 text-sm text-gray-500">{formatDate(patient.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── APPOINTMENTS TAB ──────────────────────────── */}
          {activeTab === "appointments" && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-orange-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
                    >
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2
                        className="text-2xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor:  "transparent",
                        }}
                      >
                        Appointments
                      </h2>
                      <p className="text-sm text-gray-500">
                        {appointments.length} total · {pendingCount} pending
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAppointments}
                    disabled={loadingAppointments}
                    className="rounded-xl"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingAppointments ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {(["all", "pending", "approved", "rejected", "cancelled"] as ApptFilter[]).map((f) => {
                    const count = f === "all"
                      ? appointments.length
                      : appointments.filter((a) => a.status === f).length;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setApptFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                          apptFilter === f
                            ? "border-orange-400 bg-orange-50 text-orange-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200"
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {count > 0 && (
                          <span className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Appointments List */}
                {loadingAppointments ? (
                  <div className="text-center py-12 text-gray-400">Loading appointments...</div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No {apptFilter === "all" ? "" : apptFilter} appointments found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAppointments.map((appt) => {
                      const patientProfile = appt.patient_profiles;
                      const patientName    = patientProfile?.profiles?.full_name || "Unknown";
                      const patientCnic    = patientProfile?.cnic || "-";
                      const doctorName     = appt.doctor_profiles?.profiles?.full_name || "Unknown";
                      const isPending      = appt.status === "pending";
                      const isHandling     = handlingId === appt.id;

                      return (
                        <div
                          key={appt.id}
                          className={`p-6 rounded-2xl border-2 transition-all ${
                            isPending
                              ? "border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50"
                              : "border-gray-100 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Status + Date row */}
                              <div className="flex items-center gap-3 mb-3">
                                {getStatusBadge(appt.status)}
                                <span className="text-xs text-gray-500">
                                  Booked {formatDate(appt.created_at)}
                                </span>
                              </div>

                              {/* Patient info */}
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                                <div>
                                  <span className="text-xs text-gray-500 block">Patient</span>
                                  <span className="font-semibold text-gray-800">{patientName}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block">CNIC</span>
                                  <span className="font-medium text-gray-700 font-mono">{patientCnic}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block">Doctor</span>
                                  <span className="font-medium text-gray-700">Dr. {doctorName}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block">Hospital</span>
                                  <span className="font-medium text-gray-700">{appt.hospitals?.name || "-"}</span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block">Date</span>
                                  <span className="font-medium text-gray-700">
                                    {formatDate(appt.appointment_date)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500 block">Time</span>
                                  <span className="font-medium text-gray-700">
                                    {formatTime(appt.appointment_time)}
                                  </span>
                                </div>
                              </div>

                              {/* Notes */}
                              {appt.notes && (
                                <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-600">
                                  <span className="font-medium text-gray-500">Notes: </span>
                                  {appt.notes}
                                </div>
                              )}
                            </div>

                            {/* Action buttons — only for pending */}
                            {isPending && (
                              <div className="flex flex-col gap-2 shrink-0">
                                <Button
                                  onClick={() => handleAppointment(appt.id, "approved")}
                                  disabled={isHandling}
                                  className="h-10 px-5 text-white text-sm"
                                  style={{ background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)" }}
                                >
                                  <ThumbsUp className="w-4 h-4 mr-1.5" />
                                  {isHandling ? "..." : "Approve"}
                                </Button>
                                <Button
                                  onClick={() => handleAppointment(appt.id, "rejected")}
                                  disabled={isHandling}
                                  className="h-10 px-5 text-white text-sm"
                                  style={{ background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)" }}
                                >
                                  <ThumbsDown className="w-4 h-4 mr-1.5" />
                                  {isHandling ? "..." : "Reject"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>  
    </div>
  );
}