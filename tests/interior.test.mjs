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


test('full-page camera covers the viewport without stretching and keeps the player visible', async () => {
  const {fitSceneViewport}=await import('../public/scene-viewport.js');
  for(const [w,h] of [[1440,836],[390,763],[2500,900]])for(const player of [{x:450,y:270},{x:40,y:500},{x:850,y:80}]) {
    const canvas={parentElement:{matches:()=>true,clientWidth:w,clientHeight:h},style:{}};
    fitSceneViewport(canvas,player,900,540);
    const cw=parseFloat(canvas.style.width),ch=parseFloat(canvas.style.height),left=parseFloat(canvas.style.left),top=parseFloat(canvas.style.top);
    assert.ok(cw>=w && ch>=h);assert.ok(Math.abs(cw/ch-900/540)<1e-9);
    assert.ok(left<=0 && left+cw>=w-1e-7 && top<=0 && top+ch>=h-1e-7);
    const px=left+player.x*cw/900,py=top+player.y*ch/540;
    assert.ok(px>=0 && px<=w && py>=0 && py<=h);
  }
});
