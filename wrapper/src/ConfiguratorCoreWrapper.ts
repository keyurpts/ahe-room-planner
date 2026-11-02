import {
  ConfiguratorCore,
  Events,
  RequiredStrings,
  ConfiguratorEventType,
  FloorNames,
  ModelController,
} from "three-configurator";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import {
  OBJECT_DISTANCE_UPDATED,
  MEASUREMENT_BOX_COLORS,
  MIN_MEASUREMENT_Y,
} from "./constants";
import {
  type Object3D,
  Box3Helper,
  Color,
  Vector3,
  Group,
  Euler,
  Box3,
  Vector2,
  Mesh,
} from "three";
import { AutomaticPlacement, type PlacementWall } from "./AutomaticPlacement";

/**
 * Wrapper around ConfiguratorCore.
 */
export class ConfiguratorCoreWrapper extends ConfiguratorCore {

  /**
   * First recorded 3D model in the measurement pair.
   */
  private firstMeasurementModel: Object3D | null = null;

  /**
   *  The frontend supplies this third property even though the base class omits it.
   */
  public override measurementState: ConfiguratorCore["measurementState"] & {
    isObjectToObject?: boolean;
  } = { isActive: false, isWallsOnly: false, isObjectToObject: false };

  /**
   * Flag indicating whether object-to-object measurement mode is actively rendered.
   */
  private isObjectToObjectActive = false;

  /**
   * Current pair of 3D models being measured.
   */
  private objectToObjectModels: [Object3D, Object3D] | null = null;

  /**
   * Renders bounding box helpers, distance line, arrowheads, and label sprite between two models.
   *
   * @param modelA - First model.
   * @param modelB - Second model.
   * @returns Calculated distance in scene units.
   */
  private drawObjectToObjectMeasurement(
    modelA: Object3D,
    modelB: Object3D,
  ): number | null {
    this.disposeMeasurementBoxes();
    super.clearAllMeasurements();
    this.isMeasurementActive = true;

    const boxA = this.modelController
      .computePreciseLocalBox(modelA)
      .applyMatrix4(modelA.matrixWorld);
    const boxB = this.modelController
      .computePreciseLocalBox(modelB)
      .applyMatrix4(modelB.matrixWorld);

    if (boxA.isEmpty() || boxB.isEmpty()) return null;

    this.measurementGroup = new Group();
    this.measurementGroup.name = RequiredStrings.MEASUREMENT_HELPER;
    this.scene.add(this.measurementGroup);

    // Visual bounding box wireframes for both models
    this.measurementGroup.add(
      new Box3Helper(boxA, new Color(MEASUREMENT_BOX_COLORS.MODEL_A)),
    );
    this.measurementGroup.add(
      new Box3Helper(boxB, new Color(MEASUREMENT_BOX_COLORS.MODEL_B)),
    );

    // Calculate nearest coordinates on each axis
    const [pAx, pBx] = this.getClosestAxisCoords(
      boxA.min.x,
      boxA.max.x,
      boxB.min.x,
      boxB.max.x,
    );
    const [pAz, pBz] = this.getClosestAxisCoords(
      boxA.min.z,
      boxA.max.z,
      boxB.min.z,
      boxB.max.z,
    );
    let [pAy, pBy] = this.getClosestAxisCoords(
      boxA.min.y,
      boxA.max.y,
      boxB.min.y,
      boxB.max.y,
    );

    // Keep line elevation slightly above floor for clear visual contrast
    if (pAy < MIN_MEASUREMENT_Y) {
      const suggestedY = Math.max(
        MIN_MEASUREMENT_Y,
        Math.min(boxA.max.y, boxB.max.y) * 0.5,
      );
      pAy = suggestedY;
      pBy = suggestedY;
    }

    const startPoint = new Vector3(pAx, pAy, pAz);
    const endPoint = new Vector3(pBx, pBy, pBz);
    const distance = startPoint.distanceTo(endPoint);

    if (distance > 0.001) {
      const dir = new Vector3().subVectors(endPoint, startPoint).normalize();
      super.drawMeasurementLine(startPoint, endPoint, dir, distance);
    } else {
      const midPoint = new Vector3()
        .addVectors(startPoint, endPoint)
        .multiplyScalar(0.5);
      midPoint.y += 0.1;
      const labelSprite = super.createTextSprite("0.00 unit");
      labelSprite.position.copy(midPoint);
      this.measurementGroup.add(labelSprite);
    }

    const finalDistance = distance > 0.001 ? distance : 0;
    Events.emit(OBJECT_DISTANCE_UPDATED, finalDistance);
    return finalDistance;
  }

