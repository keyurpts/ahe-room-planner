import { useEffect, useState, useRef } from "react";
import {
  Accordion,
  AccordionItem,
  Card,
  CardBody,
  CardFooter,
  Tab,
  Tabs,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import {
  ConfiguratorCore,
  Events,
  ConfiguratorEventType,
} from "three-configurator";
import { useTheme } from "../ThemeContext";
import {
  getModelsByCategoryApi,
  getStorageDownloadUrlApi,
  getThumbnailDownloadUrlApi,
  getTextureDownloadUrlApi,
  resolveStorageUrl,
  TEXTURES_API,
} from "./Constants";
import { getAccessToken } from "../utils/auth";


const LOADING_CURSOR_STYLE_ID = "furniture-grid-loading-cursor";

const setLoadingCursor = (isLoading: boolean) => {
  const existingStyle = document.getElementById(LOADING_CURSOR_STYLE_ID);

  if (!isLoading) {
    existingStyle?.remove();
    return;
  }

  if (existingStyle) return;

  const style = document.createElement("style");
  style.id = LOADING_CURSOR_STYLE_ID;
  style.textContent = "*, *::before, *::after { cursor: wait !important; }";
  document.head.appendChild(style);
};

const thumbnailCache = new Map<string, string>();

type ModelThumbnailProps = {
  categoryId: string;
  modelId: string;
  textureId: string;
  fallbackImage: string;
  alt: string;
  className?: string;
};

const ModelThumbnail = ({
  categoryId,
  modelId,
  textureId,
  fallbackImage,
  alt,
  className,
}: ModelThumbnailProps) => {
  const [imageUrl, setImageUrl] = useState<string>(fallbackImage);
  const [isImgLoading, setIsImgLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!categoryId || !modelId || !textureId) {
      setImageUrl(fallbackImage);
      return;
    }

    const cacheKey = `${categoryId}_${modelId}_${textureId}`;
    if (thumbnailCache.has(cacheKey)) {
      setImageUrl(thumbnailCache.get(cacheKey)!);
      return;
    }

    let isMounted = true;
    setIsImgLoading(true);

    const fetchThumbnail = async () => {
      try {
        const token = getAccessToken();
        const headers: Record<string, string> = {
          Accept: "*/*",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(
          getThumbnailDownloadUrlApi(categoryId, modelId, textureId),
          {
            method: "GET",
            headers,
          }
        );

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

          if (url && isMounted) {
            const resolved = resolveStorageUrl(url);
            thumbnailCache.set(cacheKey, resolved);
            setImageUrl(resolved);
          }
        } else {
          console.warn(
            `Failed to fetch thumbnail for category: ${categoryId}, model: ${modelId}, texture: ${textureId} (${res.status})`
          );
        }
      } catch (err) {
        console.warn("Error fetching thumbnail URL:", err);
      } finally {
        if (isMounted) setIsImgLoading(false);
      }
    };

    fetchThumbnail();

    return () => {
      isMounted = false;
    };
  }, [categoryId, modelId, textureId, fallbackImage]);

  return (
    <div className="relative w-full h-32 overflow-hidden">
      <img
        src={imageUrl || fallbackImage || "./images/twod.jfif"}
        alt={alt}
        className={className}
        onError={(e) => {
          if (fallbackImage && e.currentTarget.src !== fallbackImage) {
            e.currentTarget.src = fallbackImage;
          }
        }}
      />
      {isImgLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <Spinner size="sm" color="warning" />
        </div>
      )}
    </div>
  );
};

