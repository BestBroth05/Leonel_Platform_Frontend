import type { AuthUser, LoginResponse } from "../../../shared/types/auth";
import { apiRequest } from "../../../shared/api/http";

export function loginRequest(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refreshRequest(refreshToken: string) {
  return apiRequest<LoginResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function logoutRequest(refreshToken?: string) {
  return apiRequest<{ ok: boolean }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function meRequest(accessToken: string) {
  return apiRequest<AuthUser>("/auth/me", {
    method: "GET",
    accessToken,
  });
}
