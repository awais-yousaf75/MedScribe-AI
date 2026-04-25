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
  assistant_link: {
    doctor_profile_id: string;
    hospital_id: string;
    approval_status: "pending" | "approved" | "rejected";
  } | null;
  doctor: {
    id: string;
    full_name: string;
    phone?: string;
    role: string;
  } | null;
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
    status: "pending" | "approved" | "rejected";
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

interface AssistantDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function AssistantDashboard({
  onNavigate,
  onLogout,
}: AssistantDashboardProps) {
  // Data states
  const [assistantInfo, setAssistantInfo] = useState<AssistantMeResponse | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchingExisting, setSearchingExisting] = useState(false);

  // Search state
  const [patientSearch, setPatientSearch] = useState("");

  // Existing patient search
  const [existingCnic, setExistingCnic] = useState("");
  const [existingResult, setExistingResult] = useState<ExistingPatientSearchResult | null>(null);
  const [verificationError, setVerificationError] = useState("");

  // New patient form
  const [newPatientForm, setNewPatientForm] = useState({
    fullName: "",
    cnic: "",
    phone: "",
    gender: "",
    dob: "",
    email: "",
    password: "",
  });

  const getToken = () => localStorage.getItem("accessToken");

  // ─────────────────────────────────────────────────────────────
  // FETCH FUNCTIONS
  // ─────────────────────────────────────────────────────────────

  const fetchAssistantInfo = async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/assistant/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setAssistantInfo(data);
    } catch (err: any) {
      console.error(err);
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
      const res = await fetch(`${API_URL}/api/assistant/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients(data.patients || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load patients");
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchAssistantInfo();
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────
  // EXISTING PATIENT SEARCH
  // ─────────────────────────────────────────────────────────────

  const handleSearchExisting = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    const cnic = existingCnic.trim();
    if (!cnic) {
      toast.error("Enter a CNIC to search");
      return;
    }

    try {
      setSearchingExisting(true);
      setExistingResult(null);
      setVerificationError("");

      const res = await fetch(
        `${API_URL}/api/assistant/patients/search?cnic=${encodeURIComponent(cnic)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search patient");

      setExistingResult(data as ExistingPatientSearchResult);

      if (!data.found) {
        setVerificationError("No patient found with this CNIC");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to search patient");
    } finally {
      setSearchingExisting(false);
    }
  };

  const handleLinkExisting = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    if (!existingResult?.found || !existingResult.patient) {
      toast.error("Search a patient first.");
      return;
    }

    const p = existingResult.patient;

    try {
      setCreating(true);

      const res = await fetch(`${API_URL}/api/assistant/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: p.full_name,
          cnic: p.cnic,
          phone: p.phone,
          gender: p.gender,
          dob: p.dob,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add patient");

      if (data.status === "linked") {
        toast.success("Existing patient linked to this hospital.");
      } else if (data.status === "already_exists") {
        toast.info("Patient is already registered under this hospital.");
      } else {
        toast.success("Patient registered for this hospital.");
      }

      setExistingCnic("");
      setExistingResult(null);
      setVerificationError("");
      fetchPatients();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to link existing patient");
    } finally {
      setCreating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // NEW PATIENT REGISTRATION
  // ─────────────────────────────────────────────────────────────

  const handleNewPatientChange = (field: keyof typeof newPatientForm, value: string) => {
    setNewPatientForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    try {
      setCreating(true);

      const payload: any = {
        fullName: newPatientForm.fullName.trim(),
        cnic: newPatientForm.cnic.trim(),
      };
      if (newPatientForm.phone.trim()) payload.phone = newPatientForm.phone.trim();
      if (newPatientForm.gender) payload.gender = newPatientForm.gender;
      if (newPatientForm.dob) payload.dob = newPatientForm.dob;
      if (newPatientForm.email.trim()) payload.email = newPatientForm.email.trim();
      if (newPatientForm.password) payload.password = newPatientForm.password;

      const res = await fetch(`${API_URL}/api/assistant/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add patient");

      if (data.status === "created") {
        toast.success("New patient registered successfully.");
      } else if (data.status === "linked") {
        toast.success("CNIC already existed; patient has been linked to this hospital.");
      } else if (data.status === "already_exists") {
        toast.info("Patient already existed for this hospital.");
      } else {
        toast.success("Patient saved.");
      }

      setNewPatientForm({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        gender: "",
        dob: "",
        cnic: "",
      });
      fetchPatients();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add patient");
    } finally {
      setCreating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────

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
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm bg-gradient-to-r ${gradient}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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

  // Derived values
  const assistantName = assistantInfo?.profile.full_name || "Assistant";
  const doctor = assistantInfo?.doctor;
  const hospital = assistantInfo?.hospital;

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
          style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #FB923C 50%, #F97316 100%)",
          }}
        >
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <UserCog className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-semibold text-white">
                Doctor Assistant Dashboard
              </h1>
            </div>
            <p className="text-white/90">Manage patient registrations and records</p>
          </div>
        </div>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          {/* Assistant Profile Card */}
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
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Assistant Profile
                  </h2>
                  <p className="text-sm text-gray-500">Your account information</p>
                </div>
                <div
                  className="px-4 py-2 rounded-xl border"
                  style={{
                    background: "linear-gradient(90deg, #fff7ed 0%, #fef3c7 100%)",
                    borderColor: "#fed7aa",
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: "#ea580c" }}>
                    Clinical Assistant
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                    borderColor: "#fed7aa",
                  }}
                >
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-800">{assistantName}</p>
                </div>
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    background: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)",
                    borderColor: "#fde047",
                  }}
                >
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <p className="font-semibold text-gray-800">Doctor Assistant</p>
                </div>
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    borderColor: "#fcd34d",
                  }}
                >
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="font-semibold text-gray-800">
                    {assistantInfo?.profile.phone || "-"}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl border-2 border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Account Status</p>
                  {getStatusBadge(assistantInfo?.profile.approval_status)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assigned Doctor */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)" }}
                    >
                      <Stethoscope className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2
                        className="text-xl font-semibold mb-1"
                        style={{
                          background: "linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Assigned Doctor
                      </h2>
                      <p className="text-sm text-gray-500">Your supervising physician</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAssistantInfo}
                    disabled={loading}
                    className="rounded-xl"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : doctor ? (
                  <div className="space-y-3">
                    <div
                      className="p-3 rounded-xl border"
                      style={{
                        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                        borderColor: "#bfdbfe",
                      }}
                    >
                      <p className="text-xs text-gray-500 mb-1">Doctor Name</p>
                      <p className="font-semibold text-gray-800">{doctor.full_name}</p>
                    </div>
                    <div
                      className="p-3 rounded-xl border"
                      style={{
                        background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
                        borderColor: "#a5f3fc",
                      }}
                    >
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="font-semibold text-gray-800">{doctor.phone || "-"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">No doctor assigned</div>
                )}
              </div>
            </div>

            {/* Affiliated Hospital */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-teal-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-teal-100 to-green-100 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />
              <div className="relative">
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: "linear-gradient(135deg, #14B8A6 0%, #10B981 100%)" }}
                  >
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-xl font-semibold mb-1"
                      style={{
                        background: "linear-gradient(135deg, #14B8A6 0%, #10B981 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Affiliated Hospital
                    </h2>
                    <p className="text-sm text-gray-500">Your hospital details</p>
                  </div>
                </div>

                {hospital ? (
                  <div className="space-y-3">
                    <div
                      className="p-3 rounded-xl border"
                      style={{
                        background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
                        borderColor: "#99f6e4",
                      }}
                    >
                      <p className="text-xs text-gray-500 mb-1">Hospital Name</p>
                      <p className="font-semibold text-gray-800">{hospital.name}</p>
                    </div>
                    <div
                      className="p-3 rounded-xl border"
                      style={{
                        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                        borderColor: "#bbf7d0",
                      }}
                    >
                      <p className="text-xs text-gray-500 mb-1">Hospital Type</p>
                      <p className="font-semibold text-gray-800">
                        {hospital.hospital_type || "-"}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-xl border"
                      style={{
                        background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                        borderColor: "#a7f3d0",
                      }}
                    >
                      <p className="text-xs text-gray-500 mb-1">Address</p>
                      <p className="font-semibold text-gray-800">{hospital.address || "-"}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border-2 border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      {getStatusBadge(hospital.status)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">No hospital linked</div>
                )}
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
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Search Existing Patient
                  </h2>
                  <p className="text-sm text-gray-500">
                    Find and verify patient by CNIC to add to this hospital
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="cnicSearch">Patient CNIC</Label>
                    <Input
                      id="cnicSearch"
                      placeholder="Enter CNIC (e.g., 42301-1234567-8)"
                      value={existingCnic}
                      onChange={(e) => setExistingCnic(e.target.value)}
                      className="h-12 border-2"
                      style={{ background: "linear-gradient(90deg, #fafafa 0%, #f0fdf4 100%)" }}
                    />
                  </div>
                  <div className="flex items-end">
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
                </div>

                {/* Found Patient */}
                {existingResult?.found && existingResult.patient && (
                  <div
                    className="p-6 rounded-2xl border-2 shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #eff6ff 0%, #f0fdfa 50%, #f0fdf4 100%)",
                      borderColor: "#86efac",
                    }}
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Patient Found
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                        <p className="font-semibold">{existingResult.patient.full_name}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">CNIC</p>
                        <p className="font-semibold font-mono">{existingResult.patient.cnic}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Phone</p>
                        <p className="font-semibold">{existingResult.patient.phone || "-"}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                        <p className="font-semibold">{existingResult.patient.dob || "-"}</p>
                      </div>
                      {existingResult.hospitals && existingResult.hospitals.length > 0 && (
                        <div className="col-span-2 p-3 bg-white rounded-xl shadow-sm">
                          <p className="text-xs text-gray-500 mb-2">Registered in Hospitals</p>
                          <div className="flex gap-2 flex-wrap">
                            {existingResult.hospitals.map((h) => (
                              <span
                                key={h.id}
                                className="px-3 py-1 rounded-lg text-sm font-medium border"
                                style={{
                                  background: "linear-gradient(90deg, #eff6ff 0%, #f0fdfa 100%)",
                                  borderColor: "#bfdbfe",
                                }}
                              >
                                {h.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleLinkExisting}
                      disabled={creating}
                      className="w-full h-12 text-white"
                      style={{ background: "linear-gradient(135deg, #22C55E 0%, #10B981 100%)" }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {creating ? "Adding..." : "Add to This Hospital"}
                    </Button>
                  </div>
                )}

                {/* No patient found message */}
                {!existingResult?.found && verificationError && (
                  <div
                    className="flex items-center gap-2 p-4 rounded-xl border-2"
                    style={{
                      background: "linear-gradient(90deg, #fef9c3 0%, #fef08a 100%)",
                      borderColor: "#fde047",
                    }}
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-700">{verificationError}</p>
                  </div>
                )}
              </div>
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
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Register New Patient
                  </h2>
                  <p className="text-sm text-gray-500">
                    Add a completely new patient to the system
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddPatient} className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newPatientName">Full Name *</Label>
                  <Input
                    id="newPatientName"
                    placeholder="Enter full name"
                    value={newPatientForm.fullName}
                    onChange={(e) => handleNewPatientChange("fullName", e.target.value)}
                    className="h-11 border-2"
                    style={{ background: "linear-gradient(90deg, #fafafa 0%, #faf5ff 100%)" }}
                    required
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientCnic">CNIC *</Label>
                  <Input
                    id="newPatientCnic"
                    placeholder="42301-1234567-1"
                    value={newPatientForm.cnic}
                    onChange={(e) => handleNewPatientChange("cnic", e.target.value)}
                    className="h-11 border-2"
                    style={{ background: "linear-gradient(90deg, #fafafa 0%, #fdf2f8 100%)" }}
                    required
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientPhone">Phone</Label>
                  <Input
                    id="newPatientPhone"
                    placeholder="+92 300 0000000"
                    value={newPatientForm.phone}
                    onChange={(e) => handleNewPatientChange("phone", e.target.value)}
                    className="h-11 border-2"
                    style={{ background: "linear-gradient(90deg, #fafafa 0%, #eff6ff 100%)" }}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientGender">Gender</Label>
                  <select
                    id="newPatientGender"
                    value={newPatientForm.gender}
                    onChange={(e) => handleNewPatientChange("gender", e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border-2 border-gray-200"
                    style={{ background: "linear-gradient(90deg, #fafafa 0%, #f0fdfa 100%)" }}
                    disabled={creating}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientDob">Date of Birth</Label>
                  <Input
                    id="newPatientDob"
                    type="date"
                    value={newPatientForm.dob}
                    onChange={(e) => handleNewPatientChange("dob", e.target.value)}
                    className="h-11 border-2"
                    style={{ background: "linear-gradient(90deg, #fafafa 0%, #f0fdf4 100%)" }}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPatientEmail">Email (Optional)</Label>
                  <Input
                    id="newPatientEmail"
                    type="email"
                    placeholder="patient@example.com"
                    value={newPatientForm.email}
                    onChange={(e) => handleNewPatientChange("email", e.target.value)}
                    className="h-11 border-2"
                    style={{ background: "linear-gradient(90deg, #fafafa 0%, #fff7ed 100%)" }}
                    disabled={creating}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="newPatientPassword">Password (Optional - for patient login)</Label>
                  <Input
                    id="newPatientPassword"
                    type="password"
                    placeholder="Create password for patient portal"
                    value={newPatientForm.password}
                    onChange={(e) => handleNewPatientChange("password", e.target.value)}
                    className="h-11 border-2"
                    style={{ background: "linear-gradient(90deg, #fafafa 0%, #faf5ff 100%)" }}
                    disabled={creating}
                  />
                </div>

                <div className="col-span-2">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="w-full h-12 text-white"
                    style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {creating ? "Registering..." : "Register Patient"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Hospital Patients List */}
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
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Hospital Patients
                    </h2>
                    <p className="text-sm text-gray-500">{patients.length} patients registered</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, CNIC, or phone..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-10 h-11 border-2"
                      style={{ background: "linear-gradient(90deg, #fafafa 0%, #eff6ff 100%)" }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPatients}
                    disabled={loadingPatients}
                    className="rounded-xl"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingPatients ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              {loadingPatients ? (
                <div className="text-center py-8 text-gray-500">Loading patients...</div>
              ) : visiblePatients.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {patients.length === 0
                    ? "No patients registered yet."
                    : "No patients match your search."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-gray-200">
                      <tr className="text-left">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Patient Name</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">CNIC</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Phone</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Gender</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Date of Birth</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-500">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePatients.map((patient) => (
                        <tr
                          key={patient.id}
                          className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-semibold text-gray-800">{patient.full_name}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500 font-mono">{patient.cnic}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">{patient.phone || "-"}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500 capitalize">
                              {patient.gender || "-"}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">{formatDate(patient.dob)}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-500">{formatDate(patient.created_at)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}