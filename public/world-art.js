import * as T from './vendor/three-bundle.js';
import {SCENES} from './world-layout.js';
const TAU=Math.PI*2;
export function createWorldArt(scene,area,{mobile=false}={}){
 const root=new T.Group();scene.add(root);const resources=new Set(),materials=new Map(),geometries=new Map(),labels=[],people=[];
 const remember=o=>(resources.add(o),o);
 const geometry=(key,make)=>{if(!geometries.has(key))geometries.set(key,remember(make()));return geometries.get(key);};
 function texture(kind){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let seed=19;const r=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  x.fillStyle=kind==='wood'?'#86705a':kind==='roof'?'#ac735c':kind==='plaster'?'#e3d8c3':'#c3bba9';x.fillRect(0,0,256,256);
  for(let i=0;i<1800;i++){x.fillStyle=`rgba(${r()>.5?'255,255,255':'38,32,25'},${r()*.08})`;x.fillRect(r()*256,r()*256,kind==='wood'?1:2,kind==='wood'?30:2);}
  if(kind==='stone'||kind==='roof'){x.strokeStyle=kind==='stone'?'#9d978744':'#78534466';x.lineWidth=1.2;const tile=kind==='stone'?64:32;for(let row=0;row<256/tile;row++){x.beginPath();x.moveTo(0,row*tile);x.lineTo(256,row*tile);x.stroke();for(let col=-1;col<256/tile;col++)x.strokeRect(col*tile+(row%2)*tile/2,row*tile,tile,tile);}}
  if(kind==='wood'){x.strokeStyle='#372d211a';for(let i=0;i<12;i++){x.beginPath();x.moveTo(i*23,0);x.bezierCurveTo(i*23+12,80,i*23-9,170,i*23+4,256);x.stroke();}}
  const t=remember(new T.CanvasTexture(c));t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='plaster'?2:4,kind==='wood'?2:4);t.anisotropy=4;return t;
 }
 const textures={stone:texture('stone'),wood:texture('wood'),roof:texture('roof'),plaster:texture('plaster')};
 function mat(color,kind='',extra={}){const key=color+kind+JSON.stringify(extra);if(!materials.has(key))materials.set(key,remember(new T.MeshStandardMaterial({color,roughness:.84,...(kind?{map:textures[kind]}:{}),...extra})));return materials.get(key);}
 const M={stone:mat('#eee8d7','stone'),plaster:mat('#fff4dd','plaster'),roof:mat('#c69780','roof'),wood:mat('#d2b99b','wood'),darkwood:mat('#665849','wood'),iron:mat('#47534f','',{metalness:.5,roughness:.5}),glass:mat('#75969c','',{metalness:.28,roughness:.22}),leaf:mat('#6d7950'),trunk:mat('#786b55','wood'),linen:mat('#d9d5c4'),water:mat('#82b5b9','',{metalness:.25,roughness:.2})};
 function mesh(g,m,x,y,z,parent=root){const q=new T.Mesh(g,m);q.position.set(x,y,z);q.castShadow=true;q.receiveShadow=true;parent.add(q);return q;}
 const box=(x,y,z,w,h,d,m,parent=root)=>{const q=mesh(geometry('box',()=>new T.BoxGeometry(1,1,1)),m,x,y,z,parent);q.scale.set(w,h,d);return q;};
 const cylinder=(x,y,z,rt,rb,h,m,parent=root,n=12)=>mesh(geometry(`cy${rt},${rb},${h},${n}`,()=>new T.CylinderGeometry(rt,rb,h,n)),m,x,y,z,parent);
 const sphere=(x,y,z,rx,ry,rz,m,parent=root)=>{const q=mesh(geometry('sphere',()=>new T.SphereGeometry(1,12,9)),m,x,y,z,parent);q.scale.set(rx,ry,rz);return q;};
 function sign(text,x,y,z,w=3,rotation=0){
  const c=document.createElement('canvas');c.width=512;c.height=96;const a=c.getContext('2d');a.fillStyle='#ece9dd';a.fillRect(0,0,512,96);a.strokeStyle='#8b9585';a.lineWidth=3;a.strokeRect(4,4,504,88);a.fillStyle='#344a46';a.font='500 28px Georgia';a.textAlign='center';a.textBaseline='middle';a.fillText(text,256,49,470);
  const tex=remember(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;const material=remember(new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));const q=mesh(remember(new T.PlaneGeometry(w,w*96/512)),material,x,y,z);q.rotation.y=rotation;return q;
 }
 function tree(x,z,height=5,type='cypress'){
  cylinder(x,height*.25,z,.13,.2,height*.5,M.trunk);
  if(type==='cypress'){sphere(x,height*.66,z,.6,height*.48,.65,M.leaf);sphere(x,height*.93,z,.32,height*.2,.34,M.leaf);}
  else {for(let k=0;k<5;k++){const a=k*TAU/5;sphere(x+Math.cos(a)*.7,height*.72+Math.sin(k)*.2,z+Math.sin(a)*.7,1.2,1.1,1.15,M.leaf);}}
  cylinder(x,.1,z,.75,.78,.2,M.stone,root,16);
 }
 function bench(x,z,rot=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rot;root.add(g);for(const px of [-1,1]){box(px,.4,0,.12,.8,.6,M.iron,g);box(px,1,-.33,.1,.9,.1,M.iron,g);}for(let i=0;i<4;i++)box(0,.75,-.3+i*.18,2.8,.09,.14,M.wood,g);for(let i=0;i<3;i++)box(0,.95+i*.16,-.34,2.8,.12,.07,M.wood,g);}
 function lamp(x,z){cylinder(x,1.9,z,.055,.09,3.8,M.iron);box(x,3.9,z,.38,.55,.38,M.iron);box(x,3.91,z+.2,.26,.35,.015,mat('#e5d4a5','',{emissive:'#d3c28e',emissiveIntensity:.25}));const cap=mesh(geometry('lamp-cap',()=>new T.ConeGeometry(.34,.28,4)),M.iron,x,4.3,z);cap.rotation.y=Math.PI/4;}
 function building(x,z,w,d,h,name,{bakery=false,winery=false}={}){
  box(x,.17,z,w+.6,.35,d+.6,M.stone);box(x,h/2+.35,z,w,h,d,M.plaster);box(x,.9,z,w+.08,1.1,d+.08,M.stone);
  const shape=new T.Shape();shape.moveTo(-w/2-.5,0);shape.lineTo(0,2.1);shape.lineTo(w/2+.5,0);shape.closePath();const roof=mesh(remember(new T.ExtrudeGeometry(shape,{depth:d+1,bevelEnabled:false})),M.roof,x,h+.35,z-d/2-.5);roof.castShadow=true;
  box(x,h+.3,z+d/2+.35,w+1,.18,.25,M.stone);box(x-w*.28,h+1.6,z,.8,2,.8,M.stone);
  const front=z+d/2+.03, floors=Math.max(1,Math.floor(h/3.1)),cols=Math.max(3,Math.floor(w/4));
  for(let f=0;f<floors;f++)for(let n=0;n<cols;n++){
   const wx=x-w/2+(n+.5)*w/cols,wy=2.1+f*3;
   if(f===0 && Math.abs(wx-x)<2.7)continue;
   box(wx,wy,front,1.4,1.85,.18,M.darkwood);box(wx,wy,front+.11,1.18,1.62,.035,M.glass);box(wx,wy,front+.14,.055,1.65,.06,M.stone);box(wx,wy,front+.14,1.2,.06,.06,M.stone);
   for(const side of [-1,1])box(wx+side*.91,wy,front+.08,.32,1.95,.11,mat('#60766e','wood'));
   if(f>0){box(wx,wy-1,front+.32,2,.16,.85,M.stone);box(wx,wy-.38,front+.73,2,.055,.055,M.iron);for(let i=0;i<6;i++)box(wx-.86+i*.345,wy-.7,front+.73,.035,.65,.035,M.iron);}
  }
  for(const side of [-1,1])for(let i=0;i<Math.floor(d/3);i++){const wz=z-d/2+1.5+i*3;box(x+side*(w/2+.035),2.3,wz,.08,1.7,1.15,M.glass);}
  box(x,1.55,front+.1,3.1,2.8,.17,M.darkwood);box(x,1.55,front+.21,2.75,2.5,.035,M.glass);box(x,1.55,front+.26,.08,2.6,.05,M.iron);
  box(x,3.15,front+.8,4.7,.17,1.9,winery?M.wood:mat(bakery?'#8d8b6f':'#b9b49b'));
  sign(name,x,3.8,front+.22,Math.min(w-1.5,7.5));
  for(const side of [-1,1]){cylinder(x+side*2.7,.5,front+1,.5,.36,1,M.stone);sphere(x+side*2.7,1.25,front+1,.7,.8,.7,M.leaf);}
 }
 function human(target,player=false){
  const g=new T.Group();root.add(g);g.position.set(target.x,0,target.z);
  const skin=mat(target.id==='marco'||target.id==='enzo'?'#b68e70':'#cfac8d');const outfit=mat(player?'#425c68':({lucia:'#566a6e',marco:'#637469',elena:'#8d7d69',marta:'#8d7c66',paolo:'#7b8175',sofia:'#78727a',giulia:'#67786b'}[target.id]||'#7d8175'));
  const pivot=(x,y,z)=>{const q=new T.Group();q.position.set(x,y,z);g.add(q);return q;};
  const legs=[];for(const side of [-1,1]){const p=pivot(side*.115,.82,0);cylinder(0,-.35,0,.085,.07,.7,mat('#3f4547'),p,8);box(0,-.76,.055,.16,.13,.29,mat('#343a39'),p);legs.push(p);}
  const torso=cylinder(0,1.14,0,.22,.17,.63,outfit,g,10);torso.scale.z=.7;
  cylinder(0,1.53,0,.065,.07,.16,skin,g,8);sphere(0,1.72,0,.145,.185,.14,skin,g);sphere(0,1.83,-.025,.15,.09,.14,mat('#504a40'),g);
  const arms=[];for(const side of [-1,1]){const p=pivot(side*.25,1.4,0);cylinder(0,-.24,0,.065,.055,.49,outfit,p,8);sphere(0,-.52,0,.055,.075,.055,skin,p);arms.push(p);}
  if(target.id==='elena')box(.31,1.05,.1,.04,.35,.24,M.wood,g);
  if(target.id==='paolo'||target.id==='marta')box(0,1.03,.15,.3,.55,.025,M.linen,g);
  const model={group:g,legs,arms,phase:0,id:target.id||'player'};people.push(model);return model;
 }
 const personModels=SCENES[area].targets.filter(t=>t.kind==='person'||t.kind==='street').map(t=>({target:t,model:human(t)}));
 let player=human({id:'player',x:0,z:0},true);
 if(area==='town'){
  box(0,-.25,0,94,.5,58,mat('#9aab80'));
  box(0,.015,3,87,.05,12,M.stone);box(-17,.025,-1,11,.06,25,M.stone);box(-27,.025,13,20,.06,23,M.stone);box(29,.025,-1,12,.06,25,M.stone);
  const sea=box(0,-.6,-73,220,.2,100,mat('#6b979c','',{roughness:.33,metalness:.16}));sea.castShadow=false;
  box(0,-.08,-28.2,94,.45,1.1,M.stone);for(let x=-44;x<45;x+=4){cylinder(x,.75,-28,.07,.07,1.5,M.iron);box(x+2,1.2,-28,4,.05,.05,M.iron);}
  for(let i=0;i<9;i++){const q=mesh(geometry('hill',()=>new T.ConeGeometry(1,1,7)),mat('#9aa897'),65+i*12,2,-48-i*6);q.scale.set(20,16+i*2,21);q.rotation.y=i*.6;}
  building(-17,-14,28,16,9.3,'HOTEL SOLE NASCENTE');building(-28,14,16,10,4.2,'MARTA’S BAKERY',{bakery:true});building(30,-15,16,12,4.5,'SOLE VINEYARD',{winery:true});
  for(let row=0;row<7;row++)for(let n=0;n<8;n++){const x=21+n*2.6,z=12+row*1.65;cylinder(x,.55,z,.035,.045,1.1,M.wood);sphere(x,1.05,z,.73,.42,.35,M.leaf);if(n%3===0)sphere(x+.25,.82,z+.22,.11,.18,.1,mat('#625a6a'));}
  for(const [x,z] of [[-39,-3],[-33,-3],[-5,-3],[16,-5],[41,-4],[-14,8],[-12,20],[12,21],[40,22],[-40,22]])tree(x,z,4.7,'olive');
  for(const [x,z] of [[-33,-23],[-1,-23],[-36,-21],[-2,-20],[20,-24],[41,-24],[17,-15],[42,-15]])tree(x,z,6.5);
  for(const [x,z] of [[-12,5],[12,5],[-12,22],[12,22],[19,-4],[-36,4]])lamp(x,z);
  bench(15,15,Math.PI/2);bench(-9,12,Math.PI/2);
  cylinder(0,.25,13,2.8,2.9,.5,M.stone,root,40);cylinder(0,.52,13,2.55,2.55,.09,M.water,root,40);cylinder(0,1.05,13,.3,.5,1.15,M.stone,root,20);cylinder(0,1.6,13,1.1,.65,.2,M.stone,root,24);
  for(let i=0;i<6;i++){const a=i*TAU/6;const curve=new T.CatmullRomCurve3([new T.Vector3(Math.cos(a)*.5,1.7,13+Math.sin(a)*.5),new T.Vector3(Math.cos(a)*1.2,2.2,13+Math.sin(a)*1.2),new T.Vector3(Math.cos(a)*2.1,.6,13+Math.sin(a)*2.1)]);mesh(remember(new T.TubeGeometry(curve,10,.025,5,false)),M.water,0,0,0);}
  sign('Reception  →',-17,1,-4.8,2.8);sign('Optional bakery',-28,1.1,20,2.6);sign('Optional vineyard',30,1.1,-7.8,2.8);
 }else{
  const [a,b,c,d]=SCENES[area].bounds,w=b-a,depth=d-c,mid=(c+d)/2;
  box(0,-.14,mid,w+.5,.28,depth+.5,area==='winery'?M.stone:mat('#e2dbca','stone'));
  box(0,1.9,c-.15,w+.5,3.8,.3,M.plaster);box(a-.15,1.9,mid,.3,3.8,depth,M.plaster);box(b+.15,1.9,mid,.3,3.8,depth,M.plaster);
  // Front wall is a deliberate architectural cutaway; collision still respects the room boundary.
  box(a/2-1,.45,d,(w/2)-2,.9,.3,M.stone);box(b/2+1,.45,d,(w/2)-2,.9,.3,M.stone);
  for(const side of [-1,1])for(let i=0;i<3;i++){const wz=c+3+i*5;box(side*(w/2-.03),2.2,wz,.07,2.2,2.4,M.glass);box(side*(w/2-.09),1,wz,.28,.12,2.7,M.stone);}
  sign(area==='hotel'?'SOLE NASCENTE · RECEPTION':area==='bakery'?'MARTA’S BAKERY · KITCHEN':'SOLE VINEYARD · TASTING ROOM',0,2.7,c+.18,area==='hotel'?9:8);
  for(const [x,z] of [[a+1,c+1],[b-1,c+1]])tree(x,z,2.5,'olive');
  if(area==='hotel'){
   box(0,.62,-5,11,1.25,1.8,M.wood);box(0,1.3,-5,11.4,.13,2.1,M.stone);
   for(const x of [-3.8,3.8]){box(x,1.48,-5,.8,.12,.6,M.iron);const screen=box(x,1.8,-5.2,.95,.55,.07,M.iron);screen.rotation.x=-.12;box(x,1.8,-5.15,.83,.43,.015,mat('#587378'));}
   sign('Reception',0,.8,-4.06,3);
   for(const z of [0,5]){box(-10,.4,z,3.8,.8,1.7,M.linen);box(-10,.95,z-.65,3.8,.8,.3,M.linen);for(const x of [-11.8,-8.2])box(x,.85,z,.25,.65,1.7,M.linen);}
   box(-10,.45,2.5,2.6,.13,1.2,M.wood);for(const x of [-11,-9])for(const z of [2.1,2.9])box(x,.2,z,.08,.45,.08,M.iron);
   box(10,1,-7,6,2,2,M.wood);sign('Operations',10,2.3,-5.95,2.5);
   const rug=box(-10,.025,2.5,5.2,.025,8.6,mat('#8f9d92'));rug.castShadow=false;
   for(const z of [-7,-2,4]){box(-14.8,2,z,.1,.9,1.2,mat('#7d8c80'));box(-14.7,2,z,.08,.65,.9,mat('#c3c4ad'));}
  }else if(area==='bakery'){
   box(-8,1.4,-4,4,2.8,6,mat('#69716e','',{metalness:.35}));box(-8,1.35,-.94,2.9,1.2,.08,M.iron);box(-8,1.35,-.88,2.5,.85,.03,mat('#4f4d42','',{emissive:'#d28c4c',emissiveIntensity:.15}));
   box(0,.85,-3,8,.18,2,mat('#c2c7c1','',{metalness:.5}));for(const x of [-3.6,3.6])for(const z of [-3.7,-2.3])box(x,.4,z,.1,.85,.1,M.iron);
   for(let i=0;i<9;i++){const loaf=sphere(-3+i*.7,1.08,-2.8,.25,.16,.13,mat('#c4a674'));loaf.castShadow=true;}
   for(let i=0;i<4;i++){box(7,.55+i*.5,-6,6,.08,1.5,M.wood);for(let j=0;j<7;j++)sphere(4.5+j*.75,.71+i*.5,-6,.28,.12,.18,mat('#bba07b'));}
   for(let i=0;i<4;i++)box(-9+i, .5,6,.85,1,.9,mat('#d9ceb1'));sign('Flour storage',-8,1.3,6.6,2.2);
  }else{
   for(const side of [-1,1])for(let i=0;i<4;i++){const barrel=cylinder(side*(6+i*1.3),.85,-5,.65,.65,1.65,M.wood,root,18);for(const y of [.25,1.45]){const hoop=mesh(remember(new T.TorusGeometry(.65,.035,5,18)),M.iron,barrel.position.x,y,-5);hoop.rotation.x=Math.PI/2;}}
   box(0,.8,-3,8,.14,1.8,M.wood);for(const x of [-3.5,3.5])for(const z of [-3.6,-2.4])box(x,.38,z,.15,.8,.15,M.iron);
   for(let i=0;i<7;i++){cylinder(-2.4+i*.8,1.1,-3,.09,.12,.5,mat(i%2?'#637064':'#7a6c5b'),root,10);cylinder(-2.4+i*.8,1.43,-3,.045,.045,.18,M.iron,root,8);}
   cylinder(-8,.8,3,1.25,1.25,.16,M.wood,root,24);cylinder(-8,.38,3,.1,.15,.8,M.iron);
  }
  const desk=SCENES[area].obstacles.find(o=>o.id.includes('workspace'));
  if(desk){box(desk.x,.85,desk.z,desk.w,.13,desk.d,M.wood);for(const side of [-1,1])box(desk.x+side*(desk.w/2-.2),.4,desk.z,.12,.85,desk.d*.8,M.iron);box(desk.x-.35,.95,desk.z,.8,.06,.55,mat('#eeece1'));box(desk.x+.65,.99,desk.z,.35,.13,.4,M.iron);sign('Student workspace',desk.x,1.65,desk.z-.6,2.8);}
  sign('Exit to town',0,2,d-.08,2.4,Math.PI);
  const light=new T.PointLight('#ffe8bd',35,28,2);light.position.set(0,3,1);root.add(light);
 }
 // Merge static objects sharing materials into a small set of GPU draw calls.
 root.updateMatrixWorld(true);const staticMeshes=[];root.traverse(o=>{if(o.isMesh&&!people.some(p=>p.group===o || p.group.getObjectById(o.id)))staticMeshes.push(o);});
 const buckets=new Map();for(const o of staticMeshes){const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}
 for(const list of buckets.values()){
  if(list.length<2)continue;const geos=list.map(o=>o.geometry.clone().applyMatrix4(o.matrixWorld));const merged=T.mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!merged)continue;
  const m=new T.Mesh(remember(merged),list[0].material);m.castShadow=true;m.receiveShadow=true;root.add(m);list.forEach(o=>o.removeFromParent());
 }
 return {root,player,personModels,resources,geometryCount:geometries.size,dispose(){resources.forEach(r=>r.dispose?.());root.removeFromParent();},animate(time,moving){
  for(const p of people){const walking=p===player&&moving;const a=walking?Math.sin(time*8)*.45:Math.sin(time*1.2+p.group.id)*.015;p.legs[0].rotation.x=a;p.legs[1].rotation.x=-a;p.arms[0].rotation.x=-a*.7;p.arms[1].rotation.x=a*.7;}
 }};
}
