import { Box3, Euler, Mesh, Object3D, Quaternion, Vector2, Vector3 } from "three";

type Point = Vector2;
export interface PlacementWall { start: Vector2; end: Vector2; halfThickness?: number }
const EPS = 1e-6;
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;

/** The whole back edge must be supported by this finite wall segment. */
function onWall(center: Point, footprint: Point[], wall: PlacementWall): boolean {
  const direction = wall.end.clone().sub(wall.start).normalize();
  const normal = new Vector2(-direction.y, direction.x);
  const points = footprint.map(p => p.clone().add(center).sub(wall.start));
  return Math.abs(Math.min(...points.map(p => p.dot(normal))) - (wall.halfThickness ?? 0)) <= EPS &&
    Math.min(...points.map(p => p.dot(direction))) >= -EPS &&
    Math.max(...points.map(p => p.dot(direction))) <= wall.start.distanceTo(wall.end) + EPS;
}

const minProjection = (points: Point[], axis: Point) => Math.min(...points.map(p => p.dot(axis)));
const maxProjection = (points: Point[], axis: Point) => Math.max(...points.map(p => p.dot(axis)));
const expandObstacle = (polygon: Point[], footprint: Point[]) =>
  hull(polygon.flatMap(p => footprint.map(q => p.clone().sub(q))));

export function physicalFootprint(object: Object3D): Point[] {
  object.updateWorldMatrix(true, true);
  const points: Point[] = [];
  object.traverse(node => { if (node instanceof Mesh) points.push(...meshFootprint(node)); });
  return hull(points);
}
function clockwiseWalls(walls: PlacementWall[]): PlacementWall[] {
  const remaining = walls.map(w => ({ ...w, start: w.start.clone(), end: w.end.clone() }));
  const result: PlacementWall[] = [];
  while (remaining.length) {
    const chain = [remaining.shift()!];
    while (remaining.length) {
      const end = chain[chain.length - 1].end;
      const next = remaining.findIndex(w => w.start.distanceTo(end) < EPS || w.end.distanceTo(end) < EPS);
      if (next < 0) break;
      const wall = remaining.splice(next, 1)[0];
      if (wall.end.distanceTo(end) < EPS) [wall.start, wall.end] = [wall.end, wall.start];
      chain.push(wall);
      if (wall.end.distanceTo(chain[0].start) < EPS) break;
    }
    if (chain.reduce((area, w) => area + cross(w.start, w.end), 0) < 0) {
      chain.reverse();
      chain.forEach(w => { [w.start, w.end] = [w.end, w.start]; });
    }
    let first = 0;
    chain.forEach((w, i) => {
      if (w.start.y < chain[first].start.y - EPS ||
        (Math.abs(w.start.y - chain[first].start.y) < EPS && w.start.x < chain[first].start.x)) first = i;
    });
    result.push(...chain.slice(first), ...chain.slice(0, first));
  }
  return result;
}

function hull(points: Point[]): Point[] {
  const sorted = points.sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((p, i, all) => !i || p.distanceToSquared(all[i - 1]) > EPS * EPS);
  const half = (list: Point[]) => {
    const result: Point[] = [];
    for (const p of list) {
      while (result.length > 1 && cross(result[result.length - 1].clone().sub(result[result.length - 2]),
        p.clone().sub(result[result.length - 1])) <= EPS) result.pop();
      result.push(p);
    }
    return result;
  };
  return [...half(sorted).slice(0, -1), ...half([...sorted].reverse()).slice(0, -1)];
}

/** Physical bounds deliberately exclude selection outlines and measurement lines. */
export function physicalBox(object: Object3D): Box3 {
  object.updateWorldMatrix(true, true);
  const box = new Box3();
  object.traverse(node => {
    if (node instanceof Mesh) box.union(new Box3().setFromObject(node, true));
  });
  return box;
}

export function meshFootprint(mesh: Mesh): Point[] {
  mesh.updateWorldMatrix(true, false);
  const points: Point[] = [];
  const vertices = mesh.geometry.attributes.position;
  const p = new Vector3();
  for (let i = 0; i < vertices.count; i++) {
    p.fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld);
    points.push(new Vector2(p.x, p.z));
  }
  return hull(points);
}

export function boxFootprint(box: Box3): Point[] {
  return [new Vector2(box.min.x, box.min.z), new Vector2(box.max.x, box.min.z),
    new Vector2(box.max.x, box.max.z), new Vector2(box.min.x, box.max.z)];
}

/** Search the boundary of free translation space, rather than a grid that can miss narrow gaps.
 * Convex physical footprints retain model rotation without inflated world-axis boxes.
 */
