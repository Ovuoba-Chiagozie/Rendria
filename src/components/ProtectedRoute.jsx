import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Prevent flicker while checking auth
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    // Redirect to login with ?next=<path>
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} />;
  }

  return children;
}

export default ProtectedRoute;
