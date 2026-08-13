import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiClientError } from "../../../shared/api/http";
import { useApi, useCan } from "../../../shared/api/use-api";
import type {
  Client,
  ClientWeek,
  CutSettlementMetrics,
  Snapshot,
  WeekClosePreview,
  WeeklySettlementSnapshotPayload,
} from "../../../shared/types/domain";
import {
  clientWeekStatusLabel,
  formatMxn,
} from "../../../shared/i18n/labels";
import { listClients } from "../../clients/infrastructure/clients-api";
import {
  closeClientWeek,
  getCurrentSnapshot,
  getOpenClientWeek,
  listClientWeeks,
  openClientWeek,
  previewCloseClientWeek,
  reopenClientWeek,
} from "../infrastructure/client-weeks-api";

function isSnapshotPayload(
  payload: Snapshot["payload"],
): payload is WeeklySettlementSnapshotPayload {
  return (
    typeof payload === "object" &&
    payload != null &&
    "weeklyBillableQuantity" in payload &&
    "cuts" in payload
  );
}

function CutsSettlementTable({
  cuts,
  title,
}: {
  cuts: CutSettlementMetrics[];
  title: string;
}) {
  if (cuts.length === 0) {
    return <p className="muted">Sin cortes en el periodo</p>;
  }

  return (
    <div className="table-wrap">
      <h3>{title}</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Corte</th>
            <th>Recibido</th>
            <th>Entregado</th>
            <th>Merma</th>
            <th>Sobrante línea</th>
            <th>En compostura</th>
            <th>Sin asignar</th>
            <th>Pendiente</th>
            <th>Cuadrado</th>
            <th>Motivos</th>
          </tr>
        </thead>
        <tbody>
          {cuts.map((cut) => (
            <tr key={cut.cutId} className={cut.squared ? undefined : "row-muted"}>
              <td>{cut.cutNumber}</td>
              <td>{cut.totalReceivedByCut.toLocaleString("es-MX")}</td>
              <td>{cut.deliveredByCut.toLocaleString("es-MX")}</td>
              <td>{cut.shrinkageByCut.toLocaleString("es-MX")}</td>
              <td>{cut.lineSurplusByCut.toLocaleString("es-MX")}</td>
              <td>{cut.inRepairByCut.toLocaleString("es-MX")}</td>
              <td>{cut.unassignedByCut.toLocaleString("es-MX")}</td>
              <td>{cut.pendingByCut.toLocaleString("es-MX")}</td>
              <td>
                <span className={cut.squared ? "badge ok" : "badge off"}>
                  {cut.squared ? "Sí" : "No"}
                </span>
              </td>
              <td>{cut.reasons.length ? cut.reasons.join("; ") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClientWeeksPage() {
  const api = useApi();
  const [searchParams] = useSearchParams();
  const canRead = useCan("clients.read", "orders.read");
  const canWrite = useCan("clients.write");

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(searchParams.get("clientId") ?? "");
  const [weeks, setWeeks] = useState<ClientWeek[]>([]);
  const [openWeek, setOpenWeek] = useState<ClientWeek | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [preview, setPreview] = useState<WeekClosePreview | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [conflictCuts, setConflictCuts] = useState<CutSettlementMetrics[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const selectedWeek =
    weeks.find((w) => w.id === selectedWeekId) ??
    (openWeek && openWeek.id === selectedWeekId ? openWeek : null);

  const loadClients = useCallback(async () => {
    try {
      const page = await listClients(api, { activeOnly: true, pageSize: 100 });
      setClients(page.items);
      setClientId((prev) => prev || page.items[0]?.id || "");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Error al cargar clientes");
    }
  }, [api]);

  const loadWeeks = useCallback(
    async (id: string) => {
      if (!id) return;
      setLoading(true);
      setError(null);
      setPreview(null);
      setSnapshot(null);
      setConflictCuts(null);
      try {
        const [list, open] = await Promise.all([
          listClientWeeks(api, id),
          getOpenClientWeek(api, id),
        ]);
        setWeeks(list);
        setOpenWeek(open);
        const nextSelected =
          open?.id ??
          list.find((w) => w.status === "CLOSED")?.id ??
          list[0]?.id ??
          null;
        setSelectedWeekId(nextSelected);

        if (open) {
          // keep preview cleared until user asks
        } else if (nextSelected) {
          const current = await getCurrentSnapshot(api, nextSelected).catch(() => null);
          setSnapshot(current);
        }
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Error al cargar semanas");
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    const fromUrl = searchParams.get("clientId");
    if (fromUrl) setClientId(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (clientId) void loadWeeks(clientId);
  }, [clientId, loadWeeks]);

  useEffect(() => {
    if (!selectedWeekId || !selectedWeek) return;
    if (selectedWeek.status !== "CLOSED") {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const current = await getCurrentSnapshot(api, selectedWeekId);
        if (!cancelled) setSnapshot(current);
      } catch {
        if (!cancelled) setSnapshot(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, selectedWeekId, selectedWeek?.status]);

  async function onOpenWeek() {
    if (!canWrite || !clientId) return;
    setBusy(true);
    setError(null);
    try {
      await openClientWeek(api, clientId);
      await loadWeeks(clientId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo abrir la semana");
    } finally {
      setBusy(false);
    }
  }

  async function onPreview() {
    if (!openWeek) return;
    setBusy(true);
    setError(null);
    setConflictCuts(null);
    try {
      const result = await previewCloseClientWeek(api, openWeek.id);
      setPreview(result);
      setSelectedWeekId(openWeek.id);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "No se pudo previsualizar",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onClose() {
    if (!canWrite || !openWeek) return;
    setBusy(true);
    setError(null);
    setConflictCuts(null);
    try {
      await closeClientWeek(api, openWeek.id);
      setPreview(null);
      await loadWeeks(clientId);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        const details = err.details as
          | { unsquaredCuts?: CutSettlementMetrics[]; cuts?: CutSettlementMetrics[] }
          | undefined;
        if (details?.unsquaredCuts?.length) {
          setConflictCuts(details.unsquaredCuts);
        } else if (details?.cuts?.length) {
          setConflictCuts(details.cuts.filter((c) => !c.squared));
        }
        if (details?.cuts) {
          setPreview({
            clientWeekId: openWeek.id,
            canClose: false,
            cuts: details.cuts,
            unsquaredCuts: details.unsquaredCuts ?? details.cuts.filter((c) => !c.squared),
            weeklyBillableQuantity: 0,
            weeklyBillableAmount: "0",
          });
        }
      } else {
        setError("No se pudo cerrar la semana");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onReopen() {
    if (!canWrite || !selectedWeek || selectedWeek.status !== "CLOSED") return;
    if (
      !window.confirm(
        `¿Reabrir la semana del ${selectedWeek.startDate}${
          selectedWeek.endDate ? ` al ${selectedWeek.endDate}` : ""
        }? Se invalidará el snapshot vigente.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await reopenClientWeek(api, selectedWeek.id);
      setSnapshot(null);
      await loadWeeks(clientId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo reabrir");
    } finally {
      setBusy(false);
    }
  }

  if (!canRead) {
    return (
      <section className="page">
        <p className="error">Sin permiso para ver el cuadre semanal</p>
      </section>
    );
  }

  const payload =
    snapshot && isSnapshotPayload(snapshot.payload) ? snapshot.payload : null;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Cuadre semanal</h1>
          <p className="muted">Apertura, previsualización y cierre por cliente</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="toolbar">
        <label className="field" style={{ margin: 0, minWidth: 0, flex: "1 1 220px" }}>
          <span>Cliente</span>
          <select
            className="input"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            {clients.length === 0 ? (
              <option value="">Sin clientes</option>
            ) : (
              clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="muted">Cargando…</p>
      ) : (
        <>
          <div className="panel">
            <h2>Semana abierta</h2>
            {openWeek ? (
              <>
                <p>
                  Del <strong>{openWeek.startDate}</strong>
                  {openWeek.endDate ? (
                    <>
                      {" "}
                      al <strong>{openWeek.endDate}</strong>
                    </>
                  ) : (
                    " (sin fecha de cierre)"
                  )}{" "}
                  · Abierta el{" "}
                  {new Date(openWeek.openedAt).toLocaleString("es-MX")}
                </p>
                <div className="actions-row">
                  <button
                    className="btn btn-ghost btn-inline"
                    type="button"
                    disabled={busy}
                    onClick={() => void onPreview()}
                  >
                    Previsualizar cierre
                  </button>
                  <button
                    className="btn btn-primary btn-inline"
                    type="button"
                    disabled={busy || !preview?.canClose}
                    onClick={() => void onClose()}
                  >
                    Cerrar semana
                  </button>
                </div>
                {preview && !preview.canClose ? (
                  <p className="error">
                    No se puede cerrar: hay cortes sin cuadrar.
                  </p>
                ) : null}
                {!preview ? (
                  <p className="muted">
                    Previsualiza el cierre para habilitar el botón de cerrar.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="muted">No hay semana OPEN para este cliente.</p>
                {canWrite ? (
                  <button
                    className="btn btn-primary btn-inline"
                    type="button"
                    disabled={busy || !clientId}
                    onClick={() => void onOpenWeek()}
                  >
                    Abrir semana
                  </button>
                ) : null}
              </>
            )}
          </div>

          {preview && openWeek && selectedWeekId === openWeek.id ? (
            <div className="panel">
              <h2>Previsualización de cierre</h2>
              <p className="muted">
                Facturable: {preview.weeklyBillableQuantity.toLocaleString("es-MX")}{" "}
                prendas · {formatMxn(preview.weeklyBillableAmount)} ·{" "}
                {preview.canClose ? "Lista para cerrar" : "Pendiente de cuadrar"}
              </p>
              <CutsSettlementTable cuts={preview.cuts} title="Cortes del periodo" />
              {preview.unsquaredCuts.length > 0 ? (
                <CutsSettlementTable
                  cuts={preview.unsquaredCuts}
                  title="Cortes sin cuadrar"
                />
              ) : null}
            </div>
          ) : null}

          {conflictCuts && conflictCuts.length > 0 ? (
            <div className="panel">
              <h2>Detalle del conflicto</h2>
              <CutsSettlementTable cuts={conflictCuts} title="Cortes en conflicto" />
            </div>
          ) : null}

          {selectedWeek?.status === "CLOSED" ? (
            <div className="panel">
              <h2>Snapshot vigente</h2>
              {snapshot && payload ? (
                <>
                  <p className="muted">
                    Versión {snapshot.version} · Cerrado el{" "}
                    {new Date(snapshot.closedAt).toLocaleString("es-MX")} · Periodo{" "}
                    {payload.startDate} – {payload.endDate}
                  </p>
                  <p>
                    Facturable:{" "}
                    {payload.weeklyBillableQuantity.toLocaleString("es-MX")} prendas ·{" "}
                    {formatMxn(payload.weeklyBillableAmount)}
                  </p>
                  <CutsSettlementTable cuts={payload.cuts} title="Resumen de cortes" />
                  {canWrite ? (
                    <button
                      className="btn btn-ghost btn-inline"
                      type="button"
                      disabled={busy || Boolean(openWeek)}
                      onClick={() => void onReopen()}
                    >
                      Reabrir semana
                    </button>
                  ) : null}
                  {openWeek ? (
                    <p className="muted">
                      No se puede reabrir mientras exista otra semana OPEN.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="muted">Sin snapshot CURRENT para esta semana.</p>
              )}
            </div>
          ) : null}

          <div className="panel table-wrap">
            <h2>Historial de semanas</h2>
            {weeks.length === 0 ? (
              <p className="muted">Sin semanas registradas</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th>Abierta</th>
                    <th>Cerrada</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week) => (
                    <tr
                      key={week.id}
                      className={
                        selectedWeekId === week.id ? "row-editing" : undefined
                      }
                    >
                      <td>{week.startDate}</td>
                      <td>{week.endDate ?? "—"}</td>
                      <td>
                        <span
                          className={
                            week.status === "OPEN" ? "badge ok" : "badge"
                          }
                        >
                          {clientWeekStatusLabel(week.status)}
                        </span>
                      </td>
                      <td>
                        {new Date(week.openedAt).toLocaleDateString("es-MX")}
                      </td>
                      <td>
                        {week.closedAt
                          ? new Date(week.closedAt).toLocaleDateString("es-MX")
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-small"
                          type="button"
                          onClick={() => {
                            setSelectedWeekId(week.id);
                            setConflictCuts(null);
                            if (week.status === "OPEN" && preview?.clientWeekId === week.id) {
                              // keep preview
                            } else if (week.status === "OPEN") {
                              setPreview(null);
                            }
                          }}
                        >
                          Ver
                        </button>
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