export function findAutomaticPlacement(
  model: Object3D, bounds: Box3, obstacles: Point[][], walls: PlacementWall[],
  selected: Object3D | null, floorY: number, isValid: () => boolean,
): { position: Vector3; rotation: Euler } | null {
  const originalRotation = model.quaternion.clone();
  const originalPosition = model.position.clone();
  // Follow connected endpoints (including concave corners), not angles around a centroid.
  const ordered = clockwiseWalls(walls);
  const selectedBox = selected ? physicalBox(selected) : null;
  const selectedFootprint = selected ? physicalFootprint(selected) : [];
  let first = 0;
  if (selectedBox && ordered.length) {
    const p = selectedBox.getCenter(new Vector3());
    const footprint = selectedFootprint;
    const heading = new Vector3(1, 0, 0).applyQuaternion(selected!.getWorldQuaternion(new Quaternion()));
    let distance = Infinity;
    let alignment = -Infinity;
    ordered.forEach((wall, index) => {
      const d = wall.end.clone().sub(wall.start);
      const t = Math.max(0, Math.min(1, new Vector2(p.x, p.z).sub(wall.start).dot(d) / d.lengthSq()));
      const direction = d.clone().normalize();
      const normal = new Vector2(-direction.y, direction.x);
      // At a corner the center of a deep model can be closer to the side wall.
      // Measure clearance from its footprint and use its heading to retain the run.
      const clearance = Math.abs(Math.min(...footprint.map(point => point.clone().sub(wall.start).dot(normal))) - (wall.halfThickness ?? 0));
      const beyondEndpoint = t === 0 || t === 1;
      const value = beyondEndpoint ? wall.start.clone().addScaledVector(d, t).distanceTo(new Vector2(p.x, p.z)) : clearance;
      const facing = direction.dot(new Vector2(heading.x, heading.z).normalize());
      if (value < distance - EPS || (Math.abs(value - distance) <= EPS && facing > alignment)) {
        distance = value;
        alignment = facing;
        first = index;
      }
    });
  }
  const runs = [...ordered.slice(first), ...ordered.slice(0, first)];
  const corners = boxFootprint(bounds);
  const orientations: PlacementWall[] = runs.length ? runs : corners.map((start, i) => ({ start, end: corners[(i + 1) % corners.length] }));
  const selectedWall = selected ? orientations.find(w => onWall(new Vector2(), selectedFootprint, w)) : undefined;
  try {
    // Selection takes priority over the nearest wall, including models in the
    // interior or manually rotated away from a wall. Right follows local +X.
    if (selected && selectedBox && !selectedBox.isEmpty()) {
      const heading = new Vector3(1, 0, 0).applyQuaternion(selected.getWorldQuaternion(new Quaternion()));
      const direction = new Vector2(heading.x, heading.z);
      if (direction.lengthSq() > EPS * EPS) {
        direction.normalize();
        const normal = new Vector2(-direction.y, direction.x);
        const originalHeading = new Vector3(1, 0, 0).applyQuaternion(originalRotation);
        const yaw = Math.atan2(originalHeading.z, originalHeading.x) - Math.atan2(direction.y, direction.x);
        model.quaternion.copy(originalRotation).premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw));
        model.position.set(0, 0, 0);
        const box = physicalBox(model);
        if (!box.isEmpty()) {
          const size = box.getSize(new Vector3()), offset = box.getCenter(new Vector3());
          const hx = size.x / 2, hz = size.z / 2;
          const footprint = selectedFootprint;
          const shape = physicalFootprint(model).map(p => p.sub(new Vector2(offset.x, offset.z)));
          const along = Math.max(...footprint.map(p => p.dot(direction))) - minProjection(shape, direction);
          const across = Math.min(...footprint.map(p => p.dot(normal))) - minProjection(shape, normal);
          const candidate = direction.clone().multiplyScalar(along).addScaledVector(normal, across);
          const inside = candidate.x >= bounds.min.x + hx - EPS && candidate.x <= bounds.max.x - hx + EPS &&
            candidate.y >= bounds.min.z + hz - EPS && candidate.y <= bounds.max.z - hz + EPS;
          const occupied = obstacles.filter(p => p.length >= 3).some(polygon => {
            const expanded = expandObstacle(polygon, shape);
            return expanded.every((a, i) => cross(expanded[(i + 1) % expanded.length].clone().sub(a), candidate.clone().sub(a)) > EPS);
          });
          if (inside && !occupied && (!selectedWall || onWall(candidate, shape, selectedWall))) {
            model.position.set(candidate.x - offset.x, floorY - box.min.y, candidate.y - offset.z);
            model.updateMatrixWorld(true);
            if (isValid()) return { position: model.position.clone(), rotation: model.rotation.clone() };
          }
        }
      }
    }
    // Finish wall runs before searching interior space, even when another rotation would fit inside.
    for (const interior of [false, true]) for (const wall of orientations) {
      const direction = wall.end.clone().sub(wall.start).normalize();
      model.quaternion.copy(originalRotation).premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.atan2(direction.y, direction.x)));
      model.position.set(0, 0, 0);
      const box = physicalBox(model);
      if (box.isEmpty()) return null;
      const size = box.getSize(new Vector3());
      const hx = size.x / 2, hz = size.z / 2;
      const offset = box.getCenter(new Vector3());
      const shape = physicalFootprint(model).map(p => p.sub(new Vector2(offset.x, offset.z)));
      const minX = bounds.min.x + hx, maxX = bounds.max.x - hx;
      const minZ = bounds.min.z + hz, maxZ = bounds.max.z - hz;
      if (minX > maxX + EPS || minZ > maxZ + EPS) continue;
      const expanded = obstacles.filter(p => p.length >= 3).map(polygon => expandObstacle(polygon, shape));
      const boundary = [new Vector2(minX, minZ), new Vector2(maxX, minZ), new Vector2(maxX, maxZ), new Vector2(minX, maxZ)];
      const polygons = [...expanded, boundary];
      const edges = polygons.flatMap(p => p.map((a, i) => [a, p[(i + 1) % p.length]]));
      const candidates = polygons.flatMap(p => p.map(v => v.clone()));
      // A wall run is a one-dimensional search: intersect its row with each
      // obstacle below. The quadratic arrangement is only needed for interior placement.
      if (interior) for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
        const [a, b] = edges[i], [c, d] = edges[j];
        const r = b.clone().sub(a), s = d.clone().sub(c), denominator = cross(r, s);
        if (Math.abs(denominator) < EPS) continue;
        const delta = c.clone().sub(a), t = cross(delta, s) / denominator, u = cross(delta, r) / denominator;
        if (t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS) candidates.push(a.clone().addScaledVector(r, t));
      }
      const normal = new Vector2(-direction.y, direction.x);
      // Include the finite wall row itself in the search. Its endpoints and
      // obstacle intersections can be absent from the room-wide arrangement.
      const alongSupport = -minProjection(shape, direction);
      const backSupport = -minProjection(shape, normal) + (wall.halfThickness ?? 0);
      const rowStart = wall.start.clone().addScaledVector(normal, backSupport).addScaledVector(direction, alongSupport);
      const rowEnd = wall.end.clone().addScaledVector(normal, backSupport).addScaledVector(direction, -maxProjection(shape, direction));
      if (wall.start.distanceTo(wall.end) >= alongSupport + maxProjection(shape, direction) - EPS) {
        candidates.push(rowStart, rowEnd);
        const r = rowEnd.clone().sub(rowStart);
        for (const [a, b] of edges) {
          const s = b.clone().sub(a), denominator = cross(r, s);
          if (Math.abs(denominator) < EPS) continue;
          const delta = a.clone().sub(rowStart);
          const t = cross(delta, s) / denominator, u = cross(delta, r) / denominator;
          if (t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS) candidates.push(rowStart.clone().addScaledVector(r, t));
        }
      }
      let preferred: Point | undefined;
      if (selectedBox && wall === orientations[0]) {
        const footprint = selectedFootprint;
        const nextAlong = Math.max(...footprint.map(p => p.dot(direction))) - minProjection(shape, direction);
        const nextAcross = Math.min(...footprint.map(p => p.dot(normal))) - minProjection(shape, normal);
        preferred = direction.clone().multiplyScalar(nextAlong).addScaledVector(normal, nextAcross);
        candidates.unshift(preferred);
      }
      const along = (p: Point) => p.clone().sub(wall.start).dot(direction);
      // Only the row touching this wall belongs to its continuous run.
      const valid = candidates.filter(p => p.x >= minX - EPS && p.x <= maxX + EPS && p.y >= minZ - EPS && p.y <= maxZ + EPS &&
        (interior || onWall(p, shape, wall)) &&
        !expanded.some(poly => poly.every((a, i) => cross(poly[(i + 1) % poly.length].clone().sub(a), p.clone().sub(a)) > EPS)));
      if (!interior && preferred && valid.includes(preferred) && onWall(preferred, shape, wall)) {
        model.position.set(preferred.x - offset.x, floorY - box.min.y, preferred.y - offset.z);
        model.updateMatrixWorld(true);
        if (isValid()) return { position: model.position.clone(), rotation: model.rotation.clone() };
      }
      // Once we turn the corner, start at that wall's beginning rather than
      // projecting the old selection onto every subsequent wall.
      const selectedEnd = selectedBox && wall === orientations[0]
        ? Math.max(...selectedFootprint.map(along)) : -Infinity;
      valid.sort((a, b) => {
        if (interior) return a.y - b.y || a.x - b.x;
        const aAfter = along(a) + minProjection(shape, direction) >= selectedEnd - EPS;
        const bAfter = along(b) + minProjection(shape, direction) >= selectedEnd - EPS;
        return Number(bAfter) - Number(aAfter) || along(a) - along(b);
      });
      for (const p of valid) {
        if (!interior && !onWall(p, shape, wall)) continue;
        model.position.set(p.x - offset.x, floorY - box.min.y, p.y - offset.z);
        model.updateMatrixWorld(true);
        if (isValid()) return { position: model.position.clone(), rotation: model.rotation.clone() };
      }
    }
    return null;
  } finally {
    model.position.copy(originalPosition);
    model.quaternion.copy(originalRotation);
    model.updateMatrixWorld(true);
  }
}
