import { env } from '@/config/env';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiNetworkError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiNetworkError';
  }
}

interface ClientOptions {
  baseUrl?: string | undefined;
  timeoutMs?: number;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  fetchImpl?: typeof fetch;
}

interface RequestOptions<T> extends Omit<RequestInit, 'body' | 'signal'> {
  body?: unknown;
  query?: URLSearchParams;
  signal?: AbortSignal;
  timeoutMs?: number;
  parse: (body: unknown) => T;
}

// Decoders keep external data unknown until each feature validates its contract.
export function createApiClient({
  baseUrl,
  timeoutMs = 15_000,
  getAccessToken,
  fetchImpl = fetch,
}: ClientOptions) {
  return {
    async request<T>(path: string, options: RequestOptions<T>): Promise<T> {
      if (!baseUrl)
        throw new Error('API is not configured. Set VITE_API_BASE_URL before making requests.');
      if (
        !path.startsWith('/') ||
        path.startsWith('//') ||
        /[\\?#]/.test(path) ||
        path.split('/').some((segment) => ['.', '..'].includes(segment))
      ) {
        throw new Error('API paths must be root-relative paths without traversal, query, or hash.');
      }
      const {
        body,
        query,
        signal,
        timeoutMs: requestTimeout = timeoutMs,
        parse,
        ...init
      } = options;
      if (!Number.isFinite(requestTimeout) || requestTimeout <= 0)
        throw new Error('API timeout must be positive.');
      const controller = new AbortController();
      const abort = () => {
        controller.abort(signal?.reason);
      };
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => {
        controller.abort(new DOMException('Request timed out', 'TimeoutError'));
      }, requestTimeout);

      try {
        const headers = new Headers(init.headers);
        if (!headers.has('Accept')) headers.set('Accept', 'application/json');
        const token = await getAccessToken?.();
        if (token) headers.set('Authorization', `Bearer ${token}`);
        let serializedBody: string | undefined;
        if (body !== undefined) {
          headers.set('Content-Type', 'application/json');
          serializedBody = JSON.stringify(body);
        }
        const url = new URL(`${baseUrl.replace(/\/$/, '')}${path}`);
        if (query) url.search = query.toString();
        const response = await fetchImpl(url, {
          ...init,
          headers,
          ...(serializedBody !== undefined ? { body: serializedBody } : {}),
          signal: controller.signal,
        });
        const text = await response.text();
        let payload: unknown = text || undefined;
        if (text && response.headers.get('Content-Type')?.includes('json')) {
          try {
            payload = JSON.parse(text) as unknown;
          } catch (cause) {
            if (response.ok) throw new ApiNetworkError('API returned invalid JSON.', { cause });
          }
        }
        if (!response.ok)
          throw new ApiError(
            `Request failed (${String(response.status)}).`,
            response.status,
            payload,
          );
        return parse(payload);
      } catch (error) {
        if (controller.signal.aborted) throw controller.signal.reason;
        if (error instanceof ApiError || error instanceof ApiNetworkError) throw error;
        if (error instanceof TypeError)
          throw new ApiNetworkError('Unable to reach the API.', { cause: error });
        throw error;
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
      }
    },
  };
}

export const apiClient = createApiClient({ baseUrl: env.apiBaseUrl });
