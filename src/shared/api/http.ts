// Relative (/api) works on phone via LAN IP; absolute URL for direct API access.
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.accessToken) {
    headers.set("Authorization", `Bearer ${init.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string; details?: unknown };
  };

  if (!response.ok) {
    throw new ApiClientError(
      data.error?.message ?? "Error de API",
      response.status,
      data.error?.code,
      data.error?.details,
    );
  }

  return data as T;
}

export function getApiUrl() {
  return API_URL;
}
