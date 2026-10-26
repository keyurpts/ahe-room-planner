import {
  ConfiguratorCore,
  Events,
  RequiredStrings,
  ConfiguratorEventType,
} from "three-configurator";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import {
  OBJECT_DISTANCE_UPDATED,
  MEASUREMENT_BOX_COLORS,
  MIN_MEASUREMENT_Y,
} from "./constants";
import { type Object3D, Box3Helper, Color, Vector3, Group } from "three";

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
}
