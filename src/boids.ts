const canvas = document.getElementById("boids-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// --- config ---
const NUM = 5;
const MAX_SPEED = 2;
const MIN_SPEED = MAX_SPEED * 0.35;
const VISION = 60;
const AVOID_DIST = 100;
const MARGIN = 30;
const TURN_FACTOR = 0.35;
const SEP_WEIGHT = 1.5;
const ALI_WEIGHT = 1.0;
const COH_WEIGHT = 1.0;
const CURSOR_STRENGTH = 3.5;
const FEAR_RADIUS = 50;

// --- types ---
interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scared: number;
}

interface Mouse {
  x: number;
  y: number;
  onCanvas: boolean;
}

// --- state ---
let boids: Boid[] = [];
const mouse: Mouse = { x: -9999, y: -9999, onCanvas: false };

// --- resize canvas to match its CSS size ---
function resize() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

// --- helpers ---
function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function limit(vx: number, vy: number, max: number): [number, number] {
  const spd = Math.sqrt(vx * vx + vy * vy);
  if (spd > max) return [(vx / spd) * max, (vy / spd) * max];
  return [vx, vy];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// --- init ---
function createBoid(): Boid {
  const angle = Math.random() * Math.PI * 2;
  const speed = rand(MIN_SPEED, MAX_SPEED);
  return {
    x: rand(MARGIN, canvas.width - MARGIN),
    y: rand(MARGIN, canvas.height - MARGIN),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    scared: 0,
  };
}

function initBoids() {
  boids = Array.from({ length: NUM }, createBoid);
}

// --- simulation step ---
function step() {
  const W = canvas.width;
  const H = canvas.height;
  const vision2 = VISION * VISION;
  const avoid2 = AVOID_DIST * AVOID_DIST;
  const fear2 = FEAR_RADIUS * FEAR_RADIUS;

  for (let i = 0; i < boids.length; i++) {
    const b = boids[i];

    let sepX = 0, sepY = 0;
    let aliVX = 0, aliVY = 0;
    let cohX = 0, cohY = 0;
    let neighbors = 0;

    for (let j = 0; j < boids.length; j++) {
      if (i === j) continue;
      const o = boids[j];
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < vision2) {
        aliVX += o.vx;
        aliVY += o.vy;
        cohX += o.x;
        cohY += o.y;
        neighbors++;
        if (d2 < avoid2) {
          sepX -= dx;
          sepY -= dy;
        }
      }
    }

    let ax = 0;
    let ay = 0;

    // separation
    ax += sepX * SEP_WEIGHT;
    ay += sepY * SEP_WEIGHT;

    if (neighbors > 0) {
      // alignment
      ax += ((aliVX / neighbors) - b.vx) * ALI_WEIGHT * 0.05;
      ay += ((aliVY / neighbors) - b.vy) * ALI_WEIGHT * 0.05;
      // cohesion
      ax += ((cohX / neighbors) - b.x) * COH_WEIGHT * 0.001;
      ay += ((cohY / neighbors) - b.y) * COH_WEIGHT * 0.001;
    }

    // cursor avoidance
    const cdx = b.x - mouse.x;
    const cdy = b.y - mouse.y;
    const cd2 = cdx * cdx + cdy * cdy;
    if (cd2 < fear2 && cd2 > 0) {
      const dist = Math.sqrt(cd2);
      const strength = CURSOR_STRENGTH * (1 - dist / FEAR_RADIUS);
      ax += (cdx / dist) * strength;
      ay += (cdy / dist) * strength;
      b.scared = Math.min(1, b.scared + 0.15);
    } else {
      b.scared = Math.max(0, b.scared - 0.05);
    }

    // boundary steering — soft walls
    if (b.x < MARGIN) ax += TURN_FACTOR;
    if (b.x > W - MARGIN) ax -= TURN_FACTOR;
    if (b.y < MARGIN) ay += TURN_FACTOR;
    if (b.y > H - MARGIN) ay -= TURN_FACTOR;

    b.vx += ax;
    b.vy += ay;

    // speed limits — scared boids get a boost
    const topSpeed = MAX_SPEED * (1 + b.scared * 0.8);
    [b.vx, b.vy] = limit(b.vx, b.vy, topSpeed);

    // enforce minimum speed so boids never stall
    const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (spd < MIN_SPEED) {
      b.vx = (b.vx / spd) * MIN_SPEED;
      b.vy = (b.vy / spd) * MIN_SPEED;
    }

    b.x = clamp(b.x + b.vx, 2, W - 2);
    b.y = clamp(b.y + b.vy, 2, H - 2);
  }
}

// --- drawing ---
function drawBoid(b: Boid) {
  const angle = Math.atan2(b.vy, b.vx);
  const size = 10;

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.6, size * 0.45);
  ctx.lineTo(-size * 0.3, 0);
  ctx.lineTo(-size * 0.6, -size * 0.45);
  ctx.closePath();

  ctx.fillStyle = `rgb(${255},${255},${255})`;
  ctx.fill();

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const b of boids) drawBoid(b);
}

// --- mouse tracking ---
// converts page-level mouse coords to canvas-local coords
function updateMousePos(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top) * scaleY;
  mouse.onCanvas = true;
}

document.addEventListener("mousemove", updateMousePos);

canvas.addEventListener("mouseleave", () => {
  mouse.onCanvas = false;
  mouse.x = -9999;
  mouse.y = -9999;
});

// --- loop ---
function loop() {
  step();
  draw();
  requestAnimationFrame(loop);
}

// --- boot ---
window.addEventListener("resize", () => {
  resize();
  initBoids(); // respawn so boids are distributed across new size
});

resize();
initBoids();
loop();
