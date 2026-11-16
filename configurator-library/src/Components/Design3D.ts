import * as THREE from "three";
import { ConfiguratorCore } from "../ConfiguratorCore";
import { Converter } from "./Converter";
import type { Room3DData } from "./Converter";
import { Config, CurrentMode, ImageAssets } from "../Constants";
import { WallCutter } from "./WallCutter";
import { WallBuilder } from "./WallBuilder";
import { RoomAnnotationManager } from "./RoomAnnotationManager";
import type { Undo_Redo_Payload } from "../event/ConfiguratorEventType";


/**
 * Design3D class handles the 3D representation of the floorplan.
 * It uses ConfiguratorCore for scene management and Three.js for rendering.
 */
export class Design3D {
  /**
   * ConfiguratorCore instance handling the 3D scene, rendering, and camera controls.
   */
  public core: ConfiguratorCore | undefined;

  /**
   * Converter instance for transforming 2D floorplan data into 3D objects.
   */
  private converter: Converter;



  /**
   * Group containing generated 3D floor meshes.
   */
  private floorGroup: THREE.Group | null = null;

  /**
   * Extruded geometry group used to trim the ground plane around floor bounds.
   */
  private floorGroupTrimmer: THREE.Group | null = null;

  /**
   * Main container group for rooms, walls, and floors.
   */
  private roomGroup: THREE.Group | null = null;

  /**
   * Factor used to convert drawing unit scales (e.g. cm to meters).
   */
  private unit_conversion_factor: number = 1;

  /**
   * WallCutter helper instance for carving window and door openings into walls.
   */
  private wallCutter: WallCutter;

  /**
   * LabelManager helper instance for managing labels.
   */
  private roomAnnotationManager: RoomAnnotationManager;

  /**
   * WallBuilder helper instance for constructing wall meshes from 2D data.
   */
  private wallBuilder: WallBuilder;

  /**
   * Retrieves the current unit conversion scale factor.
   * @returns The unit conversion factor as a number.
   */
  private getUnitScaleFactor(): number {
    return this.unit_conversion_factor;
  }

  /**
   * Initializes the 3D designer.
   * @param container - The HTML element to host the 3D canvas.
   */
  constructor(container: HTMLDivElement) {
    this.core = this.createConfiguratorCore(container);
    // Instantiate the converter
    this.converter = new Converter();
    this.wallCutter = WallCutter.getInstance();
    this.roomAnnotationManager = RoomAnnotationManager.getInstance();
    this.wallBuilder = WallBuilder.getInstance();
  }

    /**
   * Creates and returns a new ConfiguratorCore instance.
   *
   * @param container - The HTML element to host the 3D canvas.
   * @returns A new ConfiguratorCore instance.
   */
  protected createConfiguratorCore(container: HTMLDivElement): ConfiguratorCore {
    return new ConfiguratorCore({
      container: container,
      backgroundColor: 0xefefef,
      cameraType: "perspective",
      enableShadows: true,
    });
  }

  /**
   * Converts 2D data to 3D walls and floors and renders them.
   * @param data - The JSON dataset containing layout information.
   */
  public loadFromJson(data: any): void {
    const wallLayer = data.layer || data;
    const roomsLayer = data.roomsLayer || null;
    const houseBoundary = data.houseBoundary || null;
    this.unit_conversion_factor = data.unit_conversion_factor || 1;
    this.clearWalls();
    // Create the room group before passing it to WallBuilder.
    this.roomGroup = new THREE.Group();

    // Share the same roomGroup instance with WallBuilder.
    this.wallBuilder.setRoomGroup(this.roomGroup);
    // Set the required conversion factor.
    this.wallBuilder.setUnitConversionFactor(this.unit_conversion_factor);

    const walls = this.converter.convert2dto3d(wallLayer);
    const rooms = this.converter.convertRoom2dto3d(roomsLayer);

    // WallBuilder creates the walls and adds them to the shared roomGroup.
    this.wallBuilder.make3DMesh(walls, houseBoundary);


    if (rooms.length > 0) {
      this.roomGroup.updateMatrixWorld(true);

      // 2. Calculate the bounding box of the entire group
      const box = new THREE.Box3().setFromObject(this.roomGroup);

      // 3. Get the bounding sphere (contains both center and radius)
      const boundingSphere = new THREE.Sphere();
      box.getBoundingSphere(boundingSphere);

      this.makeFloorMesh(rooms, boundingSphere);
      this.makeFloorMeshTrimmer(rooms);
    }

    if (this.roomGroup) {
      let groundPlane = this.addGroundPlane(this.roomGroup);
      this.core?.load2DTo3DMesh(this.roomGroup, groundPlane);
    }
  }

