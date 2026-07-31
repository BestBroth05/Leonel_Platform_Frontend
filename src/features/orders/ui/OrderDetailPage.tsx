import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
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
  movementTypeLabel,
  orderStatusLabel,
  statusTransitionLabel,
} from "../../../shared/i18n/labels";
import { listCatalog } from "../../catalogs/infrastructure/catalogs-api";
import {
  createMovement,
  getOrder,
  getOrderBalance,
  getStatusHistory,
  listMovements,
  updateOrder,
} from "../infrastructure/orders-api";

const OPS: MovementType[] = [
  "RECEPTION",
  "ADDITIONAL_ENTRY",
  "SEND_TO_REPAIR",
  "RETURN_FROM_REPAIR",
  "SHRINKAGE",
  "PARTIAL_EXIT",
  "FINAL_EXIT",
];

export function OrderDetailPage() {
  const { id = "" } = useParams();
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

  const [type, setType] = useState<MovementType>("RECEPTION");
  const [quantity, setQuantity] = useState("100");
  const [note, setNote] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState("");

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
      setExpectedQuantity(String(o.expectedQuantity));
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

  async function onSaveExpected(event: FormEvent) {
    event.preventDefault();
    if (!canWriteOrder || !id || !order) return;
    if (order.status === "CANCELLED" || order.status === "COMPLETED") return;
    setSaving(true);
    setError(null);
    try {
      await updateOrder(api, id, { expectedQuantity: Number(expectedQuantity) });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function onMovement(event: FormEvent) {
    event.preventDefault();
    if (!canWriteInventory || !id) return;
    setSaving(true);
    setError(null);
    try {
      const needsDestination = type === "PARTIAL_EXIT" || type === "FINAL_EXIT";
      await createMovement(
        api,
        id,
        {
          type,
          quantity: Number(quantity),
          note: note.trim() || null,
          destinationId: needsDestination ? destinationId || null : null,
        },
        crypto.randomUUID(),
      );
      setNote("");
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
        <Link className="link" to="/orders">
          Volver
        </Link>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="muted">
            <Link className="link" to="/orders">
              Pedidos
            </Link>{" "}
            / {order.number}
          </p>
          <h1>Pedido {order.number}</h1>
          <p className="muted">
            {order.clientName}
            {order.brandName ? ` · ${order.brandName}` : ""}
            {order.pantTypeName ? ` · ${order.pantTypeName}` : ""}
          </p>
        </div>
        <span className="badge">{orderStatusLabel(order.status)}</span>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {canWriteOrder &&
      order.status !== "CANCELLED" &&
      order.status !== "COMPLETED" ? (
        <form className="panel form-inline" onSubmit={onSaveExpected}>
          <label className="field grow">
            <span>Cantidad esperada</span>
            <input
              className="input"
              type="number"
              min={1}
              value={expectedQuantity}
              onChange={(e) => setExpectedQuantity(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Actualizar esperado"}
          </button>
        </form>
      ) : null}

      {balance ? (
        <div className="stats">
          <div className="stat">
            <span>Esperado</span>
            <strong>{balance.expectedQuantity.toLocaleString("es-MX")}</strong>
          </div>
          <div className="stat">
            <span>Recibido</span>
            <strong>{balance.received.toLocaleString("es-MX")}</strong>
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
            <span>Enviado</span>
            <strong>{balance.shipped.toLocaleString("es-MX")}</strong>
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
                    <td>{new Date(m.createdAt).toLocaleString("es-MX")}</td>
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
