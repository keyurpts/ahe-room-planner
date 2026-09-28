import * as THREE from "three";
import { RGBELoader, GroundedSkybox } from "three/examples/jsm/Addons.js";
import { v4 as uuidv4 } from "uuid";
import { LightTypes } from "../Constants";

/** Available light types */
type LightType = LightTypes.DIRECTIONAL | LightTypes.SPOT | LightTypes.POINT | LightTypes.HEMISPHERE | LightTypes.AMBIENT | "Directional" | "Spot" | "Point" | "Hemisphere" | "Ambient";

/**
 * Common properties shared by most light types.
 */
interface BaseLightOptions {
  /**
   * Color of the light (hex or string), default is white (0xffffff).
   */
  color?: number | string;
  /**
   * Intensity of the light, default is 1.
   */
  intensity?: number;
  /**
   * Position of the light in 3D space.
   */
  position?: { x: number; y: number; z: number };
  /**
   * Whether this light casts shadows.
   */
  castShadow?: boolean;
  /**
   * Shadow map configuration.
   */
  shadow?: {
    /**
     * Resolution of the shadow map.
     */
    mapSize?: { width: number; height: number };
    /**
     * Shadow bias to reduce artifacts.
     */
    bias?: number;
    /**
     * Shadow normal bias to reduce artifacts.
     */
    normalBias?: number;
    /**
     * Shadow radius for soft shadows.
     */
    radius?: number;
    /**
     * Shadow camera frustum configuration.
     */
    camera?: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
      near?: number;
      far?: number;
    };
  };
}

/**
 * Options for a Directional Light.
 */
interface DirectionalLightOptions extends BaseLightOptions {
  /**
   * Optional target position for the directional light (defaults to origin if not set).
   */
  target?: { x: number; y: number; z: number };
}

/**
 * Options for a Spot Light.
 */
interface SpotLightOptions extends BaseLightOptions {
  distance?: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
  target?: { x: number; y: number; z: number };
}

/**
 * Options for a Point Light.
 */
interface PointLightOptions extends BaseLightOptions {
  distance?: number;
  decay?: number;
}

/**
 * Options for a Hemisphere Light.
 */
interface HemisphereLightOptions {
  skyColor?: number | string;
  groundColor?: number | string;
  intensity?: number;
  position?: { x: number; y: number; z: number };
}

/**
 * Options for an Ambient Light.
 */
interface AmbientLightOptions {
  color?: number | string;
  intensity?: number;
}

/**
 * Type mapping from LightType to its options interface.
 */
interface LightOptionsMap {
  Directional: DirectionalLightOptions;
  Spot: SpotLightOptions;
  Point: PointLightOptions;
  Hemisphere: HemisphereLightOptions;
  Ambient: AmbientLightOptions;
}

/**
 * LightsManager class: Manages multiple Three.js lights with unique IDs,
 * allowing addition, update, removal, and grouping via presets.
 */
export class LightsManager {
  /**
   * The Three.js Scene instance to manage lights in.
   */
  private scene: THREE.Scene;

  /**
   * Map of light ID to its instance and optional target (for directional/spot lights).
   */
  private lights: Map<string, { light: THREE.Light; target?: THREE.Object3D }> = new Map();

  /**
   * Main model of the scene, used for skybox positioning.
   */
  private _mainModel?: THREE.Object3D;

  /**
   * Height of the current grounded skybox.
   */
  private skyboxHeight: number = 24;

  /**
   * Loaded environment map (PMREM texture).
   */
  private envMap: any = null;

  /**
   * Grounded skybox background mesh.
   */
  private background: any = null;

  /**
   * Intensity of the environment map light source.
   */
  private environmentIntensity: number = 0;

  /**
   * Persistent shadow plane for ground shadows.
   */
  private shadowPlane?: THREE.Mesh;

