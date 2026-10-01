import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, Vector2, Vector3 } from 'three';
import { physicalFootprint, findAutomaticPlacement, physicalBox } from '../src/Components/AutomaticPlacement.ts';

const v = (x, z) => new Vector2(x, z);

for (const keepSelection of [true, false]) {
  test(`angled wall stays flush and fills continuously (selection=${keepSelection})`, () => {
    const room = fixture(14, 12);
    const corners = [v(0, 0), v(8, 0), v(14, 6), v(14, 12), v(0, 12)];
    room.walls = corners.map((start, i) => ({ start, end: corners[(i + 1) % corners.length] }));
    const occupied = [];
    const diagonal = v(1, 1).normalize(), normal = v(-1, 1).normalize();
    let previousCenter;
    for (let i = 0; i < 7; i++) {
      const object = model(2, 1);
      const result = place(room, object, occupied, keepSelection ? occupied.at(-1) ?? null : null, () =>
        physicalFootprint(object).every(p => room.walls.every(w => {
          const d = w.end.clone().sub(w.start), q = p.clone().sub(w.start);
          return d.x * q.y - d.y * q.x >= -1e-6;
        })));
      const box = boxAt(object, result);
      if (i >= 4) {
        const footprint = physicalFootprint(object);
        const back = Math.min(...footprint.map(p => p.clone().sub(v(8, 0)).dot(normal)));
        assert.ok(Math.abs(back) < 1e-6, 'model must touch the diagonal wall');
        const center = box.getCenter(new Vector3());
        const along = v(center.x, center.z).dot(diagonal);
        if (previousCenter !== undefined) assert.ok(Math.abs(along - previousCenter - 2) < 1e-6, 'no artificial gap between rotated models');
        previousCenter = along;
        assert.ok(Math.abs(object.rotation.y + Math.PI / 4) < 1e-6, 'stay on diagonal instead of skipping to next wall');
      }
      occupied.push(object);
    }
  });
}
function fixture(width = 6, depth = 6) {
  const bounds = new Box3(new Vector3(0, 0, 0), new Vector3(width, 3, depth));
  const corners = [v(0, 0), v(width, 0), v(width, depth), v(0, depth)];
  const walls = corners.map((start, i) => ({ start, end: corners[(i + 1) % 4] }));
  return { bounds, walls };
}
function model(width = 2, depth = 2, x = 0, z = 0) {
  const mesh = new Mesh(new BoxGeometry(width, 1, depth), new MeshBasicMaterial());
  mesh.position.set(x, 0.5, z);
  return mesh;
}
function place(room, object, occupied = [], selected = null, valid = () => true) {
  return findAutomaticPlacement(object, room.bounds, occupied.map(o => physicalFootprint(o)), room.walls, selected, 0, valid);
}
function boxAt(object, result) {
  assert.ok(result, 'expected a valid placement');
  object.position.copy(result.position);
  object.rotation.copy(result.rotation);
  return physicalBox(object);
}

