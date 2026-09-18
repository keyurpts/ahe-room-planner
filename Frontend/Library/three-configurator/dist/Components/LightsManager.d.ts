import * as THREE from "three";
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
    position?: {
        x: number;
        y: number;
        z: number;
    };
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
        mapSize?: {
            width: number;
            height: number;
        };
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
    target?: {
        x: number;
        y: number;
        z: number;
    };
}
/**
 * Options for a Spot Light.
 */
interface SpotLightOptions extends BaseLightOptions {
    distance?: number;
    angle?: number;
    penumbra?: number;
    decay?: number;
    target?: {
        x: number;
        y: number;
        z: number;
    };
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
    position?: {
        x: number;
        y: number;
        z: number;
    };
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
export declare class LightsManager {
    /**
     * The Three.js Scene instance to manage lights in.
     */
    private scene;
    /**
     * Map of light ID to its instance and optional target (for directional/spot lights).
     */
    private lights;
    /**
     * Main model of the scene, used for skybox positioning.
     */
    private _mainModel?;
    /**
     * Height of the current grounded skybox.
     */
    private skyboxHeight;
    /**
     * Loaded environment map (PMREM texture).
     */
    private envMap;
    /**
     * Grounded skybox background mesh.
     */
    private background;
    /**
     * Intensity of the environment map light source.
     */
    private environmentIntensity;
    /**
     * Persistent shadow plane for ground shadows.
     */
    private shadowPlane?;
    /**
     * Sets the main model of the scene, which is used for skybox positioning.
     * @param model - The main 3D model object to reference.
     */
    set mainModel(model: THREE.Object3D | undefined);
    /**
     * Retrieves the main model of the scene.
     * @returns The main THREE.Object3D model, or undefined if not set.
     */
    get mainModel(): THREE.Object3D | undefined;
    /**
     * Create a LightsManager for a given scene.
     * @param scene - The Three.js Scene instance to manage lights in.
     */
    constructor(scene: THREE.Scene);
    /**
     * Add a new light to the scene.
     * @param type - Type of the light ('Directional', 'Spot', 'Point', 'Hemisphere', or 'Ambient').
     * @param options - Configuration options for the light.
     * @param id - Optional unique ID for the light; if not provided, a UUID is generated.
     * @returns The unique ID of the added light.
     */
    AddLight<T extends LightType>(type: T, options: LightOptionsMap[T], id?: string): string;
    /**
     * Update properties of an existing light by ID.
     * @param id - The unique ID of the light to update.
     * @param options - Partial configuration for the light.
     * @returns True if the light was found and updated, false otherwise.
     */
    updateLight(id: string, options: Partial<DirectionalLightOptions & SpotLightOptions & PointLightOptions & HemisphereLightOptions & AmbientLightOptions>): boolean;
    /**
     * Remove a light from the scene by its ID.
     * @param id - The unique ID of the light to remove.
     * @returns True if the light was found and removed, false otherwise.
     */
    removeLight(id: string): boolean;
    /**
     * Get a light instance by its ID.
     * @param id - The unique ID of the light.
     * @returns The Three.js Light instance or undefined if not found.
     */
    getLight(id: string): THREE.Light | undefined;
    /**
     * Get all active lights.
     * @returns Array of all Three.js Light instances.
     */
    getAllLights(): THREE.Light[];
    /**
     * Get all lights of a specific type.
     * @param type - The LightType to filter by.
     * @returns Array of Three.js Light instances of the given type.
     */
    getLightsByType(type: LightType): THREE.Light[];
    /**
     * Loads an HDR equirectangular environment map using PMREMGenerator and applies it to the scene background/environment.
     * @param renderer - The WebGLRenderer instance to compile the shaders.
     * @param envMapUrl - The URL of the HDR environment map.
     * @param intensity - Optional environment map intensity (default is 1.0).
     * @returns A promise that resolves when the environment map is loaded and applied.
     */
    loadEnvironmentMap(renderer: THREE.WebGLRenderer, envMapUrl: string, intensity?: number): Promise<void>;
    /**
     * Toggles the environment map and background visibility on or off in the scene.
     * @param enable - True to enable the environment map and background, false to disable.
     */
    enableEnvMap(enable: boolean): void;
    /**
     * Initializes a global ground shadow plane at y=0.
     * This plane uses ShadowMaterial to be invisible except for cast shadows.
     * @param size - The size of the plane (default 500).
     * @param opacity - The opacity of the shadows (default 0.5).
     */
    initGroundShadowPlane(size?: number, opacity?: number): void;
}
export {};
