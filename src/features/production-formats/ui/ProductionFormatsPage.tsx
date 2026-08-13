import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import type { Client, ProductionFormat } from "../../../shared/types/domain";
import { listClients } from "../../clients/infrastructure/clients-api";
import {
  createProductionFormat,
  listProductionFormats,
} from "../infrastructure/production-formats-api";

export function ProductionFormatsPage() {
  const api = useApi();
  const canWrite = useCan("orders.write");
  const [items, setItems] = useState<ProductionFormat[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [number, setNumber] = useState("");
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (search = q) => {
      setLoading(true);
      setError(null);
      try {
        const [result, clientPage] = await Promise.all([
          listProductionFormats(api, {
            q: search.trim() || undefined,
          }),
          listClients(api, { activeOnly: true, pageSize: 100 }),
        ]);
        setItems(result.items);
        setClients(clientPage.items);
        setClientId((prev) => prev || clientPage.items[0]?.id || "");
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    },
    [api, q],
  );

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !clientId) return;
    setSaving(true);
    setError(null);
    try {
      await createProductionFormat(api, {
        number: number.trim(),
        clientId,
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
          <h1>Formatos de producción</h1>
          <p className="muted">Cortes, recepciones y pedidos del taller</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="toolbar">
        <input
          className="input"
          placeholder="Buscar número de formato…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-ghost" type="button" onClick={() => void load()}>
          Buscar
        </button>
      </div>

      {canWrite ? (
        <form className="panel form-grid" onSubmit={onCreate}>
          <h2>Nuevo formato</h2>
          <label className="field">
            <span>Número de formato</span>
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
            disabled={saving || !clientId}
          >
            {saving ? "Creando…" : "Crear formato"}
          </button>
        </form>
      ) : null}

      <div className="panel table-wrap">
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="muted">Sin formatos</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Cortes</th>
                <th>Pedidos</th>
                <th>Creado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((format) => (
                <tr key={format.id}>
                  <td>{format.number}</td>
                  <td>{format.clientName ?? "—"}</td>
                  <td>{format.cutsCount}</td>
                  <td>{format.ordersCount}</td>
                  <td>{new Date(format.createdAt).toLocaleDateString("es-MX")}</td>
                  <td>
                    <Link className="link" to={`/production-formats/${format.id}`}>
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
