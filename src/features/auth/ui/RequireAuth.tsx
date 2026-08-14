import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../application/AuthContext";

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Cargando sesión…</p>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Si es la primera vez del día, el servidor en Render puede tardar hasta un minuto
            en despertar. No cierres la página.
          </p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
