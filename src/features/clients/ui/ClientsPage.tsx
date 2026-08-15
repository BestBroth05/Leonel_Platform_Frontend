import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import { weekdayLabel } from "../../../shared/i18n/labels";
import { WEEKDAYS, type Client, type Weekday } from "../../../shared/types/domain";
import { createClient, deleteClient, listClients, updateClient } from "../infrastructure/clients-api";

function WeekdaySelect({
  value,
  onChange,
  id,
}: {
  value: Weekday | "";
  onChange: (value: Weekday | "") => void;
  id: string;
}) {
  return (
    <select
      id={id}
      className="input"
      value={value}
      onChange={(e) => onChange((e.target.value || "") as Weekday | "")}
    >
      <option value="">—</option>
      {WEEKDAYS.map((day) => (
        <option key={day} value={day}>
          {weekdayLabel(day)}
        </option>
      ))}
    </select>
  );
}

export function ClientsPage() {
  const api = useApi();
  const canWrite = useCan("clients.write");
  const [items, setItems] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [weekOpensOn, setWeekOpensOn] = useState<Weekday | "">("");
  const [weekClosesOn, setWeekClosesOn] = useState<Weekday | "">("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWeekOpensOn, setEditWeekOpensOn] = useState<Weekday | "">("");
  const [editWeekClosesOn, setEditWeekClosesOn] = useState<Weekday | "">("");

  const load = useCallback(async (search = q) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listClients(api, { q: search.trim() || undefined });
      setItems(result.items);
      setTotal(result.total);
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
      await createClient(api, {
        name: name.trim(),
        weekOpensOn: weekOpensOn || null,
        weekClosesOn: weekClosesOn || null,
      });
      setName("");
      setWeekOpensOn("");
      setWeekClosesOn("");
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo crear");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditName(client.name);
    setEditWeekOpensOn(client.weekOpensOn ?? "");
    setEditWeekClosesOn(client.weekClosesOn ?? "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditWeekOpensOn("");
    setEditWeekClosesOn("");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !editingId) return;
    setSaving(true);
    setError(null);
    try {
      await updateClient(api, editingId, {
        name: editName.trim(),
        weekOpensOn: editWeekOpensOn || null,
        weekClosesOn: editWeekClosesOn || null,
      });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(client: Client) {
    if (!canWrite) return;
    setError(null);
    try {
      await updateClient(api, client.id, { isActive: !client.isActive });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar");
    }
  }

  async function onDelete(client: Client) {
    if (!canWrite) return;
    if (
      !window.confirm(
        `¿Eliminar el cliente "${client.name}"? Esta acción no se puede deshacer desde la lista.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteClient(api, client.id);
      if (editingId === client.id) cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo eliminar");
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="muted">{total} registro(s)</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="toolbar">
        <input
          className="input"
          placeholder="Buscar por nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-ghost" type="button" onClick={() => void load()}>
          Buscar
        </button>
      </div>

      {canWrite ? (
        <form className="panel form-grid" onSubmit={onCreate}>
          <h2>Nuevo cliente</h2>
          <label className="field">
            <span>Nombre</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Abre semana el</span>
            <WeekdaySelect
              id="create-week-opens"
              value={weekOpensOn}
              onChange={setWeekOpensOn}
            />
          </label>
          <label className="field">
            <span>Cierra semana el</span>
            <WeekdaySelect
              id="create-week-closes"
              value={weekClosesOn}
              onChange={setWeekClosesOn}
            />
          </label>
          <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
            {saving && !editingId ? "Guardando…" : "Guardar"}
          </button>
        </form>
      ) : null}

      {canWrite && editingId ? (
        <form className="panel form-grid" onSubmit={saveEdit}>
          <h2>Editar cliente</h2>
          <label className="field">
            <span>Nombre</span>
            <input
              className="input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Abre semana el</span>
            <WeekdaySelect
              id="edit-week-opens"
              value={editWeekOpensOn}
              onChange={setEditWeekOpensOn}
            />
          </label>
          <label className="field">
            <span>Cierra semana el</span>
            <WeekdaySelect
              id="edit-week-closes"
              value={editWeekClosesOn}
              onChange={setEditWeekClosesOn}
            />
          </label>
          <div className="actions-row">
            <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
            <button className="btn btn-ghost btn-inline" type="button" onClick={cancelEdit}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="panel table-wrap">
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="muted">Sin clientes</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Abre</th>
                <th>Cierra</th>
                <th>Estado</th>
                {canWrite ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((client) => (
                <tr key={client.id} className={editingId === client.id ? "row-editing" : undefined}>
                  <td>{client.name}</td>
                  <td>{weekdayLabel(client.weekOpensOn)}</td>
                  <td>{weekdayLabel(client.weekClosesOn)}</td>
                  <td>
                    <span className={client.isActive ? "badge ok" : "badge off"}>
                      {client.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {canWrite ? (
                    <td className="actions-cell">
                      <button
                        className="btn btn-ghost btn-small"
                        type="button"
                        onClick={() => startEdit(client)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-ghost btn-small"
                        type="button"
                        onClick={() => void toggleActive(client)}
                      >
                        {client.isActive ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        type="button"
                        onClick={() => void onDelete(client)}
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
