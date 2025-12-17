// src/auth/guards/RequireApproval.tsx
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../useAuth";

interface RequireApprovalProps {
  children: ReactNode;
}

export function RequireApproval({ children }: RequireApprovalProps) {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (profile && profile.approval_status !== "approved") {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}