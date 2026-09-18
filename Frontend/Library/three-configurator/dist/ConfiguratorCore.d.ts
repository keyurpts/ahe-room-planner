import { Object3D, Vector3, Euler, type Side, type ColorRepresentation, Group } from "three";
import type { ConfiguratorOptions, ConfigState, ModelLoadCallbacks, HierarchyNode } from "./types/types";
import { AssetLoader } from "./Components/AssetLoader";
import { type ExpandedConfigOption } from "./ProjectFileReader";
import { TransformControlsMode, ControlTypes, CameraTypes } from "./Constants";
/**
 * Core class for the 3D configurator
 * Handles scene setup, model management, and state export
 */
export declare class ConfiguratorCore {
    /**
     * Three.js Scene object
     */
    private readonly scene;
    /**
     * Three.js Camera object
     */
    private camera;
    /**
     * Group that holds multi-selected furniture models
     */
    private furnitureGroup;
    /**
     * Renderer manager object
     */
    private readonly rendererManager;
    /**
     * DOM container element
     */
    private readonly container;
    /**
     * Map of loaded models by ID
     */
    private readonly models;
    /**
     * Configurator options
     */
    private readonly options;
    /**
     * Asset loader to load glb/gltf
     */
    private assetLoader;
    /**
     * LightsManager to add lighting to the scene
     */
    private lightsManager;
    /**
     * Camera manager to add perspective, orthographic camera
     */
    private cameraManager;
    /**
     * Controls manager to add orbit, trackball controls
     */
    private controlsManager;
    /**
     * Project file reader to read the input json file and store as object
     */
    private projectFileReader;
    /**
     * Handles all VR session and rendering logic
     */
    private vrManager;
    /**
     * JSON object after reading the input json file
     */
    private projectJSON;
    /**
     * Updated json object as required in the frontend
     */
    private updatedProjectJSON;
    /**
     * Model controller for operations on the main model
     */
    private modelController;
    /**
     * Collision system for spatial intersection tests
     */
    private collisionSystem;
    /**
     * Model which is getting configured
     */
    private mainModel;
    /**
     * Observes resize changes on the canvas/container.
     */
    private resizeObserver;
    /**
     * Manages advanced visual effects and post-processing pipeline.
     */
    private postProcessingManager;
    /**
     * Displays tooltips on hover over UI or 3D objects.
     */
    private tooltipHelper;
    /**
     * 3D view cube for camera orientation control.
     */
    private viewCubeGizmo;
    /**
     * Optional grid helper for scene floor reference.
     */
    private gridHelper;
    /**
     * Clock used for animations and updates.
     */
    private clock;
    /**
     * Root object of the loaded 3D model.
     */
    private modelRoot;
    /**
     * Currently active camera control.
     */
    private controls;
    /**
     * Stores the last known camera position and control target.
     */
    private savedCameraState;
    /**
     * Callback functions used to check visibility of the view cube.
     */
    private checkCubeVisibilityFns;
    /**
     * Handler triggered when an object changes.
     */
    private onObjectChangeHandler?;
    /**
     * Handler triggered when dragging state changes in TransformControls.
     */
    private onDraggingChangedHandler?;
    /**
     * Raycaster used for object selection in the scene.
     */
    private raycasterForSelection;
    /**
     * Normalized mouse coordinates used with the selection raycaster.
     */
    private mouseForSelection;
    /**
     * Flag to control whether the wall-hiding (raycast to cube) feature is active.
     */
    private isWallHidingEnabled;
    /**
     * Timer ID for debouncing resize events.
     */
    private resizeTimeout?;
    /**
     * Stores the last valid position of the currently selected model for collision handling.
     */
    private currentSelectedLastValidPosition;
    /**
     * Stores the last valid rotation of the currently selected model for collision handling.
     */
    private currentSelectedLastValidRotation;
    /**
     * Stores the previous quaternion rotation of the selected model.
     */
    private previousQuaternion;
    /**
     * Enables selecting and moving objects.
     */
    private selectionEnabled;
    /**
     * Flag to check if measurement mode is currently active.
     */
    private isMeasurementActive;
    /**
     * Flag to check if all measurements mode is currently active.
     */
    private isShowAllMeasurementsActive;
    /**
     * Public state object for distance measurement to be accessed and updated by the frontend.
     */
    measurementState: {
        isActive: boolean;
        isWallsOnly: boolean;
    };
    /**
     * Spot light attached to the camera.
     */
    private cameraLight;
    /**
     * Holds reference to the input element used for editing distance labels.
     */
    private activeInput;
    /**
     * Group to hold all measurement elements (lines, arrows, labels).
     */
    private measurementGroup;
    /**
     * Stores the default animation loop callback used in normal (non-VR) mode.
     */
    private defaultLoop;
    /**
     * Flag to check if user is placing the model (true when placing, else false).
     */
    private isPreviewActive;
    /**
     * Tracks whether the preview model is currently positioned on a floor mesh.
     */
    private isPreviewOnFloor;
    /**
     * Cloned wireframe version of the model for preview.
     */
    private previewModel;
    /**
     * The base object used for raycasting during preview.
     */
    private basePreviewModel;
    /**
     * Stores selection state before preview started.
     */
    private prevSelectionState;
    /**
     * Stores previous model selection before preview started.
     */
    private prevModelRoot;
    /**
     * Collider used to check preview placement collisions.
     */
    private previewCollider;
    /**
     * Tracks initial mouse X position for selection drag detection.
     */
    private dragStartX;
    /**
     * Tracks initial mouse Y position for selection drag detection.
     */
    private dragStartY;
    /**
     * Indicates whether the mouse movement has exceeded drag threshold.
     */
    private isDraggingForSelection;
    /**
     * Box3Helper used to highlight an object while hovering.
     */
    private hoverBoxHelper;
    /**
     * Currently hovered mobile collider (used to detect hover changes).
     */
    private hoveredCollider;
    /**
     * Half-height of the orthographic camera frustum.
     */
    private orthoFrustumHeight;
    /**
     * Boundary cubes used for raycasting to check wall visibility.
     */
    private wall_hiding_cubes;
    /**
     * The color currently selected for wall coloring.
     */
    private selectedWallColor;
    /**
     * Flag to indicate if wall coloring mode is active.
     */
    private isWallColoringMode;
    /**
     * The texture currently selected for wall texturing.
     */
    private selectedWallTexture;
    /**
     * Flag to indicate if wall texturing mode is active.
     */
    private isWallTexturingMode;
    /**
     * Flag to indicate if wall material reset mode is active.
     */
    private isWallMaterialResetMode;
    /**
     * Flag to enable post processing.
     */
    private isPostProcessingActive;
    /**
     * Stores the removed model for backup in case of collision.
     */
    private modelPendingReplacement;
    /**
     * Flag to indicate if model is being replaced.
     */
    private isReplacingModel;
    /**
     * Flag to indicate if a cloned model is being placed.
     */
    private isCloningModel;
    /**
     * Animation tween group for camera transitions.
     */
    private tweenGroup;
    /**
     * Indicates whether the preview model is being dragged by the user (panning or orbiting).
     */
    private isPreviewDragging;
    /**
     * Creates a new ConfiguratorCore instance
     *
     * @param options - Configuration options
     */
    constructor(options: ConfiguratorOptions);
    /**
     * Sets up default lighting for the scene
     *
     * @private
     * @returns {void}
     */
    private setupLighting;
    /**
     * Sets up a spot light that follows the camera
     * Changed from DirectionalLight to SpotLight for better lighting control
     *
     * @private
     * @returns {void}
     */
    private setupCameraLight;
    /**
     * Animation loop.
     *
     * @private
     * @param {number} time - The current timestamp.
     * @returns {void}
     */
    private animate;
    /**
     * Adds a model to the scene
     *
     * @private
     * @param {Object3D} model - The 3D model to add
     * @param {Vector3} [position] - Optional position for the model
     * @param {Euler} [rotation] - Optional rotation for the model
     * @param {Vector3} [scale] - Optional scale for the model
     * @returns {Object3D} - The added model object
     */
    private addModel;
    /**
     * Calculates the target coordinates for a model relative to a base model and places it.
     *
     * @private
     * @param {Object3D} model - The model to place.
     * @param {Object3D | null} baseModel - The reference base model.
     * @returns {void}
     */
    private placeModel;
    /**
     * Retrieves the URI for a specific part variant of a target mesh.
     * Looks up the part variant by ID within the updated project JSON structure.
     *
     * @private
     * @param {string} targetPartId - The ID of the target part.
     * @param {string} partVariantId - The ID of the part variant.
     * @returns {string | undefined} - The URI of the part variant, or `undefined` if not found.
     */
    private getPartVariantUri;
    /**
     * Retrieves the URI (image) for a specific texture of a target mesh.
     * Looks up the texture by ID within the updated project JSON structure.
     *
     * @private
     * @param {string} targetPartId - The ID of the target part.
     * @param {string} textureId - The ID of the texture.
     * @returns {string | undefined} - The URI of the texture image, or `undefined` if not found.
     */
    private getTextureUri;
    /**
     * Retrieves the material properties object from the project JSON
     * using the mesh ID and material ID.
     *
     * @private
     * @param {string} targetPartId - The part ID to look up.
     * @param {string} materialId - The material option ID to fetch.
     * @returns {
        color?: string | number;
        metalness?: number;
        roughness?: number;
        side?: Side;
        texture?: string;
        }| undefined}
     */
    private getMaterialProperties;
    /**
     * Returns the container element from the given options.
     * If `options.container` is a string, it queries the DOM for the element.
     * If it's already an HTMLElement, it returns it directly.
     *
     * @private
     * @param {ConfiguratorOptions} options - Options containing the container.
     * @returns {HTMLElement} - The container element.
     */
    private getContainer;
    /**
     * Smoothly transitions the camera to a new orientation and position
     * based on a target quaternion and model center.
     *
     * @private
     * @param {Camera} camera - The active camera to animate.
     * @param {any} controls - Camera controls to update target.
     * @param {Quaternion} targetQuaternion - Target camera orientation.
     * @param {Vector3} modelCenter - Center point of the model to focus on.
     * @param {number} [duration] - Animation duration in milliseconds.
     * @returns {void}
     */
    private transitionCameraToQuaternionView;
    /**
     * Returns the center of the bounding box of a given Object3D.
     *
     * @private
     * @param {Object3D} object - The THREE.Object3D whose bounding box center is to be computed.
     * @returns {Vector3} - A THREE.Vector3 representing the center of the bounding box.
     */
    private getBoundingBoxCenter;
    /**
     * Loads the initial model defined in the project configuration.
     *
     * @private
     * @param {ModelLoadCallbacks} [callbacks] - Optional callbacks for model load events.
     * @returns {Promise<Promise<void>>} - - Resolves once the model is loaded.
     */
    private loadInitialModel;
    /**
     * Saves current camera position and control target for later restoration.
     * This method is called before switching controls to preserve the user's current view.
     * For controls that don't expose a `.target` (e.g., PointerLockControls),
     * the model's bounding box center is used as a fallback target.
     *
     * @private
     * @returns {void}
     */
    private saveCameraState;
    /**
     * Restores previously saved camera position and control target.
     * After switching controls, this ensures the camera returns to the last known view,
     * maintaining visual consistency. Only applicable for controls that support a `.target`.
     *
     * @private
     * @returns {void}
     */
    private restoreCameraState;
    /**
     * Initializes a ResizeObserver to handle container resizing.
     *
     * @private
     * @returns {void}
     */
    private initResizeObserver;
    /**
     * Creates a checker function that will test if any of the 8 rays from the camera
     * to the cube corners hits the cube first. If so, it hides the cube's parent.
     *
     * @private
     * @param {Mesh} cube - The target cube mesh (must be in the scene).
     * @param {Object3D} model - The root model object.
     * @returns {any} - A function to call each frame with the camera.
     */
    private createWallVisibilityChecker;
    /**
     * Restores all room walls to full visibility.
     * Handles both GLB room model walls (Box/BoxFront/etc.) and 2D-to-3D
     * generated walls (boundary_cube) registered in wall_hiding_cubes.
     *
     * @private
     * @returns {void}
     */
    private restoreAllWalls;
    /**
     * Handles model selection via mouse click.
     *
     * @private
     * @param {any} event - The mouse click event used for raycasting.
     * @returns {void}
     */
    private selectModelOnClick;
    /**
     * Traverses upwards through the hierarchy to find the nearest parent
     * marked as selectable.
     *
     * @private
     * @param {Object3D} object - The object from which to begin the search.
     * @returns {Object3D | null} - The first selectable parent object, or `null` if none is found.
     */
    private findSelectableParent;
    /**
     * Checks if an object or any of its ancestors is part of a permanent Group.
     *
     * @param object The object to check.
     * @returns true if the object or its parent/ancestor is a group.
     */
    private isObjectInGroup;
    /**
     * Attaches TransformControls to the current model if active
     *
     * @private
     * @returns {void}
     */
    private checkTransform;
    /**
     *  Handles double-click events to detect and activate editing for a measurement sprite.
     * @param event - Mouse double-click event.
     */
    /**
     * Aligns an HTML input element over the given 3D sprite.
     * @param input - Input element to position.
     * @param sprite - Target sprite to align over.
     */
    /**
     * Enables inline editing of a measurement sprite’s value.
     * @param sprite - Sprite to edit.
     */
    /**
     * Updates the given sprite value with new value.
     * @param sprite - Target sprite to update.
     * @param newText - Text to display on the sprite.
     */
    /**
     * Creates and returns a new text sprite.
     *
     * @private
     * @param {string} text - Text to display on the sprite.
     * @returns {Sprite} - A Sprite displaying the given text.
     */
    private createTextSprite;
    /**
     * Draws a measurement line with arrows and a label between two points.
     *
     * @private
     * @param {Vector3} startPoint - Starting point of the measurement.
     * @param {Vector3} endPoint - Ending point of the measurement.
     * @param {Vector3} direction - Direction vector of the measurement.
     * @param {number} distance - Calculated distance between start and end.
     * @returns {void}
     */
    private drawMeasurementLine;
    /**
     * Draws directional distance measurements for the given collider.
     *
     * @private
     * @param {Object3D} collider - The collider to measure from.
     * @param {boolean} [isWallsOnly] - Whether to measure only to wall objects.
     * @returns {void}
     */
    private drawMeasurementForCollider;
    /**
     * Handles interactive preview placement mode for the model.
     * Creates a temporary wireframe clone that follows the mouse cursor,
     * checks for collisions, and places the actual model on click.
     * Right-click cancels the preview mode.
     *
     * @private
     * @param {Object3D | null} baseModel - The reference base model used for raycasting and placement alignment.
     * @returns {Promise<Promise<void>>} - Promise<void>
     */
    private handlePreviewMode;
    /**
     * Cleans up all temporary preview objects from the scene.
     *
     * @private
     * @returns {void}
     */
    private cleanupPreview;
    /**
     * Updates the color of the preview model based on its collision state.
     *
     * @private
     * @param {boolean} isColliding - Whether the preview model is currently colliding with other objects.
     * @returns {void}
     */
    private updatePreviewColor;
    /**
     * Handles right-click and Escape key events to cancel preview mode or open context menus.
     *
     * @private
     * @param {MouseEvent | KeyboardEvent} event - The triggered event.
     * @returns {void}
     */
    private onRightClick;
    /**
     * Handles a right-click that is not part of a placement/preview interaction.
     * Raycasts under the pointer and, if a selectable model is hit, selects it
     * and emits a `modelContextMenu` event carrying the pointer position and the
     * selected model's metadata so the frontend can render a context menu
     * (copy / delete). When empty space is clicked, emits `modelContextMenu` null
     * so any open menu is dismissed.
     *
     * @private
     * @param {MouseEvent} event - The originating `contextmenu` mouse event.
     * @returns {void}
     */
    private handleModelContextMenu;
    /**
     * Handles left-click event to finalize model placement in preview mode.
     *
     * @private
     * @returns {void}
     */
    private onLeftClick;
    /**
     * Handles mouse move events to update the position of the preview model.
     *
     * @private
     * @param {MouseEvent} event - The mouse event.
     * @returns {void}
     */
    private onMouseMove;
    /**
     * Handles pointer release. If no drag occurred, treat it as a selection click.
     *
     * @private
     * @param {MouseEvent} event - The mouse pointer event.
     * @returns {void}
     */
    private onPointerUp;
    /**
     * Stores initial pointer position to detect drag vs click.
     *
     * @private
     * @param {MouseEvent} event - The mouse pointer event.
     * @returns {void}
     */
    private onPointerDown;
    /**
     * Generates a unique name for a GLB model.
     *
     * @private
     * @param {string} baseName - The base name of the model.
     * @param {string} modelId - The ID of the model.
     * @returns {string} - The generated unique name.
     */
    private generateUniqueModelName;
    /**
     * Finds a model in the scene using both metadata ID and Name.
     *
     * @private
     * @param {string} id - The ID of the model.
     * @param {string} name - The name of the model.
     * @returns {Object3D | null} - The found model object or null.
     */
    private findModelByIdAndName;
    /**
     * Positions and configures the perspective camera based on the given model’s
     * bounding box so the model fits in view.
     * When `true`, a top-down layout view is applied.
     * When omitted or `false`, a standard perspective fit is used.
     *
     * @private
     * @param {PerspectiveCamera} camera - Perspective camera to be adjusted
     * @param {Object3D} model - Model used to compute camera framing
     * @param {boolean} [is2DLayout] - Optional flag indicating a 2D → 3D layout view.
     * @returns {void} - void
     */
    private adjustPerspectiveCamera;
    /**
     * Positions and configures the Orthographic camera based on the given model’s
     * bounding box so the model fits within the view.
     *
     * @private
     * @param {OrthographicCamera} camera - Orthographic camera to be adjusted
     * @param {Object3D} model - Model used to compute camera framing
     * @returns {void} - void
     */
    private adjustOrthographicCamera;
    /**
     * Creates a duplicate of the currently selected furnitureGroup.
     * Communicates outcomes via events: clonePending, cloneComplete.
     *
     * @private
     * @returns {boolean} - `true` if copy was initiated, `false` if no model is selected.
     */
    private makeCopyMultiSelect;
    /**
     * Removes the currently selected multi-selected models and its associated colliders,
     * measurements, and helpers from the scene.
     *
     * @private
     * @returns {boolean} - true if the models were successfully removed, otherwise false.
     */
    private removeModelMultiSelect;
    /**
     * Recursively disposes of all geometries, materials, and textures within the specified object.
     *
     * @private
     * @param {Object3D} model - The 3D object to dispose.
     * @returns {void}
     */
    private disposeGeometryAndMaterial;
    /**
     * Re-adds the previously replaced model to the scene, used when the
     * user cancels a replacement that required manual repositioning.
     *
     * @private
     * @returns {void}
     */
    private restoreReplacedModel;
    /**
     * Disposes the backed-up old model once a replacement has succeeded
     * and the backup is no longer needed.
     *
     * @private
     * @returns {void}
     */
    private disposeBackupModel;
    /**
     * Creates and adds a ground plane under the specified model.
     *
     * @private
     * @param {Object3D} model - The base room model to create a ground plane for.
     * @returns {void}
     */
    private addGroundPlaneForExistingLayout;
    /**
     * Scans the scene for textures and waits for them to load.
     *
     * @private
     * @returns {Promise<Promise<void>>}
     */
    private ensureAssetsLoaded;
    /**
     * Helper to save ArrayBuffer as a file.
     *
     * @private
     * @param {ArrayBuffer} buffer - The buffer to save.
     * @param {string} filename - The target filename.
     * @returns {void}
     */
    private saveArrayBuffer;
    /**
     * Helper to save string as a file.
     *
     * @private
     * @param {string} text - The string content to save.
     * @param {string} filename - The target filename.
     * @returns {void}
     */
    private saveString;
    /**
     * Initiates a file download in the browser.
     *
     * @private
     * @param {Blob} blob - The blob data to download.
     * @param {string} filename - The downloaded file name.
     * @returns {void}
     */
    private save;
    /**
     * Helper method to perform raycasting and identify the clicked wall face group index.
     *
     * @private
     * @param {PointerEvent} event - The pointer event.
     * @returns {{ mesh: Mesh, targetGroupIndex: number } | null} - | null} Information about the clicked wall face group.
     */
    private getClickedWallFace;
    /**
     * Click handler for wall coloring mode.
     *
     * @private
     * @param {PointerEvent} event - PointerEvent
     * @returns {void}
     */
    private onWallColoringClick;
    /**
     * Resets the material of a specific mesh to its original default.
     *
     * @private
     * @param {Mesh} mesh - The mesh to restore.
     * @param {number} [materialIndex] - The optional material index.
     * @returns {boolean} - True if successfully restored.
     */
    private restoreDefaultMaterial;
    /**
     * Click handler for wall texture placement.
     *
     * @private
     * @param {PointerEvent} event - The pointer event.
     * @returns {void}
     */
    private onWallTexturingClick;
    /**
     * Click handler for wall material reset mode.
     * When active, clicking a wall resets it to its original material.
     *
     * @private
     * @param {PointerEvent} event - The pointer event.
     * @returns {void}
     */
    private onWallMaterialResetClick;
    /**
     * Prepares a mesh for wall coloring by grouping faces by normal.
     * Each group of faces (triangles) that share the same normal direction
     * will get its own material. This allows different wall sides to be
     * colored independently.
     *
     * @private
     * @param {Mesh} mesh - The wall mesh to prepare.
     * @returns {void}
     */
    private groupFacesByNormal;
    /**
     * Helper to enable casting and receiving shadows for all meshes in an object hierarchy.
     *
     * @private
     * @param {Object3D} object - The object to traverse.
     * @param {boolean} [cast] - Whether to enable casting shadows.
     * @param {boolean} [receive] - Whether to enable receiving shadows.
     * @returns {void}
     */
    private enableShadowsOnObject;
    /**
     * Applies maximum anisotropic filtering to all textures in an object hierarchy.
     * This keeps textures sharp at oblique angles (e.g., looking along a wall or floor).
     * Has no runtime cost — runs once on model load.
     *
     * @private
     * @param {Object3D} object - The object hierarchy.
     * @returns {void}
     */
    private applyAnisotropicFiltering;
    /**
     * Helper method to set the correct active axes on transform controls based on the current mode.
     *
     * @private
     * @param {TransformControlsMode.ROTATE | TransformControlsMode.TRANSLATE | TransformControlsMode.SCALE} mode - The transform controls mode.
     * @returns {void}
     */
    private setTransformControlsAxes;
    /**
     * Distance from `origin` to the nearest wall of `roomModel` along `direction`.
     * Returns Infinity when nothing is hit (open direction).
     * Room walls are typically single-sided with normals facing into the room, so
     * a ray cast outward from inside would pass through their culled back faces and
     * miss. To measure reliably we temporarily force every wall material to
     * DoubleSide for the cast, then restore the original sides.
     *
     * @private
     * @param {Vector3} origin - The origin point.
     * @param {Vector3} direction - The search direction.
     * @param {Object3D} roomModel - The room model to cast rays against.
     * @returns {number} - The distance to the nearest wall.
     */
    private measureWallClearance;
    /**
     * Positions and adjusts the camera to focus on a specific object from an isometric view.
     *
     * @private
     * @param {any} camera - The camera to adjust.
     * @param {any} controls - The controls associated with the camera.
     * @param {Object3D} object - The target 3D object to fit in view.
     * @param {any} [offset] - The zoom/position offset multiplier.
     * @returns {void}
     */
    private fitCameraToObjectIsometric;
    /**
     * Handles double-click events on the canvas to focus the camera on a double-clicked object.
     *
     * @private
     * @param {any} e - The double-click event.
     * @returns {void}
     */
    private onDoubleClick;
    /**
    * Fires a raycaster ray from the camera position toward the world-space center
    * of the given cube and returns the list of intersections along that ray.
    *
    * A yellow ArrowHelper is added to the scene each time the method is called so
    * the ray direction can be inspected visually. The previous arrow (if any) is
    * removed before the new one is added.
    * @private
    * @param {Mesh} cube - The target cube mesh. Its world position is used as the ray target.
    * @param {Camera} camera - The camera from whose position the ray is fired.
    * @returns {import("three").Intersection[]} Array of intersections (sorted by distance, nearest first).
    */
    private raycastToCubeCenter;
    /**
     * Splits a wall face into multiple sections and applies colors or textures.
     *
     * @private
     * @param {Mesh} mesh - The target mesh.
     * @param {number} groupIndex - The index of the face group to split.
     * @param {number[]} [ratios=[0.5]] - The ratios defining the split positions.
     * @param {(Color | Texture)[]} [contents] - Colors or textures to apply to the split sections.
     * @returns {void}
     */
    private splitWallFace;
    /**
     * Positions the preview model relative to the base model and updates
     * floor detection, collision state, and preview appearance.
     */
    private positionPreviewModel;
    /**
     * Gets all placed 3D models in the 3D viewer.
     * @returns {Object3D[]} An array of all 3D models currently placed in the workspace (excluding the room model).
     * @description Gets all placed 3D models in the 3D viewer.
     * @private
     */
    private getPlacedModels;
    /**
     * Positions the given model so that the bottom of its world-space
     * bounding box aligns with the ground plane at y = 0.
     *
     * The model's world matrix is updated before calculating the bounding box
     * to ensure the bounds reflect its current world-space transformation.
     * After adjusting the model's Y position, its world matrix is updated again.
     *
     * @param model - The Three.js object to be positioned on the ground plane
     */
    private placeModelOnGround;
    /**
     * Checks whether the current model root represents the room model.
     *
     * @returns `true` if `modelRoot` exists and its name matches
     *          {@link RequiredStrings.ROOM_MODEL}; otherwise, returns `false`.
     */
    private isModelRootEqualToRoomModel;
    /**
     * Handles container and window resize events.
     *
     * @public
     * @returns {void}
     * @internal
     */
    handleResize(): void;
    /**
     * Loads a 3D model from a GLB/GLTF file URL and inserts it into the 3D viewer.
     *
     * @param {string} url The URL of the model to load.
     * @param {boolean} isPreview If set to `true`, the model will follow the mouse cursor until clicked to place it.
     * @param {Vector3} [position] (Optional) The initial position of the model.
     * @param {Euler} [rotation] (Optional) The initial rotation of the model.
     * @param {ModelLoadCallbacks} [callbacks] (Optional) Callback functions triggered during loading.
     * @param {boolean} [isSelectable] (Optional) If set to `true`, users can click to select and move the model. Defaults to `false`.
     * @param {object} [metadata] (Optional) Custom details to attach to the model.
     * @returns {Promise<Object3D | null>}
     *
     * @description
     * This method loads a 3D model and inserts it into the 3D viewer. It allows
     * you to place the model directly at a set position, or load it in preview
     * mode where it floats with the mouse cursor until placed.
     *
     * @public
     */
    loadModel(url: string, isPreview: boolean, position?: Vector3, rotation?: Euler, callbacks?: ModelLoadCallbacks, isSelectable?: boolean, metadata?: {
        category?: string;
        name?: string;
        id?: string;
        price?: string;
        format?: string;
    }): Promise<Object3D | null>;
    /**
     * Duplicates the currently selected 3D model in the workspace.
     *
     * @returns {boolean}
     * `true` if the duplicate process was started successfully, `false` if no model was selected.
     *
     * @description
     * This method creates a duplicate of the currently selected 3D model. The new
     * duplicate will float and follow the mouse cursor in preview mode, allowing
     * you to click and place it in the 3D viewer.
     *
     * @public
     */
    duplicateModel(): boolean;
    /**
     * Loads a model from a URL and adds it to the scene
     * @param url - Model URL to load
     * @param position - Optional position
     * @param rotation - Optional rotation
     * @returns The loaded Object3D
     * @internal
     * @public
     */
    loadOBJ(url: string, mtl?: string, position?: Vector3, rotation?: Euler): Promise<Object3D>;
    /**
     * Deletes the currently selected 3D model from the workspace.
     *
     * @returns {boolean}
     * `true` if the selected model was successfully deleted, `false` if no model was selected.
     *
     * @description
     * This method deletes the selected 3D model from the 3D viewer. It detaches
     * movement controls and cleans up the model's bounding box outlines and collision helpers.
     * @public
     */
    deleteModel(): boolean;
    /**
     * Exports the current configuration state
     * @internal
     * @returns The current configuration state
     * @public
     */
    exportState(): ConfigState;
    /**
     * Imports a configuration state
     * @internal
     * @param state - The configuration state to import
     * @param modelsMap - Optional map of model objects by URL
     * @public
     */
    importState(state: ConfigState, modelsMap?: Map<string, Object3D>): void;
    /**
     * Cleans up all configurator resources.
     *
     * @returns {void}
     *
     * @description
     * This method properly destroys the configurator instance, frees up system
     * resources, and cleans up internal memory. You should call this method when
     * unmounting the 3D configurator component.
     * @public
     */
    dispose(): void;
    /**
     * Clears the entire scene by removing all children.
     * @public
     * @returns {void}
     * @internal
     */
    clearScene(): void;
    /**
     * Resets the configurator viewer to its initial state where the base model is loaded.
     * @returns {void}
     * @internal
     * @description
     * Clears all models and custom elements in the scene, reloads the initial base model,
     * and re-initializes tooltip hover interactions.
     * @public
     */
    resetConfigurator(): void;
    /**
     * Sets the background color of the 3D viewer scene.
     * @param {number} backgroundColor The color value represented as a hexadecimal number
     * (e.g., `0xffffff` for white, `0x000000` for black).
     * @returns {void}
     * @description This method updates the background color of the 3D canvas scene dynamically.
     * @public
     */
    setBackgroundColor(backgroundColor: number): void;
    /**
     * Reads and processes a project configuration JSON file.
     *
     * @internal
     * @param {File} file - The JSON file to parse.
     * @param {(parsed: any) => void} [onParsed] - Optional callback triggered after parsing the JSON.
     * @param {(expanded: any) => void} [onExpanded] - Optional callback triggered after expanding config options.
     * @param {ModelLoadCallbacks} [modelLoadingCallbacks] - Optional callbacks for model loading events.
     * @returns {Promise<any>} A promise that resolves with the parsed project data.
     * @public
     */
    readJSONFile(file: File, onParsed?: (parsed: any) => void, onExpanded?: (expanded: any) => void, modelLoadingCallbacks?: ModelLoadCallbacks): Promise<any>;
    /**
     * Gets all the configuration options to display in the frontend.
     * @public
     * @returns {Record<string, ExpandedConfigOption> | null} The expanded configuration options or null.
     * @internal
     */
    getAllConfigOptions(): Record<string, ExpandedConfigOption> | null;
    /**
     * Gets the AssetLoader instance.
     * @public
     * @returns {AssetLoader} The asset loader.
     * @internal
     */
    getAssetLoader(): AssetLoader;
    /**
     * Gets the configuration option by its part ID to display in the frontend.
     * @param targetPartId - The ID of the target part.
     * @returns The configuration option or undefined if not found.
     * @internal
     * @public
     */
    getConfigOptionsByPartId(targetPartId: string): ExpandedConfigOption | undefined;
    /**
     * Replaces a swappable part of the model with a new variant.
     *
     * Retrieves the URI for the specified part variant and instructs the model controller
     * to perform the swap if the URI is valid.
     * @param {string} targetPartId - The ID of the part to be replaced.
     * @param {string} partVariantId - The ID of the new part variant.
     * @returns {Promise<void>} A promise that resolves when the swap is complete.
     * @internal
     * @public
     */
    replaceOption(targetPartId: string, partVariantId: string): Promise<void>;
    /**
     * Applies a texture to the specified mesh.
     *
     * Retrieves the texture URI for the given mesh and texture ID, and applies it
     * using the model controller if the URI is valid.
     *
     * @param {string} targetPartId - The ID of the part to apply the texture to.
     * @param {string} textureId - The ID of the texture to apply.
     * @returns {void}
     * @internal
     * @public
     */
    applyTextureById(targetPartId: string, textureId: string): void;
    /**
     * Applies a texture from a URL to the currently selected model.
     *
     * @param {string} texUrl The web URL or file path pointing to the texture image.
     * @param {string | number} [price] (Optional) The price associated with the applied texture to update the model metadata.
     * @returns {void}
     * @description This method applies a texture to the currently selected model in the 3D viewer.
     * @public
     */
    applyTextureToModel(texUrl: string, id: string, price?: string | number, targetModel?: Object3D): void;
    /**
     * Applies the passed material properties to the specified mesh.
     *
     * Retrieves the material data for the given mesh and material ID from the JSON data, and applies it
     * using the model controller.
     *
     * @param {string} targetPartId - The ID of the part to apply the texture to.
     * @param {string} materialId - The ID of the texture to apply.
     * @returns {Promise<void>} A promise that resolves when the material is updated.
     * @internal
     * @public
     */
    updateMaterial(targetPartId: string, materialId: string): Promise<void>;
    /**
     * Applies custom material properties (such as color, roughness, metalness,
     * and texture) to the currently selected model.
     *
     * @param {object} materialData
     * An object containing the material properties to apply:
     * - `color` (string | number, optional): Hex color or decimal representation.
     * - `metalness` (number, optional): The metalness value (typically between `0` and `1`).
     * - `roughness` (number, optional): The roughness value (typically between `0` and `1`).
     * - `side` (Side, optional): Three.js Side configuration (e.g. FrontSide,
     *   BackSide, DoubleSide).
     * - `texture` (string, optional): Web URL or file path pointing to the texture image.
     * - `price` (string | number, optional): Price value to store in the model's metadata.
     *
     * @returns {Promise<void>}
     *
     * @description
     * This method applies custom material properties (like colors, roughness,
     * metalness, and textures) to the active selected model in the workspace.
     * @public
     */
    applyMaterialToModel(materialData: {
        color?: string | number;
        metalness?: number;
        roughness?: number;
        side?: Side;
        texture?: string;
        price?: string | number;
    }): Promise<void>;
    /**
     * Resets the selected model's material to its original state.
     *
     * @returns {void}
     *
     * @description
     * This method reverts any applied material properties on the currently
     * selected model back to its original material configuration.
     * @public
     */
    resetMaterial(): void;
    /**
     * Resets the selected model's texture to its original state.
     *
     * @returns {void}
     *
     * @description
     * This method reverts any applied texture on the currently selected model
     * back to its original texture.
     * @public
     */
    resetTexture(): void;
    /**
     * Sets the model's camera view based on the specified direction.
     *
     * @param {string} camView
     * The desired camera view direction: "top", "bottom", "front",
     * "back", "left", "right", or "home".
     *
     * @returns {void}
     *
     * @description
     * This method adjusts the camera view direction relative to the model.
     * Defaults to the "front" view if the provided value is invalid.
     * @public
     */
    modelView(camView: string): void;
    /**
     * Shows or hides the base model based on the specified visibility flag.
     * Uses the model controller to update the model's visibility.
     * @param {boolean} visibility - `true` to show the model, `false` to hide it.
     * @returns {void}
     * @internal
     * @public
     */
    setModelVisibility(visibility: boolean): void;
    /**
     * Adjusts the camera to fit the base model within the view.
     *
     * @returns {void}
     * @internal
     * @public
     */
    fitToView(): void;
    /**
     * Toggles autorotation of the model.
     *
     * @param {boolean} val - Pass `true` to enable autorotation, or `false` to disable it.
     * @returns {void}
     * @internal
     * @public
     */
    setAutoRotation(val: boolean): void;
    /**
     * Toggles tooltip on hover.
     *
     * @param {boolean} val - Pass `true` to enable tooltip, or `false` to disable it.
     * @returns {void}
     * @internal
     * @public
     */
    enableTooltip(val: boolean): void;
    /**
     * Loads and applies an HDR environment map (HDRI) to the 3D viewer.
     *
     * @param {string} envUrl The web URL or file path pointing to the HDR/environment map file.
     * @param {number} [intensity] (Optional) The brightness/intensity of the environment lighting. Defaults to `1.0`.
     * @returns {Promise<void>}
     *
     * @description
     * This method loads a High-Dynamic-Range image (HDRI) and applies it to the
     * 3D viewer to provide realistic lighting and reflections across the 3D models.
     * @public
     */
    loadEnvironmentMap(envUrl: string, intensity?: number): Promise<void>;
    /**
     * Toggles the grid helper in the scene.
     *
     * @param {boolean} val - Pass `true` to show the grid, `false` to hide it.
     * @param {number} [size] - Optional size of the grid (applies only when enabling).
     * @param {number} [divisions] - Optional number of divisions (applies only when enabling).
     * @param {ColorRepresentation} [colorCenterLine] - Optional color for the center line (applies only when enabling).
     * @param {ColorRepresentation} [colorGrid] - Optional color for the grid lines (applies only when enabling).
     * @returns {void}
     * @internal
     * @public
     */
    setGridVisibility(val: boolean, size?: number, divisions?: number, colorCenterLine?: ColorRepresentation, colorGrid?: ColorRepresentation): void;
    /**
     * Switches the active camera or model interaction control mode.
     *
     * @param {"orbit" | "trackball" | "pointerlock" | "transform"} type
     * The type of control mode to activate:
     * - `"orbit"`: Default orbital rotation, zoom, and panning.
     * - `"trackball"`: Free rotation controls.
     * - `"pointerlock"`: First-person keyboard/mouse navigation.
     * - `"transform"`: Gizmo controls to translate, rotate, or scale the selected model.
     *
     * @returns {void}
     *
     * @description
     * This method switches the active interaction control mode. When switching
     * to `"transform"`, it attaches transformation gizmo controls to the selected
     * model so users can reposition it.
     * @public
     */
    switchControlMode(type: ControlTypes.ORBIT | ControlTypes.TRACKBALL | ControlTypes.POINTER_LOCK | ControlTypes.TRANSFORM): void;
    /**
     * Sets the active transformation mode for the transform gizmo.
     *
     * @param {"translate" | "rotate" | "scale"} mode
     * The gizmo mode to set:
     * - `"translate"`: Show translation arrows to move the model.
     * - `"rotate"`: Show rotation rings to rotate the model.
     * - `"scale"`: Show scaling handles to resize the model.
     *
     * @returns {void}
     *
     * @description
     * This method changes the tool mode of the transform controls. It only takes
     * effect if the active control mode is set to `"transform"` (using
     * `switchControlMode`) and a model is currently selected.
     * @public
     */
    setTransformMode(mode: TransformControlsMode.TRANSLATE | TransformControlsMode.ROTATE | TransformControlsMode.SCALE): void;
    /**
     * Sets the size of the transformation controls gizmo.
     *
     * @param {number} size
     * A positive number determining the size scale of the transformation gizmo. Defaults to `1`.
     * @returns {void}
     * @description This method adjusts the scale and size of the active transform controls gizmo in the 3D viewport.
     * @public
     */
    setTransformSize(size: number): void;
    /**
     * Shows or hides a specific translation/rotation/scaling axis on the transform gizmo.
     *
     * @param {"x" | "y" | "z"} axis The target axis to configure.
     * @param {boolean} visible Set to `true` to make the axis visible; set to `false` to hide it.
     * @returns {void}
     * @description
     * This method allows toggling the visibility of individual transform handles
     * (X, Y, or Z axes) on the active transform gizmo.
     * @public
     */
    toggleTransformAxis(axis: "x" | "y" | "z", visible: boolean): void;
    /**
     * Retrieves the ID of the currently selected model in the workspace.
     *
     * @returns {string | null}
     * The unique ID of the selected model, or `null` if no model is currently selected.
     *
     * @description
     * This method retrieves the unique identifier (`id`) attached to the currently
     * selected model. It returns `null` if nothing is selected or if the selected
     * model does not have an ID in its metadata.
     * @public
     */
    getModelId(): string | null;
    /**
     * Retrieves the metadata of the currently selected model.
     *
     * @returns {any | null}
     * The metadata object of the selected model, or `null` if no model is selected
     * or if it has no metadata.
     *
     * @description
     * This method retrieves the metadata (such as name, category, price, or applied
     * materials/textures) of the currently selected model.
     * @public
     */
    getModelMetadata(): any | null;
    /**
     * Rotates the currently selected model around a specified axis.
     *
     * @param {"x" | "y" | "z"} axis The axis to rotate around.
     * @param {number} angle The rotation angle in degrees.
     * @returns {boolean}
     * `true` if the rotation was applied successfully, or `false` if it failed
     * @description
     * This method rotates the currently selected model around the specified axis
     * (`"x"`, `"y"`, or `"z"`). If the rotation causes a collision, it is automatically reverted.
     * @public
     */
    rotateModel(axis: "x" | "y" | "z", angle: number): boolean;
    /**
     * Gets the rotation of the currently selected model in degrees.
     *
     * @returns {{ x: number; y: number; z: number } | null}
     * An object containing `x`, `y`, and `z` rotation components in degrees,
     * or `null` if no model is selected.
     *
     * @description
     * This method retrieves the current rotation of the selected model along
     * the X, Y, and Z axes. The values returned are rounded to the nearest degree.
     * @public
     */
    getModelRotation(): {
        x: number;
        y: number;
        z: number;
    } | null;
    /**
     * Replaces the currently selected model in the workspace with a new model
     * from a URL, preserving the original model's position, rotation, and scale.
     *
     * @param {string} newUri The web URL or file path pointing to the new GLB/GLTF model.
     * @param {object} [metadata] (Optional) Custom details to attach to the new model (such as product name, ID, price, and format).
     * @returns {Promise<boolean>} Resolves to `true` if the replacement succeeded, or `false` if it failed
     * @description
     * This method swaps the active selected model with a new one. It automatically
     * keeps track of the original model's transformation parameters (position,
     * rotation, scale) and applies them to the incoming model. If the load fails,
     * the system automatically restores the old model.
     * @public
     */
    replaceModel(newUri: string, metadata?: {
        name?: string;
        id?: string;
        price?: string;
        format?: string;
    }): Promise<boolean>;
    /**
     * Toggles distance measurements from the currently active model (or preview model) to surrounding objects or walls.
     *
     * @returns {boolean}
     * `true` if measurements were successfully drawn and applied, or `false` if no active model was found.
     *
     * @description
     * This method calculates and visualizes the distance from the currently
     * selected model (or the floating preview model) to surrounding objects
     * or walls in the 3D viewer.
     *
     * To configure the behavior of the distance measurements, update the public
     * `measurementState` property on the instance before calling this method:
     *
     * ```
     * configuratorCore.measurementState = {
     *   isActive: boolean;    // Enables or disables the measurement calculations
     *   isWallsOnly: boolean; // Measures only to walls (true) or to all obstacles (false)
     * };
     * ```
     * If `measurementState.isActive` is set to `false`, calling `toggleMeasurement()` clears all existing measurement helpers and returns `false`.
     * @public
     */
    toggleMeasurement(): boolean | undefined;
    /**
     * Shows all measurements for all placed models in the 3D viewer.
     * @returns {void}
     * @description This method shows distance measurements from all placed models (plus the
     * active preview model, if present) to surrounding elements in the 3D viewer.
     * @public
     */
    showAllMeasurements(): void;
    /**
     * Removes all active measurement helpers (lines, labels, inputs) from the viewer.
     * @returns {void}
     * @description Removes all currently visible distance measurements from the viewer.
     * @public
     */
    clearAllMeasurements(): void;
    /**
     * Initiates a Virtual Reality (VR) session.
     * @returns {void}
     * @description Enables Virtual Reality (VR) mode, allowing users to experience the 3D room
     * design in an immersive environment on supported VR headsets.
     * @public
     */
    enableVR(): void;
    /**
     * Gets a summary of all placed models including their name, quantity, price and total price.
     *
     * @returns {{ models: { id: string; name: string; unitPrice: number; quantity: number }[]; grandTotal: number }}
     * An object containing grouped model details (`models`) and the overall
     * `grandTotal` price.
     *
     * @description Calculates and gets a summary of all models currently placed in the 3D viewer,
     * including their names, quantities, individual prices, and the grand total price.
     * @public
     */
    getModelsSummary(): {
        models: {
            id: string;
            name: string;
            unitPrice: number;
            quantity: number;
        }[];
        grandTotal: number;
    };
    /**
     * Selects a model in the 3D viewer using its ID and name.
     *
     * @param {string} id The ID of the model to select.
     * @param {string} name The name of the model to select.
     * @returns {boolean} `true` if the model was found and successfully selected, or `false` otherwise.
     * @description Finds and selects a specific 3D model in the 3D viewer using its ID and name.
     *
     * When a matching model is found, this method:
     * - Sets the matched model as the active selection.
     * - Activates the transform controls (gizmo) on the selected model so the user
     *   can move or rotate it.
     * - Updates and draws distance measurements from this model to surrounding
     *   walls and objects (if measurement mode is active).
     * - Emits a `modelSelected` event containing the selected model's metadata
     *   to notify your frontend interface.
     *
     * Returns `false` if no matching model is found, or if the model is marked
     * as non-selectable.
     * @public
     */
    selectModelByIdAndName(id: string, name: string): boolean;
    /**
     * Highlights a specific model in the 3D viewer using its ID and name.
     * @param {string} id The ID of the model to highlight.
     * @param {string} name The name of the model to highlight.
     * @returns {boolean} `true` if the model was found and successfully highlighted, or `false` otherwise.
     * @description Finds and highlights a specific 3D model in the 3D viewer using its ID and name.
     *
     * When a matching model is found, this method:
     * - Clears any currently active hover highlights in the 3D viewer.
     * - Draws a wireframe box highlight around the matched model to visually indicate
     *   a hover state.
     * - Emits a `modelHovered` event containing the hovered model's metadata to notify
     *   your frontend interface.
     *
     * Returns `false` if no matching model is found, or if the model is marked
     * as non-selectable.
     * @public
     */
    hoverModelByIdAndName(id: string, name: string): boolean;
    /**
     * Removes the current hover highlight from any 3D model in the 3D viewer.
     * @returns {void}
     * @description This method clears the hover status by performing the following actions:
     * - Removes the wireframe box highlight of the hovered model from the 3D viewer.
     * - Emits a `modelHovered` event with `null` to notify the frontend that no object is currently hovered.
     * @public
     */
    clearHoverHighlight(): void;
    /**
     * Sets the camera type between perspective and orthographic projection views.
     * @param {"perspective" | "orthographic"} type The view mode to activate (either `"perspective"` or `"orthographic"`).
     * @returns {void}
     * @public
     */
    setCameraType(type: CameraTypes.PERSPECTIVE | CameraTypes.ORTHOGRAPHIC): void;
    /**
     * Stops the render loop and pauses scene updates.
     * @public
     * @returns {void}
     * @internal
     */
    pauseRenderer(): void;
    /**
     * Resumes the default render loop and scene updates.
     * @public
     * @returns {void}
     * @internal
     */
    resumeRenderer(): void;
    /**
     * Adds an Object3D to the scene.
     * @public
     * @param {Object3D} model - The 3D model/mesh to add.
     * @param {Object3D} groundPlane - The ground plane object.
     * @returns {void}
     * @internal
     */
    load2DTo3DMesh(model: Object3D, groundPlane: Object3D): void;
    /**
     * Removes a 2D-to-3D generated mesh group from the scene and disposes all associated geometries and materials.
     * @public
     * @param {Group} group - The group to remove.
     * @returns {void}
     * @internal
     */
    remove2DTo3DMesh(group: Group): void;
    /**
     * Captures a snapshot of the current 3D viewer with an adjusted view.
     *
     * @returns {string}
     * The base64 data URL of the captured PNG image.
     *
     * @description
     * This method adjusts the camera view to fit the model and captures it as a
     * PNG image data URL.
     * @public
     */
    takeSnapshot(): string;
    /**
     * Exports the current 3D scene to a GLB file and initiates a download.
     * Waits for all assets (textures, etc.) to load before exporting.
     * @public
     * @internal
     */
    exportToGLB(): Promise<void>;
    /**
     * Sets the active paint color for painting walls in the 3D viewer.
     * @param {string} color The hex color string (e.g., `"#ffffff"`) to set as the active paint color.
     * @returns {void}
     * @description Sets the color that will be applied to wall faces when wall coloring mode is active.
     * @public
     */
    setWallColor(colorObj: {
        color: string;
        id: string;
        name: string;
    }): void;
    /**
     * Enables or disables the interactive wall painting mode.
     *
     * @param {boolean} active Set to `true` to enable wall painting; set to `false` to disable it.
     * @returns {void}
     * @description This method sets the wall coloring mode. When active, clicking on any wall
     * in the room will apply the currently selected wall color.
     * @public
     */
    enableWallColoringMode(active: boolean): void;
    /**
     * Enables or disables the interactive wall texturing mode.
     *
     * @param {boolean} active Set to `true` to enable wall texturing; set to `false` to disable it.
     * @returns {void}
     * @description This method sets the wall texturing mode. When active, clicking on any wall
     * in the room will apply the texture selected with `SetSelectedWallTexture`.
     * @public
     */
    enableWallTextureMode(active: boolean): void;
    /**
     * Enables or disables the interactive wall material reset mode.
     *
     * @param {boolean} active Set to `true` to enable wall material reset mode; set to `false` to disable it.
     * @returns {void}
     * @description This method sets the wall material reset mode. When active, clicking on any
     * wall face in the room will revert its material/color back to the wall's original base material.
     * @public
     */
    enableWallMaterialResetMode(active: boolean): void;
    /**
     * Sets the active texture image for texturing walls in the 3D viewer.
     *
     * @param {object} texturePreset An object containing:
     * - `url` (string): The web URL or file path pointing to the texture image file.
     * - `repeatX` (number, optional): The horizontal scaling/repeat factor.
     * - `repeatY` (number, optional): The vertical scaling/repeat factor.
     * @returns {void}
     * @description This method configures the texture image and scale factors that will be
     * applied to wall faces when wall texturing mode is active.
     * @public
     */
    setWallTexture(texturePreset: {
        url: string;
        repeatX?: number;
        repeatY?: number;
    }): void;
    /**
     * Applies a specific paint color to all walls in the 3D viewer.
     *
     * @param {string} hexColor The hex color string (e.g., `"#ffffff"`) to apply to all walls.
     * @returns {void}
     * @description This method immediately applies the specified color to all visible walls in the 3D viewer.
     * @public
     */
    applyColorToAllWalls(hexColor: string): void;
    /**
     * Applies a specific texture to all walls in the 3D viewer.
     *
     * @param {object} texturePreset
     * An object containing:
     * - `url` (string): The web URL or file path pointing to the texture image file.
     * - `repeatX` (number, optional): The horizontal scaling/repeat factor.
     * - `repeatY` (number, optional): The vertical scaling/repeat factor.
     *
     * @returns {void}
     *
     * @description This method immediately applies the specified texture to all visible walls in the 3D viewer.
     * @public
     */
    applyTextureToAllWalls(texturePreset: {
        url: string;
        repeatX?: number;
        repeatY?: number;
    }): void;
    /**
     * Resets all walls in the 3D viewer to their original colors and textures.
     * @returns {void}
     * @description This method immediately reverts any custom colors or textures applied to
     * any walls in the 3D viewer, restoring them to their original default material state.
     * @public
     */
    resetWalls(): void;
    /**
     * Applies a specific color to all floors in the 3D viewer.
     *
     * @param {string} hexColor The hex color string (e.g., `"#ffffff"`) to apply to all floors.
     * @returns {void}
     * @description This method immediately applies the specified color to all floor surfaces
     * in the room, clearing any custom textures that were previously applied.
     * @public
     */
    applyColorToAllFloors(hexColor: string, id: string): void;
    /**
     * Applies a specific texture to all floors in the 3D viewer.
     *
     * @param {object} texturePreset
     * An object containing:
     * - `url` (string): The web URL or file path pointing to the texture image file.
     * - `repeatX` (number, optional): The horizontal scaling/repeat factor.
     * - `repeatY` (number, optional): The vertical scaling/repeat factor.
     *
     * @returns {void}
     *
     * @description This method immediately applies the specified texture and scaling/repeat
     * settings to all floor surfaces in the room.
     * @public
     */
    applyTextureToAllFloors(texturePreset: {
        url: string;
        id: string;
        repeatX?: number;
        repeatY?: number;
    }): void;
    /**
     * Resets all floors in the 3D viewer to their original colors and textures.
     * @returns {void}
     * @description This method immediately reverts any custom colors or textures applied to
     * the floors in the 3D viewer, restoring them to their original default material state.
     * @public
     */
    resetFloor(): void;
    /**
     * Enables or disables the post-processing manager pass.
     *
     * @public
     * @param {boolean} enable - Whether to enable post-processing.
     * @returns {void}
     */
    enablePostProcessing(enable: boolean): void;
    /**
     * Enables or disables the automatic wall hiding feature.
     * @param {boolean} enabled Pass `true` to enable automatic wall hiding; pass `false` to disable it and make all walls visible.
     * @returns {void}
     * @description This method toggles whether walls that obstruct the view into the room are
     * automatically hidden or faded out. When disabled (`false`), all walls and
     * their associated fixtures (such as doors and windows) are immediately restored to full visibility.
     * @public
     */
    enableWallHiding(enabled: boolean): void;
    /**
     * Checks if a model is currently selected and has active transformation controls attached to it.
     * @returns {boolean}
     * Returns `true` if a model is selected and transformation controls are active; otherwise, returns `false`.
     * @description This method checks the current state of the workspace. It returns `true` if
     * a model is selected and the move/rotate/scale handles are currently active and attached to it.
     * @public
     */
    isModelSelected(): boolean;
    /**
     * Creates a permanent group from the current furniture items.
     * The items are grouped together and the new group becomes selected.
     *
     * @param customName Optional name for the new group.
     * @returns true if the group was created, otherwise false.
     */
    createPermanentGroup(customName?: string): boolean;
    /**
     * Disbands/ungroups the currently selected permanent group or target group.
     *
     * @returns true if group was successfully disbanded, false otherwise.
     */
    ungroupSelectedGroup(): boolean;
    /**
     * Returns the hierarchy of selectable objects in the scene.
     *
     * Furniture items are added as top-level objects, while selectable groups
     * include their child objects. The room model and non-selectable objects
     * are excluded.
     *
     * @returns An array of selectable object hierarchy nodes.
     */
    getSelectableObjectHierarchy(): HierarchyNode[];
    /**
     * Exports the 3D scene (room layout and placed furniture) as a binary GLB (ArrayBuffer).
     * Filters out helpers, cameras, lights, skyboxes, and gizmos.
     */
    exportSceneAsGLB(options?: {
        binary?: boolean;
    }): Promise<void>;
    /**
     * Exports the 3D configuration of selectable objects in the scene.
     *
     * Traverses the first-level children of the scene:
     * - If an object has userData.selectable = "true" and !(userData.isGroup && userData.isGroup = true),
     *   stores its transformation matrix against its userData.metadata.id.
     * - If an object has userData.selectable = "true" and (userData.isGroup && userData.isGroup = true),
     *   stores its transformation matrix, name, and children array against its userData.metadata.id.
     *   For the children of this group, repeats the process for selectable non-group children.
     *
     * @returns An object containing the exported 3D configuration mapped against metadata IDs.
     */
    export3DConfig(): Record<string, any>;
    /**
     * Loads a GLB model from the specified URL using AssetLoader.
     *
     * @param url URL of the GLB model to load.
     * @param callbacks Optional loading callbacks.
     * @param isSelectable Whether the loaded model should be selectable.
     * @returns Promise resolving to the loaded Object3D.
     */
    /**
     * Imports and loads a 3D configuration object, reconstructing objects and permanent groups.
     *
     * - If an object has 0 children: uses loadGLB to load the object, then applies its transformation matrix.
     * - If an object has children: uses loadGLB to load each child, calls createPermanentGroup to group them,
     *   and applies transformation matrices relative to the immediate parent for all loaded objects.
     *
     * @param config The 3D configuration object (or JSON string).
     * @returns Promise resolving to a record of loaded top-level objects and groups mapped by ID.
     */
    import3DConfig(config: Record<string, any> | string): Promise<Record<string, Object3D>>;
    /**
     * Alias for import3DConfig.
     */
    load3DConfig(config: Record<string, any> | string): Promise<Record<string, Object3D>>;
    /**
     * Alias for import3DConfig.
     */
    apply3DConfig(config: Record<string, any> | string): Promise<Record<string, Object3D>>;
    processObjectMaterials(config: ObjectConfig[]): Promise<void>;
    private getWallById;
}
interface MaterialConfig {
    index: number;
    finishId: string;
    url: string;
}
interface ObjectConfig {
    id: string;
    materials: MaterialConfig[];
}
export {};
