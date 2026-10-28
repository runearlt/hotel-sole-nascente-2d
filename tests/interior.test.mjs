import assert from 'node:assert/strict';
import test from 'node:test';
import { BusinessInterior, ROOM_STAFF, ROOMS } from '../public/interior.js';

test('staff and calculation desks are reachable in every room', () => {
  for (const roomId of Object.keys(ROOMS)) {
    const map = { roomId, player: { x: 450, y: roomId === 'hotel' ? 456 : 480 }, walkable: BusinessInterior.prototype.walkable };
    const destinations = [...Object.values(ROOM_STAFF[roomId]), ROOMS[roomId].desk];
    for (const destination of destinations) {
      const path = BusinessInterior.prototype.findPath.call(map, destination.x, destination.y);
      assert.ok(path.length > 0, `No ${roomId} route to ${destination.name || 'workspace'}`);
      assert.ok(path.every(({ x, y }) => map.walkable(x, y)));
      assert.ok(Math.hypot(path.at(-1).x - destination.x, path.at(-1).y - destination.y) < 15);
    }
  }
});

test('hotel furniture and outside walls block movement', () => {
  const walkable = BusinessInterior.prototype.walkable;
  assert.equal(walkable.call({ roomId: 'hotel' }, 450, 280), false);
  assert.equal(walkable.call({ roomId: 'hotel' }, 450, 100), false);
  assert.equal(walkable.call({ roomId: 'hotel' }, 10, 10), false);
  assert.equal(walkable.call({ roomId: 'hotel' }, 450, 456), true);
  assert.equal(walkable.call({ roomId: 'bakery' }, 100, 300), false);
  assert.equal(walkable.call({ roomId: 'winery' }, 450, 480), true);
});
