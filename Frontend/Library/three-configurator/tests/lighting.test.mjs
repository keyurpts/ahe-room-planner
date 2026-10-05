import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
import { randomUUID } from 'node:crypto';

const source = fs.readFileSync(new URL('../src/Components/LightsManager.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const api = {};
new Function('require', 'exports', compiled)(name => {
  if (name === 'three') return THREE;
  if (name === 'uuid') return { v4: randomUUID };
  if (name === '../Constants') return { LightTypes: {
    DIRECTIONAL: 'Directional', SPOT: 'Spot', POINT: 'Point',
    HEMISPHERE: 'Hemisphere', AMBIENT: 'Ambient',
  } };
  return {};
}, api);

const bounds = (width, depth, height = 2.8) => new THREE.Box3(
  new THREE.Vector3(10, 0, -depth), new THREE.Vector3(10 + width, height, 0),
);

test('room shadow setup preserves furniture shadows without shell or worktop occlusion', () => {
  const coreSource = ts.createSourceFile('core.ts', fs.readFileSync(new URL('../src/ConfiguratorCore.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
  const core = coreSource.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'ConfiguratorCore');
  const method = core.members.find(node => node.name?.getText(coreSource) === 'enableShadowsOnObject').getText(coreSource);
  const compiledMethod = ts.transpile(`class TestCore { ${method} }`, { target: ts.ScriptTarget.ES2020 });
  const Core = new Function(`${compiledMethod}; return TestCore;`)();
  const group = new THREE.Group();
  const cabinet = new THREE.Mesh();
  const ceiling = new THREE.Mesh(); ceiling.isCeiling = true;
  const wall = new THREE.Mesh(); wall.wall_id = 'wall-1';
  const helper = new THREE.Mesh(); helper.name = 'boundary_cube_wall-1';
  const worktop = new THREE.Mesh(); worktop.userData.isWorktop = true;
  group.add(cabinet, ceiling, wall, helper, worktop);
  const instance = new Core();
  instance.enableShadowsOnObject(group);
  assert.equal(cabinet.castShadow, true);
  for (const mesh of [ceiling, wall, helper, worktop]) assert.equal(mesh.castShadow, false);
  assert.ok(group.children.every(mesh => mesh.receiveShadow));
  instance.enableShadowsOnObject(group, false, false);
  assert.ok(group.children.every(mesh => !mesh.castShadow && !mesh.receiveShadow));
});

test('room lighting has no spotlight cones and a single shadow direction at every room size', () => {
  const manager = new api.LightsManager(new THREE.Scene());
  for (const [width, depth] of [[4, 4], [18, 12], [1, 20], [100, 100]]) {
    manager.setupCeilingLights(bounds(width, depth));
    assert.equal(manager.getLightsByType('Spot').length, 0);
    assert.equal(manager.getLightsByType('Directional').length, 2);
    assert.equal(manager.getLightsByType('Hemisphere').length, 1);
    assert.equal(manager.getAllLights().filter(light => light.castShadow).length, 1);
    assert.equal(manager.getLightsByType('Directional')[0].intensity, 2.4);
  }
});

test('shadow camera covers all corners of large, narrow, translated and elevated rooms', () => {
  const manager = new api.LightsManager(new THREE.Scene());
  for (const room of [bounds(4, 4), bounds(18, 12), bounds(1, 20), bounds(100, 100).translate(new THREE.Vector3(-150, 8, 70))]) {
    manager.setupCeilingLights(room);
    const light = manager.getAllLights().find(light => light.castShadow);
    light.shadow.updateMatrices(light);
    for (const x of [room.min.x, room.max.x]) {
      for (const y of [room.min.y, room.max.y]) {
        for (const z of [room.min.z, room.max.z]) {
          const projected = new THREE.Vector3(x, y, z).project(light.shadow.camera);
          assert.ok(Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1 && Math.abs(projected.z) <= 1);
        }
      }
    }
  }
});

test('room reload removes previous lights and targets; invalid bounds leave no fixtures', () => {
  const scene = new THREE.Scene();
  const manager = new api.LightsManager(scene);
  manager.setupCeilingLights(bounds(4, 4));
  const oldObjects = [...scene.children];
  manager.setupCeilingLights(bounds(18, 12));
  assert.ok(oldObjects.every(object => object.parent === null));
  assert.equal(scene.children.length, 5);
  assert.deepEqual(manager.setupCeilingLights(new THREE.Box3()), []);
  assert.equal(scene.children.length, 0);
});
