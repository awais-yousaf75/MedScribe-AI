import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type PendingHospitalAdmin = {
  id: string; // profile id
  full_name: string;
  phone?: string;
  gender?: string;
  dob?: string;
  approval_status: "pending" | "approved" | "rejected"; // ADMIN status
  hospital: {
    id: string;
    name: string;
    address: string | null;
    hospital_type: string | null;
    status: "pending" | "approved" | "rejected"; // HOSPITAL status
    admin_profile_id: string;
  } | null;
};

type PendingHospital = {
  id: string;
  name: string;
  address: string | null;
  hospital_type: string | null;
  status: "pending" | "approved" | "rejected";
  admin_profile_id: string;
  admin: {
    id: string;
    full_name: string;
    phone?: string;
    approval_status: "pending" | "approved" | "rejected";
    role: string;
  } | null;
};

type AppUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  approval_status: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
};

type SystemHospital = {
  id: string;
  name: string;
  address: string | null;
  hospital_type: string | null;
  status: "pending" | "approved" | "rejected";
  admin_profile_id: string;
  admin: {
    id: string;
    full_name: string;
    phone?: string;
    approval_status: "pending" | "approved" | "rejected";
    role: string;
  } | null;
};

interface SuperAdminDashboardProps {
  onLogout: () => void;
}

type SectionKey =
  | "pending-admins"
  | "pending-hospitals"
  | "users"
  | "all-hospitals";

