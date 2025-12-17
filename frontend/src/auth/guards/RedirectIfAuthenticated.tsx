// src/auth/guards/RedirectIfAuthenticated.tsx
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../useAuth";
import type { UserRole } from "../AuthContext";

function getDefaultPathForRole(role: UserRole | null) {
  switch (role) {
    case "super_admin":
      return "/super-admin/dashboard";
    case "hospital_admin":
      return "/hospital-admin/dashboard";
    case "doctor":
      return "/doctor/dashboard";
    case "doctor_assistant":
      return "/assistant/dashboard";
    case "patient":
      return "/app/dashboard"; // adjust if you add a patient area
    default:
      return "/app/dashboard";
  }
}

interface Props {
  children: ReactNode;
}

export function RedirectIfAuthenticated({ children }: Props) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const target = getDefaultPathForRole(role);
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}