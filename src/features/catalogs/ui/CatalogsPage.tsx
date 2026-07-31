import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import type { CatalogItem, CatalogKind } from "../../../shared/types/domain";
import {
  createCatalogItem,
  listCatalog,
  updateCatalogItem,
} from "../infrastructure/catalogs-api";

const TABS: { kind: CatalogKind; label: string }[] = [
  { kind: "brands", label: "Marcas" },
  { kind: "pant-types", label: "Tipos" },
  { kind: "destinations", label: "Destinos" },
];

export function CatalogsPage() {
  const api = useApi();
  const canWrite = useCan("catalogs.write");
  const [kind, setKind] = useState<CatalogKind>("brands");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listCatalog(api, kind));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [api, kind]);

  useEffect(() => {
    cancelEdit();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  function startEdit(item: CatalogItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setError(null);
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      await createCatalogItem(api, kind, name.trim());
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo crear");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || !editingId) return;
    setSaving(true);
    setError(null);
    try {
      await updateCatalogItem(api, kind, editingId, { name: editName.trim() });
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: CatalogItem) {
    if (!canWrite) return;
    try {
      await updateCatalogItem(api, kind, item.id, { isActive: !item.isActive });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar");
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Catálogos</h1>
          <p className="muted">Marcas, tipos de pantalón y destinos</p>
        </div>
      </header>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            className={kind === tab.kind ? "tab active" : "tab"}
            onClick={() => setKind(tab.kind)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <p className="error">{error}</p> : null}

      {canWrite ? (
        <form className="panel form-inline" onSubmit={onCreate}>
          <label className="field grow">
            <span>Nombre nuevo</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-primary btn-inline" type="submit" disabled={saving && !editingId}>
            {saving && !editingId ? "…" : "Agregar"}
          </button>
        </form>
      ) : null}

      {canWrite && editingId ? (
        <form className="panel form-inline" onSubmit={saveEdit}>
          <label className="field grow">
            <span>Editar nombre</span>
            <input
              className="input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-primary btn-inline" type="submit" disabled={saving}>
            {saving ? "…" : "Guardar"}
          </button>
          <button className="btn btn-ghost btn-inline" type="button" onClick={cancelEdit}>
            Cancelar
          </button>
        </form>
      ) : null}

      <div className="panel table-wrap">
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="muted">Sin registros</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                {canWrite ? <th>Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={editingId === item.id ? "row-editing" : undefined}>
                  <td>{item.name}</td>
                  <td>
                    <span className={item.isActive ? "badge ok" : "badge off"}>
                      {item.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {canWrite ? (
                    <td className="actions-cell">
                      <button
                        className="btn btn-ghost btn-small"
                        type="button"
                        onClick={() => startEdit(item)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-ghost btn-small"
                        type="button"
                        onClick={() => void toggleActive(item)}
                      >
                        {item.isActive ? "Desactivar" : "Activar"}
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
