import type { MovementType, OrderStatus } from "../types/domain";
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
  CORRECTION: "Corrección",
  CANCELLATION: "Cancelación",
};

export const ROLE_LABELS: Record<RoleSlug, string> = {
  admin: "Administrador",
  manager: "Encargado",
  viewer: "Consulta",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function movementTypeLabel(type: string): string {
  return MOVEMENT_TYPE_LABELS[type as MovementType] ?? type;
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
