import {SCENES,toWorld,fromWorld,safePosition,moveWithCollisions,nearestTarget,findRoute} from './world-layout.js';
let enginePromise;
const engine=()=>enginePromise||=(Promise.all([import('./vendor/three-bundle.js'),import('./world-art.js')]).catch(error=>{enginePromise=null;throw error;}));
const editing=target=>target instanceof Element && Boolean(target.closest('input,textarea,select,button,a,summary'));
export class InvestigationWorld {
 constructor(canvas,saved,{area='town',onTarget=()=>{},onMove=()=>{},preview=false,recommended=null}={}){
  this.canvas=canvas;this.saved=saved;this.area=area;this.onTarget=onTarget;this.onMove=onMove;this.preview=preview;this.recommended=recommended;
  this.keys=new Set();this.route=[];this.pendingTarget=null;this._paused=false;this.destroyed=false;this.ready=false;this.yaw=.75;this.distance=preview?35:20;this.elapsed=0;this.frames=0;this.last=performance.now();
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
  if(this.prompt && this.prompt.parentElement!==this.stage)this.stage.append(this.prompt);
  this.observer?.disconnect();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.stage);this.resize();
 }
 attach(){this.mount();}
 get paused(){return this._paused;}
 set paused(value){this._paused=Boolean(value);if(value){this.keys?.clear();this.drag=null;}if(this.prompt)this.prompt.hidden=this.preview||this._paused;}
 async initialize(){
  try{
   const [T,art]=await engine();if(this.destroyed)return;this.T=T;
   const gl=this.canvas.getContext('webgl2',{antialias:!this.mobile,alpha:false,powerPreference:'default'});if(!gl)throw Error('WebGL 2 is unavailable');
   this.renderer=new T.WebGLRenderer({canvas:this.canvas,context:gl,antialias:!this.mobile});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.mobile?1.25:1.6));this.renderer.shadowMap.enabled=!this.mobile;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
   this.scene=new T.Scene();this.scene.background=new T.Color(this.area==='town'?'#cedcdf':'#e8e6dc');this.scene.fog=new T.Fog(this.area==='town'?'#cedcdf':'#e8e6dc',this.area==='town'?65:45,145);
   this.camera=new T.PerspectiveCamera(48,1,.12,210);this.cameraPosition=new T.Vector3();this.cameraAim=new T.Vector3();this.cameraInitialized=false;
   this.scene.add(new T.HemisphereLight('#fff7e6','#7d8b7d',2.4));const sun=new T.DirectionalLight('#fff0d3',3.2);sun.position.set(-25,45,25);sun.castShadow=!this.mobile;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.far=110;sun.shadow.normalBias=.045;this.scene.add(sun);sun.target.position.set(0,0,0);this.scene.add(sun.target);
   this.art=art.createWorldArt(this.scene,this.area,{mobile:this.mobile});this.raycaster=new T.Raycaster();this.pointerVector=new T.Vector2();this.proxies=[];
   this.floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshBasicMaterial({visible:false}));this.floor.rotation.x=-Math.PI/2;this.floor.position.y=.04;this.scene.add(this.floor);this.floor.updateMatrixWorld();
   this.labels=document.createElement('div');this.labels.className='world-labels';this.stage.append(this.labels);
   for(const target of SCENES[this.area].targets){
    const proxy=new T.Mesh(new T.CylinderGeometry(target.kind==='entrance'?1.7:.6,target.kind==='entrance'?1.7:.6,2.3,8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));proxy.position.set(target.x,1.15,target.z);proxy.userData.target=target;this.scene.add(proxy);this.proxies.push(proxy);
    const node=document.createElement('button');node.type='button';node.className='world-label';node.textContent=target.name;node.setAttribute('aria-label',`${target.name}${target.role?' · '+target.role:''}`);node.addEventListener('click',()=>this.select(target));this.labels.append(node);this.labelNodes.push({node,target});
   }
   this.ring=new T.Mesh(new T.TorusGeometry(.5,.018,6,28),new T.MeshBasicMaterial({color:'#b09f72'}));this.ring.rotation.x=-Math.PI/2;this.ring.position.y=.07;this.ring.visible=false;this.scene.add(this.ring);
   this.prompt=document.createElement('button');this.prompt.type='button';this.prompt.className='world-prompt';this.prompt.addEventListener('click',()=>this.interact());this.stage.append(this.prompt);
   this.ready=true;this.canvas.dataset.webgl='ready';this.canvas.setAttribute('aria-label',`Interactive 3D ${this.area==='town'?'Italian coastal district':this.area+' interior'}. Move with WASD or arrow keys, click to walk, drag to turn the camera, scroll to zoom, and press E to interact. Location buttons provide direct access.`);
   // Draw immediately: Safari can defer animation callbacks in a background window.
   this.resize();this.tick(performance.now());this.feedback?.remove();this.feedback=null;this.renderer.setAnimationLoop(t=>this.tick(t));
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
 updateCamera(dt){
  const T=this.T,p=this.position;
  if(this.preview){this.camera.position.set(25,23,30);this.camera.lookAt(-9,3,-9);return;}
  const aim=new T.Vector3(p.x,1.05,p.z);const desired=new T.Vector3();
  const distance=this.mobile?Math.min(this.distance,17):this.distance;let selectedYaw=this.yaw;
  // Pick an unobstructed approach to the player instead of allowing a wall to hide them.
  const blockers=this.area==='town'?SCENES.town.obstacles.filter(o=>o.id.includes('building')):[];
  const clear=yaw=>{
   desired.set(p.x+Math.sin(yaw)*distance,1.2+distance*.68,p.z+Math.cos(yaw)*distance);
   const direction=desired.clone().sub(aim),length=direction.length();const ray=new T.Ray(aim,direction.normalize());
   return !blockers.some(o=>{const box=new T.Box3(new T.Vector3(o.x-o.w/2,0,o.z-o.d/2),new T.Vector3(o.x+o.w/2,o.id==='hotel-building'?12:7,o.z+o.d/2));const hit=ray.intersectBox(box,new T.Vector3());return hit && hit.distanceTo(aim)<length;});
  };
  if(!clear(selectedYaw)){for(const turn of [.5,-.5,1,-1,1.6,-1.6,Math.PI])if(clear(this.yaw+turn)){selectedYaw=this.yaw+turn;break;}this.yaw=selectedYaw;}
  clear(selectedYaw);
  const smooth=this.cameraInitialized?1-Math.exp(-dt*7):1;this.camera.position.lerp(desired,smooth);this.cameraAim.lerp(aim,smooth);this.camera.lookAt(this.cameraAim);this.cameraInitialized=true;
 }
 tick(time){
  if(this.destroyed||!this.ready)return;const dt=Math.min(.05,Math.max(.001,(time-this.last)/1000));this.last=time;this.elapsed+=dt;let moving=false;
  if(!this.preview&&!this.paused){
   let right=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
   let forward=Number(this.keys.has('w')||this.keys.has('arrowup'))-Number(this.keys.has('s')||this.keys.has('arrowdown'));
   let dx=right*Math.cos(this.yaw)-forward*Math.sin(this.yaw),dz=-right*Math.sin(this.yaw)-forward*Math.cos(this.yaw);
   if(!right&&!forward&&this.route.length){const next=this.route[0],gap=Math.hypot(next.x-this.position.x,next.z-this.position.z);if(gap<.18)this.route.shift();else{dx=(next.x-this.position.x)/gap;dz=(next.z-this.position.z)/gap;}}
   if(dx||dz){const speed=3.6*dt/Math.max(1,Math.hypot(dx,dz));const next=moveWithCollisions(this.area,this.position,dx*speed,dz*speed);moving=Math.hypot(next.x-this.position.x,next.z-this.position.z)>.001;this.position=next;if(moving){this.art.player.group.rotation.y=Math.atan2(dx,dz);Object.assign(this.saved,fromWorld(next));this.onMove(false);}}
   if(this.pendingTarget&&Math.hypot(this.pendingTarget.x-this.position.x,this.pendingTarget.z-this.position.z)<2.2){this.activate(this.pendingTarget);if(this.destroyed)return;}
  }
  this.art.player.group.position.set(this.position.x,0,this.position.z);this.art.animate(this.elapsed,moving&&!this.reduced);this.updateCamera(dt);
  const near=nearestTarget(this.area,this.position,2.7);this.prompt.hidden=this.preview||this.paused||!near;if(near)this.prompt.textContent=`${this.mobile?'Tap':'E'} · ${near.kind==='person'?'Talk to ':near.kind==='entrance'?'Enter ':''}${near.name}`;
  this.labels.hidden=this.preview||this.paused;
  for(const {node,target} of this.labelNodes){const point=new this.T.Vector3(target.x,2.25,target.z).project(this.camera),distance=Math.hypot(target.x-this.position.x,target.z-this.position.z);const show=point.z<1 && point.z>-1 && Math.abs(point.x)<.94 && Math.abs(point.y)<.9 && (distance<(target.kind==='entrance'?32:10)||this.hovered===target||near===target);node.hidden=!show;node.style.left=`${(point.x*.5+.5)*100}%`;node.style.top=`${(-point.y*.5+.5)*100}%`;node.classList.toggle('near',near===target);}
  if(this.hovered||near){const t=this.hovered||near;this.ring.position.set(t.x,.07,t.z);this.ring.visible=!this.paused&&!this.preview;}else this.ring.visible=false;
  this.renderer.render(this.scene,this.camera);this.frames++;this.canvas.dataset.drawCalls=String(this.renderer.info.render.calls);this.canvas.dataset.triangles=String(this.renderer.info.render.triangles);
 }
 destroy(){if(this.destroyed)return;this.destroyed=true;this.ready=false;this.keys.clear();this.observer?.disconnect();this.renderer?.setAnimationLoop(null);window.removeEventListener('keydown',this.keyDown);window.removeEventListener('keyup',this.keyUp);window.removeEventListener('blur',this.blur);for(const [name,fn] of [['pointerdown',this.pointerDown],['pointermove',this.pointerMove],['pointerup',this.pointerUp],['wheel',this.wheel],['contextmenu',this.contextMenu],['webglcontextlost',this.contextLost]])this.canvas.removeEventListener(name,fn);this.labels?.remove();this.feedback?.remove();this.prompt?.remove();this.art?.dispose();for(const o of [this.floor,this.ring,...(this.proxies||[])]){o?.geometry?.dispose();o?.material?.dispose();}this.renderer?.dispose();this.renderer?.forceContextLoss();if(!this.preview)this.onMove(true);}
}
export class Town3D extends InvestigationWorld {
 constructor(canvas,player,onVisit,onMove,onLocked,onStreet,options={}){super(canvas,player,{area:'town',onMove:force=>onMove(player,force),onTarget:t=>t.kind==='street'?onStreet(t.id):onVisit(t.id),...options});}
}
export class Interior3D extends InvestigationWorld {
 constructor(canvas,player,area,onTalk,onWorkspace,onExit,onMove,recommended){super(canvas,player,{area,onMove,onTarget:t=>t.kind==='person'?onTalk(t.id):t.kind==='workspace'?onWorkspace():onExit(),recommended});}
}
