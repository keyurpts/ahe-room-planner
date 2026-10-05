import { Box3, BoxGeometry, Matrix4, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { OBB } from 'three/examples/jsm/math/OBB.js';

/** Representative solid colors; replace with approved supplier swatches when available. */
export const WORKTOP_FINISHES = [
  { name: 'ALABASTER', color: '#e8e2d5' },
  { name: 'ALMOND BRITTLE', color: '#c5aa82' },
  { name: 'APRICOT ASH', color: '#c99871' },
  { name: 'AMERICAN OAK', color: '#b58a58' },
  { name: 'BAMBOO', color: '#c9ad70' },
  { name: 'BLACK GRANITE', color: '#292929' },
  { name: 'CINNAMON OAK', color: '#93603e' },
  { name: 'HEVEA', color: '#d6bc90' },
  { name: 'HICKORY MAPLE', color: '#c49e70' },
  { name: 'PEPPER LEAF', color: '#777568' },
  { name: 'SMOKED OAK', color: '#665044' },
  { name: 'TORRONE', color: '#d9ccb5' },
  { name: 'VANILLA CREAM', color: '#f0e5cc' },
] as const;
export interface WorktopConfig { version: 1; depthMm: 600 | 900; thicknessMm: number; finish: string }

export function isBaseCabinet(model: Object3D): boolean {
  const metadata = model.userData.metadata ?? {};
  // Category names are authoritative; names of individual models are not categories.
  const category = metadata.categoryName || metadata.category || '';
  return typeof category === 'string' && /^floor[\s_-]*cupboards?$/i.test(category.trim());
}

/** Upright cabinet frame in world metres, independent of GLB axis correction. */
function cabinetFrame(model: Object3D): Matrix4 {
  model.updateWorldMatrix(true, false);
  const x = new Vector3().setFromMatrixColumn(model.matrixWorld, 0);
  x.y = 0;
  if (x.lengthSq() < 1e-10) x.set(1, 0, 0);
  x.normalize();
  const up = new Vector3(0, 1, 0);
  const front = x.clone().cross(up).normalize();
  return new Matrix4().makeBasis(x, up, front).setPosition(new Vector3().setFromMatrixPosition(model.matrixWorld));
}

/** Bounds in the upright cabinet frame, excluding generated geometry and helpers. */
export function cabinetBounds(model: Object3D): Box3 {
  model.updateWorldMatrix(true, true);
  const inverse = cabinetFrame(model).invert();
  const bounds = new Box3();
  model.traverse(node => {
    if (!(node instanceof Mesh) || node.userData.isWorktop || /helper|gizmo|handle|knob/i.test(`${node.name} ${node.parent?.name ?? ''}`)) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    if (node.geometry.boundingBox) bounds.union(node.geometry.boundingBox.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse, node.matrixWorld)));
  });
  return bounds;
}

function worktopFront(model: Object3D, bounds: Box3): number {
  const explicit = model.userData.metadata?.frontDirection;
  if (explicit === '-Z') return -1;
  if (explicit === '+Z') return 1;
  const inverse = cabinetFrame(model).invert();
  const faces: number[] = [];
  model.traverse(node => {
    if (!(node instanceof Mesh) || node.userData.isWorktop || !/door|handle|knob/i.test(`${node.name} ${node.parent?.name ?? ''}`)) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    if (node.geometry.boundingBox) {
      faces.push(node.geometry.boundingBox.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse, node.matrixWorld)).getCenter(new Vector3()).z);
    }
  });
  return faces.length && faces.reduce((sum, z) => sum + z, 0) / faces.length < (bounds.min.z + bounds.max.z) / 2 ? -1 : 1;
}

