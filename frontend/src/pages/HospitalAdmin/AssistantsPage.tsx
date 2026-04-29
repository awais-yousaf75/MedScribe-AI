import React, { useEffect, useMemo, useState } from "react";
import {
  UserCog,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Copy,
  X,
  Edit3,
  KeyRound,
  Link2,
  Unlink,
  ShieldOff,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type StatusFilter = "all" | "active" | "inactive";

type DoctorOption = { profile_id: string; full_name: string };

type Assistant = {
  profile_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender?: string | null;
  dob?: string | null;
  approval_status: "approved" | "rejected" | "pending" | string;
  doctor: { id: string; full_name: string } | null;
  created_at?: string | null;
};

const isActive = (s?: string | null) => s === "approved";

function ModalShell({
  title,
  gradient,
  children,
  onClose,
}: {
  title: string;
  gradient: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className={`px-6 py-4 bg-gradient-to-r ${gradient} text-white flex items-center justify-between`}>
          <p className="font-bold">{title}</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/15">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function CredentialsModal({
  open,
  onClose,
  email,
  password,
  generated,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
  password: string | null;
  generated: boolean;
}) {
  if (!open) return null;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-between">
          <p className="font-bold">Credentials</p>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/15">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-mono text-sm text-gray-900 break-all">{email}</p>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => copy(email)}>
                <Copy className="w-4 h-4 mr-1" /> Copy
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Password</p>

            {generated ? (
              <>
                <p className="text-xs text-gray-600 mt-1">Generated password shown only once.</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-mono text-sm text-gray-900 break-all">{password || "—"}</p>
                  {password && (
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => copy(password)}>
                      <Copy className="w-4 h-4 mr-1" /> Copy
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-700 mt-1">Password was set manually (not displayed).</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose} className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssistantsPage({ onRefreshGlobal }: { onRefreshGlobal: () => void }) {
  const token = localStorage.getItem("accessToken");

  const [loading, setLoading] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    doctor_profile_id: "",
    generate_password: true,
    password: "",
  });

  // edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<Assistant | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    gender: "",
    dob: "",
  });

  // link modal
  const [linkModal, setLinkModal] = useState<{ open: boolean; assistant: Assistant | null; doctorId: string }>({
    open: false,
    assistant: null,
    doctorId: "",
  });

  // reset password modal
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetTarget, setResetTarget] = useState<Assistant | null>(null);
  const [resetForm, setResetForm] = useState({
    generate_password: true,
    password: "",
  });

  // credentials modal
  const [credOpen, setCredOpen] = useState(false);
  const [cred, setCred] = useState<{ email: string; password: string | null; generated: boolean }>({
    email: "",
    password: null,
    generated: false,
  });

  const fetchAssistants = async () => {
    if (!token) return toast.error("Not authenticated");
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load assistants");
      setAssistants(data.assistants || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load assistants");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorOptions = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/hospital-admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load doctors");
      const opts: DoctorOption[] = (data.doctors || [])
        .filter((d: any) => d.approval_status === "approved") // only active doctors selectable
        .map((d: any) => ({ profile_id: d.profile_id, full_name: d.full_name }));
      setDoctorOptions(opts);
    } catch (e: any) {
      toast.error(e.message || "Failed to load doctor options");
    }
  };

  useEffect(() => {
    fetchAssistants();
    fetchDoctorOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlinkedCount = useMemo(() => {
    return assistants.filter((a) => isActive(a.approval_status) && !a.doctor).length;
  }, [assistants]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = assistants;

    if (statusFilter === "active") list = list.filter((a) => isActive(a.approval_status));
    if (statusFilter === "inactive") list = list.filter((a) => !isActive(a.approval_status));

    if (!s) return list;

    return list.filter((a) =>
      `${a.full_name} ${a.email || ""} ${a.phone || ""} ${a.doctor?.full_name || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [q, assistants, statusFilter]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const createAssistant = async () => {
    if (!token) return;
    const f = createForm;

    if (!f.full_name || !f.email) {
      toast.error("Please fill required fields");
      return;
    }
    if (!f.generate_password && f.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: f.full_name,
          email: f.email,
          phone: f.phone || null,
          gender: f.gender || null,
          dob: f.dob || null,
          doctor_profile_id: f.doctor_profile_id || null,
          generate_password: f.generate_password,
          password: f.generate_password ? undefined : f.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to create assistant");

      toast.success("Assistant created");
      setShowCreate(false);
      setCreateForm({
        full_name: "",
        email: "",
        phone: "",
        gender: "",
        dob: "",
        doctor_profile_id: "",
        generate_password: true,
        password: "",
      });

      setCred({
        email: data?.credentials?.email || f.email,
        password: data?.credentials?.password ?? null,
        generated: !!data?.credentials?.generated,
      });
      setCredOpen(true);

      await fetchAssistants();
      await fetchDoctorOptions();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to create assistant");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (a: Assistant) => {
    setEditTarget(a);
    setEditForm({
      full_name: a.full_name || "",
      phone: a.phone || "",
      gender: a.gender || "",
      dob: a.dob || "",
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!token || !editTarget) return;

    try {
      setEditing(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants/${editTarget.profile_id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editForm.full_name,
          phone: editForm.phone || null,
          gender: editForm.gender || null,
          dob: editForm.dob || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to update assistant");

      toast.success("Assistant updated");
      setShowEdit(false);
      setEditTarget(null);
      await fetchAssistants();
    } catch (e: any) {
      toast.error(e.message || "Failed to update assistant");
    } finally {
      setEditing(false);
    }
  };

  const updateLink = async (assistantId: string, doctorId: string | null) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants/${assistantId}/link-doctor`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_profile_id: doctorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to update link");

      toast.success("Link updated");
      await fetchAssistants();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to update link");
    }
  };

  const deactivate = async (a: Assistant) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants/${a.profile_id}/deactivate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to deactivate assistant");
      toast.success("Assistant deactivated");
      await fetchAssistants();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to deactivate assistant");
    }
  };

  const activate = async (a: Assistant) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants/${a.profile_id}/activate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to activate assistant");
      toast.success("Assistant activated");
      await fetchAssistants();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to activate assistant");
    }
  };

  const openReset = (a: Assistant) => {
    setResetTarget(a);
    setResetForm({ generate_password: true, password: "" });
    setShowReset(true);
  };

  const doReset = async () => {
    if (!token || !resetTarget) return;
    if (!resetForm.generate_password && resetForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setResetting(true);
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants/${resetTarget.profile_id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          generate_password: resetForm.generate_password,
          password: resetForm.generate_password ? undefined : resetForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to reset password");

      toast.success("Password reset");
      setShowReset(false);

      setCred({
        email: data?.credentials?.email || resetTarget.email || "",
        password: data?.credentials?.password ?? null,
        generated: !!data?.credentials?.generated,
      });
      setCredOpen(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const deleteAssistant = async (a: Assistant) => {
    if (!token) return;
    if (!window.confirm("Delete this assistant permanently? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/api/hospital-admin/assistants/${a.profile_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to delete assistant");

      toast.success("Assistant deleted");
      await fetchAssistants();
      onRefreshGlobal();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete assistant");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UserCog className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-extrabold text-white">Assistants</h1>
            </div>
            <p className="text-white/90">Create, link/unlink, deactivate and reset assistant credentials</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={async () => {
                await fetchAssistants();
                await fetchDoctorOptions();
              }}
              disabled={loading}
              className="rounded-2xl bg-white/15 hover:bg-white/20 text-white border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreate(true)}
              className="rounded-2xl bg-white text-purple-700 hover:bg-gray-50 border border-white/30 shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Assistant
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        {/* Unlinked warning */}
        <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900">Linking Alert</p>
                <p className="text-sm text-gray-600 mt-1">
                  Active assistants not linked to a doctor:{" "}
                  <span className="font-bold text-gray-900">{unlinkedCount}</span>
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Tip: Use <b>Link</b> to assign assistants to doctors.
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assistants..." className="pl-10 h-11" />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-11 rounded-2xl border border-gray-200 bg-white px-3 text-sm font-medium"
              >
                <option value="all">All</option>
                <option value="active">Active (Approved)</option>
                <option value="inactive">Inactive (Rejected)</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing: <span className="font-bold">{filtered.length}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="py-3 px-4 font-semibold">Assistant</th>
                  <th className="py-3 px-4 font-semibold">Linked Doctor</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-10 text-center text-gray-500">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-gray-500">No assistants found</td></tr>
                ) : (
                  filtered.map((a) => {
                    const active = isActive(a.approval_status);
                    const unlinked = active && !a.doctor;

                    return (
                      <tr
                        key={a.profile_id}
                        className={`border-b border-gray-100 transition-colors ${
                          unlinked ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-purple-50/40"
                        }`}
                      >
                        <td className="py-4 px-4">
                          <p className="font-semibold text-gray-900">{a.full_name}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span className="break-all">{a.email || "—"}</span>
                            {a.email && (
                              <button
                                onClick={() => copy(a.email!)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 bg-gray-100 border border-gray-200 hover:bg-gray-200"
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{a.phone || "—"}</p>
                        </td>

                        <td className="py-4 px-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {a.doctor?.full_name || "Not linked"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {a.doctor ? "Linked" : "Optional — can be set anytime"}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2 flex-wrap">
                            <Button variant="outline" className="rounded-xl" onClick={() => openEdit(a)}>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </Button>

                            <Button variant="outline" className="rounded-xl" onClick={() => openReset(a)}>
                              <KeyRound className="w-4 h-4 mr-2" />
                              Reset
                            </Button>

                            <Button
                              variant="outline"
                              className="rounded-xl"
                              onClick={() =>
                                setLinkModal({ open: true, assistant: a, doctorId: a.doctor?.id || "" })
                              }
                            >
                              <Link2 className="w-4 h-4 mr-2" />
                              Link
                            </Button>

                            <Button
                              variant="outline"
                              className="rounded-xl"
                              disabled={!a.doctor}
                              onClick={() => updateLink(a.profile_id, null)}
                            >
                              <Unlink className="w-4 h-4 mr-2" />
                              Unlink
                            </Button>

                            {active ? (
                              <Button
                                variant="outline"
                                className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                                onClick={() => deactivate(a)}
                              >
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => activate(a)}
                              >
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Activate
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              className="rounded-xl text-rose-600 hover:bg-rose-50"
                              onClick={() => deleteAssistant(a)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <ModalShell title="Add Assistant" gradient="from-purple-600 to-pink-600" onClose={() => setShowCreate(false)}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Full Name *</p>
                <Input value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Email *</p>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Phone</p>
                <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Gender</p>
                <Input value={createForm.gender} onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })} placeholder="male/female/other" />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">DOB</p>
                <Input type="date" value={createForm.dob} onChange={(e) => setCreateForm({ ...createForm, dob: e.target.value })} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Link Doctor (optional)</p>
                <select
                  value={createForm.doctor_profile_id}
                  onChange={(e) => setCreateForm({ ...createForm, doctor_profile_id: e.target.value })}
                  className="w-full h-11 rounded-2xl border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="">No link</option>
                  {doctorOptions.map((d) => (
                    <option key={d.profile_id} value={d.profile_id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Password</p>
                  <p className="text-xs text-gray-600">Generate or set manually.</p>
                </div>
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.generate_password}
                    onChange={(e) => setCreateForm({ ...createForm, generate_password: e.target.checked })}
                  />
                  Generate
                </label>
              </div>

              {!createForm.generate_password && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Manual Password (min 6 chars)</p>
                  <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setShowCreate(false)} disabled={creating}>
                Cancel
              </Button>
              <Button className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0" onClick={createAssistant} disabled={creating}>
                {creating ? "Creating..." : "Create Assistant"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit modal */}
      {showEdit && editTarget && (
        <ModalShell title="Edit Assistant" gradient="from-purple-600 to-pink-600" onClose={() => setShowEdit(false)}>
          <div className="space-y-5">
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase">Email (read-only)</p>
              <p className="mt-1 text-sm font-mono text-gray-900 break-all">{editTarget.email || "—"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Full Name</p>
                <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Phone</p>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Gender</p>
                <Input value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">DOB</p>
                <Input type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setShowEdit(false)} disabled={editing}>
                Cancel
              </Button>
              <Button className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0" onClick={saveEdit} disabled={editing}>
                {editing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Link modal */}
      {linkModal.open && linkModal.assistant && (
        <ModalShell title="Link Assistant to Doctor" gradient="from-purple-600 to-pink-600" onClose={() => setLinkModal({ open: false, assistant: null, doctorId: "" })}>
          <div className="space-y-5">
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase">Assistant</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{linkModal.assistant.full_name}</p>
              <p className="text-xs text-gray-600 break-all">{linkModal.assistant.email || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Select doctor (optional)</p>
              <select
                value={linkModal.doctorId}
                onChange={(e) => setLinkModal((p) => ({ ...p, doctorId: e.target.value }))}
                className="w-full h-11 rounded-2xl border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="">No link</option>
                {doctorOptions.map((d) => (
                  <option key={d.profile_id} value={d.profile_id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setLinkModal({ open: false, assistant: null, doctorId: "" })}>
                Cancel
              </Button>
              <Button
                className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                onClick={async () => {
                  await updateLink(linkModal.assistant!.profile_id, linkModal.doctorId || null);
                  setLinkModal({ open: false, assistant: null, doctorId: "" });
                }}
              >
                Save Link
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Reset password modal */}
      {showReset && resetTarget && (
        <ModalShell title="Reset Assistant Password" gradient="from-purple-600 to-pink-600" onClose={() => setShowReset(false)}>
          <div className="space-y-5">
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-semibold uppercase">Assistant</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{resetTarget.full_name}</p>
              <p className="text-xs text-gray-600 break-all">{resetTarget.email || "—"}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Password Mode</p>
                  <p className="text-xs text-gray-600">Generate or set manually.</p>
                </div>
                <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={resetForm.generate_password}
                    onChange={(e) => setResetForm({ ...resetForm, generate_password: e.target.checked })}
                  />
                  Generate
                </label>
              </div>

              {!resetForm.generate_password && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Manual Password (min 6 chars)</p>
                  <Input type="password" value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => setShowReset(false)} disabled={resetting}>
                Cancel
              </Button>
              <Button className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0" onClick={doReset} disabled={resetting}>
                {resetting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      <CredentialsModal open={credOpen} onClose={() => setCredOpen(false)} email={cred.email} password={cred.password} generated={cred.generated} />
    </div>
  );
}