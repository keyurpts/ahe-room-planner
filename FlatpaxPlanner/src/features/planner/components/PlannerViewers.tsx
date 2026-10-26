import { useAppDispatch, useAppSelector } from '@/app/store-hooks';
import { useEffect, type RefObject } from 'react';
import { FloorplanManager, Predefined2DShapes } from "wrapper";
import { registerItemCodes, setConfiguratorCore, setFloorPlanManager } from '../state/configurator-slice';
import { colorPresets, floorPresets, wallPresets } from '../finishes/presets';
import { catalogueApi, type CatalogueModel } from '../catalogue/catalogue-api';

interface Props {
  viewer2DRef: RefObject<HTMLDivElement | null>;
  viewer3DRef: RefObject<HTMLDivElement | null>;
  mode: '2d' | '3d';
  p2dJSON: any;
  p3dJSON: any;
}

export const PlannerViewers = ({ viewer2DRef, viewer3DRef, mode, p2dJSON, p3dJSON }: Props) => {
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.project.draft);
  const floorplanManager = useAppSelector((state) => state.configurator.floorPlanManager);
  const regionId = useAppSelector((state) => state.ui.regionId);
  
  // ///////////////////////////////////////////////////////////////////////////////////////////////

  async function enrichTextureEntry(
    entry: any,
    cache: Map<string, Promise<string | null>>
  ): Promise<void> {
    if (!Array.isArray(entry.children) || entry.children.length !== 0) {
      return;
    }
    const textureId = entry.textureId;
    if (!textureId) {
      return;
    }
    let request = cache.get(textureId);
    if (!request) {
      request = dispatch(catalogueApi.endpoints.getTextureDownloadUrl.initiate(
        { textureId }, { subscribe: false }
      )).unwrap().then((response) => response?.downloadUrl ?? null).catch((error: unknown) => {
        console.error('Unable to get the cupboard texture download URL.', error);
        return null;
      });
      cache.set(textureId, request);
    }
    const downloadUrl = await request;
    if (downloadUrl) entry.textureUrl = downloadUrl;
  }

  /**
   * Enriches a single config3D entry (leaf node with children: []) with signed url and modelData
   * using /api/storage/{modelId}/download-url and catalogue API lookup. Mutates the entry in place.
   */
  async function enrichLeafEntry(
    key: string,
    entry: any,
    cache: Map<string, Promise<string>>,
    modelDetailsCache: Map<string, Promise<CatalogueModel | null>>,
  ): Promise<void> {
    if (!Array.isArray(entry.children) || entry.children.length !== 0) return;
    const rawId = (entry.modelData?.id ?? entry.id ?? key) as unknown;
    const cleanModelId = String(rawId).replace(/_node\d+$/iu, '');

    let request = cache.get(cleanModelId);
    if (!request) {
      request = dispatch(
        catalogueApi.endpoints.getModelDownloadUrl.initiate(cleanModelId, { subscribe: false }),
      )
        .unwrap()
        .then((response) => {
          if (!response?.downloadUrl) {
            throw new Error(`No download URL returned for saved model ${cleanModelId}.`);
          }
          return response.downloadUrl;
        });
      cache.set(cleanModelId, request);
    }
    const signedUrl = await request;
    if (signedUrl) {
      entry.url = signedUrl;
      entry.uri = signedUrl;
    }

    let modelDetailsRequest = modelDetailsCache.get(cleanModelId);
    if (!modelDetailsRequest) {
      modelDetailsRequest = dispatch(
        catalogueApi.endpoints.getModelById.initiate(cleanModelId, { subscribe: false }),
      )
        .unwrap()
        .catch((error: unknown) => {
          console.warn(`Unable to fetch details for saved model ${cleanModelId}.`, error);
          return null;
        });
      modelDetailsCache.set(cleanModelId, modelDetailsRequest);
    }
    const modelDetails = await modelDetailsRequest;

    const matchingVariant =
      modelDetails?.variants.find((v) => v.textureId === entry.textureId) ??
      modelDetails?.variants[0];
    const region = matchingVariant?.regions.find((r) => r.regionId === regionId);
    const itemPrice =
      region?.price ??
      (typeof entry.modelData?.price === 'number' ? entry.modelData.price : 0);
    const itemCode =
      region?.itemNumber ??
      matchingVariant?.skuNumber ??
      entry.modelData?.itemCode ??
      '—';
    const itemName =
      modelDetails?.description ??
      modelDetails?.modelName ??
      entry.name ??
      cleanModelId;

    entry.modelData = {
      id: cleanModelId,
      name: itemName,
      price: itemPrice,
      itemCode,
      category: modelDetails?.categoryId ?? entry.modelData?.category ?? '',
      format: 'glb',
    };

    dispatch(registerItemCodes({ [cleanModelId]: itemCode }));
  }

  /**
   * Walks the config3D object and enriches all leaf models (children: []) with signed url from
   * /api/storage/{modelId}/download-url and modelData. Handles both top-level entries and nested children within groups.
   */
  async function enrichConfig3DWithRoomData(config3D: Record<string, any>): Promise<Record<string, any>> {
    const downloadUrlCache = new Map<string, Promise<string>>();
    const textureUrlCache = new Map<string, Promise<string | null>>();
    const modelDetailsCache = new Map<string, Promise<CatalogueModel | null>>();
    const enrichPromises: Promise<void>[] = [];

    for (const [key, entry] of Object.entries(config3D)) {
      if (!entry || typeof entry !== "object") continue;

      if (Array.isArray(entry.children) && entry.children.length === 0) {
        // Leaf model — enrich directly
        const keyUpdated = key.replace(/_node\d+$/, "");
        enrichPromises.push(
          enrichLeafEntry(keyUpdated, entry, downloadUrlCache, modelDetailsCache).then(() => {
            return enrichTextureEntry(entry, textureUrlCache);
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
                  enrichLeafEntry(childKeyUpdated, childEntry as any, downloadUrlCache, modelDetailsCache).then(() => {
                    return enrichTextureEntry(childEntry, textureUrlCache);
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

  // //////////////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    if (!viewer2DRef.current || !viewer3DRef.current) return;

    const floorPlanManagerInstance = new FloorplanManager();
    try {
      floorPlanManagerInstance.init(viewer2DRef.current, viewer3DRef.current);
    } catch (error) {
      floorPlanManagerInstance.dispose();
      throw error;
    }
    const configuratorCoreInstance = floorPlanManagerInstance.getConfiguratorCore();
    if (!configuratorCoreInstance) {
      floorPlanManagerInstance.dispose();
      return;
    }
    dispatch(setFloorPlanManager(floorPlanManagerInstance));
    dispatch(setConfiguratorCore(configuratorCoreInstance));
    configuratorCoreInstance.setBackgroundColor(0xffffff);

    void configuratorCoreInstance
      .loadEnvironmentMap('/lebombo_4k.hdr', 0.5)
      .catch((error: unknown) => {
        console.error('Unable to load the viewer environment map.', error);
      });

    return () => {
      // Cleanup on unmount / re-mount
      floorPlanManagerInstance.dispose();
      dispatch(setFloorPlanManager(null));
      dispatch(setConfiguratorCore(null));
    };
  }, [dispatch, viewer2DRef, viewer3DRef]);

  const isRoomDetected = () => {
    console.log("is room detected");
  }

  useEffect(() => {
    const fetchData = async () => {
      if (floorplanManager && draft && draft.shape !== "custom") {
        if (draft.shape === "rectangle") {
          floorplanManager.addPredefinedShape(Predefined2DShapes.RECTANGLE);
        }
        else if (draft.shape === "square") {
          floorplanManager.addPredefinedShape(Predefined2DShapes.SQUARE);
        }
        else {
          floorplanManager.addPredefinedShape(Predefined2DShapes.L_SHAPE);
        }
      }
      else if (floorplanManager && draft && draft.shape === "custom") {
        if (mode === "2d") {
          await floorplanManager.importJson(p2dJSON);
        }
        else if (mode === "3d") {
          const configuratorCoreInstance = floorplanManager.getConfiguratorCore();
          await floorplanManager.importJson(p2dJSON);
          await floorplanManager.switchTo3D(isRoomDetected);
          const p3dJSON_updated = await enrichConfig3DWithRoomData(JSON.parse(p3dJSON));
          await configuratorCoreInstance?.import3DConfig(p3dJSON_updated);
        }
      }
    };

    void fetchData().catch((error: unknown) => {
      console.error('Unable to load the saved project.', error);
    });
  }, [draft?.shape, floorplanManager]);

  return (
    <>
      <div
        ref={viewer2DRef}
        className="planner-viewer planner-viewer-2d"
        role="region"
        aria-label="2D room viewer"
        data-active={mode === '2d'}
        aria-hidden={mode !== '2d'}
        inert={mode !== '2d'}
      ></div>
      <div
        ref={viewer3DRef}
        className="planner-viewer planner-viewer-3d"
        role="region"
        aria-label="3D room viewer"
        data-active={mode === '3d'}
        aria-hidden={mode !== '3d'}
        inert={mode !== '3d'}
      ></div>
    </>
  );
}
