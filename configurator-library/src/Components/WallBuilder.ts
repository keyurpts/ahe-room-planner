import {
  Group,
  BoxGeometry,
  MeshStandardMaterial,
  Mesh,
  Object3D,
  Material,
  Texture,
} from "three";
import { Config, RequiredStrings } from "../Constants";
import { DoorWindowHelper } from "./DoorWindowHelper";
import { type Wall3DData } from "./Converter";
import { WallCutter } from "./WallCutter";

export class WallBuilder {
  /**
   * Singleton instance of WallBuilder.
   */
  private static instance: WallBuilder;

  /**
   * The WallCutter instance used for cutting walls.
   */
  private wallCutter: WallCutter;

  /**
   * The unit conversion factor used to convert floorplan coordinates to 3D world coordinates.
   */
  private unit_conversion_factor: number = 1;

  /**
   * The group containing the room's walls and other related objects.
   */
  private roomGroup: Group | null = null;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    this.wallCutter = WallCutter.getInstance();
  }

  /**
   * Gets the singleton instance of WallBuilder.
   * @returns {WallBuilder} The singleton instance of WallBuilder.
   */
  public static getInstance(): WallBuilder {
    if (!WallBuilder.instance) {
      WallBuilder.instance = new WallBuilder();
    }

    return WallBuilder.instance;
  }

  /**
   * Applies the preserved wall material and rescales its texture
   * according to the wall height change.
   *
   * @param {Mesh} mesh The wall mesh.
   * @param {Material | Material[]} material The preserved wall material(s).
   * @param {number} heightScale The ratio between the new and old wall height.
   * @returns {void}
   * @private
   */
  private applyWallMaterial(mesh: Mesh, material: Material | Material[], heightScale: number,): void {
    const seen = new Set<Texture>();

    const rescale = (mat: Material) => {
      const map = (mat as MeshStandardMaterial).map;
      if (!map || heightScale === 1) return;
      if (seen.has(map)) return; // already scaled this exact texture in this call
      seen.add(map);

      map.repeat.y *= heightScale;
      map.needsUpdate = true;
    };

    if (Array.isArray(material)) {
      material.forEach(rescale);
    } else {
      rescale(material);
    }
    mesh.material = material;
  }
  /**
   * Update door/window opening dimensions stored in a wall's userdata arrays.
   * Any dimension left undefined is preserved at its current value.
   * @param wall The plain (pre-cut) wall mesh whose .doors / .windows arrays to update
   * @param doorWidth New door width in design units, or undefined to leave unchanged
   * @param doorHeight New door height in design units, or undefined to leave unchanged
   * @param windowWidth New window width in design units, or undefined to leave unchanged
   * @param windowHeight New window height in design units, or undefined to leave unchanged
   */
  private updateOpeningDimensionValues(
    wall: Mesh,
    doorWidth?: number,
    doorHeight?: number,
    windowWidth?: number,
    windowHeight?: number,
    windowFloorDistance?: number,
  ): void {
    if (
      doorWidth === undefined &&
      doorHeight === undefined &&
      windowWidth === undefined &&
      windowHeight === undefined &&
      windowFloorDistance === undefined
    ) {
      return;
    }
    const doors = (wall as any).doors;
    if (Array.isArray(doors)) {
      doors.forEach((door: any) => {
        if (!door) return;
        if (doorWidth !== undefined) door.width = doorWidth;
        if (doorHeight !== undefined) door.height = doorHeight;
      });
    }

    const windows = (wall as any).windows;
    if (Array.isArray(windows)) {
      windows.forEach((win: any) => {
        if (!win) return;
        if (windowWidth !== undefined) win.width = windowWidth;
        if (windowHeight !== undefined) win.height = windowHeight;
        if (windowFloorDistance !== undefined)
          win.windowFloorDistance = windowFloorDistance;
      });
    }
  }

  /**
   * Helper method to add the boundary wall cube
   * @param active3DWallGroup 
   * @param houseBoundary 
   * @param wallThickness 
   * @returns 
   */
  private addBoundaryCubes(active3DWallGroup: Group, houseBoundary: any, wallThickness: number,): void {
    if (!houseBoundary?.boundaryWalls) {
      return;
    }

    for (const boundaryWall of houseBoundary.boundaryWalls) {
      // Find all wall fragments belonging to this boundary wall.
      const wallMeshes = active3DWallGroup.children.filter(
        (child: any) => child.wall_id === boundaryWall.id,
      ) as Mesh[];

      if (wallMeshes.length === 0) {
        continue;
      }

      // Add the cube to the first/main wall fragment.
      const targetWall = wallMeshes[0];

      const cubeSize = 20 * (Config.WORLD_SCALE as number);

      const cubeGeometry = new BoxGeometry(cubeSize, cubeSize, cubeSize / 3);

      const cubeMaterial = new MeshStandardMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0,
      });

      const boundaryCube = new Mesh(cubeGeometry, cubeMaterial);

      // Cube is parented to the wall, so use wall-local coordinates.
      const side = boundaryWall.isReversed ? -1 : 1;

      boundaryCube.position.set(
        0,
        105 * (Config.WORLD_SCALE as number),
        side * (wallThickness / 2),
      );

      boundaryCube.name = `boundary_cube_${boundaryWall.id}`;

      targetWall.add(boundaryCube);
    }
  }

  /**
   * Sets the group containing the room's walls and other related objects.
   * @param group
   */
  public setRoomGroup(group: Group): void {
    this.roomGroup = group;
  }

  /**
   * Sets the unit conversion factor used to convert floorplan coordinates to 3D world coordinates.
   * @param factor
   */
  public setUnitConversionFactor(factor: number): void {
    this.unit_conversion_factor = factor;
  }

  /**
   * Creates 3D meshes for the supplied wall data.
   *
   * The method:
   * 1. Creates the source wall meshes.
   * 2. Finds connected wall endpoints.
   * 3. Cuts the walls using WallCutter.
   * 4. Adds house boundary cubes when required.
   * 5. Adds doors and windows.
   *
   * @param wallData - Array of wall data objects.
   * @param houseBoundary - Optional house boundary information.
   *
   * @returns The source and active wall groups.
   */
  public make3DMesh(wallData: Wall3DData[], houseBoundary?: any): void {
    // wall height and thickness
    const wallHeight = (Config.WALL_HEIGHT as number) * (Config.WORLD_SCALE as number);
    const wallThickness = (Config.WALL_THICKNESS as number) * (Config.WORLD_SCALE as number);

    const wallGroup = new Group();

    wallData.forEach((wall) => {
      const points = wall.points;

      if (points.length >= 4) {
        // Map indexes to objects and scale them
        const startPoint = {
          // need to be multiplied by unit conversion factor **
          x: points[0] * (Config.WORLD_SCALE as number) * this.unit_conversion_factor,
          // need to be multiplied by unit conversion factor **
          z: points[1] * (Config.WORLD_SCALE as number) * this.unit_conversion_factor,
        };

        const endPoint = {
          // need to be multiplied by unit conversion factor **
          x: points[2] * (Config.WORLD_SCALE as number) * this.unit_conversion_factor,
          // need to be multiplied by unit conversion factor **
          z: points[3] * (Config.WORLD_SCALE as number) * this.unit_conversion_factor,
        };

        // Direction vector (already scaled because points are scaled)
        const dx = endPoint.x - startPoint.x;
        const dz = endPoint.z - startPoint.z;

        // Wall length
        const length = Math.sqrt(dx * dx + dz * dz) + 10 * wallThickness;

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
            x: otherPoints[0] * (Config.WORLD_SCALE as number) * this.unit_conversion_factor,
            // need to be multiplied by unit conversion factor **
            z: otherPoints[1] * (Config.WORLD_SCALE as number) * this.unit_conversion_factor,
          };
          const otherEnd = {
            // need to be multiplied by unit conversion factor **
            x: otherPoints[2] * (Config.WORLD_SCALE as number) * this.unit_conversion_factor,
            // need to be multiplied by unit conversion factor **
            z: otherPoints[3] * (Config.WORLD_SCALE as number) * this.unit_conversion_factor,
          };

          const epsilon = 0.1 * (Config.WORLD_SCALE as number); // Small tolerance for floating point comparison

          // Check if other wall touches this wall's start point
          if (
            (Math.abs(startPoint.x - otherStart.x) < epsilon &&
              Math.abs(startPoint.z - otherStart.z) < epsilon) ||
            (Math.abs(startPoint.x - otherEnd.x) < epsilon &&
              Math.abs(startPoint.z - otherEnd.z) < epsilon)
          ) {
            startPointWallIds.push(otherWall.id);
          }

          // Check if other wall touches this wall's end point
          if (
            (Math.abs(endPoint.x - otherStart.x) < epsilon &&
              Math.abs(endPoint.z - otherStart.z) < epsilon) ||
            (Math.abs(endPoint.x - otherEnd.x) < epsilon &&
              Math.abs(endPoint.z - otherEnd.z) < epsilon)
          ) {
            endPointWallIds.push(otherWall.id);
          }
        });
        // Geometry & material
        const geometry = new BoxGeometry(length, wallHeight, wallThickness);

        const material = new Array(6).fill(null).map(() => {
          const mat = new MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.4,
          });

          // Store initial texture metadata
          mat.userData.textureUrl = '';
          mat.userData.repeatX = 1;
          mat.userData.repeatY = 1;
          mat.userData.color = `#${mat.color.getHexString()}`;

          return mat;
        });

        const mesh = new Mesh(geometry, material);
        //Add material as user data into the mesh used to restore it
        mesh.userData.defaultMaterial = material;
        // Persist the unit conversion factor so height updates can read it back.
        mesh.userData.unitConversionFactor = this.unit_conversion_factor;
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
        (mesh as any).currentHeight = wallHeight;
        (mesh as any).windows = wall.windows || [];
        (mesh as any).doors = wall.doors || [];

        wallGroup.add(mesh);
      }
    });

    // Store the raw group and run the cutter
    const sourceWallGroup = wallGroup;

    this.wallCutter.setWallGroup(sourceWallGroup);
    // Set the required conversion factor.
    this.wallCutter.setUnitConversionFactor(this.unit_conversion_factor);
    const trimmedWallGroup = this.wallCutter.cutWalls();

    // Track whichever group is actually added to the scene
    const active3DWallGroup = trimmedWallGroup ?? sourceWallGroup;

    // Add small cubes to the outer faces of boundary walls AFTER cutting
    // We parent them to the wall meshes so they follow the wall's hierarchy.
    this.addBoundaryCubes(active3DWallGroup, houseBoundary, wallThickness);

    if (this.roomGroup && active3DWallGroup) {
      this.roomGroup.add(active3DWallGroup);
    }

    const placements = this.wallCutter.getPlacements();

    if (this.roomGroup) {
      DoorWindowHelper.addDoorAndWindow(
        active3DWallGroup,
        placements,
        wallThickness,
      );
    }
  }

  /**
   * Recreate the walls with the updated wall and opening dimensions.
   *
   * @param wallHeight
   * @param doorWidth
   * @param doorHeight
   * @param windowWidth
   * @param windowHeight
   * @param windowFloorDistance
   */
  public recreateWalls(
    options: {
      wallHeight?: number,
      doorWidth?: number,
      doorHeight?: number,
      windowWidth?: number,
      windowHeight?: number,
      windowFloorDistance?: number,
    }
  ): void {
    const {
      wallHeight,
      doorWidth,
      doorHeight,
      windowWidth,
      windowHeight,
      windowFloorDistance,
    } = options;
    const walls: Mesh[] = [];
    if (!this.roomGroup) return;

    this.roomGroup.traverse((child) => {
      if (child instanceof Mesh && (child as any).wall_id) {
        walls.push(child);
      }
    });

    if (walls.length === 0) return;

    // Store everything required to re-insert the final wall later.
    const wallInfo = new Map<
      string,
      {
        parent: Object3D;
        index: number;
        oldHalfHeight: number;
        newHalfHeight: number;
        boundaryCube?: Object3D;
      }
    >();

    // Preserve the original material of each wall.
    const wallMaterials = new Map<string, Material>();

    const stagingGroup = new Group();

    const wallThicknessLocal =
      (Config.WALL_THICKNESS as number) * (Config.WORLD_SCALE as number);

    walls.forEach((oldWall) => {
      oldWall.geometry.computeBoundingBox();

      const bbox = oldWall.geometry.boundingBox;
      if (!bbox) return;

      const wallId = (oldWall as any).wall_id;

      const start = (oldWall as any).startPoint;
      const end = (oldWall as any).endPoint;

      // Calculate wall width from start/end points when available.
      let width: number;

      if (start && end) {
        const dx = end.x - start.x;
        const dz = end.z - start.z;

        width = Math.sqrt(dx * dx + dz * dz) + 10 * wallThicknessLocal;
      } else {
        width = bbox.max.x - bbox.min.x;
      }

      const depth = wallThicknessLocal;

      const existingHeight = bbox.max.y - bbox.min.y;

      // New wall height.
      const newWallHeight =
        wallHeight !== undefined
          ? wallHeight * (Config.WORLD_SCALE as number)
          : existingHeight;

      // Preserve original wall material.
      const originalMaterial = (oldWall as any).material;
      wallMaterials.set(wallId, originalMaterial);

      // Create the new plain wall used as the CSG input.
      const plainWall = new Mesh(new BoxGeometry(width, newWallHeight, depth), originalMaterial,);

      // Preserve all existing userData.
      plainWall.userData = { ...oldWall.userData, };

      const defaultMaterial = new Array(6).fill(null).map(
        () =>
          new MeshStandardMaterial({
            color: 0xaaaaaa,
            roughness: 0.4,
          }),
      );

      plainWall.userData.defaultMaterial = defaultMaterial;

      (plainWall as any).wall_id = wallId;

      plainWall.position.copy(oldWall.position);
      plainWall.position.y = newWallHeight / 2;
      plainWall.quaternion.copy(oldWall.quaternion);
      plainWall.scale.copy(oldWall.scale);

      (plainWall as any).startPoint = (oldWall as any).startPoint;
      (plainWall as any).endPoint = (oldWall as any).endPoint;
      (plainWall as any).startPointWallIds = (oldWall as any).startPointWallIds;
      (plainWall as any).endPointWallIds = (oldWall as any).endPointWallIds;
      (plainWall as any).windows = (oldWall as any).windows;
      (plainWall as any).doors = (oldWall as any).doors;
      (plainWall as any).currentHeight = newWallHeight;

      this.updateOpeningDimensionValues(
        plainWall,
        doorWidth,
        doorHeight,
        windowWidth,
        windowHeight,
        windowFloorDistance,
      );

      const boundaryCube = oldWall.children.find((child) =>
        child.name.startsWith(RequiredStrings.BOUNDARY_CUBE),
      );

      if (boundaryCube) {
        oldWall.remove(boundaryCube);
      }

      const parent = oldWall.parent;

      if (parent) {
        wallInfo.set(wallId, {
          parent,
          index: parent.children.indexOf(oldWall),
          oldHalfHeight: oldWall.position.y,
          newHalfHeight: newWallHeight / 2,
          boundaryCube,
        });

        parent.remove(oldWall);
      }

      oldWall.geometry.dispose();

      stagingGroup.add(plainWall);
    });

    const unitConversionFactor = walls.find((wall) => wall.userData?.unitConversionFactor != null)?.userData.unitConversionFactor ?? 1;

    const wallCutter = WallCutter.getInstance();

    wallCutter.setUnitConversionFactor(unitConversionFactor);

    wallCutter.setWallGroup(stagingGroup);

    const trimmedWallsGroup = wallCutter.cutWalls();

    trimmedWallsGroup.traverse((child) => {
      if (!(child instanceof Mesh)) return;

      const wallId = (child as any).wall_id;

      if (!wallId) return;

      const material = wallMaterials.get(wallId);
      const info = wallInfo.get(wallId);

      if (!material || !info) return;

      const heightScale = info.oldHalfHeight > 0 ? info.newHalfHeight / info.oldHalfHeight : 1;

      this.applyWallMaterial(child, material, heightScale);

      if (!child.userData.defaultMaterial) {
        child.userData.defaultMaterial = new Array(6).fill(null).map(
          () =>
            new MeshStandardMaterial({
              color: 0xaaaaaa,
              roughness: 0.4,
            }),
        );
      }
    });

    const placements = wallCutter.getPlacements();
    DoorWindowHelper.addDoorAndWindow(
      trimmedWallsGroup,
      placements,
      wallThicknessLocal,
    );

    const trimmedWallsList = trimmedWallsGroup.children.slice();

    stagingGroup.children.forEach((wall) => {
      (wall as Mesh).geometry?.dispose();
    });

    trimmedWallsList.forEach((trimmedWall) => {
      const wallId = (trimmedWall as any).wall_id;

      const info = wallInfo.get(wallId);

      if (!info) return;

      if (info.boundaryCube) {
        if (info.oldHalfHeight > 0) {
          info.boundaryCube.position.y =
            (info.boundaryCube.position.y / info.oldHalfHeight) *
            info.newHalfHeight;
        }

        trimmedWall.add(info.boundaryCube);
      }

      info.parent.add(trimmedWall);

      if (info.index >= 0) {
        const children = info.parent.children;

        children.splice(children.indexOf(trimmedWall), 1);

        children.splice(Math.min(info.index, children.length), 0, trimmedWall);
      }
      trimmedWall.updateWorldMatrix(true, false);
    });
  }
}
