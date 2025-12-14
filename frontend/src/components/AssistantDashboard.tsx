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

export function AssistantDashboard() {
  const [assistantInfo, setAssistantInfo] =
    useState<AssistantMeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const fetchAssistantInfo = async () => {
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/assistant/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load assistant info");
      }
      setAssistantInfo(data as AssistantMeResponse);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load assistant info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistantInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name =
    assistantInfo?.profile.full_name ||
    assistantInfo?.user.user_metadata?.full_name ||
    assistantInfo?.user.email ||
    "Assistant";

  const doctor = assistantInfo?.doctor;
  const hospital = assistantInfo?.hospital;

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

  return (
    <div className="space-y-6">
      {/* Assistant header */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 text-slate-50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Assistant Dashboard
          </p>
          <h1 className="text-2xl font-semibold mt-1">{name}</h1>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-200">
            {assistantInfo?.profile.phone && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 bg-slate-800/60 px-2 py-1">
                <span className="font-medium">Phone:</span>
                <span>{assistantInfo.profile.phone}</span>
              </span>
            )}
            {assistantInfo?.profile.dob && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 bg-slate-800/60 px-2 py-1">
                <span className="font-medium">DOB:</span>
                <span>{assistantInfo.profile.dob}</span>
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
          <div>
            <div className="text-slate-400 text-[11px] uppercase tracking-wide">
              Link Status
            </div>
            {renderStatusBadge(assistantInfo?.assistant_link?.approval_status)}
          </div>
        </div>
      </div>

      {/* Doctor & hospital info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Assigned Doctor
              </h2>
              <p className="text-xs text-slate-500">
                The doctor you are assisting.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={fetchAssistantInfo}
            >
              Refresh
            </Button>
          </div>
          {loading ? (
            <p className="text-xs text-slate-500 mt-2">Loading doctor...</p>
          ) : doctor ? (
            <div className="mt-3 text-xs space-y-1">
              <div className="font-medium text-slate-900">
                {doctor.full_name}
              </div>
              {doctor.phone && (
                <div className="text-slate-600 text-[11px]">
                  Phone: {doctor.phone}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">
              No doctor linked to your account yet.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Affiliated Hospital
            </h2>
            <p className="text-xs text-slate-500">
              Hospital where you and your doctor operate.
            </p>
          </div>
          {hospital ? (
            <div className="mt-3 grid gap-2 text-xs">
              <div>
                <div className="text-[11px] text-slate-400 uppercase">Name</div>
                <div className="font-medium text-slate-900">
                  {hospital.name}
                </div>
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
              <div>
                <div className="text-[11px] text-slate-400 uppercase">
                  Hospital Status
                </div>
                {renderStatusBadge(hospital.status)}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">
              No hospital linked to your account yet.
            </p>
          )}
        </div>
      </div>

      {/* Patients section - to be wired next */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Patients Management
          </h2>
          <p className="text-xs text-slate-500">
            This is where you&apos;ll add and manage patients for your doctor
            using CNIC. (Coming in the next step.)
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-xs text-slate-500">
          Patient creation and listing will be implemented in the next step. For
          now, your account is correctly linked to your doctor and hospital.
        </div>
      </div>
    </div>
  );
}
