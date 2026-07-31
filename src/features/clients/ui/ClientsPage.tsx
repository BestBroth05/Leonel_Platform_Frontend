import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import type { Client } from "../../../shared/types/domain";
import {
  createClient,
  listClients,
  updateClient,
} from "../infrastructure/clients-api";

export function ClientsPage() {
  const api = useApi();
  const canWrite = useCan("clients.write");
  const [items, setItems] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

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
      await createClient(api, { name: name.trim(), phone: phone.trim() || undefined });
      setName("");
      setPhone("");
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
    setEditPhone(client.phone ?? "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !editingId) return;
    setSaving(true);
    setError(null);
    try {
      await updateClient(api, editingId, {
        name: editName.trim(),
        phone: editPhone.trim() || null,
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
            <span>Teléfono</span>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            <span>Teléfono</span>
            <input
              className="input"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
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
                <th>Teléfono</th>
                <th>Estado</th>
                {canWrite ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((client) => (
                <tr key={client.id} className={editingId === client.id ? "row-editing" : undefined}>
                  <td>{client.name}</td>
                  <td>{client.phone ?? "—"}</td>
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
