import * as THREE from "three";
import { SUBTRACTION, Brush, Evaluator } from "three-bvh-csg";
import { Config, FixtureType } from "../Constants";

export interface DoorWindowData {
  type: FixtureType;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  width: number;
  height: number;
  id: string;
  wallId: string;
}

/**
 * WallCutter class handles operations for cutting or modifying wall meshes.
 * It uses Constructive Solid Geometry (CSG) to trim walls where they intersect.
 */
export class WallCutter {
  /**
   * The original group of walls from the floorplan.
   */
  private wallGroup: THREE.Group | null = null;

  /**
   * The evaluator from three-bvh-csg that performs the actual math for cutting.
   */
  private evaluator: Evaluator;

  /**
   * The dimensions of the trimmer brush used for intersections.
   */
  private trimmerSize: number;

  /**
   * Box geometry representing the trimmer bounds.
   */
  private trimmerGeom: THREE.BoxGeometry;
  
  /**
   * Common material used for all cutting brushes  
  */ 
  private CUT_BRUSH_MATERIAL = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 0.4,
  });

  /**
   * Container group holding all post-trimmed wall meshes.
   */
  private trimmedWallGroup!: THREE.Group;

  /**
   * Factor used to scale coordinates between units.
   */
  private unit_conversion_factor: number = 1;

  /**
   * Array containing parsed door and window placement information.
   */
  private doorWindows: DoorWindowData[] = [];

  /**
   * Singleton instance of WallCutter to ensure only one instance is used throughout the application.
   */
  private static instance: WallCutter;

  /**
   * Initializes the WallCutter instance, setting up the CSG evaluator and default trimmer dimensions.
   */
  private constructor() {
    this.evaluator = new Evaluator();

    // Scale the trimmer size as well
    this.trimmerSize = 2000 * (Config.WORLD_SCALE as number);
    this.trimmerGeom = new THREE.BoxGeometry(
      this.trimmerSize,
      this.trimmerSize,
      this.trimmerSize,
    );
  }

  /**
   * Provides access to the singleton instance of WallCutter.
   * @returns The WallCutter instance.
   */
  public static getInstance(): WallCutter {
    if (!WallCutter.instance) {
      WallCutter.instance = new WallCutter();
    }
    return WallCutter.instance;
  }

  /**
   * Sets the source wall group containing the mesh walls to cut.
   * @param wallGroup - The THREE.Group containing the wall meshes.
   */
  public setWallGroup(wallGroup: THREE.Group): void {
    this.wallGroup = wallGroup;
  }

  /**
   * Sets the unit conversion scale factor.
   * @param unit_conversion_factor - The scale factor value.
   */
  public setUnitConversionFactor(unit_conversion_factor: number): void {
    this.unit_conversion_factor = unit_conversion_factor;
  }

  /**
   * Helper: Finds the world position of the side (face) of a wall that is
   * farthest away from a specific reference point (called the 'tail').
   * @param tail - The reference point.
   * @param wallToAlign - The wall mesh to measure.
   * @returns The farthest face position vector.
   */
  private getFarthestFacePosition(
    tail: THREE.Vector3,
    wallToAlign: THREE.Mesh,
  ): THREE.Vector3 {
    const geomAlign = wallToAlign.geometry as THREE.BoxGeometry;

    // In our BoxGeometry creation (Design3D), length is X, height is Y, and thickness is always Z.
    const thicknessAxis = new THREE.Vector3(0, 0, 1);
    const halfThickness = geomAlign.parameters.depth / 2;

    // Calculate the world positions of the two opposite sides of the wall
    const face1Dir = new THREE.Vector3()
      .copy(thicknessAxis)
      .multiplyScalar(halfThickness)
      .applyQuaternion(wallToAlign.quaternion);
    const face2Dir = new THREE.Vector3()
      .copy(thicknessAxis)
      .multiplyScalar(-halfThickness)
      .applyQuaternion(wallToAlign.quaternion);

    const face1Pos = new THREE.Vector3()
      .copy(wallToAlign.position)
      .add(face1Dir);
    const face2Pos = new THREE.Vector3()
      .copy(wallToAlign.position)
      .add(face2Dir);

    // Return the side that is further from the tail point
    return face1Pos.distanceTo(tail) > face2Pos.distanceTo(tail)
      ? face1Pos
      : face2Pos;
  }

  /**
   * Orchestrator: Calculates exactly where and how the cutting box (trimmer) should be placed.
   * @param tail - The tail reference point.
   * @param intersectionPoint - The intersection coordinate.
   * @param wallToAlign - The wall to align.
   * @param currentWall - The current wall being cut.
   * @returns The transform containing position and quaternion.
   */
  private getFarthestFaceTransform(
    tail: THREE.Vector3,
    intersectionPoint: THREE.Vector3,
    wallToAlign: THREE.Mesh,
    currentWall: THREE.Mesh,
  ) {
    const geomAlign = wallToAlign.geometry as THREE.BoxGeometry;
    const halfThickness = geomAlign.parameters.depth / 2;

    // Handle collinear walls
    if (this.areWallsCollinear(currentWall, wallToAlign)) {
      const cutDir = new THREE.Vector3()
        .subVectors(intersectionPoint, tail)
        .normalize();
      const trimmerCenter = new THREE.Vector3()
        .copy(intersectionPoint)
        .add(cutDir.multiplyScalar(this.trimmerSize / 2));
      return {
        position: trimmerCenter,
        quaternion: currentWall.quaternion.clone(),
      };
    }

    const targetFacePos = this.getFarthestFacePosition(tail, wallToAlign);

    //  Calculate the "outward" direction from the wall's center to that face.
    const faceToOuterDir = new THREE.Vector3()
      .subVectors(targetFacePos, wallToAlign.position)
      .normalize();
    const quaternion = wallToAlign.quaternion.clone();

    // Instead of centering the trimmer at the face center (targetFacePos),
    // we center it at the actual intersection point, but offset it "outward"
    // so its face perfectly aligns with the target face plane.

    // We move from the intersection point outward by half the other wall's thickness to reach its far face,
    // then move another half-trimmer-size to center the huge cutting box.
    const trimmerCenter = new THREE.Vector3()
      .copy(intersectionPoint)
      .add(faceToOuterDir.clone().multiplyScalar(halfThickness))
      .add(faceToOuterDir.clone().multiplyScalar(this.trimmerSize / 2));

    return {
      position: trimmerCenter,
      quaternion,
    };
  }

  /**
   * The main function that loops through all walls and performs the trimming.
   * @returns A new THREE.Group containing the trimmed wall meshes.
   */
  public cutWalls(): THREE.Group {
  // Initialize the result group
  this.trimmedWallGroup = new THREE.Group();
  this.doorWindows = [];

  // Ensure CSG preserves material group indices across all boolean cuts
  this.evaluator.useGroups = true;

  // Examine every mesh in our group
  if (this.wallGroup) {
    this.wallGroup.traverse((wallMesh) => {
      if (wallMesh instanceof THREE.Mesh && !(wallMesh instanceof THREE.Group)) {
        // Preserve original face materials by passing wallMesh.material directly
        let wallBrush = new Brush(wallMesh.geometry, wallMesh.material);
        wallBrush.position.copy(wallMesh.position);
        wallBrush.quaternion.copy(wallMesh.quaternion);
        wallBrush.scale.copy(wallMesh.scale);
        wallBrush.updateMatrixWorld();

        // Handle start point intersections
        if ((wallMesh as any).startPointWallIds && (wallMesh as any).startPointWallIds.length > 0) {
          (wallMesh as any).startPointWallIds.forEach((id: string) => {
            const intersectingMesh = this.wallGroup!.children.find(child => (child as any).wall_id === id);
            if (intersectingMesh) {
              let tailVector = new THREE.Vector3((wallMesh as any).endPoint.x, 0, (wallMesh as any).endPoint.z);
              let intersectionPoint = new THREE.Vector3((wallMesh as any).startPoint.x, 0, (wallMesh as any).startPoint.z);
              const trimmer_transform = this.getFarthestFaceTransform(tailVector, intersectionPoint, intersectingMesh as THREE.Mesh, wallMesh as THREE.Mesh);

              const trimmerBrush = new Brush(this.trimmerGeom, this.CUT_BRUSH_MATERIAL);
              trimmerBrush.position.copy(trimmer_transform.position);
              trimmerBrush.quaternion.copy(trimmer_transform.quaternion);
              trimmerBrush.updateMatrixWorld();

              wallBrush = this.evaluator.evaluate(wallBrush, trimmerBrush, SUBTRACTION);
            }
          });
        } else {
          // Flush cut start point
          const start = (wallMesh as any).startPoint;
          const end = (wallMesh as any).endPoint;
          if (start && end) {
            const dir = new THREE.Vector3(start.x - end.x, 0, start.z - end.z).normalize();
            const trimmerCenter = new THREE.Vector3(start.x, 0, start.z).add(dir.clone().multiplyScalar(this.trimmerSize / 2));

            const trimmerBrush = new Brush(this.trimmerGeom, this.CUT_BRUSH_MATERIAL);
            trimmerBrush.position.copy(trimmerCenter);
            trimmerBrush.quaternion.copy(wallMesh.quaternion);
            trimmerBrush.updateMatrixWorld();

            wallBrush = this.evaluator.evaluate(wallBrush, trimmerBrush, SUBTRACTION);
          }
        }

        // Handle end point intersections
        if ((wallMesh as any).endPointWallIds && (wallMesh as any).endPointWallIds.length > 0) {
          (wallMesh as any).endPointWallIds.forEach((id: string) => {
            const intersectingMesh = this.wallGroup!.children.find(child => (child as any).wall_id === id);
            if (intersectingMesh) {
              let tailVector = new THREE.Vector3((wallMesh as any).startPoint.x, 0, (wallMesh as any).startPoint.z);
              let intersectionPoint = new THREE.Vector3((wallMesh as any).endPoint.x, 0, (wallMesh as any).endPoint.z);
              const trimmer_transform = this.getFarthestFaceTransform(tailVector, intersectionPoint, intersectingMesh as THREE.Mesh, wallMesh as THREE.Mesh);

              const trimmerBrush = new Brush(this.trimmerGeom, this.CUT_BRUSH_MATERIAL);
              trimmerBrush.position.copy(trimmer_transform.position);
              trimmerBrush.quaternion.copy(trimmer_transform.quaternion);
              trimmerBrush.updateMatrixWorld();

              wallBrush = this.evaluator.evaluate(wallBrush, trimmerBrush, SUBTRACTION);
            }
          });
        } else {
          // Flush cut end point
          const start = (wallMesh as any).startPoint;
          const end = (wallMesh as any).endPoint;
          if (start && end) {
            const dir = new THREE.Vector3(end.x - start.x, 0, end.z - start.z).normalize();
            const trimmerCenter = new THREE.Vector3(end.x, 0, end.z).add(dir.clone().multiplyScalar(this.trimmerSize / 2));

            const trimmerBrush = new Brush(this.trimmerGeom, this.CUT_BRUSH_MATERIAL);
            trimmerBrush.position.copy(trimmerCenter);
            trimmerBrush.quaternion.copy(wallMesh.quaternion);
            trimmerBrush.updateMatrixWorld();

            wallBrush = this.evaluator.evaluate(wallBrush, trimmerBrush, SUBTRACTION);
          }
        }

          // Handle windows
          if ((wallMesh as any).windows && (wallMesh as any).windows.length > 0) {
            (wallMesh as any).windows.forEach((window: any) => {
              const windowWidth = window.width * (Config.WORLD_SCALE as number);
              const windowHeight = window.height * (Config.WORLD_SCALE as number);
              const windowBottom = window.windowFloorDistance ?? Config.DEFAULT_WINDOW_FLOOR_DISTANCE;
              const windowY = (windowBottom + window.height / 2) * (Config.WORLD_SCALE as number)
              const trimmerDepth = 100 * (Config.WORLD_SCALE as number);

            const windowGeom = new THREE.BoxGeometry(windowWidth, windowHeight, trimmerDepth);
            const windowBrush = new Brush(windowGeom,this.CUT_BRUSH_MATERIAL);

            const start = (wallMesh as any).startPoint;
            const end = (wallMesh as any).endPoint;
            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const length = Math.sqrt(dx * dx + dz * dz);

            if (length > 0) {
              const halfWidthK = window.width / 2;
              const halfWidth3D = halfWidthK * (Config.WORLD_SCALE as number);
              const wallLengthK = length / ((Config.WORLD_SCALE as number) * this.unit_conversion_factor);

              let t = 0;
              const rangeK = wallLengthK - 2 * halfWidthK;
              if (rangeK > 0) {
                t = (window.offset - halfWidthK) / rangeK;
              } else {
                t = 0.5;
              }

              const offset3D = halfWidth3D + t * (length - 2 * halfWidth3D);

              const windowPos = new THREE.Vector3(
                start.x + (offset3D / length) * dx,
                windowY,
                start.z + (offset3D / length) * dz
              );

              windowBrush.position.copy(windowPos);
              windowBrush.quaternion.copy(wallMesh.quaternion);
              windowBrush.updateMatrixWorld();

              this.doorWindows.push({
                type: FixtureType.WINDOW,
                position: windowPos.clone(),
                quaternion: wallMesh.quaternion.clone(),
                width: windowWidth,
                height: windowHeight,
                id: window.id,
                wallId: (wallMesh as any).wall_id
              });

              wallBrush = this.evaluator.evaluate(wallBrush, windowBrush, SUBTRACTION);
            }
          });
        }

          // Handle doors
          if ((wallMesh as any).doors && (wallMesh as any).doors.length > 0) {
            (wallMesh as any).doors.forEach((door: any) => {
              const doorWidth = door.width * (Config.WORLD_SCALE as number);
              const doorHeight = door.height * (Config.WORLD_SCALE as number);
              const doorY = (door.height / 2) * (Config.WORLD_SCALE as number);
              const trimmerDepth = 100 * (Config.WORLD_SCALE as number);

            const doorGeom = new THREE.BoxGeometry(doorWidth, doorHeight, trimmerDepth);
            const doorBrush = new Brush(doorGeom, this.CUT_BRUSH_MATERIAL);

            const start = (wallMesh as any).startPoint;
            const end = (wallMesh as any).endPoint;
            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const length = Math.sqrt(dx * dx + dz * dz);

            if (length > 0) {
              const halfWidthK = door.width / 2;
              const halfWidth3D = halfWidthK * (Config.WORLD_SCALE as number);
              const wallLengthK = length / ((Config.WORLD_SCALE as number) * this.unit_conversion_factor);

              let t = 0;
              const rangeK = wallLengthK - 2 * halfWidthK;
              if (rangeK > 0) {
                t = (door.offset - halfWidthK) / rangeK;
              } else {
                t = 0.5;
              }

              const offset3D = halfWidth3D + t * (length - 2 * halfWidth3D);

              const doorPos = new THREE.Vector3(
                start.x + (offset3D / length) * dx,
                doorY,
                start.z + (offset3D / length) * dz
              );

              doorBrush.position.copy(doorPos);
              doorBrush.quaternion.copy(wallMesh.quaternion);
              doorBrush.updateMatrixWorld();

              this.doorWindows.push({
                type: FixtureType.DOOR,
                position: doorPos.clone(),
                quaternion: wallMesh.quaternion.clone(),
                width: doorWidth,
                height: doorHeight,
                id: door.id,
                wallId: (wallMesh as any).wall_id
              });

              wallBrush = this.evaluator.evaluate(wallBrush, doorBrush, SUBTRACTION);
            }
          });
        }

        // Preserve metadata
        (wallBrush as any).startPoint = (wallMesh as any).startPoint;
        (wallBrush as any).endPoint = (wallMesh as any).endPoint;
        (wallBrush as any).startPointWallIds = (wallMesh as any).startPointWallIds;
        (wallBrush as any).endPointWallIds = (wallMesh as any).endPointWallIds;
        (wallBrush as any).wall_id = (wallMesh as any).wall_id;
        (wallBrush as any).windows = (wallMesh as any).windows;
        (wallBrush as any).doors = (wallMesh as any).doors;
        (wallBrush as any).currentHeight = (wallMesh as any).currentHeight;
        wallBrush.userData = { ...wallMesh.userData };
        this.trimmedWallGroup.add(wallBrush);
      }
    });
  }

  return this.trimmedWallGroup;
}

  /**
   * Retrieves the list of parsed door and window placements.
   * @returns An array of DoorWindowData objects.
   */
  public getPlacements(): DoorWindowData[] {
    return this.doorWindows;
  }

  /**
   * Checks if two wall meshes are collinear based on their 2D start and end points.
   * @param wall1 - The first wall mesh.
   * @param wall2 - The second wall mesh.
   * @returns `true` if the walls are collinear, `false` otherwise.
   */
  private areWallsCollinear(wall1: THREE.Mesh, wall2: THREE.Mesh): boolean {
    const start1 = (wall1 as any).startPoint;
    const end1 = (wall1 as any).endPoint;

    const start2 = (wall2 as any).startPoint;
    const end2 = (wall2 as any).endPoint;

    const dx1 = end1.x - start1.x;
    const dz1 = end1.z - start1.z;
    const len1 = Math.sqrt(dx1 * dx1 + dz1 * dz1);

    const dx2 = end2.x - start2.x;
    const dz2 = end2.z - start2.z;
    const len2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);

    // If one of the walls is extremely short, treat them as collinear to avoid division-by-zero or normalization instability.
    if (len1 < 0.01 || len2 < 0.01) {
      return true;
    }

    const dir1 = new THREE.Vector3(dx1 / len1, 0, dz1 / len1);
    const dir2 = new THREE.Vector3(dx2 / len2, 0, dz2 / len2);

    // Relax threshold from 0.999 to 0.98 to account for minor angle deviations/rounding errors in small walls
    return Math.abs(dir1.dot(dir2)) > 0.98;
  }

  /**
   * Performs a CSG subtraction to carve out the geometries of a group of meshes from a base target mesh.
   * @param meshA - The base target THREE.Mesh.
   * @param group - The THREE.Group containing subtraction geometries.
   * @returns A new THREE.Mesh representing the subtracted result.
   */
  public subtractGroupFromMesh(
    meshA: THREE.Mesh,
    group: THREE.Group,
  ): THREE.Mesh {
    meshA.updateMatrixWorld(true);
    group.updateMatrixWorld(true);

    const evaluator = new Evaluator();

    // Start with meshA
    const baseGeometry = meshA.geometry.clone();
    baseGeometry.applyMatrix4(meshA.matrixWorld);

    let currentBrush = new Brush(baseGeometry);

    // Find all meshes in the group
    const meshes: THREE.Mesh[] = [];

    group.traverse((obj: any) => {
      if ((obj as THREE.Mesh).isMesh) {
        meshes.push(obj as THREE.Mesh);
      }
    });

    // Sequentially subtract each mesh
    for (const mesh of meshes) {
      const geom = mesh.geometry.clone();
      geom.applyMatrix4(mesh.matrixWorld);

      const subtractBrush = new Brush(geom);

      currentBrush = evaluator.evaluate(
        currentBrush,
        subtractBrush,
        SUBTRACTION,
      );
    }

    const resultMesh = new THREE.Mesh(currentBrush.geometry, meshA.material);

    resultMesh.geometry.computeVertexNormals();

    return resultMesh;
  }
}
