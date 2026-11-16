import {
  Scene,
  Color,
  Object3D,
  Vector3,
  Euler,
  Camera,
  PerspectiveCamera,
  Box3,
  type Side,
  FrontSide,
  BackSide,
  DoubleSide,
  OrthographicCamera,
  Quaternion,
  GridHelper,
  type ColorRepresentation,
  Clock,
  Mesh,
  Raycaster,
  Group,
  Vector2,
  Material,
  MathUtils,
  MeshBasicMaterial,
  Sprite,
  CanvasTexture,
  SpriteMaterial,
  Texture,
  ArrowHelper,
  Spherical,
  SpotLight,
  MeshStandardMaterial,
  MirroredRepeatWrapping,
  PlaneGeometry,
  TextureLoader,
  RepeatWrapping,
  SRGBColorSpace,
  Matrix4,
} from "three";
import {
  Tween,
  Group as TweenGroup,
  Easing
} from '@tweenjs/tween.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type {
  ConfiguratorOptions,
  ConfigState,
  ModelLoadCallbacks,
  ProjectConfig,
  HierarchyNode
} from "./types/types";
import { AssetLoader } from "./Components/AssetLoader";
import { RendererManager } from "./Components/RendererManager";
import { LightsManager } from "./Components/LightsManager";
import { CameraManager } from "./Components/CameraManager";
import { ControlsManager } from "./Components/ControlsManager";
import { WallBuilder } from "./Components/WallBuilder";
import {
  LineMaterial,
  PointerLockControls,
  TrackballControls,
  TransformControls,
  GLTFExporter,
} from "three/examples/jsm/Addons.js";
import {
  ProjectFileReader,
  type ExpandedConfigOption,
} from "./ProjectFileReader";
import { ModelController } from "./Components/ModelController";
import { TooltipOnHover } from "./Components/TooltipOnHover";
import { CollisionSystem } from "./Components/CollisionSystem";
import { ViewCubeGizmo } from "@mlightcad/three-viewcube";
import { PostProcessingManager } from "./Components/PostProcessingManager";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { VRManager } from "./Components/VRManager";
import { RequiredStrings, ImageAssets, TransformControlsMode, ControlTypes, CameraTypes, DOMEvents, SelectableState, FloorNames, CameraNames, CursorStyle, Config, KeyboardKey, Opening3DConstraints, AnnotationMode, CurrentMode } from "./Constants";
import { Events, ConfiguratorEventType } from "./event";
import { RoomAnnotationManager } from "./Components/RoomAnnotationManager";
import { ActionType3D, Design3DHistoryManager, type HistoryEntry3D, type MaterialAppearanceData, type WallAppearanceData } from "./Design3DHistoryManager";
import { ActionTypeConfigure, ConfigureHistoryManager, type ConfigureModelSnapshot, type ConfigureSnapshot, } from "./ConfigureHistoryManager";
import type { Undo_Redo_Payload } from "./event/ConfiguratorEventType";
import { LengthUnitConverter } from "./Components/LengthUnitConverter";
/**
 * Core class for the 3D configurator
 * Handles scene setup, model management, and state export
 */
export class ConfiguratorCore {
  /**
   * Three.js Scene object
   */
  protected readonly scene: Scene;

  /**
   * Current Modes
   */
  private currentMode: CurrentMode = CurrentMode.THREE_D_MODE;


  /**
   * Three.js Camera object
   */
  private camera!: Camera;

  /**
  * Design3DHistoryManager instance for managing undo/redo actions
  */
  private design3DHistoryManager!: Design3DHistoryManager;

  /**
  * ConfigureHistoryManager instance for managing undo/redo actions
  */
  private configureHistoryManager!: ConfigureHistoryManager;

  /**
   * Group that holds multi-selected furniture models
   */
  protected furnitureGroup: Group = new Group();

  /**
   * Renderer manager object
   */
  private readonly rendererManager: RendererManager;

  /**
   * DOM container element
   */
  private readonly container: HTMLElement;

  /**
   * Map of loaded models by ID
   */
  private readonly models: Map<
    string,
    {
      object: Object3D;
      url: string;
    }
  > = new Map();

  /**
   * Configurator options
   */
  private readonly options: ConfiguratorOptions;

  /**
   * Asset loader to load glb/gltf
   */
  protected assetLoader: AssetLoader;

  /**
   * LightsManager to add lighting to the scene
   */
  protected lightsManager: LightsManager;

  /**
   * Camera manager to add perspective, orthographic camera
   */
  private cameraManager: CameraManager;

  /**
   * Controls manager to add orbit, trackball controls
   */
  protected controlsManager: ControlsManager;

  /**
   * Project file reader to read the input json file and store as object
   */
  private projectFileReader: ProjectFileReader;

  /**
   * Handles all VR session and rendering logic
   */
  private vrManager: VRManager;

  /**
   * JSON object after reading the input json file
   */
  private projectJSON!: ProjectConfig;

  /**
   * Updated json object as required in the frontend
   */
  private updatedProjectJSON!: Record<string, ExpandedConfigOption>;

  /**
   * Model controller for operations on the main model
   */
  protected modelController: ModelController;

  /**
   * Collision system for spatial intersection tests
   */
  protected collisionSystem: CollisionSystem;

  /**
   * Model which is getting configured
   */
  protected mainModel!: Object3D;

  /**
   * Observes resize changes on the canvas/container.
   */
  private resizeObserver!: ResizeObserver;

  /**
   * Manages advanced visual effects and post-processing pipeline.
   */
  private postProcessingManager!: PostProcessingManager;

  /**
   * Displays tooltips on hover over UI or 3D objects.
   */
  private tooltipHelper!: TooltipOnHover;

  /**
   * 3D view cube for camera orientation control.
   */
  private viewCubeGizmo: ViewCubeGizmo;

  /**
   * Optional grid helper for scene floor reference.
   */
  private gridHelper: GridHelper | null = null;

  /**
   * Clock used for animations and updates.
   */
  private clock = new Clock();

  /**
   * Root object of the loaded 3D model.
   */
  protected modelRoot: Object3D | null = null;

  /**
     * LabelManager helper instance for managing labels.
     */
  private roomAnnotationManager: RoomAnnotationManager;

  /**
   * WallBuilder instance for constructing walls with openings.
   */
  private wallBuilder: WallBuilder;

  /**
   * Currently active camera control.
   */
  private controls!:
    | OrbitControls
    | TrackballControls
    | PointerLockControls
    | TransformControls;