  /**
   * Sets the main model of the scene, which is used for skybox positioning.
   * @param model - The main 3D model object to reference.
   */
  public set mainModel(model: THREE.Object3D | undefined) {
    this._mainModel = model;
  }

  /**
   * Retrieves the main model of the scene.
   * @returns The main THREE.Object3D model, or undefined if not set.
   */
  public get mainModel(): THREE.Object3D | undefined {
    return this._mainModel;
  }

  /**
   * Create a LightsManager for a given scene.
   * @param scene - The Three.js Scene instance to manage lights in.
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Add a new light to the scene.
   * @param type - Type of the light ('Directional', 'Spot', 'Point', 'Hemisphere', or 'Ambient').
   * @param options - Configuration options for the light.
   * @param id - Optional unique ID for the light; if not provided, a UUID is generated.
   * @returns The unique ID of the added light.
   */
  public AddLight<T extends LightType>(
    type: T,
    options: LightOptionsMap[T],
    id?: string
  ): string {
    const lightId = id || uuidv4();

    let light: THREE.Light;
    let targetObject: THREE.Object3D | undefined;

    switch (type) {
      case LightTypes.DIRECTIONAL: {
        const opts = options as DirectionalLightOptions;
        const color = opts.color !== undefined ? opts.color : 0xffffff;
        const intensity = opts.intensity !== undefined ? opts.intensity : 1;
        const dirLight = new THREE.DirectionalLight(color, intensity);

        if (opts.position) {
          dirLight.position.set(
            opts.position.x,
            opts.position.y,
            opts.position.z
          );
        }

        if (opts.target) {
          const target = new THREE.Object3D();
          target.position.set(opts.target.x, opts.target.y, opts.target.z);
          this.scene.add(target);
          dirLight.target = target;
          targetObject = target;
        }
        light = dirLight;
        break;
      }
      case LightTypes.SPOT: {
        const opts = options as SpotLightOptions;
        const color = opts.color !== undefined ? opts.color : 0xffffff;
        const intensity = opts.intensity !== undefined ? opts.intensity : 1;
        const spot = new THREE.SpotLight(color, intensity);

        if (opts.position) {
          spot.position.set(opts.position.x, opts.position.y, opts.position.z);
        }

        if (opts.distance !== undefined) spot.distance = opts.distance;
        if (opts.angle !== undefined) spot.angle = opts.angle;
        if (opts.penumbra !== undefined) spot.penumbra = opts.penumbra;
        if (opts.decay !== undefined) spot.decay = opts.decay;

        if (opts.target) {
          const target = new THREE.Object3D();
          target.position.set(opts.target.x, opts.target.y, opts.target.z);
          this.scene.add(target);
          spot.target = target;
          targetObject = target;
        }
        light = spot;
        break;
      }
      case LightTypes.POINT: {
        const opts = options as PointLightOptions;
        const color = opts.color !== undefined ? opts.color : 0xffffff;
        const intensity = opts.intensity !== undefined ? opts.intensity : 1;
        const point = new THREE.PointLight(color, intensity);

        if (opts.position) {
          point.position.set(opts.position.x, opts.position.y, opts.position.z);
        }

        if (opts.distance !== undefined) point.distance = opts.distance;
        if (opts.decay !== undefined) point.decay = opts.decay;
        light = point;
        break;
      }
      case LightTypes.HEMISPHERE: {
        const opts = options as HemisphereLightOptions;
        const skyColor = opts.skyColor !== undefined ? opts.skyColor : 0xffffff;
        const groundColor = opts.groundColor !== undefined ? opts.groundColor : 0x444444;
        const intensity = opts.intensity !== undefined ? opts.intensity : 1;
        const hemi = new THREE.HemisphereLight(
          skyColor,
          groundColor,
          intensity
        );

        if (opts.position) {
          hemi.position.set(opts.position.x, opts.position.y, opts.position.z);
        }
        light = hemi;
        break;
      }
      case LightTypes.AMBIENT: {
        const opts = options as AmbientLightOptions;
        const color = opts.color !== undefined ? opts.color : 0xffffff;
        const intensity = opts.intensity !== undefined ? opts.intensity : 1;
        const ambient = new THREE.AmbientLight(color, intensity);
        light = ambient;
        break;
      }
      default:
        throw new Error(`Unsupported light type: ${type}`);
    }

    if ("castShadow" in options && (options as BaseLightOptions).castShadow) {
      (light as any).castShadow = true;
    }

    if ((options as BaseLightOptions).shadow) {
      const shadowOpts = (options as BaseLightOptions).shadow!;
      if (shadowOpts.mapSize && light.shadow) {
        light.shadow.mapSize.set(
          shadowOpts.mapSize.width,
          shadowOpts.mapSize.height
        );
      }
      if (shadowOpts.bias !== undefined && light.shadow) {
        light.shadow.bias = shadowOpts.bias;
      }
      if (shadowOpts.normalBias !== undefined && light.shadow) {
        (light.shadow as any).normalBias = shadowOpts.normalBias;
      }
      if (shadowOpts.radius !== undefined && light.shadow) {
        light.shadow.radius = shadowOpts.radius;
      }
      if (shadowOpts.camera && light.shadow && light.shadow.camera) {
        const cam = light.shadow.camera as any;
        const camOpts = shadowOpts.camera;
        if (camOpts.left !== undefined) cam.left = camOpts.left;
        if (camOpts.right !== undefined) cam.right = camOpts.right;
        if (camOpts.top !== undefined) cam.top = camOpts.top;
        if (camOpts.bottom !== undefined) cam.bottom = camOpts.bottom;
        if (camOpts.near !== undefined) cam.near = camOpts.near;
        if (camOpts.far !== undefined) cam.far = camOpts.far;
        if (cam.updateProjectionMatrix) cam.updateProjectionMatrix();
      }
    }

    this.scene.add(light);
    this.lights.set(lightId, { light, target: targetObject });
    return lightId;
  }

