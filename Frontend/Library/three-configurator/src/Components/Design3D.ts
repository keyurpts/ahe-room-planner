import * as THREE from "three";
import { ConfiguratorCore } from "../ConfiguratorCore";
import { Converter } from "./Converter";
import type { Wall3DData } from "./Converter";
import { Config, ImageAssets, FixtureType } from "../Constants";
import { WallCutter, type DoorWindowData } from "./WallCutter";
import { DoorWindowHelper } from "./DoorWindowHelper";

/**
 * Design3D class handles the 3D representation of the floorplan.
 * It uses ConfiguratorCore for scene management and Three.js for rendering.
 */
export class Design3D {
  /**
   * ConfiguratorCore instance handling the 3D scene, rendering, and camera controls.
   */
  private core: ConfiguratorCore | undefined;

  /**
   * Converter instance for transforming 2D floorplan data into 3D objects.
   */
  private converter: Converter;

  /**
   * Raw wall meshes (input to WallCutter)
   */
  private sourceWallGroup: THREE.Group | null = null;

  /**
   * The CSG-trimmed group that is actually added to the scene
   */
  private active3DWallGroup: THREE.Group | null = null;

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
    // Initialize the 3D core
    this.core = new ConfiguratorCore({
      container: container,
      backgroundColor: 0xefefef,
      cameraType: "perspective",
      enableShadows: true,
    });
    // Instantiate the converter
    this.converter = new Converter();
    this.wallCutter = new WallCutter();
  }

  /**
   * Creates 3D meshes for the walls based on 2D floorplan data and loads them into the core.
   * @param wallData - Array of wall data objects.
   * @param houseBoundary - Optional house boundary room.
   */
  private make3DMesh(wallData: Wall3DData[], houseBoundary?: any) {

    // wall height and thickness
    const wallHeight = (Config.WALL_HEIGHT as number) * (Config.WORLD_SCALE as number);
    const wallThickness = (Config.WALL_THICKNESS as number) * (Config.WORLD_SCALE as number);

    const wallGroup = new THREE.Group();

    wallData.forEach((wall) => {
      const points = wall.points;

      if (points.length >= 4) {
        // Map indexes to objects and scale them
        const startPoint = {
          // need to be multiplied by unit conversion factor **
          x: points[0] * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(),
          // need to be multiplied by unit conversion factor **
          z: points[1] * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(),
        };

        const endPoint = {
          // need to be multiplied by unit conversion factor **
          x: points[2] * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(),
          // need to be multiplied by unit conversion factor **
          z: points[3] * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(),
        };

        // Direction vector (already scaled because points are scaled)
        const dx = endPoint.x - startPoint.x;
        const dz = endPoint.z - startPoint.z;

        // Wall length
        const length = (Math.sqrt(dx * dx + dz * dz) + (10 * wallThickness));


        // Rotation angle
        const angle = Math.atan2(dz, dx);

        // Find intersecting walls at start and end points
        const startPointWallIds: string[] = [];
        const endPointWallIds: string[] = [];

        wallData.forEach((otherWall) => {
          if (otherWall.id === wall.id) return;
          const otherPoints = otherWall.points;
          const otherStart = {
            // need to be multiplied by unit conversion factor **
            x: otherPoints[0] * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(),
            // need to be multiplied by unit conversion factor **
            z: otherPoints[1] * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor()
          };
          const otherEnd = {
            // need to be multiplied by unit conversion factor **
            x: otherPoints[2] * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor(),
            // need to be multiplied by unit conversion factor **
            z: otherPoints[3] * (Config.WORLD_SCALE as number) * this.getUnitScaleFactor()
          };

          const epsilon = 0.1 * (Config.WORLD_SCALE as number); // Small tolerance for floating point comparison

          // Check if other wall touches this wall's start point
          if (
            (Math.abs(startPoint.x - otherStart.x) < epsilon && Math.abs(startPoint.z - otherStart.z) < epsilon) ||
            (Math.abs(startPoint.x - otherEnd.x) < epsilon && Math.abs(startPoint.z - otherEnd.z) < epsilon)
          ) {
            startPointWallIds.push(otherWall.id);
          }

          // Check if other wall touches this wall's end point
          if (
            (Math.abs(endPoint.x - otherStart.x) < epsilon && Math.abs(endPoint.z - otherStart.z) < epsilon) ||
            (Math.abs(endPoint.x - otherEnd.x) < epsilon && Math.abs(endPoint.z - otherEnd.z) < epsilon)
          ) {
            endPointWallIds.push(otherWall.id);
          }
        });

        // Geometry & material
        const geometry = new THREE.BoxGeometry(
          length,
          wallHeight,
          wallThickness,
        );

        const material = new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          roughness: 0.4,
        });

        const mesh = new THREE.Mesh(geometry, material);
        //Add material as user data into the mesh used to restore it
        mesh.userData.defaultMaterial = material;
        // Position wall at midpoint
        mesh.position.set(
          startPoint.x + dx / 2,
          wallHeight / 2,
          startPoint.z + dz / 2,
        );

        // Rotate wall to match direction
        mesh.rotation.y = -angle;
        (mesh as any).startPoint = startPoint;
        (mesh as any).endPoint = endPoint;
        (mesh as any).startPointWallIds = startPointWallIds;
        (mesh as any).endPointWallIds = endPointWallIds;
        (mesh as any).wall_id = wall.id;
        (mesh as any).windows = wall.windows || [];
        (mesh as any).doors = wall.doors || [];

        wallGroup.add(mesh);
      }
    });

    // Store the raw group and run the cutter
    this.sourceWallGroup = wallGroup;

    this.wallCutter.setWallGroup(this.sourceWallGroup);
    const trimmedWallGroup = this.wallCutter.cutWalls();

    // Track whichever group is actually added to the scene
    this.active3DWallGroup = trimmedWallGroup ?? this.sourceWallGroup;

    // Add small cubes to the outer faces of boundary walls AFTER cutting
    // We parent them to the wall meshes so they follow the wall's hierarchy.
    if (houseBoundary && houseBoundary.boundaryWalls) {
      for (const bw of houseBoundary.boundaryWalls) {
        // Find ALL meshes that belonged to this wall ID (could be multiple if split by window)
        const wallMeshes = this.active3DWallGroup!.children.filter(
          (child: any) => child.wall_id === bw.id
        ) as THREE.Mesh[];

        if (wallMeshes.length > 0) {
          // Add the cube to the first/main fragment of the wall
          const targetMesh = wallMeshes[0];
          const wallThickness = (Config.WALL_THICKNESS as number) * (Config.WORLD_SCALE as number);

          const cubeSize = 20 * (Config.WORLD_SCALE as number);
          const cubeGeom = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize / 3);
          const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0 });

          const cube = new THREE.Mesh(cubeGeom, cubeMat);

          // For parenting, we use LOCAL coordinates.
          // In local space, the wall center is (0,0,0).
          // Offset to outer face along local Z.
          const side = bw.isReversed ? -1 : 1;

          cube.position.set(0, 105 * (Config.WORLD_SCALE as number), side * (wallThickness / 2));

          cube.name = `boundary_cube_${bw.id}`;
          targetMesh.add(cube);
        }
      }
    }

    if (this.roomGroup && this.active3DWallGroup) {
      this.roomGroup.add(this.active3DWallGroup);
    }

    const placements = this.wallCutter.getPlacements();

    if (this.roomGroup) {
      this.addDoorAndWindow(placements, wallThickness);
    }
  }

  /**
   * Helper method to add the door and windows to the roomGroup by creating them.
   * @param doorWindows - Array of door and window data.
   * @param wallThickness - Thickness of the walls.
   */
  private addDoorAndWindow(doorWindows: DoorWindowData[], wallThickness: number): void {
    if (!this.active3DWallGroup) {
      return;
    }
  for (const doorWindow of doorWindows) {
      let model: THREE.Group;
      if (doorWindow.type === FixtureType.DOOR) {
        model = DoorWindowHelper.createDoor(doorWindow.width, doorWindow.height, wallThickness);
      } else {
        model = DoorWindowHelper.createWindow(doorWindow.width, doorWindow.height, wallThickness);
      }

      const bbox = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());

      const wrapper = new THREE.Group();
      wrapper.name = `${doorWindow.type}_${doorWindow.id}`;
      model.position.set(-center.x, -center.y, -center.z);
      wrapper.add(model);

      wrapper.userData = {
        id: doorWindow.id,
        type: doorWindow.type,
        selectable: "false",
        wallId: doorWindow.wallId
      };

      // Find the parent wall this door/window belongs to
      const wallMesh = this.active3DWallGroup.children.find(
        (child: THREE.Object3D) => (child as any).wall_id === doorWindow.wallId
      ) as THREE.Mesh | undefined;

      if (wallMesh) {
        // Convert world transform to wall-local transform
        const localPos = doorWindow.position.clone();
        wallMesh.worldToLocal(localPos);
        wrapper.position.copy(localPos);

        const wallWorldQuaternion = new THREE.Quaternion();
        wallMesh.getWorldQuaternion(wallWorldQuaternion);
        wrapper.quaternion
          .copy(wallWorldQuaternion)
          .invert()
          .multiply(doorWindow.quaternion);

        // Add as child of the wall mesh
        wallMesh.add(wrapper);
      } else if (this.roomGroup) {
        wrapper.position.copy(doorWindow.position);
        wrapper.quaternion.copy(doorWindow.quaternion);
        this.roomGroup.add(wrapper);
      }
    }
  }

  /**
   * Converts 2D data to 3D walls and floors and renders them.
   * @param data - The JSON dataset containing layout information.
   */
  public loadFromJson(data: any): void {
    const json = data.layer || data;
    const rooms = data.rooms || [];
    const houseBoundary = data.houseBoundary || null;
    this.unit_conversion_factor = data.unit_conversion_factor || 1;
    this.wallCutter.setUnitConversionFactor(this.unit_conversion_factor);

    const walls = this.converter.convert2dto3d(json);

    this.clearWalls();
    this.roomGroup = new THREE.Group();

    this.make3DMesh(walls, houseBoundary);

    if (rooms.length > 0) {
      this.makeFloorMesh(rooms);
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
  private makeFloorMesh(rooms: { vertices: { x: number; y: number }[] }[]): void {
    const floorGroup = new THREE.Group();

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
      floorGroup.add(floorMesh);
    });

    this.floorGroup = floorGroup;
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
    if (this.active3DWallGroup) {
      this.active3DWallGroup = null;
    }
    this.sourceWallGroup = null;
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
}
