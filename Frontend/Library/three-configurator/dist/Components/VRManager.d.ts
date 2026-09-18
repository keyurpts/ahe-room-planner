import { Scene, Camera, WebGLRenderer } from "three";
/**
 * Controller to manage entering, exiting, and navigation within immersive WebXR VR sessions.
 */
export declare class VRManager {
    /**
     * The WebGLRenderer instance to enable WebXR and render the scene.
     */
    private renderer;
    /**
     * The active Three.js Scene.
     */
    private scene;
    /**
     * The active Camera viewing the scene.
     */
    private camera;
    /**
     * The camera rig/player object used to move the camera in VR.
     */
    private player;
    /**
     * The view cube UI helper object to show/hide in VR mode.
     */
    private viewCubeGizmo;
    /**
     * Clock to compute frame delta time for smooth locomotion.
     */
    private clock;
    /**
     * Callback executed when exiting the VR session.
     */
    private onExitVR;
    /**
     * Flag indicating if a VR session is currently active.
     */
    isInVR: boolean;
    /**
     * Callback to restore visibility of all walls when in VR.
     */
    private restoreWalls;
    /**
     * Initializes the VRManager with renderer, scene, camera, UI gizmo, and callback hooks.
     * @param renderer - The WebGLRenderer instance.
     * @param scene - The active Scene.
     * @param camera - The active Camera.
     * @param viewCubeGizmo - The view cube UI gizmo helper.
     * @param onExitVRCallback - Callback for session end event.
     * @param restoreWallsCallback - Callback to restore wall visibility in VR.
     */
    constructor(renderer: WebGLRenderer, scene: Scene, camera: Camera, viewCubeGizmo: any, onExitVRCallback: () => void, restoreWallsCallback: () => void);
    /**
     * Starts an immersive WebXR VR session and attaches it to the renderer.
     * @returns A promise that resolves when the VR session starts.
     */
    enterVR(): Promise<void>;
    /**
     * Ends the active VR session.
     * @returns A promise that resolves when the session ends.
     */
    exitVR(): Promise<void>;
    /**
     * Registers WebXR session start/end handlers to manage VR state,
     * visibility, camera rig setup and the VR-specific animation loop.
     */
    private setupSessionEvents;
    /**
     * Creates and positions a movable VR camera rig centered inside the room model.
     */
    private setupCameraRig;
    /**
     * Processes VR controller button input and triggers actions such as
     * exiting VR.
     *
     * @param {XRSession} session - The active XR session providing controller data.
     */
    private updateVRGamepads;
    /**
     * Applies smooth locomotion to the VR camera rig using joystick input.
     * Supports forward, backward, and strafe movement based on controller axes.
     *
     * @param {number} dt - The frame delta time used to ensure smooth movement.
     * @param {XRSession} session - The active XR session containing input sources.
     */
    private handleJoystickMovement;
}
