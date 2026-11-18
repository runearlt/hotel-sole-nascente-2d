import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES,toWorld,fromWorld,isWalkable,safePosition,moveWithCollisions,findRoute,groundHeight,GARDA_PROPS} from '../public/world-layout.js';
test('every 3D actor, entrance, exit and workspace has a collision-free route',()=>{
 for(const [area,s] of Object.entries(SCENES))for(const target of s.targets){assert.ok(isWalkable(area,target.x,target.z),`${area}/${target.id} blocked`);const path=findRoute(area,s.spawn,target);assert.ok(path.length,`${area}/${target.id} unreachable`);assert.ok(path.every(p=>isWalkable(area,p.x,p.z,.36)));assert.ok(Math.hypot(path.at(-1).x-target.x,path.at(-1).z-target.z)<.86);}
});
test('3D walls, furniture, buildings and planting cannot be traversed or tunnelled through',()=>{
 for(const [area,s] of Object.entries(SCENES)){
  for(const o of s.obstacles)assert.equal(isWalkable(area,o.x,o.z),false,`${area}/${o.id}`);
  const [a,b,c,d]=s.bounds;for(const p of [[a-1,0],[b+1,0],[0,c-1],[0,d+1]])assert.equal(isWalkable(area,...p),false);
  const end=moveWithCollisions(area,s.spawn,0,-100);assert.ok(isWalkable(area,end.x,end.z));
 }
 const hit=moveWithCollisions('hotel',{x:0,z:0},0,-30);assert.ok(hit.z>-3.8,'Must stop in front of reception desk');
});
test('3D saved coordinates round-trip and invalid legacy positions relocate safely',()=>{
 const p={x:521.5,y:279.2};const q=fromWorld(toWorld(p));assert.ok(Math.abs(p.x-q.x)<1e-8 && Math.abs(p.y-q.y)<1e-8);
 for(const area of Object.keys(SCENES)){assert.deepEqual(safePosition(area,{x:Infinity,z:NaN}),SCENES[area].spawn);assert.deepEqual(safePosition(area,SCENES[area].spawn),SCENES[area].spawn);}
});

test('Lake Garda terrace height rises continuously and props share physical footprints',()=>{
 assert.equal(groundHeight('hotel',30,20),0);assert.equal(groundHeight('town',18,20),0);assert.ok(groundHeight('town',30,20)>.4);assert.ok(groundHeight('town',19.01,20)<.01);
 for(const p of GARDA_PROPS)assert.equal(isWalkable('town',p.x,p.z),false);
 assert.equal(isWalkable('winery',-8,1.5),false);assert.equal(isWalkable('town',30,10.7),true,'Open gate must permit access');
});
