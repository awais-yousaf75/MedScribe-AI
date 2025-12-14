import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export function AssistantDashboard() {
  const [assistantInfo, setAssistantInfo] =
    useState<AssistantMeResponse | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [creating, setCreating] = useState(false);

  // New‑patient form state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    gender: "male",
    dob: "",
    cnic: "",
  });

  // Existing‑patient search state
  const [existingCnic, setExistingCnic] = useState("");
  const [searchingExisting, setSearchingExisting] = useState(false);
  const [existingResult, setExistingResult] =
    useState<ExistingPatientSearchResult | null>(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  const fetchAssistantInfo = async () => {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // --- Existing patient search ---
  const handleSearchExisting = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const res = await fetch(
        `${API_URL}/api/assistant/patients/search?cnic=${encodeURIComponent(
          cnic
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search patient");

      setExistingResult(data as ExistingPatientSearchResult);

      if (!data.found) {
        toast.info("No patient found with this CNIC.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to search patient");
    } finally {
      setSearchingExisting(false);
    }
  };

  // Link existing searched patient to this assistant's hospital
  const handleLinkExisting = async () => {
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
        toast.info(
          "Patient is already registered under this hospital. Details were refreshed."
        );
      } else {
        toast.success("Patient registered for this hospital.");
      }

      setExistingCnic("");
      setExistingResult(null);
      fetchPatients();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to link existing patient");
    } finally {
      setCreating(false);
    }
  };

  // --- New patient registration ---
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    try {
      setCreating(true);

      const payload: any = {
        fullName: form.fullName.trim(),
        cnic: form.cnic.trim(),
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.gender) payload.gender = form.gender;
      if (form.dob) payload.dob = form.dob;
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.password) payload.password = form.password;

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
        toast.success(
          "CNIC already existed; patient has been linked to this hospital."
        );
      } else if (data.status === "already_exists") {
        toast.info("Patient already existed for this hospital.");
      } else {
        toast.success("Patient saved.");
      }

      setForm({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        gender: "male",
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

  const renderStatusBadge = (status?: string | null) => {
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

  const name = assistantInfo?.profile.full_name || "Assistant";
  const doctor = assistantInfo?.doctor;
  const hospital = assistantInfo?.hospital;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Assistant Dashboard
          </p>
          <h1 className="text-2xl font-semibold mt-1">{name}</h1>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-200">
            {assistantInfo?.profile.phone && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 bg-slate-800/60 px-2 py-1">
                <span className="font-medium">Phone:</span>{" "}
                {assistantInfo.profile.phone}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2 text-xs md:text-sm text-right">
          <div>
            <div className="text-slate-400 text-[11px] uppercase tracking-wide">
              Account Status
            </div>
            {renderStatusBadge(assistantInfo?.profile.approval_status)}
          </div>
        </div>
      </div>

      {/* Doctor & Hospital Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Assigned Doctor
          </h2>
          <div className="mt-2 text-xs">
            <div className="font-medium text-slate-900">
              {doctor?.full_name || "N/A"}
            </div>
            {doctor?.phone && (
              <div className="text-slate-500">{doctor.phone}</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Affiliated Hospital
          </h2>
          <div className="mt-2 text-xs">
            <div className="font-medium text-slate-900">
              {hospital?.name || "N/A"}
            </div>
            <div className="text-slate-500">{hospital?.address}</div>
          </div>
        </div>
      </div>

      {/* Patient Management Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Patient Management
            </h2>
            <p className="text-xs text-slate-500">
              Add new patients, or search & link existing patients using CNIC.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchPatients}>
            Refresh List
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* LEFT SIDE: Existing + New patient */}
          <div className="space-y-4">
            {/* Existing patient search */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-800">
                Existing Patient (Search by CNIC)
              </h3>
              <form
                onSubmit={handleSearchExisting}
                className="flex flex-col sm:flex-row gap-2 text-xs"
              >
                <input
                  type="text"
                  value={existingCnic}
                  onChange={(e) => setExistingCnic(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Enter CNIC e.g. XXXXX-XXXXXXX-X"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={searchingExisting}
                  className="whitespace-nowrap"
                >
                  {searchingExisting ? "Searching..." : "Search"}
                </Button>
              </form>

              {existingResult && (
                <div className="text-xs mt-2">
                  {existingResult.found && existingResult.patient ? (
                    <div className="space-y-2">
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="font-semibold text-slate-900">
                          {existingResult.patient.full_name}
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          CNIC:{" "}
                          <span className="font-mono">
                            {existingResult.patient.cnic}
                          </span>
                        </div>
                        {existingResult.patient.phone && (
                          <div className="text-slate-600 text-[11px]">
                            Phone: {existingResult.patient.phone}
                          </div>
                        )}
                        {existingResult.patient.dob && (
                          <div className="text-slate-600 text-[11px]">
                            DOB: {existingResult.patient.dob}
                          </div>
                        )}
                        {existingResult.hospitals &&
                          existingResult.hospitals.length > 0 && (
                            <div className="text-slate-500 text-[11px] mt-1">
                              Previously registered at:{" "}
                              {existingResult.hospitals
                                .map((h) => h.name)
                                .join(", ")}
                            </div>
                          )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={creating}
                        onClick={handleLinkExisting}
                      >
                        {creating ? "Linking..." : "Add to This Hospital"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px]">
                      No patient found with this CNIC.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* New patient registration */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-800">
                Register New Patient
              </h3>
              <form onSubmit={handleAddPatient} className="grid gap-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Full Name
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Patient Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    CNIC (ID)
                  </label>
                  <input
                    name="cnic"
                    value={form.cnic}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    placeholder="XXXXX-XXXXXXX-X"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Phone
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                      placeholder="+92..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      DOB
                    </label>
                    <input
                      name="dob"
                      type="date"
                      value={form.dob}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Email (optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                      placeholder="patient@mail.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Password (optional)
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                      placeholder="Login Password"
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Saving..." : "Register Patient"}
                </Button>
              </form>
            </div>
          </div>

          {/* RIGHT: Patient List */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-800">
                Hospital Patients
              </h3>
              <span className="text-[10px] text-slate-500">
                Total: {patients.length}
              </span>
            </div>
            {loadingPatients ? (
              <p className="text-xs text-slate-500">Loading...</p>
            ) : patients.length === 0 ? (
              <p className="text-xs text-slate-400">No patients found.</p>
            ) : (
              <div className="w-full overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full table-fixed text-xs">
                  <thead className="bg-slate-50/80">
                    <tr className="text-left text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-3 w-[30%]">Name</th>
                      <th className="py-2 px-3 w-[20%]">CNIC</th>
                      <th className="py-2 px-3 w-[20%]">Phone</th>
                      <th className="py-2 px-3 w-[30%]">DOB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-900 truncate">
                          {p.full_name}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate">
                          {p.cnic}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate">
                          {p.phone || "-"}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate">
                          {p.dob || "-"}
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
  );
}