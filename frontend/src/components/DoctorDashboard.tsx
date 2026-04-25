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
  TrendingUp,
  RefreshCw,
  Stethoscope,
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
  id: string; // assumed to be patient_profiles.profile_id
  full_name: string;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  cnic: string;
  created_at: string;
};

interface DoctorDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  // NEW: start consultation with a selected patient
  onStartConsultation: (patient: { profile_id: string; full_name: string }) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function DoctorDashboard({
  onNavigate,
  onLogout,
  onStartConsultation,
}: DoctorDashboardProps) {
  // Data states
  const [doctorInfo, setDoctorInfo] = useState<DoctorMeResponse | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Loading states
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [creatingAssistant, setCreatingAssistant] = useState(false);

  // Search state
  const [patientSearch, setPatientSearch] = useState("");

  // Assistant form state
  const [assistantForm, setAssistantForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const getToken = () => localStorage.getItem("accessToken");

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatGender = (value?: string | null) => {
    if (!value) return "-";
    const g = value.toLowerCase();
    if (g === "m" || g === "male") return "Male";
    if (g === "f" || g === "female") return "Female";
    return value;
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-gray-400">-</span>;

    const config: Record<string, { gradient: string; icon: typeof CheckCircle }> = {
      approved: {
        gradient: "from-green-50 to-emerald-50 text-green-700 border-green-200",
        icon: CheckCircle,
      },
      pending: {
        gradient: "from-yellow-50 to-orange-50 text-yellow-700 border-yellow-200",
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm bg-gradient-to-r ${gradient}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ─────────────────────────────────────────────────────────────

  const fetchDoctorInfo = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingDoctor(true);
      const res = await fetch(`${API_URL}/api/doctor/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load doctor info");
      setDoctorInfo(data as DoctorMeResponse);
    } catch (err: any) {
      console.error(err);
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
      const res = await fetch(`${API_URL}/api/doctor/assistants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assistants");
      setAssistants((data.assistants || []) as Assistant[]);
    } catch (err: any) {
      console.error(err);
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
      const res = await fetch(`${API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error) toast.error(data.error);
        throw new Error(data.error || "Failed to load patients");
      }
      setPatients((data.patients || []) as Patient[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchDoctorInfo();
    fetchAssistants();
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ASSISTANT CREATION
  // ─────────────────────────────────────────────────────────────

  const handleAssistantInputChange = (
    field: keyof typeof assistantForm,
    value: string
  ) => {
    setAssistantForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    if (assistantForm.password !== assistantForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setCreatingAssistant(true);
      const res = await fetch(`${API_URL}/api/doctor/assistants`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: assistantForm.fullName,
          email: assistantForm.email,
          phone: assistantForm.phone,
          password: assistantForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create assistant");
      toast.success("Assistant created and pending approval");
      setAssistantForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      fetchAssistants();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create assistant");
    } finally {
      setCreatingAssistant(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DERIVED VALUES
  // ─────────────────────────────────────────────────────────────

  const doctorName =
    doctorInfo?.profile.full_name ||
    doctorInfo?.user.user_metadata?.full_name ||
    doctorInfo?.user.email ||
    "Doctor";

  const specialization = doctorInfo?.doctor_profile?.specialization || "-";
  const license = doctorInfo?.doctor_profile?.license_number || "-";
  const cnic = doctorInfo?.doctor_profile?.cnic || "-";
  const phone = doctorInfo?.profile.phone || "-";
  const hospital = doctorInfo?.hospital;

  // Patient stats
  const totalPatients = patients.length;
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000
  ).getTime();

  const patientsToday = patients.filter(
    (p) => p.created_at?.slice(0, 10) === todayISO
  ).length;

  const patientsLast30 = patients.filter((p) => {
    const t = new Date(p.created_at).getTime();
    return !Number.isNaN(t) && t >= thirtyDaysAgo;
  }).length;

  // Filter patients
  const search = patientSearch.trim().toLowerCase();
  const visiblePatients = search
    ? patients.filter((p) => {
        const name = p.full_name?.toLowerCase() || "";
        const patientCnic = p.cnic?.toLowerCase() || "";
        const patientPhone = p.phone?.toLowerCase() || "";
        return (
          name.includes(search) ||
          patientCnic.includes(search) ||
          patientPhone.includes(search)
        );
      })
    : patients;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

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
          style={{
            background:
              "linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #14B8A6 100%)",
          }}
        >
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-semibold text-white">
                Doctor Dashboard
              </h1>
            </div>
            <p className="text-white/90">
              Manage your practice, assistants, and patients with AI-powered
              insights
            </p>
          </div>
        </div>

        <div className="p-8 max-w-[1400px] mx-auto space-y-8">
          {/* Doctor Profile Card */}
          {/* ... unchanged profile + hospital + assistants UI ... */}

          {/* (Everything above stays exactly as you had it) */}

          {/* Patients Section */}
          <div className="space-y-6">
            {/* Patient Stats */}
            {/* ... your stats cards unchanged ... */}

            {/* Patients List */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-green-100 relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-green-100 to-teal-100 rounded-full blur-3xl opacity-30 -ml-32 -mb-32" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{
                        background:
                          "linear-gradient(135deg, #22C55E 0%, #10B981 100%)",
                      }}
                    >
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2
                        className="text-xl font-semibold mb-1"
                        style={{
                          background:
                            "linear-gradient(135deg, #22C55E 0%, #10B981 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Patients
                      </h2>
                      <p className="text-sm text-gray-500">
                        Search and view patient records
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPatients}
                    disabled={loadingPatients}
                    className="rounded-xl"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        loadingPatients ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search by name, CNIC, or phone..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10 h-12 border-2"
                    style={{
                      background:
                        "linear-gradient(90deg, #fafafa 0%, #f0fdf4 100%)",
                    }}
                  />
                </div>

                {loadingPatients ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading patients...
                  </div>
                ) : visiblePatients.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    {totalPatients === 0
                      ? "No patients have been registered for this hospital yet."
                      : "No patients match the current search query."}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {visiblePatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-4 rounded-2xl border-2 border-gray-100 hover:border-green-200 transition-all"
                        style={{
                          background:
                            "linear-gradient(90deg, #fafafa 0%, #f0fdf4 100%)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 mb-2">
                              {patient.full_name}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">CNIC:</span>
                                <span className="font-medium">
                                  {patient.cnic}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Phone:</span>
                                <span className="font-medium">
                                  {patient.phone || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Gender:</span>
                                <span className="font-medium">
                                  {formatGender(patient.gender)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">DOB:</span>
                                <span className="font-medium">
                                  {formatDate(patient.dob)}
                                </span>
                              </div>
                              <div className="col-span-2 flex items-center gap-2 mt-1">
                                <span className="text-gray-500">
                                  Registered:
                                </span>
                                <span className="font-medium">
                                  {formatDate(patient.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* NEW: Start Consultation button */}
                          <div className="flex flex-col items-end gap-2">
                            <Button
                              type="button"
                              className="h-9 px-4 rounded-xl text-white text-xs"
                              style={{
                                background:
                                  "linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)",
                              }}
                              onClick={() =>
                                onStartConsultation({
                                  profile_id: patient.id, // in your schema this is patient_profiles.profile_id
                                  full_name: patient.full_name,
                                })
                              }
                            >
                              Start Consultation
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Consultation Workspace (unchanged, still navigates by page name) */}
          <div
            className="rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #2563EB 0%, #8B5CF6 50%, #14B8A6 100%)",
            }}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl font-semibold mb-2 text-white flex items-center gap-3">
                <Sparkles className="w-7 h-7" />
                Consultation Workspace
              </h2>
              <p className="text-white/80 mb-6">
                AI-powered clinical tools at your fingertips
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate("recording")}
                  className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-blue-300 hover:scale-105 transition-all group shadow-lg"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                    }}
                  >
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800">
                    Start Consultation
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Begin recording</p>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("extraction")}
                  className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-teal-300 hover:scale-105 transition-all group shadow-lg"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #14B8A6 0%, #10B981 100%)",
                    }}
                  >
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800">
                    Latest Extraction
                  </p>
                  <p className="text-xs text-gray-500 mt-1">AI insights</p>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("notes")}
                  className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-purple-300 hover:scale-105 transition-all group shadow-lg"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    }}
                  >
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800">Edit Notes</p>
                  <p className="text-xs text-gray-500 mt-1">Documentation</p>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("history")}
                  className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-green-300 hover:scale-105 transition-all group shadow-lg"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md"
                    style={{
                      background:
                        "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                    }}
                  >
                    <History className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800">History</p>
                  <p className="text-xs text-gray-500 mt-1">Past records</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}