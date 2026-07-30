import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser } from "../../../shared/types/auth";
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

  const persist = useCallback((next: Session | null) => {
    setSession(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

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
    const refreshToken = session?.refreshToken;
    persist(null);
    try {
      await logoutRequest(refreshToken);
    } catch {
      // ignore network errors on logout
    }
  }, [persist, session?.refreshToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      loading,
      login,
      logout,
    }),
    [session, loading, login, logout],
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
