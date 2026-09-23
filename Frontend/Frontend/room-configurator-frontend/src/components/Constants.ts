export const DETECT_FLOORPLAN_API = "http://localhost:9000/api/v1/detect";
export const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE || "";
export const LOGIN_API = AUTH_API_BASE ? `${AUTH_API_BASE}/api/Auth/login` : "/api/Auth/login";
export const MY_PROJECTS_API = AUTH_API_BASE ? `${AUTH_API_BASE}/api/Projects/my` : "/api/Projects/my";
export const CATEGORIES_API = AUTH_API_BASE ? `${AUTH_API_BASE}/api/Categories` : "/api/Categories";
export const TEXTURES_API = AUTH_API_BASE ? `${AUTH_API_BASE}/api/Textures` : "/api/Textures";

export const getModelsByCategoryApi = (categoryId: string) =>
  AUTH_API_BASE
    ? `${AUTH_API_BASE}/api/Models/category/${categoryId}`
    : `/api/Models/category/${categoryId}`;

export const getStorageDownloadUrlApi = (modelId: string) =>
  AUTH_API_BASE
    ? `${AUTH_API_BASE}/api/storage/${modelId}/download-url`
    : `/api/storage/${modelId}/download-url`;

export const getThumbnailDownloadUrlApi = (
  categoryId: string,
  modelId: string,
  textureId: string
) =>
  AUTH_API_BASE
    ? `${AUTH_API_BASE}/api/storage/thumbnails/${categoryId}/${modelId}/${textureId}/download-url`
    : `/api/storage/thumbnails/${categoryId}/${modelId}/${textureId}/download-url`;

export const getTextureDownloadUrlApi = (textureId: string) =>
  AUTH_API_BASE
    ? `${AUTH_API_BASE}/api/storage/${textureId}/texture/download-url`
    : `/api/storage/${textureId}/texture/download-url`;

export const update2DJSONApi = (projectId: string) =>
  AUTH_API_BASE
    ? `${AUTH_API_BASE}/api/Projects/${projectId}/2d-json`
    : `/api/Projects/${projectId}/2d-json`;

export const update3DJSONApi = (projectId: string) =>
  AUTH_API_BASE
    ? `${AUTH_API_BASE}/api/Projects/${projectId}/3d-json`
    : `/api/Projects/${projectId}/3d-json`;

// AI tools are hidden unless the page is opened with ?ai=true.
// Read once at load; a page reload is required for it to take effect.
export const IS_AI_TOOLS_ENABLED =
  new URLSearchParams(window.location.search).get("ai") === "true";

/**
 * Resolves storage URLs (e.g. Azurite emulator URLs on localhost/127.0.0.1:10000)
 * to relative proxy paths so that browser CORS and Mixed Content issues are avoided.
 */
export const resolveStorageUrl = (url?: string): string => {
  if (!url) return "";
  try {
    if (url.includes("/devstoreaccount1/")) {
      const idx = url.indexOf("/devstoreaccount1/");
      return url.substring(idx);
    }
    const parsed = new URL(url, window.location.origin);
    if (
      parsed.port === "10000" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost"
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    return url;
  }
};
