import { Navigate, useLocation } from "react-router-dom"
import { useUser } from "../../../context/UserContext"
import { useAdmin } from "../../../context/AdminContext"
import { toast } from "react-hot-toast"

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, isLoading } = useUser()
  const { isAuthenticated: isAdminAuthenticated, isLoading: isAdminLoading } = useAdmin()
  const location = useLocation()

  // Debug logging
  console.log('ProtectedRoute Debug:', {
    isAuthenticated,
    userRole: user?.role,
    adminOnly,
    path: location.pathname,
    isAdminAuthenticated,
  });

  // Show loading state while checking authentication
  if (isLoading || (adminOnly && isAdminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />
  }

  // For admin routes, check both user role and admin authentication
  if (adminOnly) {
    if (user.role !== "ADMIN" || !isAdminAuthenticated) {
      console.log("Access denied. User role:", user.role, "Admin authenticated:", isAdminAuthenticated);
      toast.error("Access denied. Admin privileges required.");
      return <Navigate to="/" replace />
    }
  }

  // Otherwise, render the protected content
  return children
}

