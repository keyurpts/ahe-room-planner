type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

function parseEnvironment(value: string | undefined): AppEnvironment {
  switch (value) {
    case 'development':
    case 'test':
    case 'staging':
    case 'production':
      return value;
    default:
      throw new Error('VITE_APP_ENV must be development, test, staging, or production.');
  }
}

function parseApiUrl(value: string | undefined): string | undefined {
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

function parseBoolean(value: string | undefined): boolean {
  if (value === undefined || value === '' || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error('VITE_ENABLE_ANALYTICS must be true or false.');
}

const analyticsEnabled = parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS);
const rawRegionId = import.meta.env.VITE_REGION_ID?.trim();
const regionId = rawRegionId === '' ? null : (rawRegionId ?? null);
if (regionId && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(regionId))
  throw new Error('VITE_REGION_ID must be a UUID.');
const rawAnalyticsId = import.meta.env.VITE_ANALYTICS_ID?.trim();
const analyticsId = rawAnalyticsId === '' ? undefined : rawAnalyticsId;
if (analyticsEnabled && !analyticsId)
  throw new Error('VITE_ANALYTICS_ID is required when analytics is enabled.');

export const env = Object.freeze({
  appEnvironment: parseEnvironment(import.meta.env.VITE_APP_ENV),
  apiBaseUrl: parseApiUrl(import.meta.env.VITE_API_BASE_URL),
  features: Object.freeze({ analyticsEnabled }),
  analyticsId,
  regionId,
});
