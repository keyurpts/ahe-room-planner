import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';

const source = ts.createSourceFile('controller.ts', fs.readFileSync(new URL('../src/Components/ModelController.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
const controller = source.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'ModelController');
const method = controller.members.find(node => node.name?.getText(source) === 'applyTexture').getText(source);
const code = ts.transpile(`class ModelController { ${method} }`, { target: ts.ScriptTarget.ES2020 });
test('texture decode failure leaves materials intact and resolves for all callers', async () => {
  const notices = [];
  const Controller = new Function('THREE', 'Events', 'ConfiguratorEventType', `${code}; return ModelController;`)(THREE, { emit: (...args) => notices.push(args) }, { COLLISION: 'collision' });
  const instance = new Controller();
  instance.textureRequests = new WeakMap();
  instance.prepareTexture = async () => { throw new Error('Failed to decode texture'); };
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  const original = mesh.material;
  await instance.applyTexture(mesh, '');
  assert.equal(notices.length, 0);
  await instance.applyTexture(mesh, '/invalid-image');
  assert.equal(mesh.material, original);
  assert.equal(notices.length, 1);
});
