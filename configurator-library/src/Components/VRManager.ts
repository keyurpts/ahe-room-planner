import {
  Vector3,
  Scene,
  Camera,
  Clock,
  WebGLRenderer,
  Object3D,
  Box3,
} from "three";
import { ModelController } from "./ModelController";
import { XRStrings, DOMEvents, LogMessages, ErrorMessages } from "../Constants";

/**
 * Controller to manage entering, exiting, and navigation within immersive WebXR VR sessions.
 */
export class VRManager {
  /**
   * The WebGLRenderer instance to enable WebXR and render the scene.
   */
  private renderer: WebGLRenderer;

  /**
   * The active Three.js Scene.
   */
  private scene: Scene;

  /**
   * The active Camera viewing the scene.
   */
  private camera: Camera;

  /**
   * The camera rig/player object used to move the camera in VR.
   */
  private player: Object3D = new Object3D();

  /**
   * The view cube UI helper object to show/hide in VR mode.
   */
  private viewCubeGizmo: any;

  /**
   * Clock to compute frame delta time for smooth locomotion.
   */
  private clock = new Clock();

  /**
   * Callback executed when exiting the VR session.
   */
  private onExitVR: () => void;

  /**
   * Flag indicating if a VR session is currently active.
   */
  public isInVR: boolean = false;

  /**
   * Callback to restore visibility of all walls when in VR.
   */
  private restoreWalls: () => void;

  /**
   * Initializes the VRManager with renderer, scene, camera, UI gizmo, and callback hooks.
   * @param renderer - The WebGLRenderer instance.
   * @param scene - The active Scene.
   * @param camera - The active Camera.
   * @param viewCubeGizmo - The view cube UI gizmo helper.
   * @param onExitVRCallback - Callback for session end event.
   * @param restoreWallsCallback - Callback to restore wall visibility in VR.
   */
  constructor(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: Camera,
    viewCubeGizmo: any,
    onExitVRCallback: () => void,
    restoreWallsCallback: () => void
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.viewCubeGizmo = viewCubeGizmo;
    this.onExitVR = onExitVRCallback;
    this.restoreWalls = restoreWallsCallback;

    this.setupSessionEvents();
  }

  /**
   * Starts an immersive WebXR VR session and attaches it to the renderer.
   * @returns A promise that resolves when the VR session starts.
   */
  public async enterVR(): Promise<void> {
    this.renderer.xr.enabled = true;

    if (this.renderer.xr.getSession()) return;
    if (navigator.xr) {
      try {
        const session = await navigator.xr.requestSession(XRStrings.IMMERSIVE_VR, {
          optionalFeatures: [XRStrings.LOCAL_FLOOR, XRStrings.BOUNDED_FLOOR, XRStrings.HAND_TRACKING],
        });

        await this.renderer.xr.setSession(session);
      } catch (err) {
        console.warn(ErrorMessages.FAILED_VR_SESSION, err);
      }
    }
  }

  /**
   * Ends the active VR session.
   * @returns A promise that resolves when the session ends.
   */
  public async exitVR(): Promise<void> {
    const session = this.renderer.xr.getSession();
    if (session) await session.end();
    this.onExitVR();
  }

  /**
   * Registers WebXR session start/end handlers to manage VR state,
   * visibility, camera rig setup and the VR-specific animation loop.
   */
  private setupSessionEvents() {
    this.renderer.xr.addEventListener(DOMEvents.SESSION_START, () => {

      if (this.viewCubeGizmo) this.viewCubeGizmo.visible = false;
      this.isInVR = true;
      // Make all walls visible in VR
      this.restoreWalls();

      this.setupCameraRig();
      this.clock.start();

      // Start VR animation loop
      this.renderer.setAnimationLoop(() => {
        const session = this.renderer.xr.getSession();
        const dt = this.clock.getDelta();
        if (session) {
          this.updateVRGamepads(session);
          this.handleJoystickMovement(dt, session);
        }

        this.renderer.render(this.scene, this.camera);
      });
    });

    this.renderer.xr.addEventListener(DOMEvents.SESSION_END, () => {
      this.isInVR = false;

      // Remove camera from rig
      this.player.remove(this.camera);
      this.scene.add(this.camera);

      // Show the view cube
      if (this.viewCubeGizmo) this.viewCubeGizmo.visible = true;
    });
  }

  /**
   * Creates and positions a movable VR camera rig centered inside the room model.
   */
  private setupCameraRig(): void {
    const roomModel = ModelController.GetRoomModel(this.scene);
    if (!roomModel) return;

    // Compute bounding box
    const box = new Box3().setFromObject(roomModel);
    const center = new Vector3();
    box.getCenter(center);

    // Create rig if it doesn't exist
    if (!this.player) {
      this.player = new Object3D();
    }

    // Attach camera to rig
    this.player.add(this.camera);
    this.scene.add(this.player);

    // Floor height
    const floorY = box.min.y;

    // Place the rig at center
    this.player.position.set(center.x, floorY, center.z);
  }

  /**
   * Processes VR controller button input and triggers actions such as
   * exiting VR.
   *
   * @param {XRSession} session - The active XR session providing controller data.
   */
  private updateVRGamepads(session: XRSession): void {
    for (const source of session.inputSources) {
      const gamepad = source.gamepad;
      if (!gamepad) continue;

      const buttons = gamepad.buttons;

      // Left controller buttons
      if (source.handedness === XRStrings.HAND_LEFT) {
        // X → button[4], Y → button[5]
        if (buttons[4]?.pressed) {
          console.log(LogMessages.X_BUTTON_EXIT_VR);
          this.exitVR();
        }
        if (buttons[5]?.pressed) {
          console.log(LogMessages.Y_BUTTON_TOGGLE);
        }
      }

      // Right controller buttons
      if (source.handedness === XRStrings.HAND_RIGHT) {
        if (buttons[4]?.pressed) {
          console.log(LogMessages.A_BUTTON_TOGGLE_VISIBILITY);
        }
        if (buttons[5]?.pressed) {
          console.log(LogMessages.B_BUTTON_SWITCH_VIEW);
        }
      }
    }
  }

  /**
   * Applies smooth locomotion to the VR camera rig using joystick input.
   * Supports forward, backward, and strafe movement based on controller axes.
   *
   * @param {number} dt - The frame delta time used to ensure smooth movement.
   * @param {XRSession} session - The active XR session containing input sources.
   */
  private handleJoystickMovement(dt: number, session: XRSession): void {
    if (!this.player) return;

    const speed = 2;

    const roomModel = ModelController.GetRoomModel(this.scene);
    if (!roomModel) return;

    // Compute bounding box
    const box = new Box3().setFromObject(roomModel);
    const center = new Vector3();
    box.getCenter(center);

    for (const source of session.inputSources) {
      if (!source.gamepad) continue;

      const axes = source.gamepad.axes;
      if (!axes || axes.length < 2) continue;

      const x = axes.length >= 4 ? axes[2] : axes[0];
      const y = axes.length >= 4 ? axes[3] : axes[1];

      const deadzone = 0.1;
      if (Math.abs(x) < deadzone && Math.abs(y) < deadzone) continue;

      const dir = new Vector3();
      this.camera.getWorldDirection(dir);
      dir.normalize();

      dir.y = box.min.y;
      dir.normalize();

      const right = new Vector3();
      right.crossVectors(dir, new Vector3(0, 1, 0)).normalize();

      const forward = y * -1;

      this.player.position.addScaledVector(dir, forward * speed * dt);
      this.player.position.addScaledVector(right, x * speed * dt);
    }
  }
}