  /**
   * Update properties of an existing light by ID.
   * @param id - The unique ID of the light to update.
   * @param options - Partial configuration for the light.
   * @returns True if the light was found and updated, false otherwise.
   */
  public updateLight(
    id: string,
    options: Partial<
      DirectionalLightOptions &
      SpotLightOptions &
      PointLightOptions &
      HemisphereLightOptions &
      AmbientLightOptions
    >
  ): boolean {
    const entry = this.lights.get(id);
    if (!entry) return false;
    const light = entry.light;

    if (options.position) {
      light.position.set(
        options.position.x,
        options.position.y,
        options.position.z
      );
    }

    if ((options as any).intensity !== undefined) {
      (light as any).intensity = (options as any).intensity;
    }

    if ((options as any).castShadow !== undefined) {
      (light as any).castShadow = (options as any).castShadow;
    }

    if ((options as any).shadow) {
      const shadowOpts = (options as any).shadow;
      if (shadowOpts.mapSize && light.shadow) {
        light.shadow.mapSize.set(
          shadowOpts.mapSize.width,
          shadowOpts.mapSize.height
        );
      }
      if (shadowOpts.normalBias !== undefined && light.shadow) {
        (light.shadow as any).normalBias = shadowOpts.normalBias;
      }
      if (shadowOpts.radius !== undefined && light.shadow) {
        light.shadow.radius = shadowOpts.radius;
      }
      if (shadowOpts.camera && light.shadow && light.shadow.camera) {
        const cam = light.shadow.camera as any;
        const camOpts = shadowOpts.camera;
        if (camOpts.left !== undefined) cam.left = camOpts.left;
        if (camOpts.right !== undefined) cam.right = camOpts.right;
        if (camOpts.top !== undefined) cam.top = camOpts.top;
        if (camOpts.bottom !== undefined) cam.bottom = camOpts.bottom;
        if (camOpts.near !== undefined) cam.near = camOpts.near;
        if (camOpts.far !== undefined) cam.far = camOpts.far;
        if (cam.updateProjectionMatrix) cam.updateProjectionMatrix();
      }
    }

    if (light instanceof THREE.DirectionalLight) {
      if ((options as DirectionalLightOptions).color !== undefined) {
        light.color = new THREE.Color(
          (options as DirectionalLightOptions).color!
        );
      }
      const dirOpts = options as DirectionalLightOptions;
      if (dirOpts.target) {
        const t = dirOpts.target;
        if (entry.target) {
          entry.target.position.set(t.x, t.y, t.z);
        } else {
          const target = new THREE.Object3D();
          target.position.set(t.x, t.y, t.z);
          this.scene.add(target);
          light.target = target;
          entry.target = target;
        }
      }
    } else if (light instanceof THREE.SpotLight) {
      if ((options as SpotLightOptions).color !== undefined) {
        light.color = new THREE.Color((options as SpotLightOptions).color!);
      }
      const spotOpts = options as SpotLightOptions;
      if (spotOpts.distance !== undefined) light.distance = spotOpts.distance!;
      if (spotOpts.angle !== undefined) light.angle = spotOpts.angle!;
      if (spotOpts.penumbra !== undefined) light.penumbra = spotOpts.penumbra!;
      if (spotOpts.decay !== undefined) light.decay = spotOpts.decay!;
      if (spotOpts.target) {
        const t = spotOpts.target;
        if (entry.target) {
          entry.target.position.set(t.x, t.y, t.z);
        } else {
          const target = new THREE.Object3D();
          target.position.set(t.x, t.y, t.z);
          this.scene.add(target);
          light.target = target;
          entry.target = target;
        }
      }
    } else if (light instanceof THREE.PointLight) {
      if ((options as PointLightOptions).color !== undefined) {
        light.color = new THREE.Color((options as PointLightOptions).color!);
      }
      const pointOpts = options as PointLightOptions;
      if (pointOpts.distance !== undefined) {
        light.distance = pointOpts.distance!;
      }
      if (pointOpts.decay !== undefined) light.decay = pointOpts.decay!;
    } else if (light instanceof THREE.HemisphereLight) {
      const hemiOpts = options as HemisphereLightOptions;
      if (hemiOpts.skyColor !== undefined) {
        light.color = new THREE.Color(hemiOpts.skyColor);
      }
      if (hemiOpts.groundColor !== undefined) {
        light.groundColor = new THREE.Color(hemiOpts.groundColor);
      }
      if (hemiOpts.intensity !== undefined) {
        light.intensity = hemiOpts.intensity!;
      }
    } else if (light instanceof THREE.AmbientLight) {
      const ambOpts = options as AmbientLightOptions;
      if (ambOpts.color !== undefined) {
        light.color = new THREE.Color(ambOpts.color!);
      }
      if (ambOpts.intensity !== undefined) {
        light.intensity = ambOpts.intensity!;
      }
    }

    return true;
  }

