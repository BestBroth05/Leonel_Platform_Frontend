import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/application/AuthContext";
import { useCan } from "../shared/api/use-api";
import { roleLabel } from "../shared/i18n/labels";

const links = [
  { to: "/", label: "Inicio", end: true },
  { to: "/clients", label: "Clientes" },
  { to: "/catalogs", label: "Catálogos" },
  { to: "/production-formats", label: "Formatos" },
  { to: "/weekly-settlement", label: "Cuadre" },
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
        <div className="topbar-inner">
          <div className="topbar-left">
            <NavLink to="/" end className="brand-link" aria-label="Leonel Platform">
              <img
                className="brand-logo"
                src={`${import.meta.env.BASE_URL}logo-leonel-platform.png`}
                alt="Leonel Platform"
              />
            </NavLink>
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
            <span className="user-chip" title={user ? `${user.name} · ${roleLabel(user.roleSlug)}` : undefined}>
              {user?.name}
              {user ? <span className="user-role"> · {roleLabel(user.roleSlug)}</span> : null}
            </span>
            <button className="btn btn-ghost btn-small" type="button" onClick={() => void logout()}>
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
