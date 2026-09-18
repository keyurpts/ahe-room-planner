import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import { FloorNames } from "../Constants";

/**
 * CollisionSystem handles all BVH-based spatial intersection tests.
 * This class centralizes collision detection logic to simplify model management
 * and provide efficient mesh-to-mesh intersection testing using Bounding Volume Hierarchies (BVH).
 */
export class CollisionSystem {

    /** 
     *  The main scene containing all collidable objects 
     */
    private scene: THREE.Scene;

    /** 
     *  Reusable matrix for coordinate space transformations during intersection tests 
     */
    private tempMatrix = new THREE.Matrix4();

    /**
     * Initializes the CollisionSystem with a reference to the main scene.
     * 
     * @param scene - The THREE.Scene instance where collision checks will be performed.
     */
    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    /**
     * Ensures that all meshes in the provided object hierarchy have a BVH boundsTree.
     * BVH (Bounding Volume Hierarchy) significantly accelerates spatial queries like intersection tests.
     * 
     * @param object - The THREE.Object3D (and its children) to process for BVH generation.
     */
    public ensureBVH(object: THREE.Object3D): void {
        object.traverse((node) => {
            if (node instanceof THREE.Mesh) {
                // Only generate if the geometry doesn't already have a boundsTree
                if (!(node.geometry as any).boundsTree) {
                    try {
                        // Create a new MeshBVH for the geometry
                        (node.geometry as any).boundsTree = new MeshBVH(node.geometry);
                    } catch (e) {
                        console.error(`Failed to create BVH for ${node.name}:`, e);
                    }
                }
            }
        });
    }

    /**
     * Checks for collisions between a temporary preview model and existing objects in the scene.
     * Used primarily during the placement phase to provide visual feedback (e.g., turning red on overlap).
     * 
     * @param preview - The temporary preview THREE.Object3D being positioned.
     * @returns `true` if any part of the preview model intersects with scene objects, otherwise `false`.
     */
    public checkPreviewCollision(preview: THREE.Object3D): boolean {
        if (!preview) return false;

        // Sync world matrices to ensure accurate coordinate transformations
        preview.updateMatrixWorld(true);
        this.scene.updateMatrixWorld(true);

        // Prepare BVH for the preview model
        this.ensureBVH(preview);
        const previewMeshes: THREE.Mesh[] = [];
        preview.traverse((node) => {
            if (node instanceof THREE.Mesh) previewMeshes.push(node);
        });

        // Prepare BVH for the entire scene and collect potential colliders
        this.ensureBVH(this.scene);
        const collidableMeshes: THREE.Mesh[] = [];
        this.scene.traverse((node) => {
            if (node instanceof THREE.Mesh) {
                // Exclude the preview model itself to avoid self-collision detection
                let isSelf = false;
                node.traverseAncestors((ancestor) => {
                    if (ancestor === preview) isSelf = true;
                });
                if (isSelf || node === preview) return;

                // Only consider meshes that have a valid BVH tree
                if ((node.geometry as any).boundsTree) {
                    collidableMeshes.push(node);
                }
            }
        });

        // Perform mesh-to-mesh intersection testing
        let colliding = false;
        for (const previewMesh of previewMeshes) {
            if (colliding) break;

            for (const mesh2 of collidableMeshes) {
                // Filter out non-physical objects like gizmos, helpers, and floor indicators
                let model2: THREE.Object3D | null = mesh2;
                while (model2 && model2.parent && model2.parent.type !== "Scene") {
                    model2 = model2.parent;
                }
                const parentName = model2?.name.toLowerCase() || '';
                if (parentName.includes('helper') || parentName.includes('gizmo') || parentName.includes('control')) continue;
                if (mesh2.name === FloorNames.FLOOR_001 || parentName.includes(FloorNames.FLOOR_001.toLowerCase()) || (mesh2 as any).isFloor || mesh2.name.toLowerCase().includes(FloorNames.FLOOR)) continue;

                // Calculate the transformation matrix from preview mesh space to scene mesh space
                this.tempMatrix.copy(mesh2.matrixWorld).invert().multiply(previewMesh.matrixWorld);

                // Perform the precise intersection test using the BVH tree
                if ((mesh2.geometry as any).boundsTree && (mesh2.geometry as any).boundsTree.intersectsGeometry(previewMesh.geometry, this.tempMatrix)) {
                    colliding = true;
                    break;
                }
            }
        }
        return colliding;
    }
    /**
     * Determines whether a given mesh is considered part of the floor.
     *
     * @param mesh - The mesh to check.
     * @returns `true` if the mesh represents a floor, `false` otherwise.
     */
    private isFloorMesh(mesh: THREE.Mesh): boolean {
        return mesh.name === FloorNames.FLOOR_001 ||
            mesh.name.toLowerCase().includes(FloorNames.FLOOR) ||
            (mesh as any).isFloor === true;
    }

    /**
     * Determines whether a given object should be ignored during collision checks (e.g., helpers, gizmos).
     *
     * @param object - The object to check.
     * @returns `true` if the object is ignored, `false` otherwise.
     */
    private isIgnoredCollisionObject(object: THREE.Object3D): boolean {
        const name = object.name.toLowerCase();
        return name.includes('helper') ||
            name.includes('gizmo') ||
            name.includes('control');
    }

