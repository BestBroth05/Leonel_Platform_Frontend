/** Minimal auth contracts duplicated from API (no shared package across repos). */

export type RoleSlug = "admin" | "manager" | "viewer";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roleSlug: RoleSlug;
  permissions: string[];
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = {
  user: AuthUser;
  tokens: TokenPair;
};