  /**
   * Remove a light from the scene by its ID.
   * @param id - The unique ID of the light to remove.
   * @returns True if the light was found and removed, false otherwise.
   */
  public removeLight(id: string): boolean {
    const entry = this.lights.get(id);
    if (!entry) return false;
    this.scene.remove(entry.light);
    if (entry.target) {
      this.scene.remove(entry.target);
    }
    this.lights.delete(id);
    return true;
  }

  /**
   * Get a light instance by its ID.
   * @param id - The unique ID of the light.
   * @returns The Three.js Light instance or undefined if not found.
   */
  public getLight(id: string): THREE.Light | undefined {
    return this.lights.get(id)?.light;
  }

  /**
   * Get all active lights.
   * @returns Array of all Three.js Light instances.
   */
  public getAllLights(): THREE.Light[] {
    return Array.from(this.lights.values()).map((entry) => entry.light);
  }

  /**
   * Get all lights of a specific type.
   * @param type - The LightType to filter by.
   * @returns Array of Three.js Light instances of the given type.
   */
  public getLightsByType(type: LightType): THREE.Light[] {
    const result: THREE.Light[] = [];
    for (const entry of this.lights.values()) {
      const light = entry.light;
      switch (type) {
        case "Directional":
          if (light instanceof THREE.DirectionalLight) result.push(light);
          break;
        case "Spot":
          if (light instanceof THREE.SpotLight) result.push(light);
          break;
        case "Point":
          if (light instanceof THREE.PointLight) result.push(light);
          break;
        case "Hemisphere":
          if (light instanceof THREE.HemisphereLight) result.push(light);
          break;
        case "Ambient":
          if (light instanceof THREE.AmbientLight) result.push(light);
          break;
      }
    }
    return result;
  }

