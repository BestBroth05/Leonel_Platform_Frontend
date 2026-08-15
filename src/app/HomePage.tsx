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
  formatMxn,
  orderStatusLabel,
} from "../shared/i18n/labels";
import type {
  Client,
  ClientWeek,
  Order,
  ProductionFormat,
  WeekClosePreview,
} from "../shared/types/domain";
import { DonutChart, squaredSlices } from "../shared/ui/DonutChart";

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
      setFormats(formatsRes.items.slice(0, 4));
      setFormatsTotal(formatsRes.total);
      setOrders(ordersRes.items.slice(0, 5));
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

  const focusWeek = weekSummaries[0];
  const focusCuts = focusWeek?.preview?.cuts ?? [];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Hola, {user?.name?.split(" ")[0] ?? "equipo"}</h1>
          <p className="muted">
            Resumen claro del taller: qué sigue, qué falta y a dónde ir.
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
          <div className="home-glance">
            <article className="glance-card">
              <span>Clientes</span>
              <strong>{clients.length.toLocaleString("es-MX")}</strong>
              <p>activos</p>
            </article>
            <article className="glance-card">
              <span>Formatos</span>
              <strong>{formatsTotal.toLocaleString("es-MX")}</strong>
              <p>en producción</p>
            </article>
            <article className="glance-card">
              <span>Pedidos activos</span>
              <strong>{activeOrders.toLocaleString("es-MX")}</strong>
              <p>de {ordersTotal.toLocaleString("es-MX")} totales</p>
            </article>
            <article className={`glance-card${readyToClose > 0 ? " glance-ok" : blockedWeeks > 0 ? " glance-warn" : ""}`}>
              <span>Cuadre</span>
              <strong>{openWeeksCount.toLocaleString("es-MX")}</strong>
              <p>
                {readyToClose > 0
                  ? `${readyToClose} lista(s) para cerrar`
                  : blockedWeeks > 0
                    ? `${blockedWeeks} con pendientes`
                    : "semanas abiertas"}
              </p>
            </article>
          </div>

          <div className="home-grid">
            {canWeeklySettlement ? (
              <Link className="home-card home-card-primary" to="/weekly-settlement">
                <strong>Ir al cuadre semanal</strong>
                <span>Abre, revisa gráficas y cierra la semana del cliente</span>
              </Link>
            ) : null}
            {canOrders ? (
              <Link className="home-card" to="/production-formats">
                <strong>Formatos y cortes</strong>
                <span>Recepciones, pedidos y movimientos del taller</span>
              </Link>
            ) : null}
            {canClients ? (
              <Link className="home-card" to="/clients">
                <strong>Clientes</strong>
                <span>Alta y agenda semanal</span>
              </Link>
            ) : null}
            {canCatalogs ? (
              <Link className="home-card" to="/catalogs">
                <strong>Catálogos</strong>
                <span>Marcas, tipos y destinos</span>
              </Link>
            ) : null}
          </div>

          {canWeeklySettlement ? (
            <div className="panel">
              <div className="panel-heading-row">
                <div>
                  <h2>¿Cómo va el cuadre?</h2>
                  <p className="muted">
                    Lo importante: si los cortes ya cuadraron y cuánto se puede cobrar.
                  </p>
                </div>
                <Link className="link" to="/weekly-settlement">
                  Abrir cuadre →
                </Link>
              </div>

              {weekSummaries.length === 0 ? (
                <p className="muted">
                  Ningún cliente tiene semana abierta. Entra a Cuadre y abre una.
                </p>
              ) : (
                <div className="home-week-layout">
                  {focusWeek?.preview && focusCuts.length > 0 ? (
                    <DonutChart
                      title={focusWeek.client.name}
                      slices={squaredSlices(focusCuts)}
                      centerValue={`${focusCuts.filter((c) => c.squared).length}/${focusCuts.length}`}
                      centerLabel="cuadrados"
                      size={160}
                    />
                  ) : null}

                  <div className="home-week-list">
                    {weekSummaries.map(({ client, week, preview, previewError }) => {
                      const squared = preview?.cuts.filter((c) => c.squared).length ?? 0;
                      const totalCutsInWeek = preview?.cuts.length ?? 0;
                      const pct =
                        totalCutsInWeek > 0
                          ? Math.round((squared / totalCutsInWeek) * 100)
                          : 0;
                      return (
                        <article key={week.id} className="home-week-card">
                          <div className="home-week-card-head">
                            <div>
                              <strong>{client.name}</strong>
                              <p className="muted">Desde {week.startDate}</p>
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
                                : preview
                                  ? "Pendiente"
                                  : "Abierta"}
                            </span>
                          </div>

                          {previewError ? (
                            <p className="error">{previewError}</p>
                          ) : preview ? (
                            <>
                              <div className="progress-block">
                                <div className="progress-meta">
                                  <span>
                                    {squared}/{totalCutsInWeek} cortes cuadrados
                                  </span>
                                  <strong>{pct}%</strong>
                                </div>
                                <div className="progress-track" aria-hidden="true">
                                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                              <p className="home-week-billable">
                                Por cobrar:{" "}
                                <strong>
                                  {preview.weeklyBillableQuantity.toLocaleString("es-MX")} prendas ·{" "}
                                  {formatMxn(preview.weeklyBillableAmount)}
                                </strong>
                              </p>
                              {preview.unsquaredCuts.length > 0 ? (
                                <p className="muted">
                                  Faltan {preview.unsquaredCuts.length} corte(s), p. ej.{" "}
                                  {preview.unsquaredCuts
                                    .slice(0, 2)
                                    .map((c) => c.cutNumber)
                                    .join(", ")}
                                  .
                                </p>
                              ) : (
                                <p className="muted">Todos los cortes con actividad ya cuadran.</p>
                              )}
                            </>
                          ) : null}

                          <Link
                            className="link"
                            to={`/weekly-settlement?clientId=${client.id}`}
                          >
                            Ver cuadre →
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {canOrders ? (
            <div className="split home-split">
              <div className="panel">
                <div className="panel-heading-row">
                  <div>
                    <h2>Formatos recientes</h2>
                    <p className="muted">Acceso rápido a producción</p>
                  </div>
                  <Link className="link" to="/production-formats">
                    Ver todos →
                  </Link>
                </div>
                {formats.length === 0 ? (
                  <p className="muted">Aún no hay formatos.</p>
                ) : (
                  <ul className="simple-list">
                    {formats.map((format) => (
                      <li key={format.id}>
                        <div>
                          <strong>{format.number}</strong>
                          <span className="muted">
                            {format.clientName ?? "Sin cliente"} · {format.cutsCount} cortes ·{" "}
                            {format.ordersCount} pedidos
                          </span>
                        </div>
                        <Link className="link" to={`/production-formats/${format.id}`}>
                          Abrir
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="panel">
                <div className="panel-heading-row">
                  <div>
                    <h2>Pedidos recientes</h2>
                    <p className="muted">{activeOrders} activos ahora</p>
                  </div>
                </div>
                {orders.length === 0 ? (
                  <p className="muted">Sin pedidos todavía.</p>
                ) : (
                  <ul className="simple-list">
                    {orders.map((order) => (
                      <li key={order.id}>
                        <div>
                          <strong>{order.number}</strong>
                          <span className="muted">
                            {order.clientName} · {order.orderQuantity.toLocaleString("es-MX")} ·{" "}
                            {orderStatusLabel(order.status)}
                          </span>
                        </div>
                        <Link className="link" to={`/orders/${order.id}`}>
                          Abrir
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
