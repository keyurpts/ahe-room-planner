import { Box3, Euler, Mesh, Object3D, Quaternion, Vector2, Vector3 } from "three";

/**
 * 2D wall segment representation for automatic model placement.
 */
export interface PlacementWall {
  start: Vector2;
  end: Vector2;
  halfThickness?: number;
}

const EPS = 1e-6;

/**
 * Handles automatic mathematical placement of 3D objects along room walls and floor spaces.
 */
export class AutomaticPlacement {
  /**
   * Calculates the 2D cross product of two vectors (z-component of 3D cross product).
   *
   * @param a - First 2D vector.
   * @param b - Second 2D vector.
   * @returns Scalar cross product value.
   */
  private static cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  }

  /**
   * Checks whether an object footprint rests fully on a finite wall segment.
   *
   * @param center - Placement center position of the object.
   * @param footprint - 2D polygon footprint points of the object.
   * @param wall - The wall segment to check against.
   * @returns True if the object's back edge touches the wall within tolerances.
   */
  private static onWall(
    center: Vector2,
    footprint: Vector2[],
    wall: PlacementWall
  ): boolean {
    if (footprint.length === 0) return false;

    // Calculate wall length, direction and normal
    const wallVector = wall.end.clone().sub(wall.start);
    const wallLength = wallVector.length();
    if (wallLength < EPS) return false;

    const direction = wallVector.divideScalar(wallLength);
    const normal = new Vector2(-direction.y, direction.x);
    const halfThickness = wall.halfThickness ?? 0;

    // Measure bounds of the footprint along the wall's normal and direction
    let minNormal = Infinity;
    let minAlong = Infinity;
    let maxAlong = -Infinity;

    for (const point of footprint) {
      // Relative to wall start
      const relX = point.x + center.x - wall.start.x;
      const relY = point.y + center.y - wall.start.y;

      const distNormal = relX * normal.x + relY * normal.y;
      const distAlong = relX * direction.x + relY * direction.y;

      if (distNormal < minNormal) minNormal = distNormal;
      if (distAlong < minAlong) minAlong = distAlong;
      if (distAlong > maxAlong) maxAlong = distAlong;
    }

    // Back edge touches wall surface within tolerance
    if (Math.abs(minNormal - halfThickness) > EPS) {
      return false;
    }

    // Footprint does not extend past wall start
    if (minAlong < -EPS) {
      return false;
    }

    // Footprint does not extend past wall end
    if (maxAlong > wallLength + EPS) {
      return false;
    }

    return true;
  }

  /**
   * Calculates the minimum projection of a set of 2D points along a given axis.
   *
   * @param points - Array of 2D points.
   * @param axis - The projection axis vector.
   * @returns Minimum scalar projection value.
   */
  private static minProjection(points: Vector2[], axis: Vector2): number {
    return Math.min(...points.map((p) => p.dot(axis)));
  }

  /**
   * Calculates the maximum projection of a set of 2D points along a given axis.
   *
   * @param points - Array of 2D points.
   * @param axis - The projection axis vector.
   * @returns Maximum scalar projection value.
   */
  private static maxProjection(points: Vector2[], axis: Vector2): number {
    return Math.max(...points.map((p) => p.dot(axis)));
  }

  /**
   * Expands an obstacle polygon by the Minkowski difference of the object footprint.
   *
   * @param polygon - Obstacle polygon vertices.
   * @param footprint - Object footprint vertices.
   * @returns Convex boundary vertices of the expanded obstacle.
   */
  private static expandObstacle(polygon: Vector2[], footprint: Vector2[]): Vector2[] {
    return AutomaticPlacement.hull(
      polygon.flatMap((p) => footprint.map((q) => p.clone().sub(q)))
    );
  }

  /**
   * Builds and closes a single continuous chain of walls from remaining segments.
   *
   * @param remaining - Pool of wall segments to assemble.
   * @returns Continuous ordered wall segments for a chain.
   */
  private static buildWallChain(
    remaining: { start: Vector2; end: Vector2; halfThickness?: number }[]
  ): { start: Vector2; end: Vector2; halfThickness?: number }[] {

    // Start the chain with the first available wall, add that wall in chain
    const chain = [remaining.shift()!];

    // Continue until all connected walls are added.
    while (remaining.length > 0) {

      // Get the ending point of the last wall in the chain.
      const lastEnd = chain[chain.length - 1].end;

      // Find the next wall that connects to the last wall.
      let nextIndex = -1;

      for (let i = 0; i < remaining.length; i++) {

        const wall = remaining[i];

        // checks whether either endpoint of the current wall matches the ending point of the last wall.
        if (
          wall.start.distanceTo(lastEnd) < EPS ||
          wall.end.distanceTo(lastEnd) < EPS
        ) {
          nextIndex = i;
          break;
        }
      }

      // If no connected wall is found, stop the loop.
      if (nextIndex === -1) {
        break;
      }

      // Remove the connected wall from the remaining list.
      const nextWall = remaining.splice(nextIndex, 1)[0];

      // Check if the wall needs to be reversed.
      if (nextWall.end.distanceTo(lastEnd) < EPS) {

        // Swap the start and end points.
        const temp = nextWall.start;
        nextWall.start = nextWall.end;
        nextWall.end = temp;
      }

      chain.push(nextWall);

      // Check if the chain has connected back to its starting point.
      if (nextWall.end.distanceTo(chain[0].start) < EPS) {
        break;
      }
    }
    return chain;
  }

  /**
   * Orders wall segments in a continuous clockwise chain around the room perimeter.
   *
   * @param walls - Wall segments to order and orient.
   * @returns Continuous clockwise ordered wall segments.
   */
  private static clockwiseWalls(
    walls: { start: Vector2; end: Vector2; halfThickness?: number }[]
  ): { start: Vector2; end: Vector2; halfThickness?: number }[] {
    // Creates copies of the walls so the original wall data is not modified
    const remaining = walls.map((wall) => ({
      ...wall,
      start: wall.start.clone(),
      end: wall.end.clone(),
    }));

    const result: { start: Vector2; end: Vector2; halfThickness?: number }[] = [];

    // Loop until every wall segment is grouped into a chain
    while (remaining.length > 0) {
      const chain = AutomaticPlacement.buildWallChain(remaining);

      // Check signed area to identify the direction of the wall chain. If negative, it is counter-clockwise
      const signedArea = chain.reduce(
        (area, wall) => area + AutomaticPlacement.cross(wall.start, wall.end),
        0
      );

      // If counter-clockwise, reverse order and flip each wall segment to make it clockwise
      if (signedArea < 0) {
        chain.reverse();
        chain.forEach((wall) => {
          const temp = wall.start;
          wall.start = wall.end;
          wall.end = temp;
        });
      }

      // Find canonical starting wall the one with lowest Y (or lowest X if tied)
      let canonicalStartIndex = 0; //Set the starting wall index
      for (let i = 1; i < chain.length; i++) {
        const currentWall = chain[i];
        const bestWall = chain[canonicalStartIndex];

        const hasLowerY = currentWall.start.y < bestWall.start.y - EPS;
        const hasSameY = Math.abs(currentWall.start.y - bestWall.start.y) < EPS;
        const hasLowerX = currentWall.start.x < bestWall.start.x;

        if (hasLowerY || (hasSameY && hasLowerX)) {
          canonicalStartIndex = i;
        }
      }

      // Rotate chain so it begins at canonicalStartIndex
      const rotatedChain = [
        ...chain.slice(canonicalStartIndex),
        ...chain.slice(0, canonicalStartIndex),
      ];
      result.push(...rotatedChain);
    }

    return result;
  }

  /**
   * Computes the convex hull boundary of a set of 2D points.
   *
   * @param points - Array of 2D coordinates.
   * @returns Vertices defining the outer convex polygon.
   */
  private static hull(points: Vector2[]): Vector2[] {

    // Sort all points from left to right.
    points = [...points].sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.y - b.y;
    });

    // Array to store only unique points.
    const unique: Vector2[] = [];

    for (const point of points) {
      let duplicate = false;

      // Check the current point against all points already stored.
      for (const p of unique) {

        // Calculate the distance between the two points If the distance is very small, treat them as the same point.
        if (point.distanceToSquared(p) <= EPS * EPS) {

          // The point is already present, so mark it as a duplicate.
          duplicate = true;
          break;
        }
      }

      // If the point is not a duplicate, add it to the unique array.
      if (!duplicate) {
        unique.push(point);
      }
    }

    // Create a function to find one side of the outer boundary.
    const build = (list: Vector2[]): Vector2[] => {
      const result: Vector2[] = [];
      for (const point of list) {

        // We need at least two existing points to check the turning direction.
        while (result.length >= 2) {

          // Get the second-last point in the boundary.
          const a = result[result.length - 2];

          // Get the last point in the boundary.
          const b = result[result.length - 1];

          // Find the direction from point A to point B.
          const cross = AutomaticPlacement.cross(b.clone().sub(a), point.clone().sub(b));

          // Check whether the three points make a left turn If they make a right turn or almost a straight line, remove the last point because it is not needed.
          if (cross <= EPS) {
            result.pop();
          } else {
            break; // The points make a valid left turn Keep the last point and stop checking.
          }
        }
        // Add the current point to the boundary.
        result.push(point);
      }
      return result;
    };

    // Find the bottom boundary.
    const bottom = build(unique);

    // Find the top boundary Reverse the points so they go from right to left.
    unique.reverse();

    // function to calculate the top boundary.
    const top = build(unique);

    // Remove the last point from the bottom boundary
    bottom.pop();

    // Remove the last point from the top boundary as well.
    top.pop();

    // Join the bottom and top boundaries, This gives us the complete outer boundary of all points.
    return bottom.concat(top);
  }

  /**
   * Computes the physical 3D bounding box of an object excluding helpers and outlines.
   *
   * @param object - 3D object hierarchy to measure.
   * @returns Aggregate world-space bounding box.
   */
  public static physicalBox(object: Object3D): Box3 {
    object.updateWorldMatrix(true, true);
    const box = new Box3();
    object.traverse((node) => {
      if (node instanceof Mesh) {
        box.union(new Box3().setFromObject(node, true));
      }
    });
    return box;
  }

  /**
   * Finds the 2D outer boundary of a 3D mesh on the floor.
   *
   * @param mesh - The 3D object we want to calculate the boundary for.
   * @returns A list of 2D points (X, Z) representing the outer boundary.
   */
  public static meshFootprint(mesh: Mesh): Vector2[] {
    mesh.updateWorldMatrix(true, false);

    const points: Vector2[] = [];

    // Get all the vertex positions from the mesh geometry.
    const vertices = mesh.geometry.attributes.position;

    // Create a temporary 3D vector to store each vertex position.
    const p = new Vector3();

    for (let i = 0; i < vertices.count; i++) {

      // Get the current vertex's local 3D position convert it into world position 
      p.fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld);

      // Keep only X and Z coordinates ignore Y. This converts the 3D point into a 2D point on the floor.
      points.push(new Vector2(p.x, p.z));
    }
    return AutomaticPlacement.hull(points);
  }

  /**
   * Computes the physical 2D polygon footprint of an entire 3D object hierarchy.
   *
   * @param object - 3D object root to measure.
   * @returns 2D convex hull footprint points.
   */
  public static physicalFootprint(object: Object3D): Vector2[] {
    object.updateWorldMatrix(true, true);
    const points: Vector2[] = [];
    object.traverse((node) => {
      if (node instanceof Mesh) {
        points.push(...AutomaticPlacement.meshFootprint(node));
      }
    });
    return AutomaticPlacement.hull(points);
  }

  /**
   * Returns the four corner coordinates of a 3D bounding box in the 2D horizontal plane (X-Z).
   *
   * @param box - 3D bounding box.
   * @returns Array of four corner 2D points.
   */
  public static boxFootprint(box: Box3): Vector2[] {
    return [
      new Vector2(box.min.x, box.min.z),
      new Vector2(box.max.x, box.min.z),
      new Vector2(box.max.x, box.max.z),
      new Vector2(box.min.x, box.max.z),
    ];
  }

  /**
   * Sorts wall segments starting from the one closest or best aligned with the selected object.
   *
   * @param ordered - Ordered list of wall segments.
   * @param selected - Currently selected 3D object (if any).
   * @param selectedBox - Bounding box of the selected object.
   * @param selectedFootprint - 2D footprint of the selected object.
   * @returns Reordered wall segments prioritizing placement near selection.
   */
  private static orderWallsBySelection(
    ordered: PlacementWall[],
    selected: Object3D | null,
    selectedBox: Box3 | null,
    selectedFootprint: Vector2[]
  ): PlacementWall[] {
    // If no walls or no selection, return the original order
    if (!selected || !selectedBox || ordered.length === 0) {
      return ordered;
    }

    // Get the 2D center position and forward facing direction of the selected object
    const center3D = selectedBox.getCenter(new Vector3());
    const selectedCenter = new Vector2(center3D.x, center3D.z);

    const worldQuat = selected.getWorldQuaternion(new Quaternion());
    const heading3D = new Vector3(1, 0, 0).applyQuaternion(worldQuat);
    const selectedHeading = new Vector2(heading3D.x, heading3D.z).normalize();

    let bestWallIndex = 0;
    let minDistance = Infinity;
    let bestAlignment = -Infinity;

    // Check each wall to find the one closest to the selected object
    ordered.forEach((wall, index) => {
      const wallVector = wall.end.clone().sub(wall.start);
      const wallLength = wallVector.length();

      // Skip degenerate zero-length walls
      if (wallLength < EPS) return;

      const wallDirection = wallVector.clone().divideScalar(wallLength);
      const wallNormal = new Vector2(-wallDirection.y, wallDirection.x);

      // Find projection factor t along the wall segment [0, 1]
      const toCenter = selectedCenter.clone().sub(wall.start);
      const t = Math.max(0, Math.min(1, toCenter.dot(wallVector) / (wallLength * wallLength)));

      // If object is past the wall endpoints, measure direct distance to closest endpoint.
      // Otherwise, measure perpendicular distance from wall face to footprint.
      let distanceToWall: number;
      if (t === 0 || t === 1) {
        const closestPointOnWall = wall.start.clone().addScaledVector(wallVector, t);
        distanceToWall = selectedCenter.distanceTo(closestPointOnWall);
      } else {
        const halfThickness = wall.halfThickness ?? 0;
        const minFootprintDist = Math.min(
          ...selectedFootprint.map((pt) => pt.clone().sub(wall.start).dot(wallNormal))
        );
        distanceToWall = Math.abs(minFootprintDist - halfThickness);
      }

      // Check alignment: how closely the wall direction aligns with the object's facing direction
      const facingAlignment = wallDirection.dot(selectedHeading);

      // Pick the wall with the shortest distance; break ties using facing alignment
      const isCloser = distanceToWall < minDistance - EPS;
      const isEquallyClose = Math.abs(distanceToWall - minDistance) <= EPS;
      const isBetterAligned = facingAlignment > bestAlignment;

      if (isCloser || (isEquallyClose && isBetterAligned)) {
        minDistance = distanceToWall;
        bestAlignment = facingAlignment;
        bestWallIndex = index;
      }
    });

    // If the best wall is already the first one, return the array as is
    if (bestWallIndex === 0) {
      return ordered;
    }

    // Split and reorder so the chosen best wall comes first
    const fromBestWallToEnd = ordered.slice(bestWallIndex);
    const fromStartToBestWall = ordered.slice(0, bestWallIndex);
    return fromBestWallToEnd.concat(fromStartToBestWall);
  }

  /**
   * Attempts placing the model immediately next to the currently selected object.
   *
   * @param model - Model object to be placed.
   * @param bounds - Room 3D bounding box.
   * @param obstacles - List of 2D obstacle polygons.
   * @param selected - Currently selected object in the scene.
   * @param selectedBox - Bounding box of the selected object.
   * @param selectedFootprint - Footprint points of the selected object.
   * @param selectedWall - Wall segment the selected object rests against.
   * @param originalRotation - Model's original base orientation.
   * @param isValid - Validation check callback.
   * @returns Calculated position and rotation, or null if placement failed.
   */
  private static tryPlaceNextToSelection(
    model: Object3D,
    bounds: Box3,
    obstacles: Vector2[][],
    selected: Object3D,
    selectedBox: Box3,
    selectedFootprint: Vector2[],
    selectedWall: PlacementWall | undefined,
    originalRotation: Quaternion,
    isValid: () => boolean
  ): { position: Vector3; rotation: Euler } | null {
    // selected box must not be empty
    if (selectedBox.isEmpty()) return null;

    // Get heading and facing direction of selected object
    const selectedQuat = selected.getWorldQuaternion(new Quaternion());
    const selectedHeading3D = new Vector3(1, 0, 0).applyQuaternion(selectedQuat);
    const direction = new Vector2(selectedHeading3D.x, selectedHeading3D.z);

    if (direction.lengthSq() <= EPS * EPS) return null;
    direction.normalize();

    // Normal vector perpendicular to selected direction
    const normal = new Vector2(-direction.y, direction.x);

    // Align candidate model's rotation with selected object
    const originalHeading3D = new Vector3(1, 0, 0).applyQuaternion(originalRotation);
    const yaw =
      Math.atan2(originalHeading3D.z, originalHeading3D.x) -
      Math.atan2(direction.y, direction.x);

    const rotationDiff = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw);
    model.quaternion.copy(originalRotation).premultiply(rotationDiff);
    model.position.set(0, 0, 0);

    // Measure model physical dimensions and footprint
    const box = AutomaticPlacement.physicalBox(model);
    if (box.isEmpty()) return null;

    const size = box.getSize(new Vector3());
    const offset = box.getCenter(new Vector3());
    const halfWidth = size.x / 2;
    const halfDepth = size.z / 2;

    // Model 2D footprint relative to its local center
    const modelOffset = new Vector2(offset.x, offset.z);
    const shape = AutomaticPlacement.physicalFootprint(model).map((p) => p.sub(modelOffset));

    // Position candidate immediately adjacent along the selected object's side
    const along =
      Math.max(...selectedFootprint.map((p) => p.dot(direction))) -
      AutomaticPlacement.minProjection(shape, direction);

    const across =
      Math.min(...selectedFootprint.map((p) => p.dot(normal))) -
      AutomaticPlacement.minProjection(shape, normal);

    const candidate = direction.clone().multiplyScalar(along).addScaledVector(normal, across);

    // Check if candidate fits completely inside room bounds
    const isInsideRoomX =
      candidate.x >= bounds.min.x + halfWidth - EPS &&
      candidate.x <= bounds.max.x - halfWidth + EPS;

    const isInsideRoomZ =
      candidate.y >= bounds.min.z + halfDepth - EPS &&
      candidate.y <= bounds.max.z - halfDepth + EPS;

    if (!isInsideRoomX || !isInsideRoomZ) return null;

    // Check if candidate collides with any room or scene obstacles
    const isOccupied = obstacles
      .filter((poly) => poly.length >= 3)
      .some((polygon) => {
        const expanded = AutomaticPlacement.expandObstacle(polygon, shape);
        return expanded.every(
          (pt, i) =>
            AutomaticPlacement.cross(
              expanded[(i + 1) % expanded.length].clone().sub(pt),
              candidate.clone().sub(pt)
            ) > EPS
        );
      });

    if (isOccupied) return null;

    // If selected object is against a wall, ensure candidate also touches that wall
    if (selectedWall && !AutomaticPlacement.onWall(candidate, shape, selectedWall)) return null;

    // Apply world position and run validation callback
    model.position.set(candidate.x - offset.x, -box.min.y, candidate.y - offset.z);
    model.updateMatrixWorld(true);

    if (isValid()) {
      return {
        position: model.position.clone(),
        rotation: model.rotation.clone(),
      };
    }

    return null;
  }

  /**
   * Calculates the intersection point between two 2D line segments, if any.
   *
   * @param a - Start point of first segment.
   * @param b - End point of first segment.
   * @param c - Start point of second segment.
   * @param d - End point of second segment.
   * @returns 2D intersection point, or null if segments do not intersect.
   */
  private static segmentIntersection(
    a: Vector2,
    b: Vector2,
    c: Vector2,
    d: Vector2
  ): Vector2 | null {
    const r = b.clone().sub(a);
    const s = d.clone().sub(c);
    const denominator = AutomaticPlacement.cross(r, s);

    // Lines are parallel or collinear
    if (Math.abs(denominator) < EPS) return null;

    const delta = c.clone().sub(a);
    const t = AutomaticPlacement.cross(delta, s) / denominator;
    const u = AutomaticPlacement.cross(delta, r) / denominator;

    // Both segments must overlap within [0, 1] range
    const isWithinT = t >= -EPS && t <= 1 + EPS;
    const isWithinU = u >= -EPS && u <= 1 + EPS;

    if (isWithinT && isWithinU) {
      return a.clone().addScaledVector(r, t);
    }

    return null;
  }

  /**
   * Generates candidate placement translation points along wall rows and polygon boundaries.
   *
   * @param wall - The target wall segment.
   * @param direction - Direction vector of the wall.
   * @param normal - Perpendicular normal vector of the wall.
   * @param shape - Footprint polygon of the model.
   * @param polygons - All room and obstacle polygons.
   * @param edges - Boundary edges from polygons.
   * @param interior - Whether interior free space is being searched.
   * @returns Array of candidate 2D position vectors.
   */
  private static generatePlacementCandidates(
    wall: PlacementWall,
    direction: Vector2,
    normal: Vector2,
    shape: Vector2[],
    polygons: Vector2[][],
    edges: [Vector2, Vector2][],
    interior: boolean
  ): Vector2[] {
    // 1. Initial candidates: all polygon corner vertices
    const candidates = polygons.flatMap((poly) => poly.map((pt) => pt.clone()));

    // 2. Interior mode: find intersections between obstacle edges
    if (interior) {
      for (let i = 0; i < edges.length; i++) {
        for (let j = i + 1; j < edges.length; j++) {
          const [a, b] = edges[i];
          const [c, d] = edges[j];
          const intersection = AutomaticPlacement.segmentIntersection(a, b, c, d);
          if (intersection) {
            candidates.push(intersection);
          }
        }
      }
    }

    // 3. Compute wall-aligned placement row (offset by model depth and wall thickness)
    const alongSupport = -AutomaticPlacement.minProjection(shape, direction);
    const halfThickness = wall.halfThickness ?? 0;
    const backSupport = -AutomaticPlacement.minProjection(shape, normal) + halfThickness;

    const rowStart = wall.start
      .clone()
      .addScaledVector(normal, backSupport)
      .addScaledVector(direction, alongSupport);

    const maxAlongShape = AutomaticPlacement.maxProjection(shape, direction);
    const rowEnd = wall.end
      .clone()
      .addScaledVector(normal, backSupport)
      .addScaledVector(direction, -maxAlongShape);

    // 4. If the model fits along this wall, add endpoints and edge intersections along the row
    const wallLength = wall.start.distanceTo(wall.end);
    const requiredLength = alongSupport + maxAlongShape;

    if (wallLength >= requiredLength - EPS) {
      candidates.push(rowStart, rowEnd);

      // Find intersection points where obstacle edges cross this wall row line
      for (const [edgeStart, edgeEnd] of edges) {
        const intersection = AutomaticPlacement.segmentIntersection(
          rowStart,
          rowEnd,
          edgeStart,
          edgeEnd
        );
        if (intersection) {
          candidates.push(intersection);
        }
      }
    }

    return candidates;
  }

  /**
   * Filters and sorts candidate points to ensure they stay inside bounds, collision-free, and aligned.
   *
   * @param candidates - Generated candidate positions.
   * @param minX - Minimum valid X coordinate in room.
   * @param maxX - Maximum valid X coordinate in room.
   * @param minZ - Minimum valid Z coordinate in room.
   * @param maxZ - Maximum valid Z coordinate in room.
   * @param interior - Whether interior free space is being evaluated.
   * @param shape - Model footprint polygon.
   * @param wall - Target wall segment.
   * @param direction - Direction vector of the wall.
   * @param expanded - Expanded obstacle polygons.
   * @param selectedBox - Selected object's bounding box.
   * @param selectedFootprint - Selected object's footprint vertices.
   * @param isFirstWall - Whether this is the priority wall.
   * @returns Filtered and sorted valid candidate positions.
   */
  private static filterAndSortCandidates(
    candidates: Vector2[],
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    interior: boolean,
    shape: Vector2[],
    wall: { start: Vector2; end: Vector2; halfThickness?: number },
    direction: Vector2,
    expanded: Vector2[][],
    selectedBox: Box3 | null,
    selectedFootprint: Vector2[],
    isFirstWall: boolean
  ): Vector2[] {
    const along = (p: Vector2) => p.clone().sub(wall.start).dot(direction);
    const valid = candidates.filter(
      (p) =>
        p.x >= minX - EPS &&
        p.x <= maxX + EPS &&
        p.y >= minZ - EPS &&
        p.y <= maxZ + EPS &&
        (interior || AutomaticPlacement.onWall(p, shape, wall)) &&
        !expanded.some((poly) =>
          poly.every(
            (a, i) =>
              AutomaticPlacement.cross(
                poly[(i + 1) % poly.length].clone().sub(a),
                p.clone().sub(a)
              ) > EPS
          )
        )
    );
    const selectedEnd =
      selectedBox && isFirstWall
        ? Math.max(...selectedFootprint.map(along))
        : -Infinity;
    valid.sort((a, b) => {
      if (interior) return a.y - b.y || a.x - b.x;
      const aAfter =
        along(a) + AutomaticPlacement.minProjection(shape, direction) >= selectedEnd - EPS;
      const bAfter =
        along(b) + AutomaticPlacement.minProjection(shape, direction) >= selectedEnd - EPS;
      return Number(bAfter) - Number(aAfter) || along(a) - along(b);
    });
    return valid;
  }

  /**
   * Attempts placing the model along a specific wall orientation and interior mode.
   *
   * @param model - Model object to be placed.
   * @param wall - Wall segment being evaluated.
   * @param interior - Whether to search interior room space.
   * @param orientations - Ordered wall runs for the room.
   * @param originalRotation - Model's original base orientation.
   * @param bounds - Room 3D bounding box.
   * @param obstacles - Room and model obstacle polygons.
   * @param selectedBox - Selected object's bounding box.
   * @param selectedFootprint - Selected object's footprint vertices.
   * @param isValid - Validation check callback.
   * @returns Calculated position and rotation, or null/undefined if invalid.
   */
  private static tryPlaceOnWallOrientation(
    model: Object3D,
    wall: PlacementWall,
    interior: boolean,
    orientations: PlacementWall[],
    originalRotation: Quaternion,
    bounds: Box3,
    obstacles: Vector2[][],
    selectedBox: Box3 | null,
    selectedFootprint: Vector2[],
    isValid: () => boolean
  ): { position: Vector3; rotation: Euler } | null | undefined {
    // Calculate wall direction and align model rotation to wall
    const wallVector = wall.end.clone().sub(wall.start);
    const wallLength = wallVector.length();
    if (wallLength < EPS) return undefined;

    const direction = wallVector.divideScalar(wallLength);
    const wallAngle = -Math.atan2(direction.y, direction.x);
    const rotationToWall = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), wallAngle);

    model.quaternion.copy(originalRotation).premultiply(rotationToWall);
    model.position.set(0, 0, 0);

    // Measure model's physical dimensions and local footprint
    const box = AutomaticPlacement.physicalBox(model);
    if (box.isEmpty()) return null;

    const size = box.getSize(new Vector3());
    const offset = box.getCenter(new Vector3());
    const halfWidth = size.x / 2;
    const halfDepth = size.z / 2;

    const modelOffset = new Vector2(offset.x, offset.z);
    const shape = AutomaticPlacement.physicalFootprint(model).map((pt) => pt.sub(modelOffset));

    // Define valid room boundary limits (inset by model half dimensions)
    const minX = bounds.min.x + halfWidth;
    const maxX = bounds.max.x - halfWidth;
    const minZ = bounds.min.z + halfDepth;
    const maxZ = bounds.max.z - halfDepth;

    if (minX > maxX + EPS || minZ > maxZ + EPS) return undefined;

    // Expand obstacles by model footprint shape (Minkowski sum for collision avoidance)
    const expandedObstacles = obstacles
      .filter((poly) => poly.length >= 3)
      .map((polygon) => AutomaticPlacement.expandObstacle(polygon, shape));

    const roomBoundary = [
      new Vector2(minX, minZ),
      new Vector2(maxX, minZ),
      new Vector2(maxX, maxZ),
      new Vector2(minX, maxZ),
    ];

    const polygons = [...expandedObstacles, roomBoundary];
    const edges: [Vector2, Vector2][] = polygons.flatMap((poly) =>
      poly.map((pt, i): [Vector2, Vector2] => [pt, poly[(i + 1) % poly.length]])
    );
    const normal = new Vector2(-direction.y, direction.x);

    // Generate candidate positions along wall lines and polygon vertices
    const candidates = AutomaticPlacement.generatePlacementCandidates(
      wall,
      direction,
      normal,
      shape,
      polygons,
      edges,
      interior
    );

    // If currently evaluating the first wall and an object is selected, prioritize adjacent placement
    const isFirstWall = wall === orientations[0];
    let preferred: Vector2 | undefined;

    if (selectedBox && isFirstWall) {
      const nextAlong =
        Math.max(...selectedFootprint.map((pt) => pt.dot(direction))) -
        AutomaticPlacement.minProjection(shape, direction);

      const nextAcross =
        Math.min(...selectedFootprint.map((pt) => pt.dot(normal))) -
        AutomaticPlacement.minProjection(shape, normal);

      preferred = direction
        .clone()
        .multiplyScalar(nextAlong)
        .addScaledVector(normal, nextAcross);

      candidates.unshift(preferred);
    }

    // Filter and sort candidate coordinates
    const validCandidates = AutomaticPlacement.filterAndSortCandidates(
      candidates,
      minX,
      maxX,
      minZ,
      maxZ,
      interior,
      shape,
      wall,
      direction,
      expandedObstacles,
      selectedBox,
      selectedFootprint,
      isFirstWall
    );

    // Helper to test candidate position and return placement result if valid
    const tryCandidate = (candidatePos: Vector2): { position: Vector3; rotation: Euler } | null => {
      // For wall runs, ensure the candidate actually rests against the wall
      if (!interior && !AutomaticPlacement.onWall(candidatePos, shape, wall)) return null;

      model.position.set(candidatePos.x - offset.x, -box.min.y, candidatePos.y - offset.z);
      model.updateMatrixWorld(true);

      if (isValid()) {
        return {
          position: model.position.clone(),
          rotation: model.rotation.clone(),
        };
      }

      return null;
    };

    // If preferred adjacent candidate is valid, test it first
    if (!interior && preferred && validCandidates.includes(preferred)) {
      const preferredResult = tryCandidate(preferred);
      if (preferredResult) return preferredResult;
    }

    // Test each sorted valid candidate
    for (const candidatePos of validCandidates) {
      const result = tryCandidate(candidatePos);
      if (result) return result;
    }

    return undefined;
  }

  /**
   * Searches for a valid automatic placement position and rotation for a 3D model.
   *
   * @param model - Model object to place.
   * @param bounds - Room 3D bounding box.
   * @param obstacles - Room and placed model obstacle polygons.
   * @param walls - Wall segments in the room.
   * @param selected - Currently selected object in the scene.
   * @param isValid - Validation check callback.
   * @returns Calculated position and rotation, or null if no valid placement was found.
   */
  public static findAutomaticPlacement(
    model: Object3D,
    bounds: Box3,
    obstacles: Vector2[][],
    walls: { start: Vector2; end: Vector2; halfThickness?: number }[],
    selected: Object3D | null,
    isValid: () => boolean
  ): { position: Vector3; rotation: Euler } | null {
    const originalRotation = model.quaternion.clone();
    const ordered = AutomaticPlacement.clockwiseWalls(walls);
    const selectedBox = selected ? AutomaticPlacement.physicalBox(selected) : null;
    const selectedFootprint = selected ? AutomaticPlacement.physicalFootprint(selected) : [];

    // Order wall runs based on current selection
    const runs = AutomaticPlacement.orderWallsBySelection(
      ordered,
      selected,
      selectedBox,
      selectedFootprint
    );

    const corners = AutomaticPlacement.boxFootprint(bounds);
    const orientations: { start: Vector2; end: Vector2; halfThickness?: number }[] =
      runs.length
        ? runs
        : corners.map((start, i) => ({
          start,
          end: corners[(i + 1) % corners.length],
        }));
    const selectedWall = selected
      ? orientations.find((w) => AutomaticPlacement.onWall(new Vector2(), selectedFootprint, w))
      : undefined;

    // Selection takes priority over nearest wall
    if (selected && selectedBox) {
      const directPlacement = AutomaticPlacement.tryPlaceNextToSelection(
        model,
        bounds,
        obstacles,
        selected,
        selectedBox,
        selectedFootprint,
        selectedWall,
        originalRotation,
        isValid
      );
      if (directPlacement) return directPlacement;
    }

    // Finish wall runs before searching interior space, even when another rotation would fit inside.
    for (const interior of [false, true]) {
      for (const wall of orientations) {
        const placement = AutomaticPlacement.tryPlaceOnWallOrientation(
          model,
          wall,
          interior,
          orientations,
          originalRotation,
          bounds,
          obstacles,
          selectedBox,
          selectedFootprint,
          isValid
        );
        if (placement !== undefined) return placement;
      }
    }

    return null;
  }
}
