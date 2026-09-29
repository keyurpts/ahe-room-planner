import { useState, useEffect, useRef, useCallback } from "react";
import { addToast } from "@heroui/react";
import TwoD from "./TwoD";
import { FloorplanManager } from "three-configurator";
import ExistingViewPanel from "./ExistingViewPanel";
import ConfirmationToast from "./ConfirmationToast";
import { TOAST_MESSAGES } from "../toastMessages";
import {
  update2DJSONApi,
  getStorageDownloadUrlApi,
  resolveStorageUrl,
} from "./Constants";
import { getAccessToken } from "../utils/auth";
import { useTheme } from "../ThemeContext";
import { wallPresets, colorPresets, floorPresets } from "../constant";

interface CustomViewPanelProps {
  container3DRef: React.MutableRefObject<HTMLDivElement | null>;
  setIsLeftPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLeftPanelOpen: boolean;
  isConfigUiOpen: boolean;
  setIsConfigUiOpen: React.Dispatch<React.SetStateAction<boolean>>;
  container2DRef: React.MutableRefObject<HTMLDivElement | null>;
  manager: FloorplanManager | null;
  configuratorInstance: any;
  isExistingLayout: boolean;
  onBack: () => void;
  isModelPanelOpen: boolean;
  setIsModelPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout?: () => void;
  selectedProject: any;
}

/**
 * Checks if project3DJson has meaningful data (not null, undefined, or empty object).
 */
function hasValid3DJson(project3DJson: any): boolean {
  if (project3DJson == null) return false;
  if (typeof project3DJson === "string") {
    const trimmed = project3DJson.trim();
    return trimmed !== "" && trimmed !== "{}" && trimmed !== "[]";
  }
  if (typeof project3DJson === "object") {
    return Object.keys(project3DJson).length > 0;
  }
  return false;
}

/**
 * Fetches the signed download URL for a model by modelId from /api/storage/{modelId}/download-url
 */
async function fetchModelDownloadUrl(
  modelId: string,
  cache?: Map<string, Promise<string | null>>
): Promise<string | null> {
  if (!modelId) return null;
  
  if (cache && cache.has(modelId)) {
    return cache.get(modelId)!;
  }

  const fetchPromise = (async () => {
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        Accept: "*/*",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(getStorageDownloadUrlApi(modelId), {
        method: "GET",
        headers,
      });

      if (res.ok) {
        let url = "";
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          url =
            data?.downloadUrl ||
            data?.url ||
            data?.downloadURL ||
            (typeof data === "string"
              ? data
              : data?.data?.downloadUrl || data?.data?.url || data?.data);
        } else {
          const textUrl = await res.text();
          if (
            textUrl &&
            (textUrl.startsWith("http://") ||
              textUrl.startsWith("https://") ||
              textUrl.startsWith("/"))
          ) {
            url = textUrl.trim();
          }
        }

        if (url) {
          return resolveStorageUrl(url);
        }
      } else {
        console.warn(
          `Failed to get signed download URL for model ${modelId} (${res.status})`
        );
      }
    } catch (err) {
      console.warn(`Error fetching storage download URL for model ${modelId}:`, err);
    }
    return null;
  })();

  if (cache) {
    cache.set(modelId, fetchPromise);
  }

  return fetchPromise;
}

/**
 * Fetches roomConfig.json and builds a flat lookup map of model id → { uri, category, name, id, price, format }.
 */
