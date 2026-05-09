import { useEffect, useMemo, useState } from "react";
import {
    History as HistoryIcon,
    Search,
    Users,
    Calendar,
    Clock,
    FileText,
    Pill,
    Stethoscope,
    ChevronRight,
    ChevronDown,
    Download,
    Printer,
    Eye,
    X,
    Filter,
    RefreshCw,
    AlertCircle,
    Activity,
    ClipboardCheck,
    Building2,
    Award,
    Hash,
    User,
    Sparkles,
    CalendarClock,
    ShieldAlert,
    Send,
    CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ConsultationHistoryProps {
  onLogout: () => void;
}

interface Patient {
    id: string;
    full_name: string;
    phone?: string | null;
    gender?: string | null;
    dob?: string | null;
    cnic: string;
    created_at: string;
}

interface Consultation {
    id: string;
    transcript: string;
    duration_seconds: number;
    language: string | null;
    created_at: string;
    medical_info: any;
    summary: string | null;
    doctor_notes: string | null;
    prescription: any;
}

interface DoctorInfo {
    full_name?: string;
    specialization?: string;
    license_number?: string;
    cnic?: string;
}

interface HospitalInfo {
    name?: string;
    address?: string;
    hospital_type?: string;
    contact_phone?: string;
    registration_number?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE_URL = API_URL.replace(/\/$/, "");

type DateFilter = "all" | "7d" | "30d" | "90d" | "1y";

export default function ConsultationHistory({
    onLogout: _onLogout,
}: ConsultationHistoryProps) {
    /* ── State ── */
    const [patients, setPatients] = useState<Patient[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [loadingConsultations, setLoadingConsultations] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilter>("all");
    const [diagnosisFilter, setDiagnosisFilter] = useState("");

    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Modal state
    const [transcriptModal, setTranscriptModal] = useState<Consultation | null>(null);
    const [prescriptionModal, setPrescriptionModal] = useState<Consultation | null>(null);

    // Doctor + hospital info for prescription preview
    const [doctorInfo, setDoctorInfo] = useState<DoctorInfo>({});
    const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>({});

    /* ── Fetch ── */
    const getToken = () => localStorage.getItem("accessToken");

    const fetchPatients = async () => {
        const token = getToken();
        if (!token) return;
        try {
            setLoadingPatients(true);
            const res = await fetch(`${BASE_URL}/api/doctor/patients`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load patients");
            setPatients((data.patients || []) as Patient[]);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoadingPatients(false);
        }
    };

    const fetchConsultations = async (patientId: string) => {
        const token = getToken();
        if (!token) return;
        try {
            setLoadingConsultations(true);
            const res = await fetch(
                `${BASE_URL}/api/doctor/patients/${patientId}/consultations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load consultations");
            setConsultations((data.consultations || []) as Consultation[]);
            setExpandedIds(new Set());
        } catch (err: any) {
            toast.error(err.message);
            setConsultations([]);
        } finally {
            setLoadingConsultations(false);
        }
    };

    const fetchDoctorAndHospital = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/api/doctor/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data?.profile && data?.doctor_profile) {
                setDoctorInfo({
                    full_name: data.profile.full_name,
                    specialization: data.doctor_profile.specialization,
                    license_number: data.doctor_profile.license_number,
                    cnic: data.doctor_profile.cnic,
                });
            }
            if (data?.hospital) {
                setHospitalInfo({
                    name: data.hospital.name,
                    address: data.hospital.address,
                    hospital_type: data.hospital.hospital_type,
                    contact_phone: data.hospital.contact_phone,
                    registration_number: data.hospital.registration_number,
                });
            }
        } catch (err) {
            console.warn("Could not fetch doctor info:", err);
        }
    };

    useEffect(() => {
        fetchPatients();
        fetchDoctorAndHospital();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            fetchConsultations(selectedPatientId);
        } else {
            setConsultations([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPatientId]);

    /* ── Helpers ── */
    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatRelative = (iso: string) => {
        const now = Date.now();
        const then = new Date(iso).getTime();
        const diff = now - then;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days}d ago`;
        if (days < 30) return `${Math.floor(days / 7)}w ago`;
        if (days < 365) return `${Math.floor(days / 30)}mo ago`;
        return `${Math.floor(days / 365)}y ago`;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, "0")}`;
    };

    const isWithinFilter = (iso: string): boolean => {
        if (dateFilter === "all") return true;
        const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[dateFilter];
        if (!days) return true;
        const ageMs = Date.now() - new Date(iso).getTime();
        return ageMs <= days * 24 * 60 * 60 * 1000;
    };

    /* ── Filtered data ── */
    const filteredPatients = useMemo(() => {
        if (!searchQuery.trim()) return patients;
        const q = searchQuery.toLowerCase().trim();
        return patients.filter(
            (p) =>
                p.full_name?.toLowerCase().includes(q) ||
                p.cnic?.toLowerCase().includes(q) ||
                p.phone?.toLowerCase().includes(q)
        );
    }, [patients, searchQuery]);

    const selectedPatient = useMemo(
        () => patients.find((p) => p.id === selectedPatientId) || null,
        [patients, selectedPatientId]
    );

    const filteredConsultations = useMemo(() => {
        return consultations.filter((c) => {
            if (!isWithinFilter(c.created_at)) return false;
            if (diagnosisFilter.trim()) {
                const q = diagnosisFilter.toLowerCase().trim();
                const dx = (c.medical_info?.diagnoses || [])
                    .map((d: any) => (typeof d === "string" ? d : d.name || ""))
                    .join(" ")
                    .toLowerCase();
                if (!dx.includes(q)) return false;
            }
            return true;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [consultations, dateFilter, diagnosisFilter]);

    /* ── Toggle expand ── */
    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    /* ── Download prescription as text ── */
    const downloadPrescription = (c: Consultation, patient: Patient | null) => {
        const rx = c.prescription || {};
        const meds = rx.medications || [];
        const inv = rx.investigations_ordered || [];
        const followUp = rx.follow_up;
        const notes = rx.prescriber_notes;

        const lines: string[] = [];
        lines.push("═══════════════════════════════════════════");
        lines.push("              E-PRESCRIPTION");
        lines.push("═══════════════════════════════════════════");
        lines.push("");
        lines.push(`Hospital: ${hospitalInfo.name || "—"}`);
        if (hospitalInfo.address) lines.push(`Address:  ${hospitalInfo.address}`);
        lines.push("");
        lines.push(`Doctor:   Dr. ${doctorInfo.full_name || "—"}`);
        if (doctorInfo.specialization) lines.push(`Spec:     ${doctorInfo.specialization}`);
        if (doctorInfo.license_number) lines.push(`License:  ${doctorInfo.license_number}`);
        lines.push("");
        lines.push("───────────────────────────────────────────");
        lines.push(`Patient:  ${patient?.full_name || "—"}`);
        if (patient?.cnic) lines.push(`CNIC:     ${patient.cnic}`);
        if (patient?.phone) lines.push(`Phone:    ${patient.phone}`);
        if (patient?.gender) lines.push(`Gender:   ${patient.gender}`);
        lines.push(`Date:     ${formatDateTime(c.created_at)}`);
        lines.push("───────────────────────────────────────────");
        lines.push("");
        lines.push("MEDICATIONS:");
        if (meds.length === 0) {
            lines.push("  (none prescribed)");
        } else {
            meds.forEach((m: any, i: number) => {
                lines.push(`  ${i + 1}. ${m.name || "—"}${m.strength ? ` ${m.strength}` : ""}`);
                if (m.dose) lines.push(`       Dose:      ${m.dose}`);
                if (m.frequency) lines.push(`       Frequency: ${m.frequency}`);
                if (m.duration) lines.push(`       Duration:  ${m.duration}`);
                if (m.route) lines.push(`       Route:     ${m.route}`);
                if (m.instructions) lines.push(`       Notes:     ${m.instructions}`);
                lines.push("");
            });
        }
        if (inv.length > 0) {
            lines.push("INVESTIGATIONS ORDERED:");
            inv.forEach((i: string) => lines.push(`  • ${i}`));
            lines.push("");
        }
        if (followUp) {
            lines.push("FOLLOW-UP:");
            lines.push(`  ${followUp}`);
            lines.push("");
        }
        if (notes) {
            lines.push("ADDITIONAL NOTES:");
            lines.push(`  ${notes}`);
            lines.push("");
        }
        lines.push("───────────────────────────────────────────");
        lines.push(`Digitally signed by Dr. ${doctorInfo.full_name || "Doctor"}`);
        if (doctorInfo.license_number) lines.push(`License: ${doctorInfo.license_number}`);
        lines.push("═══════════════════════════════════════════");
        lines.push("Generated by MedScribe AI");

        const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Prescription-${patient?.full_name || "patient"}-${formatDate(c.created_at)}.txt`.replace(/[\/\\:*?"<>|]/g, "_");
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Prescription downloaded");
    };

    /* ── Render ── */
    return (
        <div className="dl-page">
            {/* Page header */}
            <div className="page-header">
                <div className="page-header-top">
                    <div className="page-header-left">
                        <div className="icon-wrap icon-wrap-md icon-wrap-teal">
                            <HistoryIcon size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="page-header-title">Clinical Archives</h1>
                            <p className="page-header-sub">
                                Complete consultation history and patient records
                            </p>
                        </div>
                    </div>
                    <div className="page-header-actions">
                        <div className="dl-stats-mini">
                            <div className="dl-stat-item">
                                <span className="dl-stat-val">{patients.length}</span>
                                <span className="dl-stat-lbl">Patients</span>
                            </div>
                            <div className="dl-stat-sep" />
                            <div className="dl-stat-item">
                                <span className="dl-stat-val">{consultations.length || "—"}</span>
                                <span className="dl-stat-lbl">Visits</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={fetchPatients}
                            disabled={loadingPatients}
                        >
                            <RefreshCw size={14} className={loadingPatients ? "ms-spinner mr-2" : "mr-2"} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Page content */}
            <div className="page-content">

                {/* Filter bar */}
                <div className="ch-filter-bar">
                    <div className="ch-filter-search">
                        <Search size={16} className="ch-filter-icon" />
                        <input
                            type="text"
                            className="ch-filter-input"
                            placeholder="Search patient by name, CNIC or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="ch-filter-group">
                        <Filter size={14} className="ch-filter-group-icon" />
                        <select
                            className="ch-filter-select"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                        >
                            <option value="all">All time</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="1y">Last year</option>
                        </select>
                    </div>

                    <div className="ch-filter-group">
                        <ClipboardCheck size={14} className="ch-filter-group-icon" />
                        <input
                            type="text"
                            className="ch-filter-select"
                            placeholder="Filter by diagnosis..."
                            value={diagnosisFilter}
                            onChange={(e) => setDiagnosisFilter(e.target.value)}
                            style={{ minWidth: 180 }}
                        />
                    </div>
                </div>

                {/* Master-detail layout */}
                <div className="ch-layout">

                    {/* ── LEFT: Patient list ── */}
                    <aside className="ch-patient-panel">
                        <div className="ch-panel-header">
                            <div className="ch-panel-header-left">
                                <Users size={15} className="ch-panel-icon" />
                                <span className="ch-panel-title">Patient Directory</span>
                            </div>
                            <span className="ch-count-pill">{filteredPatients.length}</span>
                        </div>

                        {loadingPatients ? (
                            <div className="dl-loading-box" style={{ padding: 40 }}>
                                <RefreshCw className="ms-spinner mb-2 text-teal-500" size={24} />
                                <p>Loading directory...</p>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="ch-empty-small">
                                <Users size={24} className="mb-2 opacity-20" />
                                <p>
                                    {patients.length === 0
                                        ? "No patients yet"
                                        : "No matching patients"}
                                </p>
                            </div>
                        ) : (
                            <div className="ch-patient-list">
                                {filteredPatients.map((p) => {
                                    const isActive = selectedPatientId === p.id;
                                    const initials = p.full_name
                                        .split(" ")
                                        .filter(Boolean)
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2);
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedPatientId(p.id)}
                                            className={`ch-patient-item${isActive ? " ch-patient-item-active" : ""}`}
                                        >
                                            <div className="ch-patient-avatar">
                                                {initials}
                                                {isActive && <div className="ch-avatar-active-dot" />}
                                            </div>
                                            <div className="ch-patient-info">
                                                <div className="ch-patient-name">{p.full_name}</div>
                                                <div className="ch-patient-meta-row">
                                                    {p.cnic && (
                                                        <span className="ch-patient-meta">
                                                            <Hash size={10} style={{ display: 'inline', marginRight: 2 }} />
                                                            {p.cnic}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isActive && <ChevronRight size={14} className="ch-arrow" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </aside>

                    {/* ── RIGHT: Consultations ── */}
                    <section className="ch-consult-panel">
                        {!selectedPatient ? (
                            <div className="ch-empty-large">
                                <div className="ch-empty-icon">
                                    <Users size={36} />
                                </div>
                                <h3 className="ch-empty-title">Select a patient</h3>
                                <p className="ch-empty-sub">
                                    Choose a patient from the list to view their consultation history.
                                </p>
                            </div>
                        ) : loadingConsultations ? (
                            <div className="ch-empty-large">
                                <div className="ch-empty-icon">
                                    <Activity size={36} />
                                </div>
                                <h3 className="ch-empty-title">Loading consultations…</h3>
                            </div>
                        ) : (
                            <>
                                {/* Patient summary header */}
                                <div className="ch-patient-summary">
                                    <div className="ch-summary-avatar-wrap">
                                        <div className="ch-summary-avatar">
                                            {selectedPatient.full_name
                                                .split(" ")
                                                .filter(Boolean)
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </div>
                                        <div className="ch-summary-badge">
                                            <CheckCircle size={10} /> Verified
                                        </div>
                                    </div>
                                    <div className="ch-summary-info">
                                        <div className="ch-summary-top">
                                            <h2 className="ch-summary-name">{selectedPatient.full_name}</h2>
                                            <div className="ch-summary-actions">
                                                <button className="btn btn-secondary btn-xs">
                                                    <FileText size={12} className="mr-1" /> Profile
                                                </button>
                                            </div>
                                        </div>
                                        <div className="ch-summary-meta">
                                            {selectedPatient.cnic && (
                                                <span className="ch-summary-chip">
                                                    <Hash size={11} className="mr-1" /> {selectedPatient.cnic}
                                                </span>
                                            )}
                                            {selectedPatient.phone && (
                                                <span className="ch-summary-chip">
                                                    <Clock size={11} className="mr-1" /> {selectedPatient.phone}
                                                </span>
                                            )}
                                            {selectedPatient.gender && (
                                                <span className="ch-summary-chip rx-cap">
                                                    {selectedPatient.gender}
                                                </span>
                                            )}
                                            <span className="ch-summary-chip ch-summary-chip-teal">
                                                <Activity size={11} className="mr-1" />
                                                {filteredConsultations.length} Visit{filteredConsultations.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Consultation list */}
                                {filteredConsultations.length === 0 ? (
                                    <div className="ch-empty-large">
                                        <div className="ch-empty-icon">
                                            <FileText size={36} />
                                        </div>
                                        <h3 className="ch-empty-title">No consultations found</h3>
                                        <p className="ch-empty-sub">
                                            {consultations.length === 0
                                                ? "This patient has no consultations yet."
                                                : "Try adjusting the date or diagnosis filters."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="ch-consult-list">
                                        {filteredConsultations.map((c) => {
                                            const isExpanded = expandedIds.has(c.id);
                                            const meds = c.prescription?.medications || [];
                                            const dx = c.medical_info?.diagnoses || [];
                                            const symptoms = c.medical_info?.symptoms || [];
                                            const allergies = c.medical_info?.allergies || [];
                                            const vitals = c.medical_info?.vital_signs || {};
                                            const inv = c.prescription?.investigations_ordered || [];
                                            const followUp = c.prescription?.follow_up;

                                            return (
                                                <div
                                                    key={c.id}
                                                    className={`ch-consult-card${isExpanded ? " ch-consult-card-open" : ""}`}
                                                >
                                                    {/* Card header (always visible) */}
                                                    <button
                                                        type="button"
                                                        className="ch-consult-header"
                                                        onClick={() => toggleExpand(c.id)}
                                                    >
                                                        <div className="ch-consult-header-left">
                                                            <div className="ch-consult-date-mark">
                                                                <span className="ch-date-day">{new Date(c.created_at).getDate()}</span>
                                                                <span className="ch-date-month">{new Date(c.created_at).toLocaleDateString("en-US", { month: 'short' })}</span>
                                                            </div>
                                                            <div className="ch-consult-main-info">
                                                                <div className="ch-consult-title-row">
                                                                    <div className="ch-consult-date-full">
                                                                        {formatDate(c.created_at)}
                                                                        <span className="ch-consult-dot" />
                                                                        <span className="ch-consult-time-label">
                                                                            <Clock size={10} className="mr-1" />
                                                                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="ch-status-pill">
                                                                        <CheckCircle size={10} className="mr-1" /> Completed
                                                                    </div>
                                                                </div>
                                                                <div className="ch-consult-meta-sub">
                                                                    {formatRelative(c.created_at)} · {formatDuration(c.duration_seconds)} session
                                                                </div>
                                                                <div className="ch-consult-badges">
                                                                    {dx.length > 0 && (
                                                                        <span className="ch-badge ch-badge-dx">
                                                                            <Stethoscope size={11} />
                                                                            {dx[0]?.name || dx[0] || "Diagnosis"}
                                                                        </span>
                                                                    )}
                                                                    {meds.length > 0 && (
                                                                        <span className="ch-badge ch-badge-med">
                                                                            <Pill size={11} />
                                                                            {meds.length} Med{meds.length !== 1 ? "s" : ""}
                                                                        </span>
                                                                    )}
                                                                    {allergies.length > 0 && (
                                                                        <span className="ch-badge ch-badge-allergy">
                                                                            <ShieldAlert size={11} />
                                                                            Risk
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="ch-consult-header-right">
                                                            {isExpanded ? (
                                                                <ChevronDown size={18} className="ch-chevron" />
                                                            ) : (
                                                                <ChevronRight size={18} className="ch-chevron" />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Expanded content */}
                                                    {isExpanded && (
                                                        <div className="ch-consult-body">

                                                            {/* Vitals strip */}
                                                            {Object.values(vitals).some((v) => v) && (
                                                                <div className="ch-section">
                                                                    <div className="ch-section-title">
                                                                        <Activity size={13} /> Vital Signs
                                                                    </div>
                                                                    <div className="ch-vitals-row">
                                                                        {vitals.blood_pressure && (
                                                                            <div className="ch-vital">
                                                                                <span className="ch-vital-label">BP</span>
                                                                                <span className="ch-vital-value">
                                                                                    {vitals.blood_pressure}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {vitals.heart_rate && (
                                                                            <div className="ch-vital">
                                                                                <span className="ch-vital-label">HR</span>
                                                                                <span className="ch-vital-value">
                                                                                    {vitals.heart_rate}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {vitals.temperature && (
                                                                            <div className="ch-vital">
                                                                                <span className="ch-vital-label">Temp</span>
                                                                                <span className="ch-vital-value">
                                                                                    {vitals.temperature}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {vitals.spo2 && (
                                                                            <div className="ch-vital">
                                                                                <span className="ch-vital-label">SpO₂</span>
                                                                                <span className="ch-vital-value">
                                                                                    {vitals.spo2}%
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {vitals.weight && (
                                                                            <div className="ch-vital">
                                                                                <span className="ch-vital-label">Wt</span>
                                                                                <span className="ch-vital-value">
                                                                                    {vitals.weight}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Symptoms */}
                                                            {symptoms.length > 0 && (
                                                                <div className="ch-section">
                                                                    <div className="ch-section-title">
                                                                        <AlertCircle size={13} /> Symptoms
                                                                    </div>
                                                                    <div className="ch-tags-row">
                                                                        {symptoms.map((s: any, i: number) => (
                                                                            <span key={i} className="ch-tag">
                                                                                {s.name || s}
                                                                                {s.severity && (
                                                                                    <span className="ch-tag-meta"> · {s.severity}</span>
                                                                                )}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Diagnoses */}
                                                            {dx.length > 0 && (
                                                                <div className="ch-section">
                                                                    <div className="ch-section-title">
                                                                        <Stethoscope size={13} /> Diagnosis
                                                                    </div>
                                                                    <div className="ch-dx-list">
                                                                        {dx.map((d: any, i: number) => (
                                                                            <div key={i} className="ch-dx-item">
                                                                                <span className="ch-dx-bullet">•</span>
                                                                                <span className="ch-dx-name">
                                                                                    {d.name || d}
                                                                                </span>
                                                                                {d.icd10_code && (
                                                                                    <span className="ch-dx-icd">
                                                                                        {d.icd10_code}
                                                                                    </span>
                                                                                )}
                                                                                {d.type && (
                                                                                    <span className={`ch-dx-tag ch-dx-tag-${d.type === "primary" ? "primary" : "diff"}`}>
                                                                                        {d.type}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Medications preview */}
                                                            {meds.length > 0 && (
                                                                <div className="ch-section">
                                                                    <div className="ch-section-title">
                                                                        <Pill size={13} /> Medications
                                                                    </div>
                                                                    <div className="ch-meds-list">
                                                                        {meds.map((m: any, i: number) => (
                                                                            <div key={i} className="ch-med-row">
                                                                                <span className="ch-med-num">{i + 1}</span>
                                                                                <div className="ch-med-info">
                                                                                    <div className="ch-med-name">
                                                                                        {m.name}
                                                                                        {m.strength && (
                                                                                            <span className="ch-med-strength">
                                                                                                {m.strength}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="ch-med-meta">
                                                                                        {[m.dose, m.frequency, m.duration]
                                                                                            .filter(Boolean)
                                                                                            .join(" · ")}
                                                                                    </div>
                                                                                </div>
                                                                                {m.route && (
                                                                                    <span className={`ch-med-route ch-route-${m.route?.toLowerCase()}`}>
                                                                                        {m.route}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Investigations */}
                                                            {inv.length > 0 && (
                                                                <div className="ch-section">
                                                                    <div className="ch-section-title">
                                                                        <FileText size={13} /> Investigations
                                                                    </div>
                                                                    <div className="ch-tags-row">
                                                                        {inv.map((i: string, idx: number) => (
                                                                            <span key={idx} className="ch-tag ch-tag-inv">
                                                                                {i}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Follow-up */}
                                                            {followUp && (
                                                                <div className="ch-section">
                                                                    <div className="ch-section-title">
                                                                        <CalendarClock size={13} /> Follow-up
                                                                    </div>
                                                                    <p className="ch-text">{followUp}</p>
                                                                </div>
                                                            )}

                                                            {/* Action buttons */}
                                                            <div className="ch-actions">
                                                                <button
                                                                    type="button"
                                                                    className="ch-action-btn"
                                                                    onClick={() => setTranscriptModal(c)}
                                                                >
                                                                    <Eye size={13} /> View Transcript
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="ch-action-btn"
                                                                    onClick={() => setPrescriptionModal(c)}
                                                                    disabled={meds.length === 0}
                                                                >
                                                                    <Printer size={13} /> View / Print Prescription
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="ch-action-btn ch-action-btn-primary"
                                                                    onClick={() => downloadPrescription(c, selectedPatient)}
                                                                    disabled={meds.length === 0}
                                                                >
                                                                    <Download size={13} /> Download
                                                                </button>
                                                                <SendPrescriptionButton
                                                                    consultationId={c.id}
                                                                    hasMeds={meds.length > 0}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>

                {/* Modals placed inside page-content or dl-page to avoid sibling error */}
                {transcriptModal && (
                    <div
                        className="ch-modal-backdrop"
                        onClick={() => setTranscriptModal(null)}
                    >
                        <div
                            className="ch-modal ch-modal-md dl-glass-card"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="ch-modal-header">
                                <div className="flex items-center gap-3">
                                    <div className="icon-wrap icon-wrap-sm icon-wrap-teal">
                                        <FileText size={14} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="ch-modal-title">Clinical Transcript</h3>
                                        <p className="ch-modal-sub">
                                            {selectedPatient?.full_name} · {formatDate(transcriptModal.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="ch-modal-close"
                                    onClick={() => setTranscriptModal(null)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="ch-modal-body">
                                <div className="ch-transcript-meta">
                                    <span className="ch-transcript-chip">
                                        <Clock size={11} className="mr-1" />{" "}
                                        {formatDuration(transcriptModal.duration_seconds)}
                                    </span>
                                    {transcriptModal.language && (
                                        <span className="ch-transcript-chip rx-cap">
                                            <Sparkles size={11} className="mr-1" />
                                            {transcriptModal.language}
                                        </span>
                                    )}
                                    <span className="ch-transcript-chip">
                                        {transcriptModal.transcript.split(/\s+/).length} words
                                    </span>
                                </div>
                                <div className="ch-transcript-content-new">
                                    {transcriptModal.transcript || "(No transcript available)"}
                                </div>
                            </div>
                            <div className="ch-modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(transcriptModal.transcript);
                                        toast.success("Transcript copied");
                                    }}
                                >
                                    <FileText size={14} className="mr-2" /> Copy Text
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setTranscriptModal(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {prescriptionModal && (
                    <PrescriptionModal
                        consultation={prescriptionModal}
                        patient={selectedPatient}
                        doctorInfo={doctorInfo}
                        hospitalInfo={hospitalInfo}
                        onClose={() => setPrescriptionModal(null)}
                    />
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
   SEND PRESCRIPTION BUTTON (inline in history)
───────────────────────────────────────────────────────── */
function SendPrescriptionButton({
  consultationId,
  hasMeds,
}: {
  consultationId: string;
  hasMeds: boolean;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/doctor/consultations/${consultationId}/send-prescription`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }

      setSent(true);
      toast.success(data.message || "Prescription sent to patient!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send prescription");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <button
        type="button"
        className="ch-action-btn ch-action-btn-sent"
        disabled
      >
        <CheckCircle size={13} /> Sent ✓
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`ch-action-btn ch-action-btn-send`}
      onClick={handleSend}
      disabled={!hasMeds || sending}
    >
      {sending ? (
        <>
          <RefreshCw size={13} className="ms-spinner" /> Sending...
        </>
      ) : (
        <>
          <Send size={13} /> Send to Patient
        </>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   PRESCRIPTION MODAL — re-uses the .rx-document design
───────────────────────────────────────────────────────── */
function PrescriptionModal({
    consultation,
    patient,
    doctorInfo,
    hospitalInfo,
    onClose,
}: {
    consultation: Consultation;
    patient: Patient | null;
    doctorInfo: DoctorInfo;
    hospitalInfo: HospitalInfo;
    onClose: () => void;
}) {
    const rx = consultation.prescription || {};
    const meds = rx.medications || [];
    const investigations = rx.investigations_ordered || [];
    const followUp = rx.follow_up;
    const allergies = consultation.medical_info?.allergies || [];
    const dx = consultation.medical_info?.diagnoses || [];
    const vitals = consultation.medical_info?.vital_signs || {};
    const symptoms = consultation.medical_info?.symptoms || [];

    const consultDate = new Date(consultation.created_at);
    const prescriptionNumber = `RX-${consultDate.getFullYear()}${String(consultDate.getMonth() + 1).padStart(2, '0')}${String(consultDate.getDate()).padStart(2, '0')}-${consultation.id.slice(0, 4).toUpperCase()}`;

    const doctorInitials = (doctorInfo.full_name || "Dr")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="ch-modal-backdrop" onClick={onClose}>
            <div
                className="ch-modal ch-modal-rx"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ch-modal-header ch-modal-header-rx">
                    <div>
                        <h3 className="ch-modal-title">E-Prescription</h3>
                        <p className="ch-modal-sub">
                            Original prescription from {consultDate.toLocaleDateString()}
                        </p>
                    </div>
                    <div className="ch-modal-actions-row">
                        <button
                            type="button"
                            className="ch-action-btn"
                            onClick={handlePrint}
                        >
                            <Printer size={13} /> Print
                        </button>
                        <button
                            type="button"
                            className="ch-modal-close"
                            onClick={onClose}
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="ch-modal-body ch-modal-body-rx">
                    <div className="rx-document">
                        {/* Subtle Watermark */}
                        <div className="rx-watermark-container">
                            <div className="rx-watermark-text">MEDSCRIBE AI</div>
                            <div className="rx-watermark-text">CERTIFIED PRESCRIPTION</div>
                        </div>

                        {/* Letterhead */}
                        <div className="rx-letterhead">
                            <div className="rx-letterhead-accent" />
                            <div className="rx-letterhead-top">
                                <div className="rx-hospital">
                                    <div className="rx-hospital-icon">
                                        <Building2 size={32} />
                                    </div>
                                    <div className="rx-hospital-text">
                                        <h1 className="rx-hospital-name">
                                            {hospitalInfo.name || "Hospital Name"}
                                        </h1>
                                        {hospitalInfo.address && (
                                            <p className="rx-hospital-address">{hospitalInfo.address}</p>
                                        )}
                                        <div className="rx-hospital-meta">
                                            {hospitalInfo.hospital_type && (
                                                <span className="rx-hospital-meta-item">
                                                    {hospitalInfo.hospital_type}
                                                </span>
                                            )}
                                            {hospitalInfo.contact_phone && (
                                                <span className="rx-hospital-meta-item">
                                                    ☎ {hospitalInfo.contact_phone}
                                                </span>
                                            )}
                                            {hospitalInfo.registration_number && (
                                                <span className="rx-hospital-meta-item">
                                                    Reg# {hospitalInfo.registration_number}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rx-doctor">
                                    <div className="rx-doctor-name-row">
                                        <Stethoscope size={16} />
                                        <span className="rx-doctor-name">
                                            Dr. {doctorInfo.full_name || "Doctor Name"}
                                        </span>
                                    </div>
                                    {doctorInfo.specialization && (
                                        <div className="rx-doctor-spec">{doctorInfo.specialization}</div>
                                    )}
                                    <div className="rx-doctor-creds">
                                        {doctorInfo.license_number && (
                                            <div className="rx-doctor-cred-item">
                                                <Award size={12} />
                                                <span>PMC# {doctorInfo.license_number}</span>
                                            </div>
                                        )}
                                        {doctorInfo.cnic && (
                                            <div className="rx-doctor-cred-item">
                                                <Hash size={12} />
                                                <span>CNIC: {doctorInfo.cnic}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rx-letterhead-divider">
                                <div className="rx-divider-ornament left" />
                                <span className="rx-divider-symbol">℞</span>
                                <div className="rx-divider-ornament right" />
                            </div>

                            <div className="rx-meta-row">
                                <div className="rx-meta-item">
                                    <span className="rx-meta-label">Prescription #</span>
                                    <span className="rx-meta-value rx-mono">{prescriptionNumber}</span>
                                </div>
                                <div className="rx-meta-item">
                                    <span className="rx-meta-label">Date</span>
                                    <span className="rx-meta-value">
                                        {consultDate.toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div className="rx-meta-item">
                                    <span className="rx-meta-label">Time</span>
                                    <span className="rx-meta-value">
                                        {consultDate.toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Patient */}
                        <section className="rx-section rx-patient-section">
                            <div className="rx-section-header">
                                <User size={16} className="rx-section-icon" />
                                <h3 className="rx-section-title">Patient Information</h3>
                            </div>
                            <div className="rx-patient-grid">
                                <div className="rx-patient-field">
                                    <span className="rx-field-label">Name</span>
                                    <span className="rx-field-value">{patient?.full_name || "—"}</span>
                                </div>
                                {patient?.gender && (
                                    <div className="rx-patient-field">
                                        <span className="rx-field-label">Gender</span>
                                        <span className="rx-field-value rx-cap">{patient.gender}</span>
                                    </div>
                                )}
                                {patient?.cnic && (
                                    <div className="rx-patient-field">
                                        <span className="rx-field-label">CNIC</span>
                                        <span className="rx-field-value rx-mono">{patient.cnic}</span>
                                    </div>
                                )}
                                {patient?.phone && (
                                    <div className="rx-patient-field">
                                        <span className="rx-field-label">Phone</span>
                                        <span className="rx-field-value">{patient.phone}</span>
                                    </div>
                                )}
                            </div>
                            {allergies.length > 0 ? (
                                <div className="rx-allergy-banner rx-allergy-warn">
                                    <ShieldAlert size={16} />
                                    <div>
                                        <span className="rx-allergy-label">ALLERGIES:</span>
                                        <span className="rx-allergy-text">{allergies.join(", ")}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="rx-allergy-banner rx-allergy-ok">
                                    <ShieldAlert size={14} />
                                    <span>No known drug allergies (NKDA)</span>
                                </div>
                            )}
                        </section>

                        {/* Vitals */}
                        {Object.values(vitals).some((v) => v) && (
                            <section className="rx-section">
                                <div className="rx-section-header">
                                    <Activity size={16} className="rx-section-icon" />
                                    <h3 className="rx-section-title">Vital Signs</h3>
                                </div>
                                <div className="rx-vitals-grid">
                                    {vitals.blood_pressure && (
                                        <div className="rx-vital-item">
                                            <span className="rx-vital-label">BP</span>
                                            <span className="rx-vital-value">{vitals.blood_pressure}</span>
                                            <span className="rx-vital-unit">mmHg</span>
                                        </div>
                                    )}
                                    {vitals.heart_rate && (
                                        <div className="rx-vital-item">
                                            <span className="rx-vital-label">HR</span>
                                            <span className="rx-vital-value">{vitals.heart_rate}</span>
                                            <span className="rx-vital-unit">bpm</span>
                                        </div>
                                    )}
                                    {vitals.temperature && (
                                        <div className="rx-vital-item">
                                            <span className="rx-vital-label">Temp</span>
                                            <span className="rx-vital-value">{vitals.temperature}</span>
                                        </div>
                                    )}
                                    {vitals.spo2 && (
                                        <div className="rx-vital-item">
                                            <span className="rx-vital-label">SpO₂</span>
                                            <span className="rx-vital-value">{vitals.spo2}</span>
                                            <span className="rx-vital-unit">%</span>
                                        </div>
                                    )}
                                    {vitals.weight && (
                                        <div className="rx-vital-item">
                                            <span className="rx-vital-label">Weight</span>
                                            <span className="rx-vital-value">{vitals.weight}</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Diagnosis */}
                        {dx.length > 0 && (
                            <section className="rx-section rx-diagnosis-section">
                                <div className="rx-section-header">
                                    <ClipboardCheck size={16} className="rx-section-icon" />
                                    <h3 className="rx-section-title">Diagnosis</h3>
                                </div>
                                <div className="rx-diagnosis-list">
                                    {dx.map((d: any, idx: number) => (
                                        <div key={idx} className="rx-diagnosis-item">
                                            <div className="rx-dx-main">
                                                <span className="rx-dx-bullet">•</span>
                                                <span className="rx-dx-name">{d.name || d}</span>
                                                {d.icd10_code && (
                                                    <span className="rx-dx-icd">{d.icd10_code}</span>
                                                )}
                                            </div>
                                            <div className="rx-dx-tags">
                                                {d.type && (
                                                    <span className={`rx-dx-tag rx-dx-tag-${d.type === "primary" ? "primary" : "diff"}`}>
                                                        {d.type}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {symptoms.length > 0 && (
                                    <div className="rx-symptoms-row">
                                        <span className="rx-symptoms-label">Presenting symptoms:</span>
                                        <span className="rx-symptoms-text">
                                            {symptoms.map((s: any) => s.name || s).filter(Boolean).join(", ")}
                                        </span>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Medications */}
                        <section className="rx-section rx-meds-section-new">
                            <div className="rx-section-header">
                                <Pill size={16} className="rx-section-icon" />
                                <h3 className="rx-section-title">℞ Prescribed Medications</h3>
                                {meds.length === 0 && (
                                    <span className="rx-section-note">No medications prescribed</span>
                                )}
                            </div>
                            {meds.length > 0 && (
                                <div className="rx-meds-list">
                                    {meds.map((med: any, idx: number) => (
                                        <div key={idx} className="rx-med-card">
                                            <div className="rx-med-number">{idx + 1}</div>
                                            <div className="rx-med-body">
                                                <div className="rx-med-header-row">
                                                    <div className="rx-med-name-block">
                                                        <span className="rx-med-name-new">{med.name}</span>
                                                        {med.generic_name && med.generic_name !== med.name && (
                                                            <span className="rx-med-generic-new">
                                                                ({med.generic_name})
                                                            </span>
                                                        )}
                                                        {med.strength && (
                                                            <span className="rx-med-strength">{med.strength}</span>
                                                        )}
                                                    </div>
                                                    {med.route && (
                                                        <span className={`rx-med-route rx-route-${med.route?.toLowerCase()}`}>
                                                            {med.route}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="rx-med-details">
                                                    {med.dose && (
                                                        <div className="rx-med-detail">
                                                            <span className="rx-detail-label">Dose</span>
                                                            <span className="rx-detail-value">{med.dose}</span>
                                                        </div>
                                                    )}
                                                    {med.frequency && (
                                                        <div className="rx-med-detail">
                                                            <span className="rx-detail-label">Frequency</span>
                                                            <span className="rx-detail-value">{med.frequency}</span>
                                                        </div>
                                                    )}
                                                    {med.duration && (
                                                        <div className="rx-med-detail">
                                                            <span className="rx-detail-label">Duration</span>
                                                            <span className="rx-detail-value">{med.duration}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {med.instructions && (
                                                    <div className="rx-med-instructions">
                                                        <span className="rx-instructions-label">Instructions:</span>
                                                        <span className="rx-instructions-text">{med.instructions}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Investigations */}
                        {investigations.length > 0 && (
                            <section className="rx-section rx-inv-section">
                                <div className="rx-section-header">
                                    <FileText size={16} className="rx-section-icon" />
                                    <h3 className="rx-section-title">Investigations Ordered</h3>
                                </div>
                                <div className="rx-inv-grid">
                                    {investigations.map((inv: string, idx: number) => (
                                        <div key={idx} className="rx-inv-chip">
                                            <span className="rx-inv-num">{idx + 1}</span>
                                            <span>{inv}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Follow-up */}
                        {followUp && (
                            <section className="rx-section rx-followup-section">
                                <div className="rx-followup-box">
                                    <div className="rx-followup-icon-wrap">
                                        <CalendarClock size={18} />
                                    </div>
                                    <div>
                                        <h4 className="rx-followup-title">Follow-up</h4>
                                        <p className="rx-followup-text-new">{followUp}</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Signature */}
                        <section className="rx-signature-section">
                            <div className="rx-sig-grid">
                                <div className="rx-sig-block-empty">
                                    <div className="rx-sig-line" />
                                    <span className="rx-sig-caption">Patient / Attendant Signature</span>
                                </div>
                                <div className="rx-sig-block">
                                    <div className="rx-sig-stamp">
                                        <div className="rx-sig-mark">
                                            <span className="rx-sig-initials">{doctorInitials}</span>
                                            <span className="rx-sig-script">
                                                Dr. {doctorInfo.full_name?.split(" ")[0] || ""}
                                            </span>
                                        </div>
                                        <div className="rx-sig-verified">
                                            <span className="rx-verified-dot" />
                                            Digitally Signed
                                        </div>
                                    </div>
                                    <div className="rx-sig-line" />
                                    <div className="rx-sig-doctor-info">
                                        <span className="rx-sig-doc-name">
                                            Dr. {doctorInfo.full_name || "Doctor"}
                                        </span>
                                        {doctorInfo.specialization && (
                                            <span className="rx-sig-doc-spec">{doctorInfo.specialization}</span>
                                        )}
                                        {doctorInfo.license_number && (
                                            <span className="rx-sig-doc-license">
                                                License: {doctorInfo.license_number}
                                            </span>
                                        )}
                                        <span className="rx-sig-doc-date">
                                            Signed on {consultDate.toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })} at {consultDate.toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Footer */}
                        <footer className="rx-footer">
                            <div className="rx-footer-left">
                                <Sparkles size={12} />
                                <span>
                                    Powered by <strong>MedScribe AI</strong>
                                </span>
                            </div>
                            <div className="rx-footer-right">
                                <span>This is an AI-assisted prescription · Requires physician countersignature</span>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}