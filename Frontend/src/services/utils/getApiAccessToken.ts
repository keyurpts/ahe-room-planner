import { ACCESS_TOKEN_KEY } from "../api/client";

export function getApiAccessToken(): string | undefined {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
}