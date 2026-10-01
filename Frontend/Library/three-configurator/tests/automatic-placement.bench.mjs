// Run with Node 24+: node tests/automatic-placement.bench.mjs
// Synthetic solver benchmark; excludes GLB loading, scene extraction and rendering.
import { performance } from 'node:perf_hooks';
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, Vector2, Vector3 } from 'three';
import { findAutomaticPlacement, physicalFootprint } from '../src/Components/AutomaticPlacement.ts';

for (const count of [50, 150, 300]) {
  const geometry = new BoxGeometry(1, 1, 1), material = new MeshBasicMaterial();
  const existing = Array.from({ length: count }, (_, i) => {
    const object = new Mesh(geometry, material);
    object.position.set(i + 0.5, 0.5, 0.5);
    return object;
  });
  const obstacles = existing.map(physicalFootprint);
  const model = new Mesh(geometry, material);
  const corners = [new Vector2(0, 0), new Vector2(count + 10, 0), new Vector2(count + 10, 10), new Vector2(0, 10)];
  const walls = corners.map((start, i) => ({ start, end: corners[(i + 1) % 4] }));
  const bounds = new Box3(new Vector3(0, 0, 0), new Vector3(count + 10, 3, 10));
  for (const selected of [null, existing.at(-1)]) {
    const timings = [];
    for (let i = 0; i < 8; i++) {
      const start = performance.now();
      const result = findAutomaticPlacement(model, bounds, obstacles, walls, selected, 0, () => true);
      if (!result || Math.abs(result.position.x - count - 0.5) > 1e-6) throw new Error('Unexpected placement');
      if (i >= 3) timings.push(performance.now() - start);
    }
    timings.sort((a, b) => a - b);
    console.log(JSON.stringify({ obstacles: count, selected: !!selected, medianMs: +timings[2].toFixed(2) }));
  }
  geometry.dispose();
  material.dispose();
}