  /**
   * Creates 3D floors for each room based on room layout.
   * @param rooms - Array of room objects containing vertices.
   */
  private makeFloorMesh(rooms: Room3DData[], boundingSphere: THREE.Sphere): void {
    const floorGroup = new THREE.Group();
    this.roomAnnotationManager.registerRootGroup(floorGroup);
    const center = boundingSphere.center; // THREE.Vector3 { x, y, z }
    const radius = boundingSphere.radius;
    const wallHight = Math.round(((this.roomGroup?.children[0]?.children[0] as any)?.currentHeight ?? 0) / (Config.WORLD_SCALE as number));

    rooms.forEach((room) => {
      const shape = new THREE.Shape();
      const points = room.vertices;

      if (points.length < 3) return;

      // Move to the first point
      // In 2D, coords are (x, y). In 3D (XZ plane), they map to (x, z).
      // need to be multiplied by unit conversion factor 
      shape.moveTo(points[0].x * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(), points[0].y * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor());

      // Draw lines to the remaining points
      for (let i = 1; i < points.length; i++) {
        // need to be multiplied by unit conversion factor 
        shape.lineTo(points[i].x * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(), points[i].y * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor());
      }

      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);
      const texture = this.getFloorTexture(geometry);

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.1,
      });

      // Store initial texture metadata
      material.userData.textureUrl = ImageAssets.DEFAULT_FLOOR_TEXTURE;
      material.userData.repeatX = 1;
      material.userData.repeatY = 1;

      if (material.map) material.map.anisotropy = 16;

      const floorMesh = new THREE.Mesh(geometry, material);
      floorMesh.name = "floor_mesh";
      (floorMesh as any).isFloor = true;
      //Add the texture as user data used to restore it
      floorMesh.userData.defaultMaterial = material;

      // In Three.js, ShapeGeometry is created on the XY plane.
      // We need to rotate it to the XZ plane.
      floorMesh.rotation.x = Math.PI / 2;
      // Slightly above ground (y=0) to avoid Z-fighting
      floorMesh.position.y = 0.01 * (Config.WORLD_SCALE as number);

      floorMesh.material.depthTest = true;
      floorMesh.material.depthWrite = true;

      floorMesh.renderOrder = 1;
      floorMesh.material.polygonOffset = true;
      floorMesh.material.polygonOffsetFactor = -1;
      floorMesh.material.polygonOffsetUnits = -1;
      let lable = this.roomAnnotationManager.createLabel({
        id: room.id,
        roomName: room.roomName,
        startPosition: new THREE.Vector3(
          room.lablePosition.x *
          (Config.WORLD_SCALE as number) *
          this.getUnitScaleFactor(),

          0.1,

          room.lablePosition.y *
          (Config.WORLD_SCALE as number) *
          this.getUnitScaleFactor()
        ),
        wallHeight: wallHight,
        center,
        radius,
      });

      // Counter-rotate the label so it remains upright despite the floorMesh's rotation
      lable.rotation.x = -Math.PI / 2;

