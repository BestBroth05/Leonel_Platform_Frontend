import { useCallback, useMemo } from "react";
import { useAuth } from "../../features/auth/application/AuthContext";
import { apiRequest } from "./http";

export function useApi() {
  const { accessToken } = useAuth();

  const request = useCallback(
    <T,>(path: string, init: RequestInit = {}) => {
      if (!accessToken) {
        return Promise.reject(new Error("Sin sesión"));
      }
      return apiRequest<T>(path, { ...init, accessToken });
    },
    [accessToken],
  );

  return useMemo(
    () => ({
      get: <T,>(path: string) => request<T>(path),
      post: <T,>(path: string, body?: unknown, headers?: HeadersInit) =>
        request<T>(path, {
          method: "POST",
          body: body === undefined ? undefined : JSON.stringify(body),
          headers,
        }),
      patch: <T,>(path: string, body: unknown) =>
        request<T>(path, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
    }),
    [request],
  );
}

export function useCan(...permissions: string[]) {
  const { user } = useAuth();
  const granted = user?.permissions ?? [];
  return permissions.some((p) => granted.includes(p));
}
