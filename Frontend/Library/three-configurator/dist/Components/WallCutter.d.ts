import * as THREE from "three";
import { FixtureType } from "../Constants";
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
export declare class WallCutter {
    /**
     * The original group of walls from the floorplan.
     */
    private wallGroup;
    /**
     * The evaluator from three-bvh-csg that performs the actual math for cutting.
     */
    private evaluator;
    /**
     * The dimensions of the trimmer brush used for intersections.
     */
    private trimmerSize;
    /**
     * Box geometry representing the trimmer bounds.
     */
    private trimmerGeom;
    /**
     * Container group holding all post-trimmed wall meshes.
     */
    private trimmedWallGroup;
    /**
     * Factor used to scale coordinates between units.
     */
    private unit_conversion_factor;
    /**
     * Array containing parsed door and window placement information.
     */
    private doorWindows;
    /**
     * Initializes the WallCutter instance, setting up the CSG evaluator and default trimmer dimensions.
     */
    constructor();
    /**
     * Sets the source wall group containing the mesh walls to cut.
     * @param wallGroup - The THREE.Group containing the wall meshes.
     */
    setWallGroup(wallGroup: THREE.Group): void;
    /**
     * Sets the unit conversion scale factor.
     * @param unit_conversion_factor - The scale factor value.
     */
    setUnitConversionFactor(unit_conversion_factor: number): void;
    /**
     * Helper: Finds the world position of the side (face) of a wall that is
     * farthest away from a specific reference point (called the 'tail').
     * @param tail - The reference point.
     * @param wallToAlign - The wall mesh to measure.
     * @returns The farthest face position vector.
     */
    private getFarthestFacePosition;
    /**
     * Orchestrator: Calculates exactly where and how the cutting box (trimmer) should be placed.
     * @param tail - The tail reference point.
     * @param intersectionPoint - The intersection coordinate.
     * @param wallToAlign - The wall to align.
     * @param currentWall - The current wall being cut.
     * @returns The transform containing position and quaternion.
     */
    private getFarthestFaceTransform;
    /**
     * The main function that loops through all walls and performs the trimming.
     * @returns A new THREE.Group containing the trimmed wall meshes.
     */
    cutWalls(): THREE.Group;
    /**
     * Retrieves the list of parsed door and window placements.
     * @returns An array of DoorWindowData objects.
     */
    getPlacements(): DoorWindowData[];
    /**
     * Checks if two wall meshes are collinear based on their 2D start and end points.
     * @param wall1 - The first wall mesh.
     * @param wall2 - The second wall mesh.
     * @returns `true` if the walls are collinear, `false` otherwise.
     */
    private areWallsCollinear;
    /**
     * Performs a CSG subtraction to carve out the geometries of a group of meshes from a base target mesh.
     * @param meshA - The base target THREE.Mesh.
     * @param group - The THREE.Group containing subtraction geometries.
     * @returns A new THREE.Mesh representing the subtracted result.
     */
    subtractGroupFromMesh(meshA: THREE.Mesh, group: THREE.Group): THREE.Mesh;
}
