import type {
  ClientWeekStatus,
  CutStatus,
  MovementType,
  OrderStatus,
  SnapshotStatus,
  Weekday,
} from "../types/domain";
import type { RoleSlug } from "../types/auth";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Borrador",
  RECEIVING: "En recepción",
  IN_PROCESS: "En proceso",
  PARTIALLY_SHIPPED: "Salida parcial",
  COMPLETED: "Completado",
  ON_HOLD: "En pausa",
  CANCELLED: "Cancelado",
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  RECEPTION: "Recepción",
  ADDITIONAL_ENTRY: "Entrada adicional",
  RECEPTION_SHORTAGE: "Faltante de recepción",
  SEND_TO_REPAIR: "Envío a compostura",
  RETURN_FROM_REPAIR: "Regreso de compostura",
  SHRINKAGE: "Merma",
  PARTIAL_EXIT: "Salida parcial",
  FINAL_EXIT: "Salida final",
  SOBRANTE_LINEA: "Sobrante de línea",
  CORRECTION: "Corrección",
  CANCELLATION: "Cancelación",
};

export const CUT_STATUS_LABELS: Record<CutStatus, string> = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  COMPLETE: "Completo",
  SURPLUS: "Excedente",
};

export const ROLE_LABELS: Record<RoleSlug, string> = {
  admin: "Administrador",
  manager: "Encargado",
  viewer: "Consulta",
};

export const CLIENT_WEEK_STATUS_LABELS: Record<ClientWeekStatus, string> = {
  OPEN: "Abierta",
  CLOSED: "Cerrada",
};

export const SNAPSHOT_STATUS_LABELS: Record<SnapshotStatus, string> = {
  CURRENT: "Vigente",
  INVALIDATED: "Invalidado",
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function movementTypeLabel(type: string): string {
  return MOVEMENT_TYPE_LABELS[type as MovementType] ?? type;
}

export function cutStatusLabel(status: string): string {
  return CUT_STATUS_LABELS[status as CutStatus] ?? status;
}

export function clientWeekStatusLabel(status: string): string {
  return CLIENT_WEEK_STATUS_LABELS[status as ClientWeekStatus] ?? status;
}

export function snapshotStatusLabel(status: string): string {
  return SNAPSHOT_STATUS_LABELS[status as SnapshotStatus] ?? status;
}

export function weekdayLabel(day: string | null | undefined): string {
  if (!day) return "—";
  return WEEKDAY_LABELS[day as Weekday] ?? day;
}

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as RoleSlug] ?? role;
}

export function statusTransitionLabel(
  fromStatus: string | null,
  toStatus: string,
): string {
  const from = fromStatus ? orderStatusLabel(fromStatus) : "Inicio";
  return `${from} → ${orderStatusLabel(toStatus)}`;
}

export function formatMxn(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}
