import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import type { Cut, CutOrderAssignment, CutReceipt } from "../../../shared/types/domain";
import { cutStatusLabel, orderStatusLabel } from "../../../shared/i18n/labels";
import {
  createCutReceipt,
  deleteCut,
  deleteCutReceipt,
  getCut,
  listCutOrders,
  listCutReceipts,
  updateCutReceipt,
} from "../infrastructure/production-formats-api";

export function CutDetailPage() {
  const { formatId = "", cutId = "" } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const canWrite = useCan("orders.write");
  const [cut, setCut] = useState<Cut | null>(null);
  const [receipts, setReceipts] = useState<CutReceipt[]>([]);
  const [cutOrders, setCutOrders] = useState<CutOrderAssignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [folioNumber, setFolioNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFolio, setEditFolio] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const load = useCallback(async () => {
    if (!cutId) return;
    setLoading(true);
    setError(null);
    try {
      const [c, r, o] = await Promise.all([
        getCut(api, cutId),
        listCutReceipts(api, cutId),
        listCutOrders(api, cutId),
      ]);
      setCut(c);
      setReceipts(r);
      setCutOrders(o);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [api, cutId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !cutId) return;
    setSaving(true);
    setError(null);
    try {
      await createCutReceipt(api, cutId, {
        folioNumber: folioNumber.trim(),
        quantity: Number(quantity),
        notes: notes.trim() || null,
      });
      setFolioNumber("");
      setQuantity("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo registrar");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(receipt: CutReceipt) {
    setEditingId(receipt.id);
    setEditFolio(receipt.folioNumber);
    setEditQuantity(String(receipt.quantity));
    setEditNotes(receipt.notes ?? "");
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !editingId) return;
    setSaving(true);
    setError(null);
    try {
      await updateCutReceipt(api, editingId, {
        folioNumber: editFolio.trim(),
        quantity: Number(editQuantity),
        notes: editNotes.trim() || null,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(receiptId: string) {
    if (!canWrite) return;
    if (!window.confirm("¿Eliminar esta recepción parcial?")) return;
    setError(null);
    try {
      await deleteCutReceipt(api, receiptId);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo eliminar");
    }
  }

  async function onDeleteCut() {
    if (!canWrite || !cut) return;
    if (!window.confirm(`¿Eliminar el corte ${cut.number}?`)) return;
    setError(null);
    try {
      await deleteCut(api, cut.id);
      navigate(`/production-formats/${formatId}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo eliminar el corte");
    }
  }

  if (loading && !cut) {
    return (
      <section className="page">
        <p className="muted">Cargando corte…</p>
      </section>
    );
  }

  if (!cut) {
    return (
      <section className="page">
        <p className="error">{error ?? "Corte no encontrado"}</p>
        <Link className="link" to={`/production-formats/${formatId}`}>
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
            <Link className="link" to="/production-formats">
              Formatos
            </Link>{" "}
            /{" "}
            <Link className="link" to={`/production-formats/${formatId}`}>
              Formato
            </Link>{" "}
            / {cut.number}
          </p>
          <h1>Corte {cut.number}</h1>
          <p className="muted">
            Estilo {cut.style} · Plan {cut.workPlan}
          </p>
        </div>
        <div className="actions-row">
          <span className="badge">{cutStatusLabel(cut.status)}</span>
          {canWrite ? (
            <button className="btn btn-danger btn-small" type="button" onClick={() => void onDeleteCut()}>
              Eliminar corte
            </button>
          ) : null}
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="stats">
        <div className="stat">
          <span>Esperada</span>
          <strong>{cut.expectedQuantity.toLocaleString("es-MX")}</strong>
        </div>
        <div className="stat">
          <span>Recibida</span>
          <strong>{cut.totalReceived.toLocaleString("es-MX")}</strong>
        </div>
        <div className="stat">
          <span>Pendiente</span>
          <strong>{cut.pendingQuantity.toLocaleString("es-MX")}</strong>
        </div>
        <div className="stat">
          <span>Asignada</span>
          <strong>{cut.totalAssigned.toLocaleString("es-MX")}</strong>
        </div>
        <div className="stat">
          <span>Disponible</span>
          <strong>{cut.availableToAssign.toLocaleString("es-MX")}</strong>
        </div>
        <div className="stat">
          <span>Parciales</span>
          <strong>{cut.partialsCount}</strong>
        </div>
      </div>

      {canWrite ? (
        <form className="panel form-grid" onSubmit={onCreate}>
          <h2>Registrar recepción parcial</h2>
          <p className="muted">
            Requiere una semana OPEN del cliente del formato. Si falla, ábrela en{" "}
            <Link className="link" to="/weekly-settlement">
              Cuadre
            </Link>
            .
          </p>
          <label className="field">
            <span>Folio</span>
            <input
              className="input"
              value={folioNumber}
              onChange={(e) => setFolioNumber(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Cantidad recibida</span>
            <input
              className="input"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Observaciones</span>
            <input
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
            {saving && !editingId ? "Registrando…" : "Registrar recepción"}
          </button>
        </form>
      ) : null}

      {canWrite && editingId ? (
        <form className="panel form-grid" onSubmit={onSaveEdit}>
          <h2>Editar recepción</h2>
          <label className="field">
            <span>Folio</span>
            <input
              className="input"
              value={editFolio}
              onChange={(e) => setEditFolio(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Cantidad</span>
            <input
              className="input"
              type="number"
              min={1}
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Observaciones</span>
            <input
              className="input"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </label>
          <div className="actions-row">
            <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              className="btn btn-ghost btn-inline"
              type="button"
              onClick={() => setEditingId(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="panel table-wrap">
        <h2>Pedidos que usan este corte</h2>
        {cutOrders.length === 0 ? (
          <p className="muted">Sin pedidos asignados</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cantidad asignada</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cutOrders.map((o) => (
                <tr key={o.orderId}>
                  <td>{o.orderNumber}</td>
                  <td>{o.assignedQuantity.toLocaleString("es-MX")}</td>
                  <td>
                    <span className="badge">{orderStatusLabel(o.orderStatus)}</span>
                  </td>
                  <td>
                    <Link className="link" to={`/orders/${o.orderId}`}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel table-wrap">
        <h2>Historial de recepciones</h2>
        {receipts.length === 0 ? (
          <p className="muted">Sin recepciones</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Parcial</th>
                <th>Folio</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th>Notas</th>
                {canWrite ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r.id}>
                  <td>{r.partialNumber}</td>
                  <td>{r.folioNumber}</td>
                  <td>{r.quantity.toLocaleString("es-MX")}</td>
                  <td>{new Date(r.receivedAt).toLocaleString("es-MX")}</td>
                  <td>{r.notes ?? "—"}</td>
                  {canWrite ? (
                    <td className="actions-cell">
                      <button
                        className="btn btn-ghost btn-small"
                        type="button"
                        onClick={() => startEdit(r)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-ghost btn-small"
                        type="button"
                        onClick={() => void onDelete(r.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