type FurnitureGridProps = {
  selectedItem: string;
  configuratorInstance: ConfiguratorCore | undefined;
  roomConfig: any;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  furnitureItemsFinal: any;
  setFurnitureItemsFinal: any;
  searchFurniture: any;
  setIsNewModelLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showFavorites: boolean;
  favorites: Set<string>;
  setFavorites: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export default function FurnitureGrid({
  selectedItem,
  configuratorInstance,
  roomConfig,
  selectedTab,
  setSelectedTab,
  furnitureItemsFinal,
  setFurnitureItemsFinal,
  searchFurniture,
  setIsNewModelLoading,
  showFavorites,
  favorites,
  setFavorites
}: FurnitureGridProps) {
  const { theme, colors } = useTheme();
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [textures, setTextures] = useState<any[]>([]);
  const [selectedTexture, setSelectedTexture] = useState<string>("");
  const [isLoadingTextures, setIsLoadingTextures] = useState<boolean>(false);

  const pendingTextureRef = useRef<{
    downloadUrl: string;
    textureId: string;
  } | null>(null);

  useEffect(() => {
    const handleModelPlaced = (metadata: any) => {
      if (metadata && pendingTextureRef.current && configuratorInstance) {
        const { downloadUrl, textureId } = pendingTextureRef.current;
        pendingTextureRef.current = null;
        console.log("Model placed (not in preview mode) - applying texture:", {
          downloadUrl,
          textureId,
        });
        // Small delay to ensure ConfiguratorCore has fully settled
        // (transform controls attached, modelRoot set, switchControlMode completed)
        setTimeout(() => {
          configuratorInstance.applyTextureToModel(downloadUrl, textureId);
        }, 100);
      }
    };

    const handlePreviewCancelled = () => {
      pendingTextureRef.current = null;
    };

    Events.on(ConfiguratorEventType.MODEL_SELECTED, handleModelPlaced);
    Events.on(ConfiguratorEventType.PREVIEW_CANCELLED, handlePreviewCancelled);

    return () => {
      Events.off(ConfiguratorEventType.MODEL_SELECTED, handleModelPlaced);
      Events.off(
        ConfiguratorEventType.PREVIEW_CANCELLED,
        handlePreviewCancelled
      );
    };
  }, [configuratorInstance]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    if (showFavorites) {
      if (roomConfig?.configModels) {
        const allFavorites: any[] = [];
        roomConfig.configModels.forEach((categoryData: any) => {
          (categoryData.items || []).forEach((item: any) => {
            if (favorites.has(item.id)) {
              allFavorites.push({
                ...item,
                image: item.previewImage || item.thumbnailUrl || item.thumbnail || item.image,
                path: item.uri || item.modelUrl || item.fileUrl || item.path,
                category: categoryData.categoryName || categoryData.category || categoryData.name,
              });
            }
          });
        });
        setFurnitureItemsFinal(allFavorites);
      }
      return;
    }

    if (!selectedItem) {
      setFurnitureItemsFinal([]);
      return;
    }

    let isMounted = true;

    const fetchCategoryModels = async () => {
      setIsLoadingModels(true);
      try {
        const token = getAccessToken();
        const headers: Record<string, string> = {
          Accept: "*/*",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(getModelsByCategoryApi(selectedItem), {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch models for category (${res.status})`);
        }

        const data = await res.json();
        let models: any[] = [];
        if (Array.isArray(data)) {
          models = data;
        } else if (data && Array.isArray(data.items)) {
          models = data.items;
        } else if (data && Array.isArray(data.data)) {
          models = data.data;
        }

        if (isMounted) {
          if (models.length > 0) {
            const formatted = models.map((item: any) => ({
              ...item,
              id: item.modelId || item.id || item.modelName,
              name: item.modelName || item.name || item.title || "Furniture Item",
              price: item.price ? (typeof item.price === "number" ? `$${item.price}` : item.price) : (item.modelMetadata?.price || "$0"),
              image: resolveStorageUrl(item.modelThumbnailPath || item.thumbnailUrl || item.previewImage || item.thumbnail || item.image || item.imageUrl) || "./images/twod.jfif",
              path: resolveStorageUrl(item.modelPath || item.modelUrl || item.uri || item.fileUrl || item.filePath || item.url || item.path),
              format: item.format || "glb",
              category: item.categoryName || item.category || selectedItem,
            }));
            setFurnitureItemsFinal(formatted);
          } else {
            // Fallback to roomConfig if API returned empty
            fallbackToRoomConfig();
          }
        }
      } catch (err) {
        console.warn("Could not fetch models from /api/Models/category, falling back:", err);
        if (isMounted) {
          fallbackToRoomConfig();
        }
      } finally {
        if (isMounted) setIsLoadingModels(false);
      }
    };

    const fallbackToRoomConfig = () => {
      if (!roomConfig?.configModels) {
        setFurnitureItemsFinal([]);
        return;
      }
      const categoryData = roomConfig.configModels.find(
        (category: any) =>
          category.id === selectedItem ||
          category.category === selectedItem ||
          category.categoryName === selectedItem
      );

      if (categoryData && categoryData.items) {
        setFurnitureItemsFinal(
          categoryData.items.map((item: any) => ({
            ...item,
            image: item.previewImage || item.thumbnailUrl || item.image,
            path: item.uri || item.modelUrl || item.path,
            category: categoryData.categoryName || categoryData.category,
          }))
        );
      } else {
        setFurnitureItemsFinal([]);
      }
    };

    fetchCategoryModels();

    return () => {
      isMounted = false;
    };
  }, [selectedItem, roomConfig, showFavorites, favorites]);

  useEffect(() => {
    let isMounted = true;

    const fetchTextures = async () => {
      setIsLoadingTextures(true);
      try {
        const token = getAccessToken();
        const headers: Record<string, string> = {
          Accept: "*/*",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(TEXTURES_API, {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch textures (${res.status})`);
        }

        const data = await res.json();
        let rawList: any[] = [];
        if (Array.isArray(data)) {
          rawList = data;
        } else if (data && Array.isArray(data.items)) {
          rawList = data.items;
        } else if (data && Array.isArray(data.data)) {
          rawList = data.data;
        }

        if (isMounted) {
          if (rawList.length > 0) {
            const formatted = rawList.map((item: any) => ({
              ...item,
              id: String(item.textureId || item.id || item.textureName || item.name),
              name: item.textureName || item.name || item.title || "Texture",
              price: item.price ? (typeof item.price === "number" ? `$${item.price}` : item.price) : "$0",
              previewImage: resolveStorageUrl(
                item.textureThumbnailPath ||
                item.texturePath ||
                item.previewImage ||
                item.imageUrl ||
                item.thumbnailUrl ||
                item.url ||
                item.path
              ),
            }));
            setTextures(formatted);
            setSelectedTexture((prev) => prev || formatted[0].id);
          } else {
            fallbackTextures();
          }
        }
      } catch (err) {
        console.warn("Could not fetch textures from /api/Textures, falling back:", err);
        if (isMounted) {
          fallbackTextures();
        }
      } finally {
        if (isMounted) {
          setIsLoadingTextures(false);
        }
      }
    };

    const fallbackTextures = () => {
      if (roomConfig?.configTextures && Array.isArray(roomConfig.configTextures)) {
        const formatted = roomConfig.configTextures.map((item: any) => ({
          ...item,
          id: String(item.id || item.name),
          name: item.name || "Texture",
          price: item.price || "$0",
          previewImage: resolveStorageUrl(item.previewImage || item.url || item.path),
        }));
        setTextures(formatted);
        if (formatted.length > 0) {
          setSelectedTexture((prev) => prev || formatted[0].id);
        }
      } else {
        setTextures([]);
      }
    };

    fetchTextures();

    return () => {
      isMounted = false;
    };
  }, [roomConfig]);

  const handleTextureChange = (textureId: string) => {
    setSelectedTexture(textureId);
    const texture = textures.find((t: any) => t.id === textureId);
    if (texture && configuratorInstance) {
      const texUrl = resolveStorageUrl(texture.previewImage || texture.url || texture.path);
      if (texUrl) {
        configuratorInstance.applyTextureToModel(
          texUrl,
          texture.id,
          texture.price
        );
      }
    }
  };

  const handleLoadGLB = async (item: any) => {
    if (!configuratorInstance) return;

    setIsNewModelLoading(true);
    setLoadingCursor(true);

    const modelData = {
      category: item.category,
      name: item.name,
      id: item.id,
      price: item.price,
      format: item.format,
    };

    let callbacks = {
      onModelLoading: (xhr: any) => {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        console.log("model loading:", percent + "%");
      },

      onModelLoaded: (model: any) => {
        console.log("Model successfully loaded:", model);
      },

      onModelError: (error: any) => {
        console.error("Error while loading model:", error);
        window.alert(error);
      },
    };

    // Start texture download URL fetch early (concurrently with model load)
    // so pendingTextureRef is set BEFORE MODEL_SELECTED fires during placement
    const texturePromise = selectedTexture
      ? (async () => {
          try {
            const token = getAccessToken();
            const headers: Record<string, string> = { Accept: "*/*" };
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }

            const textureRes = await fetch(
              getTextureDownloadUrlApi(selectedTexture),
              { method: "GET", headers }
            );

            if (textureRes.ok) {
              const contentType = textureRes.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                const data = await textureRes.json();
                console.log("texture response data", data);

                const downloadUrl = resolveStorageUrl(data.downloadUrl);
                const textureId = data.textureId;

                // Always store as pending — model starts in preview mode,
                // texture will be applied when MODEL_SELECTED fires after placement
                pendingTextureRef.current = { downloadUrl, textureId };
                console.log("Texture URL fetched and stored in pendingTextureRef:", {
                  downloadUrl,
                  textureId,
                });
              } else {
                const textUrl = await textureRes.text();
                if (
                  textUrl &&
                  (textUrl.startsWith("http://") ||
                    textUrl.startsWith("https://") ||
                    textUrl.startsWith("/"))
                ) {
                  const resolvedUrl = resolveStorageUrl(textUrl.trim());
                  pendingTextureRef.current = {
                    downloadUrl: resolvedUrl,
                    textureId: selectedTexture,
                  };
                }
              }
            } else {
              console.warn(
                `Failed to get signed download URL for texture ${selectedTexture} (${textureRes.status})`
              );
            }
          } catch (texErr) {
            console.warn(
              `Error fetching texture download URL for textureId ${selectedTexture}:`,
              texErr
            );
          }
        })()
      : Promise.resolve();

    try {
      let modelUrlToLoad = item.path;
      const modelId = item.modelId || item.id;

      if (modelId) {
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
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              const url =
                data?.downloadUrl ||
                data?.url ||
                data?.downloadURL ||
                (typeof data === "string"
                  ? data
                  : data?.data?.downloadUrl || data?.data?.url || data?.data);
              if (url && typeof url === "string") {
                modelUrlToLoad = url;
              }
            } else {
              const textUrl = await res.text();
              if (
                textUrl &&
                (textUrl.startsWith("http://") ||
                  textUrl.startsWith("https://") ||
                  textUrl.startsWith("/"))
              ) {
                modelUrlToLoad = textUrl.trim();
              }
            }
          } else {
            console.warn(
              `Failed to get signed download URL for model ${modelId} (${res.status}), falling back to item path:`,
              item.path
            );
          }
        } catch (storageErr) {
          console.warn(
            `Error fetching storage download URL for model ${modelId}, falling back to item path:`,
            storageErr
          );
        }
      }

      // Wait for texture URL fetch to complete before loading model,
      // so pendingTextureRef.current is guaranteed to be set
      await texturePromise;

      modelUrlToLoad = resolveStorageUrl(modelUrlToLoad);

      await configuratorInstance.loadModel(
        modelUrlToLoad,
        true,
        undefined,
        undefined,
        callbacks,
        true,
        modelData
      );
    } catch (err) {
      console.error("Error while loading model:", err);
      setLoadingCursor(false);
    } finally {
      setLoadingCursor(false);
    }
  };

  return (
    <div className="flex w-full flex-col h-full">
      <Tabs
        aria-label="Customizations"
        placement="bottom"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(String(key))}
        classNames={{ tabWrapper: "h-full" }}
      >
        <Tab key="options" title="Options" className="h-full">
          <Card className="h-full">
            <CardBody className="h-full overflow-y-auto p-2">
              <div style={{ height: "100%", width: "100%" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: "5px",
                  }}
                >
                  {isLoadingModels ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-10 gap-2">
                      <Spinner color="warning" size="md" />
                      <span className="text-xs text-default-400">Loading models...</span>
                    </div>
                  ) : furnitureItemsFinal.length > 0 ? (
                    furnitureItemsFinal.map((item: any, index: any) => (
                      <Card
                        key={index}
                        isPressable
                        className={`group relative w-full overflow-hidden border ${colors.gridItemBg} ${colors.gridItemBorder} ${colors.gridItemHoverBorder} ${colors.gridItemHoverShadow} ${colors.textMain} rounded-xl transition-all duration-300 !outline-none data-[focus-visible=true]:!outline-none`}
                        onClick={() => handleLoadGLB(item)}
                      >
                        <CardBody className="p-0 overflow-hidden">
                          <ModelThumbnail
                            categoryId={selectedItem || item.category || item.categoryId}
                            modelId={item.modelId || item.id}
                            textureId={selectedTexture}
                            fallbackImage={item.image}
                            alt={item.name}
                            className={`w-full h-32 object-cover border-b ${colors.borderAccent} group-hover:scale-105 transition-transform duration-500`}
                          />
                        </CardBody>
                        <CardFooter className={`flex-col items-start p-2 ${theme === "dark" ? "bg-zinc-950/20" : "bg-zinc-100/60"}`}>
                          <h3 className={`text-sm font-semibold transition-colors ${theme === "dark" ? "text-zinc-200 group-hover:text-amber-400" : "text-zinc-800 group-hover:text-zinc-900"}`}>{item.name}</h3>
                        </CardFooter>
                        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1 z-10 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                        >
                          <Icon
                            icon={
                              favorites.has(item.id)
                                ? Icons.heart_filled
                                : Icons.heart_outline
                            }
                            className={`w-4 h-4 ${favorites.has(item.id) ? "text-red-500" : "text-white"}`}
                          />
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 mt-4">
                      {searchFurniture
                        ? "Item not found"
                        : "No items available"}
                    </p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>

        {/* customizations tab */}
        <Tab key="customization" title="Customization" className="h-full">
          <Card className="h-full">
            <CardBody className="h-full">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <Accordion defaultExpandedKeys={["appearances"]}>
                  <AccordionItem
                    key="appearances"
                    aria-label="Appearances"
                    title="Appearances"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => configuratorInstance?.resetMaterial()}
                          className={`group relative w-full aspect-square max-w-[64px] rounded border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${theme === "dark"
                            ? "border-zinc-600 hover:border-amber-400/70 hover:bg-zinc-800"
                            : "border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50"
                            }`}
                          aria-label="Reset"
                        >
                          <Icon icon={Icons.eraserIcon} width={18} height={18} className={theme === "dark" ? "text-zinc-500 group-hover:text-amber-400" : "text-zinc-500 group-hover:text-zinc-900"} />
                          <span className={`text-[8px] font-semibold tracking-wider uppercase ${theme === "dark" ? "text-zinc-500 group-hover:text-amber-400" : "text-zinc-500 group-hover:text-zinc-900"}`}>Reset</span>
                        </button>
                        <span className="text-xs mt-1 opacity-0 pointer-events-none select-none">Reset</span>
                      </div>
                      {roomConfig?.configMaterials?.map(
                        (material: any, index: number) => (
                          <div
                            key={index}
                            className="flex flex-col items-center cursor-pointer"
                            onClick={() => {
                              console.log("Appearance : ", material);
                              configuratorInstance.applyMaterialToModel(material);
                            }}
                          >
                            <div
                              className="w-full aspect-square max-w-[64px] rounded border border-default-300"
                              style={{ backgroundColor: material.color }}
                              aria-label={`Color ${material.color}`}
                            />
                            <span className="text-xs mt-1 text-center break-words w-full">
                              {material.name}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </AccordionItem>

                  <AccordionItem
                    key="textures"
                    aria-label="Textures"
                    title="Textures"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => configuratorInstance?.resetTexture()}
                          className={`group relative w-full aspect-square max-w-[64px] rounded border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${theme === "dark"
                            ? "border-zinc-600 hover:border-amber-400/70 hover:bg-zinc-800"
                            : "border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50"
                            }`}
                          aria-label="Reset"
                        >
                          <Icon icon={Icons.eraserIcon} width={18} height={18} className={theme === "dark" ? "text-zinc-500 group-hover:text-amber-400" : "text-zinc-500 group-hover:text-zinc-900"} />
                          <span className={`text-[8px] font-semibold tracking-wider uppercase ${theme === "dark" ? "text-zinc-500 group-hover:text-amber-400" : "text-zinc-500 group-hover:text-zinc-900"}`}>Reset</span>
                        </button>
                        <span className="text-xs mt-1 opacity-0 pointer-events-none select-none">Reset</span>
                      </div>
                      {textures.map((texture: any) => (
                        <div
                          key={texture.id}
                          className={`flex flex-col items-center cursor-pointer p-1 rounded-lg transition-all ${selectedTexture === texture.id
                            ? "ring-2 ring-amber-500 bg-amber-500/10"
                            : ""
                            }`}
                          onClick={() => handleTextureChange(texture.id)}
                        >
                          <img
                            src={texture.previewImage}
                            alt={texture.name}
                            className="w-full aspect-square max-w-[64px] object-cover rounded"
                          />
                          <span className="text-xs mt-1 text-center break-words w-full">{texture.name}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Texture Dropdown below FurnitureGrid */}
      <div className="mt-3 pt-2.5 border-t border-divider flex flex-col gap-1.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-semibold flex items-center gap-1.5 ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
            <Icon icon="solar:pallete-2-linear" className="w-4 h-4 text-amber-500" />
            Texture
          </label>
          {isLoadingTextures && <Spinner size="sm" color="warning" className="scale-75" />}
        </div>

        <div className="relative">
          <select
            value={selectedTexture}
            onChange={(e) => handleTextureChange(e.target.value)}
            disabled={isLoadingTextures || textures.length === 0}
            className={`w-full text-xs font-medium rounded-xl px-3 py-2.5 pr-8 appearance-none border transition-all duration-200 outline-none cursor-pointer ${theme === "dark"
              ? "bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-amber-400 hover:border-zinc-600"
              : "bg-white border-zinc-300 text-zinc-800 focus:border-amber-500 hover:border-zinc-400 shadow-sm"
              }`}
          >
            {textures.length === 0 ? (
              <option value="">{isLoadingTextures ? "Loading textures..." : "No textures available"}</option>
            ) : (
              textures.map((texture) => (
                <option
                  key={texture.id}
                  value={texture.id}
                  className={theme === "dark" ? "bg-zinc-900 text-zinc-200" : "bg-white text-zinc-800"}
                >
                  {texture.name}
                </option>
              ))
            )}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-default-400">
            <Icon icon="solar:alt-arrow-down-linear" className="w-4 h-4" />
          </div>
        </div>

        {/* Selected Texture Preview Pill */}
        {(() => {
          const selectedTextureObj = textures.find((t: any) => t.id === selectedTexture);
          if (!selectedTextureObj || !selectedTextureObj.previewImage) return null;
          return (
            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${theme === "dark" ? "bg-zinc-900/50 border-zinc-800/80 text-zinc-300" : "bg-zinc-100/70 border-zinc-200 text-zinc-700"
              }`}>
              <img
                src={selectedTextureObj.previewImage}
                alt={selectedTextureObj.name}
                className="w-5 h-5 rounded object-cover border border-default-200"
              />
              <span className="truncate flex-1 font-medium">{selectedTextureObj.name}</span>
              {selectedTextureObj.price && selectedTextureObj.price !== "$0" && (
                <span className="text-[10px] text-amber-500 font-semibold">{selectedTextureObj.price}</span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
