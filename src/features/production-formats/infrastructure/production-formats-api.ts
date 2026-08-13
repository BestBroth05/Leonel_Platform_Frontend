import type {
  Cut,
  CutOrderAssignment,
  CutReceipt,
  Order,
  Paginated,
  ProductionFormat,
} from "../../../shared/types/domain";
import type { useApi } from "../../../shared/api/use-api";

type Api = ReturnType<typeof useApi>;

export function listProductionFormats(api: Api, params: { q?: string; page?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();
  return api.get<Paginated<ProductionFormat>>(
    `/production-formats${qs ? `?${qs}` : ""}`,
  );
}

export function getProductionFormat(api: Api, id: string) {
  return api.get<ProductionFormat>(`/production-formats/${id}`);
}

export function createProductionFormat(
  api: Api,
  body: { number: string; clientId: string },
) {
  return api.post<ProductionFormat>("/production-formats", body);
}

export function updateProductionFormat(
  api: Api,
  id: string,
  body: { number?: string; clientId?: string },
) {
  return api.patch<ProductionFormat>(`/production-formats/${id}`, body);
}

export function listCuts(api: Api, formatId: string) {
  return api.get<Cut[]>(`/production-formats/${formatId}/cuts`);
}

export function createCut(
  api: Api,
  formatId: string,
  body: {
    number: string;
    workPlan: string;
    style: string;
    expectedQuantity: number;
  },
) {
  return api.post<Cut>(`/production-formats/${formatId}/cuts`, body);
}

export function getCut(api: Api, id: string) {
  return api.get<Cut>(`/cuts/${id}`);
}

export function listCutOrders(api: Api, cutId: string) {
  return api.get<CutOrderAssignment[]>(`/cuts/${cutId}/orders`);
}

export function updateCut(
  api: Api,
  id: string,
  body: {
    number?: string;
    workPlan?: string;
    style?: string;
    expectedQuantity?: number;
  },
) {
  return api.patch<Cut>(`/cuts/${id}`, body);
}

export function listCutReceipts(api: Api, cutId: string) {
  return api.get<CutReceipt[]>(`/cuts/${cutId}/receipts`);
}

export function createCutReceipt(
  api: Api,
  cutId: string,
  body: {
    folioNumber: string;
    quantity: number;
    receivedAt?: string;
    notes?: string | null;
  },
) {
  return api.post<CutReceipt>(`/cuts/${cutId}/receipts`, body);
}

export function updateCutReceipt(
  api: Api,
  id: string,
  body: {
    folioNumber?: string;
    quantity?: number;
    receivedAt?: string;
    notes?: string | null;
  },
) {
  return api.patch<CutReceipt>(`/cut-receipts/${id}`, body);
}

export function deleteCutReceipt(api: Api, id: string) {
  return api.delete<{ ok: boolean }>(`/cut-receipts/${id}`);
}

export function listFormatOrders(
  api: Api,
  formatId: string,
  params: { q?: string; page?: number } = {},
) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  const qs = search.toString();
  return api.get<Paginated<Order>>(
    `/production-formats/${formatId}/orders${qs ? `?${qs}` : ""}`,
  );
}
