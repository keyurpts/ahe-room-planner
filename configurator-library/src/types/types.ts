import { Vector3, Euler, Object3D } from "three";

/**
 * Configuration state interface
 * Represents the current state of the configurator
 */
export interface ConfigState {
  /**
   * Camera position in 3D space
   */
  cameraPosition: Vector3;

  /**
   * Camera rotation in 3D space
   */
  cameraRotation: Euler;

  /**
   * Array of loaded model information
   */
  loadedModels: {
    /**
     * Unique identifier for the model
     */
    id: string;

    /**
     * URL from which the model was loaded
     */
    url: string;

    /**
     * Position of the model in 3D space
     */
    position?: Vector3;

    /**
     * Rotation of the model in 3D space
     */
    rotation?: Euler;

    /**
     * Scale of the model in 3D space
     */
    scale?: Vector3;

    /**
     * Visibility state of the model
     */
    visible?: boolean;
  }[];

  /**
   * Additional custom properties
   */
  [key: string]: any;
}

/**
 * Supported control types
 */
export type ControlType = "orbit" | "trackball" | "pointerlock" | "transform";

/**
 * Supported camera projection types
 */
export type CameraType = "perspective" | "orthographic";

/**
 * Configurator options interface
 * Used to initialize the configurator with specific settings
 */
export interface ConfiguratorOptions {
  /**
   * DOM element or selector where the configurator will be rendered
   */
  container: HTMLElement | string;

  /**
   * Width of the renderer (optional, defaults to container width)
   */
  width?: number;

  /**
   * Height of the renderer (optional, defaults to container height)
   */
  height?: number;

  /**
   * Background color of the scene (optional)
   */
  backgroundColor?: number;

  /**
   * Camera type (optional, defaults to 'perspective')
   */
  cameraType?: CameraType;

  /**
   * Initial camera position (optional)
   */
  cameraPosition?: {
    x: number;
    y: number;
    z: number;
  };

  /**
   * Only one control type can be set: 'orbit', 'trackball', 'transform' or 'pointerLock'
   */
  controlType?: ControlType;

  /**
   * Enable or disable shadows (optional, defaults to false)
   */
  enableShadows?: boolean;

  /**
   * Pixel ratio for the renderer (optional, defaults to window.devicePixelRatio)
   */
  pixelRatio?: number;

  /**
   * Additional custom options
   */
  [key: string]: any;
}

/**
 * Callbacks for monitoring the loading progress of 3D models
 */
export interface ModelLoadCallbacks {
  /**
   * Callback fired periodically with progress event data during model loading
   */
  onModelLoading?: (progress: ProgressEvent<EventTarget>) => void;

  /**
   * Callback fired when a model has successfully loaded, receiving the loaded Object3D
   */
  onModelLoaded?: (object: Object3D) => void;

  /**
   * Callback fired if an error occurs during model loading
   */
  onModelError?: (error: Error | unknown) => void;
}

/**
 * Represents the base model configuration properties
 */
export interface BaseModel {
  /**
   * Unique identifier for the base model
   */
  id: string;

  /**
   * Resource URL of the base model file
   */
  url: string;

  /**
   * Format of the model file (e.g., 'gltf', 'glb', 'obj')
   */
  format: string;

  /**
   * Initial rotation applied to the base model in the scene
   */
  rotation: Euler;

  /**
   * Initial position applied to the base model in the scene
   */
  position: Vector3;
}

/**
 * Represents a configurable part variant that can be swapped into the model
 */
export interface ConfigPart {
  /**
   * Unique identifier for the config part
   */
  id: string;

  /**
   * Display name of the part
   */
  name: string;

  /**
   * Resource URI or URL of the part model file
   */
  uri: string;

  /**
   * URL of the preview image/thumbnail for this part option
   */
  previewImage: string;

  /**
   * Format of the part model file (e.g., 'gltf', 'glb')
   */
  format: string;
}

/**
 * Represents material options that can be applied to parts
 */
export interface ConfigMaterial {
  /**
   * Unique identifier for the material
   */
  id: string;

  /**
   * Display name of the material
   */
  name: string;

  /**
   * Hex color string or name (e.g. '#ffffff')
   */
  color: string;

  /**
   * Metalness value of the material, between 0.0 and 1.0
   */
  metalness: number;

  /**
   * Roughness value of the material, between 0.0 and 1.0
   */
  roughness: number;

  /**
   * Defines which side of faces will be rendered (e.g., 'front', 'back', 'double')
   */
  side: string;

  /**
   * ID of the texture associated with this material, if any
   */
  texture: string;
}

/**
 * Represents texture settings that can be applied to materials
 */
export interface Texture {
  /**
   * Unique identifier for the texture
   */
  id: string;

  /**
   * Display name of the texture
   */
  name: string;

  /**
   * URL of the preview image/thumbnail for this texture
   */
  previewImage: string;

  /**
   * Wrapping mode for texture coordinate S (U direction)
   */
  wrapS: string;

  /**
   * Wrapping mode for texture coordinate T (V direction)
   */
  wrapT: string;

  /**
   * Number of times the texture repeats in [U, V] directions
   */
  repeat: [number, number];
}

/**
 * Configuration options mapped to a specific base part
 */
export interface ConfigOption {
  /**
   * The ID of the target base part this option configures
   */
  basePart: string;

  /**
   * Display name of the configuration option group
   */
  name: string;

  /**
   * List of part IDs representing the valid swap variants for this part
   */
  partVariants: string[];

  /**
   * List of material IDs representing the valid material choices for this part
   */
  materialOptions: string[];

  /**
   * List of texture IDs representing the valid texture choices for this part
   */
  textureOptions: string[];
}

/**
 * Metadata about the project configuration
 */
export interface Meta {
  /**
   * Name or identifier of the creator
   */
  createdBy: string;

  /**
   * ISO 8601 timestamp indicating when the project was created
   */
  createdAt: string;

  /**
   * Descriptive tags associated with the project
   */
  tags: string[];
}

/**
 * Information mapping a tooltip message to a specific base part
 */
export interface ToolTip {
  /**
   * The ID of the part that triggers this tooltip
   */
  basePart: string;

  /**
   * The text message content of the tooltip
   */
  message: string;
}

/**
 * The complete configuration schema for a 3D configurator project
 */
export interface ProjectConfig {
  /**
   * Unique identifier for the project
   */
  projectId: string;

  /**
   * Display name of the project
   */
  name: string;

  /**
   * Semantic version of the configuration schema/data
   */
  version: string;

  /**
   * Property name on the 3D meshes used to identify matchable parts (e.g. 'name' or userData property)
   */
  partIdentifierProperty: string;

  /**
   * Base model details
   */
  baseModel: BaseModel;

  /**
   * List of all configurable model parts
   */
  configParts: ConfigPart[];

  /**
   * List of all customizable materials
   */
  configMaterials: ConfigMaterial[];

  /**
   * List of all customizable textures
   */
  textures: Texture[];

  /**
   * List of design configurations options for each part
   */
  configOptions: ConfigOption[];

  /**
   * Project metadata
   */
  meta: Meta;

  /**
   * List of tooltips attached to interactive parts
   */
  toolTips: ToolTip[];

  /**
   * Custom business constraints or rules
   */
  constraints: Record<string, unknown>;

  /**
   * Previously saved configuration state values
   */
  savedState: Record<string, unknown>;
}

/**
 * HierarchyNode interface for ungrouped and grouped models in the scene
 */
export interface HierarchyNode {
  name: string;
  id: string;
  children: HierarchyNode[];
}