  /**
   * Loads an HDR equirectangular environment map using PMREMGenerator and applies it to the scene background/environment.
   * @param renderer - The WebGLRenderer instance to compile the shaders.
   * @param envMapUrl - The URL of the HDR environment map.
   * @param intensity - Optional environment map intensity (default is 1.0).
   * @returns A promise that resolves when the environment map is loaded and applied.
   */
  public async loadEnvironmentMap(
    renderer: THREE.WebGLRenderer,
    envMapUrl: string,
    intensity: number = 1.0
  ) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const hdrLoader = new RGBELoader();

    const hdr = await hdrLoader.loadAsync(envMapUrl || "default.hdr");
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const envMap = pmrem.fromEquirectangular(hdr).texture;

    this.envMap = envMap;
    this.background = hdr;
    this.environmentIntensity = intensity;

    this.scene.environment = envMap;
    this.scene.environmentIntensity = intensity;

    this.scene.background = hdr;
    this.scene.backgroundIntensity = 0.08;
    this.scene.backgroundBlurriness = 0.65;

    const existingSkybox = this.scene.getObjectByName("GroundedSkyBox");
    if (existingSkybox) {
      const oldSkybox = existingSkybox as any;
      if (oldSkybox.material && oldSkybox.material.map) {
        oldSkybox.material.map.dispose();
      }
      this.scene.remove(existingSkybox);
    }

    if (hdr) {
      this.skyboxHeight = 6;
      const skybox = new GroundedSkybox(hdr, this.skyboxHeight * 2, 20 * 2, 512);
      skybox.name = "GroundedSkyBox";
      skybox.scale.setScalar(0.5);
    }

    pmrem.dispose();
  }

  /**
   * Toggles the environment map and background visibility on or off in the scene.
   * @param enable - True to enable the environment map and background, false to disable.
   */
  public enableEnvMap(enable: boolean) {
    if (enable) {
      this.scene.environment = this.envMap;
      this.scene.environmentIntensity = this.environmentIntensity;
      this.scene.background = this.background;
    } else {
      this.scene.environment = null;
      this.scene.environmentIntensity = 0;
      this.scene.background = null;
    }
  }

  /**
   * Initializes a global ground shadow plane at y=0.
   * This plane uses ShadowMaterial to be invisible except for cast shadows.
   * @param size - The size of the plane (default 500).
   * @param opacity - The opacity of the shadows (default 0.5).
   */
  public initGroundShadowPlane(size: number = 500, opacity: number = 0.5) {
    if (this.shadowPlane) {
      this.scene.remove(this.shadowPlane);
      if (this.shadowPlane.geometry) this.shadowPlane.geometry.dispose();
      if (this.shadowPlane.material) (this.shadowPlane.material as THREE.Material).dispose();
    }

    const planeGeometry = new THREE.PlaneGeometry(size, size);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: opacity });
    this.shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);

    this.shadowPlane.name = "GlobalGroundShadowPlane";
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = 0;
    this.shadowPlane.receiveShadow = true;

    this.scene.add(this.shadowPlane);
  }
}
