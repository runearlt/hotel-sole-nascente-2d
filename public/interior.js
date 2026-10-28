const WIDTH = 900, HEIGHT = 540;

export const HOTEL_STAFF = {
  lucia: { name: 'Lucia', role: 'Hotel manager', x: 190, y: 255, color: '#355c70', questions: ['price', 'bookings', 'supply'], introduction: 'Welcome in. Start with our current room price and the bookings it brings.' },
  marco: { name: 'Marco', role: 'Reservations lead', x: 468, y: 177, color: '#47765d', questions: ['other', 'comparable', 'changes'], introduction: 'I track bookings. Compare two prices before you build a demand model.' },
  elena: { name: 'Elena', role: 'Operations manager', x: 749, y: 385, color: '#a36b45', questions: ['full', 'costs'], introduction: 'We have a fixed number of rooms. Revenue tells only part of the story.' }
};

const DESK = { x: 545, y: 355 };
const EXIT = { x: 450, y: 496 };

export class HotelInterior {
  constructor(canvas, player, onTalk, onDesk, onExit, onMove, recommended) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = player;
    this.onTalk = onTalk;
    this.onDesk = onDesk;
    this.onExit = onExit;
    this.onMove = onMove;
    this.recommended = recommended;
    this.keys = new Set();
    this.path = [];
    this.paused = false;
    this.running = true;
    this.last = performance.now();
    this.background = new Image();
    this.background.src = 'assets/hotel-interior.png';
    this.keyDown = e => {
      if (this.paused || e.target instanceof Element && e.target.closest('input, textarea, select')) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      const key = e.key.toLowerCase();
      this.keys.add(key);
      if (key === 'e' || key === 'enter') this.interact();
    };
    this.keyUp = e => { this.keys.delete(e.key.toLowerCase()); this.onMove(true); };
    this.blur = () => { this.keys.clear(); this.onMove(true); };
    this.pointerDown = e => this.pointer(e);
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.blur);
    canvas.addEventListener('pointerdown', this.pointerDown);
    this.loop = time => this.tick(time);
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('blur', this.blur);
    this.canvas.removeEventListener('pointerdown', this.pointerDown);
    this.onMove(true);
  }

  setControl(key, down) {
    if (down && !this.paused) this.keys.add(key);
    else if (!down) { this.keys.delete(key); this.onMove(true); }
  }

  walkable(x, y) {
    if (x < 36 || x > 862 || y < 72 || y > 514) return false;
    if (x < 285 && y < 228) return false;
    if (x > 363 && x < 565 && y < 154) return false;
    if (x > 636 && y < 340) return false;
    if (x > 385 && x < 515 && y > 226 && y < 350) return false;
    if (x > 671 && y > 295 && y < 365) return false;
    return true;
  }

  interact() {
    const p = this.player;
    const nearby = Object.entries(HOTEL_STAFF).find(([, person]) => Math.hypot(p.x - person.x, p.y - person.y) < 60);
    if (nearby) { this.onTalk(nearby[0]); return; }
    if (Math.hypot(p.x - DESK.x, p.y - DESK.y) < 65) { this.onDesk(); return; }
    if (Math.hypot(p.x - EXIT.x, p.y - EXIT.y) < 55) this.onExit();
  }

  pointer(e) {
    if (this.paused) return;
    const bounds = this.canvas.getBoundingClientRect();
    const x = (e.clientX - bounds.left) * WIDTH / bounds.width;
    const y = (e.clientY - bounds.top) * HEIGHT / bounds.height;
    const person = Object.entries(HOTEL_STAFF).find(([, p]) => Math.hypot(x - p.x, y - p.y) < 55);
    if (person) { this.onTalk(person[0]); return; }
    if (Math.hypot(x - DESK.x, y - DESK.y) < 50) { this.onDesk(); return; }
    if (Math.hypot(x - EXIT.x, y - EXIT.y) < 40) { this.onExit(); return; }
    if (this.walkable(x, y)) this.path = this.findPath(x, y);
  }

  findPath(x, y) {
    const tile = 20, cols = WIDTH / tile, rows = HEIGHT / tile;
    const id = (cx, cy) => cy * cols + cx;
    const from = [Math.floor(this.player.x / tile), Math.floor(this.player.y / tile)];
    const to = [Math.floor(x / tile), Math.floor(y / tile)];
    const queue = [from], previous = new Map([[id(...from), null]]);
    let goal = id(...to);
    for (let head = 0; head < queue.length; head++) {
      const [cx, cy] = queue[head];
      if (id(cx, cy) === goal) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, key = id(nx, ny);
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || previous.has(key) || !this.walkable(nx * tile + 10, ny * tile + 10)) continue;
        previous.set(key, id(cx, cy)); queue.push([nx, ny]);
      }
    }
    if (!previous.has(goal)) return [];
    const route = [];
    while (goal !== null) { route.push({ x: goal % cols * tile + 10, y: Math.floor(goal / cols) * tile + 10 }); goal = previous.get(goal); }
    return route.reverse().slice(1);
  }

  tick(time) {
    if (!this.running) return;
    const dt = Math.min((time - this.last) / 1000, .04);
    this.last = time;
    if (!this.paused) {
      let dx = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
      let dy = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'));
      if (dx || dy) this.path = [];
      else if (this.path.length) {
        const next = this.path[0], distance = Math.hypot(next.x - this.player.x, next.y - this.player.y);
        if (distance < 5) this.path.shift();
        else { dx = (next.x - this.player.x) / distance; dy = (next.y - this.player.y) / distance; }
      }
      if (dx || dy) {
        const speed = 170 * dt / Math.hypot(dx, dy);
        const x = this.player.x + dx * speed, y = this.player.y + dy * speed;
        if (this.walkable(x, this.player.y)) this.player.x = x;
        if (this.walkable(this.player.x, y)) this.player.y = y;
        this.onMove(false);
      }
    }
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }

  draw() {
    const c = this.ctx;
    c.setTransform(this.canvas.width / WIDTH, 0, 0, this.canvas.height / HEIGHT, 0, 0);
    c.imageSmoothingEnabled = true;
    if (this.background.complete && this.background.naturalWidth) c.drawImage(this.background, 0, 0, WIDTH, HEIGHT);
    else { c.fillStyle = '#e6cfaa'; c.fillRect(0, 0, WIDTH, HEIGHT); }
    this.marker(c, DESK.x, DESK.y, 'WORKSPACE', '#315d58');
    this.marker(c, EXIT.x, EXIT.y, 'TOWN', '#654b3f');
    for (const [id, p] of Object.entries(HOTEL_STAFF)) {
      this.sprite(c, p.x, p.y, p.color, id);
      this.marker(c, p.x, p.y - 42, p.name.toUpperCase(), id === this.recommended ? '#27675c' : '#29484a');
      if (id === this.recommended) this.marker(c, p.x, p.y - 64, '!', '#dfaa4d');
    }
    this.sprite(c, this.player.x, this.player.y, this.player.color, 'player');
    this.marker(c, this.player.x, this.player.y - 43, 'YOU', '#24464f');
  }

  marker(c, x, y, text, color) {
    const width = Math.max(20, text.length * 7 + 14);
    c.fillStyle = color; c.fillRect(Math.round(x - width / 2), Math.round(y - 13), width, 17);
    c.fillStyle = '#fff5df'; c.textAlign = 'center'; c.font = 'bold 10px monospace'; c.fillText(text, x, y - 1);
  }

  sprite(c, x, y, shirt, kind) {
    x = Math.round(x); y = Math.round(y);
    c.fillStyle = '#243d3d77'; c.fillRect(x - 10, y + 10, 21, 5);
    c.fillStyle = '#2a3a42'; c.fillRect(x - 7, y + 1, 6, 12); c.fillRect(x + 2, y + 1, 6, 12);
    c.fillStyle = shirt; c.fillRect(x - 10, y - 15, 20, 18);
    c.fillStyle = '#efc79c'; c.fillRect(x - 8, y - 29, 16, 15);
    c.fillStyle = kind === 'marco' ? '#594536' : kind === 'elena' ? '#473b3b' : '#333f46';
    c.fillRect(x - 9, y - 32, 18, 7);
    c.fillStyle = '#293d43'; c.fillRect(x - 4, y - 22, 2, 2); c.fillRect(x + 3, y - 22, 2, 2);
    if (kind === 'elena') { c.fillStyle = '#f7e6bd'; c.fillRect(x + 7, y - 9, 8, 11); }
    if (kind === 'lucia') { c.fillStyle = '#dfbc70'; c.fillRect(x + 5, y - 9, 3, 3); }
    if (kind === 'marco') { c.fillStyle = '#f6e9cf'; c.fillRect(x - 4, y - 11, 8, 5); }
  }
}
