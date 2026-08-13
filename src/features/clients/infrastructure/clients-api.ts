import type { Client, Paginated, Weekday } from "../../../shared/types/domain";
import type { useApi } from "../../../shared/api/use-api";

type Api = ReturnType<typeof useApi>;

export function listClients(
  api: Api,
  params: { q?: string; page?: number; pageSize?: number; activeOnly?: boolean } = {},
) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.activeOnly) search.set("activeOnly", "true");
  const qs = search.toString();
  return api.get<Paginated<Client>>(`/clients${qs ? `?${qs}` : ""}`);
}

export function getClient(api: Api, id: string) {
  return api.get<Client>(`/clients/${id}`);
}

export function createClient(
  api: Api,
  body: {
    name: string;
    contactName?: string;
    email?: string;
    rfc?: string;
    notes?: string;
    weekOpensOn?: Weekday | null;
    weekClosesOn?: Weekday | null;
  },
) {
  return api.post<Client>("/clients", body);
}

export function updateClient(
  api: Api,
  id: string,
  body: Partial<{
    name: string;
    contactName: string | null;
    email: string | null;
    rfc: string | null;
    notes: string | null;
    weekOpensOn: Weekday | null;
    weekClosesOn: Weekday | null;
    isActive: boolean;
  }>,
) {
  return api.patch<Client>(`/clients/${id}`, body);
}
