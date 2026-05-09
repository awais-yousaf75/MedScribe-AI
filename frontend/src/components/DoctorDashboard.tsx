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
  RefreshCw,
  Calendar,
  Save,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
// import Sidebar from "./layout/Sidebar";

// ─────────────────────────────────────────────────────────────
// TYPES — untouched
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
  "Monday","Tuesday","Wednesday",
  "Thursday","Friday","Saturday","Sunday",
];

const DEFAULT_DAY: DayAvailability = {
  enabled: false,
  start_time: "09:00",
  end_time: "17:00",
  slot_duration_minutes: 30,
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function DoctorDashboard({
  onNavigate,
  onLogout,
  onStartConsultation,
}: DoctorDashboardProps) {
  type Tab = "overview" | "patients" | "availability" | "appointments";
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [doctorInfo,   setDoctorInfo]   = useState<DoctorMeResponse | null>(null);
  const [assistants,   setAssistants]   = useState<Assistant[]>([]);
  const [patients,     setPatients]     = useState<Patient[]>([]);

  const [loadingDoctor,       setLoadingDoctor]       = useState(false);
  const [loadingAssistants,   setLoadingAssistants]   = useState(false);
  const [loadingPatients,     setLoadingPatients]     = useState(false);
  const [creatingAssistant,   setCreatingAssistant]   = useState(false);
  const [savingAvailability,  setSavingAvailability]  = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [patientSearch, setPatientSearch] = useState("");

  const [assistantForm, setAssistantForm] = useState({
    fullName: "", email: "", phone: "",
    password: "", confirmPassword: "",
  });

  const [availability, setAvailability] = useState<DayAvailability[]>(
    Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY }))
  );

  const [approvedAppointments, setApprovedAppointments] = useState<any[]>([]);
  const [loadingAppointments,  setLoadingAppointments]  = useState(false);

  const getToken = () => localStorage.getItem("accessToken");

  // ── Helpers ───────────────────────────────────────────────

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const formatGender = (value?: string | null) => {
    if (!value) return "—";
    const g = value.toLowerCase();
    if (g === "m" || g === "male")   return "Male";
    if (g === "f" || g === "female") return "Female";
    return value;
  };

  const formatAppointmentDate = (v: string) => {
    try {
      return new Date(v).toLocaleDateString(undefined, {
        weekday: "short", year: "numeric", month: "short", day: "numeric",
      });
    } catch { return v; }
  };

  const formatAppointmentTime = (t: string) => {
    try {
      const [h, m] = t.split(":").map(Number);
      const period  = h >= 12 ? "PM" : "AM";
      const hour    = h % 12 === 0 ? 12 : h % 12;
      return `${hour}:${String(m).padStart(2, "0")} ${period}`;
    } catch { return t; }
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return <span className="list-item-sub">—</span>;
    const map: Record<string, { cls: string; icon: typeof CheckCircle }> = {
      approved: { cls: "badge badge-success", icon: CheckCircle },
      pending:  { cls: "badge badge-warning", icon: Clock       },
      rejected: { cls: "badge badge-error",   icon: XCircle     },
    };
    const { cls, icon: Icon } = map[status] || map.pending;
    return (
      <span className={cls}>
        <Icon size={11} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ── Fetches — untouched ───────────────────────────────────

  const fetchDoctorInfo = async () => {
    const token = getToken(); if (!token) return;
    try {
      setLoadingDoctor(true);
      const res  = await fetch(`${API_URL}/api/doctor/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load doctor info");
      setDoctorInfo(data as DoctorMeResponse);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoadingDoctor(false); }
  };

  const fetchAssistants = async () => {
    const token = getToken(); if (!token) return;
    try {
      setLoadingAssistants(true);
      const res  = await fetch(`${API_URL}/api/doctor/assistants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assistants");
      setAssistants((data.assistants || []) as Assistant[]);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoadingAssistants(false); }
  };

  const fetchPatients = async () => {
    const token = getToken(); if (!token) return;
    try {
      setLoadingPatients(true);
      const res  = await fetch(`${API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients((data.patients || []) as Patient[]);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoadingPatients(false); }
  };

  const fetchAvailability = async () => {
    const token = getToken(); if (!token) return;
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
              enabled: true,
              start_time: record.start_time.substring(0, 5),
              end_time: record.end_time.substring(0, 5),
              slot_duration_minutes: record.slot_duration_minutes,
            };
          }
          return { ...DEFAULT_DAY };
        })
      );
    } catch (err: any) { toast.error(err.message); }
    finally { setLoadingAvailability(false); }
  };

  const fetchApprovedAppointments = async () => {
    const token = getToken(); if (!token) return;
    try {
      setLoadingAppointments(true);
      const res  = await fetch(`${API_URL}/api/appointments/doctor/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load appointments");
      setApprovedAppointments(data.data || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoadingAppointments(false); }
  };

  useEffect(() => {
    fetchDoctorInfo();
    fetchAssistants();
    fetchPatients();
    fetchAvailability();
    fetchApprovedAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers — untouched ──────────────────────────────────

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    if (assistantForm.password !== assistantForm.confirmPassword) {
      toast.error("Passwords do not match"); return;
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
          email:    assistantForm.email,
          phone:    assistantForm.phone,
          password: assistantForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create assistant");
      toast.success("Assistant created and pending approval");
      setAssistantForm({
        fullName: "", email: "", phone: "",
        password: "", confirmPassword: "",
      });
      fetchAssistants();
    } catch (err: any) { toast.error(err.message); }
    finally { setCreatingAssistant(false); }
  };

  const handleSaveAvailability = async () => {
    const token = getToken();
    if (!token) { toast.error("Not authenticated"); return; }
    const payload = availability
      .map((day, index) => ({
        day_of_week: index,
        start_time: day.start_time,
        end_time: day.end_time,
        slot_duration_minutes: day.slot_duration_minutes,
        enabled: day.enabled,
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
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ availability: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save availability");
      toast.success("Availability saved successfully!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingAvailability(false); }
  };

  const updateDay = (
    index: number,
    field: keyof DayAvailability,
    value: string | boolean | number
  ) => {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  // ── Derived ───────────────────────────────────────────────

  const doctorName     = doctorInfo?.profile.full_name || doctorInfo?.user.email || "Doctor";
  const specialization = doctorInfo?.doctor_profile?.specialization || "—";
  const license        = doctorInfo?.doctor_profile?.license_number || "—";
  const cnic           = doctorInfo?.doctor_profile?.cnic || "—";
  const phone          = doctorInfo?.profile.phone || "—";
  const hospital       = doctorInfo?.hospital;

  const search          = patientSearch.trim().toLowerCase();
  const visiblePatients = search
    ? patients.filter((p) =>
        (p.full_name?.toLowerCase() || "").includes(search) ||
        (p.cnic?.toLowerCase()      || "").includes(search) ||
        (p.phone?.toLowerCase()     || "").includes(search)
      )
    : patients;

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "overview",     label: "Overview",     icon: User         },
    { id: "patients",     label: "Patients",     icon: Users        },
    { id: "availability", label: "Availability", icon: CalendarDays },
    { id: "appointments", label: "Appointments", icon: Calendar     },
  ];

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <>
      {/* ── HEADER ── */}
        <div className="page-header">
          <div className="page-header-top">
            <div className="page-header-left">
              <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                <User size={18} color="#fff" />
              </div>
              <div>
                <div className="page-header-title">Doctor Dashboard</div>
                <div className="page-header-sub">
                  {doctorName} · {specialization}
                </div>
              </div>
            </div>
          </div>

          <div className="tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab${activeTab === tab.id ? " tab-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={14} />
                  {tab.label}
                  {tab.id === "appointments" && approvedAppointments.length > 0 && (
                    <span className="tab-badge">{approvedAppointments.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="page-content">

          {/* ────────────────────────────────────────────────
              OVERVIEW TAB
          ──────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <>
              {/* Doctor Profile Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">
                    <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                      <User size={18} color="#fff" />
                    </div>
                    <div>
                      <div className="card-title">{doctorName}</div>
                      <div className="card-subtitle">{specialization}</div>
                    </div>
                  </div>
                  {getStatusBadge(doctorInfo?.doctor_profile?.approval_status)}
                </div>

                <div className="info-grid info-grid-4">
                  {[
                    { label: "License",  value: license           },
                    { label: "CNIC",     value: cnic              },
                    { label: "Phone",    value: phone             },
                    { label: "Hospital", value: hospital?.name || "—" },
                  ].map((item) => (
                    <div key={item.label} className="info-item">
                      <div className="info-label">{item.label}</div>
                      <div className="info-value">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assistants Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">
                    <div className="icon-wrap icon-wrap-md icon-wrap-navy">
                      <UserPlus size={18} color="var(--ms-teal)" />
                    </div>
                    <div>
                      <div className="card-title">My Assistants</div>
                      <div className="card-subtitle">
                        {assistants.length} assistant{assistants.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-icon"
                    onClick={fetchAssistants}
                    disabled={loadingAssistants}
                  >
                    <RefreshCw
                      size={14}
                      className={loadingAssistants ? "ms-spinner" : ""}
                    />
                  </button>
                </div>

                {loadingAssistants ? (
                  <div className="loading-text">Loading assistants…</div>
                ) : assistants.length === 0 ? (
                  <div className="loading-text">No assistants yet.</div>
                ) : (
                  <div className="list-grid-2" style={{ marginBottom: 24 }}>
                    {assistants.map((a) => (
                      <div key={a.profile_id} className="list-item">
                        <div>
                          <div className="list-item-title">{a.full_name}</div>
                          <div className="list-item-sub">{a.phone || "No phone"}</div>
                        </div>
                        {getStatusBadge(a.approval_status)}
                      </div>
                    ))}
                  </div>
                )}

                <hr className="divider" />
                <div className="form-section-title">Add New Assistant</div>

                <form onSubmit={handleCreateAssistant}>
                  <div className="form-grid-2" style={{ marginBottom: 20 }}>
                    <div className="field">
                      <label className="field-label">Full Name *</label>
                      <input
                        className="field-input"
                        placeholder="Full name"
                        value={assistantForm.fullName}
                        onChange={(e) =>
                          setAssistantForm((p) => ({ ...p, fullName: e.target.value }))
                        }
                        required
                        disabled={creatingAssistant}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">Email *</label>
                      <input
                        type="email"
                        className="field-input"
                        placeholder="Email address"
                        value={assistantForm.email}
                        onChange={(e) =>
                          setAssistantForm((p) => ({ ...p, email: e.target.value }))
                        }
                        required
                        disabled={creatingAssistant}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">Phone</label>
                      <input
                        className="field-input"
                        placeholder="Phone number"
                        value={assistantForm.phone}
                        onChange={(e) =>
                          setAssistantForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        disabled={creatingAssistant}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">Password *</label>
                      <input
                        type="password"
                        className="field-input"
                        placeholder="Password"
                        value={assistantForm.password}
                        onChange={(e) =>
                          setAssistantForm((p) => ({ ...p, password: e.target.value }))
                        }
                        required
                        disabled={creatingAssistant}
                      />
                    </div>
                    <div className="field form-full">
                      <label className="field-label">Confirm Password *</label>
                      <input
                        type="password"
                        className="field-input"
                        placeholder="Confirm password"
                        value={assistantForm.confirmPassword}
                        onChange={(e) =>
                          setAssistantForm((p) => ({
                            ...p,
                            confirmPassword: e.target.value,
                          }))
                        }
                        required
                        disabled={creatingAssistant}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-md"
                    disabled={creatingAssistant}
                  >
                    <UserPlus size={16} />
                    {creatingAssistant ? "Creating…" : "Create Assistant"}
                  </button>
                </form>
              </div>

              {/* Consultation Workspace */}
              <div className="workspace">
                <div className="workspace-title">Consultation Workspace</div>
                <div className="workspace-sub">AI-powered clinical tools</div>

                <div className="workspace-grid">
                  {[
                    { page: "recording",  icon: Activity, label: "Start Consultation", sub: "Begin recording" },
                    { page: "extraction", icon: FileText, label: "Latest Extraction",  sub: "AI insights"     },
                    { page: "notes",      icon: Edit,     label: "Edit Notes",         sub: "Documentation"   },
                    { page: "history",    icon: History,  label: "History",            sub: "Past records"    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.page}
                        type="button"
                        className="workspace-btn"
                        onClick={() => onNavigate(item.page)}
                      >
                        <div className="workspace-btn-icon">
                          <Icon size={20} color="#fff" />
                        </div>
                        <div className="workspace-btn-label">{item.label}</div>
                        <div className="workspace-btn-sub">{item.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ────────────────────────────────────────────────
              PATIENTS TAB
          ──────────────────────────────────────────────── */}
          {activeTab === "patients" && (
            <div className="card">
              <div className="card-header">
                <div className="card-header-left">
                  <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                    <Users size={18} color="#fff" />
                  </div>
                  <div>
                    <div className="card-title">Patients</div>
                    <div className="card-subtitle">
                      {patients.length} patients in your hospital
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={fetchPatients}
                  disabled={loadingPatients}
                >
                  <RefreshCw size={14} className={loadingPatients ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="search-wrap" style={{ marginBottom: 16 }}>
                <Search className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Search by name, CNIC, or phone…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>

              {loadingPatients ? (
                <div className="loading-text">Loading patients…</div>
              ) : visiblePatients.length === 0 ? (
                <div className="empty-state">
                  <Users size={36} className="empty-icon" />
                  <div className="empty-title">
                    {patients.length === 0
                      ? "No patients registered yet."
                      : "No patients match your search."}
                  </div>
                </div>
              ) : (
                <div className="scroll-list">
                  {visiblePatients.map((patient) => (
                    <div key={patient.id} className="list-item">
                      <div style={{ flex: 1 }}>
                        <div className="list-item-title">{patient.full_name}</div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "4px 16px",
                            marginTop: 6,
                          }}
                        >
                          {[
                            { label: "CNIC",   value: patient.cnic              },
                            { label: "Phone",  value: patient.phone || "—"      },
                            { label: "Gender", value: formatGender(patient.gender) },
                            { label: "DOB",    value: formatDate(patient.dob)   },
                          ].map((m) => (
                            <div
                              key={m.label}
                              style={{ display: "flex", gap: 6, alignItems: "center" }}
                            >
                              <span className="info-label" style={{ textTransform: "none", letterSpacing: 0 }}>
                                {m.label}:
                              </span>
                              <span className="list-item-sub" style={{ color: "var(--ms-text)", fontWeight: 500 }}>
                                {m.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          onStartConsultation({
                            profile_id: patient.id,
                            full_name:  patient.full_name,
                          })
                        }
                      >
                        Start Consultation
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────
              AVAILABILITY TAB
          ──────────────────────────────────────────────── */}
          {activeTab === "availability" && (
            <div className="card">
              <div className="card-header">
                <div className="card-header-left">
                  <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                    <CalendarDays size={18} color="#fff" />
                  </div>
                  <div>
                    <div className="card-title">Weekly Availability</div>
                    <div className="card-subtitle">
                      Set your working hours. Patients will see available slots based on this.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={fetchAvailability}
                  disabled={loadingAvailability}
                >
                  <RefreshCw
                    size={14}
                    className={loadingAvailability ? "animate-spin" : ""}
                  />
                </button>
              </div>

              {loadingAvailability ? (
                <div className="loading-text">Loading availability…</div>
              ) : (
                <>
                  <div className="avail-list">
                    {DAY_NAMES.map((dayName, index) => {
                      const day = availability[index];
                      return (
                        <div
                          key={dayName}
                          className={`avail-row${day.enabled ? " avail-enabled" : ""}`}
                        >
                          <div className="avail-day-wrap">
                            <button
                              type="button"
                              className={`toggle${day.enabled ? " toggle-on" : ""}`}
                              onClick={() => updateDay(index, "enabled", !day.enabled)}
                            >
                              <span className="toggle-thumb" />
                            </button>
                            <span
                              className={`avail-day-name${day.enabled ? " avail-active" : ""}`}
                            >
                              {dayName}
                            </span>
                          </div>

                          {day.enabled ? (
                            <>
                              <div className="avail-time-wrap">
                                <span className="avail-time-label">From</span>
                                <input
                                  type="time"
                                  className="avail-time-input"
                                  value={day.start_time}
                                  onChange={(e) =>
                                    updateDay(index, "start_time", e.target.value)
                                  }
                                />
                              </div>
                              <div className="avail-time-wrap">
                                <span className="avail-time-label">To</span>
                                <input
                                  type="time"
                                  className="avail-time-input"
                                  value={day.end_time}
                                  onChange={(e) =>
                                    updateDay(index, "end_time", e.target.value)
                                  }
                                />
                              </div>
                              <div className="avail-time-wrap">
                                <span className="avail-time-label">Slot</span>
                                <select
                                  className="avail-slot-select"
                                  value={day.slot_duration_minutes}
                                  onChange={(e) =>
                                    updateDay(
                                      index,
                                      "slot_duration_minutes",
                                      Number(e.target.value)
                                    )
                                  }
                                >
                                  {[10, 15, 20, 30, 45, 60].map((m) => (
                                    <option key={m} value={m}>{m} min</option>
                                  ))}
                                </select>
                              </div>
                              {day.start_time &&
                                day.end_time &&
                                day.start_time < day.end_time && (
                                  <span className="avail-slot-chip">
                                    {Math.floor(
                                      (timeToMinutes(day.end_time) -
                                        timeToMinutes(day.start_time)) /
                                        day.slot_duration_minutes
                                    )}{" "}
                                    slots
                                  </span>
                                )}
                            </>
                          ) : (
                            <span className="avail-off">Not available</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="avail-footer">
                    <button
                      type="button"
                      className="btn btn-primary btn-md"
                      onClick={handleSaveAvailability}
                      disabled={savingAvailability}
                    >
                      <Save size={16} />
                      {savingAvailability ? "Saving…" : "Save Availability"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────
              APPOINTMENTS TAB
          ──────────────────────────────────────────────── */}
          {activeTab === "appointments" && (
            <div className="card">
              <div className="card-header">
                <div className="card-header-left">
                  <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                    <Calendar size={18} color="#fff" />
                  </div>
                  <div>
                    <div className="card-title">Approved Appointments</div>
                    <div className="card-subtitle">
                      {approvedAppointments.length} appointment
                      {approvedAppointments.length !== 1 ? "s" : ""} waiting
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={fetchApprovedAppointments}
                  disabled={loadingAppointments}
                >
                  <RefreshCw
                    size={14}
                    className={loadingAppointments ? "animate-spin" : ""}
                  />
                </button>
              </div>

              {loadingAppointments ? (
                <div className="loading-text">Loading appointments…</div>
              ) : approvedAppointments.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={36} className="empty-icon" />
                  <div className="empty-title">No approved appointments</div>
                  <div className="empty-sub">
                    Appointments will appear here after your assistant approves them.
                  </div>
                </div>
              ) : (
                <div className="appt-list">
                  {approvedAppointments.map((appt: any) => {
                    const patientProfiles = appt.patient_profiles || {};
                    const patientInfo     = patientProfiles.profiles || {};
                    const hospitalInfo    = appt.hospitals || {};

                    return (
                      <div key={appt.id} className="appt-item">
                        <div className="appt-main">
                          <div className="appt-patient-wrap">
                            <div className="appt-avatar">
                              {patientInfo.full_name?.charAt(0)?.toUpperCase() || "P"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="appt-patient-name">
                                {patientInfo.full_name || "Unknown Patient"}
                              </div>
                              <div className="appt-patient-meta">
                                {patientInfo.phone && (
                                  <span className="appt-meta-item">
                                    📞 {patientInfo.phone}
                                  </span>
                                )}
                                {patientInfo.gender && (
                                  <span
                                    className="appt-meta-item"
                                    style={{ textTransform: "capitalize" }}
                                  >
                                    {patientInfo.gender}
                                  </span>
                                )}
                                {patientProfiles.cnic && (
                                  <span className="appt-meta-item">
                                    CNIC: {patientProfiles.cnic}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="appt-details">
                            <div className="appt-chip">
                              <CalendarDays
                                size={13}
                                color="var(--ms-teal)"
                              />
                              {formatAppointmentDate(appt.appointment_date)}
                            </div>
                            <div className="appt-chip">
                              <Clock size={13} color="var(--ms-teal)" />
                              {formatAppointmentTime(appt.appointment_time)}
                            </div>
                            <div className="appt-chip">
                              <Building2 size={13} color="var(--ms-teal)" />
                              {hospitalInfo.name || "—"}
                            </div>
                            <span className="badge badge-success">
                              <CheckCircle size={11} /> Approved
                            </span>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                onStartConsultation({
                                  profile_id: patientProfiles.profile_id,
                                  full_name:  patientInfo.full_name || "Unknown",
                                })
                              }
                            >
                              Start Consultation
                            </button>
                          </div>
                        </div>

                        {appt.notes && (
                          <div className="appt-notes">
                            <strong>Notes: </strong>{appt.notes}
                          </div>
                        )}
                        {patientProfiles.medical_history && (
                          <div className="appt-history">
                            <strong>Medical History: </strong>
                            {patientProfiles.medical_history}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  }