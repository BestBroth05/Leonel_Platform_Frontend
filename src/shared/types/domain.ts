export const ORDER_STATUSES = [
  "DRAFT",
  "RECEIVING",
  "IN_PROCESS",
  "PARTIALLY_SHIPPED",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const MOVEMENT_TYPES = [
  "RECEPTION",
  "ADDITIONAL_ENTRY",
  "RECEPTION_SHORTAGE",
  "SEND_TO_REPAIR",
  "RETURN_FROM_REPAIR",
  "SHRINKAGE",
  "PARTIAL_EXIT",
  "FINAL_EXIT",
  "CORRECTION",
  "CANCELLATION",
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type Client = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  rfc: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogKind = "brands" | "pant-types" | "destinations";

export type Order = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  brandId: string | null;
  brandName: string | null;
  pantTypeId: string | null;
  pantTypeName: string | null;
  expectedQuantity: number;
  status: OrderStatus;
  notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderBalance = {
  expectedQuantity: number;
  received: number;
  inRepair: number;
  shrinkage: number;
  shipped: number;
  available: number;
  shortage: number;
};

export type Movement = {
  id: string;
  orderId: string;
  type: MovementType;
  quantity: number;
  note: string | null;
  destinationId: string | null;
  cancelsMovementId: string | null;
  idempotencyKey: string | null;
  cancelledAt: string | null;
  createdAt: string;
  createdBy: string | null;
};

export type StatusHistoryItem = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  actorUserId: string | null;
  createdAt: string;
};
