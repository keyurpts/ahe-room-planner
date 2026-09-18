export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string | number;
}

export interface AuthUser {
  email: string;
  name?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string | number;
  [key: string]: any;
}

const AUTH_STORAGE_KEY = "user_auth";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/**
 * Saves authenticated user session and tokens to localStorage
 */
export function saveAuthSession(user: AuthUser, persist: boolean = true): void {
  try {
    const serialized = JSON.stringify(user);
    if (persist) {
      localStorage.setItem(AUTH_STORAGE_KEY, serialized);
      console.log(user.accessToken);

      if (user.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, user.accessToken);
      if (user.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, user.refreshToken);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, serialized);
      if (user.accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, user.accessToken);
      if (user.refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, user.refreshToken);
    }
  } catch (e) {
    console.error("Failed to store auth session:", e);
  }
}

/**
 * Retrieves the current auth session from storage
 */
export function getStoredAuthSession(): AuthUser | null {
  try {
    const local = localStorage.getItem(AUTH_STORAGE_KEY);
    if (local) return JSON.parse(local);
    const session = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (session) return JSON.parse(session);
    return null;
  } catch {
    return null;
  }
}

/**
 * Gets access token for authenticated API requests
 */
export function getAccessToken(): string | null {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    getStoredAuthSession()?.accessToken ||
    null
  );
}

/**
 * Checks if the access token is expired based on accessTokenExpiresAt
 */
export function isAccessTokenExpired(expiresAt?: string | number): boolean {
  if (!expiresAt) return false;
  const expiryTime = typeof expiresAt === "string" ? new Date(expiresAt).getTime() : expiresAt;
  if (isNaN(expiryTime)) return false;
  // buffer 10 seconds
  return Date.now() >= expiryTime - 10000;
}

/**
 * Clears current auth session and tokens (Log out)
 */
export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
