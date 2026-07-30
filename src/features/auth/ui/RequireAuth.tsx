import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../application/AuthContext";

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="login-page">
        <p>Cargando sesión…</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
