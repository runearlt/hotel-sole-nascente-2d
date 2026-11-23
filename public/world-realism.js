// Original anatomical figures and environmental dressing. No game or assessment state.
export function createPerson(h,target,player){
 const {T,root,box,cylinder,sphere,mat}=h,g=new T.Group();root.add(g);g.position.set(target.x,0,target.z);
 const female=['lucia','elena','marta','sofia','giulia'].includes(target.id),skin=mat(target.id==='marco'||target.id==='enzo'?'#b58b70':'#d3ae91','',{roughness:.57}),hair=mat(['elena','sofia'].includes(target.id)?'#6a5140':'#302b27');
 const shirt=mat(player?'#425c68':({lucia:'#e5e1d5',marco:'#b3c0c0',elena:'#c8b8a5',marta:'#e3d5be',paolo:'#ddd8cc',sofia:'#9b8b8a',giulia:'#b9bbaa'}[target.id]||'#a6aca5'),'linen');const trousers=mat('#343c40'),shoe=mat('#302d2a','',{roughness:.48}),eye=mat('#302d2a');
 const pivot=(parent,x,y,z)=>{const p=new T.Group();p.position.set(x,y,z);parent.add(p);return p;};
 const legs=[],knees=[],arms=[],elbows=[];
 for(const side of [-1,1]){const leg=pivot(g,side*.105,.89,0);cylinder(0,-.19,0,.092,.075,.38,trousers,leg,12);const knee=pivot(leg,0,-.39,0);cylinder(0,-.19,.005,.073,.052,.38,trousers,knee,12);const foot=sphere(0,-.42,.055,.078,.065,.15,shoe,knee);legs.push(leg);knees.push(knee);}
 const hips=sphere(0,.91,0,.19,.14,.12,trousers,g);const torso=cylinder(0,1.17,0,female?.205:.23,.165,.48,shirt,g,18);torso.scale.z=.62;sphere(0,1.395,0,.205,.065,.105,shirt,g);
 cylinder(0,1.47,0,.057,.062,.12,skin,g,12);
 sphere(0,1.65,0,.103,.143,.105,skin,g);sphere(0,1.565,.025,.071,.055,.072,skin,g);sphere(0,1.725,-.018,.107,.077,.099,hair,g);
 if(female){sphere(0,1.64,-.074,.105,.115,.054,hair,g);sphere(0,1.65,-.125,.065,.065,.06,hair,g);}
 for(const side of [-1,1]){sphere(side*.102,1.64,0,.018,.031,.025,skin,g);sphere(side*.039,1.672,.092,.025,.012,.012,mat('#eee8dc'),g);sphere(side*.039,1.672,.102,.008,.009,.005,eye,g);const brow=box(side*.039,1.697,.096,.045,.008,.009,hair,g);brow.rotation.z=side*.06;const arm=pivot(g,side*.225,1.37,0);sphere(0,-.025,0,.078,.085,.078,shirt,arm);cylinder(0,-.15,0,.069,.055,.26,shirt,arm,12);const elbow=pivot(arm,0,-.29,0);cylinder(0,-.12,0,.054,.034,.24,skin,elbow,12);sphere(0,-.285,.009,.039,.066,.027,skin,elbow);arms.push(arm);elbows.push(elbow);}
 sphere(0,1.637,.108,.021,.033,.034,skin,g);box(0,1.587,.093,.043,.006,.009,mat('#9c7567'),g);
 for(const side of [-1,1]){const collar=box(side*.055,1.4,.105,.073,.09,.015,shirt,g);collar.rotation.z=side*.4;}
 for(let n=0;n<4;n++)sphere(0,1.13+n*.063,.116,.007,.007,.006,shoe,g);
 box(.11,1.3,.13,.068,.035,.012,mat('#c6b586','',{metalness:.55}),g);
 if(['marta','paolo'].includes(target.id))box(0,1.01,.13,.28,.5,.018,mat('#f0e8d4','linen'),g);
 if(target.id==='elena')box(.28,1.02,.03,.025,.29,.21,mat('#75614b','wood'),g);
 // Body silhouettes cast shadows; small articulated details do not multiply shadow passes.
 g.traverse(o=>{if(o.isMesh)o.castShadow=o===torso||o===hips;});
 return {group:g,legs,knees,arms,elbows,phase:0,id:target.id||'player'};
}
export function addRealism(h){
 const {T,root,area,mobile,box,cylinder,sphere,mat,mesh,geometry}=h;
 const stone=mat('#b5ab96','stone'),metal=mat('#353d3b','',{metalness:.72,roughness:.4}),wood=mat('#78604a','wood');
 if(area==='town'){
  // Low planting stays clear of the shared walkable routes and all interactive targets.
  for(const [x,z,w,d] of [[-42,-15,5,15],[9,-17,13,12],[-37,23,8,7],[5,23,10,7]]){
   box(x,.008,z,w,.012,d,mat('#a6b98b','terrain'));
   const count=mobile?25:90;
   for(let i=0;i<count;i++){const px=x+Math.sin(i*127.1)*w*.46,pz=z+Math.sin(i*311.7)*d*.46;const blade=mesh(geometry('grass-blade',()=>{const g=new T.PlaneGeometry(.035,.22),p=g.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getY(i)>0)p.setX(i,p.getX(i)*.05);return g;}),mat('#6b8151','',{side:T.DoubleSide}),px,.09,pz);blade.rotation.y=i*2.4;blade.castShadow=false;}
  }
  // Low masonry edging, rounded shrub clusters and lavender at the existing hotel beds.
  for(const x of [-22,-12])for(let i=0;i<12;i++){const px=x-1.7+i*.31;for(let j=0;j<3;j++){const stem=cylinder(px,.28+j*.025,-4.9+j*.17,.008,.011,.44,mat('#6b8151'),root,5);stem.castShadow=false;const bloom=sphere(px,.54,-4.9+j*.17,.035,.09,.035,mat('#8c829b'));bloom.castShadow=false;}}
  // Waterfront coping and natural stones visually tie the promenade to the water.
  for(let x=-45;x<46;x+=1.5){box(x,-.12,-28.55,1.45,.32,.62,stone);if(Math.round(x*2)%3===0){const rock=sphere(x,-.46,-29.4,.45,.3,.34,stone);rock.rotation.y=x;}}
  // Architectural infill outside the playable bounds supplies a coherent village silhouette.
  for(const side of [-1,1])for(let i=0;i<4;i++){const x=side*(56+i*9),z=-14+(i%2)*18,w=7+(i%2)*2,height=5.2+(i%3)*1.3;box(x,height/2,z,w,height,9,mat(i%2?'#d7c8af':'#c9c5b3','plaster'));box(x,height+.1,z,w+.5,.24,9.5,mat('#ad7960','roof'));for(let floor=0;floor<2;floor++)for(let n=0;n<3;n++){box(x-w*.32+n*w*.32,1.8+floor*2.7,z+4.54,.85,1.3,.04,mat('#3b5558','',{roughness:.18,metalness:.28}));for(const a of [-.56,.56])box(x-w*.32+n*w*.32+a,1.8+floor*2.7,z+4.58,.22,1.4,.06,mat('#415446','wood'));}}
 }else{
  // Restrained ceiling beams and upholstered detailing reinforce room scale.
  const z=area==='hotel'?-8:-6;
  for(const x of [-8,0,8])box(x,3.74,z,.16,.22,4,wood);
  if(area==='hotel')for(const a of [-11,-9])for(const b of [0,5]){const cushion=box(a,.88,b,.8,.22,1.2,mat('#c6c7b7','linen'));cushion.rotation.y=.03;}
  if(area==='bakery')for(let n=0;n<7;n++){const croissant=sphere(-2.8+n*.85,1.2,-3.2,.19,.1,.13,mat('#cba46d'));croissant.rotation.y=n*.7;}
  if(area==='winery')for(const x of [-3,-1.5,0,1.5,3]){box(x,.91,-2.6,.45,.015,.3,mat('#e9e1cf','linen'));cylinder(x+.15,1.02,-2.6,.065,.065,.18,mat('#866443','',{roughness:.6}));}
 }
}
export function addVine(h,x,y,z,seed){
 const {T,root,mat,mesh,geometry,remember,cylinder,sphere}=h;
 // One shared veined leaf cutout; many orientations give each trained vine an irregular silhouette.
 if(!root.userData.vineMaterial){const c=document.createElement('canvas');c.width=c.height=128;const a=c.getContext('2d');a.fillStyle='#718847';a.beginPath();a.moveTo(64,119);a.bezierCurveTo(34,100,5,83,16,56);a.lineTo(37,64);a.lineTo(28,27);a.lineTo(53,41);a.lineTo(65,6);a.lineTo(78,41);a.lineTo(105,25);a.lineTo(96,65);a.lineTo(120,55);a.bezierCurveTo(127,91,89,103,64,119);a.fill();a.strokeStyle='#c2c885';a.lineWidth=1;a.beginPath();a.moveTo(64,117);a.lineTo(65,17);for(let i=0;i<5;i++){a.moveTo(64,108-i*16);a.lineTo(i%2?28:100,76-i*8);}a.stroke();const tex=remember(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;root.userData.vineMaterial=remember(new T.MeshStandardMaterial({map:tex,alphaTest:.3,side:T.DoubleSide,roughness:.86}));}
 const branch=cylinder(x,y+.48,z,.023,.045,.96,mat('#78604a','wood'),root,7);branch.rotation.z=Math.sin(seed)*.13;
 for(let i=0;i<22;i++){const leaf=mesh(geometry('vine-leaf',()=>new T.PlaneGeometry(.31,.34)),root.userData.vineMaterial,x+Math.sin(i*5.3+seed)*.72,y+.78+(i%4)*.105,z+Math.cos(i*2.4)*.23);leaf.rotation.set(Math.sin(i)*.6,i*2.4+seed,Math.cos(i)*.6);leaf.castShadow=false;}
 if(seed%3===0)for(let i=0;i<8;i++)sphere(x+.2+Math.sin(i*2.4)*.055,y+.76-i*.018,z+.13+Math.cos(i)*.04,.034,.041,.034,mat('#50445d'));
}
