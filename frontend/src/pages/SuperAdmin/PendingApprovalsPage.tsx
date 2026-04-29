// pages/PendingApprovalsPage.tsx
import { useState, useEffect } from "react";
import {
  Clock,
  Building2,
  Users,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

interface PendingApprovalsPageProps {
  onNavigate: (page: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type PendingItem = {
  id: string;
  type: "admin" | "hospital";
  name: string;
  email?: string;
  phone?: string;
  details: string;
  created_at?: string;
  status: "pending" | "approved" | "rejected";
  relatedData?: any;
};

export function PendingApprovalsPage({
  onNavigate,
}: PendingApprovalsPageProps) {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("accessToken");

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const [adminsRes, hospitalsRes] = await Promise.all([
        fetch(`${API_URL}/api/superadmin/pending-hospital-admins`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/superadmin/pending-hospitals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const adminsData = await adminsRes.json();
      const hospitalsData = await hospitalsRes.json();

      const items: PendingItem[] = [];

      // Add pending admins
      if (adminsData.admins) {
        adminsData.admins.forEach((admin: any) => {
          items.push({
            id: admin.id,
            type: "admin",
            name: admin.full_name,
            email: admin.email,
            phone: admin.phone,
            details: `Hospital: ${admin.hospital?.name || "Pending"}`,
            created_at: admin.created_at,
            status: admin.approval_status,
            relatedData: admin,
          });
        });
      }

      // Add pending hospitals
      if (hospitalsData.hospitals) {
        hospitalsData.hospitals.forEach((hosp: any) => {
          items.push({
            id: hosp.id,
            type: "hospital",
            name: hosp.name,
            email: hosp.contact_email,
            phone: hosp.contact_phone,
            details: `Type: ${hosp.hospital_type || "N/A"} | Admin: ${hosp.admin?.full_name || "N/A"}`,
            created_at: hosp.created_at,
            status: hosp.status,
            relatedData: hosp,
          });
        });
      }

      setPendingItems(items.filter((item) => item.status === "pending"));
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, type: "admin" | "hospital") => {
    const token = getToken();
    if (!token) return;

    setApprovingId(id);
    try {
      const endpoint =
        type === "admin"
          ? `${API_URL}/api/superadmin/hospital-admins/${id}/approve`
          : `${API_URL}/api/superadmin/hospitals/${id}/approve`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      toast.success(
        `${type === "admin" ? "Admin" : "Hospital"} approved successfully`,
      );
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string, type: "admin" | "hospital") => {
    const token = getToken();
    if (!token) return;

    setRejectingId(id);
    try {
      const endpoint =
        type === "admin"
          ? `${API_URL}/api/superadmin/hospital-admins/${id}/reject`
          : `${API_URL}/api/superadmin/hospitals/${id}/reject`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`${type === "admin" ? "Admin" : "Hospital"} rejected`);
      setPendingItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    } finally {
      setRejectingId(null);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-red-600 p-8 shadow-lg">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Clock className="w-8 h-8 text-white" />
            <h1 className="text-3xl text-white font-bold">Pending Approvals</h1>
          </div>
          <p className="text-white/90 text-lg">
            Review and manage all pending approval requests
          </p>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm">
              Total Pending:{" "}
              <span className="font-bold text-lg text-orange-600">
                {pendingItems.length}
              </span>
            </p>
          </div>
          <Button
            onClick={fetchPendingItems}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-lg text-white border-0"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Pending Items */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <p className="text-gray-500">Loading pending approvals...</p>
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">
              All caught up! No pending approvals.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-100 hover:border-orange-200 transition-all hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                      item.type === "admin"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-green-500 to-green-600"
                    }`}
                  >
                    {item.type === "admin" ? (
                      <Users className="w-6 h-6 text-white" />
                    ) : (
                      <Building2 className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.name}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-300">
                        {item.type.replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{item.details}</p>

                    {item.email && (
                      <p className="text-sm text-gray-500 mb-1">
                        📧 {item.email}
                      </p>
                    )}
                    {item.phone && (
                      <p className="text-sm text-gray-500 mb-3">
                        📞 {item.phone}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleApprove(item.id, item.type)}
                        disabled={
                          approvingId === item.id || rejectingId === item.id
                        }
                        className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg text-white border-0 disabled:opacity-50"
                      >
                        {approvingId === item.id ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(item.id, item.type)}
                        disabled={
                          approvingId === item.id || rejectingId === item.id
                        }
                        className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg text-white border-0 disabled:opacity-50"
                      >
                        {rejectingId === item.id ? (
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PendingApprovalsPage;
