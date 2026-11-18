// Original Lake Garda architecture and props. Shared footprints live in world-layout.js.
import {SCENES,GARDA_PROPS,groundHeight} from './world-layout.js';
export function addGardaDetails(h){
 const {T,root,area,mobile,box,cylinder,sphere,mat,mesh,geometry,remember,sign,tree}=h;
 const metal=mat('#353d3b','',{metalness:.72,roughness:.4}),stone=mat('#b5ab96','stone'),wood=mat('#78604a','wood'),paper=mat('#e7ddc5'),brass=mat('#9d8454','',{metalness:.65,roughness:.35}),glass=mat('#8da8a5','',{metalness:.12,roughness:.16,transparent:true,opacity:.34,depthWrite:false});
 const dynamic=[];
 function rod(a,b,r=.025,m=metal,parent=root){const va=new T.Vector3(...a),vb=new T.Vector3(...b),delta=vb.clone().sub(va);const q=mesh(geometry(`rod${r},${delta.length().toFixed(3)}`,()=>new T.CylinderGeometry(r,r,delta.length(),6)),m,...va.clone().add(vb).multiplyScalar(.5).toArray(),parent);q.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return q;}
 function chair(x,y,z,rot=0){const g=new T.Group();root.add(g);g.position.set(x,y,z);g.rotation.y=rot;box(0,.47,0,.48,.07,.48,wood,g);for(const a of [-.19,.19])for(const b of [-.19,.19])rod([a,0,b],[a,.47,b],.022,metal,g);for(const a of [-.22,.22])rod([a,.45,-.2],[a,.98,-.27],.022,metal,g);for(let n=0;n<3;n++)box(0,.68+n*.12,-.25,.48,.08,.035,wood,g);}
 function café(x,z,y=0,umbrella=false){cylinder(x,y+.74,z,.66,.66,.07,stone,root,24);cylinder(x,y+.36,z,.055,.08,.72,metal);cylinder(x,y+.035,z,.31,.31,.06,metal);chair(x-1,y,z,-Math.PI/2);chair(x+1,y,z,Math.PI/2);sphere(x,y+.84,z,.065,.09,.065,paper);if(umbrella){cylinder(x,y+1.4,z,.035,.035,2.8,wood);const q=mesh(geometry('umbrella',()=>new T.ConeGeometry(1.8,.5,12,1,true)),mat('#d8c9ab','',{side:T.DoubleSide}),x,y+2.7,z);q.castShadow=true;}}
 function lamp(x,y,z){box(x,y,z,.19,.34,.2,metal);box(x,y,z+.11,.12,.24,.025,mat('#efe0bd','',{emissive:'#ebc887',emissiveIntensity:.6}));}
 function window(x,y,z,w=1.3,curtain=false){
  box(x,y,z,w+.32,1.98,.19,stone);box(x,y,z+.11,w,1.72,.06,mat('#293c3b','',{roughness:.23,metalness:.25}));
  if(curtain)for(const side of [-1,1])box(x+side*w*.32,y,z+.16,w*.26,1.64,.02,paper);
  box(x,y,z+.18,w,1.72,.025,glass);box(x,y,z+.22,.045,1.74,.055,wood);box(x,y+.12,z+.22,w,.045,.055,wood);box(x,y-.96,z+.19,w+.52,.12,.48,stone);
  for(const side of [-1,1]){const sx=x+side*(w/2+.4),g=new T.Group();root.add(g);g.position.set(sx,y,z+.13);g.rotation.y=side*(Math.sin(x+y)>.1?.12:.38);const shutter=mat('#415446','wood');box(0,0,0,.48,1.8,.08,shutter,g);for(let n=0;n<9;n++)box(0,-.7+n*.17,.05,.42,.045,.035,shutter,g);box(side*.19,0,.05,.045,1.77,.045,metal,g);}
 }
 function facade(x,z,w,d,height,name){
  const front=z+d/2+.25;
  // Recessed openings, varied curtains and shutter angles, sandstone courses and cornices.
  for(const side of [-1,1])for(let y=.55;y<height;y+=.48)box(x+side*(w/2-.22),y,front,.42,.43,.22,stone);
  for(let floor=0;floor<Math.floor(height/3);floor++)for(let n=0;n<Math.floor(w/3.5);n++){const wx=x-w/2+(n+.5)*w/Math.floor(w/3.5);if(floor===0&&Math.abs(wx-x)<2.6)continue;window(wx,2.15+floor*3,front,1.28,(n+floor)%3===0);if(floor>0){box(wx,1.16+floor*3,front+.42,1.95,.14,.88,stone);for(const side of [-1,1])rod([wx+side*.95,1.2+floor*3,front+.8],[wx+side*.95,2.12+floor*3,front+.8]);rod([wx-.95,2.12+floor*3,front+.8],[wx+.95,2.12+floor*3,front+.8]);for(let k=0;k<8;k++)rod([wx-.88+k*.25,1.2+floor*3,front+.8],[wx-.88+k*.25,2.08+floor*3,front+.8],.012);}}
  for(const side of [-1,1])for(let floor=0;floor<Math.floor(height/3);floor++)for(let n=0;n<Math.floor(d/3.4);n++){const before=root.children.length;window(0,2.1+floor*3,0,1.15,(n+floor)%2===0);const parts=root.children.slice(before),group=new T.Group();root.add(group);group.position.set(x+side*(w/2+.14),0,z-d/2+(n+.5)*d/Math.floor(d/3.4));group.rotation.y=side*Math.PI/2;parts.forEach(o=>group.add(o));}
  for(let floor=0;floor<Math.floor(height/3);floor++)for(let n=0;n<Math.floor(w/4);n++){const before=root.children.length;window(0,2.15+floor*3,0,1.25,n%3===0);const parts=root.children.slice(before),group=new T.Group();root.add(group);group.position.set(x-w/2+(n+.5)*w/Math.floor(w/4),0,z-d/2-.16);group.rotation.y=Math.PI;parts.forEach(o=>group.add(o));}
  for(const side of [-1,1]){cylinder(x+side*(w/2-.12),height/2,front+.22,.055,.055,height,mat('#756554','',{metalness:.6}));const gutter=cylinder(x,height+.3,z+side*(d/2+.44),.08,.08,w+1,metal);gutter.rotation.z=Math.PI/2;}
  for(const y of [.3,3.28,height+.18])box(x,y,front,w+.45,.16,.24,stone);
  // Geometric barrel roof tiles with overlap; material noise supplies smaller weathering.
  const tile=mat('#b17b5d','roof');for(let sz=-d/2-.4;sz<d/2+.4;sz+=mobile?.75:.44){for(const side of [-1,1])for(let t=.2;t<w/2+.5;t+=.8){const rise=(1-t/(w/2+.5))*2.1;const q=cylinder(x+side*t,height+.48+rise,z+sz,.1,.09,.94,tile,root,6);q.rotation.z=side*(Math.PI/2-Math.atan(2.1/(w/2+.5)));}}
  sign(name,x,3.7,front+.12,Math.min(7,w-2));for(const side of [-1,1]){lamp(x+side*2.05,2.3,front+.28);box(x+side*.9,1.55,front+.23,.06,2.6,.07,brass);}
 }
 function bicycle(x,z,rot=0){const g=new T.Group();root.add(g);g.position.set(x,0,z);g.rotation.y=rot;for(const a of [-.53,.53]){const q=mesh(geometry('bike-wheel',()=>new T.TorusGeometry(.33,.027,5,18)),metal,a,.35,0,g);q.rotation.y=0;for(let k=0;k<6;k++){const t=k*Math.PI/3;rod([a,.35,0],[a+Math.cos(t)*.31,.35+Math.sin(t)*.31,0],.008,mat('#a1a5a0','',{metalness:.7}),g);}}for(const [a,b] of [[[ -.53,.35,0],[-.15,.82,0]],[[-.53,.35,0],[.1,.35,0]],[[-.15,.82,0],[.1,.35,0]],[[.1,.35,0],[.4,.8,0]],[[.4,.8,0],[-.15,.82,0]],[[.4,.8,0],[.53,.35,0]]])rod(a,b,.026,mat('#5c746d'),g);box(-.17,.86,0,.28,.06,.16,metal,g);rod([.4,.8,0],[.35,1,0],.022,metal,g);rod([.35,1,-.18],[.35,1,.18],.022,metal,g);}
 function ridge(z,depth,height,color,seed,rotate=0){
  const span=Math.max(90,depth*5),g=remember(new T.PlaneGeometry(660,span,100,18));g.rotateX(-Math.PI/2);const pos=g.getAttribute('position');
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),v=(pos.getZ(i)+span/2)/span;const skyline=.65+.18*Math.sin(x*.029+seed)+.12*Math.sin(x*.073+seed*.6)+.045*Math.cos(x*.17+seed);pos.setY(i,height*skyline*Math.sin(Math.PI*v)**.8+Math.sin(x*.13+v*9)*Math.sin(Math.PI*v)*1.8);}
  g.computeVertexNormals();const q=mesh(g,mat(color),0,-1,z-span/2);q.castShadow=false;q.rotation.y=rotate;return q;
 }
 if(area==='town'){
  facade(-17,-14,28,16,9.3,'HOTEL SOLE NASCENTE');facade(-28,14,16,10,4.2,'PANIFICIO MARTA');facade(30,-15,16,12,4.5,'CANTINA SOLE');
  // Village road, raised pavements, drainage, crossings and repaired asphalt.
  box(0,.075,3,89,.06,6,mat('#666661','asphalt'));for(const z of [-.2,6.2]){box(0,.045,z,89,.16,.22,stone);box(0,.005,z+(z<0?-.19:.19),89,.05,.22,mat('#575a55'));}
  for(const x of [-38,-26,6,20,37]){box(x,.025,5.8,.8,.025,.26,metal);for(let k=0;k<6;k++)box(x-.34+k*.13,.045,5.8,.035,.02,.3,stone);}
  box(-27,.025,14,5,.07,15,mat('#77716a','asphalt'));for(const x of [-29.7,-24.3])box(x,.06,13,.18,.16,15,stone);
  box(30,.035,1.5,4,.08,17,mat('#b4a88a','gravel'));box(30,.025,9,4,.06,4,mat('#b4a88a','gravel'));
  for(let i=0;i<5;i++)box(-17,.035,1+i*.95,2.7,.015,.4,mat('#c8c3ad','stone'));
  for(const p of [[-4,1.2,4,1.1],[23,4,2,1.3],[-34,2,3,.8]])box(p[0],.02,p[1],p[2],.014,p[3],mat('#595c59','asphalt'));
  for(const x of [-21,-13]){cylinder(x,.38,-4.4,.07,.09,.75,metal);cylinder(x,.68,-4.4,.075,.075,.035,brass);}
  // Lake-facing rear terrace and a continuous lakefront promenade.
  box(-17,.04,-24.5,29,.13,4.3,stone);box(0,-.1,-27.1,94,.25,1.6,stone);
  for(const x of [-25,-16,-7])café(x,-24.5,0,x!==-16);
  for(let x=-44;x<45;x+=3){rod([x,.05,-28.1],[x,1,-28.1],.025);rod([x,1,-28.1],[x+3,1,-28.1],.025);rod([x,.46,-28.1],[x+3,.46,-28.1],.012);}
  // Animated rippled lake, enclosed by a continuous opposite shoreline and layered ridges.
  const lakeMaterial=mat('#83abb0','water',{roughness:.24,metalness:.5,transparent:true,opacity:.94});const lake=box(0,-.46,-186,620,.04,316,lakeMaterial);lake.userData.dynamic=true;dynamic.push(lake);
  ridge(-245,10,88,'#9ba9ab',4);ridge(-212,12,66,'#7f9395',1);ridge(-185,18,45,'#647e79',7);ridge(-190,18,60,'#83928a',5,Math.PI/2).position.set(-220,-1,-100);ridge(-190,18,72,'#8d9e9b',9,-Math.PI/2).position.set(220,-1,-100);
  box(0,-.65,-181,620,2,10,mat('#82907c','gravel'));
  for(let i=0;i<44;i++){const x=-180+i*8.3,y=1.4+(i%4)*.38,z=-177-(i%3);box(x,y,z,2.5+(i%3),y*2,2,mat(i%3===0?'#c5b696':'#d2c9b3','plaster'));const roof=mesh(geometry('village-roof',()=>new T.ConeGeometry(1,1,4)),mat('#8f6650','roof'),x,y*2+.6,z);roof.scale.set(2.5,.9,1.8);roof.rotation.y=Math.PI/4;}
  // Timber landing, mooring posts and a modest clinker-style lake boat.
  box(8,-.2,-33,2.4,.3,10,wood);for(let z=-29;z>-38;z-=.32)box(8,-.025,z,2.5,.05,.035,mat('#5b4d40','wood'));for(const x of [6.6,9.4])for(const z of [-29,-36])cylinder(x,-.5,z,.1,.12,1.4,wood);
  const boat=new T.Group();root.add(boat);boat.position.set(12,-.1,-35);boat.rotation.y=.25;const hull=mesh(geometry('open-boat-hull',()=>new T.SphereGeometry(1,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2)),mat('#e0dfd1','',{side:T.DoubleSide}),0,.3,0,boat);hull.scale.set(.95,.5,2.3);box(0,.21,0,1.35,.07,3.2,wood,boat);for(const z of [-.9,.6])box(0,.38,z,1.4,.1,.34,wood,boat);boat.userData.dynamic=true;dynamic.push(boat);
  // Retaining walls, trellis wires and cultivated ground follow the rising vineyard.
  for(let row=0;row<7;row++){const z=12+row*1.65,y=groundHeight('town',30,z);box(31,y-.18,z,23,.35,1.45,mat('#938269','gravel'));for(let n=0;n<8;n++){const x=21+n*2.6,vy=groundHeight('town',x,z);cylinder(x,vy+.7,z,.035,.045,1.4,wood);if(n<7)for(const h of [.6,1.1])rod([x,vy+h,z],[x+2.6,groundHeight('town',x+2.6,z)+h,z],.009,metal);}if(row%2===0)box(31,y-.03,z+.78,23,.3,.16,stone);}
  for(const x of [27.8,32.2])box(x,.75,10,.23,1.5,.25,stone);for(const x of [27.9,32.1]){for(let i=0;i<4;i++)rod([x,.4,10+i*.4],[x,1.2,10+i*.4],.035,wood);rod([x,1.2,10],[x,1.2,11.4],.04,wood);}
  // Shopfront display, fabric awning, entrance lights and price board.
  for(const sx of [-32.6,-23.4]){box(sx,1.3,19.35,3.2,1.9,.18,wood);box(sx,1.3,19.47,2.9,1.65,.04,glass);for(let j=0;j<5;j++)sphere(sx-1+j*.5,.8,19.5,.22,.13,.12,mat(j%2?'#b8894f':'#c8a16a'));}
  for(let i=0;i<18;i++){const q=box(-32.25+i*.5,2.9,20, .5,.06,1.7,mat(i%2?'#d8cfb4':'#5c6f5d','linen'));q.rotation.x=.12;}sign('Pane fresco · Caffè',-31.9,1.4,20.6,1.5);
  for(const p of GARDA_PROPS){if(p.kind==='bike')bicycle(p.x,p.z,p.rot||0);else if(p.kind==='bin'){cylinder(p.x,.48,p.z,.23,.23,.96,metal);cylinder(p.x,.99,p.z,.26,.26,.09,metal);}else if(p.kind==='bed'){box(p.x,.12,p.z,p.w,.28,p.d,stone);for(let i=0;i<8;i++)sphere(p.x-p.w*.4+i*p.w*.11,.4,p.z,.22,.25,.22,mat(i%3?'#727b50':'#8a886a'));}}
  // A few quiet neighbouring façades keep the neighbourhood from feeling like three isolated objects.
  for(const x of [-53,52]){box(x,3.8,11,13,7.6,13,mat(x<0?'#c5ad8c':'#b9b4a0','plaster'));for(let n=0;n<3;n++)for(const y of [2,5])window(x-4+n*4,y,17.6,1.1,true);const q=mesh(geometry('neighbour-roof',()=>new T.ConeGeometry(1,1,4)),mat('#9c7358','roof'),x,8.6,11);q.rotation.y=Math.PI/4;q.scale.set(10,2.3,10);}
  sign('LAGO DI GARDA',-2,1,-26.2,2.8);sign('Via del Lago',-11,1.6,.1,1.8);sign('Cantina · vigneti →',31,1.5,8,2.2);
 }else{
  const [a,b,c,d]=SCENES[area].bounds;
  // Continuous skirting, door frames, wall lamps and ceiling pendants in an open-front cutaway.
  for(const x of [a+.1,b-.1])box(x,.12,(c+d)/2,.12,.24,d-c,wood);box(0,.12,c+.05,b-a,.24,.1,wood);
  for(const x of [-1.4,1.4])box(x,1.4,d-.02,.13,2.8,.16,wood);box(0,2.85,d-.02,2.95,.15,.16,wood);
  for(const x of [-6,0,6]){rod([x,3.8,-.2],[x,3.15,-.2],.012);const shade=mesh(geometry('pendant',()=>new T.ConeGeometry(.27,.2,16,1,true)),mat('#cbb991','',{side:T.DoubleSide}),x,3.12,-.2);cylinder(x,3.04,-.2,.12,.12,.035,mat('#f0d7a1','',{emissive:'#e9bf73',emissiveIntensity:.5}));}
  if(area==='hotel'){
   // Timber slat reception, cabinet drawers and modest desk equipment.
   for(let i=0;i<65;i++)box(-5.3+i*.165,.66,-4.05,.055,1.16,.045,wood);
   for(const x of [-3.8,3.8]){box(x,1.39,-4.7,.7,.025,.22,metal);for(let r=0;r<3;r++)for(let n=0;n<9;n++)box(x-.28+n*.065,1.41,-4.78+r*.065,.04,.01,.04,paper);box(x+.6,1.44,-4.65,.2,.14,.3,metal);box(x-.7,1.41,-5,.34,.08,.22,metal);const phone=box(x-.7,1.49,-5,.4,.06,.1,metal);phone.rotation.y=.2;}
   box(.8,1.45,-4.75,.24,.2,.34,metal);sign('Benvenuti',0,1.45,-4.1,1.2);
   for(let i=0;i<5;i++){box(7.5+i,1,-5.97,.88,.55,.04,wood);box(7.5+i,1.1,-5.93,.23,.025,.04,brass);}
   for(const z of [-8,-3,3]){lamp(-14.5,2.7,z);box(-14.65,2,z,.12,1.3,1.9,wood);box(-14.55,2,z,.04,1.12,1.72,mat('#9aab9e'));box(-14.51,1.75,z,.03,.45,1.7,mat('#688f94'));}
   box(-10,.89,2.5,.6,.02,.45,paper);box(-9.4,.89,2.5,.25,.025,.35,mat('#8b6753'));sphere(-10.6,1.03,2.5,.09,.15,.09,mat('#b3b59f'));
   for(const x of [-12,-8]){cylinder(x,1,5.5,.025,.04,1.9,brass);const q=mesh(geometry('floor-lamp',()=>new T.ConeGeometry(.35,.35,16,1,true)),paper,x,1.9,5.5);}
   // Luggage stays within the existing operations cabinet footprint.
   for(const x of [8.2,9.5,10.8]){box(x,.48,-7.2,.75,.96,.45,mat(x<9?'#645e53':'#485b58','linen'));rod([x-.18,1,-7.2],[x-.18,1.35,-7.2],.015);rod([x+.18,1,-7.2],[x+.18,1.35,-7.2],.015);rod([x-.18,1.35,-7.2],[x+.18,1.35,-7.2],.02);}
   // North wall windows repeat the rear lakeside façade rhythm, with a landscape beyond glazing.
   for(const x of [-10,-5,0,5,10]){window(x,2.1,c+.2,2.2,true);box(x,2.1,c+.34,1.9,1.5,.02,mat('#9caeab'));box(x,1.68,c+.36,1.9,.5,.02,mat('#698e91'));}
  }else if(area==='bakery'){
   for(let n=0;n<5;n++){box(-9.25+n*.6,2.3,-.82,.25,.16,.05,metal);cylinder(-9.25+n*.6,2.3,-.78,.045,.045,.04,brass).rotation.x=Math.PI/2;}sign('FORNO · 180°',-8,2.7,-.77,1.7);
   for(let i=0;i<10;i++){const x=-3.2+i*.7;box(x,.98,-3,.6,.025,.65,metal);const bread=sphere(x,1.14,-3,i%3===0?.14:.25,.14,i%3===0?.24:.13,mat(i%2?'#b98442':'#c99e62'));for(let k=0;k<3;k++)box(x-.12+k*.11,1.265,-3,.035,.018,.16,paper);}
   box(6.9,1.2,-5.7,5.8,1.7,.04,glass);sign('Pane · Focaccia · Cornetti',7,2.6,-5.7,3.8);
   for(let i=0;i<4;i++){box(-9.2+i,.95,6,.6,.75,.5,mat('#b3966a','linen'));sign('FARINA',-9.2+i,1,6.27,.42);}
   for(const x of [5,7,9]){box(x,.2,-6, .7,.4,.8,wood);for(let k=0;k<5;k++)box(x-.3+k*.15,.4,-5.6,.08,.4,.04,wood);}
  }else{
   for(const side of [-1,1])for(let i=0;i<4;i++){const x=side*(6+i*1.3);for(let k=0;k<16;k++){const t=k*Math.PI/8;rod([x+Math.sin(t)*.655,.15,-5+Math.cos(t)*.655],[x+Math.sin(t)*.655,1.55,-5+Math.cos(t)*.655],.008,mat('#4e4136'));}cylinder(x,1.7,-5,.62,.62,.06,wood);}
   for(let r=0;r<3;r++)for(let n=0;n<12;n++){const x=-3.7+n*.67,y=.25+r*.45;box(x,y,-3.3,.55,.05,.55,wood);const bottle=cylinder(x,y+.16,-3.3,.075,.075,.3,mat('#35493c','',{roughness:.22,metalness:.1}));bottle.rotation.x=Math.PI/2;}
   for(let n=0;n<5;n++){const x=-1.8+n*.85;cylinder(x,1.03,-2.5,.055,.025,.16,glass,root,12);cylinder(x,.91,-2.5,.015,.015,.15,glass);cylinder(x,.84,-2.5,.055,.055,.018,glass);box(x,1.2,-3,.15,.2,.014,paper);}
   chair(-8,0,1.5,Math.PI);chair(-8,0,4.5);
  }
  const desk=SCENES[area].obstacles.find(o=>o.id.includes('workspace'));if(desk){box(desk.x-.35,.99,desk.z,.78,.01,.5,paper);for(let i=0;i<6;i++)box(desk.x-.35,1,desk.z-.16+i*.055,.5,.003,.012,mat('#a8a398'));box(desk.x+.65,1.07,desk.z,.24,.02,.23,mat('#8d9b8d'));rod([desk.x-.1,1.01,desk.z-.2],[desk.x+.1,1.01,desk.z+.1],.012,brass);}
 }
 return {dynamic,animate(time){for(const o of dynamic){if(o.isGroup){o.rotation.z=Math.sin(time*.7)*.015;o.position.y=-.1+Math.sin(time*.8)*.025;}else if(o.material.map){o.material.map.offset.x=time*.002;o.material.map.offset.y=time*.0005;}}}};
}
