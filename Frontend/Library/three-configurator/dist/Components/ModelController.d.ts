import * as THREE from "three";
import { AssetLoader } from "./AssetLoader";
import { CollisionSystem } from "./CollisionSystem";
/**
 * ModelController is responsible for controlling the visibility and behavior
 * of a 3D model (THREE.Object3D) in a scene, including autorotation, preset camera views,
 * and replacing models dynamically.
 */
export declare class ModelController {
    /**
     * Map of model instances to their auto-rotation speeds.
     */
    private autoRotateModels;
    /**
     * RequestAnimationFrame ID for the auto-rotation loop.
     */
    private animationId?;
    /**
     * The active camera used for viewing the scene.
     */
    private camera;
    /**
     * OrbitControls associated with the active camera.
     */
    private controls;
    /**
     * THREE.Scene instance containing the models.
     */
    private scene;
    /**
     * HTML element housing the 3D renderer.
     */
    private container;
    /**
     * Loader helper for loading GLB/OBJ models.
     */
    private assetLoader;
    /**
     * Collision detection helper for checking object intersections.
     */
    private collisionSystem;
    /**
     * Camera view transition duration in milliseconds.
     */
    private transitionDuration;
    /**
     * Array containing all placed THREE.Object3D models in the scene.
     */
    placedModels: THREE.Object3D[];
    /**
     * Center point around which auto-rotation occurs.
     */
    private autoRotateCenter;
    /**
     * Speed of the auto-rotation in radians per frame.
     */
    private autoRotateSpeed;
    /**
     * Radius of the camera's auto-rotation orbit.
     */
    private autoRotateRadius;
    /**
     * Current angle of the auto-rotation.
     */
    private autoRotateAngle;
    /**
     * Target Object3D being auto-rotated.
     */
    private autoRotateTarget;
    /**
     * Box helper showing the selection bounds of the active model.
     */
    currentBoxHelper: THREE.LineSegments | null;
    /**
     * @param scene - THREE.Scene instance containing the model
     * @param camera - THREE.Camera (Perspective or Orthographic) used to view the scene
     * @param controls - OrbitControls linked to the camera & renderer
     * @param container - HTML container element used for size/aspect calculations
     * @param collisionSystem - CollisionSystem instance for spatial intersection tests
     */
    constructor(scene: THREE.Scene, camera: THREE.Camera, controls: any, container: HTMLElement, collisionSystem: CollisionSystem, assetLoader?: AssetLoader);
    /**
     * Show the given model
     */
    showModel(): void;
    /**
     * Hide the given model
     */
    hideModel(): void;
    /**
     * Updates the active camera and controls references.
     *
     * @param camera - The new THREE.Camera instance.
     * @param controls - The new OrbitControls instance.
     */
    updateCamera(camera: THREE.Camera, controls: any): void;
    /**
     * Enables auto-rotation for a specific model at a given speed.
     *
     * @param model - The model object to auto-rotate.
     * @param speed - The rotation speed in radians per frame (default is 0.01).
     */
    enableAutoRotate(model: THREE.Object3D, speed?: number): void;
    /**
     * Disables auto-rotation for all models.
     */
    disableAutoRotate(): void;
    /**
     * Starts the internal auto-rotation animation loop.
     */
    private startAnimationLoop;
    /**
     * Fits an OrthographicCamera to the bounding box of a model.
     *
     * @param camera - The THREE.OrthographicCamera to fit.
     * @param model - The model object to fit the camera to.
     * @param padding - Multiplier for padding around the model (default is 1.5).
     */
    private fitOrthographicToModel;
    /**
     * Repositions camera for a preset view of the model.
     * @param model - The Object3D to frame
     * @param offset - Distance from model center (default: bounding sphere radius * 2)
     * @param dir - Direction vector indicating view direction
     */
    private setCameraView;
    /**
     * Snaps the camera to the front view of the model.
     *
     * @param model - The model object to focus on.
     * @param offset - Optional distance multiplier offset.
     */
    viewFront(model: THREE.Object3D, offset?: number): void;
    /**
     * Snaps the camera to the back view of the model.
     *
     * @param model - The model object to focus on.
     * @param offset - Optional distance multiplier offset.
     */
    viewBack(model: THREE.Object3D, offset?: number): void;
    /**
     * Snaps the camera to the left view of the model.
     *
     * @param model - The model object to focus on.
     * @param offset - Optional distance multiplier offset.
     */
    viewLeft(model: THREE.Object3D, offset?: number): void;
    /**
     * Snaps the camera to the right view of the model.
     *
     * @param model - The model object to focus on.
     * @param offset - Optional distance multiplier offset.
     */
    viewRight(model: THREE.Object3D, offset?: number): void;
    /**
     * Snaps the camera to the top view of the model.
     *
     * @param model - The model object to focus on.
     * @param offset - Optional distance multiplier offset.
     */
    viewTop(model: THREE.Object3D, offset?: number): void;
    /**
     * Snaps the camera to the bottom view of the model.
     *
     * @param model - The model object to focus on.
     * @param offset - Optional distance multiplier offset.
     */
    viewBottom(model: THREE.Object3D, offset?: number): void;
    /**
     * Replace an existing model in the scene with a new one.
     * Transfers autorotation settings if present.
     * @param oldModel - The current THREE.Object3D in the scene
     * @param newModel - The new THREE.Object3D to add
     */
    replaceModel(oldModel: THREE.Object3D, newModel: THREE.Object3D): void;
    /**
     * Replaces a model in the scene using a custom `pid` identifier stored in `userData`.
     *
     * Searches the scene for a node with a matching `pid`, then replaces it with the root child
     * of a newly loaded model. The `pid` is preserved on the new model.
     *
     * @param {string} id - The custom `pid` of the object to replace.
     * @param {string} url - The URL to load the replacement model from (GLB format).
     * @returns {Promise<void>}
     */
    replaceSwappableOption(id: string, url: string, partIdentifierProperty: string): Promise<void>;
    /**
     * Retrieves a configurable part (THREE.Object3D) from the scene by its ID and identifier property.
     *
     * @param id - The ID value to match.
     * @param partIdentifierProperty - The property to check on the object (e.g. 'name' or custom user data key).
     * @returns The matching THREE.Object3D object, or null if not found.
     */
    getConfigurablePartById(id: string, partIdentifierProperty: string): THREE.Object3D | null;
    /**
     * Replaces the texture of a model's mesh using a provided image URL.
     *
     * Searches for a node with a matching `pid`, then loads and applies the texture
     * to all mesh materials (Basic, Standard, or Phong) under that node.
     *
     * @param {string} id - The custom `pid` of the object to apply the texture to.
     * @param {string} texUrl - The URL of the texture image to apply.
     * @returns {Promise<void>}
     */
    replaceTexture(id: string, texUrl: string, partIdentifierProperty: string): Promise<void>;
    /**
     * Loads a texture from a URL and applies it to the material(s) of all meshes in the object hierarchy.
     *
     * @param object - The THREE.Object3D instance (and its children) to apply the texture to.
     * @param texUrl - The URL of the texture image.
     */
    applyTexture(object: THREE.Object3D, texUrl: string): void;
    /**
     * Updates the material properties of a model's mesh using MeshPhysicalMaterial.
     *
     * Searches for a node with a matching `pid`, then applies the given material properties
     * (color, metalness, roughness, side) to all mesh nodes under that node using MeshPhysicalMaterial.
     *
     * @param {string} id - The custom `pid` of the object to apply the material changes to.
     * @param {{
     *   color?: string | number,
     *   metalness?: number,
     *   roughness?: number,
     *   side?: THREE.Side
     * }} props - The material properties to apply.
     * @returns {Promise<void>}
     */
    updateMaterialProperties(id: string, props: {
        color?: string | number;
        metalness?: number;
        roughness?: number;
        side?: THREE.Side;
        texture?: string;
    }, partIdentifierProperty: string): Promise<void>;
    /**
     * Updates material properties (color, metalness, roughness, side, and texture) of all meshes in the model hierarchy.
     *
     * @param model - The THREE.Object3D instance to update.
     * @param props - Object containing new material property values.
     */
    updateMaterial(model: THREE.Object3D, props: {
        color?: string | number;
        metalness?: number;
        roughness?: number;
        side?: THREE.Side;
        texture?: string;
    }): void;
    /**
     * Adjusts the camera to fit the given object into view, preserving the current rotation.
     * @param object - The target THREE.Object3D to fit in view.
     * @param padding - Optional padding factor (e.g., 1.1 for 10% padding).
     */
    fitToView(padding?: number): void;
    /**
     * Sets the camera and OrbitControls to an isometric home view
     * @param camera The Three.js camera
     * @param controls The OrbitControls instance
     * @param model The root Object3D of your loaded GLB model
     */
    setHomeView(model: THREE.Object3D): void;
    /**
     * Delegates BVH generation to the CollisionSystem for the given object hierarchy.
     *
     * @param object - The THREE.Object3D to generate BVH for.
     */
    ensureBVH(object: THREE.Object3D): void;
    /**
     * Delegates preview collision checking to the CollisionSystem.
     *
     * @param preview - The preview THREE.Object3D being positioned.
     * @returns `true` if a collision is detected, `false` otherwise.
     */
    checkPreviewCollision(preview: THREE.Object3D): boolean;
    /**
     * Delegates transformed model collision checking to the CollisionSystem.
     *
     * @param mobileModel - The THREE.Object3D currently being moved/rotated.
     * @param lastValidPosition - Vector3 reference to restore position on collision.
     * @param lastValidRotation - Quaternion reference to restore rotation on collision.
     * @returns `true` if a collision occurred and the transformation was reverted, `false` otherwise.
     */
    checkModelCollision(mobileModel: THREE.Object3D, lastValidPosition: THREE.Vector3, lastValidRotation: THREE.Quaternion): boolean;
    /**
     * Computes a precise bounding box for the given object in its own local coordinate space.
     * Unlike the standard Box3.setFromObject, this method transforms all child mesh
     * vertices into the parent's local space to provide a tight-fitting Axis-Aligned Bounding Box (AABB)
     * relative to the object's origin.
     *
     * @param object - The THREE.Object3D to compute the local bounds for.
     * @returns A THREE.Box3 representing the precise local bounds.
     */
    computePreciseLocalBox(object: THREE.Object3D): THREE.Box3;
    /**
     * Adds an Object-Oriented Bounding Box (OOBB) helper to the specified model.
     * Internal logic calculates the precise local bounds and creates a wireframe
     * box parented to the model for automatic transform synchronization.
     *
     * @param model - The THREE.Object3D to attach the bounding box helper to.
     */
    addBoundingBoxHelper(model: THREE.Object3D): void;
    /**
     * Removes and disposes the current bounding box helper from the scene/model.
     */
    removeBoundingBoxHelper(): void;
    /**
     * Updates the bounding box helper to keep it in sync (since it is parented, this is primarily a structural check).
     */
    updateHelper(): void;
    /**
     * Sets the camera view of the room model to a predefined viewpoint (top, bottom, front, back, left, right, home).
     *
     * @param camView - The string name of the target camera viewpoint.
     */
    setModelView(camView: string): void;
    /**
     * Retrieves the room model object from the scene by its name.
     * @param scene - The THREE.Scene containing the room model.
     * @returns The room model THREE.Object3D if found, or null otherwise.
     */
    static GetRoomModel(scene: THREE.Scene): THREE.Object3D | null;
}
