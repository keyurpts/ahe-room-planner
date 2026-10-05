import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';

// Exercise the actual core methods without constructing its browser/WebGL renderer.
const source = ts.createSourceFile('core.ts', fs.readFileSync(new URL('../src/ConfiguratorCore.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const core = source.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'ConfiguratorCore');
const names = ['export3DConfig', 'applyColorToAllWalls', 'groupFacesByNormal', 'splitWallFace', 'processObjectMaterials', 'applyTextureToModel'];
const members = core.members.filter(node => names.includes(node.name?.getText(source))).map(node => node.getText(source));
const code = ts.transpile(`class TestCore { ${members.join('\n')} }`, { target: ts.ScriptTarget.ES2020 });
const dependencies = { ...THREE, SelectableState: { TRUE: 'true', FALSE: 'false' }, RequiredStrings: { ROOM_MODEL: 'room_model' }, Events: { emit() {} }, ConfiguratorEventType: {} };
const TestCore = new Function(...Object.keys(dependencies), `${code}; return TestCore;`)(...Object.values(dependencies));
function fixture() {
  const instance = new TestCore();
  instance.scene = new THREE.Scene();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.1), new THREE.MeshStandardMaterial());
  wall.wall_id = 'wall-1';
  instance.scene.add(wall);
  instance.getWallById = () => wall;
  return { instance, wall };
}
test('whole-room wall color survives JSON round trip, including hidden walls', async () => {
  const { instance, wall } = fixture();
  instance.applyColorToAllWalls('#123456', 'paint-1');
  wall.material.opacity = 0;
  const saved = JSON.parse(JSON.stringify(instance.export3DConfig()));
  assert.equal(saved.walls[0].materials.length, 6);
  const restored = fixture();
  await restored.instance.processObjectMaterials(saved.walls);
  assert.ok(restored.wall.material.every(m => m.color.getHexString() === '123456'));
});
test('painting one face changes only that face and survives save/load', async () => {
  const { instance, wall } = fixture();
  instance.groupFacesByNormal(wall);
  const other = wall.material[1];
  instance.splitWallFace(wall, 0, [1], [new THREE.Color('#abcdef')], 'paint-2');
  assert.equal(wall.material[0].color.getHexString(), 'abcdef');
  assert.equal(wall.material[1], other);
  const saved = JSON.parse(JSON.stringify(instance.export3DConfig()));
  const restored = fixture();
  await restored.instance.processObjectMaterials(saved.walls);
  assert.equal(restored.wall.material[0].color.getHexString(), 'abcdef');
});
test('applied model texture exports its ID and URL', () => {
  const { instance } = fixture();
  const model = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  model.userData = { selectable: 'true', metadata: { id: 'model-1' } };
  instance.scene.add(model);
  instance.modelController = { applyTexture() {} };
  instance.getModelsSummary = () => [];
  instance.applyTextureToModel('/wood.jpg', 'texture-1', 0, model);
  const saved = JSON.parse(JSON.stringify(instance.export3DConfig()));
  assert.equal(saved['model-1'].textureId, 'texture-1');
  assert.equal(saved['model-1'].textureUrl, '/wood.jpg');
});

test('worktop depth, finish and cabinet orientation export with the cabinet', () => {
  const { instance } = fixture();
  const model = new THREE.Group();
  model.userData = { selectable: 'true', metadata: { id: 'cabinet-1', isBaseCabinet: true, frontDirection: '-Z' }, worktop: { version: 1, depthMm: 900, thicknessMm: 15, finish: 'SMOKED OAK' } };
  instance.scene.add(model);
  const saved = JSON.parse(JSON.stringify(instance.export3DConfig()));
  assert.deepEqual(saved['cabinet-1'].worktop, model.userData.worktop);
  assert.deepEqual(saved['cabinet-1'].worktopCabinet, { isBaseCabinet: true, frontDirection: '-Z' });
});

test('empty texture URLs are ignored without changing model finish metadata', () => {
  const { instance } = fixture();
  instance.modelController = { applyTexture() { assert.fail('empty URL must not be loaded'); } };
  const model = new THREE.Group();
  model.userData.metadata = { id: 'cabinet-1' };
  instance.applyTextureToModel('', 'texture-1', 0, model);
  instance.applyTextureToModel('   ', 'texture-1', 0, model);
  assert.equal(model.userData.metadata.appliedTexture, undefined);
});
test('global worktop color exports with the saved layout', () => {
  const { instance } = fixture();
  instance.scene.userData.worktopFinish = 'AMERICAN OAK';
  const saved = JSON.parse(JSON.stringify(instance.export3DConfig()));
  assert.deepEqual(saved.worktopSettings, { finish: 'AMERICAN OAK' });
});
