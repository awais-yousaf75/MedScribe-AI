import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../useAuth";
import type { UserRole } from "../AuthContext";

interface RequireRoleProps {
  allowed: UserRole[];
  children: ReactNode;
}

export function RequireRole({ allowed, children }: RequireRoleProps) {
  const { role, isLoading, isAuthenticated } = useAuth();

  // While loading or not yet authenticated, just wait
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!role || !allowed.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}