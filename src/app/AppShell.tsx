import { useEffect, useId, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const visibleLinks = links.filter((link) => allowed[link.to]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className={`shell${menuOpen ? " shell-menu-open" : ""}`}>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" end className="brand-link" aria-label="Leonel Platform">
            <img
              className="brand-logo brand-logo-full"
              src={`${import.meta.env.BASE_URL}logo-leonel-platform.png`}
              alt="Leonel Platform"
            />
            <img
              className="brand-logo brand-logo-mark"
              src={`${import.meta.env.BASE_URL}logo-mark.png`}
              alt="Leonel Platform"
            />
          </NavLink>

          <nav className="nav-desktop" aria-label="Principal">
            {visibleLinks.map((link) => (
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

          <div className="topbar-right-desktop">
            <span
              className="user-chip"
              title={user ? `${user.name} · ${roleLabel(user.roleSlug)}` : undefined}
            >
              <span className="user-name">{user?.name}</span>
              {user ? <span className="user-role"> · {roleLabel(user.roleSlug)}</span> : null}
            </span>
            <button className="btn btn-ghost btn-small" type="button" onClick={() => void logout()}>
              Salir
            </button>
          </div>

          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-toggle-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="mobile-nav-layer" role="presentation">
          <button
            type="button"
            className="menu-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="mobile-menu" id={menuId} role="dialog" aria-modal="true" aria-label="Menú">
            <div className="mobile-menu-head">
              <div className="mobile-menu-user">
                <strong>{user?.name}</strong>
                <span>{user ? roleLabel(user.roleSlug) : ""}</span>
              </div>
              <button
                type="button"
                className="menu-close"
                aria-label="Cerrar menú"
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav className="mobile-menu-nav" aria-label="Menú móvil">
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={"end" in link ? link.end : false}
                  className={({ isActive }) =>
                    isActive ? "mobile-menu-link active" : "mobile-menu-link"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <button
              className="btn btn-ghost mobile-menu-logout"
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
            >
              Salir
            </button>
          </aside>
        </div>
      ) : null}

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
