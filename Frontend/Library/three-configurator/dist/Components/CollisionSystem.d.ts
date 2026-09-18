import * as THREE from "three";
/**
 * CollisionSystem handles all BVH-based spatial intersection tests.
 * This class centralizes collision detection logic to simplify model management
 * and provide efficient mesh-to-mesh intersection testing using Bounding Volume Hierarchies (BVH).
 */
export declare class CollisionSystem {
    /**
     *  The main scene containing all collidable objects
     */
    private scene;
    /**
     *  Reusable matrix for coordinate space transformations during intersection tests
     */
    private tempMatrix;
    /**
     * Initializes the CollisionSystem with a reference to the main scene.
     *
     * @param scene - The THREE.Scene instance where collision checks will be performed.
     */
    constructor(scene: THREE.Scene);
    /**
     * Ensures that all meshes in the provided object hierarchy have a BVH boundsTree.
     * BVH (Bounding Volume Hierarchy) significantly accelerates spatial queries like intersection tests.
     *
     * @param object - The THREE.Object3D (and its children) to process for BVH generation.
     */
    ensureBVH(object: THREE.Object3D): void;
    /**
     * Checks for collisions between a temporary preview model and existing objects in the scene.
     * Used primarily during the placement phase to provide visual feedback (e.g., turning red on overlap).
     *
     * @param preview - The temporary preview THREE.Object3D being positioned.
     * @returns `true` if any part of the preview model intersects with scene objects, otherwise `false`.
     */
    checkPreviewCollision(preview: THREE.Object3D): boolean;
    /**
     * Determines whether a given mesh is considered part of the floor.
     *
     * @param mesh - The mesh to check.
     * @returns `true` if the mesh represents a floor, `false` otherwise.
     */
    private isFloorMesh;
    /**
     * Determines whether a given object should be ignored during collision checks (e.g., helpers, gizmos).
     *
     * @param object - The object to check.
     * @returns `true` if the object is ignored, `false` otherwise.
     */
    private isIgnoredCollisionObject;
    /**
     * Traverses the scene to find and collect all floor meshes, excluding the active model itself.
     *
     * @param mobileModel - The active model to exclude.
     * @returns An array of floor meshes.
     */
    private collectFloorMeshes;
    /**
     * Checks if a 2D point (X, Z coordinate space) lies inside a triangle defined by three 3D vertices.
     *
     * @param point - The 2D point to check.
     * @param a - The first vertex of the triangle.
     * @param b - The second vertex of the triangle.
     * @param c - The third vertex of the triangle.
     * @returns `true` if the point is inside the triangle in XZ space, `false` otherwise.
     */
    private pointInTriangleXZ;
    /**
     * Determines if a 2D point is positioned on top of any of the floor meshes.
     *
     * @param point - The 2D coordinates of the point to check.
     * @param floorMeshes - The list of floor meshes to check against.
     * @returns `true` if the point is on any floor mesh, `false` otherwise.
     */
    private isPointOnFloor;
    /**
     * Calculates the bounding box of a model's physical mesh elements, excluding helpers, gizmos, and floor meshes.
     *
     * @param mobileModel - The model whose physical bounding box needs to be calculated.
     * @returns A THREE.Box3 representing the bounding box.
     */
    private getPhysicalModelBox;
    /**
     * Checks if the active model's physical footprint is fully within the boundaries of the floor meshes.
     *
     * @param mobileModel - The model to check.
     * @returns `true` if the model is inside floor bounds, `false` otherwise.
     */
    private isModelInsideFloorBounds;
    /**
     * Checks for collisions between an active model and the scene during transformation (move/rotate).
     * If a collision occurs, it restores the model to its last known valid position.
     *
     * @param mobileModel - The THREE.Object3D currently being transformed.
     * @param lastValidPosition - A reference Vector3 used to store/restore valid coordinates.
     * @param currentBoxHelper - An optional helper to visually indicate collision (e.g., color change).
     * @returns `true` if a collision occurred (and model was reverted), `false` otherwise.
     */
    checkModelCollision(mobileModel: THREE.Object3D, lastValidPosition: THREE.Vector3, lastValidRotation: THREE.Quaternion, currentBoxHelper: THREE.Box3Helper | THREE.LineSegments | null): boolean;
}