export function SuperAdminDashboard({ onLogout }: SuperAdminDashboardProps) {
  const [activeSection, setActiveSection] =
    useState<SectionKey>("pending-admins");

  const [admins, setAdmins] = useState<PendingHospitalAdmin[]>([]);
  const [hospitals, setHospitals] = useState<PendingHospital[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [allHospitals, setAllHospitals] = useState<SystemHospital[]>([]);

  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAllHospitals, setLoadingAllHospitals] = useState(false);

  const getToken = () => localStorage.getItem("accessToken");

  // ---------- FETCHES ----------

  const fetchPendingAdmins = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingAdmins(true);
      const res = await fetch(
        `${API_URL}/api/superadmin/pending-hospital-admins`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load admins");
      setAdmins(data.admins as PendingHospitalAdmin[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load admins");
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchPendingHospitals = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingHospitals(true);
      const res = await fetch(`${API_URL}/api/superadmin/pending-hospitals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load hospitals");
      setHospitals(data.hospitals as PendingHospital[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load hospitals");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchAllUsers = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingUsers(true);
      const res = await fetch(`${API_URL}/api/superadmin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      const raw = data.users as AppUser[];
      setUsers(
        raw.filter(
          (u) => u.role !== "super_admin" && u.approval_status === "approved"
        )
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAllHospitals = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      setLoadingAllHospitals(true);
      const res = await fetch(`${API_URL}/api/superadmin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load hospitals");
      setAllHospitals(data.hospitals as SystemHospital[]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load hospitals");
    } finally {
      setLoadingAllHospitals(false);
    }
  };

  useEffect(() => {
    fetchPendingAdmins();
    fetchPendingHospitals();
    fetchAllUsers();
    fetchAllHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- ACTIONS: ADMINS ----------

  const handleApproveAdmin = async (profileId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospital-admins/${profileId}/approve`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve admin");
      toast.success("Hospital admin approved");
      setAdmins((prev) => prev.filter((a) => a.id !== profileId));
      fetchPendingHospitals();
      fetchAllUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve admin");
    }
  };

  const handleRejectAdmin = async (profileId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospital-admins/${profileId}/reject`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject admin");
      toast.info("Hospital admin rejected");
      setAdmins((prev) => prev.filter((a) => a.id !== profileId));
      setHospitals((prev) =>
        prev.filter((h) => h.admin_profile_id !== profileId)
      );
      fetchAllUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject admin");
    }
  };

  // ---------- ACTIONS: HOSPITALS ----------

  const handleApproveHospital = async (hospitalId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospitals/${hospitalId}/approve`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve hospital");
      toast.success("Hospital approved");
      setHospitals((prev) => prev.filter((h) => h.id !== hospitalId));
      fetchAllHospitals();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to approve hospital");
    }
  };

  const handleRejectHospital = async (hospitalId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/api/superadmin/hospitals/${hospitalId}/reject`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject hospital");
      toast.info("Hospital rejected");
      setHospitals((prev) => prev.filter((h) => h.id !== hospitalId));
      fetchAllHospitals();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to reject hospital");
    }
  };

  // ---------- ACTIONS: USERS ----------

  const handleDeleteUser = async (userId: string) => {
    const token = getToken();
    if (!token) return;
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this user and all related data?"
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/api/superadmin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setAdmins((prev) => prev.filter((a) => a.id !== userId));
      setHospitals((prev) => prev.filter((h) => h.admin_profile_id !== userId));
      setAllHospitals((prev) =>
        prev.filter((h) => h.admin_profile_id !== userId)
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleUpdateUserApproval = async (
    userId: string,
    status: "rejected"
  ) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/superadmin/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approval_status: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      toast.success(`User marked as ${status}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update user status");
    }
  };

  // ---------- UI helpers ----------

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
        className={`${base} bg-amber-50 text-amber-700 border-amber-100 border`}
      >
        Pending
      </span>
    );
  };

  const sectionConfig: {
    id: SectionKey;
    label: string;
    description: string;
    count: number;
  }[] = [
    {
      id: "pending-admins",
      label: "Pending Admins",
      description: "Approve or reject hospital admin accounts.",
      count: admins.length,
    },
    {
      id: "pending-hospitals",
      label: "Pending Hospitals",
      description: "Approve or reject hospital onboarding requests.",
      count: hospitals.length,
    },
    {
      id: "users",
      label: "All Users",
      description: "View and manage all approved users.",
      count: users.length,
    },
    {
      id: "all-hospitals",
      label: "All Hospitals",
      description: "Overview of every hospital in the system.",
      count: allHospitals.length,
    },
  ];

  const currentSection =
    sectionConfig.find((s) => s.id === activeSection) ?? sectionConfig[0];

  // ---------- RENDER ----------

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Super Admin Portal
          </h1>
          <p className="text-sm text-slate-500">
            Approve hospital admins & hospitals, and manage all users.
          </p>
        </div>
        {/* <Button
          variant="outline"
          className="border-red-500 text-red-600 hover:bg-red-50"
          onClick={onLogout}
        >
          Logout
        </Button> */}
      </header>

      {/* Section navigation */}
      <nav className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm max-w-3xl">
        <div className="flex flex-wrap gap-2">
          {sectionConfig.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={
                  "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs md:text-sm font-medium border transition " +
                  (isActive
                    ? "bg-blue-50 text-blue-700 border-blue-400 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100")
                }
              >
                <span>{sec.label}</span>
                <span
                  className={
                    "inline-flex items-center justify-center rounded-full px-1.5 text-[10px] " +
                    (isActive
                      ? " text-blue-600"
                      : "bg-slate-200 text-slate-700")
                  }
                >
                  {sec.count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main card */}
      <main className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        {/* Section header */}
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {currentSection.label}
          </h2>
          <p className="text-xs text-slate-500">{currentSection.description}</p>
        </div>

        {/* Section content */}
        {activeSection === "pending-admins" && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500">
                Total pending admins: {admins.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingAdmins}
                onClick={fetchPendingAdmins}
              >
                Refresh
              </Button>
            </div>

            {loadingAdmins ? (
              <p className="text-sm text-slate-500">Loading admins...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-slate-400">
                No pending hospital admins at the moment.
              </p>
            ) : (
              <div className="w-full overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                      <th className="py-2.5 px-4 w-[22%]">Name</th>
                      <th className="py-2.5 px-4 w-[26%]">Hospital</th>
                      <th className="py-2.5 px-4 w-[14%]">Type</th>
                      <th className="py-2.5 px-4 w-[14%]">Admin Status</th>
                      <th className="py-2.5 px-4 w-[14%]">Hospital Status</th>
                      <th className="py-2.5 px-4 w-[10%] text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {admins.map((admin) => {
                      const hospital = admin.hospital;
                      return (
                        <tr
                          key={admin.id}
                          className="hover:bg-slate-50/60 align-top"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900 truncate">
                              {admin.full_name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {admin.phone || "No phone"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800 truncate">
                              {hospital?.name || "Pending hospital"}
                            </div>
                            {hospital?.address && (
                              <div className="text-xs text-slate-500 truncate">
                                {hospital.address}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-slate-700">
                              {hospital?.hospital_type || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {renderStatusBadge(admin.approval_status)}
                          </td>
                          <td className="py-3 px-4">
                            {renderStatusBadge(hospital?.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveAdmin(admin.id)}
                                className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectAdmin(admin.id)}
                                className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-100 hover:bg-red-100"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeSection === "pending-hospitals" && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500">
                Total pending hospitals: {hospitals.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingHospitals}
                onClick={fetchPendingHospitals}
              >
                Refresh
              </Button>
            </div>

            {loadingHospitals ? (
              <p className="text-sm text-slate-500">Loading hospitals...</p>
            ) : hospitals.length === 0 ? (
              <p className="text-sm text-slate-400">
                No pending hospitals (status = &quot;pending&quot;).
              </p>
            ) : (
              <div className="w-full overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                      <th className="py-2.5 px-4 w-[26%]">Hospital</th>
                      <th className="py-2.5 px-4 w-[16%]">Type</th>
                      <th className="py-2.5 px-4 w-[24%]">Address</th>
                      <th className="py-2.5 px-4 w-[20%]">Admin</th>
                      <th className="py-2.5 px-4 w-[10%]">Status</th>
                      <th className="py-2.5 px-4 w-[14%] text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {hospitals.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 align-top">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 truncate">
                            {h.name}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-700">
                            {h.hospital_type || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-700 truncate block">
                            {h.address || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 truncate">
                            {h.admin?.full_name || "Unknown admin"}
                          </div>
                          {h.admin?.phone && (
                            <div className="text-xs text-slate-500 truncate">
                              {h.admin.phone}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400">
                            Admin status:{" "}
                            <span className="capitalize">
                              {h.admin?.approval_status || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {renderStatusBadge(h.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveHospital(h.id)}
                              className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectHospital(h.id)}
                              className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-100 hover:bg-red-100"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeSection === "users" && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500">
                Approved users (excluding super admin): {users.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingUsers}
                onClick={fetchAllUsers}
              >
                Refresh
              </Button>
            </div>

            {loadingUsers ? (
              <p className="text-sm text-slate-500">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-slate-400">No approved users.</p>
            ) : (
              <div className="w-full overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                      <th className="py-2.5 px-4 w-[24%]">Name</th>
                      <th className="py-2.5 px-4 w-[24%]">Email</th>
                      <th className="py-2.5 px-4 w-[12%]">Role</th>
                      <th className="py-2.5 px-4 w-[12%]">Approval</th>
                      <th className="py-2.5 px-4 w-[18%]">Last Sign In</th>
                      <th className="py-2.5 px-4 w-[10%] text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 align-top">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 truncate">
                            {u.full_name || "(no name)"}
                          </div>
                          {u.phone && (
                            <div className="text-xs text-slate-500 truncate">
                              {u.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-700 truncate block">
                            {u.email || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 capitalize">
                          <span className="text-xs text-slate-700">
                            {u.role || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {renderStatusBadge(u.approval_status)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500 truncate block">
                            {u.last_sign_in_at || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            {/* No Mark Approved here; users are already approved */}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateUserApproval(u.id, "rejected")
                              }
                              className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100 hover:bg-amber-100"
                            >
                              Mark Rejected
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-100 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeSection === "all-hospitals" && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-500">
                Total hospitals: {allHospitals.length}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loadingAllHospitals}
                onClick={fetchAllHospitals}
              >
                Refresh
              </Button>
            </div>

            {loadingAllHospitals ? (
              <p className="text-sm text-slate-500">Loading hospitals...</p>
            ) : allHospitals.length === 0 ? (
              <p className="text-sm text-slate-400">No hospitals yet.</p>
            ) : (
              <div className="w-full overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-slate-50/80">
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                      <th className="py-2.5 px-4 w-[26%]">Hospital</th>
                      <th className="py-2.5 px-4 w-[16%]">Type</th>
                      <th className="py-2.5 px-4 w-[24%]">Address</th>
                      <th className="py-2.5 px-4 w-[20%]">Admin</th>
                      <th className="py-2.5 px-4 w-[14%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {allHospitals.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 align-top">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 truncate">
                            {h.name}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-700">
                            {h.hospital_type || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-700 truncate block">
                            {h.address || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 truncate">
                            {h.admin?.full_name || "Unknown admin"}
                          </div>
                          {h.admin?.phone && (
                            <div className="text-xs text-slate-500 truncate">
                              {h.admin.phone}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400">
                            Admin status:{" "}
                            <span className="capitalize">
                              {h.admin?.approval_status || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {renderStatusBadge(h.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
