// src/features/common/pages/AccessDeniedPage.tsx
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";

export function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Access Denied
        </h1>
        <p className="text-sm text-slate-500">
          You don&apos;t have permission to view this page.
        </p>
        <Button asChild className="w-full">
          <Link to="/login">Go to login</Link>
        </Button>
      </div>
    </div>
  );
}