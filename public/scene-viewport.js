// Fill the playable area without stretching the artwork. The camera follows
// the player on narrow screens; pointer coordinates still use the canvas bounds.
export function fitSceneViewport(canvas, player, worldWidth, worldHeight) {
  const stage = canvas.parentElement;
  if (!stage?.matches('.in-game .town-stage')) return;
  const width = stage.clientWidth, height = stage.clientHeight;
  if (!width || !height) return;
  const scale = Math.max(width / worldWidth, height / worldHeight);
  const sceneWidth = worldWidth * scale, sceneHeight = worldHeight * scale;
  const left = Math.min(0, Math.max(width - sceneWidth, width / 2 - player.x * scale));
  const top = Math.min(0, Math.max(height - sceneHeight, height / 2 - player.y * scale));
  Object.assign(canvas.style, {width:`${sceneWidth}px`, height:`${sceneHeight}px`,left:`${left}px`,top:`${top}px`,transform:'none'});
}

// Shared restrained illustration style for people and unobtrusive map captions.
export function sceneCaption(c, x, y, text, accent = false) {
  c.save();
  c.font = `${accent ? 600 : 500} 8px system-ui, sans-serif`;
  const width = Math.ceil(c.measureText(text).width) + 13;
  c.fillStyle = accent ? '#273b3bee' : '#fcfbf4ed';
  c.strokeStyle = accent ? '#273b3b' : '#ccd1c5';
  c.lineWidth = .6;
  c.beginPath();c.roundRect(x-width/2,y-10,width,15,3);c.fill();c.stroke();
  c.fillStyle = accent ? '#ffffff' : '#283b3d';c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y-2);
  c.restore();
}

export function drawScenePerson(c, x, y, shirt, kind = '', moving = false, frame = 0) {
  c.save();c.translate(x,y);c.lineCap='round';c.lineJoin='round';
  const step=moving ? Math.sin(frame*.18)*1.7 : 0;
  const skin = kind === 'marco' || kind === 'street' ? '#b88969' : '#d0ac8b';
  c.fillStyle='#1a2d2c35';c.beginPath();c.ellipse(0,6,7,2.3,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#333d43';c.lineWidth=3.2;
  for(const side of [-1,1]){c.beginPath();c.moveTo(side*2,-6);c.lineTo(side*2.4,4+side*step);c.stroke();}
  c.strokeStyle='#242c32';c.lineWidth=2;c.beginPath();c.moveTo(-4,6-step);c.lineTo(-1,6-step);c.moveTo(1,6+step);c.lineTo(4,6+step);c.stroke();
  c.strokeStyle=shirt;c.lineWidth=3;
  for(const side of [-1,1]){c.beginPath();c.moveTo(side*4,-19);c.lineTo(side*5.4,-9-side*step*.5);c.stroke();}
  c.fillStyle=skin;for(const side of [-1,1]){c.beginPath();c.ellipse(side*5.5,-7-side*step*.5,1.2,1.8,0,0,Math.PI*2);c.fill();}
  c.fillStyle=shirt;c.beginPath();c.moveTo(-3,-22);c.quadraticCurveTo(0,-24,3,-22);c.lineTo(4.2,-8);c.quadraticCurveTo(0,-6,-4.2,-8);c.closePath();c.fill();
  c.fillStyle='#ecece4';c.beginPath();c.moveTo(-1.8,-22);c.lineTo(1.8,-22);c.lineTo(0,-16);c.closePath();c.fill();
  c.fillStyle=skin;c.fillRect(-1.2,-25,2.4,3.8);c.beginPath();c.ellipse(0,-27.4,2.8,3.5,0,0,Math.PI*2);c.fill();
  c.fillStyle=kind==='elena'||kind==='hotel'?'#51473e':'#393a36';c.beginPath();c.ellipse(0,-29,3,2.3,0,Math.PI,Math.PI*2);c.lineTo(2.6,-26.5);c.lineTo(1.7,-29);c.closePath();c.fill();
  if(kind==='elena'){c.fillStyle='#b9b39f';c.fillRect(3,-17,3,6);}
  c.restore();
}
