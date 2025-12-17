// src/features/common/pages/AwaitingApprovalPage.tsx
import { Button } from "../../../components/ui/button";
import { useAuth } from "../../../auth/useAuth";
import { useNavigate } from "react-router-dom";

export function AwaitingApprovalPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Account Under Review
        </h1>
        <p className="text-sm text-slate-500">
          Your account is currently pending approval. You&apos;ll receive access
          to the portal once an administrator has approved your account.
        </p>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}