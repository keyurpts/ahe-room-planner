import * as THREE from "three";
import {
  PointerLockControls,
  TransformControls,
} from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { TransformControlsMode, ControlTypes, DOMEvents, RequiredStrings } from "../Constants";

/**
 * Type alias for all supported control types.
 */
type SupportedControls =
  | OrbitControls
  | TrackballControls
  | PointerLockControls
  | TransformControls;

/**
 * Enum-like union of allowed control types.
 */
type ControlsType = ControlTypes.ORBIT | ControlTypes.TRACKBALL | ControlTypes.POINTER_LOCK | ControlTypes.TRANSFORM | "orbit" | "trackball" | "pointerlock" | "transform";

/**
 * ControlsManager class manages different camera controls like Orbit, Trackball,
 * PointerLock, and TransformControls, allowing for dynamic switching and clean integration.
 */
export class ControlsManager {
  /**
   * The Three.js scene instance where the control helpers (like transform gizmo) are added.
   */
  private readonly scene: THREE.Scene;

  /**
   * Map storing registered control instances by their unique string identifiers.
   */
  private readonly controlsMap = new Map<string, SupportedControls>();

  /**
   * Unique identifier of the currently active camera control.
   */
  private activeControlId: string | null = null;

  /**
   * Instance of TransformControls used for scaling/translating/rotating 3D objects.
   */
  private transformControl: TransformControls | null = null;

  /**
   * Click handler reference for PointerLockControls activation.
   */
  private pointerLockClickHandler: (() => void) | null = null;

  /**
   * The active transformation mode (translation, rotation, or scale) for TransformControls.
   */
  private currentTransformMode: TransformControlsMode.TRANSLATE | TransformControlsMode.ROTATE | TransformControlsMode.SCALE = TransformControlsMode.TRANSLATE;

  /**
   * When true, an external animation (e.g. a camera fly-to tween) fully owns the
   * camera. The internal orbit auto-update loop skips both its angle-snapping and
   * its `orbit.update()` call so nothing overrides the animated pose.
   */
  public isCameraAnimating = false;

  /**
   * Constructs a new ControlsManager.
   * @param scene - The Three.js scene reference to attach helpers (e.g., transform gizmo).
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Adds a control instance to the manager.
   * @param id - Unique identifier for the control.
   * @param type - Type of control ('orbit' | 'trackball' | 'pointerlock' | 'transform').
   * @param camera - Camera to attach the control to.
   * @param domElement - DOM element used to capture input events.
   * @throws Will throw if the control ID already exists.
   */
  public addControl(
    id: string,
    type: ControlsType,
    camera: THREE.Camera,
    domElement: HTMLElement
  ): void {
    if (this.controlsMap.has(id)) {
      throw new Error(`ControlsManager: Control ID "${id}" already exists.`);
    }

    let control: SupportedControls;
    if (type === ControlTypes.ORBIT) {
      const orbit = new OrbitControls(camera, domElement);
      orbit.enableDamping = true;
      orbit.dampingFactor = 0.1;
      orbit.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground

      let snapping = false;
      let targetQuaternion = new THREE.Quaternion();
      //end fires when the user stops dragging the mouse.
      orbit.addEventListener(DOMEvents.END, () => {
        // Current rotation (before snap)
        const euler = new THREE.Euler().setFromQuaternion(
          camera.quaternion,
          "YXZ"
        ); //quaternion to euler(camera stored as quaternion)
        const beforeY = THREE.MathUtils.radToDeg(euler.y);
        const snappedY = Math.round(beforeY / 15) * 15; //snap to multiple of 15
        euler.y = THREE.MathUtils.degToRad(snappedY);

        targetQuaternion.setFromEuler(euler); //convert euler back to quaternion
        snapping = true;
      });

      const animate = () => {
        requestAnimationFrame(animate);

        // While an external camera animation owns the pose, do not snap or
        // update — that would fight/override the animation. Also drop any
        // pending snap so it can't fire mid-animation.
        if (this.isCameraAnimating) {
          snapping = false;
          return;
        }

        // Smoothly interpolate to snapped rotation
        if (snapping) {
          camera.quaternion.slerp(targetQuaternion, 0.1);
          if (camera.quaternion.angleTo(targetQuaternion) < 0.001) {
            camera.quaternion.copy(targetQuaternion);
            snapping = false;
          }
        }

        orbit.update();
      };
      animate();

      control = orbit;
    } else if (type === ControlTypes.TRACKBALL) {
      control = new TrackballControls(camera, domElement);
    } else if (type === ControlTypes.POINTER_LOCK) {
      control = new PointerLockControls(camera, domElement);
    } else if (type === ControlTypes.TRANSFORM) {
      const transform = new TransformControls(camera, domElement);
      this.transformControl = transform;
      //will enable snap rotations to multiples of 15 degrees.
      transform.setRotationSnap(THREE.MathUtils.degToRad(15));

      if (!this.controlsMap.has(ControlTypes.ORBIT)) {
        this.addControl(ControlTypes.ORBIT, ControlTypes.ORBIT, camera, domElement);
      }
      control = transform;
    } else {
      throw new Error(`ControlsManager: Unsupported control type "${type}".`);
    }

    this.controlsMap.set(id, control);
  }

