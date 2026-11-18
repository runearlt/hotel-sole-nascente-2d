// Metres in the 3D world. Saved positions retain the established 900x540 coordinate system.
export const WORLD_SCALE=10;
export const toWorld=p=>({x:(p.x-450)/WORLD_SCALE,z:(p.y-270)/WORLD_SCALE});
export const fromWorld=p=>({x:p.x*WORLD_SCALE+450,y:p.z*WORLD_SCALE+270});
export const groundHeight=(area,x,z)=>area==='town' && x>19 && z>10?Math.min(1.25,(z-10)*.055)*Math.min(1,(x-19)/2):0;
export const GARDA_PROPS=[{kind:'bike',x:-35,z:5,rot:1.57,w:1.5,d:.65},{kind:'bike',x:-33,z:5,rot:1.57,w:1.5,d:.65},{kind:'bin',x:14,z:7.8,w:.55,d:.55},{kind:'bin',x:-23,z:18,w:.55,d:.55},{kind:'bed',x:4,z:-6,w:8,d:1.3},{kind:'bed',x:12,z:-8,w:1.4,d:7},...[-25,-16,-7].map(x=>({kind:'table',x,z:-24.5,w:3,d:2}))];
export const SCENES={
 town:{bounds:[-44,44,-26,26],spawn:{x:4,z:6},obstacles:[
  {x:-17,z:-14,w:28,d:16,id:'hotel-building'},
  {x:-28,z:14,w:16,d:10,id:'bakery-building'},
  {x:30,z:-15,w:16,d:12,id:'winery-building'},
  {x:0,z:13,w:5.5,d:5.5,id:'fountain'},
  {x:15,z:15,w:1.2,d:2.8,id:'bench-east'},
  {x:-9,z:12,w:1.2,d:3,id:'bench-west'}],
  targets:[{id:'hotel',kind:'entrance',name:'Hotel reception',x:-17,z:-4.7},{id:'bakery',kind:'entrance',name:'Bakery kitchen',x:-28,z:20},{id:'winery',kind:'entrance',name:'Vineyard tasting room',x:30,z:-8},
   {id:'ana',kind:'street',name:'Ana',role:'Visitor · Optional',x:10,z:5},{id:'enzo',kind:'street',name:'Enzo',role:'Local guide · Optional',x:19,z:20}]},
 hotel:{bounds:[-15,15,-11,12],spawn:{x:0,z:8.8},obstacles:[
  {x:0,z:-5,w:11,d:1.8,id:'reception-desk'},
  {x:-10,z:0,w:3.8,d:1.7,id:'sofa-left'},
  {x:-10,z:5,w:3.8,d:1.7,id:'sofa-right'},
  {x:-10,z:2.5,w:2.6,d:1.2,id:'coffee-table'},
  {x:10,z:3,w:3.5,d:1.7,id:'workspace-desk'},
  {x:10,z:-7,w:6,d:2,id:'operations-cabinet'}],
  targets:[{id:'lucia',kind:'person',name:'Lucia',role:'Hotel manager',x:-4,z:-2.7},{id:'marco',kind:'person',name:'Marco',role:'Reservations lead',x:4,z:-2.7},{id:'elena',kind:'person',name:'Elena',role:'Operations manager',x:9,z:-3},
   {id:'workspace',kind:'workspace',name:'Calculation workspace',x:9.5,z:5},{id:'town',kind:'exit',name:'Return to town',x:0,z:10.6}]},
 bakery:{bounds:[-12,12,-9,11],spawn:{x:0,z:8},obstacles:[
  {x:-8,z:-4,w:4,d:6,id:'oven'}, {x:0,z:-3,w:8,d:2,id:'preparation-table'},
  {x:8,z:2,w:3,d:2,id:'bakery-workspace'},{x:7,z:-6,w:6,d:1.5,id:'bread-rack'},
  {x:-8,z:6,w:4,d:1.5,id:'flour-storage'}],
  targets:[{id:'marta',kind:'person',name:'Marta',role:'Bakery owner',x:-5,z:1},{id:'paolo',kind:'person',name:'Paolo',role:'Head baker',x:3,z:0},
   {id:'workspace',kind:'workspace',name:'Production workspace',x:7,z:4},{id:'town',kind:'exit',name:'Return to town',x:0,z:9.6}]},
 winery:{bounds:[-13,13,-10,11],spawn:{x:0,z:8},obstacles:[
  {x:-8,z:-5,w:6,d:3,id:'barrels-west'},{x:8,z:-5,w:6,d:3,id:'barrels-east'},
  {x:0,z:-3,w:8,d:1.8,id:'tasting-counter'},{x:8,z:3,w:3,d:2,id:'wine-workspace'},
  {x:-8,z:3,w:3,d:2,id:'tasting-table'}],
  targets:[{id:'sofia',kind:'person',name:'Sofia',role:'Winemaker',x:-3,z:0},{id:'giulia',kind:'person',name:'Giulia',role:'Inventory manager',x:4,z:0},
   {id:'workspace',kind:'workspace',name:'Purchasing workspace',x:7,z:5},{id:'town',kind:'exit',name:'Return to town',x:0,z:9.5}]}
};
for(const [x,z] of [[-12,5],[12,5],[-12,22],[12,22],[19,-4],[-36,4]])SCENES.town.obstacles.push({x,z,w:.3,d:.3,id:'street-lamp'});
for(const [x,z] of [[-19.7,-4.97],[-14.3,-4.97],[-30.7,20.03],[-25.3,20.03],[27.3,-7.97],[32.7,-7.97]])SCENES.town.obstacles.push({x,z,w:1,d:1,id:'entrance-planter'});
for(const x of [-21,-13])SCENES.town.obstacles.push({x,z:-4.4,w:.2,d:.2,id:'arrival-bollard'});
for(const x of [27.8,32.2])SCENES.town.obstacles.push({x,z:10.7,w:.5,d:1.9,id:'open-vineyard-gate'});
for(const z of [1.5,4.5])SCENES.winery.obstacles.push({x:-8,z,w:.6,d:.6,id:'tasting-chair'});
for(const p of GARDA_PROPS)SCENES.town.obstacles.push({...p,id:'garda-'+p.kind});
// Physical planting and furniture footprints share the same positions as the scene models.
for (const [x,z] of [[-39,-3],[-33,-3],[-5,-3],[16,-5],[41,-4],[-14,8],[-12,20],[12,21],[40,22],[-40,22],[-33,-23],[-1,-23],[-36,-21],[-2,-20],[20,-24],[41,-24],[17,-15],[42,-15]]) SCENES.town.obstacles.push({x,z,w:1.4,d:1.4,id:'planter'});
for(let row=0;row<7;row++)for(let n=0;n<8;n++) SCENES.town.obstacles.push({x:21+n*2.6,z:12+row*1.65,w:1.3,d:.55,id:'vine'});
for(const area of ['hotel','bakery','winery']){const [a,b,c]=SCENES[area].bounds;for(const x of [a+1,b-1])SCENES[area].obstacles.push({x,z:c+1,w:1.4,d:1.4,id:'interior-planter'});}
export function isWalkable(area,x,z,radius=.32){
 const s=SCENES[area];if(!s||!Number.isFinite(x)||!Number.isFinite(z))return false;
 const [a,b,c,d]=s.bounds;if(x<a+radius||x>b-radius||z<c+radius||z>d-radius)return false;
 return !s.obstacles.some(o=>Math.abs(x-o.x)<o.w/2+radius && Math.abs(z-o.z)<o.d/2+radius);
}
export function safePosition(area,p){return isWalkable(area,p.x,p.z)?{x:p.x,z:p.z}:{...SCENES[area].spawn};}
export function moveWithCollisions(area,p,dx,dz){
 const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));let x=p.x,z=p.z;
 for(let i=0;i<n;i++){if(isWalkable(area,x+dx/n,z))x+=dx/n;if(isWalkable(area,x,z+dz/n))z+=dz/n;}
 return {x,z};
}
export function nearestTarget(area,p,max=2.4){return [...SCENES[area].targets].sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)).find(t=>Math.hypot(t.x-p.x,t.z-p.z)<=max)||null;}
export function findRoute(area,start,goal){
 const s=SCENES[area],step=.7,[minX,maxX,minZ,maxZ]=s.bounds;
 const snap=p=>[Math.round((p.x-minX)/step),Math.round((p.z-minZ)/step)];
 const point=([x,z])=>({x:minX+x*step,z:minZ+z*step});const key=p=>p.join(',');
 const a=snap(start),b=snap(goal),queue=[a],parents=new Map([[key(a),null]]);let found=null;
 for(let i=0;i<queue.length&&i<14000;i++){
  const cur=queue[i],p=point(cur);if(Math.hypot(p.x-goal.x,p.z-goal.z)<.85){found=cur;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[cur[0]+dx,cur[1]+dz],k=key(n),q=point(n);if(parents.has(k)||!isWalkable(area,q.x,q.z,.36))continue;parents.set(k,cur);queue.push(n);}
 }
 if(!found)return [];const path=[];for(let n=found;n;n=parents.get(key(n)))path.push(point(n));return path.reverse().slice(1);
}
