import type {
  Movement,
  MovementType,
  Order,
  OrderBalance,
  OrderStatus,
  Paginated,
  StatusHistoryItem,
} from "../../../shared/types/domain";
import type { useApi } from "../../../shared/api/use-api";

type Api = ReturnType<typeof useApi>;

export function listOrders(
  api: Api,
  params: { q?: string; status?: OrderStatus; page?: number } = {},
) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();
  return api.get<Paginated<Order>>(`/orders${qs ? `?${qs}` : ""}`);
}

export function getOrder(api: Api, id: string) {
  return api.get<Order>(`/orders/${id}`);
}

export function createOrder(
  api: Api,
  body: {
    number: string;
    clientId: string;
    brandId?: string | null;
    pantTypeId?: string | null;
    expectedQuantity: number;
    notes?: string | null;
  },
) {
  return api.post<Order>("/orders", body);
}

export function updateOrder(
  api: Api,
  id: string,
  body: {
    expectedQuantity?: number;
  },
) {
  return api.patch<Order>(`/orders/${id}`, body);
}

export function transitionOrder(
  api: Api,
  id: string,
  status: OrderStatus,
  note?: string,
) {
  return api.post<Order>(`/orders/${id}/transition`, { status, note });
}

export function getOrderBalance(api: Api, id: string) {
  return api.get<{ orderId: string; balance: OrderBalance }>(
    `/orders/${id}/balance`,
  );
}

export function listMovements(api: Api, id: string) {
  return api.get<Movement[]>(`/orders/${id}/movements`);
}

export function createMovement(
  api: Api,
  id: string,
  body: {
    type: MovementType;
    quantity: number;
    note?: string | null;
    destinationId?: string | null;
  },
  idempotencyKey?: string,
) {
  return api.post<{
    movement: Movement;
    balance: OrderBalance;
    replayed: boolean;
  }>(
    `/orders/${id}/movements`,
    body,
    idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  );
}

export function getStatusHistory(api: Api, id: string) {
  return api.get<StatusHistoryItem[]>(`/orders/${id}/status-history`);
}
