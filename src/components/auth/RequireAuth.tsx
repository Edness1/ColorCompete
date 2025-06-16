import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}