async function fetchRoomConfigLookup(): Promise<Map<string, any>> {
  const lookup = new Map<string, any>();
  try {
    const res = await fetch("/Json/roomConfig.json");
    if (!res.ok) {
      console.warn("Failed to fetch roomConfig.json:", res.status);
      return lookup;
    }
    const roomConfig = await res.json();
    if (roomConfig?.configModels && Array.isArray(roomConfig.configModels)) {
      for (const category of roomConfig.configModels) {
        if (Array.isArray(category.items)) {
          for (const item of category.items) {
            lookup.set(item.id, {
              uri: item.uri,
              category: category.category,
              name: item.name,
              id: item.id,
              price: item.price,
              format: item.format,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error fetching roomConfig.json for enrichment:", err);
  }
  return lookup;
}

async function fetchTextureConfigLookup(): Promise<Map<string, any>> {
  const lookup = new Map<string, any>();

  try {
    const res = await fetch("/Json/roomConfig.json");

    if (!res.ok) {
      console.warn("Failed to fetch roomConfig.json:", res.status);
      return lookup;
    }

    const roomConfig = await res.json();

    if (
      roomConfig?.configTextures &&
      Array.isArray(roomConfig.configTextures)
    ) {
      for (const texture of roomConfig.configTextures) {
        lookup.set(texture.id, {
          textureUrl: texture.previewImage,
          name: texture.name,
          id: texture.id,
          price: texture.price,
          wrapS: texture.wrapS,
          wrapT: texture.wrapT,
          repeat: texture.repeat,
        });
      }
    }
  } catch (err) {
    console.warn(
      "Error fetching roomConfig.json for texture enrichment:",
      err
    );
  }

  return lookup;
}

function enrichTextureEntry(
  entry: any,
  textureLookup: Map<string, any>
): void {
  if (!Array.isArray(entry.children) || entry.children.length !== 0) {
    return;
  }

  const textureId = entry.textureId;

  if (!textureId) {
    return;
  }

  const match = textureLookup.get(textureId);

  if (match) {
    entry.textureUrl = match.textureUrl;
  }
}

/**
 * Enriches a single config3D entry (leaf node with children: []) with signed url and modelData
 * using /api/storage/{modelId}/download-url and roomConfig fallback lookup. Mutates the entry in place.
 */
async function enrichLeafEntry(
  key: string,
  entry: any,
  lookup: Map<string, any>,
  cache?: Map<string, Promise<string | null>>
): Promise<void> {
  if (!Array.isArray(entry.children) || entry.children.length !== 0) return;

  const modelId = entry.modelData?.id || entry.id || key;
  const match = lookup.get(key) || lookup.get(modelId);

  // Fetch signed download URL from /api/storage/{modelId}/download-url
  const signedUrl = await fetchModelDownloadUrl(modelId, cache);

  if (signedUrl) {
    entry.url = signedUrl;
    entry.uri = signedUrl;
  } else if (match?.uri) {
    entry.url = match.uri;
    entry.uri = match.uri;
  }

  if (!entry.modelData && match) {
    entry.modelData = {
      category: match.category,
      name: entry.name || match.name,
      id: match.id || modelId,
      price: match.price,
      format: match.format,
    };
  } else if (!entry.modelData) {
    entry.modelData = {
      id: modelId,
      name: entry.name || modelId,
      format: "glb",
    };
  }
}

/**
 * Walks the config3D object and enriches all leaf models (children: []) with signed url from
 * /api/storage/{modelId}/download-url and modelData. Handles both top-level entries and nested children within groups.
 */
async function enrichConfig3DWithRoomData(config3D: Record<string, any>): Promise<Record<string, any>> {
  const lookup = await fetchRoomConfigLookup();
  const textureLookup = await fetchTextureConfigLookup();
  const downloadUrlCache = new Map<string, Promise<string | null>>();
  const enrichPromises: Promise<void>[] = [];

  for (const [key, entry] of Object.entries(config3D)) {
    if (!entry || typeof entry !== "object") continue;

    if (Array.isArray(entry.children) && entry.children.length === 0) {
      // Leaf model — enrich directly
      const keyUpdated = key.replace(/_node\d+$/, "");
      enrichPromises.push(
        enrichLeafEntry(keyUpdated, entry, lookup, downloadUrlCache).then(() => {
          enrichTextureEntry(entry, textureLookup);
        })
      );
    } else if (Array.isArray(entry.children) && entry.children.length > 0) {
      // Group — enrich each child object
      for (const childObj of entry.children) {
        if (childObj && typeof childObj === "object") {
          for (const [childKey, childEntry] of Object.entries(childObj)) {
            if (childEntry && typeof childEntry === "object") {
              const childKeyUpdated = childKey.replace(/_node\d+$/, "");
              enrichPromises.push(
                enrichLeafEntry(childKeyUpdated, childEntry as any, lookup, downloadUrlCache).then(() => {
                  enrichTextureEntry(childEntry as any, textureLookup);
                })
              );
            }
          }
        }
      }
    }
  }

  await Promise.all(enrichPromises);

  // Enrich walls if present by searching finishId in wallPresets, colorPresets, and floorPresets
  const wallsList = Array.isArray(config3D.walls)
    ? config3D.walls
    : config3D.walls && typeof config3D.walls === "object"
      ? Object.values(config3D.walls)
      : [];

  for (const wall of wallsList) {
    if (wall && Array.isArray(wall.materials)) {
      for (const material of wall.materials) {
        if (material && material.finishId) {
          const wallPreset = wallPresets.find((p) => p.id === material.finishId);
          if (wallPreset) {
            material.url = wallPreset.url;
          } else {
            const colorPreset = colorPresets.find((c) => c.id === material.finishId);
            if (colorPreset) {
              material.url = colorPreset.color;
            }
            // else {
            //   const floorPreset = floorPresets.find((f) => f.id === material.finishId);
            //   if (floorPreset) {
            //     material.url = floorPreset.url;
            //   }
            // }
          }
        }
      }
    }
  }


  const floor = config3D.floor;
  if (floor) {
    const floorPreset = floorPresets.find((f) => f.id === floor.floorId);
    if (floorPreset) {
      floor.url = floorPreset.url;
      floor.repeatX = floorPreset.repeatX;
      floor.repeatY = floorPreset.repeatY;
    }
    else {
      const colorPreset = colorPresets.find((c) => c.id === floor.floorId);
      if (colorPreset) {
        floor.url = colorPreset.color;
      }
    }
  }

  return config3D;
}

export default function CustomViewPanel({
  container3DRef,
  setIsLeftPanelOpen,
  isLeftPanelOpen,
  isConfigUiOpen,
  setIsConfigUiOpen,
  container2DRef,
  manager,
  configuratorInstance,
  isExistingLayout,
  onBack,
  isModelPanelOpen,
  setIsModelPanelOpen,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  onLogout,
  selectedProject
}: CustomViewPanelProps) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [show2DConfirm, setShow2DConfirm] = useState(false);
  const [isRoomPresent, setIsRoomPresent] = useState(false);
  const hasAutoSwitchedTo3D = useRef(false);

  // Project loading overlay state
  const [isProjectLoading, setIsProjectLoading] = useState(() => {
    if (!selectedProject) return false;
    // Show loader if the project has any saved 2D or 3D data to restore
    const has2D = selectedProject.project2DJson != null
      && (typeof selectedProject.project2DJson === "string"
        ? selectedProject.project2DJson.trim() !== "" && selectedProject.project2DJson.trim() !== "{}"
        : Object.keys(selectedProject.project2DJson).length > 0);
    const has3D = hasValid3DJson(selectedProject.project3DJson);
    return has2D || has3D;
  });
  const [isFadingOut, setIsFadingOut] = useState(false);

  const dismissLoader = useCallback(() => {
    if (!isProjectLoading) return;
    setIsFadingOut(true);
    setTimeout(() => {
      setIsProjectLoading(false);
      setIsFadingOut(false);
    }, 400); // matches loader-fade-out duration
  }, [isProjectLoading]);

  // Auto-switch to 3D view if the selected project has valid project3DJson
  useEffect(() => {
    if (hasAutoSwitchedTo3D.current) return;
    if (!manager || !selectedProject) return;
    if (!hasValid3DJson(selectedProject.project3DJson)) return;

    const autoSwitchTo3D = async () => {
      try {
        hasAutoSwitchedTo3D.current = true;
        console.log("Auto-switching to 3D view for project:", selectedProject.name || selectedProject.id);

        const isRoomDetectedCallback = (room: boolean) => {
          setIsRoomPresent(room);
        };

        const success = await manager.switchTo3D(isRoomDetectedCallback);
        if (success !== false) {
          setViewMode("3D");

          // Import the saved 3D config after switching
          if (configuratorInstance) {
            let config3D = typeof selectedProject.project3DJson === "string"
              ? JSON.parse(selectedProject.project3DJson)
              : selectedProject.project3DJson;

            // Enrich config3D with url and modelData from roomConfig.json (runs concurrently)
            config3D = await enrichConfig3DWithRoomData(config3D);
            console.log("Enriched config3D", config3D);

            // Warm the browser's HTTP cache by fetching all GLB files concurrently.
            // We use native fetch() instead of loadGLB() to avoid touching Three.js's gltf
            // cache/scene graph. When import3DConfig later calls loadGLB sequentially, the
            // browser serves each file from its local cache instantly (no network wait).
            const urlsToWarm = new Set<string>();
            const extractUrls = (obj: any) => {
              if (!obj || typeof obj !== "object") return;
              for (const key in obj) {
                const val = obj[key];
                if (val && typeof val === "object") {
                  if (Array.isArray(val.children) && val.children.length === 0) {
                    if (val.url) urlsToWarm.add(val.url);
                  } else if (Array.isArray(val.children)) {
                    for (const child of val.children) extractUrls(child);
                  }
                }
              }
            };
            extractUrls(config3D);

            if (urlsToWarm.size > 0) {
              console.log(`Warming browser HTTP cache for ${urlsToWarm.size} models (Max 6 concurrent)...`);

              // Fire off fetches with a concurrency limit of 6 (standard browser limit).
              // We do NOT await this function. It runs in the background.
              const warmCacheConcurrently = async () => {
                const urls = Array.from(urlsToWarm);
                const maxConcurrent = 6;
                let i = 0;
                
                const fetchNext = async (): Promise<void> => {
                  if (i >= urls.length) return;
                  const url = urls[i++];
                  try {
                    const res = await fetch(url, { method: "GET" });
                    await res.arrayBuffer(); // consume body so browser caches it
                  } catch (err) {
                    // ignore errors — this is best-effort
                  }
                  return fetchNext();
                };

                const workers = [];
                for (let w = 0; w < Math.min(maxConcurrent, urls.length); w++) {
                  workers.push(fetchNext());
                }
                await Promise.all(workers);
              };
              
              // Start downloading in background without awaiting it!
              warmCacheConcurrently();

              // enter3DView() calls resumeRenderer() inside a requestAnimationFrame.
              // Wait for the renderer to process its first full frame before importing.
              await new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
              });

              // NOTE: We no longer wait for all downloads to finish here.
              // import3DConfig will start adding models to the scene immediately.
              // It loads sequentially, seamlessly picking up files as they finish
              // downloading from the background queue.
            } else {
              await new Promise<void>((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
              });
            }

            // Import the config — GLBs are now in the browser cache, loadGLB reads locally
            const result = await configuratorInstance.import3DConfig(config3D);
            console.log("import3DConfig result", result);

            dismissLoader();
            console.log("Successfully imported saved 3D config for project:", selectedProject.name || selectedProject.id);
          }
        }
      } catch (err) {
        console.warn("Failed to auto-switch to 3D view:", err);
        dismissLoader();
      }
    };

    // Poll until the 2D layout data is confirmed present before switching to 3D.
    // This avoids the race condition where switchTo3D reads stale/empty 2D data
    // because importJson (in ViewPanel) hasn't finished yet.
    let pollTimer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // 40 * 100ms = 4s max wait

    const waitFor2DAndSwitch = async () => {
      if (attempts >= MAX_ATTEMPTS) {
        console.warn("Timed out waiting for 2D data before switching to 3D, proceeding anyway.");
        autoSwitchTo3D();
        return;
      }
      const has2D = await manager.is2DDataPresent();
      if (has2D) {
        autoSwitchTo3D();
      } else {
        attempts++;
        pollTimer = setTimeout(waitFor2DAndSwitch, 100);
      }
    };

    // Give the 2D import (which has a 300ms delay in ViewPanel) a chance to kick off
    pollTimer = setTimeout(waitFor2DAndSwitch, 50);

    return () => clearTimeout(pollTimer);
  }, [manager, selectedProject, configuratorInstance, dismissLoader]);

  // Dismiss loader for 2D-only projects (no 3D data to load)
  useEffect(() => {
    if (!isProjectLoading) return;
    if (!manager || !selectedProject) return;
    // If the project has 3D data, the 3D import path handles dismissal
    if (hasValid3DJson(selectedProject.project3DJson)) return;

    // For 2D-only projects, wait for the 2D import to settle
    const timer = setTimeout(() => {
      dismissLoader();
    }, 800); // slightly longer than the 300ms import delay in ViewPanel

    return () => clearTimeout(timer);
  }, [manager, selectedProject, isProjectLoading, dismissLoader]);

  const switchTo2D = () => {
    if (viewMode === "2D") return;
    setShow2DConfirm(true);
  };

  const confirmSwitchTo2D = () => {
    manager?.switchTo2D();
    setViewMode("2D");
    setShow2DConfirm(false);
    setIsRoomPresent(false);
    setIsSidebarOpen(false);
    setIsModelPanelOpen(false);
    setIsRightSidebarOpen(false);
    setIsConfigUiOpen(false);
    setIsLeftPanelOpen(false);
  };

  const cancelSwitchTo2D = () => {
    setShow2DConfirm(false);
  };

  const isRoomDetected = (room: boolean) => {
    if (room) {
      setIsRoomPresent(true);
    }
    else {
      setIsRoomPresent(false);
    }
  }

  const switchTo3D = async () => {
    if (viewMode === "3D") return;
    const success = await manager?.switchTo3D(isRoomDetected);
    if (selectedProject) {
      // const data = manager?.exportJson();
      // await updateProject2DJson(selectedProject.id, data);
    }
    if (success !== false) {
      setViewMode("3D");
    } else {
      addToast({
        title: TOAST_MESSAGES.NO_LAYOUT_DATA.title,
        description: TOAST_MESSAGES.NO_LAYOUT_DATA.description,
        color: "warning",
        classNames: {
          base: "bg-amber-100 border border-amber-400 shadow-xl",
          title: "text-amber-900 font-bold",
          description: "text-amber-800",
        }
      });
    }
  };

  const updateProject2DJson = async (projectId: any, project2DJson: any) => {
    try {
      let accessToken = localStorage.getItem("access_token");
      console.log("project2DJson", project2DJson);

      if (accessToken === null) {
        accessToken = sessionStorage.getItem("access_token");
      }
      console.log("accesstoken - ", accessToken);

      const response = await fetch(
        // `http://localhost:5217/api/Projects/${projectId}/2d-json`,
        update2DJSONApi(projectId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project2DJson: project2DJson,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`);
      }

      const result = await response.json();

      console.log("Project 2D JSON updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Error updating project 2D JSON:", error);
      throw error;
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleRightSidebar = () => {
    setIsModelPanelOpen(!isModelPanelOpen);
  };

  return (
    <>
      <div className="h-screen w-full relative overflow-hidden">
        {/* Project Loading Overlay */}
        {isProjectLoading && (
          <div
            className={`absolute inset-0 z-[100] flex flex-col items-center justify-center gap-5 backdrop-blur-sm transition-opacity ${isFadingOut ? "animate-loader-fade-out" : "animate-fade-in"
              } ${theme === "dark"
                ? "bg-zinc-950/80"
                : "bg-white/80"
              }`}
          >
            {/* Spinner ring */}
            <div className="relative w-16 h-16">
              <div
                className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-loader-spin ${theme === "dark"
                  ? "border-amber-400/80"
                  : "border-zinc-800/80"
                  }`}
              />
              <div
                className={`absolute inset-1.5 rounded-full border-4 border-b-transparent animate-loader-spin ${theme === "dark"
                  ? "border-amber-400/30"
                  : "border-zinc-400/40"
                  }`}
                style={{ animationDirection: "reverse", animationDuration: "0.9s" }}
              />
            </div>

            {/* Loading text */}
            <div className="flex flex-col items-center gap-1.5">
              <p
                className={`text-sm font-semibold tracking-wide animate-loader-pulse ${theme === "dark" ? "text-amber-400" : "text-zinc-800"
                  }`}
              >
                Loading Configuration
              </p>
              <p
                className={`text-xs animate-loader-pulse ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"
                  }`}
                style={{ animationDelay: "0.3s" }}
              >
                Setting up your project…
              </p>
            </div>
          </div>
        )}

        <TwoD
          containerRef={container2DRef}
          visible={viewMode === "2D"}
          manager={manager}
          isSidebarOpen={isSidebarOpen}
          isModelPanelOpen={isModelPanelOpen}
          toggleSidebar={toggleSidebar}
          toggleRightSidebar={toggleRightSidebar}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            if (mode === "2D") switchTo2D();
            else switchTo3D();
          }}
          setIsLeftPanelOpen={setIsLeftPanelOpen}
          setIsConfigUiOpen={setIsConfigUiOpen}
          isConfigUiOpen={isConfigUiOpen}
          onBack={onBack}
          isRoomPresent={isRoomPresent}
          onLogout={onLogout}
          selectedProject={selectedProject}
        />
        <ExistingViewPanel
          visible={viewMode === "3D"}
          container3DRef={container3DRef}
          isLeftPanelOpen={isLeftPanelOpen}
          setIsLeftPanelOpen={setIsLeftPanelOpen}
          isConfigUiOpen={isConfigUiOpen}
          setIsConfigUiOpen={setIsConfigUiOpen}
          configuratorInstance={configuratorInstance}
          isExistingLayout={isExistingLayout}
          floorPlanManager={manager}
          onViewModeChange={(mode) => {
            if (mode === "2D") switchTo2D();
            else switchTo3D();
          }}
          onBack={onBack}
          isRoomPresent={isRoomPresent}
          isModelPanelOpen={isModelPanelOpen}
          setIsModelPanelOpen={setIsModelPanelOpen}
          isRightSidebarOpen={isRightSidebarOpen}
          setIsRightSidebarOpen={setIsRightSidebarOpen}
          onLogout={onLogout}
          selectedProject={selectedProject}
        />
      </div>
      <ConfirmationToast
        isOpen={show2DConfirm}
        title="Switch to 2D"
        message="Are you sure you want to switch to 2D? All the current progress will be lost."
        onConfirm={confirmSwitchTo2D}
        onCancel={cancelSwitchTo2D}
      />
    </>
  );
}
