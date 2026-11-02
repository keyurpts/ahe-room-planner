import { Camera, PerspectiveCamera, OrthographicCamera } from 'three';
import { ErrorMessages } from '../Constants';

/**
 * Manages multiple THREE.js cameras (Perspective and Orthographic) by string ID.
 * Supports adding/removing cameras, switching the active camera, and updating camera parameters.
 */
export class CameraManager {
  /**
   * Internal map of camera IDs to Camera objects.
   */
  private cameras: Map<string, Camera>;

  /**
   * ID of the currently active camera (if any).
   */
  private activeCameraId: string | null;

  /**
   * Initializes the CameraManager with an empty collection of cameras.
   */
  constructor() {
    this.cameras = new Map<string, Camera>();
    this.activeCameraId = null;
  }

  /**
   * Adds a new PerspectiveCamera with given parameters.
   * @param id - Unique string identifier for the camera.
   * @param fov - Vertical field of view in degrees.
   * @param aspect - Aspect ratio (width/height).
   * @param near - Near clipping plane distance.
   * @param far - Far clipping plane distance.
   * @throws {Error} if a camera with the same ID already exists.
   */
  public addPerspectiveCamera(
    id: string,
    fov: number,
    aspect: number,
    near: number = 0.1,
    far: number = 1000
  ): void {
    if (this.cameras.has(id)) {
      throw new Error(`${ErrorMessages.CAMERA_EXISTS} "${id}"`);
    }
    const camera = new PerspectiveCamera(fov, aspect, near, far);
    camera.updateProjectionMatrix();
    this.cameras.set(id, camera);
  }

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
  public addOrthographicCamera(
    id: string,
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number = 0.1,
    far: number = 1000,
    zoom: number = 1
  ): void {
    if (this.cameras.has(id)) {
      throw new Error(`${ErrorMessages.CAMERA_EXISTS} "${id}"`);
    }
    const camera = new OrthographicCamera(left, right, top, bottom, near, far);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    this.cameras.set(id, camera);
  }

  /**
   * Removes a camera by ID.
   * @param id - Identifier of the camera to remove.
   * @throws {Error} if no camera with the given ID exists.
   */
  public removeCamera(id: string): void {
    if (!this.cameras.has(id)) {
      throw new Error(`${ErrorMessages.CAMERA_NOT_FOUND} "${id}"`);
    }
    this.cameras.delete(id);
    if (this.activeCameraId === id) {
      this.activeCameraId = null;
    }
  }

  /**
   * Sets the camera with the given ID as the active camera.
   * @param id - Identifier of the camera to activate.
   * @throws {Error} if no camera with the given ID exists.
   */
  public setActiveCamera(id: string): void {
    if (!this.cameras.has(id)) {
      throw new Error(`${ErrorMessages.CAMERA_NOT_FOUND} "${id}"`);
    }
    this.activeCameraId = id;
  }

  /**
   * Returns the currently active camera.
   * @returns The active Camera object.
   * @throws {Error} if no active camera has been set.
   */
  public getActiveCamera(): Camera {
    if (!this.activeCameraId) {
      throw new Error(ErrorMessages.NO_ACTIVE_CAMERA);
    }
    const camera = this.cameras.get(this.activeCameraId)!;
    if (!camera) {
      throw new Error(`${ErrorMessages.CAMERA_NOT_FOUND} "${this.activeCameraId}"`);
    }
    return camera;
  }

  /**
   * Retrieves a camera by its ID.
   * @param id - Identifier of the camera.
   * @returns The Camera object.
   * @throws {Error} if no camera with the given ID exists.
   */
  public getCamera(id: string): Camera {
    const camera = this.cameras.get(id);
    if (!camera) {
      throw new Error(`${ErrorMessages.CAMERA_NOT_FOUND} "${id}"`);
    }
    return camera;
  }

  /**
   * Updates parameters of an existing PerspectiveCamera.
   * Any provided fields (`fov`, `aspect`, `near`, `far`) will be applied.
   * After changes, `camera.updateProjectionMatrix()` is called automatically.
   * @param id - Identifier of the PerspectiveCamera to update.
   * @param params - Partial parameters to update.
   * @throws {Error} if no camera with the given ID exists or it is not a PerspectiveCamera.
   */
  public updatePerspectiveCamera(
    id: string,
    params: { fov?: number; aspect?: number; near?: number; far?: number }
  ): void {
    const camera = this.cameras.get(id);
    if (!camera) {
      throw new Error(`${ErrorMessages.CAMERA_NOT_FOUND} "${id}"`);
    }
    if (!(camera instanceof PerspectiveCamera)) {
      throw new Error(`${ErrorMessages.INVALID_CAMERA_TYPE} "${id}"`);
    }

    if (params.fov !== undefined) {
      camera.fov = params.fov;
    }
    if (params.aspect !== undefined) {
      camera.aspect = params.aspect;
    }
    if (params.near !== undefined) {
      camera.near = params.near;
    }
    if (params.far !== undefined) {
      camera.far = params.far;
    }
    camera.updateProjectionMatrix();
  }

  /**
   * Updates parameters of an existing OrthographicCamera.
   * Any provided fields (`left`, `right`, `top`, `bottom`, `near`, `far`, `zoom`) will be applied.
   * After changes, `camera.updateProjectionMatrix()` is called automatically.
   * @param id - Identifier of the OrthographicCamera to update.
   * @param params - Partial parameters to update.
   * @throws {Error} if no camera with the given ID exists or it is not an OrthographicCamera.
   */
  public updateOrthographicCamera(
    id: string,
    params: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
      near?: number;
      far?: number;
      zoom?: number;
    }
  ): void {
    const camera = this.cameras.get(id);
    if (!camera) {
      throw new Error(`${ErrorMessages.CAMERA_NOT_FOUND} "${id}"`);
    }
    if (!(camera instanceof OrthographicCamera)) {
      throw new Error(`${ErrorMessages.INVALID_CAMERA_TYPE} "${id}"`);
    }

    if (params.left !== undefined) {
      camera.left = params.left;
    }
    if (params.right !== undefined) {
      camera.right = params.right;
    }
    if (params.top !== undefined) {
      camera.top = params.top;
    }
    if (params.bottom !== undefined) {
      camera.bottom = params.bottom;
    }
    if (params.near !== undefined) {
      camera.near = params.near;
    }
    if (params.far !== undefined) {
      camera.far = params.far;
    }
    if (params.zoom !== undefined) {
      camera.zoom = params.zoom;
    }
    camera.updateProjectionMatrix();
  }
}
