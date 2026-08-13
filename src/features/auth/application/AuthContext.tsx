import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "../../../shared/types/auth";
import { ApiClientError, apiRequest } from "../../../shared/api/http";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
} from "../infrastructure/auth-api";

type Session = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Authenticated API call with automatic token refresh + one retry on 401 */
  authorizedRequest: <T>(path: string, init?: RequestInit) => Promise<T>;
};

const STORAGE_KEY = "leonel-platform.session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(session);
  const refreshInFlight = useRef<Promise<Session> | null>(null);

  const persist = useCallback((next: Session | null) => {
    sessionRef.current = next;
    setSession(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<Session> => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }

    const promise = (async () => {
      const current = sessionRef.current ?? readStoredSession();
      if (!current?.refreshToken) {
        throw new ApiClientError("Sesión expirada", 401, "UNAUTHORIZED");
      }

      const refreshed = await refreshRequest(current.refreshToken);
      const next: Session = {
        user: refreshed.user,
        accessToken: refreshed.tokens.accessToken,
        refreshToken: refreshed.tokens.refreshToken,
      };
      persist(next);
      return next;
    })().finally(() => {
      refreshInFlight.current = null;
    });

    refreshInFlight.current = promise;
    return promise;
  }, [persist]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = readStoredSession();
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const user = await meRequest(stored.accessToken);
        if (!cancelled) {
          persist({ ...stored, user });
        }
      } catch {
        try {
          const refreshed = await refreshRequest(stored.refreshToken);
          if (!cancelled) {
            persist({
              user: refreshed.user,
              accessToken: refreshed.tokens.accessToken,
              refreshToken: refreshed.tokens.refreshToken,
            });
          }
        } catch {
          if (!cancelled) {
            persist(null);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [persist]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginRequest(email, password);
      persist({
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });
    },
    [persist],
  );

  const logout = useCallback(async () => {
    const refreshToken = sessionRef.current?.refreshToken;
    persist(null);
    try {
      await logoutRequest(refreshToken);
    } catch {
      // ignore network errors on logout
    }
  }, [persist]);

  const authorizedRequest = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const current = sessionRef.current ?? readStoredSession();
      if (!current?.accessToken) {
        throw new ApiClientError("Sin sesión", 401, "UNAUTHORIZED");
      }

      try {
        return await apiRequest<T>(path, {
          ...init,
          accessToken: current.accessToken,
        });
      } catch (err) {
        const isUnauthorized =
          err instanceof ApiClientError &&
          (err.status === 401 || err.code === "UNAUTHORIZED");
        if (!isUnauthorized) {
          throw err;
        }

        try {
          const next = await refreshSession();
          return await apiRequest<T>(path, {
            ...init,
            accessToken: next.accessToken,
          });
        } catch (refreshErr) {
          persist(null);
          throw refreshErr instanceof ApiClientError
            ? refreshErr
            : new ApiClientError("Sesión expirada. Vuelve a iniciar sesión.", 401);
        }
      }
    },
    [persist, refreshSession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      loading,
      login,
      logout,
      authorizedRequest,
    }),
    [session, loading, login, logout, authorizedRequest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
