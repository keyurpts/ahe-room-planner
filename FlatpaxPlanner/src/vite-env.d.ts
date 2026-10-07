/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REGION_ID: string | undefined;
  readonly VITE_APP_ENV: string | undefined;
  readonly VITE_API_BASE_URL: string | undefined;
  readonly VITE_ENABLE_ANALYTICS: string | undefined;
  readonly VITE_ANALYTICS_ID: string | undefined;
}
