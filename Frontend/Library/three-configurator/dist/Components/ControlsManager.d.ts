import * as THREE from "three";
import { PointerLockControls, TransformControls } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { TransformControlsMode, ControlTypes } from "../Constants";
/**
 * Type alias for all supported control types.
 */
type SupportedControls = OrbitControls | TrackballControls | PointerLockControls | TransformControls;
/**
 * Enum-like union of allowed control types.
 */
type ControlsType = ControlTypes.ORBIT | ControlTypes.TRACKBALL | ControlTypes.POINTER_LOCK | ControlTypes.TRANSFORM | "orbit" | "trackball" | "pointerlock" | "transform";
/**
 * ControlsManager class manages different camera controls like Orbit, Trackball,
 * PointerLock, and TransformControls, allowing for dynamic switching and clean integration.
 */
export declare class ControlsManager {
    /**
     * The Three.js scene instance where the control helpers (like transform gizmo) are added.
     */
    private readonly scene;
    /**
     * Map storing registered control instances by their unique string identifiers.
     */
    private readonly controlsMap;
    /**
     * Unique identifier of the currently active camera control.
     */
    private activeControlId;
    /**
     * Instance of TransformControls used for scaling/translating/rotating 3D objects.
     */
    private transformControl;
    /**
     * Click handler reference for PointerLockControls activation.
     */
    private pointerLockClickHandler;
    /**
     * The active transformation mode (translation, rotation, or scale) for TransformControls.
     */
    private currentTransformMode;
    /**
     * When true, an external animation (e.g. a camera fly-to tween) fully owns the
     * camera. The internal orbit auto-update loop skips both its angle-snapping and
     * its `orbit.update()` call so nothing overrides the animated pose.
     */
    isCameraAnimating: boolean;
    /**
     * Constructs a new ControlsManager.
     * @param scene - The Three.js scene reference to attach helpers (e.g., transform gizmo).
     */
    constructor(scene: THREE.Scene);
    /**
     * Adds a control instance to the manager.
     * @param id - Unique identifier for the control.
     * @param type - Type of control ('orbit' | 'trackball' | 'pointerlock' | 'transform').
     * @param camera - Camera to attach the control to.
     * @param domElement - DOM element used to capture input events.
     * @throws Will throw if the control ID already exists.
     */
    addControl(id: string, type: ControlsType, camera: THREE.Camera, domElement: HTMLElement): void;
    /**
     * Removes and disposes a registered control by ID.
     *
     * @param id - The ID of the control to remove.
     * @throws If the control ID is not found.
     * @returns void
     */
    RemoveControl(id: string): void;
    /**
     * Sets the active control by ID. Automatically disables others.
     * Allows OrbitControls to remain active when using TransformControls.
     * @param id - ID of the control to activate.
     * @param attachObject - Optional object to attach if using TransformControls.
     */
    setActiveControl(id: string, attachObject?: THREE.Object3D): void;
    /**
     * Attaches a target object to the TransformControls for manipulation.
     * Automatically adds the transform gizmo helper to the scene if it's not already present.
     *
     * @param object - The Object3D to attach to the TransformControls.
     */
    attachTransformTarget(object: THREE.Object3D): void;
    /**
     * Disables and cleans up the specified control.
     * Also removes helpers or listeners.
     *
     * @param id - Control ID to disable.
     */
    private disableControl;
    /**
     * Returns the currently active control instance.
     * @returns The active SupportedControls instance.
     * @throws If no active control is set.
     */
    getActiveControl(): SupportedControls;
    /**
     * Returns a registered control instance by ID.
     * @param id - The ID of the control to retrieve.
     * @returns The SupportedControls instance or undefined if not found.
     */
    getControl(id: string): SupportedControls | undefined;
    /**
     * Updates the currently active control.
     * Should be called inside the render/animation loop.
     * @param delta - Optional delta time for update (e.g., Orbit damping).
     */
    update(delta?: number): void;
    /**
     * Enables or disables a control manually.
     * @param id - Control ID.
     * @param enabled - `true` to enable, `false` to disable.
     */
    setControlEnabled(id: string, enabled: boolean): void;
    /**
     * Checks whether a control is registered.
     * @param id - Control ID.
     * @returns `true` if the control exists, otherwise `false`.
     */
    hasControl(id: string): boolean;
    /**
     * Returns an array of all registered control IDs.
     * @returns Array of control ID strings.
     */
    getControlIds(): string[];
    /**
     * Switches to transform mode with optional attachment and mode update.
     * @param mode - The transform mode: 'translate' | 'rotate' | 'scale'.
     * @param attachObject - Optional object to attach.
     */
    toggleTransformMode(mode: TransformControlsMode.TRANSLATE | TransformControlsMode.ROTATE | TransformControlsMode.SCALE, attachObject?: THREE.Object3D): void;
    /**
     * Gets the current transform mode.
     * @returns The current transform mode.
     */
    getCurrentTransformMode(): TransformControlsMode.TRANSLATE | TransformControlsMode.ROTATE | TransformControlsMode.SCALE;
    /**
     * Adjusts the size of the transform gizmo.
     * @param size - Size multiplier for TransformControls.
     */
    adjustTransformControlSize(size: number): void;
    /**
     * Shows or hides a specific transform axis.
     * @param axis - Axis to toggle visibility: 'x' | 'y' | 'z'.
     * @param visible - Boolean indicating visibility.
     */
    setTransformAxisVisibility(axis: "x" | "y" | "z", visible: boolean): void;
    /**
     * Updates the camera reference for all registered controls.
     * This is necessary when switching between perspective and orthographic cameras.
     * @param camera - The new camera instance.
     */
    updateCamera(camera: THREE.Camera): void;
}
export {};
