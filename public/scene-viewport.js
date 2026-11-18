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
