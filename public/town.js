const WIDTH = 900, HEIGHT = 540, TILE = 20;
const BUILDINGS = [
  { id: 'hotel', x: 72, y: 42, w: 376, h: 195, label: 'HOTEL SOLE NASCENTE', topic: 'PRICING · DEMAND · ELASTICITY · TR / MR', tone: '#f0d5a8', roof: '#b65c4d' },
  { id: 'bakery', x: 55, y: 305, w: 225, h: 142, label: 'MARTA’S BAKERY', topic: 'PRODUCTION · MARGINAL PRODUCT', tone: '#f2c894', roof: '#b87a4b' },
  { id: 'winery', x: 678, y: 38, w: 211, h: 130, label: 'SOLE VINEYARD', topic: 'WINE SUPPLY · PURCHASING', tone: '#e6c7c5', roof: '#805e75' }
];
const PEOPLE = [
  { id: 'hotel', x: 250, y: 265, name: 'LUCIA', shirt: '#36596b' },
  { id: 'bakery', x: 212, y: 471, name: 'MARTA', shirt: '#cf874b' },
  { id: 'winery', x: 776, y: 212, name: 'SOFIA', shirt: '#765775' }
];
const ART_HITBOXES = [
  { id: 'hotel', x: 60, y: 32, w: 405, h: 215 },
  { id: 'bakery', x: 48, y: 298, w: 244, h: 165 },
  { id: 'winery', x: 666, y: 28, w: 230, h: 160 }
];
const TREES = [[27, 214], [271, 207], [615, 214], [864, 217], [29, 390], [866, 390], [333, 330], [565, 330], [55, 463], [850, 465], [362, 440], [536, 440]];

