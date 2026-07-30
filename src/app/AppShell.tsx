import { Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/application/AuthContext";

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Leonel Platform</div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            {user?.name} · {user?.roleSlug}
          </span>
          <button className="btn btn-ghost" type="button" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
