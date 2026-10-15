import { restoreTexture } from './restore-texture';
import { TextureLoader, RepeatWrapping, type Texture } from 'three';
import { prefetchModels } from './model-prefetch';
import { ConfiguratorCore, Events, ConfiguratorEventType } from 'three-configurator';
import type { Sprite, Object3D } from 'three';
import { LengthUnit, formatLength } from './units';
import { removeGroundPlane } from './background';

/** Application-specific scene behavior and measurement formatting. */
export class ConfiguratorCoreWrapper extends ConfiguratorCore {
  private trackedModels = new Set<WeakRef<Object3D>>();
  private trackModelLoads = false;

  private selectedTextureTarget(): Object3D | undefined {
    const id = this.getModelId();
    if (!id) return undefined;
    for (const reference of this.trackedModels) {
      const model = reference.deref();
      if (!model) { this.trackedModels.delete(reference); continue; }
      if (model.parent && model.userData.metadata?.id === id) return model;
    }
    return undefined;
  }

  private restoredTextures = new Map<string, Promise<Texture>>();
  private textureWork: Promise<void> = Promise.resolve();
  private textureGeneration = 0;

  override applyTextureToModel(...args: Parameters<ConfiguratorCore['applyTextureToModel']>): void {
    const [url, id, price, explicitModel] = args;
    const model = explicitModel ?? this.selectedTextureTarget();
    if (!model) {
      super.applyTextureToModel(...args);
      return;
    }
    const generation = this.textureGeneration;
    this.textureWork = this.textureWork.then(async () => {
      if (generation !== this.textureGeneration || !model.parent) return;
      const texture = await this.preloadTexture(url, id);
      if (generation === this.textureGeneration && model.parent) {
        await restoreTexture(model, texture, id, price);
        if (!this.modelDownloads) Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
      }
    }).catch(error => { console.error('Unable to apply model texture.', error); });
  }

  /** Warm a cupboard finish once per texture ID, even if its signed URL changes. */
  preloadTexture(url: string, id: string): Promise<Texture> {
    let request = this.restoredTextures.get(id);
    if (!request) {
      const generation = this.textureGeneration;
      request = new TextureLoader().loadAsync(url).then(texture => {
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(2, 2);
        texture.anisotropy = 16;
        if (generation !== this.textureGeneration) texture.dispose();
        return texture;
      }).catch(error => { this.restoredTextures.delete(id); throw error; });
      this.restoredTextures.set(id, request);
    }
    return request;
  }

  private modelFiles = new Map<string, Promise<string>>();

  override dispose(): void {
    this.textureGeneration++;
    super.dispose();
    this.restoredTextures.forEach(request => { void request.then(texture => texture.dispose()).catch(() => {}); });
    this.restoredTextures.clear();
    this.trackedModels.clear();
    this.modelFiles.forEach(request => { void request.then(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }).catch(() => {}); });
    this.modelFiles.clear();
  }

  private modelDownloads: ReturnType<typeof prefetchModels> | null = null;

  override async import3DConfig(config: Parameters<ConfiguratorCore['import3DConfig']>[0]) {
    const prepared = prefetchModels(typeof config === 'string' ? JSON.parse(config) : config, fetch, this.modelFiles);
    this.modelDownloads = prepared;
    let result: Awaited<ReturnType<ConfiguratorCore['import3DConfig']>>;
    try {
      result = await super.import3DConfig(prepared.config);
    } finally {
      await this.textureWork;
      this.modelDownloads = null;
      await prepared.release();
    }
    Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
    return result;
  }

  override async loadModel(...args: Parameters<ConfiguratorCore['loadModel']>) {
    // Observe the public loader result, including cache hits and preview models.
    // Capture the actual object before the core assigns metadata and places it.
    if (!this.trackModelLoads) {
      const loader = this.getAssetLoader();
      const load = loader.loadGLB.bind(loader);
      loader.loadGLB = async (...parameters: Parameters<typeof load>) => {
        const model = await load(...parameters);
        this.trackedModels.add(new WeakRef(model));
        return model;
      };
      this.trackModelLoads = true;
    }
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const ownDownload = this.modelDownloads ? null : prefetchModels({ model: {
      url: args[0], children: [], modelData: args[6],
    } }, fetch, this.modelFiles);
    try {
      const url = await (this.modelDownloads ?? ownDownload)!.resolveUrl(args[0]);
      const [, isPreview, position, rotation, callbacks, isSelectable, metadata] = args;
      return await super.loadModel(url, isPreview, position, rotation, callbacks, isSelectable, metadata);
    } finally {
      await ownDownload?.release();
    }
  }

  private solidBackgroundColor = 0xffffff;

  override async loadEnvironmentMap(...args: Parameters<ConfiguratorCore['loadEnvironmentMap']>): Promise<void> {
    await super.loadEnvironmentMap(...args);
    // The SDK also uses the HDR as its visible background. Keep its lighting,
    // but restore the latest chosen solid color after asynchronous loading.
    super.setBackgroundColor(this.solidBackgroundColor);
  }
  /** Keep the room and its floor, but remove the exterior textured plane. */
  override load2DTo3DMesh(...args: Parameters<ConfiguratorCore['load2DTo3DMesh']>): void {
    try {
      super.load2DTo3DMesh(...args);
    } finally {
      removeGroundPlane(args[1]);
    }
  }

  private unit = LengthUnit.MM;

  setLengthUnit(unit: LengthUnit): void {
    this.unit = unit;
    this.refreshMeasurementLabels();
  }

  override drawMeasurementLine(...args: Parameters<ConfiguratorCore['drawMeasurementLine']>): void {
    super.drawMeasurementLine(...args);
    this.refreshMeasurementLabels();
  }

  private refreshMeasurementLabels(): void {
    this.measurementGroup?.children.forEach(child => {
      if (child.type !== 'Sprite' || typeof child.userData.distance !== 'number') return;
      const sprite = child as Sprite;
      const text = formatLength(child.userData.distance * 100, this.unit ?? LengthUnit.MM);
      if (sprite.userData.text === text) return;
      const texture = sprite.material.map;
      if (!texture) return;
      const canvas = texture.image as HTMLCanvasElement;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to format the measurement label.');
      context.clearRect(0, 0, canvas.width, canvas.height);
      // Preserve the SDK's existing font, color and alignment.
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      sprite.userData.text = text;
      texture.needsUpdate = true;
    });
  }
}
