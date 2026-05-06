import { useEffect, useState } from "react";
import {
  User,
  Building2,
  UserPlus,
  Users,
  Search,
  Activity,
  FileText,
  Edit,
  History,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Stethoscope,
  Calendar,
  Save,
  CalendarDays,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import Sidebar from "./layout/Sidebar";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type DoctorMeResponse = {
  user: {
    id: string;
    email: string;
    user_metadata?: { full_name?: string; [key: string]: any };
  };
  profile: {
    id: string;
    full_name: string;
    phone?: string;
    gender?: string;
    dob?: string;
    role: string;
    approval_status: "pending" | "approved" | "rejected";
  };
  doctor_profile: {
    profile_id: string;
    specialization: string;
    hospital_id: string;
    license_number: string;
    cnic: string;
    approval_status: "pending" | "approved" | "rejected";
  } | null;
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
    status: "pending" | "approved" | "rejected";
  } | null;
};

type Assistant = {
  profile_id: string;
  full_name: string;
  phone?: string | null;
  approval_status: "pending" | "approved" | "rejected";
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

type DayAvailability = {
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

type AvailabilityRecord = {
  id: string;
  doctor_profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

interface DoctorDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onStartConsultation: (patient: {
    profile_id: string;
    full_name: string;
  }) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_DAY: DayAvailability = {
  enabled:               false,
  start_time:            "09:00",
  end_time:              "17:00",
  slot_duration_minutes: 30,
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function DoctorDashboard({
  onNavigate,
  onLogout,
  onStartConsultation,
}: DoctorDashboardProps) {
  // ── Tab state ─────────────────────────────────────────────
  type Tab = "overview" | "patients" | "availability" | "appointments";
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // ── Data states ───────────────────────────────────────────
  const [doctorInfo, setDoctorInfo]     = useState<DoctorMeResponse | null>(null);
  const [assistants, setAssistants]     = useState<Assistant[]>([]);
  const [patients,   setPatients]       = useState<Patient[]>([]);

  // ── Loading states ────────────────────────────────────────
  const [loadingDoctor,       setLoadingDoctor]       = useState(false);
  const [loadingAssistants,   setLoadingAssistants]   = useState(false);
  const [loadingPatients,     setLoadingPatients]     = useState(false);
  const [creatingAssistant,   setCreatingAssistant]   = useState(false);
  const [savingAvailability,  setSavingAvailability]  = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // ── Search ────────────────────────────────────────────────
  const [patientSearch, setPatientSearch] = useState("");

  // ── Assistant form ────────────────────────────────────────
  const [assistantForm, setAssistantForm] = useState({
    fullName:        "",
    email:           "",
    phone:           "",
    password:        "",
    confirmPassword: "",
  });

  // ── Availability state ────────────────────────────────────
  const [availability, setAvailability] = useState<DayAvailability[]>(
    Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY }))
  );

  // ── Appointments state ────────────────────────────────────
  const [approvedAppointments,  setApprovedAppointments]  = useState<any[]>([]);
  const [loadingAppointments,   setLoadingAppointments]   = useState(false);

  const getToken = () => localStorage.getItem("accessToken");

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const formatGender = (value?: string | null) => {
    if (!value) return "-";
    const g = value.toLowerCase();
    if (g === "m" || g === "male")   return "Male";
    if (g === "f" || g === "female") return "Female";
    return value;
  };

  const formatAppointmentDate = (v: string) => {
    try {
      return new Date(v).toLocaleDateString(undefined, {
        weekday: "short",
        year:    "numeric",
        month:   "short",
        day:     "numeric",
      });
    } catch {
      return v;
    }
  };

  const formatAppointmentTime = (t: string) => {
    try {
      const [h, m] = t.split(":").map(Number);
      const period  = h >= 12 ? "PM" : "AM";
      const hour    = h % 12 === 0 ? 12 : h % 12;
      return `${hour}:${String(m).padStart(2, "0")} ${period}`;
    } catch {
      return t;
    }
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-gray-400">-</span>;
    const config: Record<string, { gradient: string; icon: typeof CheckCircle }> = {
      approved: { gradient: "from-green-50 to-emerald-50 text-green-700 border-green-200",   icon: CheckCircle },
      pending:  { gradient: "from-yellow-50 to-orange-50 text-yellow-700 border-yellow-200", icon: Clock       },
      rejected: { gradient: "from-red-50 to-pink-50 text-red-700 border-red-200",            icon: XCircle     },
    };
    const { gradient, icon: Icon } = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm bg-gradient-to-r ${gradient}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────

  const fetchDoctorInfo = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingDoctor(true);
      const res  = await fetch(`${API_URL}/api/doctor/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load doctor info");
      setDoctorInfo(data as DoctorMeResponse);
    } catch (err: any) {
      toast.error(err.message || "Failed to load doctor info");
    } finally {
      setLoadingDoctor(false);
    }
  };

  const fetchAssistants = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingAssistants(true);
      const res  = await fetch(`${API_URL}/api/doctor/assistants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assistants");
      setAssistants((data.assistants || []) as Assistant[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to load assistants");
    } finally {
      setLoadingAssistants(false);
    }
  };

  const fetchPatients = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingPatients(true);
      const res  = await fetch(`${API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients((data.patients || []) as Patient[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchAvailability = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingAvailability(true);
      const res  = await fetch(`${API_URL}/api/doctor/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load availability");

      const records = (data.availability || []) as AvailabilityRecord[];
      setAvailability((prev) =>
        prev.map((day, index) => {
          const record = records.find((r) => r.day_of_week === index);
          if (record) {
            return {
              enabled:               true,
              start_time:            record.start_time.substring(0, 5),
              end_time:              record.end_time.substring(0, 5),
              slot_duration_minutes: record.slot_duration_minutes,
            };
          }
          return { ...DEFAULT_DAY };
        })
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load availability");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchApprovedAppointments = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoadingAppointments(true);
      const res = await fetch(`${API_URL}/api/appointments/doctor/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load appointments");
      setApprovedAppointments(data.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load appointments");
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchDoctorInfo();
    fetchAssistants();
    fetchPatients();
    fetchAvailability();
    fetchApprovedAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────
  // ASSISTANT CREATION
  // ─────────────────────────────────────────────────────────

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    if (assistantForm.password !== assistantForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      setCreatingAssistant(true);
      const res = await fetch(`${API_URL}/api/doctor/assistants`, {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: assistantForm.fullName,
          email:    assistantForm.email,
          phone:    assistantForm.phone,
          password: assistantForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create assistant");
      toast.success("Assistant created and pending approval");
      setAssistantForm({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
      fetchAssistants();
    } catch (err: any) {
      toast.error(err.message || "Failed to create assistant");
    } finally {
      setCreatingAssistant(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // AVAILABILITY SAVE
  // ─────────────────────────────────────────────────────────

  const handleSaveAvailability = async () => {
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }

    const payload = availability
      .map((day, index) => ({
        day_of_week:           index,
        start_time:            day.start_time,
        end_time:              day.end_time,
        slot_duration_minutes: day.slot_duration_minutes,
        enabled:               day.enabled,
      }))
      .filter((d) => d.enabled);

    for (const day of payload) {
      if (day.start_time >= day.end_time) {
        toast.error(`${DAY_NAMES[day.day_of_week]}: Start time must be before end time`);
        return;
      }
    }

    try {
      setSavingAvailability(true);
      const res = await fetch(`${API_URL}/api/doctor/availability`, {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ availability: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save availability");
      toast.success("Availability saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save availability");
    } finally {
      setSavingAvailability(false);
    }
  };

  const updateDay = (
    index:  number,
    field:  keyof DayAvailability,
    value:  string | boolean | number
  ) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  // ─────────────────────────────────────────────────────────
  // DERIVED
  // ─────────────────────────────────────────────────────────

  const doctorName     = doctorInfo?.profile.full_name || doctorInfo?.user.email || "Doctor";
  const specialization = doctorInfo?.doctor_profile?.specialization || "-";
  const license        = doctorInfo?.doctor_profile?.license_number || "-";
  const cnic           = doctorInfo?.doctor_profile?.cnic || "-";
  const phone          = doctorInfo?.profile.phone || "-";
  const hospital       = doctorInfo?.hospital;

  const search           = patientSearch.trim().toLowerCase();
  const visiblePatients  = search
    ? patients.filter((p) =>
        (p.full_name?.toLowerCase() || "").includes(search) ||
        (p.cnic?.toLowerCase()      || "").includes(search) ||
        (p.phone?.toLowerCase()     || "").includes(search)
      )
    : patients;

  // ─────────────────────────────────────────────────────────
  // TABS
  // ─────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "overview",      label: "Overview",      icon: User         },
    { id: "patients",      label: "Patients",      icon: Users        },
    { id: "availability",  label: "Availability",  icon: CalendarDays },
    { id: "appointments",  label: "Appointments",  icon: Calendar     },
  ];

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Sidebar
        currentPage="doctor-dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        userRole="doctor"
        userName={doctorName}
        userSubtitle={specialization}
      />

      <div className="flex-1 ml-64">
        {/* Header */}
        <div
          className="p-8 shadow-lg"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #14B8A6 100%)" }}
        >
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-semibold text-white">Doctor Dashboard</h1>
            </div>
            <p className="text-white/90">
              Manage your practice, assistants, and patients
            </p>

            {/* Tab Bar */}
            <div className="flex gap-2 mt-6 flex-wrap">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white text-blue-700 shadow-lg"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === "appointments" && approvedAppointments.length > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700"
                          : "bg-white/30 text-white"
                      }`}>
                        {approvedAppointments.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-[1400px] mx-auto space-y-8">

          {/* ── OVERVIEW TAB ─────────────────────────────── */}
          {activeTab === "overview" && (
            <>
              {/* Doctor Profile Card */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
                <div className="relative">
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)" }}
                    >
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2
                        className="text-2xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor:  "transparent",
                        }}
                      >
                        {doctorName}
                      </h2>
                      <p className="text-sm text-gray-500">{specialization}</p>
                    </div>
                    {getStatusBadge(doctorInfo?.doctor_profile?.approval_status)}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "License",  value: license },
                      { label: "CNIC",     value: cnic    },
                      { label: "Phone",    value: phone   },
                      { label: "Hospital", value: hospital?.name || "-" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="p-4 rounded-2xl border"
                        style={{
                          background:  "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                          borderColor: "#bfdbfe",
                        }}
                      >
                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                        <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assistants */}
              <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-purple-100 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -mr-32 -mb-32" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
                      >
                        <UserPlus className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2
                          className="text-xl font-semibold mb-1"
                          style={{
                            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor:  "transparent",
                          }}
                        >
                          My Assistants
                        </h2>
                        <p className="text-sm text-gray-500">
                          {assistants.length} assistant{assistants.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchAssistants} disabled={loadingAssistants} className="rounded-xl">
                      <RefreshCw className={`w-4 h-4 ${loadingAssistants ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  {loadingAssistants ? (
                    <p className="text-center text-gray-400 py-4">Loading...</p>
                  ) : assistants.length === 0 ? (
                    <p className="text-center text-gray-400 py-4">No assistants yet</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                      {assistants.map((a) => (
                        <div
                          key={a.profile_id}
                          className="p-4 rounded-2xl border-2 border-purple-100 flex items-center justify-between"
                          style={{ background: "linear-gradient(90deg, #faf5ff 0%, #ede9fe 100%)" }}
                        >
                          <div>
                            <p className="font-semibold text-gray-800">{a.full_name}</p>
                            <p className="text-xs text-gray-500">{a.phone || "No phone"}</p>
                          </div>
                          {getStatusBadge(a.approval_status)}
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleCreateAssistant} className="space-y-4 border-t-2 border-purple-100 pt-6">
                    <h3 className="font-semibold text-gray-700">Add New Assistant</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input placeholder="Full name" value={assistantForm.fullName}
                          onChange={(e) => setAssistantForm((p) => ({ ...p, fullName: e.target.value }))}
                          required disabled={creatingAssistant} className="h-11 border-2" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input type="email" placeholder="Email address" value={assistantForm.email}
                          onChange={(e) => setAssistantForm((p) => ({ ...p, email: e.target.value }))}
                          required disabled={creatingAssistant} className="h-11 border-2" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input placeholder="Phone number" value={assistantForm.phone}
                          onChange={(e) => setAssistantForm((p) => ({ ...p, phone: e.target.value }))}
                          disabled={creatingAssistant} className="h-11 border-2" />
                      </div>
                      <div className="space-y-2">
                        <Label>Password *</Label>
                        <Input type="password" placeholder="Password" value={assistantForm.password}
                          onChange={(e) => setAssistantForm((p) => ({ ...p, password: e.target.value }))}
                          required disabled={creatingAssistant} className="h-11 border-2" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Confirm Password *</Label>
                        <Input type="password" placeholder="Confirm password" value={assistantForm.confirmPassword}
                          onChange={(e) => setAssistantForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          required disabled={creatingAssistant} className="h-11 border-2" />
                      </div>
                    </div>
                    <Button type="submit" disabled={creatingAssistant} className="h-11 px-8 text-white"
                      style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {creatingAssistant ? "Creating..." : "Create Assistant"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Consultation Workspace */}
              <div className="rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #2563EB 0%, #8B5CF6 50%, #14B8A6 100%)" }}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="relative">
                  <h2 className="text-2xl font-semibold mb-2 text-white flex items-center gap-3">
                    <Sparkles className="w-7 h-7" />
                    Consultation Workspace
                  </h2>
                  <p className="text-white/80 mb-6">AI-powered clinical tools</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { page: "recording",  icon: Activity, label: "Start Consultation", sub: "Begin recording",  grad: "#2563EB, #3B82F6" },
                      { page: "extraction", icon: FileText, label: "Latest Extraction",  sub: "AI insights",     grad: "#14B8A6, #10B981" },
                      { page: "notes",      icon: Edit,     label: "Edit Notes",         sub: "Documentation",   grad: "#6366F1, #8B5CF6" },
                      { page: "history",    icon: History,  label: "History",            sub: "Past records",    grad: "#22C55E, #16A34A" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button key={item.page} type="button" onClick={() => onNavigate(item.page)}
                          className="bg-white p-6 rounded-2xl hover:scale-105 transition-all shadow-lg">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md"
                            style={{ background: `linear-gradient(135deg, ${item.grad})` }}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <p className="font-semibold text-gray-800">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── PATIENTS TAB ──────────────────────────────── */}
          {activeTab === "patients" && (
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-green-100 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-green-100 to-teal-100 rounded-full blur-3xl opacity-30 -ml-32 -mb-32" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)" }}>
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor:  "transparent",
                        }}>
                        Patients
                      </h2>
                      <p className="text-sm text-gray-500">{patients.length} patients in your hospital</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchPatients} disabled={loadingPatients} className="rounded-xl">
                    <RefreshCw className={`w-4 h-4 ${loadingPatients ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input placeholder="Search by name, CNIC, or phone..." value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)} className="pl-10 h-12 border-2"
                    style={{ background: "linear-gradient(90deg, #fafafa 0%, #f0fdf4 100%)" }} />
                </div>

                {loadingPatients ? (
                  <div className="text-center py-8 text-gray-500">Loading patients...</div>
                ) : visiblePatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {patients.length === 0 ? "No patients registered yet." : "No patients match your search."}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {visiblePatients.map((patient) => (
                      <div key={patient.id} className="p-4 rounded-2xl border-2 border-gray-100 hover:border-green-200 transition-all"
                        style={{ background: "linear-gradient(90deg, #fafafa 0%, #f0fdf4 100%)" }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 mb-2">{patient.full_name}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">CNIC:</span>
                                <span className="font-medium text-gray-700">{patient.cnic}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Phone:</span>
                                <span className="font-medium text-gray-700">{patient.phone || "-"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Gender:</span>
                                <span className="font-medium text-gray-700">{formatGender(patient.gender)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">DOB:</span>
                                <span className="font-medium text-gray-700">{formatDate(patient.dob)}</span>
                              </div>
                            </div>
                          </div>
                          <Button type="button" className="h-9 px-4 rounded-xl text-white text-xs shrink-0"
                            style={{ background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }}
                            onClick={() => onStartConsultation({ profile_id: patient.id, full_name: patient.full_name })}>
                            Start Consultation
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AVAILABILITY TAB ──────────────────────────── */}
          {activeTab === "availability" && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }}>
                      <CalendarDays className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor:  "transparent",
                        }}>
                        Weekly Availability
                      </h2>
                      <p className="text-sm text-gray-500">
                        Set your working hours for each day. Patients will see available slots based on this.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchAvailability} disabled={loadingAvailability} className="rounded-xl shrink-0">
                    <RefreshCw className={`w-4 h-4 ${loadingAvailability ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {loadingAvailability ? (
                  <div className="text-center py-12 text-gray-400">Loading availability...</div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {DAY_NAMES.map((dayName, index) => {
                        const day = availability[index];
                        return (
                          <div key={dayName} className={`p-5 rounded-2xl border-2 transition-all ${
                            day.enabled ? "border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50" : "border-gray-100 bg-gray-50"
                          }`}>
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-3 w-36 shrink-0">
                                <button type="button" onClick={() => updateDay(index, "enabled", !day.enabled)}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${day.enabled ? "bg-blue-600" : "bg-gray-300"}`}>
                                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${day.enabled ? "translate-x-6" : "translate-x-0"}`} />
                                </button>
                                <span className={`font-semibold text-sm ${day.enabled ? "text-blue-700" : "text-gray-400"}`}>{dayName}</span>
                              </div>

                              {day.enabled && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
                                    <input type="time" value={day.start_time}
                                      onChange={(e) => updateDay(index, "start_time", e.target.value)}
                                      className="h-9 px-3 rounded-xl border-2 border-blue-200 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
                                    <input type="time" value={day.end_time}
                                      onChange={(e) => updateDay(index, "end_time", e.target.value)}
                                      className="h-9 px-3 rounded-xl border-2 border-blue-200 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 whitespace-nowrap">Slot</label>
                                    <select value={day.slot_duration_minutes}
                                      onChange={(e) => updateDay(index, "slot_duration_minutes", Number(e.target.value))}
                                      className="h-9 px-3 rounded-xl border-2 border-blue-200 text-sm focus:outline-none focus:border-blue-400 bg-white">
                                      {[10, 15, 20, 30, 45, 60].map((m) => (
                                        <option key={m} value={m}>{m} min</option>
                                      ))}
                                    </select>
                                  </div>
                                  {day.start_time && day.end_time && day.start_time < day.end_time && (
                                    <div className="ml-auto">
                                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                        {Math.floor((timeToMinutes(day.end_time) - timeToMinutes(day.start_time)) / day.slot_duration_minutes)} slots
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                              {!day.enabled && <span className="text-xs text-gray-400 ml-2">Not available</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button onClick={handleSaveAvailability} disabled={savingAvailability}
                        className="h-12 px-10 text-white rounded-xl"
                        style={{ background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }}>
                        <Save className="w-4 h-4 mr-2" />
                        {savingAvailability ? "Saving..." : "Save Availability"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── APPOINTMENTS TAB ──────────────────────────── */}
          {activeTab === "appointments" && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32" />
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)" }}
                    >
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2
                        className="text-2xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Approved Appointments
                      </h2>
                      <p className="text-sm text-gray-500">
                        {approvedAppointments.length} appointment{approvedAppointments.length !== 1 ? "s" : ""} approved and waiting
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchApprovedAppointments}
                    disabled={loadingAppointments} className="rounded-xl shrink-0">
                    <RefreshCw className={`w-4 h-4 ${loadingAppointments ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {/* Content */}
                {loadingAppointments ? (
                  <div className="text-center py-12 text-gray-400">Loading appointments...</div>
                ) : approvedAppointments.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No approved appointments</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Appointments will appear here after your assistant approves them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedAppointments.map((appt: any) => {
                      const patientProfiles = appt.patient_profiles || {};
                      const patientInfo     = patientProfiles.profiles || {};
                      const hospitalInfo    = appt.hospitals || {};

                      return (
                        <div key={appt.id}
                          className="p-5 rounded-2xl border-2 border-blue-100 hover:border-blue-200 transition-all"
                          style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%)" }}>
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Patient info */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white"
                                style={{ background: "linear-gradient(135deg, #2563EB, #14B8A6)" }}>
                                {patientInfo.full_name?.charAt(0)?.toUpperCase() || "P"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">
                                  {patientInfo.full_name || "Unknown Patient"}
                                </p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {patientInfo.phone && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">📞 {patientInfo.phone}</span>
                                  )}
                                  {patientInfo.gender && (
                                    <span className="text-xs text-gray-500 capitalize">{patientInfo.gender}</span>
                                  )}
                                  {patientProfiles.cnic && (
                                    <span className="text-xs text-gray-400 font-mono">CNIC: {patientProfiles.cnic}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-blue-100">
                                <CalendarDays className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-gray-700">
                                  {formatAppointmentDate(appt.appointment_date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-blue-100">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-gray-700">
                                  {formatAppointmentTime(appt.appointment_time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-blue-100">
                                <Building2 className="w-4 h-4 text-teal-600" />
                                <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">
                                  {hospitalInfo.name || "—"}
                                </span>
                              </div>
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approved
                              </span>
                              <button type="button"
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                                style={{ background: "linear-gradient(135deg, #2563EB, #14B8A6)" }}
                                onClick={() => onStartConsultation({
                                  profile_id: patientProfiles.profile_id,
                                  full_name:  patientInfo.full_name || "Unknown",
                                })}>
                                Start Consultation
                              </button>
                            </div>
                          </div>

                          {appt.notes && (
                            <div className="mt-3 px-4 py-2 rounded-xl bg-white border border-gray-100 text-xs text-gray-500">
                              <span className="font-medium text-gray-600">Notes: </span>{appt.notes}
                            </div>
                          )}
                          {patientProfiles.medical_history && (
                            <div className="mt-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
                              <span className="font-medium">Medical History: </span>{patientProfiles.medical_history}
                            </div>
                          )}
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

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}