  /**
   * Stores the last known camera position and control target.
   */
  private savedCameraState: {
    position: Vector3;
    target: Vector3;
    frustum?: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      near: number;
      far: number;
    };
  } | null = null;

  /**
   * Callback functions used to check visibility of the view cube.
   */
  private checkCubeVisibilityFns: ((camera: Camera) => void)[] = [];

  /**
   * Handler triggered when an object changes.
   */
  private onObjectChangeHandler?: () => void;

  /**
   * Handler triggered when dragging state changes in TransformControls.
   */
  private onDraggingChangedHandler?: (event: any) => void;

  /**
 * Handler triggered when the mouse button is pressed on TransformControls.
 */
  private onMouseDownHandler?: () => void;

  /**
   * Handler triggered when the mouse button is released on TransformControls.
   */
  private onMouseUpHandler?: () => void;

  /**
 * Handler triggered when the dragging state changes in TransformControls
 * to emit the updated model rotation when dragging ends.
 */
  private onRotationDraggingChangedHandler?: (event: { value: unknown }) => void;

  /**
   * Raycaster used for object selection in the scene.
   */
  private raycasterForSelection = new Raycaster();

  /**
   * Normalized mouse coordinates used with the selection raycaster.
   */
  private mouseForSelection = new Vector2();

  /**
   * Flag to control whether the wall-hiding (raycast to cube) feature is active.
   */
  private isWallHidingEnabled: boolean = false;

  /**
   * Timer ID for debouncing resize events.
   */
  private resizeTimeout?: number;

  /**
   * Stores the last valid position of the currently selected model for collision handling.
   */
  private currentSelectedLastValidPosition: Vector3 = new Vector3();

  /**
   * Stores the last valid rotation of the currently selected model for collision handling.
   */
  private currentSelectedLastValidRotation: Quaternion = new Quaternion();

  /**
   * Stores the previous quaternion rotation of the selected model.
   */
  private previousQuaternion = new Quaternion();

  /**
 * Stores the previous transform state of a 3D object before modification,
 * including its position, rotation, and scale, for undo and redo operations.
 * Initialized to null when no previous transform snapshot is available.
 */
  private previousTransformSnapshot: ConfigureSnapshot | null = null

  /**
   * Enables selecting and moving objects.
   */
  private selectionEnabled = true;

  /**
   * Flag to check if measurement mode is currently active.
   */
  protected isMeasurementActive: boolean = false;

  /**
   * Flag to check if all measurements mode is currently active.
   */
  protected isShowAllMeasurementsActive: boolean = false;

  /**
   * Flag to check if the user is currently dragging for placement.
   */
  private isDraggingForPlacement: boolean = false;


  /**
   * Public state object for distance measurement to be accessed and updated by the frontend.
   */
  public measurementState = {
    isActive: false,
    isWallsOnly: false,
  };

  /**
   * Spot light attached to the camera.
   */
  private cameraLight!: SpotLight;

  /**
   * Holds reference to the input element used for editing distance labels.
   */
  private activeInput: HTMLInputElement | null = null;

  /**
   * Group to hold all measurement elements (lines, arrows, labels).
   */
  protected measurementGroup: Group | null = null;

  /**
   * Stores the default animation loop callback used in normal (non-VR) mode.
   */
  private defaultLoop: XRFrameRequestCallback | null = null;

  /**
   * Flag to check if user is placing the model (true when placing, else false).
   */
  protected isPreviewActive = false;

  /**
   * Tracks whether the preview model is currently positioned on a floor mesh.
   */
  private isPreviewOnFloor = false;

  /**
   * Cloned wireframe version of the model for preview.
   */
  private previewModel: Object3D | null = null;

  /**
   * The base object used for raycasting during preview.
   */
  private basePreviewModel: Object3D | null = null;

  /**
   * Stores selection state before preview started.
   */
  private prevSelectionState = true;

  /**
   * Stores previous model selection before preview started.
   */
  protected prevModelRoot: Object3D | null = null;

  /**
   * Collider used to check preview placement collisions.
   */
  private previewCollider: Object3D | null = null;

  /**
   * Tracks initial mouse X position for selection drag detection.
   */
  private dragStartX = 0;

  /**
   * Tracks initial mouse Y position for selection drag detection.
   */
  private dragStartY = 0;

  /**
   * Indicates whether the mouse movement has exceeded drag threshold.
   */
  private isDraggingForSelection = false;

  /**
   * Box3Helper used to highlight an object while hovering.
   */
  private hoverBoxHelper: Object3D | null = null;

  /**
   * Currently hovered mobile collider (used to detect hover changes).
   */
  private hoveredCollider: Object3D | null = null;

  /**
   * Half-height of the orthographic camera frustum.
   */
  private orthoFrustumHeight: number | null = null;

  /**
   * Boundary cubes used for raycasting to check wall visibility.
   */
  private wall_hiding_cubes: Mesh[] = [];

  /**
   * The color currently selected for wall coloring.
   */
  private selectedWallColor: { color: string; id: string; name: string } = { color: "#f5b942", id: "", name: "" };

  /**
   * Flag to indicate if wall coloring mode is active.
   */
  private isWallColoringMode: boolean = false;

  /**
   * The texture currently selected for wall texturing.
   */
  private selectedWallTexture: { url: string; id: string; repeatX?: number; repeatY?: number } | null = null;

  /**
   * Flag to indicate if wall texturing mode is active.
   */
  private isWallTexturingMode: boolean = false;

  /**
   * Flag to indicate if wall material reset mode is active.
   */
  private isWallMaterialResetMode: boolean = false;

  /**
   * Flag to enable post processing.
   */
  private isPostProcessingActive: boolean = false;

  /**
   * Stores the removed model for backup in case of collision.
   */
  protected modelPendingReplacement: {
    object: Object3D;
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
  } | null = null;

  /**
   * Flag to indicate if model is being replaced.
   */
  protected isReplacingModel = false;

  /**
   * Flag to indicate if a cloned model is being placed.
   */
  private isCloningModel = false;

  /**
   * Animation tween group for camera transitions.
   */
  private tweenGroup = new TweenGroup();

  /**
   * Indicates whether the preview model is being dragged by the user (panning or orbiting).
   */
  private isPreviewDragging = false;

  /**
   * Stored handler reference for adding/removing KEY_DOWN event listener.
   */
  private handleKeyDown = (e: KeyboardEvent): void => this.onKeyDown(e);

  /**
   * Creates a new ConfiguratorCore instance
   *
   * @param options - Configuration options
   */
  constructor(options: ConfiguratorOptions) {
    // Initializing scene
    this.scene = new Scene();
    // initialize AssetLoader
    this.assetLoader = new AssetLoader();
    this.lightsManager = new LightsManager(this.scene);
    this.cameraManager = new CameraManager();
    this.controlsManager = new ControlsManager(this.scene);
    this.projectFileReader = new ProjectFileReader();
    this.roomAnnotationManager = RoomAnnotationManager.getInstance();
    this.wallBuilder = WallBuilder.getInstance();
    this.design3DHistoryManager = new Design3DHistoryManager();
    this.configureHistoryManager = new ConfigureHistoryManager();

    this.options = options;

    // get html element in which viewer is to be initialized
    this.container = this.getContainer(options);

    // Set background color if provided
    if (options.backgroundColor !== undefined) {
      this.scene.background = new Color(options.backgroundColor);
    }

    // Create camera
    const width = options.width ?? this.container.clientWidth;
    const height = options.height ?? this.container.clientHeight;

    const cameraType = options.cameraType;

    switch (cameraType) {
      case CameraTypes.PERSPECTIVE:
        this.cameraManager.addPerspectiveCamera(
          CameraNames.PERSPECTIVE_CAMERA,
          75,
          width / height,
          0.1,
          10000
        );
        this.cameraManager.setActiveCamera(CameraNames.PERSPECTIVE_CAMERA);
        this.camera = this.cameraManager.getActiveCamera();
        break;

      case CameraTypes.ORTHOGRAPHIC:
        const frustumSize = 5;
        const aspect = width / height;
        this.cameraManager.addOrthographicCamera(
          CameraNames.ORTHOGRAPHIC_CAMERA,
          (-frustumSize * aspect) / 2, // left
          (frustumSize * aspect) / 2, // right
          frustumSize / 2, // top
          -frustumSize / 2, // bottom
          0.1, // near
          10000 // far
        );
        this.cameraManager.setActiveCamera(CameraNames.ORTHOGRAPHIC_CAMERA);
        this.camera = this.cameraManager.getActiveCamera();
        break;

      default:
        this.cameraManager.addPerspectiveCamera(
          CameraNames.PERSPECTIVE_CAMERA,
          75,
          width / height,
          0.1,
          10000
        );
        this.cameraManager.setActiveCamera(CameraNames.PERSPECTIVE_CAMERA);
        this.camera = this.cameraManager.getActiveCamera();
        break;
    }

    // Set initial camera position
    const cameraPosition = { x: 0, y: 0, z: 5 };
    this.camera.position.set(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    );

    // Create renderer
    this.rendererManager = new RendererManager();
    this.assetLoader.setRenderer(this.rendererManager.renderer);
    this.rendererManager.setRendererSize(width, height);
    this.rendererManager.setRendererPixelRatio(
      options.pixelRatio ?? window.devicePixelRatio
    );

    // Setup shadows if enabled
    if (options.enableShadows) {
      this.rendererManager.enableShadowMap();
    }

    // Add renderer to DOM
    this.container.appendChild(this.rendererManager.renderer.domElement);

    const controlType = options.controlType;

    switch (controlType) {
      case ControlTypes.ORBIT:
        this.controlsManager.addControl(
          ControlTypes.ORBIT,
          ControlTypes.ORBIT,
          this.camera,
          this.rendererManager.renderer.domElement
        );
        this.controlsManager.setActiveControl(ControlTypes.ORBIT);
        this.controls = this.controlsManager.getActiveControl();
        break;
      case ControlTypes.TRACKBALL:
        this.controlsManager.addControl(
          ControlTypes.TRACKBALL,
          ControlTypes.TRACKBALL,
          this.camera,
          this.rendererManager.renderer.domElement
        );
        this.controlsManager.setActiveControl(ControlTypes.TRACKBALL);
        this.controls = this.controlsManager.getActiveControl();
        break;
      case ControlTypes.POINTER_LOCK:
        this.controlsManager.addControl(
          ControlTypes.POINTER_LOCK,
          ControlTypes.POINTER_LOCK,
          this.camera,
          this.rendererManager.renderer.domElement
        );
        this.controlsManager.setActiveControl(ControlTypes.POINTER_LOCK);

        this.controls = this.controlsManager.getActiveControl();
        break;
      case ControlTypes.TRANSFORM:
        this.controlsManager.addControl(
          ControlTypes.TRANSFORM,
          ControlTypes.TRANSFORM,
          this.camera,
          this.rendererManager.renderer.domElement
        );
        this.controlsManager.setActiveControl(ControlTypes.TRANSFORM);

        this.controls = this.controlsManager.getActiveControl();
        break;
      default:
        this.controlsManager.addControl(
          ControlTypes.ORBIT,
          ControlTypes.ORBIT,
          this.camera,
          this.rendererManager.renderer.domElement
        );
        this.controlsManager.setActiveControl(ControlTypes.ORBIT);
        this.controls = this.controlsManager.getActiveControl();
        break;
    }

    // navigation cube
    this.viewCubeGizmo = new ViewCubeGizmo(
      this.camera as any,
      this.rendererManager.renderer
    );

    // Setup window resize handler
    this.initResizeObserver();

    // Add default lighting
    this.setupLighting();

    // initialize CollisionSystem
    this.collisionSystem = new CollisionSystem(this.scene);

    // Initialize post-processing pipeline 
    this.postProcessingManager = new PostProcessingManager(
      this.rendererManager.renderer,
      this.scene,
      this.camera
    );

    // for operations on model
    this.modelController = new ModelController(
      this.scene,
      this.camera,
      this.controls,
      this.container,
      this.collisionSystem,
      this.assetLoader
    );

    // Start render loop
    this.defaultLoop = this.animate.bind(this);
    this.rendererManager.renderer.setAnimationLoop(this.defaultLoop);

    this.viewCubeGizmo.addEventListener("change", (event) => {
      if (this.mainModel) {
        const targetModel = ModelController.GetRoomModel(this.scene);
        const center = this.getBoundingBoxCenter(targetModel!);

        this.transitionCameraToQuaternionView(
          this.camera,
          this.controls,
          event.quaternion,
          center
        );
      }
    });
    this.rendererManager.renderer.domElement.addEventListener(DOMEvents.DBLCLICK, (e) =>
      this.onDoubleClick(e)
    );
    this.rendererManager.renderer.domElement.addEventListener(
      DOMEvents.MOUSE_MOVE,
      (e) => this.onMouseMove(e)
    );
    this.rendererManager.renderer.domElement.addEventListener(DOMEvents.CLICK, () =>
      this.onLeftClick()
    );
    this.rendererManager.renderer.domElement.addEventListener(
      DOMEvents.CONTEXTMENU,
      (e) => this.onRightClick(e)
    );
    window.addEventListener(DOMEvents.KEY_DOWN, (e) => this.onRightClick(e));
  
    Events.on(ConfiguratorEventType.MODEL_DRAG_START, this.handleModelPlacementDragStart);
    Events.on(ConfiguratorEventType.MODEL_DRAG_END, this.handleModelPlacementDragEnd);

    this.rendererManager.renderer.domElement.addEventListener(
      DOMEvents.MOUSE_DOWN,
      (e) => this.onPointerDown(e)
    );
    this.rendererManager.renderer.domElement.addEventListener(DOMEvents.MOUSE_UP, (e) =>
      this.onPointerUp(e)
    );

    this.rendererManager.renderer.domElement.addEventListener(DOMEvents.DRAG_OVER, (e) => this.onDragOver(e));

    this.enableKeyboardShortcuts(true);

    this.vrManager = new VRManager(
      this.rendererManager.renderer,
      this.scene,
      this.camera,
      this.viewCubeGizmo,
      () => {
        // Restore default after VR exit
        this.rendererManager.renderer.setAnimationLoop(this.defaultLoop!);
      },
      () => this.restoreAllWalls()
    );

    this.furnitureGroup.name = RequiredStrings.FURNITURE_GROUP;
    this.scene.add(this.furnitureGroup);

  }

  /**
   * On dragging the model for placement, move the preview model to the mouse position
   * @param {Event} e - The drag over event
   */
  private onDragOver=(e : Event)=>{
    this.movePreviewModel(e as MouseEvent);
  }

  /**
   * Handler for MODEL_DRAG_START event emitted when user starts dragging a model for placement
   * @param payload 
   */
  private handleModelPlacementDragStart=(payload : any)=>{
    this.isDraggingForPlacement = true;
   
    const details = payload.item;
    const modelData = {
      category: details.category,
      name: details.name,
      id: details.id,
      price: details.price,
      format: details.format,
    };
    this.loadModel(
        details.path,
        true,
        undefined,
        undefined,
        undefined,
        true,
        modelData
      );

  }

  /**
   * Handler for MODEL_DRAG_END event emitted when user stops dragging a model for placement
   * @param payload
   */
  private handleModelPlacementDragEnd=()=>{
    if(!this.isPreviewOnFloor){
       this.cleanupPreview();
    }
    else{
      this.finnalizeModelPlacement();
    }
    
    this.isDraggingForPlacement = false;
    this.isPreviewDragging = false;
  };


  /**
   * Sets up default lighting for the scene
   *
   * @private
   * @returns {void}
   */
  private setupLighting(): void {
    this.lightsManager.AddLight("Ambient", {
      color: 0xffffff,
      intensity: 0.4,
    });

    this.lightsManager.AddLight("Directional", {
      color: 0xfffaf0,
      intensity: 1.2,
      position: { x: 5, y: 10, z: 7.5 },
      castShadow: true,
      shadow: {
        mapSize: { width: 2048, height: 2048 },
        bias: -0.0005,
        normalBias: 0.05,
        radius: 3,
        camera: {
          left: -100,
          right: 100,
          top: 100,
          bottom: -100,
          near: 0.1,
          far: 200,
        },
      },
    });
  }

  /**
   * Sets up a spot light that follows the camera
   * Changed from DirectionalLight to SpotLight for better lighting control
   *
   * @private
   * @returns {void}
   */
  // @ts-ignore
  private setupCameraLight(): void {
    // Determine a unique ID for the camera light
    const lightId = RequiredStrings.CAMERA_ATTACHED_SPOTLIGHT;

    this.lightsManager.AddLight(
      RequiredStrings.SPOT,
      {
        color: 0xffffff,
        intensity: 13.5,
        decay: 0.3,
      },
      lightId
    );

    // Retrieve the light instance to attach it to the camera
    const light = this.lightsManager.getLight(lightId);

    if (light && light instanceof SpotLight) {
      this.cameraLight = light;

      this.camera.add(this.cameraLight);
      this.cameraLight.position.set(0, 0, 1);

      this.camera.add(this.cameraLight.target);
      this.cameraLight.target.position.set(0, 0, -1);

      this.scene.add(this.camera);
    }
  }

  /**
   * Animation loop.
   *
   * @private
   * @param {number} time - The current timestamp.
   * @returns {void}
   */
  private animate(time: number): void {
    let orbitControls = this.controlsManager.getControl(ControlTypes.ORBIT);
    if (orbitControls && !this.controlsManager.isCameraAnimating) {
      orbitControls.update(0.01)
    }

    // Restrict camera to not go below ground
    if (this.camera.position.y < 0) {
      this.camera.position.y = 0;
    }


    // update model helper
    this.modelController.updateHelper();

    //  update all sprites in measurementGroup to face the camera
    if (this.measurementGroup) {
      this.measurementGroup.children.forEach((child) => {
        if (child instanceof Sprite) {
          child.lookAt(this.camera.position);
        }
      });
    }
    this.rendererManager.renderer.sortObjects = true;

    // render scene
    if (this.vrManager.isInVR) {
      // Standard render in VR post-processing is incompatible with WebXR layers
      this.rendererManager.renderer.render(this.scene, this.camera);
    } else {
      // Photorealistic render via post-processing composer
      if (this.isPostProcessingActive) {
        this.postProcessingManager.render(this.clock.getDelta());
      }
      else {
        this.tweenGroup.update(time);
        this.rendererManager.renderer.render(this.scene, this.camera);
      }
    }

    if (this.updatedProjectJSON) {
      this.tooltipHelper.render();
    }
    if (!this.vrManager.isInVR) {
      if (this.isWallHidingEnabled) {
        for (const check of this.checkCubeVisibilityFns) {
          check(this.camera);
        }
        if (this.wall_hiding_cubes && this.wall_hiding_cubes.length > 0) {
          this.wall_hiding_cubes.forEach((cube: any) => {
            this.raycastToCubeCenter(cube, this.camera);
          });
        }
      }
    }
    this.roomAnnotationManager.update(this.camera);
    this.viewCubeGizmo.update();
  }

  /**
 * Sets the current 3D mode.
 *
 * @param {CurrentMode} mode - The 3D mode to activate.
 * @returns {void}
 */
  public set3DModes(mode: CurrentMode): void {
    this.currentMode = mode;
    Events.emit(ConfiguratorEventType.UNDO_REDO, this.getUndoRedoPayload());

  }

  /**
   * Retrieves the currently active 3D mode.
   *
   * @returns {CurrentMode} The current 3D mode.
   */
  public get3DModes(): CurrentMode {
    return this.currentMode;
  }

  /**
   * Adds a model to the scene
   *
   * @protected
   * @param {Object3D} model - The 3D model to add
   * @param {Vector3} [position] - Optional position for the model
   * @param {Euler} [rotation] - Optional rotation for the model
   * @param {Vector3} [scale] - Optional scale for the model
   * @returns {Object3D} - The added model object
   */
  protected addModel(
    model: Object3D,
    position?: Vector3,
    rotation?: Euler,
    scale?: Vector3
  ): Object3D {
    // Apply transformations if provided
    if (position) {
      model.position.copy(position);
      this.scene.add(model);
    } else {
      const baseModel = ModelController.GetRoomModel(this.scene);
      this.placeModel(model, baseModel);
    }

    if (rotation) {
      model.rotation.copy(rotation);
    }

    if (scale) {
      model.scale.copy(scale);
    }

    this.enableShadowsOnObject(model);

    // Enforce maximum texture sharpness at all viewing angles
    this.applyAnisotropicFiltering(model);

    // Only adjust camera if this is the base model
    if (model.name === RequiredStrings.ROOM_MODEL) {
      const box = new Box3().setFromObject(model);
      const center = new Vector3();

      box.getCenter(center);

      // update controls target (Orbit / Trackball)
      if ((this.controls as any)?.target) {
        (this.controls as any).target.copy(center);
      }

      // Adjust camera based on active camera type
      if (this.camera instanceof PerspectiveCamera) {
        this.adjustPerspectiveCamera(this.camera, model);
      } else if (this.camera instanceof OrthographicCamera) {
        this.adjustOrthographicCamera(this.camera, model);
      }

      if (this.controls) {
        if (this.controls instanceof PointerLockControls) {
          this.controls.update(this.clock.getDelta());
        } else {
          (this.controls as any).update?.();
        }
      }

      // for room configurator (for the room model to dynamically show/hide the walls based on camera position)
      const boxNames = ["Box", "BoxFront", "BoxBack", "BoxLeft", "BoxRight"];
      let roomModel = ModelController.GetRoomModel(this.scene);

      if (roomModel) {
        for (const name of boxNames) {
          const cube = model.getObjectByName(name) as Mesh;
          if (cube) {
            const checker = this.createWallVisibilityChecker(cube, model);
            this.checkCubeVisibilityFns.push(checker);
          }
        }
      }
    }
    return model;
  }

  /**
   * Calculates the target coordinates for a model relative to a base model and places it.
   *
   * @private
   * @param {Object3D} model - The model to place.
   * @param {Object3D | null} baseModel - The reference base model.
   * @returns {void}
   */
  private placeModel(model: Object3D, baseModel: Object3D | null): void {
    let targetX = 0;
    let targetZ = 0;

    if (baseModel) {
      const floorMeshes: Object3D[] = [];
      baseModel.traverse((child) => {
        if (child instanceof Mesh && ((child as any).isFloor || child.name.toLowerCase().includes(FloorNames.FLOOR))) {
          floorMeshes.push(child);
        }
      });

      if (floorMeshes.length > 0) {
        const floorBox = new Box3();
        floorMeshes.forEach((mesh) => {
          floorBox.expandByObject(mesh);
        });
        const floorCenter = new Vector3();
        floorBox.getCenter(floorCenter);
        targetX = floorCenter.x;
        targetZ = floorCenter.z;
      } else {
        const roomBox = new Box3().setFromObject(baseModel);
        const roomCenter = new Vector3();
        roomBox.getCenter(roomCenter);
        targetX = roomCenter.x;
        targetZ = roomCenter.z;
      }
    }

    model.position.setX(targetX);
    model.position.setZ(targetZ);
    this.placeModelOnGround(model);
    model.visible = true;
    this.scene.add(model);
  }

  /**
   * Retrieves the URI for a specific part variant of a target mesh.
   * Looks up the part variant by ID within the updated project JSON structure.
   *
   * @private
   * @param {string} targetPartId - The ID of the target part.
   * @param {string} partVariantId - The ID of the part variant.
   * @returns {string | undefined} - The URI of the part variant, or `undefined` if not found.
   */
  private getPartVariantUri(
    targetPartId: string,
    partVariantId: string
  ): string | undefined {
    const option = this.updatedProjectJSON[targetPartId];
    if (!option) return undefined;

    const part = option.partVariants.find((p) => p.id === partVariantId);
    return part?.uri;
  }

  /**
   * Retrieves the URI (image) for a specific texture of a target mesh.
   * Looks up the texture by ID within the updated project JSON structure.
   *
   * @private
   * @param {string} targetPartId - The ID of the target part.
   * @param {string} textureId - The ID of the texture.
   * @returns {string | undefined} - The URI of the texture image, or `undefined` if not found.
   */
  private getTextureUri(
    targetPartId: string,
    textureId: string
  ): string | undefined {
    const option = this.updatedProjectJSON[targetPartId];
    if (!option) return undefined;

    const part = option.textureOptions.find((t) => t.id === textureId);
    return part?.previewImage;
  }

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
  private getMaterialProperties(
    targetPartId: string,
    materialId: string
  ):
    | {
      color?: string | number;
      metalness?: number;
      roughness?: number;
      side?: Side;
      texture?: string;
    }
    | undefined {
    const option = this.updatedProjectJSON[targetPartId];
    if (!option) return undefined;

    const material = option.materialOptions.find((m) => m.id === materialId);
    if (!material) return undefined;

    let side: Side | undefined;
    if (material.side !== undefined) {
      const sideMap = new Map<string | number, Side>([
        [0, FrontSide],
        [1, BackSide],
        [2, DoubleSide],
        ["0", FrontSide],
        ["1", BackSide],
        ["2", DoubleSide],
        ["FrontSide", FrontSide],
        ["BackSide", BackSide],
        ["DoubleSide", DoubleSide],
        ["front", FrontSide],
        ["back", BackSide],
        ["both", DoubleSide],
      ]);

      side = sideMap.get(material.side);
    }

    return {
      color: material.color,
      metalness: material.metalness,
      roughness: material.roughness,
      side,
      texture: material.texture,
    };
  }

  /**
   * Returns the container element from the given options.
   * If `options.container` is a string, it queries the DOM for the element.
   * If it's already an HTMLElement, it returns it directly.
   *
   * @private
   * @param {ConfiguratorOptions} options - Options containing the container.
   * @returns {HTMLElement} - The container element.
   */
  private getContainer(options: ConfiguratorOptions): HTMLElement {
    if (typeof options.container === "string") {
      const element = document.querySelector(options.container);
      if (!element) {
        throw new Error(`Container element "${options.container}" not found`);
      }
      return element as HTMLElement;
    } else {
      return options.container;
    }
  }

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
  private transitionCameraToQuaternionView(
    camera: Camera,
    controls: any,
    targetQuaternion: Quaternion,
    modelCenter: Vector3,
    duration: number = 1000
  ) {

    const targetModel = ModelController.GetRoomModel(this.scene);
    if (!targetModel) return;

    const bbox = new Box3().setFromObject(targetModel);
    const center = new Vector3();
    bbox.getCenter(center);

    const orbitControl = this.controlsManager.getControl(ControlTypes.ORBIT) as any;
    const effectiveControls = orbitControl || controls;

    const size = new Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    //Orthographic camera handling
    if ((camera as any).isOrthographicCamera) {

      const orthoCamera = camera as OrthographicCamera;

      const distance = camera.position.distanceTo(modelCenter);

      // viewDir tells the program which direction the camera should come from to show the selected ViewCube face.
      const viewDir = new Vector3(0, 0, -1)
        .applyQuaternion(targetQuaternion)
        .normalize();

      //This places the camera distance away from the model
      const endPos = modelCenter.clone().add(
        viewDir.clone().multiplyScalar(-distance)
      );

      const startPos = orthoCamera.position.clone();
      const startTarget = effectiveControls?.target?.clone() || modelCenter.clone();

      // the vector from the target to the camera at the start of the animation.
      const startOffset = startPos.clone().sub(startTarget);
      const startSpherical = new Spherical().setFromVector3(startOffset);

      // the vector from the target to the camera at the end of the animation.
      const endOffset = endPos.clone().sub(modelCenter);
      const endSpherical = new Spherical().setFromVector3(endOffset);

      const startTime = performance.now();

      // This prevents the user from interfering while the camera is moving.
      const wasControlsEnabled = controls?.enabled;
      if (controls) controls.enabled = false;

      const animate = () => {

        const now = performance.now();
        const elapsed = now - startTime;
        // progress from 0 → 1
        const t = Math.min(elapsed / duration, 1);

        //This creates a smooth animation curve Instead of moving at constant speed: start slow, move faster, end slow
        const ease = t * t * (3 - 2 * t);

        const currentRadius = MathUtils.lerp(startSpherical.radius, endSpherical.radius, ease);
        const currentPhi = MathUtils.lerp(startSpherical.phi, endSpherical.phi, ease);
        const currentTheta = MathUtils.lerp(startSpherical.theta, endSpherical.theta, ease);

        // This represents where the camera should be at this frame.
        const currentSpherical = new Spherical(
          currentRadius,
          currentPhi,
          currentTheta
        );

        // If the camera was looking somewhere else before, this gradually moves the OrbitControls target to the model center.
        const newTarget = startTarget.clone().lerp(modelCenter, ease);

        // This converts the spherical coordinates back into a 3D position in the scene.
        const newPos = new Vector3()
          .setFromSpherical(currentSpherical)
          .add(newTarget);

        orthoCamera.position.copy(newPos);

        if (effectiveControls && effectiveControls.target) {
          effectiveControls.target.copy(newTarget);
          effectiveControls.update();
        }

        orthoCamera.lookAt(newTarget);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {

          if (effectiveControls && effectiveControls.target) {
            effectiveControls.target.copy(modelCenter);
            effectiveControls.update();
          }

          orthoCamera.updateProjectionMatrix();

          if (controls) {
            controls.enabled = wasControlsEnabled;
            if (controls !== effectiveControls) {
              (controls as any).update?.();
            }
          }
        }
      };

      animate();
      return;
    }

    // Perspective camera handling
    const startQuat = camera.quaternion.clone();
    const startPos = camera.position.clone();
    const startTarget = effectiveControls?.target?.clone() || modelCenter.clone();

    const fovRad = (camera as PerspectiveCamera).fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fovRad / 2)) * 1.5;

    const viewDir = new Vector3(0, 0, -1)
      .applyQuaternion(targetQuaternion)
      .normalize();

    const endPos = modelCenter
      .clone()
      .add(viewDir.clone().multiplyScalar(-distance));

    const angleDiff = startQuat.angleTo(targetQuaternion);
    const posDiff = startPos.distanceTo(endPos);
    const targetDiff = startTarget.distanceTo(modelCenter);
    if (angleDiff < 0.01 && posDiff < 0.01 && targetDiff < 0.01) return;

    const startTime = performance.now();

    const startOffset = camera.position.clone().sub(startTarget);
    const startSpherical = new Spherical().setFromVector3(startOffset);

    const endOffset = endPos.clone().sub(modelCenter);
    const endSpherical = new Spherical().setFromVector3(endOffset);

    const wasControlsEnabled = controls?.enabled;
    if (controls) controls.enabled = false;

    const animate = () => {

      const now = performance.now();
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = t * t * (3 - 2 * t);

      const currentRadius = MathUtils.lerp(startSpherical.radius, endSpherical.radius, ease);
      const currentPhi = MathUtils.lerp(startSpherical.phi, endSpherical.phi, ease);
      const currentTheta = MathUtils.lerp(startSpherical.theta, endSpherical.theta, ease);

      const currentSpherical = new Spherical(currentRadius, currentPhi, currentTheta);

      const newPos = new Vector3().setFromSpherical(currentSpherical).add(
        startTarget.clone().lerp(modelCenter, ease)
      );

      camera.position.copy(newPos);

      if (effectiveControls && effectiveControls.target) {
        effectiveControls.target.lerpVectors(startTarget, modelCenter, ease);
        effectiveControls.update();
      }

      camera.lookAt(effectiveControls?.target || modelCenter);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {

        if (effectiveControls && effectiveControls.target) {
          effectiveControls.target.copy(modelCenter);
          effectiveControls.update();
        }

        if (controls) {
          controls.enabled = wasControlsEnabled;
          if (controls !== effectiveControls) {
            (controls as any).update?.();
          }
        }
      }
    };

    animate();
  }

  /**
   * Returns the center of the bounding box of a given Object3D.
   *
   * @private
   * @param {Object3D} object - The THREE.Object3D whose bounding box center is to be computed.
   * @returns {Vector3} - A THREE.Vector3 representing the center of the bounding box.
   */
  private getBoundingBoxCenter(object: Object3D): Vector3 {
    const box = new Box3().setFromObject(object);
    const center = new Vector3();
    box.getCenter(center);
    return center;
  }

  /**
   * Loads the initial model defined in the project configuration.
   *
   * @private
   * @param {ModelLoadCallbacks} [callbacks] - Optional callbacks for model load events.
   * @returns {Promise<Promise<void>>} - - Resolves once the model is loaded.
   */
  private async loadInitialModel(
    callbacks?: ModelLoadCallbacks
  ): Promise<void> {
    if (this.projectJSON.baseModel.format === "glb") {
      let baseModel = this.projectJSON.baseModel;
      await this.loadModel(
        baseModel.url,
        false,
        undefined,
        undefined,
        callbacks,
        false,
        undefined
      );
    }
  }

  /**
   * Saves current camera position and control target for later restoration.
   * This method is called before switching controls to preserve the user's current view.
   * For controls that don't expose a `.target` (e.g., PointerLockControls),
   * the model's bounding box center is used as a fallback target.
   *
   * @private
   * @returns {void}
   */
  private saveCameraState(): void {
    this.savedCameraState = {
      position: this.camera.position.clone(),
      target:
        (this.controls as any)?.target?.clone?.() ??
        this.getBoundingBoxCenter(this.mainModel),
      frustum:
        this.camera instanceof OrthographicCamera
          ? {
            left: this.camera.left,
            right: this.camera.right,
            top: this.camera.top,
            bottom: this.camera.bottom,
            near: this.camera.near,
            far: this.camera.far,
          }
          : undefined,
    };
  }

  /**
   * Restores previously saved camera position and control target.
   * After switching controls, this ensures the camera returns to the last known view,
   * maintaining visual consistency. Only applicable for controls that support a `.target`.
   *
   * @private
   * @returns {void}
   */
  private restoreCameraState(): void {
    if (!this.savedCameraState) return;

    this.camera.position.copy(this.savedCameraState.position);

    if (this.camera instanceof PerspectiveCamera) {
      // For PerspectiveCamera, just update projection matrix
      this.camera.updateProjectionMatrix();
    } else if (
      this.camera instanceof OrthographicCamera &&
      this.savedCameraState.frustum
    ) {
      // For OrthographicCamera, restore frustum properties
      const f = this.savedCameraState.frustum;
      this.camera.left = f.left;
      this.camera.right = f.right;
      this.camera.top = f.top;
      this.camera.bottom = f.bottom;
      this.camera.near = f.near;
      this.camera.far = f.far;
      this.camera.updateProjectionMatrix();
    }

    // Restore controls target if it exists
    if ("target" in this.controls && this.controls.target) {
      (this.controls as any).target.copy(this.savedCameraState.target);
      this.controls.update?.();
    }
  }

  /**
   * Initializes a ResizeObserver to handle container resizing.
   *
   * @private
   * @returns {void}
   */
  private initResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });

    this.resizeObserver.observe(this.container);
  }

  /**
   * Creates a checker function that will test if any of the 8 rays from the camera
   * to the cube corners hits the cube first. If so, it hides the cube's parent.
   *
   * @private
   * @param {Mesh} cube - The target cube mesh (must be in the scene).
   * @param {Object3D} model - The root model object.
   * @returns {any} - A function to call each frame with the camera.
   */
  private createWallVisibilityChecker(cube: Mesh, model: Object3D) {
    const raycaster = new Raycaster();
    raycaster.camera = this.camera; // required — Sprite.raycast() needs this or it throws
    const direction = new Vector3();

    const cubeCorners: Vector3[] = [];

    // Precompute cube corners in world space (cube is static)
    const halfSize = 0.5;
    const offsets = [
      new Vector3(-halfSize, -halfSize, -halfSize),
      new Vector3(halfSize, -halfSize, -halfSize),
      new Vector3(-halfSize, halfSize, -halfSize),
      new Vector3(halfSize, halfSize, -halfSize),
      new Vector3(-halfSize, -halfSize, halfSize),
      new Vector3(halfSize, -halfSize, halfSize),
      new Vector3(-halfSize, halfSize, halfSize),
      new Vector3(halfSize, halfSize, halfSize),
    ];

    cube.updateMatrixWorld(true);
    for (const offset of offsets) {
      const scaled = offset.clone().multiply(cube.scale);
      const worldCorner = scaled.applyMatrix4(cube.matrixWorld);
      cubeCorners.push(worldCorner);
    }

    // Helper cube: Set to transparent with 0 opacity so it's invisible but stil interactable/detectable
    if (cube.material instanceof Material) {
      cube.material.transparent = true;
      cube.material.opacity = 0;
    }

    const checkCubeVisibility = (camera: Camera) => {
      let cubeWasFirstHit = false;

      for (const corner of cubeCorners) {
        direction.subVectors(corner, camera.position).normalize();
        raycaster.set(camera.position, direction);

        const intersects = raycaster.intersectObjects(
          [model],
          true
        );

        if (intersects.length > 0) {
          const firstHit = intersects[0].object;
          if (firstHit === cube || firstHit.id === cube.id) {
            cubeWasFirstHit = true;
            break;
          }
        }
      }

      if (cube.parent) {
        cube.parent.visible = !cubeWasFirstHit;
      }
    };

    return checkCubeVisibility;
  }


  /**
   * Restores all room walls to full visibility.
   * Handles both GLB room model walls (Box/BoxFront/etc.) and 2D-to-3D
   * generated walls (boundary_cube) registered in wall_hiding_cubes.
   *
   * @private
   * @returns {void}
   */
  private restoreAllWalls() {
    const room = ModelController.GetRoomModel(this.scene);

    if (room) {
      const boxNames = ["Box", "BoxFront", "BoxBack", "BoxLeft", "BoxRight"];
      for (const box of boxNames) {
        const cube = room.getObjectByName(box);
        if (!cube || !cube.parent) continue;

        // Restore the entire parent wall object
        cube.parent.visible = true;
        cube.parent.traverse((child) => {
          child.visible = true;
        });
      }
    }

    // boundary_cube meshes restore their parent wall groups.
    this.wall_hiding_cubes.forEach((cube) => {
      if (!cube.parent) return;

      cube.parent.visible = true;

      // Restore wall mesh materials (but keep the helper cube itself invisible)
      cube.parent.traverse((child) => {
        child.visible = true;
      });
    });
  }

  /**
   * Handles model selection via mouse click.
   *
   * @private
   * @param {any} event - The mouse click event used for raycasting.
   * @returns {void}
   */
  private selectModelOnClick = (event: any) => {

    // Check if the click is within the ViewCube's interactive area.
    const rect = this.container.getBoundingClientRect();
    const x = event.offsetX;
    const y = event.offsetY;

    const viewCubeSize = 150;
    const isViewCubeClick = x > rect.width - viewCubeSize && y < viewCubeSize;

    if (isViewCubeClick) {
      return;
    }
    this.mouseForSelection.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseForSelection.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Set ray from camera through mouse position
    this.raycasterForSelection.setFromCamera(
      this.mouseForSelection,
      this.camera
    );

    const selectableObjects: Object3D[] = [];
    this.scene.traverse((child) => {
      if ((child as any).userData?.selectable === SelectableState.TRUE && child.parent?.name !== RequiredStrings.FURNITURE_GROUP) {
        selectableObjects.push(child);
      }
    });

    const allIntersects = this.raycasterForSelection.intersectObjects(
      selectableObjects,
      true
    );

    const isCtrlClick = event.ctrlKey;
    const isCmdClick = event.metaKey;

    if (isCtrlClick || isCmdClick) {
      // Filter out the currently selected model and all its descendants so we can
      // directly click a neighbouring model that is placed very close to it.
      const currentRoot = this.modelRoot;
      const intersects = currentRoot
        ? allIntersects.filter((hit) => {
          let obj: any = hit.object;
          // Walk up the hierarchy – if any ancestor IS the current root, skip this hit
          while (obj) {
            if (obj === currentRoot) return false;
            obj = obj.parent;
          }
          return true;
        })
        : allIntersects;

      if (intersects.length > 0) {
        const selectableObject = this.findSelectableParent(intersects[0].object);
        if (selectableObject) {

          // Do not allow multi-select if the clicked object or currently selected model is part of a Group
          if (this.isObjectInGroup(selectableObject) || this.isObjectInGroup(this.modelRoot)) {
            return;
          }

          if (this.modelRoot && this.modelRoot.name !== RequiredStrings.FURNITURE_GROUP) {
            this.furnitureGroup.attach(this.modelRoot);
          }

          const combinedBox = new Box3();
          combinedBox.setFromObject(this.furnitureGroup);
          const selectableBox = new Box3().setFromObject(selectableObject);
          combinedBox.union(selectableBox);
          const center = new Vector3();
          combinedBox.getCenter(center);

          const furnitureGroupchildren = [...this.furnitureGroup.children];
          furnitureGroupchildren.forEach((child) => {
            this.scene.attach(child);
          })
          this.furnitureGroup.position.set(0, 0, 0);
          this.furnitureGroup.quaternion.identity();
          this.furnitureGroup.updateMatrixWorld(true);

          this.furnitureGroup.position.set(center.x, 0, center.z)
          furnitureGroupchildren.forEach((child) => {
            this.furnitureGroup.attach(child);
          });

          this.furnitureGroup.attach(selectableObject);

          this.modelRoot = this.furnitureGroup;
          this.modelController.addBoundingBoxHelper(
            this.modelRoot as Object3D,
            "select"
          );
          this.switchControlMode(ControlTypes.TRANSFORM);

          const currentMode = this.controlsManager.getCurrentTransformMode();
          this.setTransformMode(currentMode);

          this.setTransformControlsAxes(currentMode);

          if (this.isShowAllMeasurementsActive) {
            this.showAllMeasurements();
          } else if (this.isMeasurementActive) {
            this.toggleMeasurement(); //update distance while translating
          }

          const selectedMetadata = this.getModelMetadata();
          //pass selected object metaData using emmiter
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
          return;

        }
      }
      return;
    }
    else {
      const children = [...this.furnitureGroup.children];
      children.forEach(child => {
        this.scene.attach(child);
      });
      this.furnitureGroup.position.set(0, 0, 0);
      this.furnitureGroup.quaternion.identity();
      this.furnitureGroup.updateMatrixWorld(true);

      const spriteTargets: Sprite[] = [];
      this.measurementGroup?.traverse((child) => {
        if (child instanceof Sprite) spriteTargets.push(child);
      });

      const hitSprites = this.raycasterForSelection.intersectObjects(
        spriteTargets,
        true
      );
      //If raycast hit to sprite then return do not select/deselect the model
      if (hitSprites.length > 0) {
        return;
      }

      // Filter out the currently selected model and all its descendants so we can
      // directly click a neighbouring model that is placed very close to it.
      const currentRoot = this.modelRoot;
      const intersects = currentRoot
        ? allIntersects.filter((hit) => {
          let obj: any = hit.object;
          // Walk up the hierarchy if any ancestor IS the current root, skip this hit
          while (obj) {
            if (obj === currentRoot) return false;
            obj = obj.parent;
          }
          return true;
        })
        : allIntersects;

      if (intersects.length > 0) {
        const selectableObject = this.findSelectableParent(intersects[0].object);
        if (selectableObject) {
          this.modelRoot = selectableObject;
          this.switchControlMode(ControlTypes.TRANSFORM);

          const currentMode = this.controlsManager.getCurrentTransformMode();
          this.setTransformMode(currentMode);

          this.setTransformControlsAxes(currentMode);

          if (this.isShowAllMeasurementsActive) {
            this.showAllMeasurements();
          } else if (this.isMeasurementActive) {
            this.toggleMeasurement();
          }

          const selectedMetadata = this.getModelMetadata();
          //pass selected object metaData using emmiter
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
          return;
        }
      } else {
        let controls = this.controlsManager.getActiveControl();
        if (controls instanceof TransformControls) {
          controls.detach();
          let TControlsHelper = this.scene.getObjectByName(
            RequiredStrings.TRANSFORM_CONTROLS_GIZMO_HELPER
          );
          if (TControlsHelper) {
            TControlsHelper.visible = false;
          }
        }
        this.modelController.removeBoundingBoxHelper();
        this.modelRoot = null;
        Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);
      }
    }
  };

  /**
   * Traverses upwards through the hierarchy to find the nearest parent
   * marked as selectable.
   *
   * @private
   * @param {Object3D} object - The object from which to begin the search.
   * @returns {Object3D | null} - The first selectable parent object, or `null` if none is found.
   */
  private findSelectableParent(object: Object3D): Object3D | null {
    let current: Object3D | null = object;
    while (current) {
      if (current.userData?.selectable === SelectableState.TRUE) return current;
      current = current.parent;
    }
    return null;
  }

  /**
   * Checks if an object or any of its ancestors is part of a permanent Group.
   *
   * @param object The object to check.
   * @returns true if the object or its parent/ancestor is a group.
   */
  private isObjectInGroup(object: Object3D | null): boolean {
    let current: Object3D | null = object;
    while (current && current.name !== RequiredStrings.ROOM_MODEL && current.type !== RequiredStrings.SCENE) {
      if (current.userData?.isGroup === true || (current.parent && current.parent.userData?.isGroup === true)) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /**
   * Attaches TransformControls to the current model if active
   *
   * @protected
   * @returns {void}
   */
  protected checkTransform() {
    const activeControl = this.controlsManager.getActiveControl();
    if (!(activeControl instanceof TransformControls)) return;
    this.controlsManager.attachTransformTarget(this.modelRoot!);
    const orbit = this.controlsManager["controlsMap"].get(
      ControlTypes.ORBIT
    ) as OrbitControls;
    // Re-enable orbit when dragging ends
    activeControl.addEventListener("dragging-changed", (event) => {
      orbit.enabled = !event.value;
    });
  }
  /**
   *  Handles double-click events to detect and activate editing for a measurement sprite.
   * @param event - Mouse double-click event.
   */
  // private onDoubleClick(event: MouseEvent) {
  //   if (!this.isMeasurementActive) return;

  //   const dom = this.rendererManager.renderer.domElement;
  //   const rect = dom.getBoundingClientRect();
  //   const mouse = new Vector2();
  //   mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  //   mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  //   const raycaster = new Raycaster();
  //   raycaster.setFromCamera(mouse, this.camera);

  //   // Collect only Sprite objects from measurementGroup
  //   const spriteTargets: Sprite[] = [];
  //   this.measurementGroup?.traverse((child) => {
  //     if (child instanceof Sprite) {
  //       spriteTargets.push(child);
  //     }
  //   });
  //   const intersects = raycaster.intersectObjects(spriteTargets, true);

  //   if (intersects.length > 0) {
  //     const clickedSprite = intersects[0].object as Sprite;

  //     if (clickedSprite) {
  //       this.enableSpriteEditing(clickedSprite);
  //     }
  //   }
  // }

  /**
   * Aligns an HTML input element over the given 3D sprite.
   * @param input - Input element to position.
   * @param sprite - Target sprite to align over.
   */
  // private positionInputOverSprite(input: HTMLInputElement, sprite: Sprite) {
  //   const dom = this.rendererManager.renderer?.domElement;
  //   const rect = dom.getBoundingClientRect();

  //   const worldPosition = new Vector3();
  //   sprite.getWorldPosition(worldPosition);
  //   worldPosition.project(this.camera); //converts the 3D world coordinate into 2D

  //   // Convert to screen coordinates relative to canvas (2D to pixel)
  //   const x = (worldPosition.x * 0.5 + 0.5) * rect.width + rect.left;
  //   const y = (-(worldPosition.y * 0.5) + 0.5) * rect.height + rect.top;

  //   input.style.left = `${x - input.offsetWidth / 2}px`;
  //   input.style.top = `${y - input.offsetHeight / 2}px`;
  // }
  /**
   * Enables inline editing of a measurement sprite’s value.
   * @param sprite - Sprite to edit.
   */
  // private enableSpriteEditing(sprite: Sprite) {
  //   //  If another input is already active, restore that sprite and remove input
  //   if (this.activeInput) {
  //     if (this.activeSprite) this.activeSprite.visible = true;
  //     document.body.removeChild(this.activeInput);
  //     this.activeInput = null;
  //     this.activeSprite = null;
  //   }

  //   const input = document.createElement("input");
  //   input.type = "text";
  //   input.style.position = "absolute";
  //   input.style.padding = "2px";
  //   input.style.fontSize = "14px";
  //   input.style.background = "#fff";
  //   input.style.border = "1px solid #000";
  //   input.style.zIndex = "1000";
  //   input.style.width = "90px";

  //   input.value = sprite.userData.text || "";

  //   sprite.visible = false;

  //   requestAnimationFrame(() => {
  //     document.body.appendChild(input);
  //   });
  //   this.positionInputOverSprite(input, sprite);

  //   this.activeInput = input;
  //   this.activeSprite = sprite;
  //   input.focus();
  //   let editingFinished = false;
  //   let animationFrameId: number;

  //   const updatePosition = () => {
  //     if (!editingFinished) {
  //       this.positionInputOverSprite(input, sprite);
  //       animationFrameId = requestAnimationFrame(updatePosition);
  //     }
  //   };

  //   // Start following sprite while camera moves
  //   updatePosition();

  //   const finishEdit = () => {
  //     if (editingFinished) return;
  //     editingFinished = true;

  //     const newValue = parseFloat(input.value);
  //     const oldValue = parseFloat(sprite.userData.distance);
  //     const direction = sprite.userData.direction?.clone();
  //     if (!this.modelRoot) return;

  //     if (!isNaN(newValue) && !isNaN(oldValue) && direction) {
  //       direction.normalize();

  //       const safePosition = this.modelRoot!.position.clone();
  //       const safeRotation = this.modelRoot!.quaternion.clone();

  //       //distance changed
  //       const delta = newValue - oldValue;

  //       // Move model in opposite direction of wall if distance decreases and in same direction if distance increases
  //       const moveVector = direction.clone().multiplyScalar(-delta);

  //       this.modelRoot?.updateMatrixWorld(true);
  //       if (this.modelController.currentBoxHelper) {
  //         this.modelController.currentBoxHelper?.position.add(moveVector);
  //         this.modelController.updateHelper();
  //       }

  //       const collisionDetected = this.modelController.checkModelCollision(
  //         this.modelRoot as Object3D,
  //         safePosition,
  //         safeRotation
  //       );

  //       if (collisionDetected) {
  //         if (this.modelController.currentBoxHelper) {
  //           this.modelController.currentBoxHelper.position.copy(
  //             this.modelRoot!.position
  //           );
  //           this.modelController.updateHelper();
  //         }

  //         //  Emit collision event to frontend
  //         Events.emit(ConfiguratorEventType.COLLISION, {
  //           message: "Collision detected",
  //         });
  //       }

  //       // update the sprite’s displayed value
  //       this.updateSpriteText(sprite, `${newValue.toFixed(2)} units`);

  //       sprite.userData.distance = newValue;
  //     }

  //     sprite.visible = true;

  //     cancelAnimationFrame(animationFrameId);
  //     if (document.body.contains(input)) {
  //       document.body.removeChild(input);
  //     }

  //     this.activeInput = null;
  //     this.activeSprite = null;

  //     // re-calculate measurements for all directions
  //     this.toggleMeasurement();
  //   };

  //   input.addEventListener("keydown", (e) => {
  //     if (e.key === "Enter") {
  //       finishEdit();
  //     }
  //   });
  // }
  /**
   * Updates the given sprite value with new value.
   * @param sprite - Target sprite to update.
   * @param newText - Text to display on the sprite.
   */
  // private updateSpriteText(sprite: Sprite, newText: string) {
  //   const canvas = document.createElement("canvas");
  //   const size = 256;
  //   canvas.width = canvas.height = size;
  //   const ctx = canvas.getContext("2d")!;

  //   ctx.clearRect(0, 0, size, size);
  //   ctx.fillStyle = "blue";
  //   ctx.font = "bold 48px Arial";
  //   ctx.textAlign = "center";
  //   ctx.textBaseline = "middle";
  //   ctx.fillText(newText, size / 2, size / 2);

  //   const texture = new CanvasTexture(canvas);
  //   texture.needsUpdate = true;

  //   const material = sprite.material as SpriteMaterial;
  //   if (material.map) material.map.dispose();
  //   material.map = texture;
  //   material.needsUpdate = true;
  // }
  /**
   * Creates and returns a new text sprite.
   *
   * @protected
   * @param {string} text - Text to display on the sprite.
   * @returns {Sprite} - A Sprite displaying the given text.
   */
  protected createTextSprite(text: string): Sprite {
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "blue";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const sprite = new Sprite(material);
    sprite.scale.set(1, 1, 1);

    return sprite;
  }

  /**
   * Draws a measurement line with arrows and a label between two points.
   *
   * @protected
   * @param {Vector3} startPoint - Starting point of the measurement.
   * @param {Vector3} endPoint - Ending point of the measurement.
   * @param {Vector3} direction - Direction vector of the measurement.
   * @param {number} distance - Calculated distance between start and end.
   * @returns {void}
   */
  protected drawMeasurementLine(
    startPoint: Vector3,
    endPoint: Vector3,
    direction: Vector3,
    distance: number
  ) {
    const geometry = new LineGeometry();
    geometry.setPositions([
      startPoint.x,
      startPoint.y,
      startPoint.z,
      endPoint.x,
      endPoint.y,
      endPoint.z,
    ]);
    const material = new LineMaterial({
      color: 0x000000,
      linewidth: 1,
      resolution: new Vector2(
        this.container.clientWidth,
        this.container.clientHeight
      ),
    });
    const line = new Line2(geometry, material);
    line.computeLineDistances();
    this.measurementGroup?.add(line);

    const arrowColor = 0x000000;
    const headLength = 0.1;
    const headWidth = headLength * 0.7;

    const startArrow = new ArrowHelper(
      direction.clone().negate().normalize(),
      startPoint,
      0,
      arrowColor,
      headLength,
      headWidth
    );
    const endArrow = new ArrowHelper(
      direction.clone().normalize(),
      endPoint,
      0,
      arrowColor,
      headLength,
      headWidth
    );
    this.measurementGroup?.add(startArrow);
    this.measurementGroup?.add(endArrow);

    const distanceInCm = distance * 100;

    const formattedDistance = LengthUnitConverter.formatLengthFromCentimeters( distanceInCm, LengthUnitConverter.currentUnit, 2);
    const labelSprite = this.createTextSprite(formattedDistance);

    labelSprite.userData.text = formattedDistance;
    //for object to move to new position after updating distance
    labelSprite.userData.direction = direction.clone().normalize();
    labelSprite.userData.distance = distance;

    // Position the label at the midpoint
    const mid = new Vector3()
      .addVectors(startPoint, endPoint)
      .multiplyScalar(0.5);
    mid.y += 0.05;
    labelSprite.position.copy(mid);

    this.measurementGroup?.add(labelSprite);
  }

  /**
   * Draws directional distance measurements for the given collider.
   *
   * @private
   * @param {Object3D} collider - The collider to measure from.
   * @param {boolean} [isWallsOnly] - Whether to measure only to wall objects.
   * @returns {void}
   */
  private drawMeasurementForCollider(collider: Object3D, isWallsOnly: boolean = false) {
    const raycaster = new Raycaster();
    raycaster.camera = this.camera; // required — Sprite.raycast() needs this or it throws
    const box = new Box3().setFromObject(collider, true);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);

    const directions = [
      { dir: new Vector3(1, 0, 0), offset: size.x / 2 },
      { dir: new Vector3(-1, 0, 0), offset: size.x / 2 },
      { dir: new Vector3(0, 0, 1), offset: size.z / 2 },
      { dir: new Vector3(0, 0, -1), offset: size.z / 2 },
    ];

    const raycastTargets: Object3D[] = [];

    const roomModel = ModelController.GetRoomModel(this.scene);
    if (roomModel) raycastTargets.push(roomModel);

    //for object to object distance measurement
    if (!isWallsOnly) {
      this.modelController.placedModels.forEach((c) => {
        if (c !== collider) {
          raycastTargets.push(c);
        }
      });
    }

    // Measure distance from each face of the collider box
    directions.forEach(({ dir, offset }) => {
      const startPoint = center.clone().add(dir.clone().multiplyScalar(offset));

      raycaster.set(startPoint, dir.normalize());
      const hits = raycaster.intersectObjects(raycastTargets, true);
      const validHits = hits.filter(h => (h.object as any).isMesh);

      if (validHits.length > 0) {
        const hit = validHits[0];
        const hitPoint = hit.point;
        const distance = startPoint.distanceTo(hitPoint);

        this.drawMeasurementLine(startPoint, hitPoint, dir, distance);
      }
    });
  }

  /**
   * Handles interactive preview placement mode for the model.
   * Creates a temporary wireframe clone that follows the mouse cursor,
   * checks for collisions, and places the actual model on click.
   * Right-click cancels the preview mode.
   *
   * @protected
   * @param {Object3D | null} baseModel - The reference base model used for raycasting and placement alignment.
   * @returns {Promise<Promise<void>>} - Promise<void>
   */
  protected async handlePreviewMode(baseModel: Object3D | null): Promise<void> {
    // Check if another preview is already active or a wireframe exists
    if (this.isPreviewActive || this.previewModel) {
      this.cleanupPreview();
    }

    if (!this.modelRoot) return;
    let active = this.controlsManager.getActiveControl();
    if (active instanceof TransformControls) {
      active.detach();
    }

    this.modelController.removeBoundingBoxHelper();
    this.isPreviewActive = true;
    this.basePreviewModel = baseModel;
    this.prevSelectionState = this.selectionEnabled;
    this.selectionEnabled = false;

    const previewModel = this.modelRoot.clone(true);
    previewModel.traverse((child: any) => {
      if (child.isMesh) {
        // Clone materials to avoid affecting the original model
        const applyTransparency = (material: any) => {
          const mat = material.clone();
          mat.transparent = true;
          mat.opacity = 0.6;
          return mat;
        };

        if (Array.isArray(child.material)) {
          child.material = child.material.map(applyTransparency);
        } else if (child.material) {
          child.material = applyTransparency(child.material);
        }

        child.userData.previewMaterial = child.material;
      }
    });

    this.placeModel(previewModel, baseModel);
    this.previewModel = previewModel;

  // Verify floor presence at the newly set position using downward raycast
    let isUnderneathFloor = false;
    if (baseModel) {
      const floorRaycaster = new Raycaster();
      floorRaycaster.camera = this.camera; // required — Sprite.raycast() needs this or it throws
      const rayStart = new Vector3(previewModel.position.x, 1000, previewModel.position.z);
      const rayDir = new Vector3(0, -1, 0);
      floorRaycaster.set(rayStart, rayDir);

      const floorIntersects = floorRaycaster.intersectObject(baseModel, true);
      for (const hit of floorIntersects) {
        const obj = hit.object;
        if ((obj as any).isFloor || obj.name.toLowerCase().includes(FloorNames.FLOOR)) {
          isUnderneathFloor = true;
          break;
        }
      }
    }
    this.isPreviewOnFloor = isUnderneathFloor;

    // update matrices so collision check is accurate
    this.previewModel.updateMatrixWorld(true);
    const isColliding = this.modelController.checkPreviewCollision(this.previewModel);

    this.updatePreviewColor(isColliding || !this.isPreviewOnFloor);
    this.rendererManager.renderer.domElement.style.cursor = CursorStyle.GRAB;
    if(this.isDraggingForPlacement){
      this.previewModel.visible = false;
    } 
  }

  /**
   * Cleans up all temporary preview objects from the scene.
   *
   * @private
   * @returns {void}
   */
  private cleanupPreview() {
    if (this.previewModel) {
      this.scene.remove(this.previewModel);

      if (this.previewModel.userData.collisionMaterial) {
        this.previewModel.userData.collisionMaterial.dispose();
      }

      this.previewModel.traverse((child: any) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (Array.isArray(child.userData.previewMaterial)) {
            child.userData.previewMaterial.forEach((m: any) => m.dispose());
          } else if (child.userData.previewMaterial) {
            child.userData.previewMaterial.dispose();
          }
        }
      });
    }

    if (this.previewCollider) {
      this.scene.remove(this.previewCollider);
      if (this.previewCollider instanceof Mesh) {
        this.previewCollider.geometry.dispose();
        if (Array.isArray(this.previewCollider.material)) {
          this.previewCollider.material.forEach((m) => m.dispose());
        } else {
          this.previewCollider.material.dispose();
        }
      }
    }

    this.isPreviewActive = false;
    this.selectionEnabled = this.prevSelectionState;

    this.previewModel = null;
    this.previewCollider = null;
    this.basePreviewModel = null;
    this.isPreviewOnFloor = false;

    const activeControl = this.controlsManager.getActiveControl();
    if (activeControl instanceof TransformControls) {
      activeControl.detach();
    }

    this.rendererManager.renderer.domElement.style.cursor = CursorStyle.DEFAULT;
  }

  /**
   * Updates the color of the preview model based on its collision state.
   *
   * @private
   * @param {boolean} isColliding - Whether the preview model is currently colliding with other objects.
   * @returns {void}
   */
  private updatePreviewColor(isColliding: boolean) {
    if (!this.previewModel) return;

    if (!this.previewModel.userData.collisionMaterial) {
      this.previewModel.userData.collisionMaterial = new MeshBasicMaterial({
        color: 0xff0000,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        opacity: 1,
      });
    }

    const collisionMaterial = this.previewModel.userData.collisionMaterial;

    this.previewModel.traverse((child: any) => {
      if (child.isMesh && child.userData.previewMaterial) {
        child.material = isColliding ? collisionMaterial : child.userData.previewMaterial;
      }
    });
  }

  /**
   * Handles right-click and Escape key events to cancel preview mode or open context menus.
   *
   * @private
   * @param {MouseEvent | KeyboardEvent} event - The triggered event.
   * @returns {void}
   */
  private onRightClick(event: MouseEvent | KeyboardEvent) {
    if (event instanceof KeyboardEvent) {

      // Ignore keyboard events other than Escape and undo/redo shortcuts
      if (event.key !== "Escape") {
        return;
      }
    }

    if (this.isPreviewDragging) return;

    if (!this.isPreviewActive) {
      // Outside of placement/preview, a right-click on a placed model opens a context menu (copy / delete) for that model.
      if (event instanceof MouseEvent) {
        this.handleModelContextMenu(event);
      }
      return;
    }
    event.preventDefault();

    this.cleanupPreview();
    if (this.isReplacingModel) {
      this.restoreReplacedModel();
      return;
    }
    if (this.isCloningModel) {
      this.isCloningModel = false;
      const category = this.modelRoot?.userData?.metadata?.category || "Asset";
      Events.emit(ConfiguratorEventType.CLONE, {
        title: "Cancelled",
        message: "Clone placement cancelled.",
        category: category,
        color: "warning",
      });
    }
    this.modelRoot = this.prevModelRoot;
    if (this.modelRoot) {
      this.switchControlMode(ControlTypes.TRANSFORM);

      const currentMode = this.controlsManager.getCurrentTransformMode();
      if (this.modelRoot.name === RequiredStrings.FURNITURE_GROUP) {
        this.modelController.addBoundingBoxHelper(this.modelRoot as Object3D, "select");
        this.setTransformMode(currentMode);

      } else {
        this.setTransformMode(currentMode);
      }
      this.setTransformControlsAxes(currentMode);
    }
    if (this.isShowAllMeasurementsActive) {
      this.showAllMeasurements();
    } else {
      const wasMeasurementActive = this.isMeasurementActive;
      this.clearAllMeasurements();

      if (this.modelRoot && wasMeasurementActive) {
        // If there was a previous model and measurement was active for it, restore it
        this.toggleMeasurement();
      } else {
        Events.emit(ConfiguratorEventType.PREVIEW_CANCELLED);
      }
    }

    const selectedMetadata = this.getModelMetadata();
    Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
  }

  /**
   * Handles the undo operation based on the current 3D mode.
   *
   * @public
   * @returns {void}
   */
  public undo() {
    if (this.currentMode == CurrentMode.THREE_D_MODE) {
      this.undo3DMode();
    } else if (this.currentMode == CurrentMode.CONFIGURE_MODE) {
      this.undoConfigureMode()
    }
  }

  /**
   * Handles the redo operation based on the current 3D mode.
   *
   * @public
   * @returns {void}
   */
  public redo() {
    if (this.currentMode == CurrentMode.THREE_D_MODE) {
      this.redo3DMode();
    } else if (this.currentMode == CurrentMode.CONFIGURE_MODE) {
      this.redoConfigureMode()
    }
  }

  /**
   * Handles keyboard shortcuts for deleting and duplicating models.
   *
   * @private
   * @param {KeyboardEvent} event - The triggered keyboard event.
   * @returns {void}
   */
  private onKeyDown(event: KeyboardEvent): void {
    // Ctrl + C or Cmd + C for Duplicate/Copy model
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    if (isCtrlOrCmd && event.key.toLowerCase() === KeyboardKey.COPY) {
      event.preventDefault();
      this.duplicateModel();
      return;
    }

    // Delete key for Delete model
    if (event.key === KeyboardKey.DELETE) {
      event.preventDefault();
      this.executeModelDeletion();
      return;
    }
  }

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
  private handleModelContextMenu(event: MouseEvent): void {
    if (!this.selectionEnabled) return;

    // Always suppress the browser's native context menu over the 3D canvas.
    event.preventDefault();

    // A right-drag (camera pan) should not open the menu.
    if (this.isDraggingForSelection) return;

    const rect = this.container.getBoundingClientRect();

    // Ignore clicks inside the ViewCube's interactive area (top-right corner).
    const viewCubeSize = 150;
    if (
      event.offsetX > rect.width - viewCubeSize &&
      event.offsetY < viewCubeSize
    ) {
      return;
    }

    this.mouseForSelection.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseForSelection.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycasterForSelection.setFromCamera(
      this.mouseForSelection,
      this.camera
    );

    const selectableObjects: Object3D[] = [];
    this.scene.traverse((child) => {
      if ((child as any).userData?.selectable === SelectableState.TRUE) {
        selectableObjects.push(child);
      }
    });

    const intersects = this.raycasterForSelection.intersectObjects(
      selectableObjects,
      true
    );

    const selectableObject =
      intersects.length > 0
        ? this.findSelectableParent(intersects[0].object)
        : null;

    if (!selectableObject) {
      // Right-clicked empty space dismiss any open context menu.
      Events.emit(ConfiguratorEventType.MODEL_CONTEXT_MENU, null);
      return;
    }

    // Select the right-clicked model 
    this.modelRoot = selectableObject;
    this.switchControlMode(ControlTypes.TRANSFORM);

    const currentMode = this.controlsManager.getCurrentTransformMode();
    this.setTransformMode(currentMode);
    this.setTransformControlsAxes(currentMode);

    if (this.isShowAllMeasurementsActive) {
      this.showAllMeasurements();
    } else if (this.isMeasurementActive) {
      this.toggleMeasurement();
    }

    const selectedMetadata = this.getModelMetadata();
    Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
    Events.emit(ConfiguratorEventType.MODEL_CONTEXT_MENU, {
      x: event.clientX,
      y: event.clientY,
      metadata: selectedMetadata,
    });
  }

  /**
   * Handles left-click event to finalize model placement in preview mode.
   *
   * @private
   * @returns {void}
   */
  private onLeftClick() {
    if (this.isPreviewDragging || !this.isPreviewActive || !this.previewModel || !this.isPreviewOnFloor) return;
    this.finnalizeModelPlacement();
  }

  /**
   * Helper to finallize the placement of the preview model, checking for collisions and updating the scene.
   */
  private finnalizeModelPlacement() {
    if(!this.previewModel) return;
    const isColliding = this.modelController.checkPreviewCollision(
      this.previewModel
    );

    if(isColliding && this.isDraggingForPlacement){
      this.cleanupPreview();
      return;
    } 
    if (isColliding) return;

    const newPosition = this.previewModel.position.clone()
    this.modelRoot!.position.copy(newPosition);
    this.scene.add(this.modelRoot!);


    // Allow the operation for a permanent group, a model being placed for the first time,
    // or a single model being cloned (excluding cloned furniture groups).
    if (this.modelRoot?.userData?.isPermanentGroup === true
      || !this.isCloningModel
      || (this.isCloningModel && !this.modelRoot?.name.startsWith(RequiredStrings.CLONEDFURNITUREGROUP))
    ) {

      const transformSnapshot = this.getWorldTransformSnapshot();

      const newData = transformSnapshot ?? {};

      const oldData = {
        modelNames: transformSnapshot?.models.map((model) => model.modelName) ?? [],
        isPermanentGroup: transformSnapshot?.isPermanentGroup,
        permanentGroupName: transformSnapshot?.permanentGroupName
      };
      this.recordConfigureAction(ActionTypeConfigure.LOAD_MODEL, oldData, newData);
    }

    if (this.modelRoot?.userData.isGroup === true) {
      this.modelRoot.children.forEach((child: Object3D) => {
        if (!(child as any).isLine || (child as any).isLine !== true || (child as any).isLineSegments !== true) {
          this.modelController.placedModels.push(child);
        }
      })
    }
    else {
      this.modelController.placedModels.push(this.modelRoot!);
    }

    // handle transform controls
    const activeControl = this.controlsManager.getActiveControl();
    if (activeControl instanceof TransformControls) {
      activeControl.attach(this.modelRoot!);
      activeControl.setSpace("world");
      this.modelController.addBoundingBoxHelper(
        this.modelRoot as Object3D,
        "select"
      );

      if (this.isReplacingModel) {
        this.disposeBackupModel();
        Events.emit(ConfiguratorEventType.REPLACE, {
          title: "Success",
          message: `${this.modelRoot?.userData?.metadata?.category || "Asset"} replaced successfully!`,
          category: this.modelRoot?.userData?.metadata?.category || "Asset",
          color: "success",
          autoPlaced: false,
        });
        this.isReplacingModel = false;
      }
      if (this.isCloningModel) {
        // when cloned furniture group is placed
        if (this.modelRoot && this.modelRoot.name.startsWith(RequiredStrings.CLONEDFURNITUREGROUP)) {
          this.modelRoot.updateMatrixWorld(true);
          //add all cloned group children back to scene

          const transformSnapshot = this.getWorldTransformSnapshot();

          const newData = transformSnapshot ?? {};

          const oldData = {
            modelNames:
              transformSnapshot?.models.map((model) => model.modelName) ?? [],
          };
          this.recordConfigureAction(ActionTypeConfigure.LOAD_MODEL, oldData, newData);

          const clonedChildren = [...this.modelRoot.children];
          clonedChildren.forEach((child) => {
            if (!(child as any).isLine || (child as any).isLine !== true || (child as any).isLineSegments !== true) {
              this.scene.attach(child);
              this.modelController.placedModels.push(child);
            }
          });
          this.modelController.placedModels = this.modelController.placedModels.filter(
            (m) => m !== this.modelRoot
          );
          this.modelRoot.removeFromParent();
          this.modelRoot = clonedChildren[0] || null;
          if (this.modelRoot && activeControl instanceof TransformControls) {
            activeControl.attach(this.modelRoot);
            this.modelController.addBoundingBoxHelper(this.modelRoot, "select");
          }
        }
        Events.emit(ConfiguratorEventType.CLONE, {
          title: "Success",
          message: `${this.modelRoot?.userData?.metadata?.category || "Asset"} cloned successfully!`,
          category: this.modelRoot?.userData?.metadata?.category || "Asset",
          color: "success",
        });
        this.isCloningModel = false;
      }
      this.onDraggingChangedHandler = () => {
        // No need to copy position/rotation/scale anymore as we are attaching directly to modelRoot
      };
      activeControl.addEventListener(
        "dragging-changed",
        this.onDraggingChangedHandler
      );
    }
    // Restore measurements before cleanup resets the flags
    if (this.isShowAllMeasurementsActive) {
      this.cleanupPreview();
      this.showAllMeasurements();
    } else if (this.isMeasurementActive) {
      this.cleanupPreview();
      this.toggleMeasurement();
    } else {
      this.cleanupPreview();
    }

    // Emit modelSelected so frontend updates highlight and properties
    const selectedMetadata = this.getModelMetadata();
    Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
    Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
    Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
    this.switchControlMode(ControlTypes.TRANSFORM);

    const currentMode = this.controlsManager.getCurrentTransformMode();
    this.setTransformMode(currentMode);

    this.setTransformControlsAxes(currentMode);
  }

  /**
   * Handles mouse move events to update the position of the preview model.
   *
   * @private
   * @param {MouseEvent} event - The mouse event.
   * @returns {void}
   */
  private onMouseMove(event: MouseEvent) {
    this.movePreviewModel(event);
  }

  /**
   * move the preview model with the mouse pointer, checking for collisions and floor placement.
   * @param {MouseEvent} event 
   * @returns 
   */
  private movePreviewModel(event: MouseEvent) {
    // if (this.isPreviewActive && event.buttons > 0) {
    //   console.log("Inside preview active and mouse button pressed");
    //   this.isPreviewDragging = true;
    //   return;
    // }
    if (this.isPreviewActive) {
      // console.log("Inside preview active");
      if (!this.previewModel || !this.basePreviewModel) return;
      const mouse = new Vector2();

      const rect =
        this.rendererManager.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new Raycaster();
      raycaster.camera = this.camera; // required — Sprite.raycast() needs this or it throws

      raycaster.setFromCamera(mouse, this.camera);

      // Intersect ONLY with the floor model to avoid interference from furniture or gizmos
      const intersects = raycaster.intersectObject(this.basePreviewModel, true).filter((hit) => !this.isLabelHit(hit.object));

      if (intersects.length > 0) {
        const hit = intersects[0];
        const obj = hit.object;
        if ((obj as any).isFloor || obj.name.toLowerCase().includes(FloorNames.FLOOR)) {
          this.previewModel.position.x = hit.point.x;
          this.previewModel.position.z = hit.point.z;
          this.previewModel.updateMatrixWorld(true);
          this.isPreviewOnFloor = true;
        }
        else{
          this.isPreviewOnFloor = false;
        }
      }
      else{
        this.isPreviewOnFloor = false;
      }

      // update measurements after position change so they reflect the new location
      if (this.isShowAllMeasurementsActive) {
        this.showAllMeasurements();
      } else if (this.isMeasurementActive) {
        this.toggleMeasurement();
      }

      const isColliding = this.modelController.checkPreviewCollision(
        this.previewModel
      );
      
      if(this.isDraggingForPlacement){
        this.previewModel.visible = this.isPreviewOnFloor;
      }
      this.updatePreviewColor(isColliding || !this.isPreviewOnFloor);
      return;
    }
    if (this.selectionEnabled && !this.isPreviewActive) {
      const mouse = new Vector2();
      const rect =
        this.rendererManager.renderer.domElement.getBoundingClientRect();

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new Raycaster();
      raycaster.camera = this.camera; // required — Sprite.raycast() needs this or it throws
      raycaster.setFromCamera(mouse, this.camera);
      const intersectsRaw = raycaster.intersectObjects(
        this.modelController.placedModels,
        true
      );

      // Exclude currently selected model (this.modelRoot) and its descendants from hover hits
      // so the hover highlight can reach a neighbouring model placed very close to the selected one.
      const hoverRoot = this.modelRoot;
      let intersects = hoverRoot
        ? intersectsRaw.filter((i: any) => {
          let obj: any = i.object;
          while (obj) {
            if (obj === hoverRoot) return false;
            obj = obj.parent;
          }
          return true;
        })
        : intersectsRaw;

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        const selectableParent = this.findSelectableParent(hitObject);
        const hoveredModel = selectableParent || hitObject;

        if (hoveredModel && this.hoveredCollider !== hoveredModel) {
          if (this.hoverBoxHelper) {
            this.hoverBoxHelper.parent?.remove(this.hoverBoxHelper);
            this.hoverBoxHelper = null;
          }

          this.hoveredCollider = hoveredModel;
          const helper = this.modelController.addBoundingBoxHelper(hoveredModel, "hover") as Object3D;
          if (helper) {
            this.hoverBoxHelper = helper;
          }

          Events.emit(
            ConfiguratorEventType.MODEL_HOVERED,
            hoveredModel.userData?.metadata || null
          );
        }
      } else {
        if (this.hoverBoxHelper) {
          this.hoverBoxHelper.parent?.remove(this.hoverBoxHelper);
          this.hoverBoxHelper = null;
          this.hoveredCollider = null;
          Events.emit(ConfiguratorEventType.MODEL_HOVERED, null);
        }
      }
      const dragThreshold = 5;

      //If mouse moves more than 5px, treat it as drag, not click.
      const dx = Math.abs(event.clientX - this.dragStartX);
      const dy = Math.abs(event.clientY - this.dragStartY);

      if (dx > dragThreshold || dy > dragThreshold) {
        this.isDraggingForSelection = true;
      }
    }
  }

  /**
   * Handles pointer release. If no drag occurred, treat it as a selection click.
   *
   * @private
   * @param {MouseEvent} event - The mouse pointer event.
   * @returns {void}
   */
  private onPointerUp(event: MouseEvent) {
    if (!this.selectionEnabled) return;
    // Treat as click only if not dragged
    if (!this.isDraggingForSelection) {
      this.selectModelOnClick(event);
    }
  }

  /**
   * Stores initial pointer position to detect drag vs click.
   *
   * @private
   * @param {MouseEvent} event - The mouse pointer event.
   * @returns {void}
   */
  private onPointerDown(event: MouseEvent) {
    this.isPreviewDragging = false;
    if (!this.selectionEnabled) return;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.isDraggingForSelection = false;
  }

  /**
   * Generates a unique name for a GLB model.
   *
   * @protected
   * @param {string} baseName - The base name of the model.
   * @param {string} modelId - The ID of the model.
   * @returns {string} - The generated unique name.
   */
  protected generateUniqueModelName(baseName: string, baseId: string, extraContainer?: Object3D): { name: string, id: string; } {
    const objectsWithSameId: Object3D[] = [];

    // Collect all objects having the same ID
    this.scene.traverse((obj) => {
      const objMeta = obj.userData?.metadata;
      if (objMeta && objMeta.id && objMeta.id.includes(baseId)) {
        objectsWithSameId.push(obj);
      }
    });

    if (extraContainer) {
      extraContainer.traverse((obj) => {
        const objMeta = obj.userData?.metadata;
        if (objMeta && objMeta.id && objMeta.id.includes(baseId) && !objectsWithSameId.includes(obj)) {
          objectsWithSameId.push(obj);
        }
      });
    }

    //  No duplicates return baseName directly
    if (objectsWithSameId.length === 0) {
      return { name: baseName, id: baseId };
    }

    //  Duplicates exist find max suffix
    let maxNumber = 0;

    for (const obj of objectsWithSameId) {
      const match = obj.name.match(/_node(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (!isNaN(num)) {
          maxNumber = Math.max(maxNumber, num);
        }
      }
    }

    const nextNumber = maxNumber + 1;

    const newName = `${baseName}_node${nextNumber}`;
    const newId = `${baseId}_node${nextNumber}`
    return { name: newName, id: newId };
  }

  /**
   * Finds a model in the scene using both metadata ID and Name.
   *
   * @private
   * @param {string} id - The ID of the model.
   * @param {string} name - The name of the model.
   * @returns {Object3D | null} - The found model object or null.
   */
  private findModelByIdAndName(id: string, name: string): Object3D | null {
    let targetModel: Object3D | null = null;

    this.scene.traverse((child) => {
      const md = child.userData?.metadata;

      if (md && md.id === id && md.name === name) {
        targetModel = child;
      }
    });

    return targetModel;
  }

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
  private adjustPerspectiveCamera(
    camera: PerspectiveCamera,
    model: Object3D,
    is2DLayout?: boolean,
  ): void {
    const box = new Box3().setFromObject(model);
    const center = new Vector3();
    const size = new Vector3();

    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);

    if (is2DLayout) {
      // 2D to 3D custom layout
      const fovRad = camera.fov * (Math.PI / 180);
      const distance = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.1;

      camera.position.set(
        center.x,
        center.y + distance,
        center.z + distance * 0.01,
      );

      if ((this.controls as any)?.target) {
        (this.controls as any).target.copy(center);
        (this.controls as any).update?.();
      } else {
        camera.lookAt(center);
      }
    } else {
      // Existing 3D layout
      const fovRad = camera.fov * (Math.PI / 180);

      let distance = (maxDim / (2 * Math.tan(fovRad / 2))) * 0.9;

      camera.position.set(center.x + distance, center.y + distance, center.z + distance);
      camera.near = distance / 100;
      camera.far = distance * 10;
      camera.lookAt(center);
    }

    camera.updateProjectionMatrix();
  }

  /**
   * Positions and configures the Orthographic camera based on the given model’s
   * bounding box so the model fits within the view.
   *
   * @private
   * @param {OrthographicCamera} camera - Orthographic camera to be adjusted
   * @param {Object3D} model - Model used to compute camera framing
   * @returns {void} - void
   */
  private adjustOrthographicCamera(
    camera: OrthographicCamera,
    model: Object3D
  ): void {
    const box = new Box3().setFromObject(model);
    const center = new Vector3();
    const size = new Vector3();

    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const aspect = this.container.clientWidth / this.container.clientHeight;

    const viewSize = maxDim * 1.3;
    const halfH = viewSize / 2;
    const halfW = halfH * aspect;

    camera.left = -halfW;
    camera.right = halfW;
    camera.top = halfH;
    camera.bottom = -halfH;

    camera.near = -maxDim * 2;
    camera.far = maxDim * 4;

    camera.position.set(center.x + maxDim, center.y + maxDim, center.z + maxDim);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }

  /**
   * Creates a duplicate of the currently selected furnitureGroup.
   * Communicates outcomes via events: clonePending, cloneComplete.
   *
   * @private
   * @returns {boolean} - `true` if copy was initiated, `false` if no model is selected.
   */
  private makeCopyMultiSelect(isGroup: boolean): boolean {

    // return if model root not present
    if (!this.modelRoot) {
      return false;
    }

    if (this.previewModel) return false;

    // store current modelroot in case copy operation is cancelled
    this.prevModelRoot = this.isModelRootEqualToRoomModel() ? null : this.modelRoot;

    // Remove the bounding box helper from the original before cloning.
    this.modelController.removeBoundingBoxHelper();

    // clone(true) is a deep clone — it copies ALL children, including the
    // yellow LineSegments helper attached by addBoundingBoxHelper. Without
    // this step the copy gets a permanently stuck yellow box baked into it.
    const cloneModel = this.modelRoot.clone(true);

    cloneModel.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(mat => mat.clone());
        } else {
          mesh.material = mesh.material.clone();
        }

        const oldMesh = this.modelRoot?.getObjectByName(mesh.name) as Mesh;

        // Grab the material and texture directly from the old mesh and add that to new model userdata
        if (oldMesh?.userData?.originalMaterial) {
          mesh.userData.originalMaterial = oldMesh.userData.originalMaterial.clone();
          mesh.userData.originalTexture = oldMesh.userData.originalTexture;
        }
      }
    });


    // since modelroot is furnitureGroup here, we operate on each child of this group to pass the userdata
    this.modelRoot.children.forEach((child, index) => {
      const clonedChild = cloneModel.children[index];
      if (clonedChild) {
        clonedChild.userData = JSON.parse(JSON.stringify(child.userData));
        clonedChild.userData.ignoreCollisionUntilClear = true;
        const metadata = clonedChild.userData.metadata;
        if (!metadata?.id || !metadata?.name) {
          return false;
        }
        const baseName = metadata.name.replace(/_node\d+$/, "");
        const baseId = metadata.id.replace(/_node\d+$/, "");
        const newNameAndId = this.generateUniqueModelName(baseName, baseId, cloneModel);
        clonedChild.name = newNameAndId.name;
        metadata.name = newNameAndId.name;
        metadata.id = newNameAndId.id;
        if (isGroup) {
          clonedChild.userData.selectable = SelectableState.FALSE;
        }
      }
    });

    if (isGroup) {

      const groupName = `Group ${Math.floor(Math.random() * 1000)}`;
      cloneModel.userData = {
        isGroup: true,
        isPermanentGroup: true,
        isGLBModel: true,
        selectable: SelectableState.TRUE,
        metadata: {
          id: `group_${Date.now()}`,
          name: groupName,
          isGroup: true,
          price: 0,
          format: "Group",
        },
      };
      cloneModel.name = groupName
    }
    else {
      cloneModel.name = RequiredStrings.CLONEDFURNITUREGROUP + Date.now();
    }

    this.modelRoot = cloneModel;

    // Directly drop the user into drag-to-place mode for every clone
    this.isCloningModel = true;

    const baseModel = ModelController.GetRoomModel(this.scene);
    this.handlePreviewMode(baseModel);
    this.positionPreviewModel(baseModel!);

    const category = this.modelRoot?.userData?.metadata?.category || "Asset";
    Events.emit(ConfiguratorEventType.CLONE, {
      title: "Pending",
      message: `Click anywhere to place the copied ${category}. Right-click or Esc to cancel.`,
      category: category,
      color: "warning",
    });
    return true;
  }

  /**
   * Removes the currently selected multi-selected models and its associated colliders,
   * measurements, and helpers from the scene.
   *
   * @private
   * @returns {boolean} - true if the models were successfully removed, otherwise false.
   */
  private removeModelMultiSelect(): boolean {
    if (!this.modelRoot) return false;

    const category = this.modelRoot?.userData?.metadata?.category || "Asset";

    const childrenToRemove = [...this.modelRoot.children];

    // Remove from placedModels list
    this.modelController.placedModels = this.modelController.placedModels.filter(
      (c) => !childrenToRemove.includes(c)
    );

    // Remove the current bounding box helper
    this.modelController.removeBoundingBoxHelper();

    // Remove static collider if present
    const oldStaticCollider = this.scene.getObjectByName("StaticColliderMesh");
    if (oldStaticCollider) {
      oldStaticCollider.parent?.remove(oldStaticCollider);
    }

    const wasShowAllMeasurementsActive = this.isShowAllMeasurementsActive;
    const wasMeasurementActive = this.isMeasurementActive;

    this.clearAllMeasurements();
    if (wasMeasurementActive) {
      this.isMeasurementActive = true;
    }

    childrenToRemove.forEach((child) => {
      this.disposeGeometryAndMaterial(child);
    });

    if (this.modelRoot.name === RequiredStrings.FURNITURE_GROUP) {
      // Remove all children but keep the group
      this.modelRoot.clear();
      this.modelRoot.position.set(0, 0, 0);
      this.modelRoot.quaternion.identity();
      this.modelRoot.updateMatrixWorld(true);
      this.modelRoot = null;
    } else {
      this.scene.remove(this.modelRoot);
      this.modelRoot = null;
    }

    if (wasShowAllMeasurementsActive) {
      this.showAllMeasurements();
    } else if (wasMeasurementActive) {
      this.isMeasurementActive = true;
    }

    Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);
    Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
    Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());

    if (!this.isReplacingModel) {
      Events.emit(ConfiguratorEventType.DELETE, {
        title: "Successful",
        message: `${category} deleted successfully!`,
        category: category,
        color: "warning",
      });
    }

    return true;
  }

  /**
   * Recursively disposes of all geometries, materials, and textures within the specified object.
   *
   * @private
   * @param {Object3D} model - The 3D object to dispose.
   * @returns {void}
   */
  private disposeGeometryAndMaterial(model: Object3D) {
    // dispose geometries, materials, and textures
    model.traverse((child: any) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      const disposeMaterial = (material: any) => {
        if (!material) return;

        // dispose all textures attached to the material
        for (const key in material) {
          const value = material[key];
          if (value && value.isTexture) {
            value.dispose();
          }
        }

        material.dispose();
      };

      if (Array.isArray(child.material)) {
        child.material.forEach(disposeMaterial);
      } else {
        disposeMaterial(child.material);
      }
    });
  }

  /**
   * Re-adds the previously replaced model to the scene, used when the
   * user cancels a replacement that required manual repositioning.
   *
   * @private
   * @returns {void}
   */
  private restoreReplacedModel(): void {
    if (!this.modelPendingReplacement) return;
    const { object, position, rotation, scale } = this.modelPendingReplacement;

    object.position.copy(position);
    object.rotation.copy(rotation);
    object.scale.copy(scale);
    object.updateMatrixWorld(true);

    this.scene.add(object);
    this.modelController.placedModels.push(object);
    this.modelRoot = object;

    this.modelPendingReplacement = null;
    this.isReplacingModel = false;

    this.switchControlMode(ControlTypes.TRANSFORM);
    this.modelController.updateHelper();
    Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
    Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());

    Events.emit(ConfiguratorEventType.REPLACE, {
      title: "Cancelled",
      message: "Replacement cancelled.",
      category: this.modelRoot?.userData?.metadata?.category || "Asset",
      color: "warning",
    });
  }

  /**
   * Disposes the backed-up old model once a replacement has succeeded
   * and the backup is no longer needed.
   *
   * @private
   * @returns {void}
   */
  private disposeBackupModel(): void {
    if (!this.modelPendingReplacement) return;
    const { object } = this.modelPendingReplacement;

    object.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m: any) => m?.dispose());
      }
    });

    this.modelPendingReplacement = null;
  }

  /**
   * Creates and adds a ground plane under the specified model.
   *
   * @protected
   * @param {Object3D} model - The base room model to create a ground plane for.
   * @returns {void}
   */
  protected addGroundPlaneForExistingLayout(model: Object3D): void {
    // Calculate the bounding box of the base model
    const boundingBox = new Box3().setFromObject(model);
    const size = new Vector3();
    const center = new Vector3();
    boundingBox.getSize(size);
    boundingBox.getCenter(center);

    // Provide safe default dimensions if the model size isn't fully calculated yet
    const planeWidth = size.x > 0.1 ? size.x * 200 : 200;
    const planeDepth = size.z > 0.1 ? size.z * 200 : 200;

    let texture, material, plane;

    const textureLoader = new TextureLoader();
    const groundImageUrl = ImageAssets.GROUND_IMAGE_PATH;
    texture = textureLoader.load(groundImageUrl);
    texture.colorSpace = SRGBColorSpace;

    // assuming you want the texture to repeat in both directions:
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;

    // how many times to repeat in each direction
    texture.repeat.set(400, 400);

    material = new MeshStandardMaterial({ map: texture, color: 0xffffff, roughness: 0.8, metalness: 0.1 });
    plane = new Mesh(new PlaneGeometry(planeWidth, planeDepth), material);
    plane.material.side = DoubleSide;
    plane.position.set(center.x, -0.02, center.z);
    plane.receiveShadow = true;
    // rotation.x is rotation around the x-axis
    plane.rotation.x = -Math.PI / 2;

    this.scene.add(plane);
  }

  /**
   * Scans the scene for textures and waits for them to load.
   *
   * @private
   * @returns {Promise<Promise<void>>}
   */
  private async ensureAssetsLoaded(): Promise<void> {
    const textures: Texture[] = [];

    this.scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const material = (obj as Mesh).material;
        const processMaterial = (mat: any) => {
          if (!mat) return;
          const mapKeys = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap", "alphaMap"];
          mapKeys.forEach(key => {
            const tex = mat[key];
            // Check if it's a texture and if it's missing image data 
            if (tex && tex.isTexture && (!tex.image || (tex.image instanceof HTMLImageElement && !tex.image.complete))) {
              textures.push(tex);
            }
          });
        };

        if (Array.isArray(material)) {
          material.forEach(processMaterial);
        } else {
          processMaterial(material);
        }
      }
    });

    if (textures.length === 0) return;

    // Create a promise for each loading texture
    const texturePromises = textures.map(tex => {
      return new Promise((resolve) => {
        // If image is already there and complete, resolve immediately
        if (tex.image && (tex.image instanceof HTMLImageElement ? tex.image.complete : true)) {
          resolve(true);
          return;
        }

        // Add event listeners for load or error
        const onFinish = () => {
          tex.removeEventListener("dispose", onFinish);
          resolve(true);
        };

        // Note: Three.js textures don't always emit 'load' directly on the texture object
        // but the Image element does. However, some textures might be DataTextures.
        if (tex.image instanceof HTMLImageElement) {
          tex.image.addEventListener("load", onFinish, { once: true });
          tex.image.addEventListener("error", onFinish, { once: true });
        } else {
          // Fallback check if it's not an HTMLImageElement or already loaded
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (tex.image || attempts > 50) { // 5 seconds max wait
              clearInterval(interval);
              resolve(true);
            }
          }, 100);
        }
      });
    });

    await Promise.all(texturePromises);
  }

  /**
   * Helper to save ArrayBuffer as a file.
   *
   * @private
   * @param {ArrayBuffer} buffer - The buffer to save.
   * @param {string} filename - The target filename.
   * @returns {void}
   */
  private saveArrayBuffer(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    this.save(blob, filename);
  }

  /**
   * Helper to save string as a file.
   *
   * @private
   * @param {string} text - The string content to save.
   * @param {string} filename - The target filename.
   * @returns {void}
   */
  private saveString(text: string, filename: string): void {
    const blob = new Blob([text], { type: "text/plain" });
    this.save(blob, filename);
  }

  /**
   * Initiates a file download in the browser.
   *
   * @private
   * @param {Blob} blob - The blob data to download.
   * @param {string} filename - The downloaded file name.
   * @returns {void}
   */
  private save(blob: Blob, filename: string): void {
    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Helper method to perform raycasting and identify the clicked wall face group index.
   *
   * @private
   * @param {PointerEvent} event - The pointer event.
   * @returns {{ mesh: Mesh, targetGroupIndex: number } | null} - | null} Information about the clicked wall face group.
   */
  private getClickedWallFace(
    event: PointerEvent
  ): { mesh: Mesh; materialIndex: number } | null {
    const rect = this.rendererManager.renderer.domElement.getBoundingClientRect();
    const mouse = new Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new Raycaster();
    raycaster.camera = this.camera; // required — Sprite.raycast() needs this or it throws
    raycaster.setFromCamera(mouse, this.camera);

    const meshes: Mesh[] = [];
    this.scene.traverse((child) => {
      if (
        child instanceof Mesh &&
        (child as any).wall_id &&
        child.material.opacity !== 0
      ) {
        meshes.push(child);
      }
    });

    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length === 0) return null;

    const intersect = intersects[0];
    const mesh = intersect.object as Mesh;

    if (intersect.faceIndex === undefined || intersect.faceIndex === -1) {
      return null;
    }

    // Direct access to face materialIndex (defaults to 0 if non-indexed/single material)
    const materialIndex = intersect.face?.materialIndex ?? 0;

    return { mesh, materialIndex };
  }

  /**
   * Click handler for wall coloring mode.
   *
   * @private
   * @param {PointerEvent} event - PointerEvent
   * @returns {void}
   */
  private onWallColoringClick = (event: PointerEvent) => {
    if (!this.isWallColoringMode) return;
    const wallFace = this.getClickedWallFace(event);
    if (wallFace) {
      const targetColor = new Color(this.selectedWallColor.color);
      const mesh = wallFace.mesh
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      const mat = materials[wallFace.materialIndex];
      if (!(mat instanceof MeshStandardMaterial) && !(mat instanceof MeshBasicMaterial)) {
        return;
      }

      const oldData: WallAppearanceData = {
        meshId: (mesh as any).wall_id,
        materials: [{
          materialIndex: wallFace.materialIndex,
          url: mat.userData.textureUrl ?? "",
          repeatX: mat.userData.repeatX ?? 1,
          repeatY: mat.userData.repeatY ?? 1,
          color: `#${mat.color.getHexString()}`,
        }]
      };

      const newData: WallAppearanceData = {
        meshId: (mesh as any).wall_id,
        materials: [{
          materialIndex: wallFace.materialIndex,
          url: "",
          repeatX: 1,
          repeatY: 1,
          color: `#${targetColor.getHexString()}`,
        }]
      };

      this.updateColorMaterial(wallFace.mesh, wallFace.materialIndex, targetColor, this.selectedWallColor.id);

      // Record history only after the texture has loaded and been applied.
      this.record3DAction(ActionType3D.UPDATE_WALL_APPEARANCE, [oldData], [newData])
    }
  };

  /**
   * Updates a mesh material's color, clears its texture, and stores finish metadata.
   *
   * @param {Mesh} mesh - The mesh whose material should be updated.
   * @param {number} materialIndex - The index of the material to update.
   * @param {Color | string | number} targetColor - The color to apply.
   * @param {string} [finishId] - The finish ID to store with the color.
   * @returns {void}
   * @private
   */
  private updateColorMaterial(
    mesh: Mesh,
    materialIndex: number,
    targetColor: Color | string | number,
    finishId?: string
  ): void {
    const materials = Array.isArray(mesh.material)
      ? [...mesh.material]
      : [mesh.material];

    const material = materials[materialIndex];

    if (!(material instanceof MeshStandardMaterial)) {
      return;
    }

    // Clone the material so other meshes sharing this material remain unaffected
    const newMaterial = material.clone();
    if (newMaterial.map) {
      newMaterial.map.dispose();
      newMaterial.map = null;
    }

    // Apply the new color
    const color = new Color(targetColor);
    newMaterial.color.set(color);
    newMaterial.needsUpdate = true;

    newMaterial.userData.textureUrl = "";
    newMaterial.userData.color = `#${color.getHexString()}`;
    newMaterial.userData.finishUrl = `#${color.getHexString()}`;
    if (finishId !== undefined) {
      newMaterial.userData.finishId = finishId;
    }

    // Replace only the target material
    materials[materialIndex] = newMaterial;
    mesh.material = materials;
  }
  /**
   * Resets the material of a specific mesh to its original default.
   *
   * @private
   * @param {Mesh} mesh - The mesh to restore.
   * @param {number} [materialIndex] - The optional material index.
   * @returns {boolean} - True if successfully restored.
   */
  private restoreDefaultMaterial(mesh: Mesh, materialIndex?: number): boolean {
    const defaultMaterial = mesh.userData.defaultMaterial;

    if (!defaultMaterial) {
      return false;
    }

    // Extract a single material reference if defaultMaterial is an array
    const singleDefaultMat: Material = Array.isArray(defaultMaterial)
      ? defaultMaterial[0]
      : defaultMaterial;

    const defaultMaterialsArray: Material[] = Array.isArray(defaultMaterial)
      ? defaultMaterial
      : [defaultMaterial];

    const disposeMaterial = (mat: Material) => {
      if (!defaultMaterialsArray.includes(mat)) {
        if (mat instanceof MeshStandardMaterial || mat instanceof MeshBasicMaterial) {
          mat.map?.dispose();
        }
        mat.dispose();
      }
    };

    if (materialIndex === undefined) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(disposeMaterial);
        mesh.material = mesh.material.map(
          (_, i) => defaultMaterialsArray[i] ?? singleDefaultMat
        );
      } else {
        if (mesh.material !== singleDefaultMat) {
          disposeMaterial(mesh.material);
        }
        mesh.material = singleDefaultMat;
      }

      defaultMaterialsArray.forEach((m) => {
        m.needsUpdate = true;
      });
      return true;
    }

    if (!Array.isArray(mesh.material)) {
      const numGroups = mesh.geometry.groups?.length || 1;
      const baseMat = mesh.material;
      const newMaterials: Material[] = [];

      for (let i = 0; i < numGroups; i++) {
        if (i === materialIndex) {
          newMaterials[i] = Array.isArray(defaultMaterial)
            ? defaultMaterial[i] ?? singleDefaultMat
            : singleDefaultMat;
        } else {
          newMaterials[i] = baseMat.clone();
        }
      }

      mesh.material = newMaterials;
      singleDefaultMat.needsUpdate = true;
      return false;
    }

    const updatedMaterials = [...mesh.material];
    const currentMaterial = updatedMaterials[materialIndex];

    if (currentMaterial) {
      disposeMaterial(currentMaterial);
    }

    const targetDefaultMat = Array.isArray(defaultMaterial)
      ? defaultMaterial[materialIndex] ?? singleDefaultMat
      : singleDefaultMat;

    updatedMaterials[materialIndex] = targetDefaultMat;
    mesh.material = updatedMaterials;
    targetDefaultMat.needsUpdate = true;

    const allDefault = updatedMaterials.every((mat, idx) => {
      const expectedMat = Array.isArray(defaultMaterial)
        ? defaultMaterial[idx] ?? singleDefaultMat
        : singleDefaultMat;
      return mat === expectedMat;
    });

    return allDefault;
  }

  /**
   * Click handler for wall texture placement.
   *
   * @private
   * @param {PointerEvent} event - The pointer event.
   * @returns {void}
   */
  private onWallTexturingClick = (event: PointerEvent) => {
    if (!this.isWallTexturingMode || !this.selectedWallTexture) return;
    const wallFace = this.getClickedWallFace(event);
    if (wallFace) {
      const url = this.selectedWallTexture.url;
      const mesh = wallFace.mesh
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      const mat = materials[wallFace.materialIndex];
      if (!(mat instanceof MeshStandardMaterial) && !(mat instanceof MeshBasicMaterial)) {
        return;
      }

      const oldData: WallAppearanceData = {
        meshId: (mesh as any).wall_id,
        materials: [{
          materialIndex: wallFace.materialIndex,
          url: mat.userData.textureUrl ?? "",
          repeatX: mat.userData.repeatX ?? 1,
          repeatY: mat.userData.repeatY ?? 1,
          color: `#${mat.color.getHexString()}`,
        }]
      };

      const newData: WallAppearanceData = {
        meshId: (mesh as any).wall_id,
        materials: [{
          materialIndex: wallFace.materialIndex,
          url: url,
          repeatX: 1,
          repeatY: 1,
          color: null,
        }]

      };

      const loader = new TextureLoader();
      loader.load(url, (tex) => {
        this.updateTextureMaterial(wallFace.mesh, wallFace.materialIndex, {
          url: url,
          id: this.selectedWallTexture?.id,
          texture: tex,
          repeatX: 1,
          repeatY: 1,
        });
      });

      // Record history only after the texture has loaded and been applied.
      this.record3DAction(ActionType3D.UPDATE_WALL_APPEARANCE, [oldData], [newData]);
    }
  };

  /**
   * Applies a loaded texture to a mesh material and stores its finish metadata.
   *
   * @param {Mesh} mesh - The target mesh.
   * @param {number} materialIndex - The index of the material to update.
   * @param {object} texturePreset - The texture and finish settings to apply.
   * @param {string} texturePreset.url - The texture URL to store in material metadata.
   * @param {string} [texturePreset.id] - The finish ID to store with the texture.
   * @param {Texture | undefined} texturePreset.texture - The loaded texture; no update occurs if it is undefined.
   * @param {number} [texturePreset.repeatX] - The horizontal repeat factor before scaling by mesh dimensions.
   * @param {number} [texturePreset.repeatY] - The vertical repeat factor before scaling by mesh dimensions.
   * @returns {void}
   * @private
   */
  private updateTextureMaterial(
    mesh: Mesh,
    materialIndex: number,
    texturePreset: {
      url: string;
      id?: string;
      texture: Texture | undefined;
      repeatX?: number;
      repeatY?: number;
    },
  ): void {

    const tex = texturePreset.texture;


    if (!(tex instanceof Texture)) return;
    tex.wrapS = MirroredRepeatWrapping;
    tex.wrapT = MirroredRepeatWrapping;
    tex.colorSpace = SRGBColorSpace;

    mesh.geometry.computeBoundingBox();
    const bbox = mesh.geometry.boundingBox;
    const size = new Vector3();
    if (bbox) {
      bbox.getSize(size);
    }

    const wallTex = tex.clone();
    const repeatX = texturePreset.repeatX ?? (this.selectedWallTexture!.repeatX ?? 0.5) * (size.x > 0 ? size.x : 1);
    const repeatY = texturePreset.repeatY ?? (this.selectedWallTexture!.repeatY ?? 0.5) * (size.x > 0 ? size.x : 1);

    wallTex.repeat.set(
      repeatX * (size.x || 1),
      repeatY * (size.y || 1)
    );
    wallTex.needsUpdate = true;

    const materials = Array.isArray(mesh.material)
      ? [...mesh.material]
      : [mesh.material];

    const material = materials[materialIndex];

    if (!(material instanceof MeshStandardMaterial)) {
      return;
    }

    const newMaterial = material.clone();

    if (newMaterial.map && newMaterial.map !== tex) {
      newMaterial.map.dispose();
    }

    newMaterial.map = wallTex;
    newMaterial.color.set(0xffffff);
    newMaterial.needsUpdate = true;

    newMaterial.userData.textureUrl = texturePreset.url;
    newMaterial.userData.finishUrl = texturePreset.url;
    if (texturePreset.id !== undefined) {
      newMaterial.userData.finishId = texturePreset.id;
    }
    newMaterial.userData.repeatX = repeatX;
    newMaterial.userData.repeatY = repeatY;
    newMaterial.userData.color = null;

    materials[materialIndex] = newMaterial;
    mesh.material = materials;

  }

  /**
   * Click handler for wall material reset mode.
   * When active, clicking a wall face resets it to its original material.
   *
   * @private
   * @param {PointerEvent} event - The pointer event.
   * @returns {void}
   */
  private onWallMaterialResetClick = (event: PointerEvent) => {
    if (!this.isWallMaterialResetMode) return;

    const wallFace = this.getClickedWallFace(event);
    if (!wallFace) return;

    const { mesh, materialIndex } = wallFace;
    const defaultData = mesh.userData.defaultMaterial;
    if (!defaultData) return;

    const currentMaterials = Array.isArray(mesh.material)
      ? [...mesh.material]
      : [mesh.material];

    // Extract the default material for the specific face index
    const defaultMaterialForFace = Array.isArray(defaultData)
      ? defaultData[materialIndex]
      : defaultData;

    if (!defaultMaterialForFace) return;

    const activeMaterial = currentMaterials[materialIndex];

    // Safely dispose active material textures if it is a modified/cloned instance
    const isDefaultRef = Array.isArray(defaultData)
      ? defaultData.includes(activeMaterial)
      : activeMaterial === defaultData;

    if (activeMaterial && !isDefaultRef) {
      if (activeMaterial instanceof MeshStandardMaterial || activeMaterial instanceof MeshBasicMaterial) {
        activeMaterial.map?.dispose();
      }
      activeMaterial.dispose();
    }

    const beforeChangemat = currentMaterials[materialIndex]
    if (!(beforeChangemat instanceof MeshStandardMaterial) && !(beforeChangemat instanceof MeshBasicMaterial)) {
      return;
    }

    const oldData: WallAppearanceData = {
      meshId: (mesh as any).wall_id,
      materials: [
        {
          materialIndex: wallFace.materialIndex,
          url: beforeChangemat.userData.textureUrl ?? "",
          repeatX: beforeChangemat.userData.repeatX ?? 1,
          repeatY: beforeChangemat.userData.repeatY ?? 1,
          color: `#${beforeChangemat.color.getHexString()}`,
        }
      ]
    };

    const newData: WallAppearanceData = {
      meshId: (mesh as any).wall_id,
      materials: [
        {
          materialIndex: wallFace.materialIndex,
          url: defaultMaterialForFace.userData.textureUrl ?? "",
          repeatX: defaultMaterialForFace.userData.repeatX ?? 1,
          repeatY: defaultMaterialForFace.userData.repeatY ?? 1,
          color: `#${defaultMaterialForFace.color.getHexString()}`,
        }
      ]
    };

    // Restore original material for this specific face index
    currentMaterials[materialIndex] = defaultMaterialForFace;
    defaultMaterialForFace.needsUpdate = true;
    mesh.material = currentMaterials;

    // Record history only after the texture has loaded and been applied.
    this.record3DAction(ActionType3D.UPDATE_WALL_APPEARANCE, [oldData], [newData])
  };

  /**
   * Helper to enable casting and receiving shadows for all meshes in an object hierarchy.
   *
   * @private
   * @param {Object3D} object - The object to traverse.
   * @param {boolean} [cast] - Whether to enable casting shadows.
   * @param {boolean} [receive] - Whether to enable receiving shadows.
   * @returns {void}
   */
  private enableShadowsOnObject(
    object: Object3D,
    cast: boolean = true,
    receive: boolean = true
  ): void {
    object.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = cast;
        child.receiveShadow = receive;
      }
    });
  }

  /**
   * Applies maximum anisotropic filtering to all textures in an object hierarchy.
   * This keeps textures sharp at oblique angles (e.g., looking along a wall or floor).
   * Has no runtime cost — runs once on model load.
   *
   * @private
   * @param {Object3D} object - The object hierarchy.
   * @returns {void}
   */
  private applyAnisotropicFiltering(object: Object3D): void {
    const maxAnisotropy =
      this.rendererManager.renderer.capabilities.getMaxAnisotropy();
    const anisotropy = Math.min(16, maxAnisotropy);

    object.traverse((node) => {
      if (!(node as Mesh).isMesh) return;
      const mesh = node as Mesh;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mats.forEach((mat) => {
        for (const key of Object.keys(mat)) {
          const val = (mat as any)[key];
          if (val && val.isTexture) {
            val.anisotropy = anisotropy;
            val.needsUpdate = true;
          }
        }
      });
    });
  }

  /**
   * Helper method to set the correct active axes on transform controls based on the current mode.
   *
   * @private
   * @param {TransformControlsMode.ROTATE | TransformControlsMode.TRANSLATE | TransformControlsMode.SCALE} mode - The transform controls mode.
   * @returns {void}
   */
  private setTransformControlsAxes(mode: TransformControlsMode.ROTATE | TransformControlsMode.TRANSLATE | TransformControlsMode.SCALE): void {
    if (mode === TransformControlsMode.ROTATE) {
      this.toggleTransformAxis("y", true);
      this.toggleTransformAxis("x", false);
      this.toggleTransformAxis("z", false);
    } else if (mode === TransformControlsMode.TRANSLATE) {
      this.setTransformSize(0.7);
      this.toggleTransformAxis("y", false);
      this.toggleTransformAxis("x", true);
      this.toggleTransformAxis("z", true);
    }
  }

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
  private measureWallClearance(
    origin: Vector3,
    direction: Vector3,
    roomModel: Object3D
  ): number {
    const originalSides: Array<{ material: Material; side: Material["side"] }> = [];

    roomModel.traverse((child: any) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        originalSides.push({ material, side: material.side });
        material.side = DoubleSide;
      }
    });

    const raycaster = new Raycaster();
    raycaster.camera = this.camera;
    raycaster.set(origin, direction);
    const hit = raycaster.intersectObject(roomModel, true)[0];

    for (const entry of originalSides) {
      entry.material.side = entry.side;
    }

    return hit ? hit.distance : Infinity;
  }

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
  private fitCameraToObjectIsometric(
    camera: any,
    controls: any,
    object: Object3D,
    offset = 1.2
  ) {
    const box = new Box3().setFromObject(object);

    if (box.isEmpty()) return;

    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    const maxDimension = Math.max(size.x, size.z);

    const fov = MathUtils.degToRad(camera.fov);

    let distance = (maxDimension / 2) / Math.tan(fov / 2);
    distance = Math.max(distance, size.y);
    distance *= offset;

    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();


    // Isometric view: place the camera along an equal (±1, 1, ±1) diagonal from
    // the model center (~35.26° elevation). Try all four horizontal diagonals and
    // measure how far each travels before hitting a wall; pick the most open one.
    // This keeps the camera clear of the model's own wall AND of partition walls
    // between adjacent rooms — a room bounding box can't distinguish those, so a
    // box-derived direction could cross a dividing wall into the next room.
    const desiredDistance = distance * 1.2;

    const candidateDirections = [
      new Vector3(1, 1, 1),
      new Vector3(-1, 1, 1),
      new Vector3(1, 1, -1),
      new Vector3(-1, 1, -1),
    ].map((d) => d.normalize());

    let isoDirection = candidateDirections[0];
    let endDistance = desiredDistance;

    const roomModel = ModelController.GetRoomModel(this.scene);
    if (roomModel) {
      let bestClearance = -Infinity;

      for (const dir of candidateDirections) {
        const clearance = this.measureWallClearance(center, dir, roomModel);
        if (clearance > bestClearance) {
          bestClearance = clearance;
          isoDirection = dir;
        }
        // A direction that clears the desired fit distance is good enough.
        if (clearance > desiredDistance) break;
      }

      // If even the most open diagonal hits a wall nearer than the desired fit
      // distance, pull the camera in to 90% of that clearance so it never ends
      // up inside or beyond the wall.
      if (Number.isFinite(bestClearance)) {
        endDistance = Math.min(desiredDistance, bestClearance * 0.9);
      }
    }

    const endPosition = center.clone().add(
      isoDirection.clone().multiplyScalar(endDistance)
    );

    const startPosition = camera.position.clone();
    const startQuaternion = camera.quaternion.clone();
    const startTarget = controls.target.clone();

    camera.position.copy(endPosition);
    controls.target.copy(center);
    controls.update();
    const endQuaternion = camera.quaternion.clone();

    camera.position.copy(startPosition);
    camera.quaternion.copy(startQuaternion);
    controls.target.copy(startTarget);

    controls.enabled = false;
    this.controlsManager.isCameraAnimating = true;

    const progress = { t: 0 };
    const tween = new Tween(progress)
      .to({ t: 1 }, 2000)
      .easing(Easing.Cubic.InOut)
      .onUpdate(() => {

        camera.position.lerpVectors(startPosition, endPosition, progress.t);
        camera.quaternion.copy(startQuaternion).slerp(endQuaternion, progress.t);
        controls.target.lerpVectors(startTarget, center, progress.t);
      })
      .onComplete(() => {

        camera.position.copy(endPosition);
        camera.quaternion.copy(endQuaternion);
        controls.target.copy(center);
        this.controlsManager.isCameraAnimating = false;
        controls.update();
        controls.enabled = true;
      });

    this.tweenGroup.add(tween);
    tween.start();
  }

  /**
   * Handles double-click events on the canvas to focus the camera on a double-clicked object.
   *
   * @private
   * @param {any} e - The double-click event.
   * @returns {void}
   */
  private onDoubleClick(e: any) {

    const rect = this.rendererManager.renderer.domElement.getBoundingClientRect();
    const mouse = new Vector2();
    const raycaster = new Raycaster();
    raycaster.camera = this.camera; // required — Sprite.raycast() needs this or it throws

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    const selectableObjects: Object3D[] = [];
    this.scene.traverse((child) => {
      if ((child as any).userData?.selectable === SelectableState.TRUE && child.parent?.name !== RequiredStrings.FURNITURE_GROUP) {
        selectableObjects.push(child);
      }
    });

    const filteredChildren = selectableObjects.filter(
      child => child.name !== RequiredStrings.TRANSFORM_CONTROLS_GIZMO_HELPER
    );

    const intersects = raycaster.intersectObjects(filteredChildren, true);

    if (!intersects.length) return;

    // Find the top-level model if meshes are nested
    let obj = intersects[0].object;

    while (obj.parent && obj.parent !== this.scene) {
      obj = obj.parent;
    }

    if (obj.name === RequiredStrings.ROOM_MODEL) {
      return;
    }

    let orbitControls = this.controlsManager.getControl(ControlTypes.ORBIT);

    this.fitCameraToObjectIsometric(this.camera, orbitControls, obj);
  };

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
  private raycastToCubeCenter(cube: Mesh, camera: Camera) {
    const roomModel = ModelController.GetRoomModel(this.scene);
    if (!roomModel) return;

    cube.updateMatrixWorld(true);

    const cubeWorldCenter = new Vector3();
    cube.getWorldPosition(cubeWorldCenter);

    const direction = new Vector3()
      .subVectors(cubeWorldCenter, camera.position)
      .normalize();

    const raycaster = new Raycaster();
    raycaster.set(camera.position, direction);
    raycaster.camera = camera; // required — Sprite.raycast() needs this or it throws

    // Intersect ONLY with the room model to avoid interference from furniture or gizmos
    const intersects = raycaster
      .intersectObject(roomModel, true)
      .filter((hit) => !this.isLabelHit(hit.object));

    if (intersects.length > 0 && intersects[0].object === cube) {
      if (cube.parent) {
        cube.parent.visible = false;
        const wallId = (cube.parent as any).wall_id;
        if (wallId) {
          this.scene.traverse((obj) => {
            if (obj.userData && obj.userData.wallId === wallId) {
              obj.visible = false;
            }
          });
        }
      }
    }
    else {
      if (cube.parent) {
        cube.parent.visible = true;
        const wallId = (cube.parent as any).wall_id;
        if (wallId) {
          this.scene.traverse((obj) => {
            if (obj.userData && obj.userData.wallId === wallId) {
              obj.visible = true;
            }
          });
        }
      }
    }
  }

  /**
   * Checks if the given object is a room label.
   *
   * @private
   * @param {Object3D} object - The object to check.
   * @returns {boolean} `true` if the object is a room label, `false` otherwise.
   */
  private isLabelHit(object: Object3D): boolean {
    let current: Object3D | null = object;
    while (current) {
      if (current.userData?.type === "room-label") {
        return true;
      }
      current = current.parent;
    }
    return false;
  }


  /**
   * Positions the preview model relative to the base model and updates
   * floor detection, collision state, and preview appearance.
   */
  private positionPreviewModel(baseModel: Object3D) {
    if (this.previewModel && this.modelRoot) {
      const preview = this.previewModel as Object3D;

      this.modelRoot.updateMatrixWorld(true);
      preview.updateMatrixWorld(true);

      // World-space box: local box pushed through matrixWorld, so scale/rotation count
      const bbox = this.modelController.computePreciseLocalBox(this.modelRoot)
        .clone()
        .applyMatrix4(this.modelRoot.matrixWorld);
      if (bbox.isEmpty()) return;

      const center = bbox.getCenter(new Vector3());
      const half = bbox.getSize(new Vector3()).multiplyScalar(0.5);

      // The copy has its own extent — half of each is what keeps them flush
      const previewHalf = this.modelController.computePreciseLocalBox(preview)
        .clone()
        .applyMatrix4(preview.matrixWorld)
        .getSize(new Vector3())
        .multiplyScalar(0.5);

      const roomCenter = new Box3().setFromObject(baseModel).getCenter(new Vector3());

      // Snap to +/-X or +/-Z. x wins the tie; coincident centers fall through to +X
      const dx = roomCenter.x - center.x;
      const dz = roomCenter.z - center.z;
      let ax = 0, az = 0;
      if (Math.abs(dx) < 1e-6 && Math.abs(dz) < 1e-6) ax = 1;
      else if (Math.abs(dx) >= Math.abs(dz)) ax = Math.sign(dx) || 1;
      else az = Math.sign(dz);

      const gap = 0;
      const distance = (ax !== 0 ? half.x + previewHalf.x : half.z + previewHalf.z) + gap;

      const target = new Vector3(center.x + ax * distance, 0, center.z + az * distance);
      if (preview.parent) {
        preview.parent.updateMatrixWorld(true);
        target.applyMatrix4(new Matrix4().copy(preview.parent.matrixWorld).invert());
      }
      preview.position.x = target.x;
      preview.position.z = target.z;

      (this.previewModel as any).updateMatrixWorld(true);

      // Re-evaluate floor presence at the newly offset position using downward raycast
      if (baseModel) {
        const floorRaycaster = new Raycaster();
        floorRaycaster.camera = this.camera; // required — Sprite.raycast() needs this or it throws
        const rayStart = new Vector3(
          (this.previewModel as any).position.x,
          1000,
          (this.previewModel as any).position.z
        );
        const rayDir = new Vector3(0, -1, 0);
        floorRaycaster.set(rayStart, rayDir);

        const floorIntersects = floorRaycaster.intersectObject(baseModel, true);
        let isUnderneathFloor = false;
        for (const hit of floorIntersects) {
          const obj = hit.object;
          if ((obj as any).isFloor || obj.name.toLowerCase().includes(FloorNames.FLOOR)) {
            isUnderneathFloor = true;
            break;
          }
        }
        this.isPreviewOnFloor = isUnderneathFloor;
      }

      // Re-evaluate collision at the newly offset position
      const isColliding = this.modelController.checkPreviewCollision(this.previewModel);
      this.updatePreviewColor(isColliding || !this.isPreviewOnFloor);
    }
  }

  /**
   * Gets all placed 3D models in the 3D viewer.
   * @returns {Object3D[]} An array of all 3D models currently placed in the workspace (excluding the room model).
   * @description Gets all placed 3D models in the 3D viewer.
   * @private
   */
  private getPlacedModels(): Object3D[] {
    const glbModels: Object3D[] = [];

    this.scene.traverse((obj: Object3D) => {

      const isGroup = obj.userData.isGroup === true;

      if (obj.userData && obj.userData.isGLBModel === true && obj.name !== RequiredStrings.ROOM_MODEL && !isGroup) {
        glbModels.push(obj);
      }
    });
    return glbModels;
  }

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
  protected placeModelOnGround(model: Object3D) {
    model.updateMatrixWorld(true);

    const box = new Box3().setFromObject(model, true);

    // Move the model so the bottom of its bounding box is at y = 0
    model.position.y -= box.min.y;

    model.updateMatrixWorld(true);
  }

  /**
   * Checks whether the current model root represents the room model.
   *
   * @returns `true` if `modelRoot` exists and its name matches
   *          {@link RequiredStrings.ROOM_MODEL}; otherwise, returns `false`.
   */
  protected isModelRootEqualToRoomModel(): boolean {

    if (this.modelRoot) {
      return this.modelRoot.name === RequiredStrings.ROOM_MODEL
    }
    else {
      return false;
    }
  }

  /**
   * Handles container and window resize events.
   *
   * @public
   * @returns {void}
   * @internal
   */
  public handleResize(): void {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = window.setTimeout(() => {
      const width = this.options.width || this.container.clientWidth;
      const height = this.options.height || this.container.clientHeight;
      const aspect = width / height;

      if (this.camera instanceof PerspectiveCamera) {
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
      } else if (this.camera instanceof OrthographicCamera) {
        if (this.orthoFrustumHeight !== null) {
          this.camera.left = -this.orthoFrustumHeight * aspect;
          this.camera.right = this.orthoFrustumHeight * aspect;
          this.camera.top = this.orthoFrustumHeight;
          this.camera.bottom = -this.orthoFrustumHeight;

          this.camera.updateProjectionMatrix();
        }
      }

      this.rendererManager.renderer.setSize(width, height);
      this.postProcessingManager.UpdateSize(width, height);
    }, 2); // debounce delay
  }

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
  public async loadModel(
    url: string,
    isPreview: boolean,
    position?: Vector3,
    rotation?: Euler,
    callbacks?: ModelLoadCallbacks,
    isSelectable?: boolean,
    metadata?: { category?: string; name?: string; id?: string; price?: string; format?: string }
  ): Promise<Object3D | null> {
    if (this.isPreviewActive || this.isReplacingModel) return null;
    try {
      const baseModel = ModelController.GetRoomModel(this.scene);
      this.mainModel = await this.loadAndInitializeGLB(
        url,
        callbacks,
        isSelectable,
        metadata,
        baseModel
      );

      if (isPreview && baseModel) {

        const furnitureChildren = [...this.furnitureGroup.children];
        furnitureChildren.forEach((child) => {
          this.scene.attach(child);
        });
        this.furnitureGroup.position.set(0, 0, 0);
        this.furnitureGroup.quaternion.identity();
        this.furnitureGroup.updateMatrixWorld(true);
        if (this.modelRoot) {
          this.placeModelOnGround(this.modelRoot);
        }
        await this.handlePreviewMode(baseModel);

        return null;
      } else {
        this.checkTransform();
        const result = this.addModel(this.mainModel, position, rotation);

        if (this.isShowAllMeasurementsActive) {
          this.showAllMeasurements();
        } else if (this.isMeasurementActive) {
          this.toggleMeasurement();
        }

        // Emit modelSelected so frontend updates highlight and properties
        Events.emit(ConfiguratorEventType.MODEL_SELECTED, metadata ?? null);
        Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
        Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
 * Loads and initializes a GLB model and assigns its metadata.
 *
 * @param {string} url The URL of the GLB model to load.
 * @param {ModelLoadCallbacks | undefined} callbacks Optional callbacks invoked during model loading.
 * @param {boolean | undefined} isSelectable Indicates whether the loaded model can be selected.
 * @param {{ category?: string; name?: string; id?: string; price?: string; format?: string } | undefined} metadata
 * Optional metadata associated with the model.
 * @param {Object3D | null} baseModel The existing room model, if available.
 * @returns {Promise<Object3D>} The loaded and initialized GLB model.
 *
 * @description
 * This method loads the GLB asset, assigns a unique name and ID when
 * necessary, initializes room-model settings, and stores model metadata
 * and loading information in the model's userData.
 *
 * @private
 */
  private async loadAndInitializeGLB(
    url: string,
    callbacks: ModelLoadCallbacks | undefined,
    isSelectable: boolean | undefined,
    metadata: { category?: string; name?: string; id?: string; price?: string; format?: string; } | undefined,
    baseModel: Object3D | null
  ): Promise<Object3D> {
    const mainModel = await this.assetLoader.loadGLB(
      url,
      callbacks,
      isSelectable
    );

    this.mainModel = mainModel;
    this.lightsManager.mainModel = mainModel;

    if (!baseModel) {
      mainModel.name = RequiredStrings.ROOM_MODEL;

      if (metadata) {
        metadata.name = RequiredStrings.ROOM_MODEL;
      }

      this.addGroundPlaneForExistingLayout(mainModel);
    } else if (metadata?.id && metadata?.name) {
      const newNameAndId = this.generateUniqueModelName(
        metadata.name,
        metadata.id
      );

      mainModel.name = newNameAndId.name;
      metadata.name = newNameAndId.name;
      metadata.id = newNameAndId.id;
    }

    this.prevModelRoot = this.isModelRootEqualToRoomModel()
      ? null
      : this.modelRoot;

    this.modelRoot = mainModel;

    // Store metadata in userData
    mainModel.userData = {
      ...mainModel.userData,
      isGLBModel: true,
      metadata: metadata ?? {},
      url,
      callbacks,
      isSelectable,
    };

    return mainModel;
  }

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
  public duplicateModel(): boolean {
    if (!this.modelRoot) {
      return false;
    }

    if (this.previewModel) return false;


    if (this.modelRoot.name === RequiredStrings.FURNITURE_GROUP) {
      return this.makeCopyMultiSelect(false);
    }

    if ((this.modelRoot.userData.isGroup && this.modelRoot.userData.isGroup === true) && (this.modelRoot.userData.selectable === SelectableState.TRUE)) {
      return this.makeCopyMultiSelect(true);
    }

    this.prevModelRoot = this.isModelRootEqualToRoomModel() ? null : this.modelRoot;

    // Remove the bounding box helper from the original before cloning.
    this.modelController.removeBoundingBoxHelper();

    // clone(true) is a deep clone — it copies ALL children, including the
    // yellow LineSegments helper attached by addBoundingBoxHelper. Without
    // this step the copy gets a permanently stuck yellow box baked into it.
    const cloneModel = this.modelRoot.clone(true);

    cloneModel.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(mat => mat.clone());
        } else {
          mesh.material = mesh.material.clone();
        }


        const oldMesh = this.modelRoot?.getObjectByName(mesh.name) as Mesh;

        // Grab the material and texture directly from the old mesh and add that to new model userdata
        if (oldMesh?.userData?.originalMaterial) {
          mesh.userData.originalMaterial = oldMesh.userData.originalMaterial.clone();
          mesh.userData.originalTexture = oldMesh.userData.originalTexture;
        }
      }
    });

    cloneModel.userData = JSON.parse(JSON.stringify(this.modelRoot.userData));
    cloneModel.userData.ignoreCollisionUntilClear = true;
    const metadata = cloneModel.userData.metadata;

    if (!metadata?.id || !metadata?.name) {
      return false;
    }
    const baseName = metadata.name.replace(/_node\d+$/, "");
    const baseId = metadata.id.replace(/_node\d+$/, "");
    const newNameAndId = this.generateUniqueModelName(baseName, baseId);

    cloneModel.name = newNameAndId.name;
    metadata.name = newNameAndId.name;
    metadata.id = newNameAndId.id;

    this.modelRoot = cloneModel;

    // Directly drop the user into drag-to-place mode for every clone
    this.isCloningModel = true;
    const baseModel = ModelController.GetRoomModel(this.scene);
    this.handlePreviewMode(baseModel);

    // Override the preview position using the bounding box 
    this.positionPreviewModel(baseModel!);

    const category = this.modelRoot?.userData?.metadata?.category || "Asset";
    Events.emit(ConfiguratorEventType.CLONE, {
      title: "Pending",
      message: `Click anywhere to place the copied ${category}. Right-click or Esc to cancel.`,
      category: category,
      color: "warning",
    });
    return true;
  }

  /**
   * Loads a model from a URL and adds it to the scene
   * @param url - Model URL to load
   * @param position - Optional position
   * @param rotation - Optional rotation
   * @returns The loaded Object3D
   * @internal
   * @public
   */
  public async loadOBJ(
    url: string,
    mtl?: string,
    position?: Vector3,
    rotation?: Euler
  ): Promise<Object3D> {
    try {
      const model = await this.assetLoader.loadOBJ(url, mtl);
      return this.addModel(model, position, rotation);
    } catch (error) {
      throw error;
    }
  }

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
  public deleteModel(): boolean {

    if (!this.modelRoot) return false;


    const transformSnapshot = this.getWorldTransformSnapshot();

    const oldData = transformSnapshot ?? {};


    const newData = {
      modelNames: transformSnapshot?.models.map((model) => model.modelName) ?? [],
      isPermanentGroup: transformSnapshot?.isPermanentGroup,
      permanentGroupName: transformSnapshot?.permanentGroupName
    };

    const deleted = this.executeModelDeletion()
    if (deleted) {
      this.recordConfigureAction(ActionTypeConfigure.DELETE_MODEL, oldData, newData);
    }
    return deleted;

  }

  /**
  * Executes the deletion of the currently selected 3D model.
  * 
  * @returns {boolean}
  * true if the model was successfully deleted, otherwise false.
  * 
  * @description
  * This helper method handles the complete model deletion process, including
  * detaching transform controls, removing the model from the scene and placed
  * models list, cleaning up geometries and materials, and updating related
  * measurements and events. It can be reused for undo/redo operations.
  * @private
  */
  private executeModelDeletion(): boolean {
    // return if model in preview state
    if (this.isPreviewActive || this.previewModel) {
      return false;
    }

    if (this.controls instanceof TransformControls) {
      const transformControl = this.controls;

      transformControl.detach();

      if (this.modelRoot && (this.modelRoot.name === RequiredStrings.FURNITURE_GROUP || this.modelRoot.name.startsWith(RequiredStrings.CLONEDFURNITUREGROUP))) {
        return this.removeModelMultiSelect();
      }

      // remove from placedModels list
      if (this.modelRoot) {
        this.modelController.placedModels =
          this.modelController.placedModels.filter(
            (c) => c !== this.modelRoot
          );
      }

      // Remove the current bounding box helper
      this.modelController.removeBoundingBoxHelper();

      // Remove static collider if present 
      const oldStaticCollider =
        this.scene.getObjectByName("StaticColliderMesh");
      if (oldStaticCollider) {
        oldStaticCollider.parent?.remove(oldStaticCollider);
      }
      const wasShowAllMeasurementsActive = this.isShowAllMeasurementsActive;
      const wasMeasurementActive = this.isMeasurementActive;

      this.clearAllMeasurements();
      if (wasMeasurementActive) {
        this.isMeasurementActive = true;
      }

      // remove the actual model root
      if (this.modelRoot) {
        const category = this.modelRoot?.userData?.metadata?.category || "Model";

        // dispose geometries, materials, and textures
        this.disposeGeometryAndMaterial(this.modelRoot);
        this.scene.remove(this.modelRoot);
        this.modelRoot = null;

        if (wasShowAllMeasurementsActive) {
          this.showAllMeasurements();
        } else if (wasMeasurementActive) {
          this.isMeasurementActive = true;
        }
        Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);
        Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
        Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());

        if (!this.isReplacingModel) {
          Events.emit(ConfiguratorEventType.DELETE, {
            title: "Successful",
            message: `${category} deleted successfully!`,
            category: category,
            color: "warning",
          });
        }
        return true;
      }
    }
    return false;
  }

  /**
 * Deletes the specified 3D model object from the workspace.
 *
 * @param {THREE.Object3D} model
 * The 3D model object to be deleted.
 *
 * @returns {boolean}
 * `true` if the model was successfully deleted, `false` otherwise.
 *
 * @description
 * This method removes the specified 3D model from the workspace. It detaches
 * transform controls if attached to the model, removes it from the placed
 * models list, cleans up its bounding box helper if applicable, and disposes
 * of its geometries, materials, and textures.
 *
 * This method does not emit events or clear measurements.
 *
 * @private
 */
  private deleteModelObject(model: Object3D): boolean {
    if (!model) {
      return false;
    }


    // Detach transform controls if attached to this model
    if (
      this.controls instanceof TransformControls &&
      this.controls.object === model
    ) {
      this.controls.detach();
    }

    // Remove from placed models
    this.modelController.placedModels =
      this.modelController.placedModels.filter(
        (item) => item !== model
      );

    // Remove bounding box if this is the current model
    if (this.modelRoot === model) {
      this.modelController.removeBoundingBoxHelper();
      this.modelRoot = null;
    }

    // Dispose geometries, materials, and textures
    this.disposeGeometryAndMaterial(model);

    // Remove object from its parent
    this.scene.remove(model);

    return true;
  }

  /**
   * Exports the current configuration state
   * @internal
   * @returns The current configuration state
   * @public
   */
  public exportState(): ConfigState {
    const loadedModels = Array.from(this.models.entries()).map(
      ([id, { object, url }]) => {
        return {
          id,
          url,
          position: object.position.clone(),
          rotation: object.rotation.clone(),
          scale: object.scale.clone(),
          visible: object.visible,
        };
      }
    );

    return {
      cameraPosition: this.camera.position.clone(),
      cameraRotation: this.camera.rotation.clone(),
      loadedModels,
    };
  }

  /**
   * Imports a configuration state
   * @internal
   * @param state - The configuration state to import
   * @param modelsMap - Optional map of model objects by URL
   * @public
   */
  public importState(
    state: ConfigState,
    modelsMap?: Map<string, Object3D>
  ): void {
    // Set camera position and rotation
    this.camera.position.copy(state.cameraPosition);
    this.camera.rotation.copy(state.cameraRotation);

    this.executeModelDeletion();
    // Add models from state
    state.loadedModels.forEach((modelInfo) => {
      if (modelsMap && modelsMap.has(modelInfo.url)) {
        const model = modelsMap.get(modelInfo.url)!.clone();
        this.addModel(
          model,
          modelInfo.position,
          modelInfo.rotation,
          modelInfo.scale
        );

        if (modelInfo.visible !== undefined) {
          model.visible = modelInfo.visible;
        }
      }
    });
  }

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
  public dispose(): void {
    this.rendererManager.renderer.setAnimationLoop(null);

    window.removeEventListener(DOMEvents.RESIZE, this.handleResize.bind(this));

    this.rendererManager.renderer.domElement.removeEventListener(
      DOMEvents.KEY_DOWN,
      this.handleKeyDown
    );

    // dispose of controls
    if (this.controls) {
      this.controls.dispose();
    }

    this.executeModelDeletion();
    if (this.rendererManager.renderer.domElement.parentNode) {
      this.rendererManager.renderer.domElement.parentNode.removeChild(
        this.rendererManager.renderer.domElement
      );
    }

    this.rendererManager.renderer.dispose();
  }

  /**
   * Clears the entire scene by removing all children.
   * @public
   * @returns {void}
   * @internal
   */
  public clearScene(): void {
    // Detach and remove transform controls if present
    if (this.controls instanceof TransformControls) {
      this.controls.detach();
      let TControlsHelper = this.scene.getObjectByName(
        RequiredStrings.TRANSFORM_CONTROLS_GIZMO_HELPER
      );
      if (TControlsHelper) {
        this.scene.remove(TControlsHelper as Object3D);
      }
      this.switchControlMode(ControlTypes.ORBIT);
    }

    this.clearAllMeasurements();
    this.modelController.placedModels = [];
    this.modelRoot = null;
    this.clearHoverHighlight();

    // Remove all non-light objects
    const nonLightsandFurnitureGroup = this.scene.children.filter(
      (child) => !(child as any).isLight && child.name !== RequiredStrings.FURNITURE_GROUP
    );
    this.scene.remove(...nonLightsandFurnitureGroup);
    this.furnitureGroup.clear();
    this.furnitureGroup.position.set(0, 0, 0);
    this.furnitureGroup.quaternion.identity();
    this.furnitureGroup.updateMatrixWorld(true);

    if (this.isPreviewActive || this.previewModel) {
      this.cleanupPreview();
    }

    Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);
    Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
    Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
  }

  /**
   * Resets the configurator viewer to its initial state where the base model is loaded.
   * @returns {void}
   * @internal
   * @description
   * Clears all models and custom elements in the scene, reloads the initial base model,
   * and re-initializes tooltip hover interactions.
   * @public
   */
  public resetConfigurator(): void {
    this.clearScene();
    this.loadInitialModel();
    // dispose tooltip helper
    if (this.tooltipHelper) {
      this.tooltipHelper.dispose();
    }
    this.tooltipHelper = new TooltipOnHover(
      this.camera,
      this.scene,
      this.container,
      this.updatedProjectJSON,
      this.projectJSON
    );
  }

  /**
   * Sets the background color of the 3D viewer scene.
   * @param {number} backgroundColor The color value represented as a hexadecimal number
   * (e.g., `0xffffff` for white, `0x000000` for black).
   * @returns {void}
   * @description This method updates the background color of the 3D canvas scene dynamically.
   * @public
   */
  public setBackgroundColor(backgroundColor: number): void {
    this.scene.background = new Color(backgroundColor);
  }

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
  public async readJSONFile(
    file: File,
    onParsed?: (parsed: any) => void,
    onExpanded?: (expanded: any) => void,
    modelLoadingCallbacks?: ModelLoadCallbacks
  ): Promise<any> {
    this.projectJSON = await this.projectFileReader.parseJSONFile(file);
    if (this.projectJSON) {
      onParsed?.(this.projectJSON); // Trigger callback after parse

      let updatedProjectJSON = this.projectFileReader.expandConfigOptions(
        this.projectJSON
      );
      onExpanded?.(updatedProjectJSON); // Trigger callback after expand

      this.updatedProjectJSON = updatedProjectJSON;

      if (this.updatedProjectJSON) {
        this.tooltipHelper = new TooltipOnHover(
          this.camera,
          this.scene,
          this.container,
          this.updatedProjectJSON,
          this.projectJSON
        );
      }
      await this.loadInitialModel(modelLoadingCallbacks); // initiate the configurator by loading the base model
    }
  }

  /**
   * Gets all the configuration options to display in the frontend.
   * @public
   * @returns {Record<string, ExpandedConfigOption> | null} The expanded configuration options or null.
   * @internal
   */
  public getAllConfigOptions(): Record<string, ExpandedConfigOption> | null {
    return this.updatedProjectJSON;
  }

  /**
   * Gets the AssetLoader instance.
   * @public
   * @returns {AssetLoader} The asset loader.
   * @internal
   */
  public getAssetLoader(): AssetLoader {
    return this.assetLoader;
  }

  /**
   * Gets the configuration option by its part ID to display in the frontend.
   * @param targetPartId - The ID of the target part.
   * @returns The configuration option or undefined if not found.
   * @internal
   * @public
   */
  public getConfigOptionsByPartId(
    targetPartId: string
  ): ExpandedConfigOption | undefined {
    return this.updatedProjectJSON[targetPartId];
  }

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
  public async replaceOption(
    targetPartId: string,
    partVariantId: string
  ): Promise<void> {
    let partIdentifierProperty = this.projectJSON.partIdentifierProperty;
    let partVariantUri = this.getPartVariantUri(targetPartId, partVariantId);

    if (partVariantUri) {
      await this.modelController.replaceSwappableOption(
        targetPartId,
        partVariantUri,
        partIdentifierProperty
      );
    }
  }

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
  public applyTextureById(targetPartId: string, textureId: string): void {
    let partIdentifierProperty = this.projectJSON.partIdentifierProperty;

    let textureUri = this.getTextureUri(targetPartId, textureId);

    let configurablePart = this.modelController.getConfigurablePartById(
      targetPartId,
      partIdentifierProperty
    );

    if (configurablePart && textureUri) {
      this.modelController.applyTexture(configurablePart, textureUri);
    }
  }

  /**
   * Applies a texture to the target model or the currently selected model.
   *
   * @param {string} texUrl - The URL or file path of the texture image.
   * @param {string} [id] - The texture ID to store in model metadata.
   * @param {string | number} [price] - The texture price to store in model metadata.
   * @param {Object3D} [targetModel] - The model to update; defaults to the currently selected model.
   * @returns {void}
   * @public
   */
 public applyTextureToModel(
    texUrl: string,
    id?: string,
    price?: string | number,
    targetModel?: Object3D
  ) {
    if (typeof texUrl !== "string" || !texUrl.trim()) return;
    if (this.previewModel) return;

    const model = targetModel || this.modelRoot;

    if (!targetModel) {
      const selectedId = this.getModelId();
      if (!selectedId && (!model || model.name === RequiredStrings.ROOM_MODEL)) {
        Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);
        return;
      }
    }

    if (model && model.name !== RequiredStrings.ROOM_MODEL) {

      const oldData = {
        isOriginalMaterial: false,
        modelName: model.name,
        materialData: null,
        texUrl: model.userData.texUrl,
      }

      // Apply the texture and preserve the original material when necessary.
      oldData.isOriginalMaterial = this.applyTextureToSelectedModel(
        model,
        texUrl
      );

      const newData = {
        isOriginalMaterial: false,
        modelName: model.name,
        materialData: null,
        texUrl: texUrl,
      }

      this.recordConfigureAction(ActionTypeConfigure.UPDATE_MODEL_APPEARANCE, oldData, newData);


      // Save texture price to metadata
      if (!model.userData.metadata) model.userData.metadata = {};

      if (model.userData.metadata.isGroup) {
        model.children.forEach((child: any) => {
          if (!child.userData.metadata) child.userData.metadata = {};
          child.userData.metadata.appliedTexture = {
            price,
            id,
            url: texUrl,
          };
        });
      } else {
        model.userData.metadata.appliedTexture = {
          price,
          id,
          url: texUrl,
        };
      }

      Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
    }
  }

  /**
 * Applies a texture to the model and updates its appearance data.
 *
 * @param {Object3D} model - The model to which the texture will be applied.
 * @param {string} texUrl - The URL of the texture to apply.
 * @returns {boolean} True if the original material was saved for at least
 * one mesh during this operation; otherwise, false.
 */
  private applyTextureToSelectedModel(
    model: Object3D,
    texUrl: string
  ): boolean {
    let isOriginalMaterial = false;

    // Traverse the model and preserve the original material before applying a texture.
    model.traverse((node: any) => {
      if (node instanceof Mesh && !node.userData.hasOriginalMaterial) {
        node.userData.hasOriginalMaterial = true;

        // Save the original material for undo/restore operations.
        node.userData.originalMaterial = node.material.clone();

        // Preserve the original texture map, if available.
        node.userData.originalTexture = node.material.map
          ? node.material.map
          : null;

        isOriginalMaterial = true;
      }
    });

    // Apply the selected texture to the model.
    this.modelController.applyTexture(model, texUrl);

    // Update the stored appearance properties.
    model.userData.materialData = null;
    model.userData.texUrl = texUrl;

    return isOriginalMaterial;
  }

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
  public async updateMaterial(
    targetPartId: string,
    materialId: string
  ): Promise<void> {
    let partIdentifierProperty = this.projectJSON.partIdentifierProperty;
    let materialData = this.getMaterialProperties(targetPartId, materialId);

    if (materialData) {
      await this.modelController.updateMaterialProperties(
        targetPartId,
        materialData,
        partIdentifierProperty
      );
      if (materialData.texture) {
        let textureUri = this.getTextureUri(
          targetPartId,
          materialData.texture!
        );
        if (textureUri) {
          this.modelController.replaceTexture(
            targetPartId,
            textureUri,
            partIdentifierProperty
          );
        }
      }
    }
  }

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
  public async applyMaterialToModel(materialData: {
    color?: string | number;
    metalness?: number;
    roughness?: number;
    side?: Side;
    texture?: string;
    price?: string | number;
  }): Promise<void> {

    if (this.previewModel) return;

    const selectedId = this.getModelId();
    if (!selectedId) {
      Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);
      return;
    }

    const selected = this.modelRoot;

    if (selected && materialData && selected.name !== RequiredStrings.ROOM_MODEL) {

      const oldData = {
        isOriginalMaterial: false,
        modelName: selected.name,
        materialData: selected.userData.newMaterialData,
        texUrl: null,
      }
      // Store the original material if needed and apply the new material.
      oldData.isOriginalMaterial = this.applyModelMaterial(
        selected,
        materialData
      );

      const newData = {
        isOriginalMaterial: false,
        modelName: selected.name,
        materialData: materialData,
        texUrl: null,
      }

      this.recordConfigureAction(ActionTypeConfigure.UPDATE_MODEL_APPEARANCE, oldData, newData);


      // Save material price to metadata
      if (!selected.userData.metadata) selected.userData.metadata = {};
      selected.userData.metadata.appliedMaterial = { price: materialData.price };

      Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
    }
  }

  /**
 * Applies material properties to a model and stores its original material
 * before making any changes.
 *
 * @param {Object3D} selected - The model whose material needs to be updated.
 * @param {Object} materialData - The material properties to apply to the model.
 * @returns {boolean} True if an original material was stored for at least one
 * mesh during this operation; otherwise, false.
 */
  private applyModelMaterial(
    selected: Object3D,
    materialData: {
      color?: string | number;
      metalness?: number;
      roughness?: number;
      side?: Side;
      texture?: string;
      price?: string | number;
    }
  ): boolean {
    let isOriginalMaterial = false;

    // Traverse the model and save the original material before applying changes.
    selected.traverse((node: any) => {
      if (node instanceof Mesh && !node.userData.hasOriginalMaterial) {
        node.userData.hasOriginalMaterial = true;

        // Keep a copy of the original material so it can be restored later.
        node.userData.originalMaterial = node.material.clone();

        // Store the original texture map, if one exists.
        node.userData.originalTexture = node.material.map
          ? node.material.map
          : null;

        isOriginalMaterial = true;
      }
    });

    // Apply the supplied material properties to the selected model.
    this.modelController.updateMaterial(selected, materialData);

    // Store the applied material data for undo/redo operations.
    selected.userData.newMaterialData = materialData;

    // Clear the texture URL because the new material is not using a saved texture URL.
    selected.userData.texUrl = null;

    return isOriginalMaterial;
  }

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
  public resetMaterial(): void {
    if (!this.modelRoot) return;


    const oldData = {
      isOriginalMaterial: false,
      modelName: this.modelRoot.name,
      materialData: this.modelRoot.userData.newMaterialData,
      texUrl: null,
    }

    this.modelRoot.traverse((node: any) => {
      if (node instanceof Mesh && node.userData.originalMaterial) {
        const currentMap = node.material.map;
        node.material = node.userData.originalMaterial.clone();
        node.material.map = currentMap;
        node.material.needsUpdate = true;
      }
    });

    this.modelRoot.userData.newMaterialData = null;
    this.modelRoot.userData.texUrl = null;


    const newData = {
      isOriginalMaterial: true,
      modelName: this.modelRoot.name,
      materialData: null,
      texUrl: null,
    }

    this.recordConfigureAction(ActionTypeConfigure.UPDATE_MODEL_APPEARANCE, oldData, newData);

    if (this.modelRoot.userData?.metadata?.appliedMaterial) {
      delete this.modelRoot.userData.metadata.appliedMaterial;
      Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
    }
  }

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
  public resetTexture(): void {
    if (!this.modelRoot) return;

    const oldData = {
      isOriginalMaterial: false,
      modelName: this.modelRoot.name,
      materialData: null,
      texUrl: this.modelRoot.userData.texUrl,
    }

    this.modelRoot.traverse((node: any) => {
      if (node instanceof Mesh && node.userData.originalMaterial) {
        node.material.map = node.userData.originalTexture;
        node.material.needsUpdate = true;
      }
    });

    this.modelRoot.userData.newMaterialData = null;
    this.modelRoot.userData.texUrl = null;


    const newData = {
      isOriginalMaterial: true,
      modelName: this.modelRoot.name,
      materialData: null,
      texUrl: null,
    }

    this.recordConfigureAction(ActionTypeConfigure.UPDATE_MODEL_APPEARANCE, oldData, newData);


    if (this.modelRoot.userData?.metadata?.appliedTexture) {
      delete this.modelRoot.userData.metadata.appliedTexture;
      Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
    }
  }

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
  public modelView(camView: string): void {
    this.modelController.setModelView(camView);
  }

  /**
   * Shows or hides the base model based on the specified visibility flag.
   * Uses the model controller to update the model's visibility.
   * @param {boolean} visibility - `true` to show the model, `false` to hide it.
   * @returns {void}
   * @internal
   * @public
   */
  public setModelVisibility(visibility: boolean): void {
    if (visibility) {
      this.modelController.showModel();
    } else {
      this.modelController.hideModel();
    }
  }

  /**
   * Adjusts the camera to fit the base model within the view.
   *
   * @returns {void}
   * @internal
   * @public
   */
  public fitToView(): void {
    this.modelController.fitToView();
  }

  /**
   * Toggles autorotation of the model.
   *
   * @param {boolean} val - Pass `true` to enable autorotation, or `false` to disable it.
   * @returns {void}
   * @internal
   * @public
   */
  public setAutoRotation(val: boolean): void {
    if (!this.mainModel) {
      return;
    }

    if (val) {
      this.modelController.enableAutoRotate(this.mainModel);
    } else {
      this.modelController.disableAutoRotate();
    }
  }

  /**
   * Toggles tooltip on hover.
   *
   * @param {boolean} val - Pass `true` to enable tooltip, or `false` to disable it.
   * @returns {void}
   * @internal
   * @public
   */
  public enableTooltip(val: boolean) {
    if (val) {
      this.tooltipHelper.enable();
    } else {
      this.tooltipHelper.disable();
    }
  }

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
  public async loadEnvironmentMap(envUrl: string, intensity: number = 1.0): Promise<void> {
    await this.lightsManager.loadEnvironmentMap(
      this.rendererManager.renderer,
      envUrl,
      intensity
    );
  }

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
  public setGridVisibility(
    val: boolean,
    size?: number,
    divisions?: number,
    colorCenterLine?: ColorRepresentation,
    colorGrid?: ColorRepresentation
  ): void {
    if (val) {
      if (this.gridHelper) return;
      const baseModel = ModelController.GetRoomModel(this.scene);
      // If no size is provided, calculate from main model bounding box
      if (!size && baseModel) {
        const box = new Box3().setFromObject(baseModel);
        const modelSize = new Vector3();
        box.getSize(modelSize);
        // Take largest dimension and multiply by 3 for grid size
        size = Math.max(modelSize.x, modelSize.y, modelSize.z) * 3;
      }
      this.gridHelper = new GridHelper(
        size ?? undefined,
        divisions ?? undefined,
        colorCenterLine ?? undefined,
        colorGrid ?? undefined
      );

      this.scene.add(this.gridHelper);
    } else {
      if (!this.gridHelper) return;

      this.scene.remove(this.gridHelper);
      this.gridHelper = null;
    }
  }

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
  public switchControlMode(
    type: ControlTypes.ORBIT | ControlTypes.TRACKBALL | ControlTypes.POINTER_LOCK | ControlTypes.TRANSFORM,
  ): void {
    this.saveCameraState();


    if (this.modelRoot && this.modelRoot.name !== RequiredStrings.ROOM_MODEL) {
      if (!this.controlsManager.hasControl(type) && this.modelRoot) {
        this.controlsManager.addControl(
          type,
          type,
          this.camera,
          this.rendererManager.renderer.domElement
        );
      }
      if (type === ControlTypes.TRANSFORM && this.modelRoot) {

        this.controlsManager.setActiveControl(type, this.modelRoot!);
        this.modelController.ensureBVH(this.scene);

        let controls = this.controlsManager.getActiveControl();
        this.modelController.addBoundingBoxHelper(
          this.modelRoot as Object3D,
          "select"
        );

        if (this.previewModel) {
          (controls as TransformControls).attach(this.previewModel);
        } else {
          (controls as TransformControls).attach(this.modelRoot as Object3D);
        }
        (controls as TransformControls).setSpace("world");
        // Remove old listeners if they exist
        if (this.onObjectChangeHandler) {
          if (controls instanceof TransformControls) {
            controls.removeEventListener(
              "objectChange",
              this.onObjectChangeHandler
            );
          }
        }
        if (this.onDraggingChangedHandler) {
          if (controls instanceof TransformControls) {
            controls.removeEventListener(
              "dragging-changed",
              this.onDraggingChangedHandler
            );
          }
        }

        // Define and store new listener functions
        this.onObjectChangeHandler = () => {

          this.modelRoot?.updateWorldMatrix(true, true);
          this.scene.updateWorldMatrix(true, true);

          const wasReverted = this.modelController.checkModelCollision(
            this.modelRoot as Object3D,
            this.currentSelectedLastValidPosition,
            this.currentSelectedLastValidRotation
          );

          if (wasReverted && controls instanceof TransformControls) {
            controls.attach(this.modelRoot as Object3D);
          }

          this.modelController.updateHelper();
          if (this.isShowAllMeasurementsActive) {
            this.showAllMeasurements();
          } else if (this.isMeasurementActive) {
            this.toggleMeasurement();
          }
        };

        this.onDraggingChangedHandler = () => {
          // No need to copy position/rotation/scale anymore
        };

        // Add the new listeners
        if (controls instanceof TransformControls) {
          // Remove old listeners before adding new ones
          if (this.onObjectChangeHandler) {
            controls.removeEventListener(
              "objectChange",
              this.onObjectChangeHandler
            );
          }

          if (this.onDraggingChangedHandler) {
            controls.removeEventListener(
              "dragging-changed",
              this.onDraggingChangedHandler
            );
          }

          if (this.onMouseDownHandler) {
            controls.removeEventListener(
              "mouseDown",
              this.onMouseDownHandler
            );
          }

          if (this.onMouseUpHandler) {
            controls.removeEventListener(
              "mouseUp",
              this.onMouseUpHandler
            );
          }

          if (this.onRotationDraggingChangedHandler) {
            controls.removeEventListener(
              "dragging-changed",
              this.onRotationDraggingChangedHandler
            );
          }

          // Register listeners again
          controls.addEventListener(
            "objectChange",
            this.onObjectChangeHandler
          );

          controls.addEventListener(
            "dragging-changed",
            this.onDraggingChangedHandler
          );

          this.onMouseDownHandler = () => {
            this.previousQuaternion.copy(this.modelRoot!.quaternion);
            this.previousTransformSnapshot = this.getWorldTransformSnapshot();

          };

          this.onMouseUpHandler = () => {
            const previous = this.previousTransformSnapshot;
            if (!previous) return;

            const current = this.getWorldTransformSnapshot();
            if (!current) {
              this.previousTransformSnapshot = null;
              return;
            }

            const hasChanged =
              previous.models.length !== current.models.length ||
              previous.models.some((oldModel) => {
                const newModel = current.models.find(
                  (model) => model.modelName === oldModel.modelName
                );

                return (
                  !newModel ||
                  !oldModel.position.equals(newModel.position) ||
                  !oldModel.quaternion.equals(newModel.quaternion) ||
                  !oldModel.scale.equals(newModel.scale)
                );
              });

            if (hasChanged) {
              this.recordConfigureAction(
                ActionTypeConfigure.UPDATE_MODEL_TRANSFORM,
                previous,
                current
              );
            }

            this.previousTransformSnapshot = null;
          };

          this.onRotationDraggingChangedHandler = (event) => {
            if (event.value === false) {
              const forward = new Vector3(0, 0, 1)
                .applyQuaternion(this.modelRoot!.quaternion);

              const angle = Math.atan2(forward.x, forward.z);

              const degrees = (
                ((MathUtils.radToDeg(angle) % 360) + 360) % 360
              ).toFixed(0);

              Events.emit(
                ConfiguratorEventType.ROTATION_CHANGED,
                Number(degrees)
              );
            }
          };

          controls.addEventListener("mouseDown", this.onMouseDownHandler);
          controls.addEventListener("mouseUp", this.onMouseUpHandler);

          controls.addEventListener(
            "dragging-changed",
            this.onRotationDraggingChangedHandler
          );
        }

        const selectedMetadata = this.getModelMetadata();
        //pass selected object metaData using emmiter
        Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
      }
      else {
        this.controlsManager.setActiveControl(type);
      }
      // Initialize last valid position for the selected model
      if (this.modelRoot) {
        this.currentSelectedLastValidPosition.copy(this.modelRoot!.position);
        this.currentSelectedLastValidRotation.copy(this.modelRoot!.quaternion);
      }
      this.controls = this.controlsManager.getActiveControl();
      this.restoreCameraState();

    }
  }

  private getWorldTransformSnapshot(): ConfigureSnapshot | null {
    const root = this.modelRoot;

    if (!root) return null;

    root.updateWorldMatrix(true, true);

    const isPermanentGroup = root.userData.isPermanentGroup === true;

    // If multiple models are selected, use the children of furnitureGroup.
    // Otherwise, use the selected model itself.
    const models: Object3D[] =
      root === this.furnitureGroup ||
        root.name.startsWith(RequiredStrings.CLONEDFURNITUREGROUP) ||
        isPermanentGroup
        ? [...root.children]
        : [root];


    const snapshots: ConfigureModelSnapshot[] = models
      .filter(
        (model) =>
          model.name.trim() !== "" &&
          model.name !== RequiredStrings.TRANSFORM_CONTROLS_GIZMO_HELPER
      )
      .map((model) => {
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();

        model.updateWorldMatrix(true, false);
        model.getWorldPosition(position);
        model.getWorldQuaternion(quaternion);
        model.getWorldScale(scale);

        return {
          modelName: model.name,
          position: position,
          quaternion: quaternion,
          scale: scale,
          callbacks: model.userData.callback,
          metadata: model.userData.metadata,
          url: model.userData.url,
          isSelectable: model.userData.isSelectable,
        };
      });

    return {
      models: snapshots,
      isPermanentGroup: isPermanentGroup,
      permanentGroupName: root.name
    };
  }

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
  public setTransformMode(mode: TransformControlsMode.TRANSLATE | TransformControlsMode.ROTATE | TransformControlsMode.SCALE): void {
    if (!this.controlsManager.hasControl(ControlTypes.TRANSFORM) || !this.modelRoot) {
      return;
    }

    this.controlsManager.toggleTransformMode(mode, this.modelRoot);
  }

  /**
   * Sets the size of the transformation controls gizmo.
   *
   * @param {number} size
   * A positive number determining the size scale of the transformation gizmo. Defaults to `1`.
   * @returns {void}
   * @description This method adjusts the scale and size of the active transform controls gizmo in the 3D viewport.
   * @public
   */
  public setTransformSize(size: number): void {
    this.controlsManager.adjustTransformControlSize(size);
  }

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
  public toggleTransformAxis(axis: "x" | "y" | "z", visible: boolean): void {
    this.controlsManager.setTransformAxisVisibility(axis, visible);
  }

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
  public getModelId(): string | null {
    const controls = this.controlsManager.getActiveControl();

    if (controls instanceof TransformControls && this.modelRoot && this.modelRoot.userData.metadata) {
      let id = this.modelRoot.userData.metadata.id;
      return id || null;
    }
    return null;
  }

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
  public getModelMetadata(): any | null {
    const controls = this.controlsManager.getActiveControl();

    if (controls instanceof TransformControls && this.modelRoot) {
      if (this.modelRoot === this.furnitureGroup || this.modelRoot.name === RequiredStrings.FURNITURE_GROUP) {
        const realItemsCount = this.furnitureGroup.children.filter(c => c.type !== 'LineSegments').length;
        return {
          id: "multi_selection",
          name: `Multi-Selection (${realItemsCount} items)`,
          isMultiSelect: true,
          canGroup: realItemsCount > 1,
          count: realItemsCount,
          price: 0,
          format: "Multi-Selection",
        };
      }
      const md = this.modelRoot.userData?.metadata;
      if (md) {
        return {
          ...md,
          isGroup: !!this.modelRoot.userData?.isGroup,
        };
      }
      return null;
    }
    return null;
  }

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
  public rotateModel(
    axis: "x" | "y" | "z",
    angle: number
  ): boolean {

    if (!this.modelRoot) return false;

    if (this.modelRoot.name === RequiredStrings.ROOM_MODEL) {
      return false;
    }

    const rad = MathUtils.degToRad(angle);

    if (axis === "x") this.modelRoot.rotation.x = rad;
    if (axis === "y") this.modelRoot.rotation.y = rad;
    if (axis === "z") this.modelRoot.rotation.z = rad;

    const wasReverted = this.modelController.checkModelCollision(
      this.modelRoot,
      this.currentSelectedLastValidPosition,
      this.currentSelectedLastValidRotation
    );

    return !wasReverted;
  }

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
  public getModelRotation() {
    if (!this.modelRoot) return null;

    const forward = new Vector3(0, 0, 1)
      .applyQuaternion(this.modelRoot!.quaternion);

    const angle = Math.atan2(forward.x, forward.z);

    const degrees =
      (((MathUtils.radToDeg(angle) % 360) + 360) % 360).toFixed(0);

    const degreesNum = Number(degrees);

    Events.emit(ConfiguratorEventType.ROTATION_CHANGED, degreesNum);

    return {
      x: Math.round(MathUtils.radToDeg(this.modelRoot.rotation.x)),
      y: Math.round(degreesNum),
      z: Math.round(MathUtils.radToDeg(this.modelRoot.rotation.z)),
    };
  }

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
  public async replaceModel(
    newUri: string,
    metadata?: { name?: string; id?: string; price?: string; format?: string }
  ): Promise<boolean> {
    if (!this.modelRoot || this.isPreviewActive || this.isReplacingModel || this.modelRoot.name === RequiredStrings.FURNITURE_GROUP) return false;

    if (metadata && this.modelRoot.userData?.metadata?.id === metadata.id) {
      // Emit the event to trigger the UI toast even if we don't do any work
      Events.emit(ConfiguratorEventType.REPLACE, {
        title: "Success",
        message: `${this.modelRoot?.userData?.metadata?.category || "Asset"} replaced successfully!`,
        category: this.modelRoot?.userData?.metadata?.category || "Asset",
        color: "success",
        autoPlaced: true,
      });
      return true;
    }
    const oldModel = this.modelRoot;
    const pos = oldModel.position.clone();
    const rot = oldModel.rotation.clone();
    const quat = oldModel.quaternion.clone();
    const scale = oldModel.scale.clone();
    const wasMeasurementActive = this.isMeasurementActive;

    const removed = this.executeModelDeletion();
    if (!removed) return false;

    this.modelPendingReplacement = { object: oldModel, position: pos, rotation: rot, scale };

    const oldData = {
      modelName: oldModel.name,
      callbacks: oldModel?.userData.callback,
      metadata: oldModel?.userData.metadata,
      url: oldModel?.userData.url,
      isSelectable: oldModel?.userData.isSelectable,
    }

    await this.loadModel(newUri, false, undefined, undefined, undefined, true, metadata);
    if (!this.modelRoot) {
      this.restoreReplacedModel();
      return false;
    }

    this.modelController.placedModels.push(this.modelRoot!);

    // Reset transform for proper collider generation
    this.modelRoot.position.set(0, 0, 0);
    this.modelRoot.rotation.set(0, 0, 0);
    this.modelRoot.scale.set(1, 1, 1);
    this.modelRoot.updateMatrixWorld(true);

    // Use switchControlMode to handle collider, bounding box, and TransformControls
    this.switchControlMode(ControlTypes.TRANSFORM);

    // Restore original transform
    this.modelRoot.position.copy(pos);
    this.modelRoot.rotation.copy(rot);
    this.modelRoot.scale.copy(scale);
    this.modelRoot.updateMatrixWorld(true);

    this.placeModelOnGround(this.modelRoot);

    const newData = {
      modelName: this.modelRoot.name,
      callbacks: this.modelRoot?.userData.callback,
      metadata: this.modelRoot?.userData.metadata,
      url: this.modelRoot?.userData.url,
      isSelectable: this.modelRoot?.userData.isSelectable,
    }

    // Check collision at that position
    const isColliding = this.modelController.checkModelCollision(
      this.modelRoot,
      pos,
      quat
    );

    if (!isColliding) {
      this.disposeBackupModel();
      this.modelController.updateHelper();
      Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
      Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
      Events.emit(ConfiguratorEventType.REPLACE, {
        title: "Success",
        message: `${this.modelRoot?.userData?.metadata?.category || "Asset"} replaced successfully!`,
        category: this.modelRoot?.userData?.metadata?.category || "Asset",
        color: "success",
        autoPlaced: true,
      });

      this.recordConfigureAction("REPLACE_MODEL", oldData, newData);

      if (wasMeasurementActive) {
        this.toggleMeasurement();
      }

      return true;
    }

    // Colliding- pull the new model back out and drop it into drag-to-place preview mode
    this.modelController.placedModels = this.modelController.placedModels.filter(
      (m) => m !== this.modelRoot
    );
    this.scene.remove(this.modelRoot);

    this.isReplacingModel = true;
    const baseModel = ModelController.GetRoomModel(this.scene);
    await this.handlePreviewMode(baseModel);

    // Start the ghost where the old model used to be, instead of the default floor-center
    if (this.previewModel) {
      this.previewModel.position.x = pos.x;
      this.previewModel.position.z = pos.z;
      this.previewModel.updateMatrixWorld(true);
      this.isPreviewOnFloor = true;
    }

    const category = this.modelRoot?.userData?.metadata?.category || "Asset";
    Events.emit(ConfiguratorEventType.REPLACE, {
      title: "Pending",
      message: `This ${category} doesn't fit here.`,
      category: category,
      color: "warning",
    });

    return true;
  }

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
  public toggleMeasurement() {
    if (!this.measurementState.isActive) {
      this.clearAllMeasurements();
      this.isMeasurementActive = false;
      return false;
    }

    this.clearAllMeasurements();
    this.isMeasurementActive = true;
    this.isShowAllMeasurementsActive = false;

    let activeCollider = null;

    if (this.isPreviewActive) {
      activeCollider = this.previewModel;
    } else {
      const activeControl = this.controlsManager.getActiveControl();
      // Only apply measurement if the model has transform controls attached
      if (activeControl instanceof TransformControls && this.modelRoot) {
        activeCollider = this.modelRoot as Mesh;
      }
    }

    if (!activeCollider) return;

    this.measurementGroup = new Group();
    this.measurementGroup.name = RequiredStrings.MEASUREMENT_HELPER;
    this.scene.add(this.measurementGroup);
    this.drawMeasurementForCollider(activeCollider, this.measurementState.isWallsOnly);
    return true;
  }

  /**
   * Shows all measurements for all placed models in the 3D viewer.
   * @returns {void}
   * @description This method shows distance measurements from all placed models (plus the
   * active preview model, if present) to surrounding elements in the 3D viewer.
   * @public
   */
  public showAllMeasurements() {
    this.clearAllMeasurements();

    this.isMeasurementActive = true;
    this.isShowAllMeasurementsActive = true;
    this.measurementGroup = new Group();
    this.measurementGroup.name = RequiredStrings.MEASUREMENT_HELPER;
    this.scene.add(this.measurementGroup);

    this.modelController.placedModels.forEach((collider) => {
      this.drawMeasurementForCollider(collider);
    });

    // Also draw measurements for the preview model if preview is active
    if (this.isPreviewActive && this.previewModel && this.previewModel.visible) {
      this.drawMeasurementForCollider(this.previewModel);
    }
  }

  /**
   * Removes all active measurement helpers (lines, labels, inputs) from the viewer.
   * @returns {void}
   * @description Removes all currently visible distance measurements from the viewer.
   * @public
   */
  public clearAllMeasurements() {
    if (this.measurementGroup) {
      this.scene.remove(this.measurementGroup);

      // dispose everything in the group
      this.measurementGroup.traverse((child) => {
        if (child instanceof Line2) {
          (child.geometry as LineGeometry)?.dispose();
          (child.material as LineMaterial)?.dispose();
        } else if (child instanceof Sprite) {
          (child.material.map as Texture)?.dispose();
          child.material.dispose();
        }
      });

      this.measurementGroup = null;
    }

    //  remove active input element
    if (this.activeInput) {
      if (document.body.contains(this.activeInput)) {
        document.body.removeChild(this.activeInput);
      }
      this.activeInput = null;
    }

    this.isMeasurementActive = false;
    this.isShowAllMeasurementsActive = false;
  }

  /**
   * Initiates a Virtual Reality (VR) session.
   * @returns {void}
   * @description Enables Virtual Reality (VR) mode, allowing users to experience the 3D room
   * design in an immersive environment on supported VR headsets.
   * @public
   */
  public enableVR() {
    this.vrManager.enterVR();
  }

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
  public getModelsSummary(): { models: { id: string; name: string; unitPrice: number; quantity: number }[]; grandTotal: number } {
    const models = this.getPlacedModels();
    const summaryMap: Record<string, { id: string; name: string; unitPrice: number; quantity: number }> = {};
    let grandTotal = 0;

    models.forEach((model) => {
      const id = model.userData.metadata?.id || "unknown-id";
      const name = model.userData.metadata?.name || model.name || "Unknown";
      const rawModelPrice = model.userData.metadata?.price || 0;
      const rawTexPrice = model.userData.metadata?.appliedTexture?.price || 0;
      const rawMatPrice = model.userData.metadata?.appliedMaterial?.price || 0;

      const basePrice = (typeof rawModelPrice === "string" ? parseFloat(rawModelPrice.replace(/[^0-9.-]+/g, "")) : Number(rawModelPrice)) || 0;
      const texPrice = (typeof rawTexPrice === "string" ? parseFloat(rawTexPrice.replace(/[^0-9.-]+/g, "")) : Number(rawTexPrice)) || 0;
      const matPrice = (typeof rawMatPrice === "string" ? parseFloat(rawMatPrice.replace(/[^0-9.-]+/g, "")) : Number(rawMatPrice)) || 0;

      const unitPrice = basePrice + texPrice + matPrice;

      // If already added item, just increase its quantity
      if (summaryMap[id]) {
        summaryMap[id].quantity += 1;
      } else {
        // First time seeing this item type, so add it to list
        summaryMap[id] = {
          id: id,
          name: name,
          unitPrice: unitPrice,
          quantity: 1
        };
      }

      grandTotal += unitPrice;
    });

    return {
      models: Object.values(summaryMap),
      grandTotal: grandTotal
    };
  }

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
  public selectModelByIdAndName(id: string, name: string): boolean {
    const targetModel = this.findModelByIdAndName(id, name);

    // Validate that the object exists AND is selectable
    if (!targetModel || targetModel.userData?.selectable !== SelectableState.TRUE) {
      return false;
    }

    // Set as current selection
    this.modelRoot = targetModel;

    this.switchControlMode(ControlTypes.TRANSFORM);

    // update measurements if measurement mode is active
    if (this.isShowAllMeasurementsActive) {
      this.showAllMeasurements();
    } else if (this.isMeasurementActive) {
      this.toggleMeasurement();
    }

    // Emit modelSelected event so frontend updates
    const selectedMetadata = this.getModelMetadata();
    Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);

    return true;
  }

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
  public hoverModelByIdAndName(id: string, name: string): boolean {
    const targetModel = this.findModelByIdAndName(id, name);

    // Validate that the object exists AND is selectable
    if (!targetModel || targetModel.userData?.selectable !== SelectableState.TRUE) {
      return false;
    }

    // Clear existing hover if any
    this.clearHoverHighlight();

    // Add new hover helper
    this.hoveredCollider = targetModel;
    const helper = this.modelController.addBoundingBoxHelper(targetModel, "hover") as Object3D;
    if (helper) {
      this.hoverBoxHelper = helper;
    }

    // Emit modelHovered so frontend updates
    Events.emit(ConfiguratorEventType.MODEL_HOVERED, targetModel.userData?.metadata || null);

    return true;
  }

  /**
   * Removes the current hover highlight from any 3D model in the 3D viewer.
   * @returns {void}
   * @description This method clears the hover status by performing the following actions:
   * - Removes the wireframe box highlight of the hovered model from the 3D viewer.
   * - Emits a `modelHovered` event with `null` to notify the frontend that no object is currently hovered.
   * @public
   */
  public clearHoverHighlight(): void {
    if (this.hoverBoxHelper) {
      this.hoverBoxHelper.parent?.remove(this.hoverBoxHelper);
      this.hoverBoxHelper = null;
      this.hoveredCollider = null;
      Events.emit(ConfiguratorEventType.MODEL_HOVERED, null);
    }
  }

  /**
   * Sets the camera type between perspective and orthographic projection views.
   * @param {"perspective" | "orthographic"} type The view mode to activate (either `"perspective"` or `"orthographic"`).
   * @returns {void}
   * @public
   */
  public setCameraType(type: CameraTypes.PERSPECTIVE | CameraTypes.ORTHOGRAPHIC): void {
    if (!this.mainModel) return;
    const activeControls: string[] = [];

    if (this.controls instanceof OrbitControls && this.controls.enabled) {
      activeControls.push("OrbitControls");
    }

    if (this.controls instanceof TrackballControls && this.controls.enabled) {
      activeControls.push("TrackballControls");
    }

    if (
      this.controls instanceof PointerLockControls &&
      this.controls.isLocked
    ) {
      activeControls.push("PointerLockControls");
    }

    if (this.controls instanceof TransformControls && this.controls.enabled) {
      activeControls.push("TransformControls");
    }

    if (
      (type === CameraTypes.PERSPECTIVE && this.camera instanceof PerspectiveCamera) ||
      (type === CameraTypes.ORTHOGRAPHIC && this.camera instanceof OrthographicCamera)
    ) {
      return;
    }

    const aspect = this.container.clientWidth / this.container.clientHeight;
    const room = ModelController.GetRoomModel(this.scene);
    // 'target' to pivot around.
    const target =
      (this.controls as any)?.target?.clone() ??
      this.getBoundingBoxCenter(room as Object3D);

    // Vector from camera to target
    const offset = new Vector3().subVectors(this.camera.position, target);
    const distance = offset.length();

    let visibleHeight = 0;

    if (this.camera instanceof PerspectiveCamera) {
      const vFOV = MathUtils.degToRad(this.camera.fov);
      visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
    } else if (this.camera instanceof OrthographicCamera) {
      // Ortho height top - bottom
      visibleHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;
    }

    if (type === CameraTypes.PERSPECTIVE) {
      try {
        this.cameraManager.getCamera(CameraNames.PERSPECTIVE_CAMERA);
      } catch {
        this.cameraManager.addPerspectiveCamera(
          CameraNames.PERSPECTIVE_CAMERA,
          75,
          aspect,
          0.1,
          10000
        );
      }
      this.cameraManager.setActiveCamera(CameraNames.PERSPECTIVE_CAMERA);
    } else {
      try {
        this.cameraManager.getCamera(CameraNames.ORTHOGRAPHIC_CAMERA);
      } catch {
        const frustumSize = 5;
        this.cameraManager.addOrthographicCamera(
          CameraNames.ORTHOGRAPHIC_CAMERA,
          (-frustumSize * aspect) / 2,
          (frustumSize * aspect) / 2,
          frustumSize / 2,
          -frustumSize / 2,
          0.1,
          10000
        );
      }
      this.cameraManager.setActiveCamera(CameraNames.ORTHOGRAPHIC_CAMERA);
    }

    const newCamera = this.cameraManager.getActiveCamera();
    this.camera = newCamera;

    //apply view to the new camera
    if (newCamera instanceof PerspectiveCamera) {
      // Ortho to Perspective
      const vFOV = MathUtils.degToRad(newCamera.fov);
      const newDistance = visibleHeight / (2 * Math.tan(vFOV / 2));

      // Maintain the same direction as before
      const direction = offset.normalize();
      const newPos = target.clone().add(direction.multiplyScalar(newDistance));

      newCamera.position.copy(newPos);
      newCamera.lookAt(target);

      newCamera.aspect = aspect;
      newCamera.updateProjectionMatrix();

    } else if (newCamera instanceof OrthographicCamera) {
      // Perspective to Ortho
      const halfHeight = visibleHeight / 2;
      const halfWidth = halfHeight * aspect;

      newCamera.left = -halfWidth;
      newCamera.right = halfWidth;
      newCamera.top = halfHeight;
      newCamera.bottom = -halfHeight;

      newCamera.zoom = 1;

      newCamera.position.copy(target.clone().add(offset));
      newCamera.lookAt(target);

      newCamera.updateProjectionMatrix();

      // Store this for resize events if needed
      this.orthoFrustumHeight = halfHeight;
    }

    this.controlsManager.updateCamera(newCamera);
    (this.viewCubeGizmo as any).camera = newCamera;
    this.postProcessingManager.updateCamera(newCamera);

    this.modelController.updateCamera(newCamera, this.controls);

    // If controls invoke updates, make sure they target the same point
    if ((this.controls as any).target) {
      (this.controls as any).target.copy(target);
      (this.controls as any).update();
    }
  }

  /**
   * Stops the render loop and pauses scene updates.
   * @public
   * @returns {void}
   * @internal
   */
  public pauseRenderer(): void {
    this.rendererManager.renderer.setAnimationLoop(null);
  }

  /**
   * Resumes the default render loop and scene updates.
   * @public
   * @returns {void}
   * @internal
   */
  public resumeRenderer(): void {
    this.rendererManager.renderer.setAnimationLoop(this.defaultLoop);
  }

  /**
   * Adds an Object3D to the scene.
   * @public
   * @param {Object3D} model - The 3D model/mesh to add.
   * @param {Object3D} groundPlane - The ground plane object.
   * @returns {void}
   * @internal
   */
  public load2DTo3DMesh(model: Object3D, groundPlane: Object3D): void {
    model.name = RequiredStrings.ROOM_MODEL;
    this.mainModel = model;
    this.lightsManager.mainModel = model;
    this.modelRoot = model;
    this.scene.add(model);
    this.scene.add(groundPlane);
    this.enableShadowsOnObject(model);

    if (this.camera instanceof PerspectiveCamera) {
      this.adjustPerspectiveCamera(this.camera, model, true);
    }

    const wall_hiding_cubes: any[] = [];

    this.scene.traverse((obj) => {

      if ((obj as any).isMesh && obj.name.includes(RequiredStrings.BOUNDARY_CUBE)) {
        wall_hiding_cubes.push(obj);
      }
    });

    (this as any).wall_hiding_cubes = wall_hiding_cubes;
  }

  /**
   * Removes a 2D-to-3D generated mesh group from the scene and disposes all associated geometries and materials.
   * @public
   * @param {Group} group - The group to remove.
   * @returns {void}
   * @internal
   */
  public remove2DTo3DMesh(group: Group): void {
    group.traverse((child) => {
      if (child instanceof Mesh) {
        child.geometry.dispose();
        if (child.material instanceof Material) {
          child.material.dispose();
        }
      }
    });
    this.scene.remove(group);
  }

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
  public takeSnapshot(): string {
    const targetModel = this.mainModel || ModelController.GetRoomModel(this.scene);

    if (!targetModel) {
      this.rendererManager.renderer.render(this.scene, this.camera);
      return this.rendererManager.renderer.domElement.toDataURL("image/png");
    }

    const snapshotCamera = this.camera.clone();

    // Generic logic to fit the model in view for the snapshot
    const box = new Box3().setFromObject(targetModel);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);

    if (snapshotCamera instanceof PerspectiveCamera) {
      // Perspective Camera logic to fit model
      const fov = snapshotCamera.fov * (Math.PI / 180);
      const perspectiveViewSize = maxDim * 0.8;
      let distance = perspectiveViewSize / (2 * Math.tan(fov / 2));

      snapshotCamera.zoom = 1.2; //slight zoom-in using zoom property

      snapshotCamera.position.set(center.x + distance, center.y + distance, center.z + distance);
      snapshotCamera.near = distance / 100;
      snapshotCamera.far = distance * 10;
      snapshotCamera.lookAt(center);
      snapshotCamera.updateProjectionMatrix();

    } else if (snapshotCamera instanceof OrthographicCamera) {
      //Orthographic Camera logic to fit model
      const aspect = this.container.clientWidth / this.container.clientHeight;

      const orthoViewSize = maxDim * 1.4;
      const halfHeight = orthoViewSize / 2;
      const halfWidth = halfHeight * aspect;

      snapshotCamera.left = -halfWidth;
      snapshotCamera.right = halfWidth;
      snapshotCamera.top = halfHeight;
      snapshotCamera.bottom = -halfHeight;

      snapshotCamera.near = -maxDim * 2;
      snapshotCamera.far = maxDim * 4;

      snapshotCamera.zoom = 1.2;

      snapshotCamera.position.set(center.x + maxDim, center.y + maxDim, center.z + maxDim);
      snapshotCamera.lookAt(center);
      snapshotCamera.updateProjectionMatrix();
    }


    // Temporarily hide UI helpers for snapshot
    const gridVisible = this.gridHelper?.visible;
    if (this.gridHelper) this.gridHelper.visible = false;

    const measurementVisible = this.measurementGroup?.visible;
    if (this.measurementGroup) this.measurementGroup.visible = false;

    const hoverVisible = this.hoverBoxHelper?.visible;
    if (this.hoverBoxHelper) this.hoverBoxHelper.visible = false;

    // If transform controls are being shown, hide them temporarily
    const isTransformActive = this.controls instanceof TransformControls;
    if (isTransformActive) {
      (this.controls as any).visible = false;
    }

    // render the scene using our adjusted snapshot camera
    this.rendererManager.renderer.render(this.scene, snapshotCamera);

    const dataUrl = this.rendererManager.renderer.domElement.toDataURL("image/png");

    // Restore helper visibility
    if (this.gridHelper) this.gridHelper.visible = !!gridVisible;
    if (this.measurementGroup) this.measurementGroup.visible = !!measurementVisible;
    if (this.hoverBoxHelper) this.hoverBoxHelper.visible = !!hoverVisible;
    if (isTransformActive) {
      (this.controls as any).visible = true;
    }

    this.rendererManager.renderer.render(this.scene, this.camera);

    return dataUrl;
  }

  /**
   * Exports the current 3D scene to a GLB file and initiates a download.
   * Waits for all assets (textures, etc.) to load before exporting.
   * @public
   * @internal
   */
  public async exportToGLB(): Promise<void> {
    try {
      // Ensure all textures are loaded to avoid "No valid image data found" error
      await this.ensureAssetsLoaded();

      const exporter = new GLTFExporter();
      const options = {
        binary: true,
        animations: [],
        includeCustomExtensions: true,
      };

      exporter.parse(
        this.scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            this.saveArrayBuffer(result, "scene.glb");
          } else {
            const output = JSON.stringify(result, null, 2);
            this.saveString(output, "scene.gltf");
          }
        },
        () => {
        },
        options
      );
    } catch (error) {
      console.error("Failed to export GLB:", error);
    }
  }

  /**
   * Sets the active paint color and finish metadata for interactive wall painting.
   *
   * @param {object} colorObj - The wall color selection.
   * @param {string} colorObj.color - The color string to apply, such as "#ffffff".
   * @param {string} colorObj.id - The selected finish ID.
   * @param {string} colorObj.name - The display name of the selected color.
   * @returns {void}
   * @public
   */
  public setWallColor(colorObj: { color: string; id: string; name: string }): void {
    this.selectedWallColor = colorObj;
  }

  /**
   * Enables or disables the interactive wall painting mode.
   *
   * @param {boolean} active Set to `true` to enable wall painting; set to `false` to disable it.
   * @returns {void}
   * @description This method sets the wall coloring mode. When active, clicking on any wall
   * in the room will apply the currently selected wall color.
   * @public
   */
  public enableWallColoringMode(active: boolean): void {
    this.isWallColoringMode = active;

    const dom = this.rendererManager.renderer.domElement;

    if (active) {
      dom.addEventListener(DOMEvents.POINTER_DOWN, this.onWallColoringClick);
    } else {
      dom.removeEventListener(DOMEvents.POINTER_DOWN, this.onWallColoringClick);
    }
  }

  /**
   * Enables or disables the interactive wall texturing mode.
   *
   * @param {boolean} active Set to `true` to enable wall texturing; set to `false` to disable it.
   * @returns {void}
   * @description This method sets the wall texturing mode. When active, clicking on any wall
   * in the room will apply the texture selected with `SetSelectedWallTexture`.
   * @public
   */
  public enableWallTextureMode(active: boolean): void {
    this.isWallTexturingMode = active;

    const dom = this.rendererManager.renderer.domElement;

    if (active) {
      dom.addEventListener(DOMEvents.POINTER_DOWN, this.onWallTexturingClick);
    }
    else {
      dom.removeEventListener(DOMEvents.POINTER_DOWN, this.onWallTexturingClick);
    }
  }

  /**
   * Enables or disables the interactive wall material reset mode.
   *
   * @param {boolean} active Set to `true` to enable wall material reset mode; set to `false` to disable it.
   * @returns {void}
   * @description This method sets the wall material reset mode. When active, clicking on any
   * wall face in the room will revert its material/color back to the wall's original base material.
   * @public
   */
  public enableWallMaterialResetMode(active: boolean): void {
    this.isWallMaterialResetMode = active;

    const dom = this.rendererManager.renderer.domElement;

    if (active) {
      dom.addEventListener(DOMEvents.POINTER_DOWN, this.onWallMaterialResetClick);
    }
    else {
      dom.removeEventListener(DOMEvents.POINTER_DOWN, this.onWallMaterialResetClick);
    }
  }

  /**
   * Sets the active texture preset for interactive wall texturing.
   *
   * @param {object} texturePreset - The wall texture selection.
   * @param {string} texturePreset.url - The URL or file path of the texture image.
   * @param {string} texturePreset.id - The selected finish ID.
   * @param {number} [texturePreset.repeatX] - The horizontal repeat factor.
   * @param {number} [texturePreset.repeatY] - The vertical repeat factor.
   * @returns {void}
   * @public
   */
  public setWallTexture(texturePreset: { url: string; id: string; repeatX?: number; repeatY?: number }): void {
    this.selectedWallTexture = texturePreset;
  }

  /**
   * Applies a solid color to all eligible wall meshes and records the appearance change.
   *
   * @param {string} hexColor - The hex color string to apply, such as "#ffffff".
   * @param {string} [finishId] - The finish ID to store with the color.
   * @returns {void}
   * @public
   */
  public applyColorToAllWalls(hexColor: string, finishId?: string): void {
    const oldData: WallAppearanceData[] = [];
    const newData: WallAppearanceData[] = [];
    this.scene.traverse((child) => {
      if (child instanceof Mesh && (child as any).wall_id && child.material.opacity !== 0) {
        const existingMaterials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        // Store the original appearance of every material
        oldData.push({
          meshId: (child as any).wall_id,
          materials: existingMaterials.map((mat, materialIndex) => ({
            materialIndex,
            url: mat.userData.textureUrl ?? "",
            repeatX: mat.userData.repeatX ?? 1,
            repeatY: mat.userData.repeatY ?? 1,
            color: mat.userData.color ?? null,
          })),
        });

        const newMaterials = existingMaterials.map(() => {

          const newMat = new MeshStandardMaterial({
            color: hexColor,
            roughness: 0.7,
            side: DoubleSide,
          });
          newMat.userData.textureUrl = "";
          newMat.userData.repeatX = 1;
          newMat.userData.repeatY = 1;
          newMat.userData.color = `#${new Color(hexColor).getHexString()}`;
          newMat.userData.finishUrl = `#${new Color(hexColor).getHexString()}`;
          if (finishId !== undefined) {
            newMat.userData.finishId = finishId;
          }

          return newMat;
        });

        // Store the new appearance of every material
        newData.push({
          meshId: (child as any).wall_id,
          materials: newMaterials.map((mat, materialIndex) => ({
            materialIndex,
            url: mat.userData.textureUrl,
            repeatX: mat.userData.repeatX,
            repeatY: mat.userData.repeatY,
            color: mat.userData.color,
          })),
        });

        // dispose old material(s) AND any textures they were holding
        existingMaterials.forEach((mat) => {
          if (mat instanceof MeshStandardMaterial || mat instanceof MeshBasicMaterial) {
            mat.map?.dispose();
          }
          mat.dispose();
        });

        child.material = Array.isArray(child.material) ? newMaterials : newMaterials[0];
      }
    });
    this.record3DAction(ActionType3D.UPDATE_WALL_APPEARANCE, oldData, newData)
  }

  /**
   * Loads a texture and applies it to all eligible wall meshes.
   *
   * @param {object} texturePreset - The texture and finish settings to apply.
   * @param {string} texturePreset.url - The URL or file path of the texture image.
   * @param {string} [texturePreset.id] - The finish ID to store with the texture.
   * @param {number} [texturePreset.repeatX=2] - The horizontal repeat factor before scaling by wall dimensions.
   * @param {number} [texturePreset.repeatY=2] - The vertical repeat factor before scaling by wall dimensions.
   * @returns {void} Returns before the texture finishes loading and is applied.
   * @public
   */
  public applyTextureToAllWalls(texturePreset: {
    url: string;
    id?: string;
    repeatX?: number;
    repeatY?: number;
  }): void {

    const loader = new TextureLoader();


    loader.load(texturePreset.url, (tex) => {
      tex.wrapS = MirroredRepeatWrapping;
      tex.wrapT = MirroredRepeatWrapping;
      tex.colorSpace = SRGBColorSpace;

      const oldData: WallAppearanceData[] = [];
      const newData: WallAppearanceData[] = [];

      this.scene.traverse((child) => {
        if (child instanceof Mesh && (child as any).wall_id && child.material.opacity !== 0) {
          const existingMaterials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          // Store the original appearance of every material
          oldData.push({
            meshId: (child as any).wall_id,
            materials: existingMaterials.map((mat, materialIndex) => ({
              materialIndex,
              url: mat.userData.textureUrl ?? "",
              repeatX: mat.userData.repeatX ?? 1,
              repeatY: mat.userData.repeatY ?? 1,
              color: mat.userData.color ?? null,
            })),
          });

          child.geometry.computeBoundingBox();
          const bbox = child.geometry.boundingBox;

          const size = new Vector3();
          if (bbox) {
            bbox.getSize(size);
          }

          const repeatX = texturePreset.repeatX ?? 2;
          const repeatY = texturePreset.repeatY ?? 2;

          const newMaterials = existingMaterials.map(() => {
            const wallTex = tex.clone();

            wallTex.repeat.set(
              repeatX * (size.x || 1),
              repeatY * (size.y || 1)
            );

            wallTex.needsUpdate = true;

            const newMat = new MeshStandardMaterial({
              map: wallTex,
              // side: DoubleSide,
              roughness: 0.7,
            });
            newMat.userData.textureUrl = texturePreset.url;
            newMat.userData.finishUrl = texturePreset.url;
            if (texturePreset.id !== undefined) {
              newMat.userData.finishId = texturePreset.id;
            }
            newMat.userData.repeatX = repeatX;
            newMat.userData.repeatY = repeatY;
            newMat.userData.color = null;

            return newMat;
          });

          // Store the new appearance of every material
          newData.push({
            meshId: (child as any).wall_id,
            materials: newMaterials.map((mat, materialIndex) => ({
              materialIndex,
              url: mat.userData.textureUrl,
              repeatX: mat.userData.repeatX,
              repeatY: mat.userData.repeatY,
              color: mat.userData.color,
            })),
          });

          // dispose old material(s) AND any textures they were holding
          existingMaterials.forEach((mat) => {
            if (mat instanceof MeshStandardMaterial || mat instanceof MeshBasicMaterial) {
              mat.map?.dispose();
            }
            mat.dispose();
          });

          child.material = Array.isArray(child.material) ? newMaterials : newMaterials[0];
        }
      });

      this.record3DAction(ActionType3D.UPDATE_WALL_APPEARANCE, oldData, newData)
    });
  }

  /**
   * Resets all walls in the 3D viewer to their original colors and textures.
   * @returns {void}
   * @description This method immediately reverts any custom colors or textures applied to
   * any walls in the 3D viewer, restoring them to their original default material state.
   * @public
   */
  public resetWalls(): void {

    const oldData: WallAppearanceData[] = [];
    const newData: WallAppearanceData[] = [];

    this.scene.traverse((child) => {
      if (!(child instanceof Mesh) || !(child as any).wall_id) {
        return;
      }

      const existingMaterials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      // Store the original appearance of every material
      oldData.push({
        meshId: (child as any).wall_id,
        materials: existingMaterials.map((mat, materialIndex) => ({
          materialIndex,
          url: mat.userData.textureUrl ?? "",
          repeatX: mat.userData.repeatX ?? 1,
          repeatY: mat.userData.repeatY ?? 1,
          color: mat.userData.color ?? null,
        })),
      });



      if (!this.restoreDefaultMaterial(child)) {
        return;
      }
      const newMaterials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      newData.push({
        meshId: (child as any).wall_id,
        materials: newMaterials.map((mat, materialIndex) => ({
          materialIndex,
          url: mat.userData.textureUrl,
          repeatX: mat.userData.repeatX,
          repeatY: mat.userData.repeatY,
          color: mat.userData.color,
        })),
      });
    });

    this.record3DAction(ActionType3D.UPDATE_WALL_APPEARANCE, oldData, newData)
  }

  /**
   * Applies a solid color to all floor surfaces, clears their textures, and records the appearance change.
   *
   * @param {string} hexColor - The hex color string to apply, such as "#ffffff".
   * @param {string} id - The floor finish ID to store on the room group.
   * @returns {void}
   * @public
   */
  public applyColorToAllFloors(hexColor: string, id: string): void {
    const currentData = this.getCurrentFloorTexture();

    const oldData: MaterialAppearanceData = {
      materialIndex: 0,
      url: currentData.url,
      repeatX: currentData.repeatX,
      repeatY: currentData.repeatY,
      color: currentData.color,
    }

    this.applyColorToFloorMeshes(hexColor)

    const roomGroup = this.scene.getObjectByName("room_model");
    if (roomGroup) {
      (roomGroup as any).floorFinishId = id;
    }

    const newData: MaterialAppearanceData = {
      materialIndex: 0,
      url: "",
      repeatX: 1,
      repeatY: 1,
      color: `#${new Color(hexColor).getHexString()}`,
    };


    this.record3DAction(ActionType3D.UPDATE_FLOOR_APPEARANCE, oldData, newData)

  }

  /**
 * Applies the specified color to all floor meshes.
 *
 * @param {string} hexColor - The hexadecimal color value to apply to the floor meshes.
 * @returns {void}
 * @private
 */
  private applyColorToFloorMeshes(hexColor: string): void {
    this.scene.traverse((child) => {
      if (
        child instanceof Mesh &&
        ((child as any).isFloor ||
          child.name.toLowerCase().includes(FloorNames.FLOOR))
      ) {
        const mat = Array.isArray(child.material)
          ? child.material[0]
          : child.material;

        if (
          mat instanceof MeshStandardMaterial ||
          mat instanceof MeshBasicMaterial
        ) {
          const newMat = mat.clone();

          const defaultMat = Array.isArray(child.userData.defaultMaterial)
            ? child.userData.defaultMaterial[0]
            : child.userData.defaultMaterial;

          if (mat !== defaultMat) {
            mat.map?.dispose();
            mat.dispose();
          }

          newMat.color.set(hexColor);
          newMat.map = null;
          newMat.needsUpdate = true;

          // Store solid-color state
          newMat.userData.textureUrl = "";
          newMat.userData.repeatX = 1;
          newMat.userData.repeatY = 1;
          newMat.userData.color = `#${new Color(hexColor).getHexString()}`;

          if (Array.isArray(child.material)) {
            const newMaterials = [...child.material];
            newMaterials[0] = newMat;
            child.material = newMaterials;
          } else {
            child.material = newMat;
          }
        }
      }
    });
  }

  /**
   * Loads a texture for all floor surfaces and records the floor finish selection.
   *
   * @param {object} texturePreset - The texture and finish settings to apply.
   * @param {string} texturePreset.url - The URL or file path of the texture image.
   * @param {string} texturePreset.id - The floor finish ID to store on the room group.
   * @param {number} [texturePreset.repeatX=1] - The horizontal repeat factor before floor texture scaling.
   * @param {number} [texturePreset.repeatY=1] - The vertical repeat factor before floor texture scaling.
   * @returns {void} Returns before the texture finishes loading and is applied.
   * @public
   */
  public applyTextureToAllFloors(texturePreset: { url: string; id: string; repeatX?: number; repeatY?: number }): void {
    const currentData = this.getCurrentFloorTexture();

    const oldData: MaterialAppearanceData = {
      materialIndex: 0,
      url: currentData.url,
      repeatX: currentData.repeatX,
      repeatY: currentData.repeatY,
      color: currentData.color,
    }

    this.applyTextureToFloorMeshes(texturePreset);

    const roomGroup = this.scene.getObjectByName("room_model");
    if (roomGroup) {
      (roomGroup as any).floorFinishId = texturePreset.id ?? texturePreset.url;
    }

    const newData: MaterialAppearanceData = {
      materialIndex: 0,
      url: texturePreset.url,
      repeatX: texturePreset.repeatX ?? 1,
      repeatY: texturePreset.repeatY ?? 1,
      color: null,
    }

    this.record3DAction(ActionType3D.UPDATE_FLOOR_APPEARANCE, oldData, newData)
  }

  /**
 * Applies the specified texture preset to all floor meshes.
 *
 * @param {{ url: string; repeatX?: number; repeatY?: number }} texturePreset -
 * The texture preset containing the texture URL and optional repeat values
 * along the X and Y axes.
 * @returns {void}
 * @private
 */
  private applyTextureToFloorMeshes(
    texturePreset: { url: string; repeatX?: number; repeatY?: number },
  ): void {
    const loader = new TextureLoader();
    loader.load(texturePreset.url, (tex) => {
      tex.wrapS = MirroredRepeatWrapping;
      tex.wrapT = MirroredRepeatWrapping;
      tex.colorSpace = SRGBColorSpace;

      this.scene.traverse((child) => {
        if (child instanceof Mesh && ((child as any).isFloor || child.name.toLowerCase().includes(FloorNames.FLOOR))) {
          const floorTex = tex.clone();

          // Floors use ShapeGeometry whose UV coordinates naturally scale with the physical size of the room.
          // Therefore, we MUST NOT multiply by size.x/size.y, otherwise we double-scale the texture.
          const baseRepeat = 0.009;
          const scaledRepeat = baseRepeat / 0.01;

          const repeatX = (texturePreset.repeatX ?? 1) * scaledRepeat;
          const repeatY = (texturePreset.repeatY ?? 1) * scaledRepeat;

          floorTex.repeat.set(repeatX, repeatY);
          floorTex.needsUpdate = true;

          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          if (mat instanceof MeshStandardMaterial || mat instanceof MeshBasicMaterial) {
            const newMat = mat.clone();
            const defaultMat = Array.isArray(child.userData.defaultMaterial) ? child.userData.defaultMaterial[0] : child.userData.defaultMaterial;

            //dispose the older texture before application of new one
            if (mat !== defaultMat) {
              if (mat.map && mat.map !== floorTex) {
                mat.map.dispose();
              }
              mat.dispose();
            }

            newMat.map = floorTex;
            newMat.color.setHex(0xffffff);
            newMat.needsUpdate = true;

            // Store the original texture information
            newMat.userData.textureUrl = texturePreset.url;
            newMat.userData.repeatX = texturePreset.repeatX ?? 1;
            newMat.userData.repeatY = texturePreset.repeatY ?? 1;

            if (Array.isArray(child.material)) {
              const newMaterials = [...child.material];
              newMaterials[0] = newMat;
              child.material = newMaterials;
            } else {
              child.material = newMat;
            }
          }
        }
      });

    });

  }

  /**
 * Retrieves the current floor texture configuration.
 *
 * @returns {{ url: string, repeatX: number, repeatY: number, color: string | null }}
 * An object containing the texture URL, repeat values along the X and Y axes,
 * and the floor color, if specified.
 *
 * @private
 */
  private getCurrentFloorTexture(): {
    url: string;
    repeatX: number;
    repeatY: number;
    color: string | null;
  } {
    let currentTexture: {
      url: string;
      repeatX: number;
      repeatY: number;
      color: string | null;
    } = {
      url: "",
      repeatX: 1,
      repeatY: 1,
      color: null,
    };

    this.scene.traverse((child) => {
      if (!(child instanceof Mesh)) return;

      const isFloor =
        (child as any).isFloor ||
        child.userData?.isFloor ||
        child.name.toLowerCase().includes("floor");

      if (!isFloor) return;

      const mat = Array.isArray(child.material)
        ? child.material[0]
        : child.material;

      if (
        !(mat instanceof MeshStandardMaterial) &&
        !(mat instanceof MeshBasicMaterial)
      ) {
        return;
      }

      if (mat.map) {
        // Texture is applied
        currentTexture = {
          url: mat.userData?.textureUrl ?? "",
          repeatX: mat.userData?.repeatX ?? 1,
          repeatY: mat.userData?.repeatY ?? 1,
          color: null,
        };
      } else {
        // Solid color is applied
        currentTexture = {
          url: "",
          repeatX: 1,
          repeatY: 1,
          color:
            mat.userData?.color ??
            `#${mat.color.getHexString()}`,
        };
      }
    });

    return currentTexture;
  }
  /**
   * Resets all floors in the 3D viewer to their original colors and textures.
   * @returns {void}
   * @description This method immediately reverts any custom colors or textures applied to
   * the floors in the 3D viewer, restoring them to their original default material state.
   * @public
   */
  public resetFloor(): void {
    const currentData = this.getCurrentFloorTexture();

    const oldData: MaterialAppearanceData = {
      materialIndex: 0,
      url: currentData.url,
      repeatX: currentData.repeatX,
      repeatY: currentData.repeatY,
      color: currentData.color,
    }
    this.scene.traverse((child) => {
      if (child instanceof Mesh && ((child as any).isFloor || child.name.toLowerCase().includes(FloorNames.FLOOR))) {
        this.restoreDefaultMaterial(child);
      }
    });

    const roomGroup = this.scene.getObjectByName("room_model");
    if (roomGroup) {
      (roomGroup as any).floorFinishId = null;
    }

    const changedData = this.getCurrentFloorTexture();

    const newData: MaterialAppearanceData = {
      materialIndex: 0,
      url: changedData.url,
      repeatX: changedData.repeatX,
      repeatY: changedData.repeatY,
      color: changedData.color,
    }

    this.record3DAction(ActionType3D.UPDATE_FLOOR_APPEARANCE, oldData, newData)
  }

  /**
   * Enables or disables the post-processing manager pass.
   *
   * @public
   * @param {boolean} enable - Whether to enable post-processing.
   * @returns {void}
   */
  public enablePostProcessing(enable: boolean): void {
    this.isPostProcessingActive = enable;
    // this.enableEnvMap(enable);
  }

  /**
   * Enables or disables keyboard shortcuts for model operations (duplicate, delete).
   *
   * @param {boolean} enabled - True to enable keyboard shortcuts, false to disable.
   * @returns {void}
   * @public
   */
  public enableKeyboardShortcuts(enabled: boolean): void {
    const domElement = this.rendererManager?.renderer?.domElement;
    if (!domElement) return;

    if (enabled) {
      domElement.setAttribute("tabindex", "0");
      domElement.style.outline = "none";
      domElement.addEventListener(DOMEvents.KEY_DOWN, this.handleKeyDown);
    } else {
      domElement.removeEventListener(DOMEvents.KEY_DOWN, this.handleKeyDown);
    }
  }

  /**
   * Enables or disables the automatic wall hiding feature.
   * @param {boolean} enabled Pass `true` to enable automatic wall hiding; pass `false` to disable it and make all walls visible.
   * @returns {void}
   * @description This method toggles whether walls that obstruct the view into the room are
   * automatically hidden or faded out. When disabled (`false`), all walls and
   * their associated fixtures (such as doors and windows) are immediately restored to full visibility.
   * @public
   */
  public enableWallHiding(enabled: boolean): void {
    this.isWallHidingEnabled = enabled;
    if (!enabled) {
      // raycastToCubeCenter hides walls by setting cube.parent.visible = false.
      // restoreAllWalls only fixes opacity, so we must explicitly restore visibility here.
      this.wall_hiding_cubes.forEach((cube) => {
        if (cube.parent) {
          cube.parent.visible = true;
        }
      });
      this.restoreAllWalls();

      // raycastToCubeCenter also hides door/window models (objects with userData.wallId)
      // by setting obj.visible = false. Restore them here so they appear immediately
      // without requiring a second click or camera movement.
      this.scene.traverse((obj) => {
        if (obj.userData && obj.userData.wallId) {
          obj.visible = true;
        }
      });
    }
  }

  /**
   * Checks if a model is currently selected and has active transformation controls attached to it.
   * @returns {boolean}
   * Returns `true` if a model is selected and transformation controls are active; otherwise, returns `false`.
   * @description This method checks the current state of the workspace. It returns `true` if
   * a model is selected and the move/rotate/scale handles are currently active and attached to it.
   * @public
   */
  public isModelSelected(): boolean {
    const controls = this.controlsManager.getActiveControl();
    return controls instanceof TransformControls && this.modelRoot !== null;
  }

  /**
   * Creates a permanent group from the current furniture items.
   * The items are grouped together and the new group becomes selected.
   *
   * @param customName Optional name for the new group.
   * @returns true if the group was created, otherwise false.
   */
  public createPermanentGroup(customName?: string): boolean {

    // collect items to group
    let itemsToGroup: Object3D[] = [];
    if (this.modelRoot === this.furnitureGroup && this.furnitureGroup.children.length > 0) {
      itemsToGroup = [...this.furnitureGroup.children];
    }

    const transformSnapshot = this.getWorldTransformSnapshot();


    const permanentGroupName = customName || `Group ${Math.floor(Math.random() * 1000)}`

    const group = this.createGroupFromChildren(
      itemsToGroup,
      permanentGroupName
    );


    if (!group) {
      return false;
    }

    const newData = {
      models: transformSnapshot ?? {},
      permanentGroupName: permanentGroupName
    }

    const oldData = {
      permanentGroupName: permanentGroupName,
    };

    this.recordConfigureAction(ActionTypeConfigure.CREATE_PERMANENT_GROUP, oldData, newData);


    Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
    const selectedMetadata = this.getModelMetadata();
    Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);

    return true;
  }

  /**
 * Creates a group from the provided child objects while preserving their world transforms.
 * Calculates the combined bounding box center, attaches the children to the new group,
 * and updates their selectable state and group metadata.
 *
 * @param {Object3D[]} itemsToGroup - The child objects to include in the group.
 * @param {string} [customName] - Optional custom name for the new group.
 * @returns {Group | null} The created group, or null if fewer than two children are provided.
 */
  private createGroupFromChildren(
    itemsToGroup: Object3D[],
    customName?: string
  ): Group | null {
    if (itemsToGroup.length < 2) {
      return null;
    }

    // Compute combined bounding box center in world space
    const combinedBox = new Box3();
    itemsToGroup.forEach((item) => {
      combinedBox.expandByObject(item);
    });
    const center = new Vector3();
    combinedBox.getCenter(center);

    // Re-attach children to scene first to clear furnitureGroup transform
    itemsToGroup.forEach((child) => {
      this.scene.attach(child);
    });
    this.furnitureGroup.position.set(0, 0, 0);
    this.furnitureGroup.quaternion.identity();
    this.furnitureGroup.updateMatrixWorld(true);

    // Create new permanent Group
    const groupName = customName || `Group ${Math.floor(Math.random() * 1000)}`;
    const group = new Group();
    group.name = groupName;
    group.position.copy(center);
    group.updateMatrixWorld(true);

    // Attach children while preserving world transforms
    itemsToGroup.forEach((child) => {
      group.attach(child);
      if (!child.userData) child.userData = {};
      child.userData.selectable = SelectableState.FALSE;
    });

    group.userData = {
      isGroup: true,
      isPermanentGroup: true,
      isGLBModel: true,
      selectable: SelectableState.TRUE,
      metadata: {
        id: `group_${Date.now()}`,
        name: groupName,
        isGroup: true,
        price: 0,
        format: "Group",
      },
    };

    this.scene.add(group);

    this.modelRoot = group;
    this.modelController.addBoundingBoxHelper(group, "select");

    this.switchControlMode(ControlTypes.TRANSFORM);

    const currentMode = this.controlsManager.getCurrentTransformMode();

    this.setTransformMode(currentMode);
    this.setTransformControlsAxes(currentMode);

    return group;
  }

  /**
   * Disbands/ungroups the currently selected permanent group or target group.
   *
   * @returns true if group was successfully disbanded, false otherwise.
   */
  public ungroupSelectedGroup(): boolean {
    const group = this.modelRoot?.userData?.isGroup ? this.modelRoot : null;
    if (!group || !group.userData?.isGroup) {
      return false;
    }

    const transformSnapshot = this.getWorldTransformSnapshot();

    const newData = {
      permanentGroupName: group.name,
    };
    const oldData = {
      models: transformSnapshot ?? {},
      permanentGroupName: group.name
    }

    const success = this.ungroupGroup(group);

    if (!success) {
      return false;
    }
    this.recordConfigureAction(ActionTypeConfigure.UNGROUP_PERMANENT_GROUP, oldData, newData);

    Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
    Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);

    return true;
  }

  /**
  * Ungroups the provided group and restores its children to the scene.
  * Updates the selectable state of the children and removes the group.
  * If the group is currently selected, removes its bounding box helper and
  * detaches the transform controls.
  *
  * @param {Object3D} group - The group to ungroup.
  * @returns {boolean} True if the group was successfully ungrouped,
  * otherwise false.
  */
  private ungroupGroup(group: Object3D): boolean {
    if (!group.userData?.isGroup) {
      return false;
    }

    const children = [...group.children];
    children.forEach((child) => {
      this.scene.attach(child);
      if (!child.userData) child.userData = {};
      child.userData.selectable = SelectableState.TRUE;
    });

    this.scene.remove(group);

    if (this.modelRoot === group) {
      this.modelController.removeBoundingBoxHelper();
      this.modelRoot = null;

      const controls = this.controlsManager.getActiveControl();

      if (controls instanceof TransformControls) {
        controls.detach();
      }
    }

    return true;
  }

  /**
   * Returns the hierarchy of selectable objects in the scene.
   *
   * Furniture items are added as top-level objects, while selectable groups
   * include their child objects. The room model and non-selectable objects
   * are excluded.
   *
   * @returns An array of selectable object hierarchy nodes.
   */
  public getSelectableObjectHierarchy(): HierarchyNode[] {
    const topLevelModels: HierarchyNode[] = [];

    this.scene.children.forEach((obj: Object3D) => {

      // furnitureGroup: add its children directly to the result
      if (obj.name === RequiredStrings.FURNITURE_GROUP) {
        obj.children.forEach((child: Object3D) => {
          topLevelModels.push({
            name: child.userData.metadata.name,
            id: child.userData.metadata.id,
            children: []
          });
        });

        return;
      }

      // Ignore room model
      if (obj.name === RequiredStrings.ROOM_MODEL) {
        return;
      }

      // Only include selectable objects
      if (obj.userData?.selectable !== SelectableState.TRUE) {
        return;
      }

      // Group object
      if (obj.userData?.isGroup === true) {
        const groupObj: HierarchyNode = {
          name: obj.userData.metadata.name,
          id: obj.userData.metadata.id,
          children: []
        };

        obj.children.forEach((child: Object3D) => {
          if (!(child as any).isLine || (child as any).isLine !== true || (child as any).isLineSegments !== true) {
            groupObj.children.push({
              name: child.userData.metadata.name,
              id: child.userData.metadata.id,
              children: []
            });
          }
        });

        topLevelModels.push(groupObj);
        return;
      }

      // Normal object / GLB model
      topLevelModels.push({
        name: obj.userData.metadata.name,
        id: obj.userData.metadata.id,
        children: []
      });
    });

    return topLevelModels;
  }
  /**
   * Gets the current wall height applied to the walls in the 3D viewer.
   *
   * @returns {number} Current wall height in design units.
   * @description This method returns the current wall height applied to the walls in the 3D viewer.
   * The returned value can be used to display the current wall height in the UI.
   * @public
  */
  public getWallHeight(): number {
    let wallHeight = 0;

    this.scene.traverse((child) => {
      if (wallHeight > 0) {
        return;
      }
      if (child instanceof Mesh && (child as any).wall_id) {
        wallHeight = (child as any).currentHeight ?? 0;
      }
    });

    return Math.round(wallHeight / (Config.WORLD_SCALE as number));
  }

  /**
   * Gets the current geometry dimensions of doors and windows  in the 3D viewer.
   * @returns {{
   *   door: {
   *     width: number;
   *     height: number;
   *   };
   *   window: {
   *     width: number;
   *     height: number;
   *   };
   * }} Current door and window dimensions in design units.
   *
   * @description Return the current opening width and height
   * @public
   */
  public getCurrentOpeningDimensions(): {
    door: { width: number; height: number };
    window: { width: number; height: number; windowFloorDistance: number };
  } {
    let doorWidth = 0;
    let doorHeight = 0;
    let windowWidth = 0;
    let windowHeight = 0;
    let windowFloorDistance = 0;

    const visit = (node: Object3D): boolean => {
      if (node instanceof Mesh && (node as any).wall_id) {
        const wall = node as any;

        if (doorWidth === 0 && Array.isArray(wall.doors) && wall.doors.length > 0) {
          const door = wall.doors[0];
          doorWidth = door.width ?? 0;
          doorHeight = door.height ?? 0;
        }

        if (windowWidth === 0 && Array.isArray(wall.windows) && wall.windows.length > 0) {
          const window = wall.windows[0];
          windowWidth = window.width ?? 0;
          windowHeight = window.height ?? 0;
          windowFloorDistance = window.windowFloorDistance ?? 0;
        }
      }

      // Both found -> signal caller to stop.
      if (doorWidth !== 0 && windowWidth !== 0) {
        return true;
      }

      for (const child of node.children) {
        if (visit(child)) {
          return true;
        }
      }

      return false;
    };

    visit(this.scene);

    return {
      door: { width: doorWidth, height: doorHeight },
      window: { width: windowWidth, height: windowHeight, windowFloorDistance: windowFloorDistance },
    };
  }

  /**
     * Updates the height of all doors in the 3D viewer to the specified value.
     *
     * @param {number} height - The new door height in design units.
     * @returns {boolean} `true` if successful, or `false` if the specified height violates boundary constraints relative to wall height.
     * @description Updates the height of all doors in the 3D viewer to the specified height.
     * @public
     */
  public updateDoorHeight(height: number): boolean {
    const wallHeight = this.getWallHeight();
    if (height < 0 || height > wallHeight - 10) {
      return false;
    }

    const doorHeight = this.getCurrentOpeningDimensions().door.height;


    const oldData = { doorHeight: doorHeight };
    const newData = { doorHeight: height };

    this.record3DAction(ActionType3D.GEOMETRY_UPDATE, oldData, newData)

    this.wallBuilder?.recreateWalls({ doorHeight: height });
    return true;
  }

  /**
   * Updates the width of all doors in the 3D viewer to the specified value.
   *
   * @param {number} width - The new door width in design units.
   * @returns {boolean} `true` if successful, or `false` if the width is less than 0 or exceeds `Opening3DConstraints.MAX_DOOR_WIDTH`.
   * @description Updates the width of all doors in the 3D viewer to the specified width.
   * @public
   */
  public updateDoorWidth(width: number): boolean {
    if (width < 0 || width > (Opening3DConstraints.MAX_DOOR_WIDTH as number)) {
      return false;
    }

    const doorWidth = this.getCurrentOpeningDimensions().door.width;


    const oldData = { doorWidth: doorWidth }
    const newData = { doorWidth: width }


    this.record3DAction(ActionType3D.GEOMETRY_UPDATE, oldData, newData)

    this.wallBuilder?.recreateWalls({ doorWidth: width });
    return true;
  }

  /**
   * Updates the height of all windows in the 3D viewer to the specified value.
   *
   * @param {number} height - The new window height in design units.
   * @returns {boolean} `true` if successful, or `false` if the height violates boundary constraints relative to wall height.
   * @description Updates the height of all windows in the 3D viewer to the specified height.
   * @public
   */
  public updateWindowHeight(height: number): boolean {
    const wallHeight = this.getWallHeight();
    if (height < 0 || height >= wallHeight - 10) {
      return false;
    }
    const windowHeight = this.getCurrentOpeningDimensions().window.height;

    const oldData = { windowHeight: windowHeight }
    const newData = { windowHeight: height };



    this.record3DAction(ActionType3D.GEOMETRY_UPDATE, oldData, newData)
    this.wallBuilder?.recreateWalls({ windowHeight: height });
    return true;
  }
  /**
   * Updates the width of all windows in the 3D viewer to the specified value.
   *
   * @param {number} width - The new window width in design units.
   * @returns {boolean} `true` if successful, or `false` if the width is less than 0 or exceeds `Opening3DConstraints.MAX_WINDOW_WIDTH`.
   * @description Updates the width of all windows in the 3D viewer to the specified width.
   * @public
   */
  public updateWindowWidth(width: number): boolean {
    if (width < 0 || width > (Opening3DConstraints.MAX_WINDOW_WIDTH as number)) {
      return false;
    }
    const windowWidth = this.getCurrentOpeningDimensions().window.width;


    const oldData = { windowWidth: windowWidth }
    const newData = { windowWidth: width }

    this.record3DAction(ActionType3D.GEOMETRY_UPDATE, oldData, newData)

    this.wallBuilder?.recreateWalls({ windowWidth: width });
    return true;
  }

  /**
   * Updates the distance between the floor and the bottom edge of all windows.
   *
   * @param {number} distance - The new distance between the floor and the bottom edge of the windows in design units.
   * @returns {boolean} `true` if successful, or `false` if the distance is negative or causes the top of the window to exceed wall height constraints.
   * @description Updates the vertical position of all windows by setting their distance from the floor to the specified value in design units.
   * @public
   */
  public updateWindowFloorDistance(distance: number): boolean {
    const wallHeight = this.getWallHeight();
    const windowHeight = this.getCurrentOpeningDimensions().window.height;

    const maxDistance = wallHeight - windowHeight - 10;

    if (distance < 0 || distance > maxDistance) {
      return false;
    }

    const windowFloorDistance = this.getCurrentOpeningDimensions().window.windowFloorDistance;


    const oldData = { windowFloorDistance: windowFloorDistance }
    const newData = { windowFloorDistance: distance }

    this.record3DAction(ActionType3D.GEOMETRY_UPDATE, oldData, newData)

    this.wallBuilder?.recreateWalls({ windowFloorDistance: distance });
    return true;
  }

  /**
   * Updates the height of all 3D wall meshes in the 3D viewer.
   *
   * @param {number} height - The new wall height in design units.
   * @returns {boolean} `true` if the height was successfully updated, or `false` if the height is invalid (e.g., non-positive or insufficient for current door/window dimensions).
   * @description Updates the height of all walls in the 3D viewer to the specified height. The existing wall configuration, including wall metadata, doors, windows, and boundary information, is preserved while the wall geometry is rebuilt and trimmed.
   * @public
   */
  public updateWallHeight(height: number): boolean {
    if (height <= 0) {
      return false;
    }

    const openingDimensions = this.getCurrentOpeningDimensions();

    const maxOpeningHeight = Math.max(
      openingDimensions.door.height,
      openingDimensions.window.height + openingDimensions.window.windowFloorDistance
    );
    if (height < maxOpeningHeight + 10) {
      return false;
    }

    // Record history only after the texture has loaded and been applied.

    const oldData = { wallHeight: this.getWallHeight() }
    const newData = { wallHeight: height }

    this.record3DAction(ActionType3D.GEOMETRY_UPDATE, oldData, newData);

    this.wallBuilder?.recreateWalls({ wallHeight: height });
    this.roomAnnotationManager.refreshAnnotationByWallHeight(height);
    return true;
  }

  /**
   * Sets the room annotation display mode.
   *
   * @param {AnnotationMode} mode The room annotation display mode.
   * @returns {void}
   */
  public setRoomAnnotationMode(mode: AnnotationMode): void {
    this.roomAnnotationManager.setMode(mode);
  }

  /**
   * Gets the current room annotation display mode.
   *
   * @returns {AnnotationMode} The active annotation mode.
   */
  public getRoomAnnotationMode(): AnnotationMode {
    return this.roomAnnotationManager.mode;
  }

  /**
 * Performs the undo operation by reverting the most recent action.
 */
  protected async undo3DMode() {
    const data = this.design3DHistoryManager.undo();
    switch (data?.action) {
      case ActionType3D.GEOMETRY_UPDATE:
        if (data.data?.oldData !== undefined) {
          this.wallBuilder?.recreateWalls(data.data.oldData);
          if (data.data?.oldData.wallHeight) {
            this.roomAnnotationManager.refreshAnnotationByWallHeight(data.data.oldData.wallHeight);
          }
        }
        break;
      case ActionType3D.UPDATE_FLOOR_APPEARANCE:
        {
          const oldData = data.data.oldData as MaterialAppearanceData | undefined;
          if (!oldData) return;
          if (oldData.color && oldData.url === "") {
            // Restore solid color
            this.applyColorToFloorMeshes(oldData.color);
          } else if (oldData.url) {
            // Restore texture
            this.applyTextureToFloorMeshes(
              {
                url: oldData.url,
                repeatX: oldData.repeatX,
                repeatY: oldData.repeatY,
              }
            );
          }
          break;
        }
      case ActionType3D.UPDATE_WALL_APPEARANCE:
        {
          const oldData = data.data.oldData as WallAppearanceData[] | undefined;
          if (!oldData) return;
          this.restoreWallAppearance(oldData)
          break;
        }
      default:
        console.warn("No handler for undo action:", data?.action);
    }
  }

  /**
 * Performs the redo operation by restoring the previously undone action.
 */
  protected async redo3DMode() {
    const data = this.design3DHistoryManager.redo();
    switch (data?.action) {
      case ActionType3D.GEOMETRY_UPDATE:
        if (data.data?.newData !== undefined) {
          this.wallBuilder?.recreateWalls(data.data.newData);
          if (data.data?.newData.wallHeight) {
            this.roomAnnotationManager.refreshAnnotationByWallHeight(data.data.newData.wallHeight);
          }
        }
        break;
      case ActionType3D.UPDATE_FLOOR_APPEARANCE:
        {
          const newData = data.data.newData as MaterialAppearanceData | undefined;
          if (!newData) return;
          if (newData.color && newData.url === "") {
            this.applyColorToFloorMeshes(newData.color);
          } else if (newData.url) {
            // Restore texture
            this.applyTextureToFloorMeshes(
              {
                url: newData.url,
                repeatX: newData.repeatX,
                repeatY: newData.repeatY,
              }
            );
          }
          break;
        }
      case ActionType3D.UPDATE_WALL_APPEARANCE:
        {
          const newData = data.data.newData as WallAppearanceData[] | undefined;
          if (!newData) return;

          this.restoreWallAppearance(newData)
          break;
        }
      default:
        console.warn("No handler for undo action:", data?.action);
    }
  }

  /**
 * Clears the undo and redo history for 3D design operations.
 *
 * @returns {void}
 */
  public clearDesign2DHistory() {
    this.design3DHistoryManager.clearHistory();
  }

  /**
 * Records a 3D design action in the history manager for undo and redo operations.
 *
 * @param {string} actionType - The type of 3D design action performed.
 * @param {object} oldData - The state of the 3D design before the action was performed.
 * @param {object} newData - The state of the 3D design after the action was performed.
 * @returns {void}
 */
  protected record3DAction(
    actionType: string,
    oldData: {},
    newData: {},
  ) {
    const historyEntry: HistoryEntry3D = {
      action: actionType,
      data: {
        oldData,
        newData,
      },
    };

    this.design3DHistoryManager.push(historyEntry);
  }

  /**
   * Restores the appearance of wall meshes using the provided appearance data.
   *
   * @private
   * @param {WallAppearanceData[]} appearanceData - The wall appearance data containing mesh identifiers and material appearance properties to restore.
   * @returns {Promise<void>} A promise that resolves when the wall appearance restoration is complete.
   */
  private async restoreWallAppearance(
    appearanceData: WallAppearanceData[]
  ): Promise<void> {

    const textureMap = await this.getTextureMap(appearanceData);


    for (const wallData of appearanceData) {
      const mesh = this.scene.getObjectByProperty("wall_id", wallData.meshId);

      if (!mesh || !(mesh instanceof Mesh)) continue;

      for (const materialData of wallData.materials) {
        const { materialIndex, url, color, repeatX, repeatY } = materialData;

        if (color && !url) {
          // Restore solid color
          this.updateColorMaterial(
            mesh,
            materialIndex,
            new Color(color)
          );
        } else if (url) {
          // Restore texture
          this.updateTextureMaterial(
            mesh,
            materialIndex,
            {
              url: url,
              texture: textureMap.get(url),
              repeatX: repeatX,
              repeatY: repeatY,
            }
          );
        }
      }
    }
  }

  /**
 * Creates a map of textures from the provided wall appearance data.
 *
 * @private
 * @param {WallAppearanceData[]} appearanceData - The wall appearance data containing mesh identifiers and material texture properties.
 * @returns {Promise<Map<string, Texture>>} A promise that resolves to a map of mesh identifiers and their corresponding textures.
 */
  private async getTextureMap(
    appearanceData: WallAppearanceData[]
  ): Promise<Map<string, Texture>> {
    const textureMap = new Map<string, Texture>();

    const urls = new Set(
      appearanceData.flatMap((wall) =>
        wall.materials
          .map(({ url }) => url)
          .filter((url): url is string => !!url)
      )
    );

    await Promise.all(
      [...urls].map(async (url) => {
        const texture = await new TextureLoader().loadAsync(url);

        texture.wrapS = MirroredRepeatWrapping;
        texture.wrapT = MirroredRepeatWrapping;
        texture.colorSpace = SRGBColorSpace;

        textureMap.set(url, texture);
      })
    );

    return textureMap;
  }

  /**
 * Undoes the most recent configuration action by retrieving its history entry
 * and restoring the previous state of the scene.
 *
 * @returns {Promise<void>} A promise that resolves when the undo operation is complete.
 */
  protected async undoConfigureMode() {
    const data = this.configureHistoryManager.undo();
    switch (data?.action) {
      case ActionTypeConfigure.LOAD_MODEL:
        {
          const oldData = data.data.oldData

          if (oldData.isPermanentGroup) {
            const mesh = this.scene.getObjectByProperty("name", oldData.permanentGroupName);
            if (!mesh || !(mesh instanceof Object3D)) return;
            this.deleteModelObject(mesh);
          } else {

            oldData.modelNames.forEach((modelName: string) => {
              const mesh = this.scene.getObjectByProperty("name", modelName);

              if (!mesh || !(mesh instanceof Object3D)) return;

              this.deleteModelObject(mesh);
            });
          }

          Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
          const selectedMetadata = this.getModelMetadata();
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
          Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());

          break;
        }
      case ActionTypeConfigure.UPDATE_MODEL_TRANSFORM:
        {
          const oldData = data.data.oldData as ConfigureSnapshot
          if (oldData.isPermanentGroup) {
            const mesh = this.scene.getObjectByProperty("name", oldData.permanentGroupName);

            if (!mesh || !(mesh instanceof Object3D)) return;

            this.ungroupGroup(mesh);
          }
          this.restoreTransformSnapshot(oldData);

          if (oldData.isPermanentGroup) {
            let itemsToGroup: Object3D[] = []
            oldData.models.forEach((model: ConfigureModelSnapshot) => {
              const mesh = this.scene.getObjectByProperty("name", model.modelName);
              if (!mesh || !(mesh instanceof Object3D)) return;
              itemsToGroup.push(mesh)
            });
            this.createGroupFromChildren(
              itemsToGroup,
              oldData.permanentGroupName,
            );
          }


          const selectedMetadata = this.getModelMetadata();
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);

          break;
        }
      case ActionTypeConfigure.REPLACE_MODEL:
        {
          const oldData = data.data.oldData
          const mesh = this.scene.getObjectByProperty("name", data.data.newData.modelName);
          if (!mesh) break;
          try {
            const oldModel = mesh;
            const pos = oldModel.position.clone();
            const rot = oldModel.rotation.clone();
            const scale = oldModel.scale.clone();
            this.deleteModelObject(mesh);


            const baseModel = ModelController.GetRoomModel(this.scene);
            const mainModel = await this.loadAndInitializeGLB(
              oldData.url,
              oldData.callbacks,
              oldData.isSelectable,
              oldData.metadata,
              baseModel
            );
            // Reset transform for proper collider generation
            mainModel.position.set(0, 0, 0);
            mainModel.rotation.set(0, 0, 0);
            mainModel.scale.set(1, 1, 1);
            mainModel.updateMatrixWorld(true);

            // Restore original transform
            mainModel.position.copy(pos);
            mainModel.rotation.copy(rot);
            mainModel.scale.copy(scale);
            mainModel.updateMatrixWorld(true);

            mainModel.name = oldData.modelName;
            mainModel.userData.metadata.name = oldData.modelName;
            mainModel.userData.metadata.id = oldData.modelName;
            oldData.metadata.name = oldData.modelName
            oldData.metadata.id = oldData.modelName

            this.scene.add(mainModel);

            Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
            const selectedMetadata = this.getModelMetadata();
            Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
          } catch (error) {
            throw error;
          }
          break;
        }
      case ActionTypeConfigure.DELETE_MODEL:
        {
          const oldData = data.data.oldData as ConfigureSnapshot
          try {
            const baseModel = ModelController.GetRoomModel(this.scene);

            let itemsToGroup: Object3D[] = []
            for (const modelData of oldData.models) {

              const mainModel = await this.loadAndInitializeGLB(
                modelData.url,
                modelData.callbacks,
                modelData.isSelectable,
                modelData.metadata,
                baseModel
              );
              this.scene.add(mainModel);
              mainModel.name = modelData.modelName;
              mainModel.userData.metadata.name = modelData.modelName;
              mainModel.userData.metadata.id = modelData.modelName;
              modelData.metadata.name = modelData.modelName
              modelData.metadata.id = modelData.modelName
              itemsToGroup.push(mainModel)

            }

            this.restoreTransformSnapshot(oldData);
            if (oldData.isPermanentGroup) {
              this.createGroupFromChildren(
                itemsToGroup,
                oldData.permanentGroupName,
              );
            }
            Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
            const selectedMetadata = this.getModelMetadata();
            Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
            Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
          } catch (error) {
            throw error;
          }
          break;
        }
      case ActionTypeConfigure.UPDATE_MODEL_APPEARANCE:
        {
          const oldData = data.data.oldData
          const mesh = this.scene.getObjectByProperty("name", oldData.modelName);
          if (!mesh || !(mesh instanceof Object3D)) return;

          if (oldData.isOriginalMaterial) {
            if (data.data.newData.materialData && data.data.newData.texUrl == null) {
              mesh.traverse((node: any) => {
                if (node instanceof Mesh && node.userData.originalMaterial) {
                  const currentMap = node.material.map;
                  node.material = node.userData.originalMaterial.clone();
                  node.material.map = currentMap;
                  node.material.needsUpdate = true;
                }
              });
            } else {
              mesh.traverse((node: any) => {
                if (node instanceof Mesh && node.userData.originalMaterial) {
                  node.material.map = node.userData.originalTexture;
                  node.material.needsUpdate = true;
                }
              });
            }
          } else {
            if (oldData.materialData && oldData.texUrl == null) {
              this.applyModelMaterial(mesh, oldData.materialData);
            } else {
              this.applyTextureToSelectedModel(mesh, oldData.texUrl);
            }
          }
          break;
        }
      case ActionTypeConfigure.CREATE_PERMANENT_GROUP:
        {
          const oldData = data.data.oldData
          const mesh = this.scene.getObjectByProperty("name", oldData.permanentGroupName);

          if (!mesh || !(mesh instanceof Object3D)) return;

          this.ungroupGroup(mesh);

          Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);

          break;
        }
      case ActionTypeConfigure.UNGROUP_PERMANENT_GROUP:
        {
          const oldData = data.data.oldData
          let itemsToGroup: Object3D[] = []
          oldData.models.models.forEach((model: ConfigureModelSnapshot) => {
            const mesh = this.scene.getObjectByProperty("name", model.modelName);
            if (!mesh || !(mesh instanceof Object3D)) return;
            itemsToGroup.push(mesh)
          });
          this.createGroupFromChildren(
            itemsToGroup,
            oldData.permanentGroupName,
          );

          Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
          const selectedMetadata = this.getModelMetadata();
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
          break;
        }
      default:
        console.warn("No handler for undo action:", data?.action);
    }
  }

  /**
 * Redoes the most recent undone configuration action by retrieving
 * its history entry and applying the corresponding changes to the scene.
 *
 * @returns {Promise<void>} A promise that resolves when the redo operation is complete.
 */
  protected async redoConfigureMode() {
    const data = this.configureHistoryManager.redo();
    switch (data?.action) {
      case ActionTypeConfigure.LOAD_MODEL:
        {
          const newData = data.data.newData as ConfigureSnapshot
          try {
            const baseModel = ModelController.GetRoomModel(this.scene);

            let itemsToGroup: Object3D[] = []
            for (const modelData of newData.models) {
              const mainModel = await this.loadAndInitializeGLB(
                modelData.url,
                modelData.callbacks,
                modelData.isSelectable,
                modelData.metadata,
                baseModel
              );
              this.scene.add(mainModel);
              mainModel.name = modelData.modelName;
              mainModel.userData.metadata.name = modelData.modelName;
              mainModel.userData.metadata.id = modelData.modelName;
              modelData.metadata.name = modelData.modelName
              modelData.metadata.id = modelData.modelName
              itemsToGroup.push(mainModel)
            }

            this.restoreTransformSnapshot(newData);
            if (newData.isPermanentGroup) {
              this.createGroupFromChildren(
                itemsToGroup,
                newData.permanentGroupName,
              );
            }
            Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
            const selectedMetadata = this.getModelMetadata();
            Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
            Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());

          } catch (error) {
            throw error;
          }
          break;
        }
      case ActionTypeConfigure.UPDATE_MODEL_TRANSFORM:
        {
          const newData = data.data.newData as ConfigureSnapshot

          if (newData.isPermanentGroup) {
            const mesh = this.scene.getObjectByProperty("name", newData.permanentGroupName);

            if (!mesh || !(mesh instanceof Object3D)) return;

            this.ungroupGroup(mesh);
          }

          this.restoreTransformSnapshot(newData);

          if (newData.isPermanentGroup) {
            let itemsToGroup: Object3D[] = []
            newData.models.forEach((model: ConfigureModelSnapshot) => {
              const mesh = this.scene.getObjectByProperty("name", model.modelName);
              if (!mesh || !(mesh instanceof Object3D)) return;
              itemsToGroup.push(mesh)
            });
            this.createGroupFromChildren(
              itemsToGroup,
              newData.permanentGroupName,
            );
          }
          const selectedMetadata = this.getModelMetadata();
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);

          break;
        }
      case ActionTypeConfigure.REPLACE_MODEL:
        {
          const newData = data.data.newData
          const mesh = this.scene.getObjectByProperty("name", data.data.oldData.modelName);
          if (!mesh) break;

          try {
            const oldModel = mesh;
            const pos = oldModel.position.clone();
            const rot = oldModel.rotation.clone();
            const scale = oldModel.scale.clone();
            this.deleteModelObject(mesh);


            const baseModel = ModelController.GetRoomModel(this.scene);
            const mainModel = await this.loadAndInitializeGLB(
              newData.url,
              newData.callbacks,
              newData.isSelectable,
              newData.metadata,
              baseModel
            );
            // Reset transform for proper collider generation
            mainModel.position.set(0, 0, 0);
            mainModel.rotation.set(0, 0, 0);
            mainModel.scale.set(1, 1, 1);
            mainModel.updateMatrixWorld(true);

            // Restore original transform
            mainModel.position.copy(pos);
            mainModel.rotation.copy(rot);
            mainModel.scale.copy(scale);
            mainModel.updateMatrixWorld(true);

            mainModel.name = newData.modelName;
            mainModel.userData.metadata.name = newData.modelName;
            mainModel.userData.metadata.id = newData.modelName;
            newData.metadata.name = newData.modelName
            newData.metadata.id = newData.modelName

            this.scene.add(mainModel);

            Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
            const selectedMetadata = this.getModelMetadata();
            Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
          } catch (error) {
            throw error;
          }
          break;
        }
      case ActionTypeConfigure.DELETE_MODEL:
        {
          const newData = data.data.newData
          if (newData.isPermanentGroup) {
            const mesh = this.scene.getObjectByProperty("name", newData.permanentGroupName);
            if (!mesh || !(mesh instanceof Object3D)) return;
            this.deleteModelObject(mesh);
          } else {
            newData.modelNames.forEach((modelName: string) => {
              const mesh = this.scene.getObjectByProperty("name", modelName);

              if (!mesh || !(mesh instanceof Object3D)) return;

              this.deleteModelObject(mesh);
            });
          }

          Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
          const selectedMetadata = this.getModelMetadata();
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
          Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());

          break;
        }
      case ActionTypeConfigure.UPDATE_MODEL_APPEARANCE:
        {
          const newData = data.data.newData
          const mesh = this.scene.getObjectByProperty("name", newData.modelName);
          if (!mesh || !(mesh instanceof Object3D)) return;

          if (newData.isOriginalMaterial) {
            if (data.data.oldData.materialData && data.data.oldData.texUrl == null) {
              mesh.traverse((node: any) => {
                if (node instanceof Mesh && node.userData.originalMaterial) {
                  const currentMap = node.material.map;
                  node.material = node.userData.originalMaterial.clone();
                  node.material.map = currentMap;
                  node.material.needsUpdate = true;
                }
              });
            } else {
              mesh.traverse((node: any) => {
                if (node instanceof Mesh && node.userData.originalMaterial) {
                  node.material.map = node.userData.originalTexture;
                  node.material.needsUpdate = true;
                }
              });
            }
          } else {
            if (newData.materialData && newData.texUrl == null) {
              this.applyModelMaterial(mesh, newData.materialData);
            } else {
              this.applyTextureToSelectedModel(mesh, newData.texUrl);
            }
          }
          break;
        }
      case ActionTypeConfigure.CREATE_PERMANENT_GROUP:
        {
          const newData = data.data.newData
          let itemsToGroup: Object3D[] = []
          newData.models.models.forEach((model: ConfigureModelSnapshot) => {
            const mesh = this.scene.getObjectByProperty("name", model.modelName);
            if (!mesh || !(mesh instanceof Object3D)) return;
            itemsToGroup.push(mesh)
          });
          this.createGroupFromChildren(
            itemsToGroup,
            newData.permanentGroupName,
          );

          Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
          const selectedMetadata = this.getModelMetadata();
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, selectedMetadata);
          break;
        }
      case ActionTypeConfigure.UNGROUP_PERMANENT_GROUP:
        {
          const newData = data.data.newData
          const mesh = this.scene.getObjectByProperty("name", newData.permanentGroupName);

          if (!mesh || !(mesh instanceof Object3D)) return;

          this.ungroupGroup(mesh);

          Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
          Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);

          break;
        }
      default:
        console.warn("No handler for undo action:", data?.action);
    }
  }


  private restoreTransformSnapshot(
    snapshot: ConfigureSnapshot
  ): void {


    // Detach furnitureGroup children and preserve their world transforms.
    const children = [...this.furnitureGroup.children];



    children.forEach((child) => {
      this.scene.attach(child);
    });

    // Reset the furnitureGroup transform.
    this.furnitureGroup.position.set(0, 0, 0);
    this.furnitureGroup.quaternion.identity();
    this.furnitureGroup.updateMatrixWorld(true);

    // Detach transform controls and hide the gizmo helper.
    const controls = this.controlsManager.getActiveControl();

    if (controls instanceof TransformControls) {
      controls.detach();
    }

    const transformHelper = this.scene.getObjectByName(
      RequiredStrings.TRANSFORM_CONTROLS_GIZMO_HELPER
    );

    if (transformHelper) {
      transformHelper.visible = false;
    }

    // Remove the existing selection bounding box.
    this.modelController.removeBoundingBoxHelper();


    // Restore the saved transformations.
    snapshot.models.forEach((modelSnapshot) => {
      const model = this.scene.getObjectByProperty(
        "name",
        modelSnapshot.modelName
      );


      if (!model) return;

      model.position.copy(modelSnapshot.position);
      model.quaternion.copy(modelSnapshot.quaternion);
      model.scale.copy(modelSnapshot.scale);

      model.updateMatrix();
      model.updateWorldMatrix(false, true);
    });


    this.scene.updateMatrixWorld(true);
    this.modelController.updateHelper();
  }

  /**
 * Records a configuration action in the history manager for undo and redo operations.
 *
 * @param {string} actionType - The type of configuration action performed.
 * @param {object} oldData - The data state before the action was performed.
 * @param {object} newData - The data state after the action was performed.
 * @returns {void}
 */
  protected recordConfigureAction(
    actionType: string,
    oldData: {},
    newData: {},
  ) {
    const historyEntry: HistoryEntry3D = {
      action: actionType,
      data: {
        oldData,
        newData,
      },
    };

    this.configureHistoryManager.push(historyEntry);
  }

  /**
 * Clears the undo and redo history for configuration operations.
 *
 * @returns {void}
 */
  public clearConfigureHistory(): void {
    this.configureHistoryManager.clearHistory();
  }

  /**
   * set undo-redo limit to stack
   * @param {Number} limit
   */
  public setUndoRedoLimit(limit: number) {
    this.configureHistoryManager?.setUndoRedoLimit(limit);
    this.design3DHistoryManager?.setUndoRedoLimit(limit);
  }

  /**
     * Get the undo-redo-satck size
     * @returns {Undo_Redo_Payload} payload
     */
  public getUndoRedoPayload(): Undo_Redo_Payload {
    if (this.currentMode == CurrentMode.THREE_D_MODE) {
      return this.design3DHistoryManager?.getUndoRedoPayload() || { undo_stack_size: 0, redo_stack_size: 0 };
    } else if (this.currentMode == CurrentMode.CONFIGURE_MODE) {
      return this.configureHistoryManager?.getUndoRedoPayload() || { undo_stack_size: 0, redo_stack_size: 0 };
    }
    return { undo_stack_size: 0, redo_stack_size: 0 };
  }

  /**
  * Enables or disables collision detection when models are manipulated (moved or rotated).
  * @public
  * @param {boolean} isActive - `true` to enable collision checking and automatic revert; `false` to allow freely overlapping placement.
  * @returns {void}
  */
  public setCollisionStatus(isActive: boolean): void {
    this.collisionSystem.isCollisionActive = isActive;
  }

  /**
  * Sets the length measurement unit used for distance measurement overlays in the 3D scene.
  * Re-toggles measurement display so that existing measurement labels update to the new unit.
  * @internal
  */
  public set3DMeasurementUnit(): void {
    this.toggleMeasurement();
  }

  
  /**
   * Exports the 3D configuration of selectable objects in the scene.
   *
   * Traverses the first-level children of the scene:
   * - If an object has userData.selectable = "true" and !userData.isGroup,
   *   stores its transformation matrix against its userData.metadata.id.
   * - If an object has userData.selectable = "true" and userData.isGroup === true,
   *   stores its transformation matrix, name, and children array against its userData.metadata.id.
   *
   * @returns An object containing the exported 3D configuration mapped against metadata IDs.
   */
  public export3DConfig(): Record<string, any> {
    const config: Record<string, any> = {};

    this.exportModelConfigurations(config);
    this.exportRoomConfiguration(config);

    return config;
  }

  /**
   * Adds selectable models and their group children to the exported configuration.
   *
   * @param {Record<string, any>} config - The configuration to populate.
   * @returns {void}
   * @private
   */
  private exportModelConfigurations(config: Record<string, any>): void {
    this.scene.children.forEach((child: Object3D) => {
      const isSelectable =  child.userData?.selectable === SelectableState.TRUE;

      const isGroup =  child.userData?.isGroup === true;

      // Selectable non-group child
      if (isSelectable && !isGroup) {
        const id = child.userData?.metadata?.id;

        if (id) {
          child.updateMatrix();

          config[id] = {
            name: child.userData?.metadata?.name || child.name,
            matrix: child.matrix.clone(),
            children: [],
            textureUrl: child.userData?.metadata?.appliedTexture?.url,
            textureId: child.userData?.metadata?.appliedTexture?.id,
          };
        }

        return;
      }

      // Selectable group child
      if (isSelectable && isGroup) {
        const id = child.userData?.metadata?.id;

        if (id) {
          child.updateMatrix();

          const children: Array<Record<string, any>> = [];

          child.children.forEach((groupChild: Object3D) => {
            const childIsSelectable =
              groupChild.userData?.selectable === SelectableState.TRUE ||
              groupChild.userData?.selectable === SelectableState.FALSE ||
              !!groupChild.userData?.metadata?.id;

            const childIsGroup = groupChild.userData?.isGroup === true; //check is there any other group child of group

            if (childIsSelectable && !childIsGroup) {
              const childId = groupChild.userData?.metadata?.id;

              if (childId) {
                groupChild.updateMatrix();

                const childData = {
                  name: groupChild.userData?.metadata?.name || groupChild.name,
                  matrix: groupChild.matrix.clone(),
                  children: [],
                  textureUrl: groupChild.userData?.metadata?.appliedTexture?.url,
                  textureId: groupChild.userData?.metadata?.appliedTexture?.id,
                };

                children.push({
                  [childId]: childData,
                });
              }
            }
          });

          config[id] = {
            name: child.userData?.metadata?.name || child.name,
            matrix: child.matrix.clone(),
            children,
            textureUrl: child.userData?.metadata?.appliedTexture?.url,
            textureId: child.userData?.metadata?.appliedTexture?.id,
          };
        }
      }
    });
  }

  /**
   * Adds wall finishes, the floor finish, and room geometry to the exported configuration.
   *
   * @param {Record<string, any>} config - The configuration to populate.
   * @returns {void}
   * @private
   */
  private exportRoomConfiguration(config: Record<string, any>): void {
    //map to store wall info where key is string wall ID and value is wall material index, finishID, url
    const wallsMap = new Map<string, Array<{ index: number; finishId: string; url?: string }>>();

    this.scene.traverse((child: Object3D) => {
      if (!(child instanceof Mesh)) return;

      const wallId = (child as any).wall_id || (child as any).wallId || child.userData?.wallId;
      if (!wallId) return;

      if (child.name?.startsWith("boundary_cube")) return;

      if (!wallsMap.has(wallId)) {
        wallsMap.set(wallId, []);
      }

      const existingMaterials = wallsMap.get(wallId)!;
      const materialsArray = Array.isArray(child.material)
        ? child.material //single material
        : Array.from({ length: Math.max(1, child.geometry.groups.length) }, () => child.material as Material);

      //Iterate through all materials and get finishID and url
      materialsArray.forEach((mat: any, index: number) => {
        const finishId = mat?.finishId ?? mat?.userData?.finishId ?? "";
        const url = mat?.userData?.finishUrl ?? mat?.userData?.textureUrl;
        if (finishId || url) {
          const existingEntry = existingMaterials.find((m) => m.index === index);
          if (existingEntry) {
            existingEntry.finishId = finishId;
            existingEntry.url = url;
          } else {
            existingMaterials.push({ index, finishId, url });
          }
        }
      });
    });

    const walls: Array<{ id: string; materials: Array<{ index: number; finishId: string; url?: string }> }> = [];
    wallsMap.forEach((materials, id) => {
      materials.sort((a, b) => a.index - b.index);
      walls.push({
        id,
        materials,
      });
    });

    config.walls = walls;

    const roomGroup = this.scene.getObjectByName("room_model");
    if (roomGroup && (roomGroup as any).floorFinishId) {
      config.floor = {
        floorId: (roomGroup as any).floorFinishId,
      };
    }

    const wallHeight = this.getWallHeight();
    const openings = this.getCurrentOpeningDimensions();
    config.roomGeometry = {
      wallHeight,
      door: openings.door,
      window: openings.window,
    };
  }

  /**
   * Imports a 3D configuration into the scene.
   *
   * @param config - The 3D configuration object or JSON string.
   * @returns A map of loaded models and groups mapped by their keys.
   */
  public async import3DConfig(
    config: Record<string, any> | string
  ): Promise<Record<string, Object3D>> {
    //check weather the incoming parameter is string or obj, if string convert into JS obj
    const parsedConfig: Record<string, any> = typeof config === "string" ? JSON.parse(config) : config;

    const result: Record<string, Object3D> = {}; //store imported models

    //convert different possible matrix formats into a Three.js Matrix4 object
    const parseMatrix = (matrixData: any): Matrix4 => {
      const mat = new Matrix4();
      if (!matrixData) return mat;
      if (matrixData instanceof Matrix4) {
        mat.copy(matrixData);
      } else if (matrixData && Array.isArray(matrixData.elements)) {
        mat.fromArray(matrixData.elements);
      } else if (Array.isArray(matrixData)) {
        mat.fromArray(matrixData);
      }
      return mat;
    };

    //applying the saved transformation matrix to a Three.js object
    const applyMatrix = (obj: Object3D, matrixData: any): void => {
      if (!obj || !matrixData) return;
      const mat = parseMatrix(matrixData);
      mat.decompose(obj.position, obj.quaternion, obj.scale);
      obj.updateMatrix();
      obj.updateMatrixWorld(true);
    };

    //Iterate through all saved configuration entries
    for (const [key, rawObj] of Object.entries(parsedConfig)) {
      if (!rawObj || typeof rawObj !== "object") continue;

      if (key === "roomGeometry") {
        this.importRoomGeometry(rawObj);
        continue;
      }

      if (key === "floor") {
            const floorUrl = rawObj.url || (typeof rawObj.floorId === "string" && rawObj.floorId.startsWith("#") ? rawObj.floorId : undefined) || rawObj.color;
            if (floorUrl) {
              if (floorUrl.startsWith("#")) {
                this.applyColorToAllFloors?.(floorUrl, rawObj.floorId);
              } else {
                this.applyTextureToAllFloors?.({ url: floorUrl, id: rawObj.floorId, repeatX: rawObj.repeatX, repeatY: rawObj.repeatY });
              }
            }
            continue;
          }

          if (key === "walls") {
            await this.importWallConfigurations(rawObj);
            continue;
          }

          await this.importModelConfiguration(key, rawObj, result, applyMatrix);
        }

        Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
        Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());

        return result;
  }

  /**
   * Restores room geometry from an imported configuration entry.
   *
   * @param {any} geom - The saved room geometry.
   * @returns {void}
   * @private
   */
  private importRoomGeometry(geom: any): void {
    //stores only the valid geometry values that need to be restored
    const updates: {
      wallHeight?: number;
      doorWidth?: number;
      doorHeight?: number;
      windowWidth?: number;
      windowHeight?: number;
      windowFloorDistance?: number;
    } = {};

    if (typeof geom.wallHeight === "number" && geom.wallHeight > 0) {
      updates.wallHeight = geom.wallHeight;
    }
    if (geom.door && typeof geom.door === "object") {
      if (typeof geom.door.width === "number" && geom.door.width > 0) updates.doorWidth = geom.door.width;
      if (typeof geom.door.height === "number" && geom.door.height > 0) updates.doorHeight = geom.door.height;
    }
    if (geom.window && typeof geom.window === "object") {
      if (typeof geom.window.width === "number" && geom.window.width > 0) updates.windowWidth = geom.window.width;
      if (typeof geom.window.height === "number" && geom.window.height > 0) updates.windowHeight = geom.window.height;
      if (typeof geom.window.windowFloorDistance === "number") updates.windowFloorDistance = geom.window.windowFloorDistance;
    }

    //check weather there is any valid data is present in updates object
    if (Object.keys(updates).length > 0) {
      this.wallBuilder?.recreateWalls(updates);
      if (updates.wallHeight) {
        this.roomAnnotationManager.refreshAnnotationByWallHeight(updates.wallHeight);
      }
    }
  }

  /**
   * Restores wall finishes and waits for wall textures to load.
   *
   * @param {any} rawObj - The saved wall configurations.
   * @returns {Promise<void>}
   * @private
   */
  private async importWallConfigurations(rawObj: any): Promise<void> {
    if (Array.isArray(rawObj)) {
      const wallTexturePromises: Promise<void>[] = []; //array to store textures
      //rawobj only store walls related data 
      for (const wallObj of rawObj) {
        const wallMesh = this.scene.getObjectByProperty("wall_id", wallObj.id) as Mesh;
        if (wallMesh && Array.isArray(wallObj.materials)) {
          for (const matConfig of wallObj.materials) { //Loop through the materials of the wall
            if (!matConfig || matConfig.index === undefined) continue;
            const url = matConfig.url;
            if (!url) continue;

            //value starting with # is treated as a color
            if (url.startsWith("#")) {
              this.updateColorMaterial(wallMesh, matConfig.index, url, matConfig.finishId);
            } else {
              //not start with #, the function treats it as an image texture URL
              const p = new Promise<void>((resolve) => {
                const loader = new TextureLoader();
                loader.load(
                  url,
                  (tex) => {
                    this.updateTextureMaterial(wallMesh, matConfig.index, {
                      url: url,
                      id: matConfig.finishId,
                      texture: tex,
                      repeatX: matConfig.repeatX ?? 1,
                      repeatY: matConfig.repeatY ?? 1,
                    });
                    resolve();
                  },
                  undefined,
                  () => resolve()
                );
              });
              wallTexturePromises.push(p);
            }
          }
        }
      }
      if (wallTexturePromises.length > 0) {
        await Promise.all(wallTexturePromises);
      }
    }
  }

  /**
   * Restores a model or group and adds it to the import result.
   *
   * @param {string} key - The configuration entry key.
   * @param {any} objData - The saved model or group configuration.
   * @param {Record<string, Object3D>} result - The imported models and groups.
   * @param {(obj: Object3D, matrixData: any) => void} applyMatrix - Applies a saved transformation.
   * @returns {Promise<void>}
   * @private
   */
  private async importModelConfiguration(
    key: string,
    objData: any,
    result: Record<string, Object3D>,
    applyMatrix: (obj: Object3D, matrixData: any) => void
  ): Promise<void> {
    const children = Array.isArray(objData.children) ? objData.children : [];

    if (children.length === 0) {
      const modelUrl = objData.url || objData.uri;
      const textureUrl = objData.textureUrl;

      if (!modelUrl) {
        console.warn(`[import3DConfig] Skipping '${key}' as no URL/URI was provided.`);
        return;
      }

      const modelName = objData.name || key;
      const modelMetadata = {
        category: objData.modelData?.category || "",
        price: objData.modelData?.price || "",
        format: objData.modelData?.format || "gltf",
        ...objData.modelData,
        id: objData.modelData?.id || key,
        name: modelName,
      };

      const model = await this.loadModel(
        modelUrl,
        false,
        new Vector3(),
        undefined,
        undefined,
        true,
        modelMetadata
      );

      if (!model) {
        console.warn(`[import3DConfig] Failed to load model '${key}'.`);
        return;
      }

      model.name = modelName;

      if (textureUrl) {
        this.applyTextureToSelectedModel(model, textureUrl);
        if (!model.userData.metadata) model.userData.metadata = {};
        model.userData.metadata.appliedTexture = {
          url: textureUrl,
          id: objData.textureId,
        };
      }

      applyMatrix(model, objData.matrix);
      model.updateMatrixWorld(true);

      result[key] = model;
      return;
    }
    const loadedChildren: Array<{
      childObj: Object3D;
      childData: any;
    }> = [];

    for (const childEntry of children) {
      if (!childEntry || typeof childEntry !== "object") continue;

      let childId = "";
      let childData: any = null;

      const entryKeys = Object.keys(childEntry);
      if (
        entryKeys.length === 1 &&
        typeof childEntry[entryKeys[0]] === "object" &&
        (childEntry[entryKeys[0]]?.url || childEntry[entryKeys[0]]?.uri || childEntry[entryKeys[0]]?.matrix)
      ) {
        childId = entryKeys[0];
        childData = childEntry[entryKeys[0]];
      } else {
        childId = childEntry.id || childEntry.name || `child_${Date.now()}`;
        childData = childEntry;
      }

      const childUrl = childData.url || childData.uri;
      const textureUrl = childData.textureUrl || (childEntry as any).textureUrl;
      const textureId = childData.textureId || (childEntry as any).textureId;

      if (!childUrl) {
        console.warn(`[import3DConfig] Skipping child '${childId}' in '${key}' - missing url.`);
        continue;
      }

      const childName = childData.name || childId;
      const childMetadata = {
        category: childData.modelData?.category || "",
        price: childData.modelData?.price || "",
        format: childData.modelData?.format || "gltf",
        ...childData.modelData,
        id: childId,
        name: childName,
      };

      const childObj = await this.loadModel(
        childUrl,
        false,
        new Vector3(),
        undefined,
        undefined,
        false,
        childMetadata
      );

      if (!childObj) {
        console.warn(`[import3DConfig] Failed to load child '${childId}' in group '${key}'.`);
        continue;
      }

      childObj.name = childName;

      if (textureUrl) {
        this.applyTextureToSelectedModel(childObj, textureUrl);
        if (!childObj.userData.metadata) childObj.userData.metadata = {};
        childObj.userData.metadata.appliedTexture = {
          url: textureUrl,
          id: textureId,
        };
      }

      loadedChildren.push({
        childObj,
        childData,
      });
    }

    if (loadedChildren.length === 0) {
      console.warn(`[import3DConfig] Group '${key}' has no valid children loaded.`);
      return;
    }

    const groupName = objData.name || `Group ${Math.floor(Math.random() * 1000)}`;

    this.furnitureGroup.clear();
    this.furnitureGroup.position.set(0, 0, 0);
    this.furnitureGroup.quaternion.identity();
    this.furnitureGroup.scale.set(1, 1, 1);
    this.furnitureGroup.updateMatrix();
    this.furnitureGroup.updateMatrixWorld(true);

    for (const item of loadedChildren) {
      const child = item.childObj;
      this.furnitureGroup.attach(child);

      applyMatrix(child, item.childData.matrix);
      child.updateMatrixWorld(true);
      child.userData.selectable = SelectableState.FALSE;
    }

    this.furnitureGroup.updateMatrixWorld(true);
    this.modelRoot = this.furnitureGroup;

    let group: Group | null = null;

    if (loadedChildren.length >= 2) {
      const created = this.createPermanentGroup(groupName);
      if (created && this.modelRoot instanceof Group) {
        group = this.modelRoot;
      }
    }

    if (!group) {
      group = new Group();
      group.name = groupName;

      for (const item of loadedChildren) {
        const child = item.childObj;
        group.attach(child);
        child.userData.selectable = SelectableState.FALSE;
      }

      this.scene.add(group);
      this.modelRoot = group;
    }

    const groupId = objData.modelData?.id || key;
    group.name = groupName;

    group.userData = {
      ...group.userData,
      isGroup: true,
      isGLBModel: true,
      selectable: SelectableState.TRUE,
      metadata: {
        ...(group.userData?.metadata || {}),
        id: groupId,
        name: groupName,
        isGroup: true,
        price: objData.modelData?.price ?? 0,
        format: objData.modelData?.format ?? "Group",
      },
    };

    applyMatrix(group, objData.matrix);
    group.updateMatrixWorld(true);

    this.prevModelRoot = this.isModelRootEqualToRoomModel() ? null : this.modelRoot;
    this.modelRoot = group;

    result[key] = group;
  }
}