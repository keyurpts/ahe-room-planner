import { Camera } from 'three';
/**
 * Manages multiple THREE.js cameras (Perspective and Orthographic) by string ID.
 * Supports adding/removing cameras, switching the active camera, and updating camera parameters.
 */
export declare class CameraManager {
    /**
     * Internal map of camera IDs to Camera objects.
     */
    private cameras;
    /**
     * ID of the currently active camera (if any).
     */
    private activeCameraId;
    /**
     * Initializes the CameraManager with an empty collection of cameras.
     */
    constructor();
    /**
     * Adds a new PerspectiveCamera with given parameters.
     * @param id - Unique string identifier for the camera.
     * @param fov - Vertical field of view in degrees.
     * @param aspect - Aspect ratio (width/height).
     * @param near - Near clipping plane distance.
     * @param far - Far clipping plane distance.
     * @throws {Error} if a camera with the same ID already exists.
     */
    addPerspectiveCamera(id: string, fov: number, aspect: number, near?: number, far?: number): void;
    /**
     * Adds a new OrthographicCamera with given parameters.
     * @param id - Unique string identifier for the camera.
     * @param left - Left vertical clipping plane.
     * @param right - Right vertical clipping plane.
     * @param top - Top horizontal clipping plane.
     * @param bottom - Bottom horizontal clipping plane.
     * @param near - Near clipping plane distance.
     * @param far - Far clipping plane distance.
     * @param zoom - Optional zoom level (default is 1).
     * @throws {Error} if a camera with the same ID already exists.
     */
    addOrthographicCamera(id: string, left: number, right: number, top: number, bottom: number, near?: number, far?: number, zoom?: number): void;
    /**
     * Removes a camera by ID.
     * @param id - Identifier of the camera to remove.
     * @throws {Error} if no camera with the given ID exists.
     */
    removeCamera(id: string): void;
    /**
     * Sets the camera with the given ID as the active camera.
     * @param id - Identifier of the camera to activate.
     * @throws {Error} if no camera with the given ID exists.
     */
    setActiveCamera(id: string): void;
    /**
     * Returns the currently active camera.
     * @returns The active Camera object.
     * @throws {Error} if no active camera has been set.
     */
    getActiveCamera(): Camera;
    /**
     * Retrieves a camera by its ID.
     * @param id - Identifier of the camera.
     * @returns The Camera object.
     * @throws {Error} if no camera with the given ID exists.
     */
    getCamera(id: string): Camera;
    /**
     * Updates parameters of an existing PerspectiveCamera.
     * Any provided fields (`fov`, `aspect`, `near`, `far`) will be applied.
     * After changes, `camera.updateProjectionMatrix()` is called automatically.
     * @param id - Identifier of the PerspectiveCamera to update.
     * @param params - Partial parameters to update.
     * @throws {Error} if no camera with the given ID exists or it is not a PerspectiveCamera.
     */
    updatePerspectiveCamera(id: string, params: {
        fov?: number;
        aspect?: number;
        near?: number;
        far?: number;
    }): void;
    /**
     * Updates parameters of an existing OrthographicCamera.
     * Any provided fields (`left`, `right`, `top`, `bottom`, `near`, `far`, `zoom`) will be applied.
     * After changes, `camera.updateProjectionMatrix()` is called automatically.
     * @param id - Identifier of the OrthographicCamera to update.
     * @param params - Partial parameters to update.
     * @throws {Error} if no camera with the given ID exists or it is not an OrthographicCamera.
     */
    updateOrthographicCamera(id: string, params: {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
        near?: number;
        far?: number;
        zoom?: number;
    }): void;
}