const worktopUpdates = new WeakMap<Object3D, string>();
export function ensureWorktop(model: Object3D): void {
  if (!isBaseCabinet(model)) return;
  const config: WorktopConfig = model.userData.worktop ?? { version: 1, depthMm: 600, thicknessMm: 15, finish: 'ALABASTER' };
  model.traverseAncestors(parent => {
    if ((parent as any).isScene && parent.userData.worktopFinish) config.finish = parent.userData.worktopFinish;
  });
  config.depthMm = config.depthMm === 900 ? 900 : 600;
  config.thicknessMm = Number.isFinite(config.thicknessMm) && config.thicknessMm > 0 ? config.thicknessMm : 15;
  const finish = WORKTOP_FINISHES.find(f => f.name === config.finish) ?? WORKTOP_FINISHES[0];
  config.finish = finish.name;
  model.userData.worktop = config;
  model.updateWorldMatrix(true, false);
  const updateKey = [config.depthMm, config.thicknessMm, config.finish, model.userData.metadata?.frontDirection,
    ...model.matrixWorld.elements.map(value => Math.round(value * 1e8)),
    ...model.children.map(child => child.uuid)].join(':');
  if (worktopUpdates.get(model) === updateKey) return;
  const bounds = cabinetBounds(model);
  if (bounds.isEmpty()) return;
  const frame = cabinetFrame(model);
  const depth = config.depthMm / 1000;
  const thickness = config.thicknessMm / 1000;
  // Assets default to +Z front; explicit -Z metadata supports reversed assets.
  const front = worktopFront(model, bounds);
  // Standard slabs start flush at the rear; breakfast bars anchor at the
  // door face with 20 mm front overhang. Both retain their exact depth.
  const rear = front > 0 ? bounds.min.z : bounds.max.z;
  const edge = config.depthMm === 600
    ? rear + front * depth
    : front > 0 ? bounds.max.z + .02 : bounds.min.z - .02;
  const width = bounds.max.x - bounds.min.x;
  const localFrame = new Matrix4().copy(model.matrixWorld).invert().multiply(frame);
  const signature = [width, depth, thickness, edge, bounds.max.y, bounds.min.x, config.finish, ...localFrame.elements].map(value => typeof value === 'number' ? Math.round(value * 1e8) : value).join(':');
  let mesh = model.children.find(node => node.userData.isWorktop) as Mesh<BoxGeometry, MeshStandardMaterial> | undefined;
  if (mesh?.userData.worktopSignature === signature && mesh.userData.resourceOwner === model.uuid) {
    worktopUpdates.set(model, updateKey);
    return;
  }
  if (mesh) {
    // Clones share geometry/material: never dispose resources belonging to their source.
    if (mesh.userData.resourceOwner === model.uuid) { mesh.geometry.dispose(); mesh.material.dispose(); }
    model.remove(mesh);
  }
  mesh = new Mesh(new BoxGeometry(width, thickness, depth), new MeshStandardMaterial({ color: finish.color, roughness: .65 }));
  mesh.name = 'GeneratedWorktop';
  mesh.userData = { isWorktop: true, worktopSignature: signature, resourceOwner: model.uuid, effectiveDepthMm: depth * 1000 };
  mesh.matrixAutoUpdate = false;
  mesh.matrix.copy(localFrame).multiply(new Matrix4().makeTranslation((bounds.min.x + bounds.max.x) / 2, bounds.max.y + thickness / 2, edge - front * depth / 2));
  mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  model.add(mesh);
  worktopUpdates.delete(model);
}

/** Oriented clearance check; includes invisible structural walls. */
export function breakfastBarBlocked(model: Object3D, scene: Object3D): boolean {
  scene.updateMatrixWorld(true);
  ensureWorktop(model);
  const mesh = model.children.find(node => node.userData.isWorktop);
  if (!mesh) return true;
  const bounds = cabinetBounds(model);
  const front = worktopFront(model, bounds);
  const edge = front > 0 ? bounds.max.z + .02 : bounds.min.z - .02;
  const rear = edge - front * .9;
  const cabinetRear = front > 0 ? bounds.min.z : bounds.max.z;
  const extension = new Box3(
    new Vector3(bounds.min.x, bounds.max.y, Math.min(rear, cabinetRear)),
    new Vector3(bounds.max.x, bounds.max.y + .015, Math.max(rear, cabinetRear)),
  );
  // Ignore edge-to-edge contact.
  extension.expandByScalar(-.001);
  const occupied = new OBB().fromBox3(extension).applyMatrix4(cabinetFrame(model));
  let blocked = false;
  scene.updateMatrixWorld(true);
  scene.traverse(node => {
    if (!(node instanceof Mesh) || (node as any).isFloor || /helper|gizmo|boundary_cube|floor/i.test(node.name)) return;
    let own = node === model;
    node.traverseAncestors(parent => { if (parent === model) own = true; });
    if (own) return;
    const wall = (node as any).wall_id || (node as any).wallId || node.userData.wallId || /wall/i.test(node.name) || ['BoxFront', 'BoxBack', 'BoxLeft', 'BoxRight'].includes(node.name);
    let furniture = false;
    node.traverseAncestors(parent => {
      if (parent.userData.isGLBModel && parent.userData.metadata?.id && !/room/i.test(parent.name)) furniture = true;
    });
    if (wall || furniture || node.userData.isWorktop) {
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      if (node.geometry.boundingBox && occupied.intersectsOBB(new OBB().fromBox3(node.geometry.boundingBox).applyMatrix4(node.matrixWorld))) blocked = true;
    }
  });
  return blocked;
}
