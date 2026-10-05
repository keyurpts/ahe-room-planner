import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
import { OBB } from 'three/examples/jsm/math/OBB.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const source = fs.readFileSync(new URL('../src/Components/WorktopManager.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function('require', 'exports', compiled)(name => name === 'three' ? THREE : { OBB }, api);
const { ensureWorktop, breakfastBarBlocked, WORKTOP_FINISHES } = api;
const coreSource = ts.createSourceFile('core.ts', fs.readFileSync(new URL('../src/ConfiguratorCore.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const coreClass = coreSource.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'ConfiguratorCore');
const globalMethods = coreClass.members.filter(node => ['getWorktopFinish', 'setWorktopFinish'].includes(node.name?.getText(coreSource))).map(node => node.getText(coreSource));
const globalCode = ts.transpile(`class TestCore { ${globalMethods.join('\n')} }`, { target: ts.ScriptTarget.ES2020 });
const TestCore = new Function('WORKTOP_FINISHES', 'isBaseCabinet', 'ensureWorktop', 'Events', 'ConfiguratorEventType', `${globalCode}; return TestCore;`)(WORKTOP_FINISHES, api.isBaseCabinet, ensureWorktop, { emit() {} }, { WORKTOP_UPDATED: 'worktopUpdated' });
test('global worktop color updates all cabinets, preserves depths and applies to future cabinets', () => {
  const core = new TestCore(); core.scene = new THREE.Scene();
  const first = cabinet(), second = cabinet(); core.scene.add(first, second);
  ensureWorktop(first); ensureWorktop(second); second.userData.worktop.depthMm = 900;
  assert.equal(core.setWorktopFinish('SMOKED OAK'), true);
  assert.equal(first.userData.worktop.finish, 'SMOKED OAK');
  assert.equal(second.userData.worktop.finish, 'SMOKED OAK');
  assert.equal(second.userData.worktop.depthMm, 900);
  const added = cabinet(); core.scene.add(added); ensureWorktop(added);
  assert.equal(added.userData.worktop.finish, 'SMOKED OAK');
  assert.equal(core.getWorktopFinish(), 'SMOKED OAK');
  assert.equal(core.setWorktopFinish('invalid'), false);
});
function cabinet() {
  const model = new THREE.Group();
  model.userData = { isGLBModel: true, metadata: { category: 'Floor cupboard' } };
  const body = new THREE.Mesh(new THREE.BoxGeometry(.8, .72, .58), new THREE.MeshStandardMaterial());
  body.position.y = .36;
  model.add(body);
  return model;
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
test('left and right neighbors allow breakfast bars, including merged mesh empty bounds', () => {
  const scene = new THREE.Scene(), model = cabinet(); scene.add(model);
  for (const x of [-.8, .8]) {
    const neighbor = cabinet(); neighbor.position.x = x; scene.add(neighbor);
    ensureWorktop(neighbor); neighbor.userData.worktop.depthMm = 900; ensureWorktop(neighbor);
  }
  assert.equal(breakfastBarBlocked(model, scene), false);
  const surround = new THREE.Mesh(mergeGeometries([
    new THREE.BoxGeometry(.1, 2, 2).translate(-1, 1, 0),
    new THREE.BoxGeometry(.1, 2, 2).translate(1, 1, 0),
  ]), new THREE.MeshStandardMaterial());
  surround.name = 'wall'; scene.add(surround);
  assert.equal(breakfastBarBlocked(model, scene), false);
  model.userData.worktop.depthMm = 900; ensureWorktop(model);
  scene.children[1].position.x -= .2;
  ensureWorktop(model);
  assert.equal(model.userData.worktop.depthMm, 900);
});
test('idle worktops skip mesh traversal and movement reuses geometry', () => {
  const model = cabinet(); ensureWorktop(model); ensureWorktop(model);
  const mesh = model.children.find(node => node.userData.isWorktop);
  let traversals = 0;
  const traverse = model.traverse.bind(model);
  model.traverse = callback => { traversals++; return traverse(callback); };
  for (let i = 0; i < 100; i++) ensureWorktop(model);
  assert.equal(traversals, 0);
  model.position.set(1.123456789, 0, -.87654321);
  ensureWorktop(model);
  assert.equal(model.children.find(node => node.userData.isWorktop), mesh);
  assert.equal(model.children.find(node => node.userData.isWorktop).geometry, mesh.geometry);
});
test('Floor cupboard catalogue models receive worktops without explicit flags', () => {
  for (const category of ['Floor cupboard', 'Floor Cupboards', 'floor-cupboard']) {
    const model = cabinet();
    model.userData.metadata = { category, name: 'Cupboard 600' };
    ensureWorktop(model);
    assert.equal(model.children.filter(node => node.userData.isWorktop).length, 1);
    assert.equal(model.userData.worktop.depthMm, 600);
  }
  const wall = cabinet(); wall.userData.metadata = { category: 'Wall cupboard' };
  ensureWorktop(wall);
  assert.equal(wall.children.length, 1);
});
test('worktops are restricted to Floor cupboard even with legacy base flags', () => {
  const model = cabinet(); model.userData.metadata.category = 'kitchen-cabinet';
  ensureWorktop(model);
  assert.equal(model.children.filter(c => c.userData.isWorktop).length, 0);
  const tall = cabinet(); tall.userData.metadata.category = 'kitchen-cabinet'; tall.scale.y = 3;
  ensureWorktop(tall);
  assert.equal(tall.children.length, 1);
  const flagged = cabinet(); flagged.userData.metadata = { category: 'Drawer cupboard', isBaseCabinet: true };
  ensureWorktop(flagged); assert.equal(flagged.children.length, 1);
  const apiModel = cabinet(); apiModel.userData.metadata = { category: 'category-guid', categoryName: 'Floor cupboard', isBaseCabinet: false };
  ensureWorktop(apiModel); assert.equal(apiModel.children.length, 2);
});
test('default worktop matches cabinet width and has 20 mm front overhang', () => {
  const model = cabinet();
  ensureWorktop(model);
  const mesh = model.children.find(c => c.userData.isWorktop);
  near(mesh.geometry.parameters.width, .8);
  near(mesh.geometry.parameters.depth, .6);
  near(mesh.geometry.parameters.height, .015);
  near(mesh.position.z + .3, .31);
  near(mesh.position.y - .0075, .72);
  ensureWorktop(model);
  assert.equal(model.children.filter(c => c.userData.isWorktop).length, 1);
});
test('900 mm extends only the rear and survives parameter JSON round trip', () => {
  const model = cabinet();
  ensureWorktop(model);
  model.userData.worktop.depthMm = 900;
  model.userData.worktop.finish = 'BLACK GRANITE';
  ensureWorktop(model);
  const mesh = model.children.find(c => c.userData.isWorktop);
  near(mesh.position.z + .45, .31);
  near(mesh.position.z - .45, -.59);
  assert.equal(mesh.material.color.getHexString(), '292929');
  const restored = cabinet();
  restored.userData.worktop = JSON.parse(JSON.stringify(model.userData.worktop));
  ensureWorktop(restored);
  assert.deepEqual(restored.userData.worktop, model.userData.worktop);
});
test('rotated wall blocks the rear extension but a side wall permits a peninsula', () => {
  const scene = new THREE.Scene(), model = cabinet();
  scene.add(model);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3, 3, .1), new THREE.MeshStandardMaterial());
  wall.name = 'wall'; wall.position.z = -.34; scene.add(wall);
  assert.equal(breakfastBarBlocked(model, scene), true);
  wall.position.set(-.45, 0, 0); wall.rotation.y = Math.PI / 2;
  assert.equal(breakfastBarBlocked(model, scene), false);
  model.rotation.y = Math.PI / 4;
  wall.rotation.y = Math.PI / 4;
  wall.position.copy(new THREE.Vector3(0, 0, -.34).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4));
  assert.equal(breakfastBarBlocked(model, scene), true);
});
test('scaled assets retain physical depth and thickness; clones own resources', () => {
  const model = cabinet(); model.scale.setScalar(.5); ensureWorktop(model);
  const mesh = model.children.find(c => c.userData.isWorktop);
  near(mesh.geometry.parameters.depth, .6);
  near(mesh.geometry.parameters.height, .015);
  const clone = model.clone(true); ensureWorktop(clone);
  const copied = clone.children.find(c => c.userData.isWorktop);
  assert.notEqual(copied.geometry, mesh.geometry);
  assert.notEqual(copied.material, mesh.material);
});
test('600 mm anchors flush at rear while 900 mm retains 20 mm front overhang', () => {
  const model = cabinet();
  model.children[0].geometry = new THREE.BoxGeometry(.8, .72, .6);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(.02, .1, .04), new THREE.MeshStandardMaterial());
  handle.name = 'DoorHandle'; handle.position.set(0, .4, -.33); model.add(handle);
  ensureWorktop(model); model.updateMatrixWorld(true);
  let top = new THREE.Box3().setFromObject(model.children.find(node => node.userData.isWorktop));
  near(top.max.z, .3); near(top.min.z, -.3);
  model.userData.worktop.depthMm = 900; ensureWorktop(model); model.updateMatrixWorld(true);
  top = new THREE.Box3().setFromObject(model.children.find(node => node.userData.isWorktop));
  near(top.max.z, .58); near(top.min.z, -.32);
});
test('standard slabs are rear-flush for either front direction and varying cabinet depths', () => {
  for (const depth of [.5, .58, .6, .65]) {
    for (const frontDirection of ['+Z', '-Z']) {
      const model = cabinet();
      model.userData.metadata.frontDirection = frontDirection;
      model.children[0].geometry = new THREE.BoxGeometry(.8, .72, depth);
      ensureWorktop(model); model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model.children.find(node => node.userData.isWorktop));
      near(box.max.z - box.min.z, .6);
      if (frontDirection === '+Z') near(box.min.z, -depth / 2);
      else near(box.max.z, depth / 2);
      model.userData.worktop.depthMm = 900;
      ensureWorktop(model); model.updateMatrixWorld(true);
      const bar = new THREE.Box3().setFromObject(model.children.find(node => node.userData.isWorktop));
      near(bar.max.z - bar.min.z, .9);
      if (frontDirection === '+Z') near(bar.max.z, depth / 2 + .02);
      else near(bar.min.z, -depth / 2 - .02);
    }
  }
});
test('room floors and lower furniture do not block breakfast-bar worktops', () => {
  const scene = new THREE.Scene(), model = cabinet(); scene.add(model);
  const room = new THREE.Group(); room.name = 'room_model';
  room.userData = { isGLBModel: true, metadata: { id: 'room' } };
  const floor = new THREE.Mesh(new THREE.BoxGeometry(10, .1, 10), new THREE.MeshStandardMaterial());
  floor.name = 'Floor'; room.add(floor); scene.add(room);
  const low = new THREE.Group(); low.userData = { isGLBModel: true, metadata: { id: 'low' } };
  const obstacle = new THREE.Mesh(new THREE.BoxGeometry(.2, .3, .2), new THREE.MeshStandardMaterial());
  obstacle.position.set(0, .2, -.4); low.add(obstacle); scene.add(low);
  assert.equal(breakfastBarBlocked(model, scene), false);
  obstacle.position.y = .72;
  assert.equal(breakfastBarBlocked(model, scene), true);
});
test('GLB wrapper X-axis correction keeps worktop horizontal on the cabinet top', () => {
  const model = new THREE.Group();
  model.userData.metadata = { category: 'Floor cupboard' };
  // Source GLB uses Z for height; AssetLoader rotates its wrapper by 90 degrees.
  const body = new THREE.Mesh(new THREE.BoxGeometry(.8, .58, .72), new THREE.MeshStandardMaterial());
  body.position.z = -.36;
  model.add(body);
  model.rotation.set(Math.PI / 2, 0, 0);
  ensureWorktop(model);
  model.updateMatrixWorld(true);
  const worktop = model.children.find(node => node.userData.isWorktop);
  const box = new THREE.Box3().setFromObject(worktop);
  near(box.min.y, .72);
  near(box.max.y, .735);
  near(box.max.z, .31);
  near(box.min.z, -.29);
  model.rotation.z = Math.PI / 4;
  ensureWorktop(model);
  model.updateMatrixWorld(true);
  const up = new THREE.Vector3(0, 1, 0).transformDirection(model.children.find(node => node.userData.isWorktop).matrixWorld);
  near(up.y, 1);
});
test('all requested finishes available and non-base models excluded', () => {
  assert.equal(WORKTOP_FINISHES.length, 13);
  for (const finish of WORKTOP_FINISHES) {
    const model = cabinet(); ensureWorktop(model); model.userData.worktop.finish = finish.name; ensureWorktop(model);
    assert.equal(model.children[1].material.color.getHexString(), finish.color.slice(1));
  }
  const model = cabinet(); model.userData.metadata.category = 'Wall Cabinet'; ensureWorktop(model);
  assert.equal(model.children.length, 1);
});
