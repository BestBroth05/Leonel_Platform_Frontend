import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/application/AuthContext";
import { listClients } from "../features/clients/infrastructure/clients-api";
import {
  getOpenClientWeek,
  previewCloseClientWeek,
} from "../features/client-weeks/infrastructure/client-weeks-api";
import { listOrders } from "../features/orders/infrastructure/orders-api";
import { listProductionFormats } from "../features/production-formats/infrastructure/production-formats-api";
import { ApiClientError } from "../shared/api/http";
import { useApi, useCan } from "../shared/api/use-api";
import {
  clientWeekStatusLabel,
  formatMxn,
  orderStatusLabel,
  weekdayLabel,
} from "../shared/i18n/labels";
import type {
  Client,
  ClientWeek,
  Order,
  ProductionFormat,
  WeekClosePreview,
} from "../shared/types/domain";

type WeekSummary = {
  client: Client;
  week: ClientWeek;
  preview: WeekClosePreview | null;
  previewError: string | null;
};

export function HomePage() {
  const { user } = useAuth();
  const api = useApi();
  const canClients = useCan("clients.read");
  const canCatalogs = useCan("catalogs.read");
  const canOrders = useCan("orders.read");
  const canWeeklySettlement = useCan("clients.read", "orders.read");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [formats, setFormats] = useState<ProductionFormat[]>([]);
  const [formatsTotal, setFormatsTotal] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [weekSummaries, setWeekSummaries] = useState<WeekSummary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsRes, formatsRes, ordersRes] = await Promise.all([
        canClients
          ? listClients(api, { pageSize: 100, activeOnly: true })
          : Promise.resolve({ items: [] as Client[], total: 0, page: 1, pageSize: 100 }),
        canOrders
          ? listProductionFormats(api, { page: 1 })
          : Promise.resolve({
              items: [] as ProductionFormat[],
              total: 0,
              page: 1,
              pageSize: 20,
            }),
        canOrders
          ? listOrders(api, { page: 1 })
          : Promise.resolve({ items: [] as Order[], total: 0, page: 1, pageSize: 20 }),
      ]);

      setClients(clientsRes.items);
      setFormats(formatsRes.items);
      setFormatsTotal(formatsRes.total);
      setOrders(ordersRes.items.slice(0, 8));
      setOrdersTotal(ordersRes.total);

      if (canWeeklySettlement && clientsRes.items.length > 0) {
        const summaries: WeekSummary[] = [];
        for (const client of clientsRes.items) {
          try {
            const week = await getOpenClientWeek(api, client.id);
            if (!week) continue;
            try {
              const preview = await previewCloseClientWeek(api, week.id);
              summaries.push({ client, week, preview, previewError: null });
            } catch (err) {
              summaries.push({
                client,
                week,
                preview: null,
                previewError:
                  err instanceof ApiClientError
                    ? err.message
                    : "No se pudo cargar el avance del cuadre",
              });
            }
          } catch {
            // ignore clients that fail to load open week
          }
        }
        setWeekSummaries(summaries);
      } else {
        setWeekSummaries([]);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo cargar el resumen");
    } finally {
      setLoading(false);
    }
  }, [api, canClients, canOrders, canWeeklySettlement]);

  useEffect(() => {
    void load();
  }, [load]);

  const openWeeksCount = weekSummaries.length;
  const readyToClose = weekSummaries.filter((w) => w.preview?.canClose).length;
  const blockedWeeks = weekSummaries.filter(
    (w) => w.preview && !w.preview.canClose,
  ).length;
  const activeOrders = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
  ).length;
  const totalCuts = formats.reduce((sum, f) => sum + f.cutsCount, 0);
  const totalFormatOrders = formats.reduce((sum, f) => sum + f.ordersCount, 0);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Inicio</h1>
          <p className="muted">
            Hola, {user?.name}. Resumen operativo del taller: formatos, pedidos y
            cuadre semanal.
          </p>
        </div>
        <button className="btn btn-ghost btn-inline" type="button" onClick={() => void load()}>
          Actualizar
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Cargando resumen…</p> : null}

      {!loading ? (
        <>
          <div className="stats">
            <div className="stat">
              <span>Clientes activos</span>
              <strong>{clients.length.toLocaleString("es-MX")}</strong>
            </div>
            <div className="stat">
              <span>Formatos</span>
              <strong>{formatsTotal.toLocaleString("es-MX")}</strong>
            </div>
            <div className="stat">
              <span>Cortes / pedidos en formatos</span>
              <strong>
                {totalCuts.toLocaleString("es-MX")} /{" "}
                {totalFormatOrders.toLocaleString("es-MX")}
              </strong>
            </div>
            <div className="stat">
              <span>Pedidos totales</span>
              <strong>{ordersTotal.toLocaleString("es-MX")}</strong>
            </div>
            <div className="stat">
              <span>Semanas OPEN</span>
              <strong>{openWeeksCount.toLocaleString("es-MX")}</strong>
            </div>
            <div className="stat">
              <span>Listas para cerrar</span>
              <strong>{readyToClose.toLocaleString("es-MX")}</strong>
            </div>
          </div>

          {canOrders ? (
            <div className="panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Formatos de producción</h2>
                  <p className="muted">
                    Formatos registrados con su cliente, cortes y pedidos.
                  </p>
                </div>
                <Link className="link" to="/production-formats">
                  Ver todos →
                </Link>
              </div>
              {formats.length === 0 ? (
                <p className="muted">Aún no hay formatos. Crea el primero desde Formatos.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Formato</th>
                        <th>Cliente</th>
                        <th>Cortes</th>
                        <th>Pedidos</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formats.map((format) => (
                        <tr key={format.id}>
                          <td>
                            <strong>{format.number}</strong>
                          </td>
                          <td>{format.clientName ?? "Sin cliente"}</td>
                          <td>{format.cutsCount.toLocaleString("es-MX")}</td>
                          <td>{format.ordersCount.toLocaleString("es-MX")}</td>
                          <td>
                            <Link className="link" to={`/production-formats/${format.id}`}>
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {canWeeklySettlement ? (
            <div className="panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Cuadre semanal</h2>
                  <p className="muted">
                    Semanas abiertas por cliente y avance de cortes cuadrados.
                    {blockedWeeks > 0
                      ? ` ${blockedWeeks} semana(s) con cortes pendientes.`
                      : ""}
                  </p>
                </div>
                <Link className="link" to="/weekly-settlement">
                  Ir al cuadre →
                </Link>
              </div>

              {weekSummaries.length === 0 ? (
                <p className="muted">
                  Ningún cliente tiene semana OPEN. Ábrela desde Cuadre semanal.
                </p>
              ) : (
                <div className="home-week-list">
                  {weekSummaries.map(({ client, week, preview, previewError }) => {
                    const squared = preview?.cuts.filter((c) => c.squared).length ?? 0;
                    const totalCutsInWeek = preview?.cuts.length ?? 0;
                    const unsquared = preview?.unsquaredCuts.length ?? 0;
                    return (
                      <article key={week.id} className="home-week-card">
                        <div className="home-week-card-head">
                          <div>
                            <strong>{client.name}</strong>
                            <p className="muted">
                              Semana desde {week.startDate}
                              {client.weekOpensOn || client.weekClosesOn
                                ? ` · Agenda: abre ${weekdayLabel(client.weekOpensOn)} / cierra ${weekdayLabel(client.weekClosesOn)}`
                                : ""}
                            </p>
                          </div>
                          <span
                            className={
                              preview?.canClose
                                ? "badge ok"
                                : preview
                                  ? "badge off"
                                  : "badge"
                            }
                          >
                            {preview?.canClose
                              ? "Lista para cerrar"
                              : clientWeekStatusLabel(week.status)}
                          </span>
                        </div>

                        {previewError ? (
                          <p className="error">{previewError}</p>
                        ) : preview ? (
                          <div className="home-week-metrics">
                            <div>
                              <span>Cortes</span>
                              <strong>
                                {squared}/{totalCutsInWeek} cuadrados
                              </strong>
                            </div>
                            <div>
                              <span>Pendientes</span>
                              <strong>{unsquared.toLocaleString("es-MX")}</strong>
                            </div>
                            <div>
                              <span>Cobrable (entregas)</span>
                              <strong>
                                {preview.weeklyBillableQuantity.toLocaleString("es-MX")}{" "}
                                · {formatMxn(preview.weeklyBillableAmount)}
                              </strong>
                            </div>
                          </div>
                        ) : null}

                        {preview && preview.unsquaredCuts.length > 0 ? (
                          <ul className="home-unsquared-list">
                            {preview.unsquaredCuts.slice(0, 4).map((cut) => (
                              <li key={cut.cutId}>
                                <strong>{cut.cutNumber}</strong>: pendiente{" "}
                                {cut.pendingByCut.toLocaleString("es-MX")}, compostura{" "}
                                {cut.inRepairByCut.toLocaleString("es-MX")}, sin asignar{" "}
                                {cut.unassignedByCut.toLocaleString("es-MX")}
                                {cut.reasons[0] ? ` — ${cut.reasons[0]}` : ""}
                              </li>
                            ))}
                            {preview.unsquaredCuts.length > 4 ? (
                              <li className="muted">
                                +{preview.unsquaredCuts.length - 4} corte(s) más
                              </li>
                            ) : null}
                          </ul>
                        ) : null}

                        <p>
                          <Link
                            className="link"
                            to={`/weekly-settlement?clientId=${client.id}`}
                          >
                            Ver cuadre de {client.name} →
                          </Link>
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {canOrders ? (
            <div className="panel">
              <div className="panel-heading-row">
                <div>
                  <h2>Pedidos recientes</h2>
                  <p className="muted">
                    {activeOrders.toLocaleString("es-MX")} activos en esta página ·{" "}
                    {ordersTotal.toLocaleString("es-MX")} en total
                  </p>
                </div>
              </div>
              {orders.length === 0 ? (
                <p className="muted">Sin pedidos todavía.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Formato</th>
                        <th>Cantidad</th>
                        <th>Estado</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.number}</strong>
                          </td>
                          <td>{order.clientName}</td>
                          <td>{order.productionFormatNumber ?? "—"}</td>
                          <td>{order.orderQuantity.toLocaleString("es-MX")}</td>
                          <td>{orderStatusLabel(order.status)}</td>
                          <td>
                            <Link className="link" to={`/orders/${order.id}`}>
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          <div className="home-grid">
            {canClients ? (
              <Link className="home-card" to="/clients">
                <strong>Clientes</strong>
                <span>Alta, agenda de semana y consulta</span>
              </Link>
            ) : null}
            {canCatalogs ? (
              <Link className="home-card" to="/catalogs">
                <strong>Catálogos</strong>
                <span>Marcas, tipos y destinos</span>
              </Link>
            ) : null}
            {canOrders ? (
              <Link className="home-card" to="/production-formats">
                <strong>Formatos de producción</strong>
                <span>Cortes, recepciones, pedidos y movimientos</span>
              </Link>
            ) : null}
            {canWeeklySettlement ? (
              <Link className="home-card" to="/weekly-settlement">
                <strong>Cuadre semanal</strong>
                <span>Abrir, previsualizar y cerrar semanas</span>
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
