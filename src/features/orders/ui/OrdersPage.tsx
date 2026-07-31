import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import type { CatalogItem, Client, Order } from "../../../shared/types/domain";
import { orderStatusLabel } from "../../../shared/i18n/labels";
import { listCatalog } from "../../catalogs/infrastructure/catalogs-api";
import { listClients } from "../../clients/infrastructure/clients-api";
import { createOrder, listOrders } from "../infrastructure/orders-api";

export function OrdersPage() {
  const api = useApi();
  const canWrite = useCan("orders.write");
  const [items, setItems] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [pantTypes, setPantTypes] = useState<CatalogItem[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [number, setNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [pantTypeId, setPantTypeId] = useState("");
  const [expectedQuantity, setExpectedQuantity] = useState("1000");

  const load = useCallback(async (search = q) => {
    setLoading(true);
    setError(null);
    try {
      const [orders, clientPage, brandList, pantList] = await Promise.all([
        listOrders(api, { q: search.trim() || undefined }),
        listClients(api, { activeOnly: true, pageSize: 100 }),
        listCatalog(api, "brands", true),
        listCatalog(api, "pant-types", true),
      ]);
      setItems(orders.items);
      setClients(clientPage.items);
      setBrands(brandList);
      setPantTypes(pantList);
      setClientId((prev) => prev || clientPage.items[0]?.id || "");
      setBrandId((prev) => prev || brandList[0]?.id || "");
      setPantTypeId((prev) => prev || pantList[0]?.id || "");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [api, q]);

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      await createOrder(api, {
        number: number.trim(),
        clientId,
        brandId: brandId || null,
        pantTypeId: pantTypeId || null,
        expectedQuantity: Number(expectedQuantity),
      });
      setNumber("");
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo crear");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p className="muted">Ciclo operativo del taller</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="toolbar">
        <input
          className="input"
          placeholder="Buscar número…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-ghost" type="button" onClick={() => void load()}>
          Buscar
        </button>
      </div>

      {canWrite ? (
        <form className="panel form-grid" onSubmit={onCreate}>
          <h2>Nuevo pedido</h2>
          <label className="field">
            <span>Número</span>
            <input
              className="input"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Cliente</span>
            <select
              className="input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
            {saving ? "Creando…" : "Crear pedido"}
          </button>
        </form>
      ) : null}

      <div className="panel table-wrap">
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="muted">Sin pedidos</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Esperado</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id}>
                  <td>{order.number}</td>
                  <td>{order.clientName}</td>
                  <td>{order.expectedQuantity.toLocaleString("es-MX")}</td>
                  <td>
                    <span className="badge">{orderStatusLabel(order.status)}</span>
                  </td>
                  <td>
                    <Link className="link" to={`/orders/${order.id}`}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
