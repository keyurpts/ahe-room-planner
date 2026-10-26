import { apiClient } from '@/services/api/client';
import { setApiAccessToken } from '@/services/utils/setApiAccessToken';

interface DevelopmentLoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
}

function parseLoginResponse(value: unknown): LoginResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid login response.');
  const accessToken = (value as Record<string, unknown>).accessToken;
  if (typeof accessToken !== 'string' || !accessToken.trim())
    throw new Error('Login response is missing an access token.');
  return { accessToken };
}

let pendingLogin: Promise<void> | null = null;

export function loginForDevelopment(credentials: DevelopmentLoginCredentials): Promise<void> {
  
  if (pendingLogin) return pendingLogin;
  
  pendingLogin = apiClient
    .request('/Auth/login', {
      method: 'POST',
      body: credentials,
      parse: parseLoginResponse,
    })
    .then(({ accessToken }) => {
      setApiAccessToken(accessToken);
    });

  return pendingLogin.catch((error: unknown) => {
    pendingLogin = null;
    throw error;
  });
}