test('empty room starts at the top-left corner and grounds the model', () => {
  const object = model();
  const box = boxAt(object, place(fixture(), object));
  assert.deepEqual(box.min.toArray(), [0, 0, 0]);
});
test('occupied starting corner is skipped with no selection', () => {
  const object = model();
  const box = boxAt(object, place(fixture(), object, [model(2, 2, 1, 1)]));
  assert.deepEqual(box.min.toArray(), [2, 0, 0]);
});
test('continues after the selected model and skips an occupied next position', () => {
  const selected = model(2, 2, 1, 1), object = model();
  const box = boxAt(object, place(fixture(), object, [selected, model(2, 2, 3, 1)], selected));
  assert.deepEqual(box.min.toArray(), [4, 0, 0]);
});
test('full first wall advances clockwise to the right wall and rotates the model', () => {
  const object = model(2, 1), occupied = [model(6, 2, 3, 1)];
  const box = boxAt(object, place(fixture(), object, occupied));
  assert.ok(Math.abs(box.max.x - 6) < 1e-6);
  assert.ok(Math.abs(box.min.z - 2) < 1e-6);
  assert.ok(Math.abs(box.getSize(new Vector3()).z - 2) < 1e-6);
});
test('uses interior space after all four wall runs are full', () => {
  const object = model();
  const occupied = [model(6, 2, 3, 1), model(6, 2, 3, 5), model(2, 2, 1, 3), model(2, 2, 5, 3)];
  const box = boxAt(object, place(fixture(), object, occupied));
  assert.deepEqual(box.min.toArray(), [2, 0, 2]);
});
test('rejects a full room and an oversized model', () => {
  assert.equal(place(fixture(), model(), [model(6, 6, 3, 3)]), null);
  assert.equal(place(fixture(), model(7, 7)), null);
});
test('finds an exact narrow gap rather than sampling a grid', () => {
  const object = model(0.37, 2);
  const occupied = [model(2.13, 6, 1.065, 3), model(3.5, 6, 4.25, 3)];
  const box = boxAt(object, place(fixture(), object, occupied));
  assert.ok(Math.abs(box.min.x - 2.13) < 1e-6);
});
test('rejects candidates outside the actual floor and restores temporary transforms', () => {
  const object = model();
  object.rotation.y = 0.3;
  const position = object.position.clone(), rotation = object.quaternion.clone();
  assert.equal(place(fixture(), object, [], null, () => false), null);
  assert.ok(object.position.equals(position));
  assert.ok(object.quaternion.equals(rotation));
});
test('wall order follows connected endpoints despite shuffled/reversed input', () => {
  const room = fixture();
  room.walls = [room.walls[2], room.walls[0], room.walls[3], room.walls[1]].map(w => ({ start: w.end, end: w.start }));
  const object = model(2, 1);
  const box = boxAt(object, place(room, object, [model(6, 2, 3, 1)]));
  assert.ok(Math.abs(box.max.x - 6) < 1e-6);
  assert.ok(Math.abs(box.min.z - 2) < 1e-6);
});

test('wall thickness keeps the entire model on the inside faces', () => {
  const room = fixture();
  room.walls.forEach(w => { w.halfThickness = 0.1; });
  const walls = [model(6, 0.2, 3, 0), model(0.2, 6, 6, 3), model(6, 0.2, 3, 6), model(0.2, 6, 0, 3)];
  const object = model();
  const box = boxAt(object, place(room, object, walls));
  assert.ok(Math.abs(box.min.x - 0.1) < 1e-6);
  assert.ok(Math.abs(box.min.z - 0.1) < 1e-6);
});
test('handles a mesh whose geometry is offset from its model origin', () => {
  const object = model();
  object.geometry.translate(3, 5, -7);
  const box = boxAt(object, place(fixture(), object));
  assert.deepEqual(box.min.toArray(), [0, 0, 0]);
});
test('continues beside a selected model in the room interior', () => {
  const selected = model(2, 2, 2, 2), object = model();
  const box = boxAt(object, place(fixture(8, 8), object, [selected], selected));
  assert.deepEqual(box.min.toArray(), [3, 0, 1]);
});
test('rejects a concave cutout while finding space in an L-shaped room', () => {
  const room = fixture();
  const corners = [v(0, 0), v(6, 0), v(6, 2), v(2, 2), v(2, 6), v(0, 6)];
  room.walls = corners.map((start, i) => ({ start, end: corners[(i + 1) % corners.length] }));
  const object = model();
  const box = boxAt(object, place(room, object, [model(6, 2, 3, 1), model(4, 4, 4, 4)], null, () => {
    const candidate = physicalBox(object);
    return candidate.max.x <= 2 + 1e-6 || candidate.max.z <= 2 + 1e-6;
  }));
  assert.ok(box.max.x <= 2 + 1e-6);
  assert.ok(box.min.z >= 2 - 1e-6);
});

