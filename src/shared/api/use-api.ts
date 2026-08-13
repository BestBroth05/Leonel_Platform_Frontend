import { useMemo } from "react";
import { useAuth } from "../../features/auth/application/AuthContext";

export function useApi() {
  const { authorizedRequest } = useAuth();

  return useMemo(
    () => ({
      get: <T,>(path: string) => authorizedRequest<T>(path),
      post: <T,>(path: string, body?: unknown, headers?: HeadersInit) =>
        authorizedRequest<T>(path, {
          method: "POST",
          body: body === undefined ? undefined : JSON.stringify(body),
          headers,
        }),
      patch: <T,>(path: string, body: unknown) =>
        authorizedRequest<T>(path, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      delete: <T,>(path: string) =>
        authorizedRequest<T>(path, {
          method: "DELETE",
        }),
    }),
    [authorizedRequest],
  );
}

export function useCan(...permissions: string[]) {
  const { user } = useAuth();
  const granted = user?.permissions ?? [];
  return permissions.some((p) => granted.includes(p));
}
