import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/application/AuthContext";
import { useCan } from "../shared/api/use-api";
import { getApiUrl } from "../shared/api/http";

export function HomePage() {
  const { user } = useAuth();
  const canClients = useCan("clients.read");
  const canCatalogs = useCan("catalogs.read");
  const canOrders = useCan("orders.read");

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Inicio</h1>
          <p className="muted">
            Bienvenido, {user?.name}. Flujo del taller: cliente → pedido → recepción →
            movimientos → saldo.
          </p>
        </div>
      </header>

      <div className="panel">
        <h2>Ejemplo listo para revisar</h2>
        <p className="muted">
          Pedido <strong>PED-1024</strong> de <strong>Lider Jeans</strong> (Denim /
          Mezclilla): recepción 980, compostura, merma y salida parcial a CD Norte.
          Disponible 570, estado: salida parcial.
        </p>
        {canOrders ? (
          <p>
            <Link className="link" to="/orders">
              Ir a Pedidos →
            </Link>
          </p>
        ) : null}
      </div>

      <div className="home-grid">
        {canClients ? (
          <Link className="home-card" to="/clients">
            <strong>Clientes</strong>
            <span>Alta y consulta de clientes del taller</span>
          </Link>
        ) : null}
        {canCatalogs ? (
          <Link className="home-card" to="/catalogs">
            <strong>Catálogos</strong>
            <span>Marcas, tipos y destinos</span>
          </Link>
        ) : null}
        {canOrders ? (
          <Link className="home-card" to="/orders">
            <strong>Pedidos</strong>
            <span>Crear pedidos, recepciones y salidas</span>
          </Link>
        ) : null}
      </div>

      <p className="muted meta-line">API: {getApiUrl()}</p>
    </section>
  );
}
