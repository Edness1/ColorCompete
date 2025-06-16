import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminRoute() {
  const { user } = useAuth();

  // If user is not loaded yet, show loader
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in and isAdmin, allow access
  if (user && user.isAdmin) {
    return <Outlet />;
  }

  // If not admin or not logged in, redirect to home
  //return <Navigate to="/" replace />;
}
