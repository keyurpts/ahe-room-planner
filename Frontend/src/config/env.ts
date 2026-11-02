import { parseApiUrl } from "./helpers/parseApiUrl";
import { parseBoolean } from "./helpers/parseBoolean";
import { parseEnvironment } from "./helpers/parseEnvironment";


// App Environment
const appEnvironment = parseEnvironment(import.meta.env.VITE_APP_ENV);

// App Analytics
const analyticsEnabled = parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS);
const rawAnalyticsId = import.meta.env.VITE_ANALYTICS_ID?.trim();
const analyticsId = rawAnalyticsId === '' ? undefined : rawAnalyticsId;
if (analyticsEnabled && !analyticsId)
  throw new Error('VITE_ANALYTICS_ID is required when analytics is enabled.');

// Region Id
const rawRegionId = import.meta.env.VITE_REGION_ID?.trim();
const regionId = rawRegionId === '' ? null : (rawRegionId ?? null);
if (regionId && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(regionId))
  throw new Error('VITE_REGION_ID must be a UUID.');


// userlogin for development
const developmentLoginEmail = import.meta.env.VITE_DEV_LOGIN_EMAIL?.trim();
const developmentLoginPassword = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
if (appEnvironment === 'development' && Boolean(developmentLoginEmail) !== Boolean(developmentLoginPassword))
  throw new Error('VITE_DEV_LOGIN_EMAIL and VITE_DEV_LOGIN_PASSWORD must be set together.');
const developmentLogin =
  appEnvironment === 'development' && developmentLoginEmail && developmentLoginPassword
    ? Object.freeze({ email: developmentLoginEmail, password: developmentLoginPassword })
    : undefined;

export const env = Object.freeze({
  appEnvironment,
  apiBaseUrl: parseApiUrl(import.meta.env.VITE_API_BASE_URL),
  features: Object.freeze({ analyticsEnabled }),
  analyticsId,
  regionId,
  developmentLogin,
});