  /**
   * Removes and disposes a registered control by ID.
   *
   * @param id - The ID of the control to remove.
   * @throws If the control ID is not found.
   * @returns void
   */
  RemoveControl(id: string): void {
    const control = this.controlsMap.get(id);
    if (!control)
      throw new Error(`ControlsManager: Control ID "${id}" not found.`);

    this.disableControl(id);
    (control as any).dispose?.();

    this.controlsMap.delete(id);

    if (this.activeControlId === id) {
      this.activeControlId = null;
    }
  }

  /**
   * Sets the active control by ID. Automatically disables others.
   * Allows OrbitControls to remain active when using TransformControls.
   * @param id - ID of the control to activate.
   * @param attachObject - Optional object to attach if using TransformControls.
   */
  public setActiveControl(id: string, attachObject?: THREE.Object3D): void {
    const control = this.controlsMap.get(id);
    if (!control) {
      return;
    }
    // Disable all other controls
    this.controlsMap.forEach((_, key) => {
      if (key !== id && !(id === ControlTypes.TRANSFORM && key === ControlTypes.ORBIT)) {
        this.disableControl(key);
      }
    });

    // Enable the target control
    control.enabled = true;
    this.activeControlId = id;

    // Handle TransformControls setup
    if (id === ControlTypes.TRANSFORM) {
      const orbit = this.controlsMap.get(ControlTypes.ORBIT);
      if (orbit) orbit.enabled = true;

      if (this.transformControl && attachObject) {
        this.attachTransformTarget(attachObject);
        this.transformControl.setMode(this.currentTransformMode);
        this.transformControl.addEventListener(DOMEvents.DRAGGING_CHANGED, (event) => {
          if (orbit) orbit.enabled = !event.value;
        });
      }
    }

    // Handle PointerLockControls click-to-lock
    if (control instanceof PointerLockControls) {
      const dom = (control as any).domElement;
      const lockHandler = () => control.lock();
      dom.addEventListener(DOMEvents.CLICK, lockHandler);
      this.pointerLockClickHandler = lockHandler;
    }
  }

  /**
   * Attaches a target object to the TransformControls for manipulation.
   * Automatically adds the transform gizmo helper to the scene if it's not already present.
   *
   * @param object - The Object3D to attach to the TransformControls.
   */
  public attachTransformTarget(object: THREE.Object3D): void {
    if (!this.transformControl) return;

    this.transformControl.attach(object);

    const gizmo = (this.transformControl as any).getHelper?.();
    if (gizmo && !this.scene.children.includes(gizmo)) {
      gizmo.name = RequiredStrings.TRANSFORM_CONTROLS_GIZMO_HELPER;
      this.scene.add(gizmo);
    }
  }

  /**
   * Disables and cleans up the specified control.
   * Also removes helpers or listeners.
   *
   * @param id - Control ID to disable.
   */
  private disableControl(id: string): void {
    const control = this.controlsMap.get(id);
    if (!control) return;
    control.enabled = false;
    if (control instanceof TransformControls) {
      control.detach();

      const gizmo = (control as any).getHelper?.();
      if (gizmo && this.scene.children.includes(gizmo)) {
        this.scene.remove(gizmo);
      }
    }

    // Cleanup PointerLock event listener
    if (control instanceof PointerLockControls) {
      if (control.isLocked) {
        control.unlock();
      }
      const domElement = (control as any).domElement;
      if (this.pointerLockClickHandler) {
        domElement.removeEventListener(DOMEvents.CLICK, this.pointerLockClickHandler);
        this.pointerLockClickHandler = null;
      }
    }
  }