      floorMesh.add(lable);
      floorGroup.add(floorMesh);
    });

    this.floorGroup = floorGroup;

    // Set the panning boundary on OrbitControls to floor + tiny buffer
    if (this.core && (this.core as any).controlsManager) {
      const orbitControls = (this.core as any).controlsManager.getControl("orbit");
      if (orbitControls) {
        (orbitControls as any).minPanY = 0.01 * (Config.WORLD_SCALE as number) + 0.1;
      }
    }


    if (this.roomGroup && this.floorGroup) {
      this.roomGroup.add(this.floorGroup);
    }
  }

  /**
   * Creates an extruded geometry group from the room vertices to act as a trimmer for the ground plane.
   * @param rooms - The list of rooms, each containing its 2D vertices.
   */
  private makeFloorMeshTrimmer(rooms: { vertices: { x: number; y: number }[] }[]): void {
    const floorGroupTrimmer = new THREE.Group();

    rooms.forEach((room) => {
      const shape = new THREE.Shape();
      const points = room.vertices;

      if (points.length < 3) return;

      // Move to the first point
      // In 2D, coords are (x, y). In 3D (XZ plane), they map to (x, z).
      // need to be multiplied by unit conversion factor 
      shape.moveTo(points[0].x * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(), points[0].y * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor());

      // Draw lines to the remaining points
      for (let i = 1; i < points.length; i++) {
        // need to be multiplied by unit conversion factor 
        shape.lineTo(points[i].x * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(), points[i].y * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor());
      }

      shape.closePath();

      const floorExtrudeDepth = 2 * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: floorExtrudeDepth,
        bevelEnabled: false,
      });

      const texture = this.getFloorTexture(geometry);

      const topMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.4,
        metalness: 0.1,
      });
      // Store the original texture information
      topMaterial.userData.textureUrl = ImageAssets.DEFAULT_FLOOR_TEXTURE;
      topMaterial.userData.repeatX = 1;
      topMaterial.userData.repeatY = 1;


      const sideMaterial = new THREE.MeshStandardMaterial({
        color: 0xd8d2c4,
        side: THREE.DoubleSide,
        roughness: 0.55,
        metalness: 0.05,
      });

      if (topMaterial.map) topMaterial.map.anisotropy = 16;

      // ExtrudeGeometry uses material index 0 for the caps and index 1 for side walls.
      // Keeping the floor texture on cap material preserves the top floor surface.
      const floorMaterials = [topMaterial, sideMaterial];
      const floorMesh = new THREE.Mesh(geometry, floorMaterials);
      (floorMesh as any).isFloor = true;

      // In Three.js, ExtrudeGeometry is created on the XY plane and extrudes along local Z.
      // Rotating it to the XZ plane makes that extrusion vertical.
      floorMesh.rotation.x = Math.PI / 2;
      // Slightly above ground (y=0) to avoid Z-fighting
      floorMesh.position.y = 0.34 * (Config.WORLD_SCALE as number);

      floorMaterials.forEach((material) => {
        material.depthTest = true;
        material.depthWrite = true;
      });

      floorMesh.renderOrder = 1;
      floorGroupTrimmer.add(floorMesh);
    });

    floorGroupTrimmer.name = "floor_group_trimmer";
    this.floorGroupTrimmer = floorGroupTrimmer;
  }

  /**
   * Adds a textured ground plane underneath the model based on its bounding box size and center.
   * @param model - The 3D model object to reference for positioning and scaling.
   * @returns The generated ground plane THREE.Object3D.
   */
  private addGroundPlane(model: THREE.Object3D): THREE.Object3D {
    // Calculate the bounding box of the base model
    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    boundingBox.getSize(size);
    boundingBox.getCenter(center);

    // Provide safe default dimensions if the model size isn't fully calculated yet
    const planeWidth = size.x > 0.1 ? size.x * 200 : 200;
    const planeDepth = size.z > 0.1 ? size.z * 200 : 200;

    let texture, material, plane;

    const textureLoader = new THREE.TextureLoader();
    const groundImageUrl = ImageAssets.GROUND_IMAGE_PATH;
    texture = textureLoader.load(groundImageUrl);
    texture.colorSpace = THREE.SRGBColorSpace;

    // assuming you want the texture to repeat in both directions:
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // how many times to repeat in each direction
    texture.repeat.set(400, 400);

    material = new THREE.MeshStandardMaterial({ map: texture, color: 0xffffff, roughness: 0.8, metalness: 0.1 });
    plane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeDepth), material);
    plane.material.side = THREE.DoubleSide;
    plane.position.set(center.x, 0, center.z);
    plane.receiveShadow = true;
    // rotation.x is rotation around the x-axis
    plane.rotation.x = -Math.PI / 2;

    if (this.floorGroupTrimmer) {
      let resultantPlane = this.wallCutter.subtractGroupFromMesh(plane, this.floorGroupTrimmer);
      resultantPlane.receiveShadow = true;
      this.floorGroupTrimmer = null;
      return resultantPlane;
    }
    this.floorGroupTrimmer = null;
    return plane;
  }

  /**
   * Configures and returns the repeating floor texture, while also computing geometry normals.
   * @param geometry - The geometry to configure texture for.
   * @returns The configured THREE.Texture.
   */
  private getFloorTexture(geometry: THREE.BufferGeometry): THREE.Texture {
    // Compute vertex normals since ShapeGeometry doesn't create them accurately for lighting sometimes
    geometry.computeVertexNormals();

    // Load Sample Texture
    const textureLoader = new THREE.TextureLoader();
    const defaultFloorTexture = ImageAssets.DEFAULT_FLOOR_TEXTURE;
    const texture = textureLoader.load(defaultFloorTexture, (tex) => {
      // Optional callback when loaded
      tex.colorSpace = THREE.SRGBColorSpace;
    });

    // Setting Texture properties for a repeating pattern
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // The repeat values determine how many times texture repeats over the geometry surface
    // Texture mapping on ShapeGeometry maps the shape coordinates (X, Y) directly to (U, V)
    // So we scale it up to tile properly. Since we scaled down the geometry, 
    // we need to increase the repeat value to keep the squares the same visual size.
    const baseRepeat = 0.009;
    const scaledRepeat = baseRepeat / (Config.WORLD_SCALE as number);
    texture.repeat.set(scaledRepeat, scaledRepeat);

    return texture;
  }

  /**
   * Removes all 3D wall meshes from the scene.
   */
  public clearWalls(): void {
    if (this.roomGroup) {
      this.core?.remove2DTo3DMesh(this.roomGroup);
      this.roomGroup = null;
    }

    // Remove the group that was added to the scene (the trimmed result)
    if (this.roomGroup) {
      this.roomGroup = null;
    }
    this.roomGroup = null;
    if (this.floorGroup) {
      this.floorGroup = null;
    }
  }

  /**
   * Activates the 3D renderer, initializing it if needed
   * and applying any pending wall data.
   */
  public enter3DView(): void {
    if (!this.core) return;
    this.core?.enableWallHiding(false);
    this.core.resumeRenderer();

    requestAnimationFrame(() => {
      this.core!.handleResize();
    });
  }

  /**
   * Pauses 3D rendering without destroying state.
   */
  public exit3DView(): void {
    this.core?.clearScene();
    this.core?.pauseRenderer();
    this.core?.enableWallHiding(false);
    this.core?.clearDesign2DHistory();
    this.core?.clearConfigureHistory();
  }

  /**
   * Clean up resources.
   */
  public dispose(): void {
    this.clearWalls();
    this.core?.dispose();
    this.core = undefined;
  }

  /**
   * Returns the ConfiguratorCore instance if it exists.
   * @returns The ConfiguratorCore instance or undefined.
   */
  public getCore(): ConfiguratorCore | undefined {
    if (this.core) {
      return this.core;
    }
    return undefined;
  }

  /**
 * Sets the current 3D application mode through the core instance.
 *
 * @param {CurrentMode} mode - The 3D mode to activate.
 * @returns {void}
 */
  public set3DModes(mode: CurrentMode): void {
    this.core?.set3DModes(mode);
  }

  /**
   * Retrieves the currently active 3D application mode from the core instance.
   *
   * @returns {CurrentMode | undefined} The current 3D mode, or undefined if the core instance is unavailable.
   */
  public get3DModes(): CurrentMode | undefined {
    return this.core?.get3DModes();
  }

  /**
   * set undo-redo limit to stack
   * @param {Number} limit
   */
  public setUndoRedoLimit(limit: number) {
    this.core?.setUndoRedoLimit(limit);
  }

  /**
   * Get the undo-redo-satck size
   * @returns {Undo_Redo_Payload} payload
   */
  public getUndoRedoPayload(): Undo_Redo_Payload {
    return this.core?.getUndoRedoPayload() || { undo_stack_size: 0, redo_stack_size: 0 };
  }

  /**
   * Sets the length measurement unit used in the 3D scene (e.g. for distance measurements).
   * @internal
   */
  public update3DLengthUnit(): void {
    this.core?.set3DMeasurementUnit();
  }
}
