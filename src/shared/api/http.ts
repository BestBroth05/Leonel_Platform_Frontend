// Relative (/api) works on phone via LAN IP; absolute URL for direct API access.
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

/** Free-tier Render can take ~50s to wake; keep timeout above that. */
const REQUEST_TIMEOUT_MS = 70_000;

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

function timeoutSignal(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(id),
  };
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

  const { signal, clear } = timeoutSignal(REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? signal,
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
  } catch (err) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiClientError(
        "El servidor tardó demasiado en responder. En Render free a veces tarda ~1 min en despertar: espera e intenta de nuevo.",
        408,
        "TIMEOUT",
      );
    }
    throw new ApiClientError(
      "No se pudo conectar con el servidor. Revisa tu red o espera a que despierte el API.",
      0,
      "NETWORK_ERROR",
    );
  } finally {
    clear();
  }
}

/** Fire-and-forget wake-up so the first real request is less likely to hang. */
export function warmApi(): void {
  void fetch(`${API_URL}/health`, { method: "GET", cache: "no-store" }).catch(() => {
    // ignore — only used to wake the free-tier host
  });
}

export function getApiUrl() {
  return API_URL;
}