export class Town {
  constructor(canvas, player, onVisit, onMove, onLocked) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = player;
    this.onVisit = onVisit;
    this.onMove = onMove;
    this.onLocked = onLocked;
    this.keys = new Set();
    this.path = [];
    this.paused = false;
    this.running = true;
    this.last = performance.now();
    this.frameCount = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.background = new Image();
    this.background.src = 'assets/italian-coast-map-v2.png';
    this.pixelMap = document.createElement('canvas');
    this.pixelMap.width = 300;
    this.pixelMap.height = 180;
    this.pixelReady = false;
    this.keyDown = e => {
      if (this.paused) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      const key = e.key.toLowerCase();
      this.keys.add(key);
      if (key === 'e' || key === 'enter') this.interact();
    };
    this.keyUp = e => { this.keys.delete(e.key.toLowerCase()); this.onMove(this.player, true); };
    this.blur = () => { this.keys.clear(); this.onMove(this.player, true); };
    this.click = e => this.pointer(e);
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.blur);
    canvas.addEventListener('pointerdown', this.click);
    this.loop = time => this.tick(time);
    this.raf = requestAnimationFrame(this.loop);
  }
  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.onMove(this.player, true);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('blur', this.blur);
    this.canvas.removeEventListener('pointerdown', this.click);
  }
  setControl(key, down) { if (down && !this.paused) this.keys.add(key); else if (!down) { this.keys.delete(key); this.onMove(this.player, true); } }
  nearest() { return PEOPLE.find(p => Math.hypot(this.player.x - p.x, this.player.y - p.y) < 54); }
  interact() { if (this.paused) return; const person = this.nearest(); if (person) this.onVisit(person.id); }
  pointer(e) {
    if (this.paused) return;
    const rect = this.canvas.getBoundingClientRect();
    const cover = getComputedStyle(this.canvas).objectFit === 'cover';
    const scale = cover ? Math.max(rect.width / WIDTH, rect.height / HEIGHT) : rect.width / WIDTH;
    const offsetX = cover ? (rect.width - WIDTH * scale) / 2 : 0;
    const offsetY = cover ? (rect.height - HEIGHT * scale) / 2 : 0;
    const x = (e.clientX - rect.left - offsetX) / scale;
    const y = (e.clientY - rect.top - offsetY) / scale;
    const person = PEOPLE.find(p => Math.hypot(x - p.x, y - p.y) < 38);
    if (person) { this.onVisit(person.id); return; }
    const hitboxes = this.background.complete && this.background.naturalWidth ? ART_HITBOXES : BUILDINGS;
    const building = hitboxes.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    if (building && !building.future) { this.onVisit(building.id); return; }
    if (building?.future) { this.onLocked(building.label); return; }
    this.path = this.findPath(x, y);
  }
  blocked(x, y) {
    if (x < 15 || x > WIDTH - 15 || y < 15 || y > HEIGHT - 17) return true;
    return BUILDINGS.some(b => x > b.x - 10 && x < b.x + b.w + 10 && y > b.y - 8 && y < b.y + b.h + 6);
  }
  findPath(x, y) {
    const cols = WIDTH / TILE, rows = HEIGHT / TILE;
    const id = (cx, cy) => cy * cols + cx;
    const from = [Math.floor(this.player.x / TILE), Math.floor(this.player.y / TILE)];
    const to = [Math.floor(x / TILE), Math.floor(y / TILE)];
    const queue = [from], previous = new Map([[id(...from), null]]);
    let goal = id(...to);
    for (let head = 0; head < queue.length; head++) {
      const [cx, cy] = queue[head];
      if (id(cx, cy) === goal) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, key = id(nx, ny);
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || previous.has(key) || this.blocked(nx * TILE + 10, ny * TILE + 10)) continue;
        previous.set(key, id(cx, cy)); queue.push([nx, ny]);
      }
    }
    if (!previous.has(goal)) return [];
    const route = [];
    while (goal !== null) { route.push({ x: goal % cols * TILE + 10, y: Math.floor(goal / cols) * TILE + 10 }); goal = previous.get(goal); }
    return route.reverse().slice(1);
  }
  tick(time) {
    if (!this.running) return;
    const dt = Math.min((time - this.last) / 1000, .04); this.last = time;
    if (this.paused) { this.draw(); this.raf = requestAnimationFrame(this.loop); return; }
    const left = this.keys.has('a') || this.keys.has('arrowleft');
    const right = this.keys.has('d') || this.keys.has('arrowright');
    const up = this.keys.has('w') || this.keys.has('arrowup');
    const down = this.keys.has('s') || this.keys.has('arrowdown');
    let dx = Number(right) - Number(left), dy = Number(down) - Number(up);
    if (dx || dy) this.path = [];
    else if (this.path.length) {
      const next = this.path[0], distance = Math.hypot(next.x - this.player.x, next.y - this.player.y);
      if (distance < 5) this.path.shift();
      else { dx = (next.x - this.player.x) / distance; dy = (next.y - this.player.y) / distance; }
    }
    const length = Math.hypot(dx, dy) || 1, speed = 175 * dt;
    const nx = this.player.x + dx / length * speed, ny = this.player.y + dy / length * speed;
    if (!this.blocked(nx, this.player.y)) this.player.x = nx;
    if (!this.blocked(this.player.x, ny)) this.player.y = ny;
    if (dx || dy) this.onMove(this.player);
    this.frameCount++;
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }
  draw() {
    const c = this.ctx; c.imageSmoothingEnabled = false;
    const rect = (x, y, w, h, color) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); };
    const label = (text, x, y, size = 12, color = '#244750') => { c.fillStyle = color; c.textAlign = 'center'; c.font = `bold ${size}px monospace`; c.fillText(text, x, y); };
    if (this.background.complete && this.background.naturalWidth) {
      if (!this.pixelReady) {
        const pixels = this.pixelMap.getContext('2d');
        pixels.imageSmoothingEnabled = false;
        pixels.drawImage(this.background, 0, 0, this.background.naturalWidth, this.background.naturalHeight, 0, 0, 300, 180);
        this.pixelReady = true;
      }
      c.drawImage(this.pixelMap, 0, 0, WIDTH, HEIGHT);
      for (const [text, topic, x, y, tone] of [
        ['HOTEL SOLE NASCENTE', 'PRICING · DEMAND · ELASTICITY · TR / MR', 250, 168, '#24464e'],
        ['MARTA’S BAKERY', 'PRODUCTION · MARGINAL PRODUCT', 167, 297, '#744934'],
        ['SOLE VINEYARD', 'WINE SUPPLY · PURCHASING', 780, 118, '#58445f']
      ]) {
        const width = Math.max(text.length * 7 + 18, topic.length * 6 + 18);
        rect(x - width / 2, y - 15, width, 35, tone);
        label(text, x, y, 11, '#fff3d4');
        label(topic, x, y + 14, 9, '#f3dbac');
      }
      for (const p of PEOPLE) this.person(c, p.x, p.y, p.shirt, p.name, false, p.id);
      this.person(c, this.player.x, this.player.y, this.player.color, 'YOU', true);
      const nearby = this.nearest();
      if (nearby) { rect(nearby.x - 28, nearby.y - 68, 56, 20, '#214750'); label('E · TALK', nearby.x, nearby.y - 54, 10, '#fff4d0'); }
      return;
    }
    rect(0, 0, WIDTH, HEIGHT, '#acc393');
    for (let i = 0; i < 330; i++) { const x = i * 173 % WIDTH, y = 56 + i * 97 % (HEIGHT - 56); rect(x, y, 3, 3, i % 3 ? '#96b67d' : '#c8d2a0'); }
    rect(0, 0, WIDTH, 57, '#5fa9b5');
    for (let x = 0; x < WIDTH; x += 69) { rect(x + 8, 15 + x % 14, 32, 3, '#a8d9d1'); rect(x + 40, 39 - x % 9, 19, 2, '#d0e8dc'); }
    rect(0, 53, WIDTH, 10, '#e2d1b2'); rect(0, 60, WIDTH, 3, '#b58d73');
    // Pale stone roads and brick edging frame the hotel courtyard.
    rect(0, 234, WIDTH, 62, '#b4b2ac'); rect(399, 219, 102, 321, '#ead4bd');
    rect(269, 287, 54, 221, '#ead4bd'); rect(581, 287, 54, 221, '#ead4bd');
    rect(0, 434, WIDTH, 76, '#d9c4b4');
    for (let y = 300; y < HEIGHT; y += 18) for (let x = 0; x < WIDTH; x += 34) {
      if ((x > 396 && x < 503) || (y > 433 && y < 511)) rect(x + (y % 3) * 2, y, 26, 2, '#c6a994');
    }
    for (let x = 12; x < WIDTH; x += 64) { rect(x, 264, 29, 3, '#e9e4d8'); rect(x + 11, 471, 27, 2, '#f7e9d9'); }
    for (let y = 244; y < HEIGHT; y += 58) rect(449, y, 3, 21, '#f8e8d0');
    for (const x of [304, 596]) for (let i = 0; i < 6; i++) rect(x - 28 + i * 9, 241, 6, 47, '#f8f1e3');
    for (let x = 0; x < WIDTH; x += 30) { rect(x, 232, 22, 3, '#a88f7d'); rect(x, 507, 22, 3, '#aa8b77'); }
    // Piazza fountain, lemon planters and a parked scooter.
    rect(360, 304, 180, 112, '#85af79'); rect(364, 308, 172, 104, '#9bc789');
    c.fillStyle = '#d6c9ab'; c.beginPath(); c.ellipse(451, 357, 69, 38, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4697a6'; c.beginPath(); c.ellipse(451, 355, 61, 32, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#9ad0d2'; c.beginPath(); c.ellipse(451, 350, 50, 22, 0, 0, Math.PI * 2); c.fill();
    rect(443, 332, 15, 20, '#f1d6aa'); rect(437, 328, 27, 6, '#c8aa8e');
    for (const [x, y] of [[379, 324], [523, 325], [373, 396], [527, 397]]) {
      rect(x - 5, y - 4, 10, 8, '#b8795d'); rect(x - 7, y - 10, 14, 7, '#508d62');
      rect(x - 2, y - 12, 3, 3, '#e5b55f'); rect(x + 4, y - 11, 3, 3, '#e5b55f');
    }
    rect(554, 258, 31, 6, '#447987'); rect(559, 252, 17, 6, '#e8bf73');
    rect(558, 264, 7, 4, '#263c45'); rect(577, 264, 7, 4, '#263c45');
    for (const [x, y] of TREES) this.tree(c, x, y);
    for (const b of BUILDINGS) this.building(c, b);
    for (const p of PEOPLE) this.person(c, p.x, p.y, p.shirt, p.name, false, p.id);
    this.person(c, this.player.x, this.player.y, this.player.color, 'YOU', true);
    const nearby = this.nearest();
    if (nearby) { rect(nearby.x - 28, nearby.y - 68, 56, 20, '#214750'); label('E · TALK', nearby.x, nearby.y - 54, 10, '#fff4d0'); }
    label('RIVIERA DEL SOLE', 450, 530, 12, '#55786c');
  }
  tree(c, x, y) {
    c.fillStyle = '#75634e'; c.fillRect(x - 3, y - 3, 6, 18);
    c.fillStyle = '#2f6654'; c.fillRect(x - 10, y - 27, 20, 34);
    c.fillStyle = '#428462'; c.fillRect(x - 8, y - 43, 16, 28);
    c.fillStyle = '#5c986a'; c.fillRect(x - 5, y - 53, 10, 18);
    c.fillStyle = '#7cad74'; c.fillRect(x - 3, y - 56, 6, 7);
  }
  building(c, b) {
    c.fillStyle = '#455d5877'; c.fillRect(b.x + 9, b.y + 12, b.w, b.h);
    c.fillStyle = b.tone; c.fillRect(b.x, b.y + 20, b.w, b.h - 20);
    c.fillStyle = b.roof; c.fillRect(b.x - 8, b.y, b.w + 16, 35);
    c.fillStyle = '#f8d9a7'; c.fillRect(b.x - 8, b.y, b.w + 16, 5);
    for (let x = b.x - 4; x < b.x + b.w; x += 16) {
      c.fillStyle = '#ffffff24'; c.fillRect(x, b.y + 8, 11, 3);
      c.fillStyle = '#6f453c44'; c.fillRect(x + 8, b.y + 24, 8, 3);
    }
    c.fillStyle = '#8b5947'; c.fillRect(b.x + b.w / 2 - 18, b.y + b.h - 46, 36, 46);
    c.fillStyle = '#4d8490'; c.fillRect(b.x + b.w / 2 - 12, b.y + b.h - 39, 24, 39);
    c.fillStyle = '#d8b581'; c.fillRect(b.x + b.w / 2 - 2, b.y + b.h - 39, 3, 38);
    for (let i = 0; i < Math.max(2, Math.floor(b.w / 62)); i++) {
      const wx = b.x + 18 + i * 58;
      c.fillStyle = '#3d626b'; c.fillRect(wx, b.y + 55, 25, 28);
      c.fillStyle = '#f3dcad'; c.fillRect(wx + 4, b.y + 58, 17, 22);
      c.fillStyle = '#79a2a9'; c.fillRect(wx - 5, b.y + 55, 4, 29); c.fillRect(wx + 26, b.y + 55, 4, 29);
      c.fillStyle = '#9bbeb4'; c.fillRect(wx + 11, b.y + 58, 3, 22);
    }
    if (b.id === 'hotel') {
      c.fillStyle = '#315e70'; c.fillRect(b.x + 30, b.y + 102, b.w - 60, 6);
      c.fillStyle = '#f5f0dc'; c.fillRect(b.x + 38, b.y + 108, b.w - 76, 8);
      c.fillStyle = '#416e5b'; c.fillRect(b.x + b.w - 32, b.y - 22, 3, 27);
      c.fillStyle = '#33865f'; c.fillRect(b.x + b.w - 29, b.y - 20, 10, 13);
      c.fillStyle = '#f7f4e8'; c.fillRect(b.x + b.w - 19, b.y - 20, 10, 13);
      c.fillStyle = '#b9564b'; c.fillRect(b.x + b.w - 9, b.y - 20, 10, 13);
      for (const px of [b.x + 21, b.x + b.w - 21]) { c.fillStyle = '#a97959'; c.fillRect(px - 8, b.y + b.h - 11, 16, 11); c.fillStyle = '#41875c'; c.fillRect(px - 10, b.y + b.h - 20, 20, 12); }
    }
    if (b.id === 'bakery') {
      for (let x = b.x + 12; x < b.x + b.w - 12; x += 14) { c.fillStyle = x % 2 ? '#b85b4b' : '#f5e5cc'; c.fillRect(x, b.y + 97, 13, 8); }
      c.fillStyle = '#af7a50'; c.fillRect(b.x + b.w - 26, b.y + b.h - 7, 19, 7);
      for (let i = 0; i < 3; i++) { c.fillStyle = '#e9b874'; c.fillRect(b.x + b.w - 25 + i * 6, b.y + b.h - 11, 5, 5); }
    }
    if (b.id === 'winery') {
      for (let i = 0; i < 4; i++) { c.fillStyle = '#426f55'; c.fillRect(b.x + 18 + i * 28, b.y + 96, 24, 8); c.fillStyle = '#845a82'; c.fillRect(b.x + 23 + i * 28, b.y + 99, 5, 5); c.fillRect(b.x + 33 + i * 28, b.y + 99, 5, 5); }
      c.fillStyle = '#8a664d'; c.fillRect(b.x + 8, b.y + b.h - 14, 16, 13);
      c.fillStyle = '#5c433d'; c.fillRect(b.x + 8, b.y + b.h - 9, 16, 3);
    }
    c.fillStyle = b.future ? '#536661' : '#23474e'; c.fillRect(b.x + 12, b.y + 32, b.w - 24, b.topic ? 34 : 17);
    c.textAlign = 'center'; c.fillStyle = '#fff1cd'; c.font = `bold ${b.label.length > 18 ? 10 : 12}px monospace`;
    c.fillText(b.label, b.x + b.w / 2, b.y + 45);
    if (b.topic) { c.fillStyle = '#f3dbac'; c.font = 'bold 8px monospace'; c.fillText(b.topic, b.x + b.w / 2, b.y + 59, b.w - 28); }
    if (b.future) { c.fillStyle = '#193d42db'; c.fillRect(b.x + b.w - 55, b.y + b.h - 27, 48, 17); c.fillStyle = '#fff'; c.font = 'bold 9px monospace'; c.fillText('LATER', b.x + b.w - 31, b.y + b.h - 15); }
  }
  person(c, x, y, shirt, name, player, look = '') {
    x = Math.round(x); y = Math.round(y);
    const step = !this.reduced && this.frameCount % 28 < 14 ? 2 : 0;
    c.fillStyle = '#243f3d66'; c.fillRect(x - 12, y + 13, 25, 5);
    c.fillStyle = '#263b42'; c.fillRect(x - 8, y + 5, 6, 11 + step); c.fillRect(x + 2, y + 5 + step, 6, 11 - step);
    c.fillRect(x - 9, y + 14 + step, 8, 4); c.fillRect(x + 2, y + 14 - step, 8, 4);
    c.fillStyle = '#283a3d'; c.fillRect(x - 11, y - 14, 22, 22);
    c.fillStyle = shirt; c.fillRect(x - 9, y - 12, 18, 18);
    c.fillStyle = '#24404a'; c.fillRect(x - 12, y - 10, 3, 14); c.fillRect(x + 9, y - 10, 3, 14);
    c.fillStyle = '#f0c799'; c.fillRect(x - 8, y - 29, 16, 16); c.fillRect(x - 11, y - 8, 3, 8); c.fillRect(x + 8, y - 8, 3, 8);
    c.fillStyle = player ? '#393b43' : '#503f3e'; c.fillRect(x - 10, y - 34, 20, 8); c.fillRect(x - 10, y - 28, 3, 10); c.fillRect(x + 7, y - 28, 3, 10);
    c.fillStyle = '#253a43'; c.fillRect(x - 4, y - 23, 2, 2); c.fillRect(x + 3, y - 23, 2, 2);
    c.fillStyle = '#a66b55'; c.fillRect(x - 1, y - 17, 3, 2);
    if (look === 'hotel') {
      c.fillStyle = '#f1e8d4'; c.fillRect(x - 2, y - 12, 4, 15);
      c.fillStyle = '#d7b66f'; c.fillRect(x + 5, y - 8, 3, 3);
      c.fillStyle = '#292b34'; c.fillRect(x + 7, y - 34, 8, 9);
    } else if (look === 'bakery') {
      c.fillStyle = '#bd5547'; c.fillRect(x - 11, y - 35, 22, 6); c.fillRect(x + 9, y - 31, 5, 12);
      c.fillStyle = '#f3ebd7'; c.fillRect(x - 6, y - 9, 12, 15);
      c.fillStyle = '#cdab7d'; c.fillRect(x - 3, y - 3, 6, 2);
    } else if (look === 'winery') {
      c.fillStyle = '#413b46'; c.fillRect(x - 11, y - 27, 4, 15); c.fillRect(x + 7, y - 27, 4, 15);
      c.fillStyle = '#d3af65'; c.fillRect(x - 14, y - 35, 28, 5); c.fillRect(x - 8, y - 42, 16, 8);
      c.fillStyle = '#718b61'; c.fillRect(x - 8, y - 35, 16, 2); c.fillRect(x - 5, y - 10, 10, 3);
    }
    c.fillStyle = '#24464f'; c.fillRect(x - 17, y - 52, Math.max(34, name.length * 8 + 10), 15);
    c.textAlign = 'center'; c.fillStyle = '#fff3d4'; c.font = 'bold 10px monospace'; c.fillText(name, x, y - 41);
    if (!player) { c.fillStyle = '#ffce65'; c.fillRect(x - 7, y - 70, 14, 14); c.fillStyle = '#36505a'; c.fillText('!', x, y - 59); }
  }
}
