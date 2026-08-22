import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type UserRole } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Roles allowed to access this route. If empty, any authenticated user can access. */
  allowedRoles?: UserRole[];
  /** Where to redirect unauthenticated users. Defaults to /auth/login */
  redirectTo?: string;
}

/**
 * Role-aware route guard component.
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={["admin"]}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  redirectTo = "/auth/login",
}) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    // Redirect to the appropriate dashboard based on actual role
    const fallback =
      role === "admin"
        ? "/admin/dashboard"
        : "/employee/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
