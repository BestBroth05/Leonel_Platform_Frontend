import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import type {
  CatalogItem,
  Movement,
  MovementType,
  Order,
  OrderBalance,
  StatusHistoryItem,
} from "../../../shared/types/domain";
import {
  formatMxn,
  movementTypeLabel,
  orderStatusLabel,
  statusTransitionLabel,
} from "../../../shared/i18n/labels";
import { listCatalog } from "../../catalogs/infrastructure/catalogs-api";
import {
  createMovement,
  deleteOrder,
  getOrder,
  getOrderBalance,
  getStatusHistory,
  listMovements,
  updateOrder,
} from "../infrastructure/orders-api";

const OPS: MovementType[] = [
  "SEND_TO_REPAIR",
  "RETURN_FROM_REPAIR",
  "SHRINKAGE",
  "PARTIAL_EXIT",
  "FINAL_EXIT",
  "SOBRANTE_LINEA",
  "ADDITIONAL_ENTRY",
  "RECEPTION",
];

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const canWriteInventory = useCan("inventory.write");
  const canWriteOrder = useCan("orders.write");
  const [order, setOrder] = useState<Order | null>(null);
  const [balance, setBalance] = useState<OrderBalance | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [destinations, setDestinations] = useState<CatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<MovementType>("SEND_TO_REPAIR");
  const [quantity, setQuantity] = useState("100");
  const [note, setNote] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [costPerGarment, setCostPerGarment] = useState("");
  const [allocByCut, setAllocByCut] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [o, b, m, h, d] = await Promise.all([
        getOrder(api, id),
        getOrderBalance(api, id),
        listMovements(api, id),
        getStatusHistory(api, id),
        listCatalog(api, "destinations", true),
      ]);
      setOrder(o);
      setPurchaseOrder(o.purchaseOrder ?? "");
      setCostPerGarment(o.costPerGarment ?? "");
      setBalance(b.balance);
      setMovements(m);
      setHistory(h);
      setDestinations(d);
      if (!destinationId && d[0]) setDestinationId(d[0].id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [api, id, destinationId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSaveOrder(event: FormEvent) {
    event.preventDefault();
    if (!canWriteOrder || !id || !order) return;
    if (order.status === "CANCELLED" || order.status === "COMPLETED") return;
    setSaving(true);
    setError(null);
    try {
      await updateOrder(api, id, {
        purchaseOrder: purchaseOrder.trim() || null,
        costPerGarment: costPerGarment.trim() || null,
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteOrder() {
    if (!canWriteOrder || !order) return;
    if (!window.confirm(`¿Eliminar el pedido ${order.number}?`)) return;
    setError(null);
    try {
      await deleteOrder(api, order.id);
      navigate(
        order.productionFormatId
          ? `/production-formats/${order.productionFormatId}`
          : "/production-formats",
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo eliminar");
    }
  }

  async function onMovement(event: FormEvent) {
    event.preventDefault();
    if (!canWriteInventory || !id || !order) return;
    setSaving(true);
    setError(null);
    try {
      const needsDestination = type === "PARTIAL_EXIT" || type === "FINAL_EXIT";
      const multiCut = order.cuts.length > 1;
      const cutAllocations = multiCut
        ? order.cuts
            .map((c) => ({
              orderCutId: c.id,
              quantity: Number(allocByCut[c.id] || 0),
            }))
            .filter((a) => a.quantity > 0)
        : undefined;

      if (multiCut && cutAllocations && cutAllocations.length > 0) {
        const allocSum = cutAllocations.reduce((s, a) => s + a.quantity, 0);
        if (allocSum !== Number(quantity)) {
          setError(
            "La suma de cantidades por corte debe coincidir con la cantidad del movimiento",
          );
          setSaving(false);
          return;
        }
      }

      await createMovement(
        api,
        id,
        {
          type,
          quantity: Number(quantity),
          note: note.trim() || null,
          destinationId: needsDestination ? destinationId || null : null,
          ...(cutAllocations && cutAllocations.length > 0
            ? { cutAllocations }
            : {}),
        },
        crypto.randomUUID(),
      );
      setNote("");
      setAllocByCut({});
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo registrar");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !order) {
    return (
      <section className="page">
        <p className="muted">Cargando pedido…</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="page">
        <p className="error">{error ?? "Pedido no encontrado"}</p>
        <Link className="link" to="/production-formats">
          Volver
        </Link>
      </section>
    );
  }

  const formatLink = order.productionFormatId
    ? `/production-formats/${order.productionFormatId}`
    : "/production-formats";
  const multiCut = order.cuts.length > 1;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="muted">
            <Link className="link" to="/production-formats">
              Formatos de producción
            </Link>
            {order.productionFormatNumber ? (
              <>
                {" "}
                /{" "}
                <Link className="link" to={formatLink}>
                  {order.productionFormatNumber}
                </Link>
              </>
            ) : null}{" "}
            / {order.number}
          </p>
          <h1>Pedido {order.number}</h1>
          <p className="muted">
            {order.clientName} · Cantidad total{" "}
            {order.orderQuantity.toLocaleString("es-MX")}
          </p>
        </div>
        <div className="actions-row">
          <span className="badge">{orderStatusLabel(order.status)}</span>
          {canWriteOrder ? (
            <button
              className="btn btn-danger btn-small"
              type="button"
              onClick={() => void onDeleteOrder()}
            >
              Eliminar pedido
            </button>
          ) : null}
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {balance?.warnings?.length ? (
        <div className="panel">
          {balance.warnings.map((w) => (
            <p key={w} className="error">
              {w}
            </p>
          ))}
        </div>
      ) : null}

      <div className="panel table-wrap">
        <h2>Cortes del pedido</h2>
        {order.cuts.length === 0 ? (
          <p className="muted">Sin cortes asignados</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Corte</th>
                <th>Estilo</th>
                <th>Plan</th>
                <th>Cantidad aportada</th>
              </tr>
            </thead>
            <tbody>
              {order.cuts.map((c) => (
                <tr key={c.id}>
                  <td>{c.cutNumber}</td>
                  <td>{c.cutStyle}</td>
                  <td>{c.cutWorkPlan}</td>
                  <td>{c.assignedQuantity.toLocaleString("es-MX")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted">
          Total: {order.orderQuantity.toLocaleString("es-MX")} · OC:{" "}
          {order.purchaseOrder ?? "—"} · Costo: {formatMxn(order.costPerGarment)} ·
          Importe est.: {formatMxn(order.estimatedAmount)}
        </p>
      </div>

      {canWriteOrder &&
      order.status !== "CANCELLED" &&
      order.status !== "COMPLETED" ? (
        <form className="panel form-grid" onSubmit={onSaveOrder}>
          <h2>Datos del pedido</h2>
          <label className="field">
            <span>Orden de compra</span>
            <input
              className="input"
              value={purchaseOrder}
              onChange={(e) => setPurchaseOrder(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Costo por prenda (MXN)</span>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={costPerGarment}
              onChange={(e) => setCostPerGarment(e.target.value)}
            />
          </label>
          <p className="muted">
            Cantidad total (suma de cortes):{" "}
            {order.orderQuantity.toLocaleString("es-MX")}. Importe estimado:{" "}
            {formatMxn(order.estimatedAmount)}
          </p>
          <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </form>
      ) : null}

      {balance ? (
        <div className="stats">
          <div className="stat">
            <span>Cantidad inicial</span>
            <strong>{balance.assignedQuantity.toLocaleString("es-MX")}</strong>
          </div>
          <div className="stat">
            <span>Disponible</span>
            <strong>{balance.available.toLocaleString("es-MX")}</strong>
          </div>
          <div className="stat">
            <span>En compostura</span>
            <strong>{balance.inRepair.toLocaleString("es-MX")}</strong>
          </div>
          <div className="stat">
            <span>Merma</span>
            <strong>{balance.shrinkage.toLocaleString("es-MX")}</strong>
          </div>
          <div className="stat">
            <span>Entregado</span>
            <strong>{balance.shipped.toLocaleString("es-MX")}</strong>
          </div>
          <div className="stat">
            <span>Sobrante de línea</span>
            <strong>{balance.lineSurplus.toLocaleString("es-MX")}</strong>
          </div>
          <div className="stat">
            <span>Pendiente</span>
            <strong>{balance.pendingToAccount.toLocaleString("es-MX")}</strong>
          </div>
        </div>
      ) : null}

      {canWriteInventory &&
      order.status !== "CANCELLED" &&
      order.status !== "COMPLETED" ? (
        <form className="panel form-grid" onSubmit={onMovement}>
          <h2>Registrar movimiento</h2>
          <label className="field">
            <span>Tipo</span>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as MovementType)}
            >
              {OPS.map((op) => (
                <option key={op} value={op}>
                  {movementTypeLabel(op)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Cantidad</span>
            <input
              className="input"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
          {(type === "PARTIAL_EXIT" || type === "FINAL_EXIT") && (
            <label className="field">
              <span>Destino</span>
              <select
                className="input"
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
              >
                <option value="">Sin destino</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {multiCut ? (
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Distribución por corte (opcional si hay un solo corte)</span>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Corte</th>
                      <th>Asignado</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.cuts.map((c) => (
                      <tr key={c.id}>
                        <td>{c.cutNumber}</td>
                        <td>{c.assignedQuantity.toLocaleString("es-MX")}</td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            min={0}
                            value={allocByCut[c.id] ?? ""}
                            onChange={(e) =>
                              setAllocByCut((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted">
                Con varios cortes, indica cuánto aplica a cada uno (la suma debe
                coincidir con la cantidad).
              </p>
            </div>
          ) : null}
          <label className="field">
            <span>Nota</span>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
            {saving ? "Registrando…" : "Registrar"}
          </button>
        </form>
      ) : null}

      <div className="split">
        <div className="panel table-wrap">
          <h2>Movimientos</h2>
          {movements.length === 0 ? (
            <p className="muted">Sin movimientos</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cant.</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className={m.cancelledAt ? "row-muted" : undefined}>
                    <td>
                      {new Date(m.occurredAt || m.createdAt).toLocaleString("es-MX")}
                    </td>
                    <td>
                      {movementTypeLabel(m.type)}
                      {m.cancelledAt ? " (cancelado)" : ""}
                    </td>
                    <td>{m.quantity.toLocaleString("es-MX")}</td>
                    <td>{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel table-wrap">
          <h2>Historial de estado</h2>
          {history.length === 0 ? (
            <p className="muted">Sin historial</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cambio</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleString("es-MX")}</td>
                    <td>
                      {statusTransitionLabel(h.fromStatus, h.toStatus)}
                      {h.note ? ` · ${h.note}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
