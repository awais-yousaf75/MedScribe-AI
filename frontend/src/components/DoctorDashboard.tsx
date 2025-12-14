import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

interface DoctorDashboardProps {
  onStartConsultation: () => void;
  onViewConsultation: () => void;
  onEditNotes: () => void;
  onViewAllHistory: () => void;
}

export function DoctorDashboard({
  onStartConsultation,
  onViewConsultation,
  onEditNotes,
  onViewAllHistory,
}: DoctorDashboardProps) {
  const [doctorInfo, setDoctorInfo] = useState<DoctorMeResponse | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);

  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  const [assistantForm, setAssistantForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [creatingAssistant, setCreatingAssistant] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  // -------- Helpers --------
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

  const renderStatusBadge = (status?: string | null) => {
    if (!status) return <span className="text-xs text-slate-400">-</span>;
    const base =
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    if (status === "approved")
      return (
        <span
          className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-100`}
        >
          Approved
        </span>
      );
    if (status === "rejected")
      return (
        <span
          className={`${base} bg-red-50 text-red-700 border border-red-100`}
        >
          Rejected
        </span>
      );
    return (
      <span
        className={`${base} bg-amber-50 text-amber-700 border border-amber-100`}
      >
        Pending
      </span>
    );
  };

  // -------- API calls --------
  const fetchDoctorInfo = async () => {
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
      if (!res.ok) {
        throw new Error(data.error || "Failed to load doctor info");
      }
      setDoctorInfo(data as DoctorMeResponse);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load doctor info");
    } finally {
      setLoadingDoctor(false);
    }
  };

  const fetchAssistants = async () => {
    if (!token) return;
    try {
      setLoadingAssistants(true);
      const res = await fetch(`${API_URL}/api/doctor/assistants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load assistants");
      }
      setAssistants((data.assistants || []) as Assistant[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load assistants");
    } finally {
      setLoadingAssistants(false);
    }
  };

  const fetchPatients = async () => {
    if (!token) return;
    try {
      setLoadingPatients(true);
      const res = await fetch(`${API_URL}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        // e.g. 400 "Doctor not linked to a hospital"
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

  // -------- Assistant creation --------
  const handleAssistantInputChange = (
    field: keyof typeof assistantForm,
    value: string
  ) => {
    setAssistantForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (!res.ok) {
        throw new Error(data.error || "Failed to create assistant");
      }
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

  // -------- Derived values for UI --------
  const name =
    doctorInfo?.profile.full_name ||
    doctorInfo?.user.user_metadata?.full_name ||
    doctorInfo?.user.email ||
    "Doctor";

  const specialization = doctorInfo?.doctor_profile?.specialization || "-";
  const license = doctorInfo?.doctor_profile?.license_number || "-";
  const cnic = doctorInfo?.doctor_profile?.cnic || "-";
  const hospital = doctorInfo?.hospital;

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

  const search = patientSearch.trim().toLowerCase();
  const visiblePatients = search
    ? patients.filter((p) => {
        const name = p.full_name?.toLowerCase() || "";
        const cnic = p.cnic?.toLowerCase() || "";
        const phone = p.phone?.toLowerCase() || "";
        return (
          name.includes(search) ||
          cnic.includes(search) ||
          phone.includes(search)
        );
      })
    : patients;

  return (
    <div className="space-y-6">
      {/* Doctor header */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Doctor Dashboard
          </p>
          <h1 className="text-2xl font-semibold mt-1">{name}</h1>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-200">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 bg-slate-800/60 px-2 py-1">
              <span className="font-medium">Specialization:</span>
              <span>{specialization}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 bg-slate-800/60 px-2 py-1">
              <span className="font-medium">License #:</span>
              <span>{license}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 bg-slate-800/60 px-2 py-1">
              <span className="font-medium">CNIC:</span>
              <span>{cnic}</span>
            </span>
          </div>
        </div>
        <div className="space-y-2 text-xs md:text-sm text-right">
          <div>
            <div className="text-slate-400 text-[11px] uppercase tracking-wide">
              Account Status
            </div>
            {renderStatusBadge(doctorInfo?.profile.approval_status)}
          </div>
          <div>
            <div className="text-slate-400 text-[11px] uppercase tracking-wide">
              Hospital Status
            </div>
            {renderStatusBadge(hospital?.status)}
          </div>
        </div>
      </div>

      {/* Hospital card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Affiliated Hospital
            </h2>
            <p className="text-xs text-slate-500">
              Information about your primary practice location.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={loadingDoctor}
            onClick={fetchDoctorInfo}
          >
            Refresh
          </Button>
        </div>
        {loadingDoctor ? (
          <p className="text-xs text-slate-500 mt-2">Loading hospital...</p>
        ) : hospital ? (
          <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs">
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Name</div>
              <div className="font-medium text-slate-900">{hospital.name}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Type</div>
              <div className="text-slate-700">
                {hospital.hospital_type || "-"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">
                Address
              </div>
              <div className="text-slate-700">{hospital.address || "-"}</div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-2">
            No hospital linked to your account yet.
          </p>
        )}
      </div>

      {/* Patients card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Patients in Your Hospital
            </h2>
            <p className="text-xs text-slate-500">
              View every patient registered under your hospital. Data is shared
              across you and your approved assistants.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={loadingPatients}
              onClick={fetchPatients}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI chips + search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-slate-500 uppercase tracking-wide">
                Total Patients
              </div>
              <div className="text-slate-900 font-semibold text-base">
                {totalPatients}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-slate-500 uppercase tracking-wide">
                Last 30 Days
              </div>
              <div className="text-slate-900 font-semibold text-base">
                {patientsLast30}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-slate-500 uppercase tracking-wide">
                Added Today
              </div>
              <div className="text-slate-900 font-semibold text-base">
                {patientsToday}
              </div>
            </div>
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Search by name, CNIC, or phone"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Patients table */}
        <div className="mt-2">
          {loadingPatients ? (
            <p className="text-xs text-slate-500">Loading patients...</p>
          ) : visiblePatients.length === 0 ? (
            <p className="text-xs text-slate-400">
              {totalPatients === 0
                ? "No patients have been registered for this hospital yet."
                : "No patients match the current search query."}
            </p>
          ) : (
            <div className="w-full overflow-hidden rounded-xl border border-slate-200">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[720px] table-fixed text-xs">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200 text-left text-[11px] font-semibold text-slate-500">
                      <th className="py-2.5 px-3 w-[20%]">Name</th>
                      <th className="py-2.5 px-3 w-[18%]">CNIC</th>
                      <th className="py-2.5 px-3 w-[12%]">Gender</th>
                      <th className="py-2.5 px-3 w-[15%]">Date of Birth</th>
                      <th className="py-2.5 px-3 w-[15%]">Phone</th>
                      <th className="py-2.5 px-3 w-[20%]">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {visiblePatients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900 truncate">
                            {p.full_name}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-slate-800">
                            {p.cnic}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 border border-slate-200">
                            {formatGender(p.gender)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span>{formatDate(p.dob)}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="truncate block">
                            {p.phone || "-"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span>{formatDate(p.created_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assistants card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Doctor Assistants
            </h2>
            <p className="text-xs text-slate-500">
              Add assistants who will help manage patients on your behalf. New
              assistants must be approved by the hospital admin before they can
              log in.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={loadingAssistants}
            onClick={fetchAssistants}
          >
            Refresh
          </Button>
        </div>

        {/* Add assistant form */}
        <form
          onSubmit={handleCreateAssistant}
          className="grid gap-3 md:grid-cols-2 text-xs"
        >
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">
              Full Name
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Assistant full name"
              value={assistantForm.fullName}
              onChange={(e) =>
                handleAssistantInputChange("fullName", e.target.value)
              }
              required
              disabled={creatingAssistant}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="assistant@example.com"
              value={assistantForm.email}
              onChange={(e) =>
                handleAssistantInputChange("email", e.target.value)
              }
              required
              disabled={creatingAssistant}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">
              Phone
            </label>
            <input
              type="tel"
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="+92 3xx xxxxxxx"
              value={assistantForm.phone}
              onChange={(e) =>
                handleAssistantInputChange("phone", e.target.value)
              }
              disabled={creatingAssistant}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Initial password"
              value={assistantForm.password}
              onChange={(e) =>
                handleAssistantInputChange("password", e.target.value)
              }
              required
              disabled={creatingAssistant}
            />
          </div>

          {/* Confirm password field */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Confirm password"
              value={assistantForm.confirmPassword}
              onChange={(e) =>
                handleAssistantInputChange("confirmPassword", e.target.value)
              }
              required
              disabled={creatingAssistant}
            />
          </div>

          {/* Submit button in its own grid cell */}
          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              className="w-full md:w-auto"
              disabled={creatingAssistant}
            >
              {creatingAssistant ? "Creating..." : "Add Assistant"}
            </Button>
          </div>
        </form>

        {/* Assistants list */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-slate-700 mb-2">
            Existing Assistants
          </h3>
          {loadingAssistants ? (
            <p className="text-xs text-slate-500">Loading assistants...</p>
          ) : assistants.length === 0 ? (
            <p className="text-xs text-slate-400">
              No assistants added yet. Use the form above to add one.
            </p>
          ) : (
            <div className="w-full overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full table-fixed text-xs">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-left text-[11px] font-semibold text-slate-500">
                    <th className="py-2.5 px-3 w-[30%]">Name</th>
                    <th className="py-2.5 px-3 w-[30%]">Phone</th>
                    <th className="py-2.5 px-3 w-[20%]">Status</th>
                    <th className="py-2.5 px-3 w-[20%]">Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {assistants.map((a) => (
                    <tr key={a.profile_id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 truncate">
                          {a.full_name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="truncate block">{a.phone || "-"}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderStatusBadge(a.approval_status)}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {a.approval_status === "pending"
                          ? "Waiting for hospital admin approval"
                          : a.approval_status === "approved"
                          ? "Assistant can log in and manage patients"
                          : "Assistant request rejected"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Consultation workspace */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Consultation Workspace
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4 text-xs">
          <button
            type="button"
            onClick={onStartConsultation}
            className="rounded-xl border border-slate-200 bg-slate-900 text-slate-50 py-3 px-3 text-left hover:bg-slate-800 transition"
          >
            <div className="font-medium">Start Consultation</div>
            <div className="text-[11px] text-slate-300">
              Begin recording a new doctor–patient conversation.
            </div>
          </button>
          <button
            type="button"
            onClick={onViewConsultation}
            className="rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-left hover:bg-slate-100 transition"
          >
            <div className="font-medium text-slate-900">
              View Latest Extraction
            </div>
            <div className="text-[11px] text-slate-500">
              Review the AI summary & extracted details.
            </div>
          </button>
          <button
            type="button"
            onClick={onEditNotes}
            className="rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-left hover:bg-slate-100 transition"
          >
            <div className="font-medium text-slate-900">Edit Notes</div>
            <div className="text-[11px] text-slate-500">
              Refine consultation notes before finalizing.
            </div>
          </button>
          <button
            type="button"
            onClick={onViewAllHistory}
            className="rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-left hover:bg-slate-100 transition"
          >
            <div className="font-medium text-slate-900">
              Consultation History
            </div>
            <div className="text-[11px] text-slate-500">
              Browse your previous consultations and summaries.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
