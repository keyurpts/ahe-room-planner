import { ACCESS_TOKEN_KEY } from "../api/client";

export function setApiAccessToken(token: string | undefined) {
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}