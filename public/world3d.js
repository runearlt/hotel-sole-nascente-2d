import {SCENES,toWorld,fromWorld,safePosition,moveWithCollisions,nearestTarget,findRoute,groundHeight} from './world-layout.js';
let enginePromise;
const engine=()=>enginePromise||=(Promise.all([import('./vendor/three-bundle.js'),import('./world-art.js')]).catch(error=>{enginePromise=null;throw error;}));
const editing=target=>target instanceof Element && Boolean(target.closest('input,textarea,select,button,a,summary'));
export class InvestigationWorld {
 constructor(canvas,saved,{area='town',onTarget=()=>{},onMove=()=>{},preview=false,recommended=null}={}){
  this.canvas=canvas;this.saved=saved;this.area=area;this.onTarget=onTarget;this.onMove=onMove;this.preview=preview;this.recommended=recommended;
  this.keys=new Set();this.route=[];this.pendingTarget=null;this._paused=false;this.destroyed=false;this.ready=false;this.yaw=.75;this.distance=preview?35:area==='town'?20:14;this.elapsed=0;this.frames=0;this.last=performance.now();
  this.position=safePosition(area,toWorld(saved));Object.assign(saved,fromWorld(this.position));this.mobile=matchMedia('(max-width:760px)').matches;this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  this.canvas.scene3d=this;this.canvas.dataset.world=area;this.canvas.dataset.webgl='loading';this.labelNodes=[];this.mount();
  this.feedback=document.createElement('div');this.feedback.className='world-feedback';this.feedback.setAttribute('role','status');this.feedback.textContent='Loading the 3D environment…';this.stage.append(this.feedback);
  this.keyDown=e=>{if(this.preview||this.paused||editing(e.target))return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(['e','enter'].includes(k)){e.preventDefault();this.interact();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){this.keys.add(k);this.route=[];this.pendingTarget=null;}};
  this.keyUp=e=>{this.keys.delete(e.key.toLowerCase());};this.blur=()=>{this.keys.clear();if(!this.preview)this.onMove(true);};
  this.pointerDown=e=>{if(this.preview||this.paused)return;this.drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,pointerId:e.pointerId};this.canvas.setPointerCapture?.(e.pointerId);};
  this.pointerMove=e=>{if(this.preview||this.paused)return;if(this.drag){const dx=e.clientX-this.drag.lastX,dy=e.clientY-this.drag.lastY;this.drag.lastX=e.clientX;this.drag.lastY=e.clientY;if(Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>7)this.drag.moved=true;if(this.drag.moved){this.yaw-=dx*.006;this.distance=Math.min(32,Math.max(10,this.distance+dy*.025));}}else this.hover(e);};
  this.pointerUp=e=>{const drag=this.drag;this.drag=null;if(drag&&!drag.moved)this.pointer(e);};
  this.wheel=e=>{if(this.preview||this.paused)return;e.preventDefault();this.distance=Math.min(32,Math.max(10,this.distance+Math.sign(e.deltaY)*1.2));};
  this.contextMenu=e=>e.preventDefault();this.contextLost=e=>{e.preventDefault();if(!this.destroyed)this.fail('The 3D graphics connection was interrupted. Reload this page to restore it. Your saved investigation is preserved.');};
  window.addEventListener('keydown',this.keyDown);window.addEventListener('keyup',this.keyUp);window.addEventListener('blur',this.blur);
  canvas.addEventListener('pointerdown',this.pointerDown);canvas.addEventListener('pointermove',this.pointerMove);canvas.addEventListener('pointerup',this.pointerUp);canvas.addEventListener('pointercancel',()=>{this.drag=null;});canvas.addEventListener('wheel',this.wheel,{passive:false});canvas.addEventListener('contextmenu',this.contextMenu);canvas.addEventListener('webglcontextlost',this.contextLost);
  this.initialization=this.initialize();
 }
 mount(){
  this.stage=this.canvas.parentElement;if(!this.stage)return;
  if(this.labels && this.labels.parentElement!==this.stage)this.stage.append(this.labels);
  if(this.feedback && this.feedback.parentElement!==this.stage)this.stage.append(this.feedback);
  if(this.prompt && this.prompt.parentElement!==this.stage)this.stage.append(this.prompt);if(this.guidance&&this.guidance.parentElement!==this.stage)this.stage.append(this.guidance);
  this.observer?.disconnect();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.stage);this.resize();
 }
 attach(){this.mount();}
 get paused(){return this._paused;}
 set paused(value){this._paused=Boolean(value);if(value){this.keys?.clear();this.drag=null;}if(this.prompt)this.prompt.hidden=this.preview||this._paused;}
 async initialize(){
  try{
   const [T,art]=await engine();if(this.destroyed)return;this.T=T;
   const gl=this.canvas.getContext('webgl2',{antialias:!this.mobile,alpha:false,powerPreference:'default'});if(!gl)throw Error('WebGL 2 is unavailable');
   this.renderer=new T.WebGLRenderer({canvas:this.canvas,context:gl,antialias:!this.mobile});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.mobile?1.25:1.6));this.renderer.shadowMap.enabled=!this.mobile;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;
   this.scene=new T.Scene();this.scene.background=new T.Color(this.area==='town'?'#cedcdf':'#e8e6dc');this.scene.fog=new T.Fog(this.area==='town'?'#b7c7ca':'#ddd9cf',this.area==='town'?100:55,this.area==='town'?430:180);
   const sky=document.createElement('canvas');sky.width=1024;sky.height=512;const sx=sky.getContext('2d'),gradient=sx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#3989c7');gradient.addColorStop(.5,'#b9d9e7');gradient.addColorStop(.58,'#ddd8c2');gradient.addColorStop(1,'#7f8170');sx.fillStyle=gradient;sx.fillRect(0,0,1024,512);let cloudSeed=84;const cloudRand=()=>((cloudSeed=(cloudSeed*1664525+1013904223)>>>0)/4294967296);for(let i=0;i<65;i++){const x=cloudRand()*1024,y=75+cloudRand()*105,r=25+cloudRand()*65;const cg=sx.createRadialGradient(x,y,0,x,y,r);cg.addColorStop(0,'rgba(255,255,255,.11)');cg.addColorStop(1,'rgba(255,255,255,0)');sx.fillStyle=cg;sx.save();sx.translate(x,y);sx.scale(2,.45);sx.translate(-x,-y);sx.fillRect(x-r,y-r,r*2,r*2);sx.restore();}this.skyTexture=new T.CanvasTexture(sky);this.skyTexture.mapping=T.EquirectangularReflectionMapping;this.skyTexture.colorSpace=T.SRGBColorSpace;this.scene.environment=this.skyTexture;this.scene.environmentIntensity=this.area==='town'?.5:.35;if(this.area==='town')this.scene.background=this.skyTexture;
   this.camera=new T.PerspectiveCamera(55,1,.12,900);this.cameraPosition=new T.Vector3();this.cameraAim=new T.Vector3();this.cameraInitialized=false;
   this.scene.add(new T.HemisphereLight('#e4f0ff','#81947c',1.6));const sun=new T.DirectionalLight('#fff0d8',3.1);sun.position.set(-30,27,35);sun.castShadow=!this.mobile;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.far=110;sun.shadow.normalBias=.045;this.scene.add(sun);sun.target.position.set(0,0,0);this.scene.add(sun.target);
   this.art=art.createWorldArt(this.scene,this.area,{mobile:this.mobile});await Promise.all(this.art.textureReady||[]);if(this.destroyed)return;this.raycaster=new T.Raycaster();this.pointerVector=new T.Vector2();this.proxies=[];
   this.floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshBasicMaterial({visible:false}));this.floor.rotation.x=-Math.PI/2;this.floor.position.y=.04;this.scene.add(this.floor);this.floor.updateMatrixWorld();
   this.labels=document.createElement('div');this.labels.className='world-labels';this.stage.append(this.labels);
   for(const target of SCENES[this.area].targets){
    const proxy=new T.Mesh(new T.CylinderGeometry(target.kind==='entrance'?1.7:.6,target.kind==='entrance'?1.7:.6,2.3,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));proxy.position.set(target.x,1.15,target.z);proxy.userData.target=target;this.scene.add(proxy);this.proxies.push(proxy);
    const node=document.createElement('button');node.type='button';node.className='world-label';node.textContent=target.name;node.setAttribute('aria-label',`${target.name}${target.role?' · '+target.role:''}`);node.addEventListener('click',()=>this.select(target));this.labels.append(node);this.labelNodes.push({node,target});
   }
   this.ring=new T.Mesh(new T.TorusGeometry(.5,.018,6,28),new T.MeshBasicMaterial({color:'#b09f72'}));this.ring.rotation.x=-Math.PI/2;this.ring.position.y=.07;this.ring.visible=false;this.scene.add(this.ring);
   this.prompt=document.createElement('button');this.prompt.type='button';this.prompt.className='world-prompt';this.prompt.addEventListener('click',()=>this.interact());this.stage.append(this.prompt);
   this.ready=true;this.canvas.dataset.webgl='ready';this.canvas.setAttribute('aria-label',`Interactive 3D ${this.area==='town'?'Lake Garda neighbourhood':this.area+' interior'}. Move with WASD or arrow keys, click to walk, drag to turn the camera, scroll to zoom, and press E to interact. Location buttons provide direct access.`);
   // Draw immediately: Safari can defer animation callbacks in a background window.
   this.setupGuidance();this.resize();this.tick(performance.now());this.feedback?.remove();this.feedback=null;this.renderer.setAnimationLoop(t=>this.tick(t));
  }catch(error){if(!this.destroyed)this.fail('The 3D environment could not start on this device. Enable WebGL 2 and hardware acceleration, or try a current browser. You can still use the location buttons, Workspace and Notebook to complete the case.');}
 }
 fail(message){this.ready=false;this.canvas.dataset.webgl='unavailable';this.renderer?.setAnimationLoop(null);if(!this.feedback){this.feedback=document.createElement('div');this.stage.append(this.feedback);}this.feedback.className='world-feedback world-failure';this.feedback.setAttribute('role','status');this.feedback.textContent=message;this.labels?.setAttribute('hidden','');if(this.prompt)this.prompt.hidden=true;}
 resize(){if(!this.renderer||this.destroyed||!this.stage)return;const w=this.stage.clientWidth,h=this.stage.clientHeight;if(w<1||h<1)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;transform:none;';}
 setControl(key,down){if(this.preview||this.paused)return;key=key.toLowerCase();if(down){this.keys.add(key);this.route=[];this.pendingTarget=null;}else this.keys.delete(key);}
 targetAt(e){if(!this.ready)return null;const r=this.canvas.getBoundingClientRect();this.pointerVector.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointerVector,this.camera);return this.raycaster.intersectObjects(this.proxies,false)[0]?.object.userData.target||null;}
 hover(e){this.hovered=this.targetAt(e);this.canvas.style.cursor=this.hovered?'pointer':'grab';}
 pointer(e){if(this.paused||!this.ready)return;const target=this.targetAt(e);if(target){this.select(target);return;}const hit=this.raycaster.intersectObject(this.floor)[0];if(hit){const goal={x:hit.point.x,z:hit.point.z};this.route=findRoute(this.area,this.position,goal);this.pendingTarget=null;}}
 select(target){if(this.paused||this.preview)return;this.keys.clear();this.pendingTarget=target;this.route=findRoute(this.area,this.position,target);if(Math.hypot(target.x-this.position.x,target.z-this.position.z)<2.6){this.route=[];this.activate(target);}}
 activate(target){this.pendingTarget=null;this.route=[];this.onTarget(target);}
 interact(){if(this.paused||this.preview)return;const target=nearestTarget(this.area,this.position,2.7);if(target)this.activate(target);}
 setupGuidance(){
  if(this.preview)return;const T=this.T;this.guideEnabled=true;this.guideMarkers=[];
  this.guidance=document.createElement('aside');this.guidance.className='world-guidance';this.guidance.setAttribute('aria-label','Optional navigation guide');
  this.guidance.innerHTML='<button type="button" class="guide-toggle" aria-expanded="true">Navigation · hide</button><canvas width="160" height="110" aria-label="Map showing your position and current destination"></canvas><p class="guide-destination"></p>';this.stage.append(this.guidance);
  this.guidance.querySelector('button').addEventListener('click',()=>{this.guideEnabled=!this.guideEnabled;this.guidance.querySelector('canvas').hidden=this.guidance.querySelector('p').hidden=!this.guideEnabled;this.guideMarkers.forEach(m=>m.visible=false);this.guidance.querySelector('button').textContent=this.guideEnabled?'Navigation · hide':'Navigation · show';this.guidance.querySelector('button').setAttribute('aria-expanded',String(this.guideEnabled));});
  for(let i=0;i<18;i++){const marker=new T.Mesh(new T.TorusGeometry(.14,.018,4,10),new T.MeshBasicMaterial({color:'#e6c98b',transparent:true,opacity:.7,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.visible=false;this.scene.add(marker);this.guideMarkers.push(marker);}
 }
 updateGuidance(){
  if(!this.guidance)return;this.guidance.hidden=this.paused;const c=this.guidance.querySelector('canvas'),label=this.guidance.querySelector('p');c.hidden=label.hidden=!this.guideEnabled;
  this.guideMarkers.forEach(m=>m.visible=false);if(!this.guideEnabled||this.paused)return;
  const target=SCENES[this.area].targets.find(t=>t.id===(this.recommended||(this.area==='town'?'hotel':'workspace')));if(!target)return;
  if(this.frames%45===0||this.guideTarget!==target){this.guideTarget=target;this.guideRoute=findRoute(this.area,this.position,target);}
  const route=this.guideRoute||[];let n=0;for(let i=1;i<route.length&&n<this.guideMarkers.length;i+=2){const p=route[i],m=this.guideMarkers[n++];m.position.set(p.x,.075+groundHeight(this.area,p.x,p.z),p.z);m.visible=true;}
  const distance=Math.hypot(target.x-this.position.x,target.z-this.position.z),bearing=Math.atan2(target.x-this.position.x,target.z-this.position.z)-this.yaw;const arrow=['↓','↘','→','↗','↑','↖','←','↙'][((Math.round(bearing/(Math.PI/4))%8)+8)%8];label.textContent=`${arrow} ${target.name} · ${Math.round(distance)} m`;
  const x=c.getContext('2d'),s=SCENES[this.area],[a,b,d,e]=s.bounds;const px=v=>8+(v-a)/(b-a)*144,pz=v=>8+(v-d)/(e-d)*94;x.fillStyle='#e3dfce';x.fillRect(0,0,160,110);x.fillStyle='#7a9696';if(this.area==='town')x.fillRect(0,0,160,8);x.fillStyle='#a59e8d';for(const o of s.obstacles){x.fillRect(px(o.x-o.w/2),pz(o.z-o.d/2),o.w/(b-a)*144,o.d/(e-d)*94);}x.strokeStyle='#ae8950';x.lineWidth=1.5;x.beginPath();x.moveTo(px(this.position.x),pz(this.position.z));for(const p of route)x.lineTo(px(p.x),pz(p.z));x.stroke();for(const [p,color] of [[target,'#9b7441'],[this.position,'#294c50']]){x.fillStyle=color;x.beginPath();x.arc(px(p.x),pz(p.z),3,0,Math.PI*2);x.fill();}
 }
 updateCamera(dt){
  const T=this.T,p=this.position;
  if(this.preview){this.camera.position.set(16,18,29);this.camera.lookAt(-13,4,-20);return;}
  const aim=new T.Vector3(p.x,1.05+groundHeight(this.area,p.x,p.z),p.z);const desired=new T.Vector3();
  const distance=this.mobile?Math.min(this.distance,17):this.distance;let selectedYaw=this.yaw;
  // Pick an unobstructed approach to the player instead of allowing a wall to hide them.
  const blockers=this.area==='town'?SCENES.town.obstacles.filter(o=>o.id.includes('building')):[];
  const boxes=blockers.map(o=>new T.Box3(new T.Vector3(o.x-o.w/2,0,o.z-o.d/2),new T.Vector3(o.x+o.w/2,o.id==='hotel-building'?12:7,o.z+o.d/2)));
  const visible=point=>{const direction=point.clone().sub(aim),length=direction.length(),ray=new T.Ray(aim,direction.normalize());return !boxes.some(box=>{const hit=ray.intersectBox(box,new T.Vector3());return hit && hit.distanceTo(aim)<length;});};
  const candidate=yaw=>desired.set(p.x+Math.sin(yaw)*distance,1.2+groundHeight(this.area,p.x,p.z)+distance*.38,p.z+Math.cos(yaw)*distance);
  candidate(selectedYaw);
  if(!visible(desired)){
   for(let i=1;i<=32;i++){const turn=Math.ceil(i/2)*Math.PI/16*(i%2?1:-1);candidate(this.yaw+turn);if(visible(desired)){selectedYaw=this.yaw+turn;break;}}
   // A steep approach is a last resort in a tight space between buildings.
   while(!visible(desired)&&desired.y<80)desired.y+=4;
   this.yaw=selectedYaw;
  }
  const smooth=this.cameraInitialized?1-Math.exp(-dt*7):1;this.camera.position.lerp(desired,smooth);this.cameraAim.lerp(aim,smooth);
  // Interpolation between two clear views can cross a roof or wall. Never render that obstructed intermediate view.
  if(!visible(this.camera.position)){this.camera.position.copy(desired);this.cameraAim.copy(aim);}
  this.camera.lookAt(this.cameraAim);this.cameraInitialized=true;
 }
 tick(time){
  if(this.destroyed||!this.ready)return;const dt=Math.min(.05,Math.max(.001,(time-this.last)/1000));this.last=time;this.elapsed+=dt;let moving=false;
  if(!this.preview&&!this.paused){
   let right=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
   let forward=Number(this.keys.has('w')||this.keys.has('arrowup'))-Number(this.keys.has('s')||this.keys.has('arrowdown'));
   let dx=right*Math.cos(this.yaw)-forward*Math.sin(this.yaw),dz=-right*Math.sin(this.yaw)-forward*Math.cos(this.yaw);
   if(!right&&!forward&&this.route.length){const next=this.route[0],gap=Math.hypot(next.x-this.position.x,next.z-this.position.z);if(gap<.18)this.route.shift();else{dx=(next.x-this.position.x)/gap;dz=(next.z-this.position.z)/gap;}}
   if(dx||dz){const speed=3.6*dt/Math.max(1,Math.hypot(dx,dz));const next=moveWithCollisions(this.area,this.position,dx*speed,dz*speed);moving=Math.hypot(next.x-this.position.x,next.z-this.position.z)>.001;this.position=next;if(moving){{const g=this.art.player.group,angle=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(angle-g.rotation.y),Math.cos(angle-g.rotation.y));g.rotation.y+=delta*Math.min(1,dt*12);}Object.assign(this.saved,fromWorld(next));this.onMove(false);}}
   if(this.pendingTarget&&Math.hypot(this.pendingTarget.x-this.position.x,this.pendingTarget.z-this.position.z)<2.2){this.activate(this.pendingTarget);if(this.destroyed)return;}
  }
  this.art.player.group.position.set(this.position.x,groundHeight(this.area,this.position.x,this.position.z),this.position.z);this.art.animate(this.elapsed,moving&&!this.reduced);this.updateCamera(dt);
  const near=nearestTarget(this.area,this.position,2.7);this.prompt.hidden=this.preview||this.paused||!near;if(near)this.prompt.textContent=`${this.mobile?'Tap':'E'} · ${near.kind==='person'?'Talk to ':near.kind==='entrance'?'Enter ':''}${near.name}`;
  this.labels.hidden=this.preview||this.paused;
  for(const {node,target} of this.labelNodes){const point=new this.T.Vector3(target.x,2.25+groundHeight(this.area,target.x,target.z),target.z).project(this.camera),distance=Math.hypot(target.x-this.position.x,target.z-this.position.z);const show=point.z<1 && point.z>-1 && Math.abs(point.x)<.94 && Math.abs(point.y)<.9 && (distance<(target.kind==='entrance'?32:10)||this.hovered===target||near===target);node.hidden=!show;node.style.left=`${(point.x*.5+.5)*100}%`;node.style.top=`${(-point.y*.5+.5)*100}%`;node.classList.toggle('near',near===target);}
  if(this.hovered||near){const t=this.hovered||near;this.ring.position.set(t.x,.07,t.z);this.ring.visible=!this.paused&&!this.preview;}else this.ring.visible=false;
  this.updateGuidance();this.renderer.render(this.scene,this.camera);this.frames++;this.canvas.dataset.drawCalls=String(this.renderer.info.render.calls);this.canvas.dataset.triangles=String(this.renderer.info.render.triangles);
 }
 destroy(){if(this.destroyed)return;this.destroyed=true;this.ready=false;this.keys.clear();this.observer?.disconnect();this.renderer?.setAnimationLoop(null);window.removeEventListener('keydown',this.keyDown);window.removeEventListener('keyup',this.keyUp);window.removeEventListener('blur',this.blur);for(const [name,fn] of [['pointerdown',this.pointerDown],['pointermove',this.pointerMove],['pointerup',this.pointerUp],['wheel',this.wheel],['contextmenu',this.contextMenu],['webglcontextlost',this.contextLost]])this.canvas.removeEventListener(name,fn);this.labels?.remove();this.feedback?.remove();this.prompt?.remove();this.art?.dispose();this.skyTexture?.dispose();this.guidance?.remove();for(const marker of this.guideMarkers||[]){marker.geometry.dispose();marker.material.dispose();}for(const o of [this.floor,this.ring,...(this.proxies||[])]){o?.geometry?.dispose();o?.material?.dispose();}this.renderer?.dispose();this.renderer?.forceContextLoss();if(!this.preview)this.onMove(true);}
}
export class Town3D extends InvestigationWorld {
 constructor(canvas,player,onVisit,onMove,onLocked,onStreet,options={}){super(canvas,player,{area:'town',onMove:force=>onMove(player,force),onTarget:t=>t.kind==='street'?onStreet(t.id):onVisit(t.id),...options});}
}
export class Interior3D extends InvestigationWorld {
 constructor(canvas,player,area,onTalk,onWorkspace,onExit,onMove,recommended){super(canvas,player,{area,onMove,onTarget:t=>t.kind==='person'?onTalk(t.id):t.kind==='workspace'?onWorkspace():onExit(),recommended});}
}
