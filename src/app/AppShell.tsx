import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/application/AuthContext";
import { useCan } from "../shared/api/use-api";
import { roleLabel } from "../shared/i18n/labels";

const links = [
  { to: "/", label: "Inicio", end: true },
  { to: "/clients", label: "Clientes" },
  { to: "/catalogs", label: "Catálogos" },
  { to: "/production-formats", label: "Formatos de producción" },
  { to: "/weekly-settlement", label: "Cuadre semanal" },
] as const;

export function AppShell() {
  const { user, logout } = useAuth();
  const canClients = useCan("clients.read");
  const canCatalogs = useCan("catalogs.read");
  const canOrders = useCan("orders.read");
  const canWeeklySettlement = useCan("clients.read", "orders.read");

  const allowed: Record<string, boolean> = {
    "/": true,
    "/clients": canClients,
    "/catalogs": canCatalogs,
    "/production-formats": canOrders,
    "/weekly-settlement": canWeeklySettlement,
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">Leonel Platform</div>
          <nav className="nav">
            {links
              .filter((link) => allowed[link.to])
              .map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={"end" in link ? link.end : false}
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  {link.label}
                </NavLink>
              ))}
          </nav>
        </div>
        <div className="topbar-right">
          <span className="user-chip">
            {user?.name} · {user ? roleLabel(user.roleSlug) : ""}
          </span>
          <button className="btn btn-ghost btn-small" type="button" onClick={() => void logout()}>
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
