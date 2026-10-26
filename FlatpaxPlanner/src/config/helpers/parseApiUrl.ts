export function parseApiUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const url = new URL(value);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'VITE_API_BASE_URL must be an HTTP(S) URL without credentials, query, or hash.',
    );
  }
  return url.href.replace(/\/$/, '');
}