  /**
   * Calculates the closest coordinates between two ranges along an axis.
   *
   * @private
   * @returns {[number, number]}
   */
  private getClosestAxisCoords(
    minA: number,
    maxA: number,
    minB: number,
    maxB: number,
  ): [number, number] {
    if (maxA < minB) return [maxA, minB];
    if (maxB < minA) return [minA, maxB];
    const overlapMid = (Math.max(minA, minB) + Math.min(maxA, maxB)) / 2;
    return [overlapMid, overlapMid];
  }

  /**
   * Disposes measurement box geometries and materials to free resources.
   *
   * @private
   * @returns {void}
   */
  private disposeMeasurementBoxes(): void {
    this.measurementGroup?.traverse((child) => {
      if (child instanceof Box3Helper) {
        child.geometry.dispose();
        if (Array.isArray(child.material))
          child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }

  /**
   * Loads the environment map and applies a default white background color.
   *
   * @param args - Arguments accepted by the base loadEnvironmentMap method.
   * @returns Promise resolving when the environment map is loaded.
   */
  override async loadEnvironmentMap(...args: Parameters<ConfiguratorCore['loadEnvironmentMap']>): Promise<void> {
    await super.loadEnvironmentMap(...args);
    super.setBackgroundColor(0xffffff);
  }

  /**
   * Loads the 2D-to-3D mesh and removes the ground plane from its parent.
   *
   * @param {Object3D} model - The 3D model to load.
   * @param {Object3D} groundPlane - The ground plane object to remove after loading the mesh.
   * @returns {void}
   */
  override load2DTo3DMesh(model: Object3D, groundPlane: Object3D): void {
    super.load2DTo3DMesh(model, groundPlane);
    groundPlane.removeFromParent();
  }

  /**
   * Toggles distance measurements; refreshes object-to-object measurement if active,
   * matching exactly the behavior in Frontend/Library/three-configurator.
   *
   * @returns True if measurements are visible, false otherwise.
   */
  override toggleMeasurement(): boolean {
    if (this.isObjectToObjectActive && this.objectToObjectModels) {
      this.updateObjectToObjectMeasurement();
      return true;
    }
    // While waiting for the second click, do not draw nearby measurements.
    if (this.firstMeasurementModel) return false;
    if (!this.measurementState?.isActive) {
      super.clearAllMeasurements();
      if (this.isObjectToObjectActive)
        Events.emit(OBJECT_DISTANCE_UPDATED, null);
      this.isObjectToObjectActive = false;
      this.objectToObjectModels = null;
      this.firstMeasurementModel = null;
      this.isMeasurementActive = false;
      return false;
    }
    return !!super.toggleMeasurement();
  }

  /**
   * Deselects the model and removes its transform controls and selection helpers.
   * @public
   * @returns {void}
   */
  public deselectModel(): void {
    const activeControl = this.controlsManager.getActiveControl();
    if (activeControl instanceof TransformControls) {
      activeControl.detach();
    }
    const gizmo = this.scene.getObjectByName(
      RequiredStrings.TRANSFORM_CONTROLS_GIZMO_HELPER,
    );
    if (gizmo) gizmo.visible = false;
    this.modelController.removeBoundingBoxHelper();
    this.modelRoot = null;
    Events.emit(ConfiguratorEventType.MODEL_SELECTED, null);
  }

  /**
   * Records the currently selected scene model as the first item of the measurement pair.
   *
   * @returns True if a valid model was set, false if no model was selected.
   */
  public setFirstMeasurementModel(): boolean {
    if (!this.modelRoot) return false;
    this.firstMeasurementModel = this.modelRoot;
    this.objectToObjectModels = null;
    this.isObjectToObjectActive = false;
    return true;
  }

  /**
   * Verifies whether the currently selected model is identical to the first selected model.
   *
   * @returns True if the current model equals the first recorded model.
   */
  public isSameMeasurementModel(): boolean {
    return !!(
      this.modelRoot &&
      this.firstMeasurementModel &&
      this.modelRoot === this.firstMeasurementModel
    );
  }

  /**
   * Calculates and visually renders the closest distance between two 3D models.
   *
   * @param modelA - Optional first model (defaults to firstMeasurementModel).
   * @param modelB - Optional second model (defaults to currently selected modelRoot).
   * @returns The calculated distance in scene units, or null if models are invalid or disconnected.
   */
  public measureBetweenModels(
    modelA?: Object3D,
    modelB?: Object3D,
  ): number | null {
    if (
      this.isObjectToObjectActive &&
      this.objectToObjectModels &&
      !modelA &&
      !modelB
    ) {
      return this.drawObjectToObjectMeasurement(...this.objectToObjectModels);
    }
    const first = modelA || this.firstMeasurementModel;
    const second = modelB || this.modelRoot;

    // Edge cases: missing models, same model, or detached from scene graph
    if (
      !first ||
      !second ||
      first === second ||
      !first.parent ||
      !second.parent
    ) {
      return null;
    }

    this.isObjectToObjectActive = true;
    this.objectToObjectModels = [first, second];

    return this.drawObjectToObjectMeasurement(first, second);
  }

  /**
   * Updates the measurement between two selected models and Clears measurements if either model is removed from the scene.
   * @public
   * @returns {void}
   */
  public updateObjectToObjectMeasurement(): void {
    if (!this.isObjectToObjectActive || !this.objectToObjectModels) return;

    const [modelA, modelB] = this.objectToObjectModels;
    // Ensure models are still in the active scene
    if (!modelA.parent || !modelB.parent) {
      this.disposeMeasurementBoxes();
      super.clearAllMeasurements();

      this.isObjectToObjectActive = false;
      this.objectToObjectModels = null;
      this.firstMeasurementModel = null;

      Events.emit(OBJECT_DISTANCE_UPDATED, null);
      return;
    }

    this.drawObjectToObjectMeasurement(modelA, modelB);
  }

  /**
   * Identifies floor meshes and calculates the overall boundary of the room.
   *
   * @param room - The root room object.
   * @returns Object containing floor meshes and room bounding box.
   */
  private getRoomFloorData(room: Object3D): {
    floors: Mesh[];
    roomBoundingBox: Box3;
  } {
    const roomBoundingBox = new Box3();
    const floors: Mesh[] = [];

    // Traverse room to identify all floor meshes
    room.traverse((node) => {
      if (node instanceof Mesh) {
        const isFloor = (node as any).isFloor || node.name.toLowerCase().includes(FloorNames.FLOOR);
        if (isFloor) {
          floors.push(node);
          roomBoundingBox.union(AutomaticPlacement.physicalBox(node));
        }
      }
    });

    return { floors, roomBoundingBox };
  }

  /**
   * Collects 2D obstacle footprints and wall segments from room meshes.
   *
   * @param room - The root room object.
   * @param floors - List of floor meshes to ignore as obstacles.
   * @param height - Height of the model to be placed.
   * @returns List of obstacle polygon footprints and wall segments info.
   */
  private getRoomObstaclesAndWalls(
    room: Object3D,
    floors: Mesh[],
    height: number,
  ): {
    obstacles: Vector2[][];
    walls: PlacementWall[];
  } {
    // Initialize obstacle list, walls list, and visited wall tracker
    const obstacles: Vector2[][] = [];
    const walls: PlacementWall[] = [];
    const seenWalls = new Set<string>();

    room.traverse((node) => {
      // Ignore non-mesh nodes and floor meshes
      if (!(node instanceof Mesh) || floors.includes(node)) return;

      // Filter out high fixtures that start above model height
      const box = new Box3().setFromObject(node, true);
      if (box.min.y >= height) return;

      // Compute 2D polygon footprint and record as an obstacle
      const footprint = AutomaticPlacement.meshFootprint(node);
      obstacles.push(footprint);

      // Extract wall data if this mesh represents a room wall
      const wall = node as Mesh & {
        startPoint?: { x: number; z: number };
        endPoint?: { x: number; z: number };
        wall_id?: string;
      };

      // Skip if missing start/end points
      if (!wall.startPoint || !wall.endPoint) return;

      // Avoid processing the same wall ID multiple times
      const wallId = wall.wall_id ?? node.uuid;
      if (seenWalls.has(wallId)) return;
      seenWalls.add(wallId);

      // Convert local wall endpoints into world-space coordinates
      const start = new Vector3(wall.startPoint.x, 0, wall.startPoint.z);
      const end = new Vector3(wall.endPoint.x, 0, wall.endPoint.z);
      if (node.parent) {
        node.parent.localToWorld(start);
        node.parent.localToWorld(end);
      }

      // Verify wall has valid length
      if (start.distanceToSquared(end) > 1e-12) {
        const a = new Vector2(start.x, start.z);
        const b = new Vector2(end.x, end.z);
        // Calculate wall direction and perpendicular normal vector
        const direction = b.clone().sub(a).normalize();
        const normal = new Vector2(-direction.y, direction.x);

        // Calculate wall half-thickness from its 2D footprint points
        const halfThickness = Math.max(
          ...footprint.map((p) => Math.abs(p.clone().sub(a).dot(normal))),
        );
        //calculate wall thickness and add wall info in the array
        walls.push({ start: a, end: b, halfThickness });
      }
    });
    return { obstacles, walls };
  }

  /**
   * Collects 2D obstacle footprints of other models placed in the scene.
   *
   * @param room - The root room model.
   * @param model - The model currently being placed.
   * @returns List of other models' 2D footprint polygons.
   */
  private getSceneModelObstacles(
    room: Object3D,
    model: Object3D,
  ): Vector2[][] {
    const obstacles: Vector2[][] = [];

    this.scene.traverse((node) => {
      // Skip the root room, the model currently being placed, and non-models
      if (node === room || node === model || !node.userData?.isGLBModel) return;

      // Add physical 2D footprint of the placed model
      obstacles.push(AutomaticPlacement.physicalFootprint(node));
    });

    return obstacles;
  }

  /**
   * Calculates the position and rotation for auto-placing a model against room walls.
   *
   * @param model - The 3D model to be placed.
   * @param room - The room root object.
   * @returns Calculated position and rotation, or null if no valid space is found.
   */
  private findModelPlacement(
    model: Object3D,
    room: Object3D,
  ): { position: Vector3; rotation: Euler } | null {
    this.scene.updateMatrixWorld(true);

    // Get room floor meshes and overall boundary
    const { floors, roomBoundingBox } = this.getRoomFloorData(room);
    if (roomBoundingBox.isEmpty()) return null;

    // Measure the vertical height of the model
    const modelBox = AutomaticPlacement.physicalBox(model);
    const modelHeight = modelBox.max.y - modelBox.min.y;

    // Collect obstacles and walls from the room geometry
    const { obstacles, walls } = this.getRoomObstaclesAndWalls(
      room,
      floors,
      modelHeight,
    );

    // Collect obstacles from other models placed in the scene
    const sceneObstacles = this.getSceneModelObstacles(room, model);
    obstacles.push(...sceneObstacles);

    // Reference the currently selected model if available
    const selected = this.modelRoot && this.modelRoot !== room ? this.modelRoot : null;

    // Calculate optimal placement
    return AutomaticPlacement.findAutomaticPlacement(
      model,
      roomBoundingBox,
      obstacles,
      walls,
      selected,
      () => this.collisionSystem.isModelInsideFloorBounds(model),
    );
  }

  /**
   * Loads a 3D model into the scene with metadata, lighting, auto-placement, and preview support.
   *
   * @param url - Path or URL to the 3D model asset.
   * @param isPreview - Whether the model is being loaded in placement preview mode.
   * @param position - Optional target world position.
   * @param rotation - Optional target rotation.
   * @param callbacks - Optional load progress callbacks.
   * @param isSelectable - Whether the model can be clicked/selected.
   * @param metadata - Model metadata (name, id, price, category, etc.).
   * @returns The loaded Object3D or null if cancelled/failed.
   */
  public override async loadModel(
    url: string,
    isPreview: boolean,
    position?: Vector3,
    rotation?: Euler,
    callbacks?: Parameters<ConfiguratorCore["loadModel"]>[4],
    isSelectable?: boolean,
    metadata?: {
      category?: string;
      name?: string;
      id?: string;
      price?: string;
      format?: string;
    },
  ): Promise<Object3D | null> {
    if (this.isPreviewActive || this.isReplacingModel) return null;

    const baseModel = ModelController.GetRoomModel(this.scene);
    const previousMainModel = this.mainModel;

    try {
      this.mainModel = await this.assetLoader.loadGLB(
        url,
        callbacks,
        isSelectable,
      );
      this.lightsManager.mainModel = this.mainModel;

      if (!baseModel) {
        this.mainModel.name = RequiredStrings.ROOM_MODEL;
        if (metadata) metadata.name = RequiredStrings.ROOM_MODEL;
        this.addGroundPlaneForExistingLayout(this.mainModel);
      } else if (metadata?.id && metadata?.name) {
        const unique = this.generateUniqueModelName(metadata.name, metadata.id);
        this.mainModel.name = unique.name;
        metadata.name = unique.name;
        metadata.id = unique.id;
      }

      // Auto-place cabinet against walls if no position is provided
      if (baseModel && !isPreview && !position && !this.modelPendingReplacement) {
        if (rotation) this.mainModel.rotation.copy(rotation);

        const placement = this.findModelPlacement(this.mainModel, baseModel);
        if (!placement) {
          // Revert model references and notify user
          this.mainModel = previousMainModel;
          this.lightsManager.mainModel = previousMainModel;

          Events.emit(ConfiguratorEventType.COLLISION, {
            title: "No space available",
            message:
              "There is no space left in the room to place this model. Move or remove a model and try again.",
            color: "warning",
          });
          return null;
        }

        position = placement.position;
        rotation = placement.rotation;
      }

      this.prevModelRoot = this.isModelRootEqualToRoomModel() ? null : this.modelRoot;
      this.modelRoot = this.mainModel;
      this.modelRoot.userData = {
        ...this.modelRoot.userData,
        isGLBModel: true,
        metadata: metadata ?? {},
      };

      if (isPreview && baseModel) {
        [...this.furnitureGroup.children].forEach((child) => this.scene.attach(child));
        this.furnitureGroup.position.set(0, 0, 0);
        this.furnitureGroup.quaternion.identity();
        this.furnitureGroup.updateMatrixWorld(true);

        this.placeModelOnGround(this.modelRoot);
        await this.handlePreviewMode(baseModel);
        return null;
      }

      const result = this.addModel(this.mainModel, position, rotation);
      this.switchControlMode("transform" as any);
      const currentMode = this.controlsManager.getCurrentTransformMode();
      this.setTransformMode(currentMode);
      (this as any).setTransformControlsAxes(currentMode);

      if (this.isShowAllMeasurementsActive) {
        this.showAllMeasurements();
      } else if (this.isMeasurementActive) {
        this.toggleMeasurement();
      }
      Events.emit(ConfiguratorEventType.MODEL_SELECTED, metadata ?? null);
      Events.emit(ConfiguratorEventType.HIERARCHY_CHANGED);
      Events.emit(ConfiguratorEventType.MODELS_SUMMARY_UPDATED, this.getModelsSummary());
      return result;
    } catch (error) {
      this.mainModel = previousMainModel;
      this.lightsManager.mainModel = previousMainModel;
      throw error;
    }
  }
}
