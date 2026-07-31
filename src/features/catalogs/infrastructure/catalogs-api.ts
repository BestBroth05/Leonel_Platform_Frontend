import type { CatalogItem, CatalogKind } from "../../../shared/types/domain";
import type { useApi } from "../../../shared/api/use-api";

type Api = ReturnType<typeof useApi>;

export function listCatalog(api: Api, kind: CatalogKind, activeOnly = false) {
  const qs = activeOnly ? "?activeOnly=true" : "";
  return api.get<CatalogItem[]>(`/catalogs/${kind}${qs}`);
}

export function createCatalogItem(api: Api, kind: CatalogKind, name: string) {
  return api.post<CatalogItem>(`/catalogs/${kind}`, { name });
}

export function updateCatalogItem(
  api: Api,
  kind: CatalogKind,
  id: string,
  body: { name?: string; isActive?: boolean },
) {
  return api.patch<CatalogItem>(`/catalogs/${kind}/${id}`, body);
}
