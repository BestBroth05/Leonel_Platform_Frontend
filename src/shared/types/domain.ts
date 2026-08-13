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
  "SOBRANTE_LINEA",
  "CORRECTION",
  "CANCELLATION",
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const CUT_STATUSES = ["PENDING", "PARTIAL", "COMPLETE", "SURPLUS"] as const;
export type CutStatus = (typeof CUT_STATUSES)[number];

export const CLIENT_WEEK_STATUSES = ["OPEN", "CLOSED"] as const;
export type ClientWeekStatus = (typeof CLIENT_WEEK_STATUSES)[number];

export const SNAPSHOT_STATUSES = ["CURRENT", "INVALIDATED"] as const;
export type SnapshotStatus = (typeof SNAPSHOT_STATUSES)[number];

export const PACKAGING_TYPES = ["BOX", "DOZEN", "UNIT"] as const;
export type PackagingType = (typeof PACKAGING_TYPES)[number];

export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type Client = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  rfc: string | null;
  notes: string | null;
  weekOpensOn: Weekday | null;
  weekClosesOn: Weekday | null;
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

export type ProductionFormat = {
  id: string;
  number: string;
  clientId: string | null;
  clientName: string | null;
  cutsCount: number;
  ordersCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Cut = {
  id: string;
  productionFormatId: string;
  number: string;
  workPlan: string;
  style: string;
  expectedQuantity: number;
  totalReceived: number;
  totalAssigned: number;
  availableToAssign: number;
  pendingQuantity: number;
  partialsCount: number;
  status: CutStatus;
  createdAt: string;
  updatedAt: string;
};

export type CutReceipt = {
  id: string;
  cutId: string;
  clientWeekId: string | null;
  folioNumber: string;
  partialNumber: number;
  quantity: number;
  receivedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CutOrderAssignment = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  assignedQuantity: number;
};

export type OrderCutAssignment = {
  id: string;
  cutId: string;
  cutNumber: string;
  cutStyle: string;
  cutWorkPlan: string;
  assignedQuantity: number;
};

export type SizeBreakdown = {
  sizeLabel: string;
  quantity: number;
};

export type Order = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  brandId: string | null;
  brandName: string | null;
  pantTypeId: string | null;
  pantTypeName: string | null;
  productionFormatId: string | null;
  productionFormatNumber: string | null;
  cuts: OrderCutAssignment[];
  orderQuantity: number;
  assignedQuantity: number;
  expectedQuantity: number;
  purchaseOrder: string | null;
  costPerGarment: string | null;
  estimatedAmount: string | null;
  packagingType: PackagingType | null;
  packageCount: number | null;
  unitsPerPackage: number | null;
  createdInClientWeekId: string | null;
  sizes: SizeBreakdown[];
  status: OrderStatus;
  notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderBalance = {
  assignedQuantity: number;
  expectedQuantity: number;
  received: number;
  inRepair: number;
  shrinkage: number;
  shipped: number;
  lineSurplus: number;
  available: number;
  shortage: number;
  pendingToAccount: number;
  warnings: string[];
};

export type MovementCutAllocation = {
  orderCutId: string;
  cutId: string;
  quantity: number;
};

export type Movement = {
  id: string;
  orderId: string;
  clientWeekId: string | null;
  type: MovementType;
  quantity: number;
  packagingType: PackagingType | null;
  packageCount: number | null;
  unitsPerPackage: number | null;
  note: string | null;
  destinationId: string | null;
  cancelsMovementId: string | null;
  idempotencyKey: string | null;
  occurredAt: string;
  cancelledAt: string | null;
  createdAt: string;
  createdBy: string | null;
  cutAllocations: MovementCutAllocation[];
  sizes: SizeBreakdown[];
};

export type StatusHistoryItem = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  actorUserId: string | null;
  createdAt: string;
};

export type ClientWeek = {
  id: string;
  clientId: string;
  clientName: string;
  startDate: string;
  endDate: string | null;
  openedAt: string;
  closedAt: string | null;
  status: ClientWeekStatus;
  createdAt: string;
  updatedAt: string;
};

export type CutSettlementMetrics = {
  cutId: string;
  cutNumber: string;
  totalReceivedByCut: number;
  deliveredByCut: number;
  shrinkageByCut: number;
  lineSurplusByCut: number;
  finalizedByCut: number;
  sentToRepairByCut: number;
  returnedFromRepairByCut: number;
  inRepairByCut: number;
  totalAssignedByCut: number;
  unassignedByCut: number;
  pendingByCut: number;
  squared: boolean;
  reasons: string[];
};

export type WeekClosePreview = {
  clientWeekId: string;
  canClose: boolean;
  cuts: CutSettlementMetrics[];
  unsquaredCuts: CutSettlementMetrics[];
  weeklyBillableQuantity: number;
  weeklyBillableAmount: string;
};

export type WeeklySettlementSnapshotPayload = {
  clientWeekId: string;
  clientId: string;
  startDate: string;
  endDate: string;
  cuts: CutSettlementMetrics[];
  weeklyBillableQuantity: number;
  weeklyBillableAmount: string;
  closedAt: string;
};

export type Snapshot = {
  id: string;
  clientWeekId: string;
  version: number;
  status: SnapshotStatus;
  payload: WeeklySettlementSnapshotPayload | Record<string, unknown>;
  closedAt: string;
  closedBy: string | null;
  invalidatedAt: string | null;
  invalidatedBy: string | null;
  createdAt: string;
};