test('repeated additions fill all walls and the interior without overlaps', () => {
  const room = fixture(), occupied = [];
  for (let i = 0; i < 9; i++) {
    const object = model();
    const box = boxAt(object, place(room, object, occupied, occupied.at(-1) ?? null));
    assert.ok(box.min.x >= -1e-6 && box.max.x <= 6 + 1e-6);
    assert.ok(box.min.z >= -1e-6 && box.max.z <= 6 + 1e-6);
    for (const other of occupied) {
      const overlap = box.clone().intersect(physicalBox(other)).getSize(new Vector3());
      assert.ok(overlap.x <= 1e-6 || overlap.z <= 1e-6, 'models must not overlap');
    }
    occupied.push(object);
  }
  assert.equal(place(room, model(), occupied, occupied.at(-1)), null);
});

test('deep models continue along their facing wall instead of jumping between corners', () => {
  const room = fixture(12, 12), occupied = [];
  for (let i = 0; i < 6; i++) {
    const object = model(2, 4);
    const box = boxAt(object, place(room, object, occupied, occupied.at(-1) ?? null));
    assert.ok(Math.abs(box.min.x - i * 2) < 1e-6);
    assert.ok(Math.abs(box.min.z) < 1e-6);
    occupied.push(object);
  }
  const next = model(2, 4);
  const box = boxAt(next, place(room, next, occupied, occupied.at(-1)));
  assert.ok(Math.abs(box.max.x - 12) < 1e-6);
  assert.ok(Math.abs(box.min.z - 4) < 1e-6);
  occupied.push(next);
  const following = model(2, 4);
  const followingBox = boxAt(following, place(room, following, occupied, next));
  assert.ok(Math.abs(followingBox.max.x - 12) < 1e-6);
  assert.ok(Math.abs(followingBox.min.z - 6) < 1e-6);
});

test('selection right side takes priority when the nearest wall runs the other way', () => {
  const room = fixture(12, 12), selected = model(2, 2, 3, 9), object = model();
  const box = boxAt(object, place(room, object, [selected], selected));
  assert.deepEqual(box.min.toArray(), [4, 0, 8]);
});

test('selection right side follows its rotation independently of nearby walls', () => {
  const room = fixture(12, 12), selected = model(2, 2, 3, 3), object = model();
  selected.rotation.y = -Math.PI / 2;
  const box = boxAt(object, place(room, object, [selected], selected));
  assert.ok(Math.abs(box.min.x - 2) < 1e-6);
  assert.ok(Math.abs(box.min.z - 4) < 1e-6);
});

test('blocked selection right side falls back without overlapping the blocker', () => {
  const room = fixture(12, 12), selected = model(2, 2, 3, 9), blocker = model(2, 2, 5, 9), object = model();
  const box = boxAt(object, place(room, object, [selected, blocker], selected));
  for (const existing of [selected, blocker]) {
    const overlap = box.clone().intersect(physicalBox(existing)).getSize(new Vector3());
    assert.ok(overlap.x <= 1e-6 || overlap.z <= 1e-6);
  }
});

for (const keepSelection of [true, false]) {
  test(`L-shaped wall run turns at the notch before entering the interior (selection=${keepSelection})`, () => {
    const room = fixture(15, 12);
    const corners = [v(0, 0), v(11, 0), v(11, 3), v(15, 3), v(15, 12), v(0, 12)];
    room.walls = corners.map((start, i) => ({ start, end: corners[(i + 1) % corners.length] }));
    const occupied = [];
    const expected = [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0], [11, 3], [13, 3]];
    for (const [x, z] of expected) {
      const object = model(2, 1);
      const box = boxAt(object, place(room, object, occupied, keepSelection ? occupied.at(-1) ?? null : null, () => {
        const candidate = physicalBox(object);
        return candidate.max.x <= 11 + 1e-6 || candidate.min.z >= 3 - 1e-6;
      }));
      assert.ok(Math.abs(box.min.x - x) < 1e-6 && Math.abs(box.min.z - z) < 1e-6,
        `expected (${x}, ${z}), received (${box.min.x}, ${box.min.z})`);
      for (const existing of occupied) {
        const overlap = box.clone().intersect(physicalBox(existing)).getSize(new Vector3());
        assert.ok(overlap.x <= 1e-6 || overlap.z <= 1e-6);
      }
      occupied.push(object);
    }
  });
}