  /**
   * Returns the currently active control instance.
   * @returns The active SupportedControls instance.
   * @throws If no active control is set.
   */
  public getActiveControl(): SupportedControls {
    if (!this.activeControlId) {
      throw new Error("ControlsManager: No active control is set.");
    }
    return this.controlsMap.get(this.activeControlId)!;
  }

  /**
   * Returns a registered control instance by ID.
   * @param id - The ID of the control to retrieve.
   * @returns The SupportedControls instance or undefined if not found.
   */
  public getControl(id: string): SupportedControls | undefined {
    return this.controlsMap.get(id);
  }

  /**
   * Updates the currently active control.
   * Should be called inside the render/animation loop.
   * @param delta - Optional delta time for update (e.g., Orbit damping).
   */
  public update(delta?: number): void {
    const control = this.controlsMap.get(this.activeControlId || "");
    (control as any)?.update?.(delta ?? 0.01);
  }

  /**
   * Enables or disables a control manually.
   * @param id - Control ID.
   * @param enabled - `true` to enable, `false` to disable.
   */
  public setControlEnabled(id: string, enabled: boolean): void {
    const control = this.controlsMap.get(id);
    if (!control) {
      throw new Error(`ControlsManager: Control ID "${id}" not found.`);
    }
    control.enabled = enabled;
  }

  /**
   * Checks whether a control is registered.
   * @param id - Control ID.
   * @returns `true` if the control exists, otherwise `false`.
   */
  public hasControl(id: string): boolean {
    return this.controlsMap.has(id);
  }

  /**
   * Returns an array of all registered control IDs.
   * @returns Array of control ID strings.
   */
  public getControlIds(): string[] {
    return Array.from(this.controlsMap.keys());
  }

  /**
   * Switches to transform mode with optional attachment and mode update.
   * @param mode - The transform mode: 'translate' | 'rotate' | 'scale'.
   * @param attachObject - Optional object to attach.
   */
  public toggleTransformMode(
    mode: TransformControlsMode.TRANSLATE | TransformControlsMode.ROTATE | TransformControlsMode.SCALE,
    attachObject?: THREE.Object3D
  ): void {
    if (!this.transformControl) return;
    this.currentTransformMode = mode;

    if (this.activeControlId !== ControlTypes.TRANSFORM) {
      this.setActiveControl(ControlTypes.TRANSFORM, attachObject);
    }

    this.transformControl.setMode(mode);
  }

  /**
   * Gets the current transform mode.
   * @returns The current transform mode.
   */
  public getCurrentTransformMode(): TransformControlsMode.TRANSLATE | TransformControlsMode.ROTATE | TransformControlsMode.SCALE {
    return this.currentTransformMode;
  }

  /**
   * Adjusts the size of the transform gizmo.
   * @param size - Size multiplier for TransformControls.
   */
  public adjustTransformControlSize(size: number): void {
    if (this.transformControl) {
      this.transformControl.size = size;
    }
  }

  /**
   * Shows or hides a specific transform axis.
   * @param axis - Axis to toggle visibility: 'x' | 'y' | 'z'.
   * @param visible - Boolean indicating visibility.
   */
  public setTransformAxisVisibility(
    axis: "x" | "y" | "z",
    visible: boolean
  ): void {
    if (!this.transformControl) return;

    if (axis === "x") {
      this.transformControl.showX = visible;
    } else if (axis === "y") {
      this.transformControl.showY = visible;
    } else if (axis === "z") {
      this.transformControl.showZ = visible;
    } else {
      console.warn(
        `Invalid axis "${axis}" passed to setTransformAxisVisibility.`
      );
    }
  }

  /**
   * Updates the camera reference for all registered controls.
   * This is necessary when switching between perspective and orthographic cameras.
   * @param camera - The new camera instance.
   */
  public updateCamera(camera: THREE.Camera): void {
    this.controlsMap.forEach((control) => {
      if (control instanceof TransformControls) {
        control.camera = camera;
      } else {
        control.object = camera;

        if (control instanceof OrbitControls) {
          control.update();
        }
      }
    });

    // Also update the tracked transformControl reference if it exists
    if (this.transformControl) {
      this.transformControl.camera = camera;
    }
  }
}
