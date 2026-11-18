import './no-paid-calls.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createGameServer} from '../server/server.js';
import {runtimeConfig} from '../server/runtime-config.js';
import {answerFreeQuestion} from '../public/free-agents.js';
const server=createGameServer({config:{...runtimeConfig(),mode:'offline'}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=process.env.WORLD3D_URL||`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROME_PATH?{executablePath:process.env.PLAYWRIGHT_CHROME_PATH}:process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{})});
await mkdir('test-artifacts',{recursive:true});const results=[];
const ready=async(page,id)=>{await page.waitForFunction(id=>{const c=document.querySelector(id);return c?.dataset.webgl==='ready' && c.scene3d?.frames>2;},id,{timeout:60000});};
try{
 for(const [width,height] of [[1440,900],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},...(width<760?{isMobile:true,hasTouch:true}:{}),reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.WORLD3D_URL)await page.route('**/api/actor',async route=>{const b=route.request().postDataJSON();await route.fulfill({contentType:'application/json',body:JSON.stringify({...answerFreeQuestion(b.personId,b.question),source:'mock'})});});
  await page.goto(url,{waitUntil:'domcontentloaded'});await ready(page,'#entry-canvas');
  assert.equal(await page.locator('#entry-canvas').evaluate(c=>c.scene3d.camera.isPerspectiveCamera),true);
  await page.screenshot({path:`test-artifacts/3d-entry-${width}.png`});await page.locator('.entry-start').click();await ready(page,'#town-canvas');
  const metrics=await page.locator('#town-canvas').evaluate(c=>({triangles:Number(c.dataset.triangles),calls:Number(c.dataset.drawCalls),perspective:c.scene3d.camera.isPerspectiveCamera,webgl2:c.getContext('webgl2') instanceof WebGL2RenderingContext,meshes:c.scene3d.scene.children.filter(o=>o.isMesh).length}));
  assert.ok(metrics.perspective&&metrics.webgl2&&metrics.triangles>20000);assert.ok(metrics.calls<200,'Keep draw-call budget suitable for student devices');
  await page.waitForFunction(()=>{const h=document.querySelector('.header').getBoundingClientRect(),s=document.querySelector('.town-stage').getBoundingClientRect();return Math.abs(s.y-h.height)<2 && Math.abs(s.bottom-innerHeight)<2 && Math.abs(s.width-innerWidth)<2;},null,{timeout:5000});
  const header=await page.locator('.header').boundingBox(),stage=await page.locator('.town-stage').boundingBox();assert.ok(Math.abs(stage.y-header.height)<2 && Math.abs(stage.y+stage.height-height)<2 && Math.abs(stage.width-width)<2,JSON.stringify({width,height,header,stage,viewport:await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollY,styles:['.app','main','.game-shell','.town-stage'].map(s=>{let e=document.querySelector(s),c=getComputedStyle(e);return{selector:s,rect:e.getBoundingClientRect().toJSON(),height:c.height,position:c.position,flex:c.flex,display:c.display}})}))}));
  const cameraAudit=await page.locator('#town-canvas').evaluate(async c=>{
   const {SCENES,isWalkable}=await import('/world-layout.js'),w=c.scene3d,T=w.T,old={position:{...w.position},yaw:w.yaw};let checked=0,blocked=0;
   const boxes=SCENES.town.obstacles.filter(o=>o.id.includes('building')).map(o=>new T.Box3(new T.Vector3(o.x-o.w/2,0,o.z-o.d/2),new T.Vector3(o.x+o.w/2,o.id==='hotel-building'?12:7,o.z+o.d/2)));
   for(let x=-43.5;x<44;x+=2.5)for(let z=-25.5;z<26;z+=2.5){if(!isWalkable('town',x,z))continue;for(const yaw of [0,1.6,3.2,4.8]){w.position={x,z};w.yaw=yaw;w.updateCamera(.016);const aim=new T.Vector3(x,1.05,z),delta=w.camera.position.clone().sub(aim),length=delta.length(),ray=new T.Ray(aim,delta.normalize());checked++;if(boxes.some(box=>{const hit=ray.intersectBox(box,new T.Vector3());return hit&&hit.distanceTo(aim)<length;}))blocked++;}}
   w.position=old.position;w.yaw=old.yaw;w.cameraInitialized=false;w.updateCamera(1);return{checked,blocked};
  });assert.ok(cameraAudit.checked>2000);assert.equal(cameraAudit.blocked,0,'Camera smoothing must never put a building between the camera and player');
  await page.locator('.guide-toggle').click();assert.equal(await page.locator('.world-guidance canvas').isVisible(),false,'Navigation map must be optional');await page.locator('.guide-toggle').click();assert.equal(await page.locator('.world-guidance canvas').isVisible(),true);
  const start=await page.locator('#town-canvas').evaluate(c=>({...c.scene3d.position}));
  if(width>760){await page.locator('#town-canvas').focus();await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');}
  else{const control=await page.locator('[data-move="arrowup"]').boundingBox();const touch=await context.newCDPSession(page);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:control.x+control.width/2,y:control.y+control.height/2}]});await page.waitForTimeout(650);await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();}
  const end=await page.locator('#town-canvas').evaluate(c=>({...c.scene3d.position}));assert.ok(Math.hypot(end.x-start.x,end.z-start.z)>.4,`${width}: keyboard/touch must move the actual character`);
  if(width>760){
   const before=await page.locator('#town-canvas').evaluate(c=>c.scene3d.yaw);await page.mouse.move(width*.7,height*.55);await page.mouse.down();await page.mouse.move(width*.7+100,height*.55,{steps:8});await page.mouse.up();assert.ok(Math.abs(await page.locator('#town-canvas').evaluate(c=>c.scene3d.yaw)-before)>.1,'Dragging must rotate the real camera');
  }
  await page.screenshot({path:`test-artifacts/3d-town-${width}.png`});
  await page.locator('.district-links [data-visit="hotel"]').click();await ready(page,'#room-canvas');
  // Exercise the actual route follower and proximity trigger, rather than only the shortcut buttons.
  await page.locator('#room-canvas').evaluate(async c=>{const {SCENES}=await import('/world-layout.js');window.__prior3dWorld=c.scene3d;c.scene3d.select(SCENES.hotel.targets.find(t=>t.id==='lucia'));});
  await page.locator('#free-question-input').waitFor({timeout:25000});
  assert.equal(await page.locator('#room-canvas').evaluate(c=>c.scene3d===window.__prior3dWorld),true,'Opening a conversation must reuse the real scene and graphics context');
  await page.locator('#free-question-input').fill('What is your room price and bookings?');await page.locator('.free-question button').click();await page.getByText(/69 rooms requested|69 rooms were requested/).first().waitFor();
  await page.keyboard.press('Escape');await ready(page,'#room-canvas');await page.waitForFunction(()=>document.querySelector('#room-canvas').scene3d.recommended==='marco');await page.screenshot({path:`test-artifacts/3d-hotel-${width}.png`});
  await page.locator('.tabs [data-action="workspace"]').click();await page.locator('[name="intercept"]').fill('262');await page.locator('[name="slope"]').fill('-1.3333');await page.locator('[data-form="case-hotel-demand"] button').click();await page.locator('[data-form="case-hotel-mr"]').waitFor();
  await page.reload();await ready(page,'#entry-canvas');assert.match(await page.locator('.entry-resume').innerText(),/saved/);await page.locator('.entry-start').click();await page.locator('[data-form="case-hotel-mr"]').waitFor();await page.locator('[aria-label="Close workspace"]').click();await ready(page,'#room-canvas');
  for(const area of ['bakery','winery']){await page.locator('.tabs [data-view="town"]').click();await ready(page,'#town-canvas');await page.locator(`.district-links [data-visit="${area}"]`).click();await ready(page,'#room-canvas');assert.equal(await page.locator('#room-canvas').evaluate(c=>c.scene3d.area),area);await page.screenshot({path:`test-artifacts/3d-${area}-${width}.png`});}
  assert.deepEqual(errors,[]);results.push({viewport:`${width}x${height}`,metrics,cameraAudit,passed:true});await context.close();console.log(`${width}px actual 3D render, movement, route interaction, scene reuse, saved work and optional rooms passed`);
 }
 const unsupported=await browser.newContext();await unsupported.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};});
 const p=await unsupported.newPage();await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('#entry-canvas')?.dataset.webgl==='unavailable');await p.locator('.entry-start').click();await p.waitForFunction(()=>document.querySelector('#town-canvas')?.dataset.webgl==='unavailable');await p.getByText(/Enable WebGL 2/).waitFor();await p.locator('.tabs [data-action="workspace"]').click();await p.locator('[name="intercept"]').waitFor();await p.screenshot({path:'test-artifacts/3d-unsupported-workspace.png'});await unsupported.close();
 results.push({webglUnavailable:'Helpful message and accessible workspace verified',passed:true});
 await writeFile('test-artifacts/3d-browser-verification.json',JSON.stringify({timestamp:new Date().toISOString(),url,paidCalls:0,results,passed:true},null,2)+'\n');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
