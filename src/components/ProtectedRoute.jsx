import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user, activeRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
        <img
          src="/queless.png"
          alt="QueueLess"
          className="h-12 w-auto animate-pulse"
        />
        <p className="text-xs font-medium text-slate-400">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const effectiveRole = activeRole || user.role || "customer";
  const primaryRole = user.role || "customer";

  const isCustomerRoute = roles.includes("customer");
  const isOrgRoute =
    roles.includes("organization") || roles.includes("org_manager");
  const hasOrgMembership =
    (user.organizations?.length || 0) > 0 ||
    (user.memberships?.length || 0) > 0;

  const hasAccess =
    roles.length === 0 ||
    primaryRole === "admin" ||
    isCustomerRoute ||
    roles.includes(effectiveRole) ||
    roles.includes(primaryRole) ||
    (isOrgRoute && hasOrgMembership);

  if (!hasAccess) {
    const fallback =
      primaryRole === "admin"
        ? "/admin"
        : primaryRole === "worker"
          ? "/worker"
          : primaryRole === "organization" || primaryRole === "org_manager"
            ? "/organization"
            : "/customer";

    return <Navigate to={fallback} replace />;
  }

  return children;
}
