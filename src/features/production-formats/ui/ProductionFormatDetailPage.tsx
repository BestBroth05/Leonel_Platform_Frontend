import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import type {
  CatalogItem,
  Client,
  Cut,
  Order,
  ProductionFormat,
} from "../../../shared/types/domain";
import {
  cutStatusLabel,
  formatMxn,
  orderStatusLabel,
} from "../../../shared/i18n/labels";
import { listCatalog } from "../../catalogs/infrastructure/catalogs-api";
import { listClients } from "../../clients/infrastructure/clients-api";
import { createOrder, deleteOrder } from "../../orders/infrastructure/orders-api";
import {
  createCut,
  deleteCut,
  deleteProductionFormat,
  getProductionFormat,
  listCuts,
  listFormatOrders,
  updateProductionFormat,
} from "../infrastructure/production-formats-api";

type Tab = "cuts" | "orders";

export function ProductionFormatDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const canWrite = useCan("orders.write");
  const [tab, setTab] = useState<Tab>("cuts");
  const [format, setFormat] = useState<ProductionFormat | null>(null);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [pantTypes, setPantTypes] = useState<CatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editFormatNumber, setEditFormatNumber] = useState("");
  const [editClientId, setEditClientId] = useState("");

  const [cutNumber, setCutNumber] = useState("");
  const [workPlan, setWorkPlan] = useState("");
  const [style, setStyle] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState("1000");

  const [orderNumber, setOrderNumber] = useState("");
  const [brandId, setBrandId] = useState("");
  const [pantTypeId, setPantTypeId] = useState("");
  const [selectedCutIds, setSelectedCutIds] = useState<string[]>([]);
  const [qtyByCut, setQtyByCut] = useState<Record<string, string>>({});
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [costPerGarment, setCostPerGarment] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [f, c, o, brandList, pantList, clientPage] = await Promise.all([
        getProductionFormat(api, id),
        listCuts(api, id),
        listFormatOrders(api, id),
        listCatalog(api, "brands", true),
        listCatalog(api, "pant-types", true),
        listClients(api, { activeOnly: true, pageSize: 100 }),
      ]);
      setFormat(f);
      setEditFormatNumber(f.number);
      setEditClientId(f.clientId ?? "");
      setCuts(c);
      setOrders(o.items);
      setClients(clientPage.items);
      setBrands(brandList);
      setPantTypes(pantList);
      setBrandId((prev) => prev || brandList[0]?.id || "");
      setPantTypeId((prev) => prev || pantList[0]?.id || "");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const orderTotal = useMemo(
    () =>
      selectedCutIds.reduce((sum, cutId) => sum + (Number(qtyByCut[cutId]) || 0), 0),
    [selectedCutIds, qtyByCut],
  );

  function toggleCut(cut: Cut) {
    setSelectedCutIds((prev) => {
      if (prev.includes(cut.id)) {
        setQtyByCut((q) => {
          const next = { ...q };
          delete next[cut.id];
          return next;
        });
        return prev.filter((x) => x !== cut.id);
      }
      setQtyByCut((q) => ({
        ...q,
        [cut.id]: String(Math.max(0, cut.availableToAssign)),
      }));
      return [...prev, cut.id];
    });
  }

  async function onCreateCut(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !id) return;
    setSaving(true);
    setError(null);
    try {
      await createCut(api, id, {
        number: cutNumber.trim(),
        workPlan: workPlan.trim(),
        style: style.trim(),
        expectedQuantity: Number(expectedQuantity),
      });
      setCutNumber("");
      setWorkPlan("");
      setStyle("");
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo crear el corte");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteCut(cut: Cut) {
    if (!canWrite) return;
    if (!window.confirm(`¿Eliminar el corte ${cut.number}?`)) return;
    setError(null);
    try {
      await deleteCut(api, cut.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo eliminar el corte");
    }
  }

  async function onDeleteOrder(order: Order) {
    if (!canWrite) return;
    if (!window.confirm(`¿Eliminar el pedido ${order.number}?`)) return;
    setError(null);
    try {
      await deleteOrder(api, order.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo eliminar el pedido");
    }
  }

  async function onSaveFormat(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !id) return;
    setSaving(true);
    setError(null);
    try {
      await updateProductionFormat(api, id, {
        number: editFormatNumber.trim(),
        clientId: editClientId || undefined,
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar el formato");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteFormat() {
    if (!canWrite || !format) return;
    if (
      !window.confirm(
        `¿Eliminar el formato ${format.number}? También se eliminarán sus cortes y pedidos.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteProductionFormat(api, format.id);
      navigate("/production-formats");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo eliminar el formato");
    }
  }

  async function onCreateOrder(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !id || !format) return;
    if (selectedCutIds.length === 0) {
      setError("Selecciona al menos un corte");
      return;
    }
    if (!format.clientId) {
      setError("El formato no tiene cliente asignado");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createOrder(api, {
        number: orderNumber.trim(),
        clientId: format.clientId,
        productionFormatId: id,
        cuts: selectedCutIds.map((cutId) => ({
          cutId,
          assignedQuantity: Number(qtyByCut[cutId]),
        })),
        brandId: brandId || null,
        pantTypeId: pantTypeId || null,
        purchaseOrder: purchaseOrder.trim() || null,
        costPerGarment: costPerGarment.trim() || null,
      });
      setOrderNumber("");
      setPurchaseOrder("");
      setCostPerGarment("");
      setSelectedCutIds([]);
      setQtyByCut({});
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo crear el pedido");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !format) {
    return (
      <section className="page">
        <p className="muted">Cargando formato…</p>
      </section>
    );
  }

  if (!format) {
    return (
      <section className="page">
        <p className="error">{error ?? "Formato no encontrado"}</p>
        <Link className="link" to="/production-formats">
          Volver
        </Link>
      </section>
    );
  }

  const estimated =
    orderTotal > 0 && costPerGarment
      ? orderTotal * Number(costPerGarment)
      : null;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="muted">
            <Link className="link" to="/production-formats">
              Formatos de producción
            </Link>{" "}
            / {format.number}
          </p>
          <h1>Formato {format.number}</h1>
          <p className="muted">
            Cliente: {format.clientName ?? "—"} · {format.cutsCount} corte(s) ·{" "}
            {format.ordersCount} pedido(s)
          </p>
        </div>
        {canWrite ? (
          <button
            className="btn btn-danger btn-small"
            type="button"
            onClick={() => void onDeleteFormat()}
          >
            Eliminar formato
          </button>
        ) : null}
      </header>

      {error ? <p className="error">{error}</p> : null}

      {canWrite ? (
        <form className="panel form-grid" onSubmit={onSaveFormat}>
          <h2>Editar formato</h2>
          <label className="field">
            <span>Número</span>
            <input
              className="input"
              value={editFormatNumber}
              onChange={(e) => setEditFormatNumber(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Cliente</span>
            <select
              className="input"
              value={editClientId}
              onChange={(e) => setEditClientId(e.target.value)}
              required
            >
              {clients.length === 0 ? (
                <option value="">Sin clientes activos</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <button
            className="btn btn-primary btn-inline"
            type="submit"
            disabled={saving || !editClientId}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      ) : null}

      <div className="tabs">
        <button
          type="button"
          className={tab === "cuts" ? "tab active" : "tab"}
          onClick={() => setTab("cuts")}
        >
          Cortes
        </button>
        <button
          type="button"
          className={tab === "orders" ? "tab active" : "tab"}
          onClick={() => setTab("orders")}
        >
          Pedidos
        </button>
      </div>

      {tab === "cuts" ? (
        <>
          {canWrite ? (
            <form className="panel form-grid" onSubmit={onCreateCut}>
              <h2>Nuevo corte</h2>
              <label className="field">
                <span>Número de corte</span>
                <input
                  className="input"
                  value={cutNumber}
                  onChange={(e) => setCutNumber(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>Plan de trabajo</span>
                <input
                  className="input"
                  value={workPlan}
                  onChange={(e) => setWorkPlan(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>Estilo</span>
                <input
                  className="input"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  required
                />
              </label>
              <label className="field">
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
                {saving ? "Guardando…" : "Registrar corte"}
              </button>
            </form>
          ) : null}

          <div className="panel table-wrap">
            {cuts.length === 0 ? (
              <p className="muted">Sin cortes</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Corte</th>
                    <th>Plan</th>
                    <th>Estilo</th>
                    <th>Esperada</th>
                    <th>Recibida</th>
                    <th>Pendiente</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cuts.map((cut) => (
                    <tr key={cut.id}>
                      <td>{cut.number}</td>
                      <td>{cut.workPlan}</td>
                      <td>{cut.style}</td>
                      <td>{cut.expectedQuantity.toLocaleString("es-MX")}</td>
                      <td>{cut.totalReceived.toLocaleString("es-MX")}</td>
                      <td>{cut.pendingQuantity.toLocaleString("es-MX")}</td>
                      <td>
                        <span className="badge">{cutStatusLabel(cut.status)}</span>
                      </td>
                      <td className="actions-cell">
                        <Link
                          className="link"
                          to={`/production-formats/${id}/cuts/${cut.id}`}
                        >
                          Abrir
                        </Link>
                        {canWrite ? (
                          <button
                            className="btn btn-danger btn-small"
                            type="button"
                            onClick={() => void onDeleteCut(cut)}
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          {canWrite ? (
            <form className="panel form-grid" onSubmit={onCreateOrder}>
              <h2>Nuevo pedido</h2>
              <label className="field">
                <span>Número de pedido</span>
                <input
                  className="input"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                />
              </label>
              <p className="muted">
                Cliente: {format.clientName ?? "—"} (del formato)
              </p>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <span>Cortes del formato (selecciona uno o varios)</span>
                {cuts.length > 0 &&
                cuts.every((cut) => cut.availableToAssign <= 0) ? (
                  <p className="banner banner-warn" role="status">
                    Ningún corte tiene piezas disponibles. Primero ve a la
                    pestaña <strong>Cortes</strong>, abre el corte y registra
                    una recepción parcial. Solo entonces podrás marcar el
                    checkbox y asignar cantidad al pedido.
                  </p>
                ) : (
                  <p className="muted">
                    Solo se pueden seleccionar cortes con piezas disponibles
                    (recibido − ya asignado a otros pedidos).
                  </p>
                )}
                <div className="table-wrap">
                  <table className="table table-order-cuts">
                    <thead>
                      <tr>
                        <th />
                        <th>Corte</th>
                        <th>Estilo</th>
                        <th>Plan</th>
                        <th>Recibido</th>
                        <th>Asignado</th>
                        <th>Disponible</th>
                        <th>Asignar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuts.map((cut) => {
                        const selected = selectedCutIds.includes(cut.id);
                        const canSelect = cut.availableToAssign > 0 || selected;
                        return (
                          <tr
                            key={cut.id}
                            className={canSelect ? undefined : "row-disabled"}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleCut(cut)}
                                disabled={!canSelect}
                                title={
                                  canSelect
                                    ? "Seleccionar corte"
                                    : cut.totalReceived <= 0
                                      ? "Sin recepciones: registra piezas recibidas en el corte"
                                      : "Sin disponible: ya está asignado a otros pedidos"
                                }
                                aria-label={`Seleccionar corte ${cut.number}`}
                              />
                            </td>
                            <td>{cut.number}</td>
                            <td>{cut.style}</td>
                            <td>{cut.workPlan}</td>
                            <td>{cut.totalReceived.toLocaleString("es-MX")}</td>
                            <td>{cut.totalAssigned.toLocaleString("es-MX")}</td>
                            <td>
                              {cut.availableToAssign.toLocaleString("es-MX")}
                              {!canSelect ? (
                                <span className="muted"> · sin stock</span>
                              ) : null}
                            </td>
                            <td>
                              {selected ? (
                                <input
                                  className="input"
                                  type="number"
                                  min={1}
                                  max={cut.availableToAssign}
                                  value={qtyByCut[cut.id] ?? ""}
                                  onChange={(e) =>
                                    setQtyByCut((q) => ({
                                      ...q,
                                      [cut.id]: e.target.value,
                                    }))
                                  }
                                  required
                                />
                              ) : !canSelect ? (
                                <Link
                                  className="link"
                                  to={`/production-formats/${id}/cuts/${cut.id}`}
                                >
                                  Recibir
                                </Link>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="muted">
                  Total del pedido: {orderTotal.toLocaleString("es-MX")} prendas
                </p>
              </div>

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
              <label className="field">
                <span>Marca</span>
                <select
                  className="input"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Tipo</span>
                <select
                  className="input"
                  value={pantTypeId}
                  onChange={(e) => setPantTypeId(e.target.value)}
                >
                  {pantTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              {estimated != null && Number.isFinite(estimated) ? (
                <p className="muted">Importe estimado: {formatMxn(estimated)}</p>
              ) : null}
              <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
                {saving ? "Creando…" : "Crear pedido"}
              </button>
            </form>
          ) : null}

          <div className="panel table-wrap">
            {orders.length === 0 ? (
              <p className="muted">Sin pedidos</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cortes</th>
                    <th>Cantidad</th>
                    <th>OC</th>
                    <th>Costo</th>
                    <th>Importe est.</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.number}</td>
                      <td>
                        {order.cuts.length
                          ? order.cuts
                              .map(
                                (c) =>
                                  `${c.cutNumber} (${c.assignedQuantity.toLocaleString("es-MX")})`,
                              )
                              .join(", ")
                          : "—"}
                      </td>
                      <td>{order.orderQuantity.toLocaleString("es-MX")}</td>
                      <td>{order.purchaseOrder ?? "—"}</td>
                      <td>{formatMxn(order.costPerGarment)}</td>
                      <td>{formatMxn(order.estimatedAmount)}</td>
                      <td>
                        <span className="badge">{orderStatusLabel(order.status)}</span>
                      </td>
                      <td className="actions-cell">
                        <Link className="link" to={`/orders/${order.id}`}>
                          Abrir
                        </Link>
                        {canWrite ? (
                          <button
                            className="btn btn-danger btn-small"
                            type="button"
                            onClick={() => void onDeleteOrder(order)}
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </section>
  );
}