    /**
     * Traverses the scene to find and collect all floor meshes, excluding the active model itself.
     *
     * @param mobileModel - The active model to exclude.
     * @returns An array of floor meshes.
     */
    private collectFloorMeshes(mobileModel: THREE.Object3D): THREE.Mesh[] {
        const floorMeshes: THREE.Mesh[] = [];

        this.scene.traverse((node) => {
            if (!(node instanceof THREE.Mesh)) return;

            let isSelf = node === mobileModel;
            node.traverseAncestors((ancestor) => {
                if (ancestor === mobileModel) isSelf = true;
            });
            if (isSelf) return;

            if (this.isFloorMesh(node)) {
                floorMeshes.push(node);
            }
        });

        return floorMeshes;
    }

    /**
     * Checks if a 2D point (X, Z coordinate space) lies inside a triangle defined by three 3D vertices.
     *
     * @param point - The 2D point to check.
     * @param a - The first vertex of the triangle.
     * @param b - The second vertex of the triangle.
     * @param c - The third vertex of the triangle.
     * @returns `true` if the point is inside the triangle in XZ space, `false` otherwise.
     */
    private pointInTriangleXZ(
        point: THREE.Vector2,
        a: THREE.Vector3,
        b: THREE.Vector3,
        c: THREE.Vector3
    ): boolean {
        const v0x = c.x - a.x;
        const v0z = c.z - a.z;
        const v1x = b.x - a.x;
        const v1z = b.z - a.z;
        const v2x = point.x - a.x;
        const v2z = point.y - a.z;

        const dot00 = v0x * v0x + v0z * v0z;
        const dot01 = v0x * v1x + v0z * v1z;
        const dot02 = v0x * v2x + v0z * v2z;
        const dot11 = v1x * v1x + v1z * v1z;
        const dot12 = v1x * v2x + v1z * v2z;
        const denominator = dot00 * dot11 - dot01 * dot01;

        if (Math.abs(denominator) < Number.EPSILON) return false;

        const inverseDenominator = 1 / denominator;
        const u = (dot11 * dot02 - dot01 * dot12) * inverseDenominator;
        const v = (dot00 * dot12 - dot01 * dot02) * inverseDenominator;
        const tolerance = 1e-6;

        return u >= -tolerance && v >= -tolerance && u + v <= 1 + tolerance;
    }

