import type {
  ClientWeek,
  Snapshot,
  WeekClosePreview,
} from "../../../shared/types/domain";
import type { useApi } from "../../../shared/api/use-api";

type Api = ReturnType<typeof useApi>;

export function listClientWeeks(api: Api, clientId: string) {
  return api.get<ClientWeek[]>(`/clients/${clientId}/weeks`);
}

export function getOpenClientWeek(api: Api, clientId: string) {
  return api.get<ClientWeek | null>(`/clients/${clientId}/weeks/open`);
}

export function openClientWeek(
  api: Api,
  clientId: string,
  body: { startDate?: string } = {},
) {
  return api.post<ClientWeek>(`/clients/${clientId}/weeks/open`, body);
}

export function getClientWeek(api: Api, weekId: string) {
  return api.get<ClientWeek>(`/client-weeks/${weekId}`);
}

export function previewCloseClientWeek(api: Api, weekId: string) {
  return api.get<WeekClosePreview>(`/client-weeks/${weekId}/close-preview`);
}

export function closeClientWeek(api: Api, weekId: string) {
  return api.post<{
    week: ClientWeek;
    snapshot: Snapshot;
    preview: WeekClosePreview;
  }>(`/client-weeks/${weekId}/close`);
}

export function reopenClientWeek(api: Api, weekId: string) {
  return api.post<ClientWeek>(`/client-weeks/${weekId}/reopen`);
}

export function listClientWeekSnapshots(api: Api, weekId: string) {
  return api.get<Snapshot[]>(`/client-weeks/${weekId}/snapshots`);
}

export function getCurrentSnapshot(api: Api, weekId: string) {
  return api.get<Snapshot | null>(`/client-weeks/${weekId}/snapshots/current`);
}
