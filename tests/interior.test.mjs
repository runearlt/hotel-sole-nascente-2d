import assert from 'node:assert/strict';
import test from 'node:test';
import { HotelInterior, HOTEL_STAFF } from '../public/interior.js';

test('hotel staff and calculation desk are reachable from the entrance', () => {
  const map = { player: { x: 450, y: 456 }, walkable: HotelInterior.prototype.walkable };
  const destinations = [...Object.values(HOTEL_STAFF), { x: 545, y: 355 }];
  for (const destination of destinations) {
    const path = HotelInterior.prototype.findPath.call(map, destination.x, destination.y);
    assert.ok(path.length > 0, `No route to ${destination.name || 'workspace'}`);
    assert.ok(path.every(({ x, y }) => map.walkable(x, y)));
    assert.ok(Math.hypot(path.at(-1).x - destination.x, path.at(-1).y - destination.y) < 15);
  }
});

test('hotel furniture and outside walls block movement', () => {
  const walkable = HotelInterior.prototype.walkable;
  assert.equal(walkable(450, 280), false);
  assert.equal(walkable(450, 100), false);
  assert.equal(walkable(10, 10), false);
  assert.equal(walkable(450, 456), true);
});