    /**
     * Determines if a 2D point is positioned on top of any of the floor meshes.
     *
     * @param point - The 2D coordinates of the point to check.
     * @param floorMeshes - The list of floor meshes to check against.
     * @returns `true` if the point is on any floor mesh, `false` otherwise.
     */
    private isPointOnFloor(point: THREE.Vector2, floorMeshes: THREE.Mesh[]): boolean {
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();

        for (const floorMesh of floorMeshes) {
            const geometry = floorMesh.geometry;
            const position = geometry.attributes.position;
            if (!position) continue;

            const index = geometry.index;
            const triangleCount = index ? index.count / 3 : position.count / 3;

            for (let i = 0; i < triangleCount; i++) {
                const ai = index ? index.getX(i * 3) : i * 3;
                const bi = index ? index.getX(i * 3 + 1) : i * 3 + 1;
                const ci = index ? index.getX(i * 3 + 2) : i * 3 + 2;

                a.fromBufferAttribute(position, ai).applyMatrix4(floorMesh.matrixWorld);
                b.fromBufferAttribute(position, bi).applyMatrix4(floorMesh.matrixWorld);
                c.fromBufferAttribute(position, ci).applyMatrix4(floorMesh.matrixWorld);

                if (this.pointInTriangleXZ(point, a, b, c)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Calculates the bounding box of a model's physical mesh elements, excluding helpers, gizmos, and floor meshes.
     *
     * @param mobileModel - The model whose physical bounding box needs to be calculated.
     * @returns A THREE.Box3 representing the bounding box.
     */
    private getPhysicalModelBox(mobileModel: THREE.Object3D): THREE.Box3 {
        const box = new THREE.Box3();
        const vertex = new THREE.Vector3();

        mobileModel.updateWorldMatrix(true, true);

        mobileModel.traverse((node) => {
            if (!(node instanceof THREE.Mesh)) return;
            if (this.isIgnoredCollisionObject(node) || this.isFloorMesh(node)) return;

            const position = node.geometry.attributes.position;
            if (!position) return;

            for (let i = 0; i < position.count; i++) {
                vertex.fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld);
                box.expandByPoint(vertex);
            }
        });

        return box;
    }

    /**
     * Checks if the active model's physical footprint is fully within the boundaries of the floor meshes.
     *
     * @param mobileModel - The model to check.
     * @returns `true` if the model is inside floor bounds, `false` otherwise.
     */
    private isModelInsideFloorBounds(mobileModel: THREE.Object3D): boolean {
        const floorMeshes = this.collectFloorMeshes(mobileModel);
        if (floorMeshes.length === 0) return true;

        const modelBox = this.getPhysicalModelBox(mobileModel);
        if (modelBox.isEmpty()) return true;

        const minX = modelBox.min.x;
        const maxX = modelBox.max.x;
        const minZ = modelBox.min.z;
        const maxZ = modelBox.max.z;
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;

        const footprintPoints = [
            new THREE.Vector2(minX, minZ),
            new THREE.Vector2(centerX, minZ),
            new THREE.Vector2(maxX, minZ),
            new THREE.Vector2(minX, centerZ),
            new THREE.Vector2(centerX, centerZ),
            new THREE.Vector2(maxX, centerZ),
            new THREE.Vector2(minX, maxZ),
            new THREE.Vector2(centerX, maxZ),
            new THREE.Vector2(maxX, maxZ),
        ];

        return footprintPoints.every((point) => this.isPointOnFloor(point, floorMeshes));
    }

    /**
     * Checks for collisions between an active model and the scene during transformation (move/rotate).
     * If a collision occurs, it restores the model to its last known valid position.
     * 
     * @param mobileModel - The THREE.Object3D currently being transformed.
     * @param lastValidPosition - A reference Vector3 used to store/restore valid coordinates.
     * @param currentBoxHelper - An optional helper to visually indicate collision (e.g., color change).
     * @returns `true` if a collision occurred (and model was reverted), `false` otherwise.
     */
    public checkModelCollision(
        mobileModel: THREE.Object3D,
        lastValidPosition: THREE.Vector3,
        lastValidRotation: THREE.Quaternion,
        currentBoxHelper: THREE.Box3Helper | THREE.LineSegments | null
    ): boolean {
        if (!mobileModel) return false;

        // Ensure matrices are up to date for accurate spatial math
        mobileModel.updateMatrixWorld(true);
        this.scene.updateMatrixWorld(true);

        // Ensure BVH exists for the transformed model
        this.ensureBVH(mobileModel);
        const selectedMeshes: THREE.Mesh[] = [];
        mobileModel.traverse((node) => {
            if (node instanceof THREE.Mesh) selectedMeshes.push(node);
        });

        // Collect all potential collidable meshes in the scene
        this.ensureBVH(this.scene);
        const collidableMeshes: THREE.Mesh[] = [];
        this.scene.traverse((node) => {
            if (node instanceof THREE.Mesh) {
                // Skip meshes belonging to the active model itself (Self-Collision)
                let isSelf = false;
                node.traverseAncestors((ancestor) => {
                    if (ancestor === mobileModel) isSelf = true;
                });
                if (isSelf || node === mobileModel) return;

                if ((node.geometry as any).boundsTree) {
                    collidableMeshes.push(node);
                }
            }
        });

        // Iterate through all mesh pairs to detect intersections
        let collided = false;
        for (const mesh1 of selectedMeshes) {
            if (collided) break;

            for (const mesh2 of collidableMeshes) {
                // Ignore administrative objects (Helpers, Gizmos, Selection UI)
                let model2: THREE.Object3D | null = mesh2;
                while (model2 && model2.parent && model2.parent.type !== "Scene") {
                    model2 = model2.parent;
                }
                const parentName = model2?.name.toLowerCase() || '';
                if (this.isIgnoredCollisionObject(mesh2) || (model2 && this.isIgnoredCollisionObject(model2))) continue;
                if (parentName.includes("floor001") || this.isFloorMesh(mesh2)) continue;

                // Transfer coordinates to local space of the second mesh
                this.tempMatrix.copy(mesh2.matrixWorld).invert().multiply(mesh1.matrixWorld);

                // Intersection check
                if ((mesh2.geometry as any).boundsTree && (mesh2.geometry as any).boundsTree.intersectsGeometry(mesh1.geometry, this.tempMatrix)) {
                    collided = true;
                    break;
                }
            }
        }

        const outsideFloorBounds = !this.isModelInsideFloorBounds(mobileModel);
        const invalidTransform = collided || outsideFloorBounds;
        const wasIgnoring = mobileModel.userData.ignoreCollisionUntilClear === true;

        // Apply visual feedback to the bounding box helper
        if (currentBoxHelper) {
            // Change color to red (0xff0000) on collision, or yellow (0xffff00) when clear
            (currentBoxHelper.material as THREE.LineBasicMaterial).color.set(invalidTransform ? 0xff0000 : 0xffff00);
        }

        // Handle collision outcome
        if (invalidTransform) {
            if (collided && !outsideFloorBounds && wasIgnoring) {
                lastValidPosition.copy(mobileModel.position);
                lastValidRotation.copy(mobileModel.quaternion);
                return false;
            }
            // Revert position to the last valid state to prevent overlapping
            mobileModel.position.copy(lastValidPosition);
            mobileModel.quaternion.copy(lastValidRotation);
            mobileModel.updateMatrixWorld(true);
            return true;
        } else {
            if (wasIgnoring) {
                mobileModel.userData.ignoreCollisionUntilClear = false;
            }
            // update last valid position for future checks
            lastValidPosition.copy(mobileModel.position);
            lastValidRotation.copy(mobileModel.quaternion);
            return false;
        }
    }
}

