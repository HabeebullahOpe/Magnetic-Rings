const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const flashEl = document.getElementById("flash");
const cursorEl = document.getElementById("cursor");

let W = (canvas.width = window.innerWidth);
let H = (canvas.height = window.innerHeight);
window.addEventListener("resize", () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
});

class Ring {
  constructor(x, y, radius, color, glowColor) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 3;
    this.vy = (Math.random() - 0.5) * 3;
    this.radius = radius;
    this.color = color;
    this.glowColor = glowColor;
    this.lineWidth = 2.5;
    this.grabbed = false;

    this.trail = [];
    this.maxTrail = 28;

    this.pulsePhase = Math.random() * Math.PI * 2;

    this.arcOffset = 0;
  }

  update() {
    if (!this.grabbed) {
      this.x += this.vx;
      this.y += this.vy;

      const r = this.radius + this.lineWidth;
      if (this.x - r < 0) {
        this.x = r;
        this.vx *= -0.75;
        spawnBounceParticles(this.x, this.y, this.glowColor);
      }
      if (this.x + r > W) {
        this.x = W - r;
        this.vx *= -0.75;
        spawnBounceParticles(this.x, this.y, this.glowColor);
      }
      if (this.y - r < 0) {
        this.y = r;
        this.vy *= -0.75;
        spawnBounceParticles(this.x, this.y, this.glowColor);
      }
      if (this.y + r > H) {
        this.y = H - r;
        this.vy *= -0.75;
        spawnBounceParticles(this.x, this.y, this.glowColor);
      }

      //drag
      this.vx *= 0.992;
      this.vy *= 0.992;
    }

    // trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) this.trail.shift();

    this.pulsePhase += 0.055;
    this.arcOffset += 0.018;
  }

  draw(mergeProgress = 0) {
    if (mergeProgress >= 1) return;

    const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
    const r = this.radius * (1 - mergeProgress * 0.5);
    const alpha = 1 - mergeProgress * 0.8;

    // ---Trail---
    for (let i = 1; i < this.trail.length; i++) {
      const t = 1 / this.trail.length;
      const a = t * 0.18 * alpha;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.strokeStyle = this.glowColor.replace("1)", `${a})`);
      ctx.lineWidth = t * 3;
      ctx.stroke();
    }

    // ---Outer Glow Rings---
    const glowLayers = [
      { extra: 22, a: 0.04 + pulse * 0.03 },
      { extra: 12, a: 0.08 + pulse * 0.05 },
      { extra: 5, a: 0.14 + pulse * 0.08 },
    ];
    for (const g of glowLayers) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, r + g.extra, 0, Math.PI * 2);
      ctx.strokeStyle = this.glowColor.replace("1)", `${g.a * alpha})`);
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // ---Main Ring---
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.color.replace("1)", `${alpha})`);
    ctx.lineWidth = this.lineWidth + pulse * 1.2;
    ctx.shadowBlur = 18 + pulse * 12;
    ctx.shadowColor = this.glowColor.replace("1)", "0.8)");
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── Electric arc segments ────────────────────────
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const startA = this.arcOffset + (i / segments) * Math.PI * 2;
      const endA = startA + ((Math.PI * 2) / segments) * 0.35;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, startA, endA);
      ctx.strokeStyle = "rgba(200,230,255," + (0.5 + pulse * 0.4) * alpha + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ── Inner shimmer ────────────────────────────────
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.6, 0, Math.PI * 2);
    const innerGrd = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      r * 0.6,
    );
    innerGrd.addColorStop(0, this.glowColor.replace("1)", `${0.04 * alpha})`));
    innerGrd.addColorStop(
      0.7,
      this.glowColor.replace("1)", `${0.02 * alpha})`),
    );
    innerGrd.addColorStop(1, this.glowColor.replace("1)", "0)"));
    ctx.fillStyle = innerGrd;
    ctx.fill();
  }
}

// ══════════════════════════════════════════════════════
//  PARTICLES
// ══════════════════════════════════════════════════════
class Particle {
  constructor(x, y, color, vx, vy, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = life || 0.5 + Math.random() * 0.8;
    this.decay = 0.018 + Math.random() * 0.015;
    this.r = 1 + Math.random() * 2.5;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.life -= this.decay;
  }
  draw() {
    if (this.life <= 0) return;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color.replace("1)", `${this.life * 0.9})`);
    ctx.fill();
  }
}

function spawnBounceParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 3;
    particles.push(new Particle(x, y, color, Math.cos(a) * s, Math.sin(a) * s));
  }
}

function spawnMergeParticles(x, y) {
  for (let i = 0; i < 80; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 2 + Math.random() * 8;
    const c =
      Math.random() < 0.5 ? "rgba(100,180,255,1)" : "rgba(160,220,255,1)";
    particles.push(
      new Particle(x, y, c, Math.cos(a) * s, Math.sin(a) * s, 1.2),
    );
  }
}

// ══════════════════════════════════════════════════════
//  CONNECTION LINE
// ══════════════════════════════════════════════════════
function drawConnection(r1, r2, dist, maxDist) {
  if (dist > maxDist) return;

  const t = 1 - dist / maxDist; // 0 = far, 1 = close
  const cx = (r1.x + r2.x) / 2;
  const cy = (r1.y + r2.y) / 2;

  // electric connection line with wobble
  ctx.save();
  ctx.globalAlpha = t * 0.7;

  // main line
  ctx.beginPath();
  ctx.moveTo(r1.x, r1.y);
  // mid-point wobble based on time
  const wobble = Math.sin(Date.now() * 0.004) * 20 * t;
  const nx = -(r2.y - r1.y) / dist; // normal x
  const ny = (r2.x - r1.x) / dist; // normal y
  ctx.quadraticCurveTo(cx + nx * wobble, cy + ny * wobble, r2.x, r2.y);
  ctx.strokeStyle = `rgba(140,200,255,${t * 0.5})`;
  ctx.lineWidth = t * 2;
  ctx.stroke();

  // glow line
  ctx.beginPath();
  ctx.moveTo(r1.x, r1.y);
  ctx.quadraticCurveTo(cx + nx * wobble, cy + ny * wobble, r2.x, r2.y);
  ctx.strokeStyle = `rgba(200,230,255,${t * 0.2})`;
  ctx.lineWidth = t * 8;
  ctx.stroke();

  // arc sparks along line
  const sparks = Math.floor(t * 5);
  for (let i = 0; i < sparks; i++) {
    const progress = (Date.now() * 0.0008 + i / sparks) % 1;
    const sx =
      r1.x +
      (r2.x - r1.x) * progress +
      nx * wobble * Math.sin(progress * Math.PI);
    const sy =
      r1.y +
      (r2.y - r1.y) * progress +
      ny * wobble * Math.sin(progress * Math.PI);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,230,255,${t * 0.8})`;
    ctx.fill();
  }

  ctx.restore();
}

// ══════════════════════════════════════════════════════
//  MERGE
// ══════════════════════════════════════════════════════
let merging = false;
let mergeProgress = 0;
let mergedRing = null;
let merged = false;

function doMerge() {
  merging = true;
  spawnMergeParticles((ringA.x + ringB.x) / 2, (ringA.y + ringB.y) / 2);

  // flash
  flashEl.style.transition = "none";
  flashEl.style.background = "rgba(80,160,255,0.18)";
  setTimeout(() => {
    flashEl.style.transition = "background 1.5s ease";
    flashEl.style.background = "rgba(80,160,255,0)";
  }, 60);

  document.getElementById("statState").textContent = "merging";
}

function drawMergedRing(x, y, r, alpha) {
  const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;

  // outer glow
  for (const g of [
    { e: 30, a: 0.06 },
    { e: 18, a: 0.12 },
    { e: 8, a: 0.2 },
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r + g.e, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(120,200,255,${g.a * alpha * (0.7 + pulse * 0.3)})`;
    ctx.lineWidth = 8;
    ctx.stroke();
  }

  // main merged ring
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  grad.addColorStop(0, `rgba(100,200,255,${alpha})`);
  grad.addColorStop(0.5, `rgba(160,230,255,${alpha})`);
  grad.addColorStop(1, `rgba(80,160,255,${alpha})`);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3 + pulse * 2;
  ctx.shadowBlur = 30 + pulse * 20;
  ctx.shadowColor = "rgba(100,200,255,0.9)";
  ctx.stroke();
  ctx.shadowBlur = 0;

  // electric arcs rotating
  const arcCount = 8;
  const t = Date.now() * 0.001;
  for (let i = 0; i < arcCount; i++) {
    const a1 = t + (i / arcCount) * Math.PI * 2;
    const a2 = a1 + 0.3 + Math.sin(t + i) * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, r, a1, a2);
    ctx.strokeStyle = `rgba(220,240,255,${(0.4 + pulse * 0.4) * alpha})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

// ══════════════════════════════════════════════════════
//  SETUP
// ══════════════════════════════════════════════════════
let ringA, ringB, particles;

function initRings() {
  ringA = new Ring(
    W * 0.35,
    H * 0.5,
    55,
    "rgba(80,160,255,1)",
    "rgba(80,160,255,1)",
  );
  ringA.vx = 2;
  ringA.vy = -1.5;

  ringB = new Ring(
    W * 0.65,
    H * 0.5,
    55,
    "rgba(120,210,255,1)",
    "rgba(120,210,255,1)",
  );
  ringB.vx = -2;
  ringB.vy = 1.2;

  particles = [];
  merging = false;
  mergeProgress = 0;
  mergedRing = null;
  merged = false;

  document.getElementById("statState").textContent = "drifting";
}

initRings();

// ══════════════════════════════════════════════════════
//  MOUSE INTERACTION
// ══════════════════════════════════════════════════════
let mouse = { x: 0, y: 0 };
let dragging = null;
let dragOffX = 0,
  dragOffY = 0;
let prevMouseX = 0,
  prevMouseY = 0;
let mouseVX = 0,
  mouseVY = 0;
let hintShown = true;

window.addEventListener("mousemove", (e) => {
  mouseVX = e.clientX - mouse.x;
  mouseVY = e.clientY - mouse.y;
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  cursorEl.style.left = e.clientX + "px";
  cursorEl.style.top = e.clientY + "px";

  if (dragging) {
    dragging.x = mouse.x + dragOffX;
    dragging.y = mouse.y + dragOffY;
  }

  // check hover
  const hoverA = hitTest(ringA, mouse.x, mouse.y);
  const hoverB = hitTest(ringB, mouse.x, mouse.y);
  cursorEl.classList.toggle("grab", hoverA || hoverB || !!dragging);

  if (hintShown && Math.abs(mouseVX) + Math.abs(mouseVY) > 2) {
    hintShown = false;
    document.getElementById("hint").style.opacity = "0";
  }
});

window.addEventListener("mousedown", (e) => {
  if (merged || merging) return;
  if (hitTest(ringA, e.clientX, e.clientY)) {
    dragging = ringA;
    dragging.grabbed = true;
    dragOffX = ringA.x - e.clientX;
    dragOffY = ringA.y - e.clientY;
  } else if (hitTest(ringB, e.clientX, e.clientY)) {
    dragging = ringB;
    dragging.grabbed = true;
    dragOffX = ringB.x - e.clientX;
    dragOffY = ringB.y - e.clientY;
  }
});

window.addEventListener("mouseup", () => {
  if (dragging) {
    // throw with mouse velocity
    dragging.vx = mouseVX * 0.85;
    dragging.vy = mouseVY * 0.85;
    dragging.grabbed = false;
    dragging = null;
  }
});

function hitTest(ring, mx, my) {
  const dx = mx - ring.x,
    dy = my - ring.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  return d < ring.radius + 20;
}

// ══════════════════════════════════════════════════════
//  PHYSICS
// ══════════════════════════════════════════════════════
const MAGNET_DIST = 380; // attraction kicks in within this distance
const MERGE_DIST = 12;

function applyMagnetism() {
  if (merged || merging) return;

  const dx = ringB.x - ringA.x;
  const dy = ringB.y - ringA.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minD = ringA.radius + ringB.radius;

  // update stats
  document.getElementById("statDist").textContent = Math.round(dist) + "px";

  if (dist < MAGNET_DIST) {
    // attraction force — stronger the closer they are
    const force = Math.min(
      0.28,
      ((MAGNET_DIST - dist) / MAGNET_DIST) * 0.22 + 0.02,
    );
    document.getElementById("statForce").textContent = force.toFixed(3);

    if (!ringA.grabbed) {
      ringA.vx += (dx / dist) * force;
      ringA.vy += (dy / dist) * force;
    }
    if (!ringB.grabbed) {
      ringB.vx -= (dx / dist) * force;
      ringB.vy -= (dy / dist) * force;
    }

    document.getElementById("statState").textContent =
      dist < 100 ? "collapsing" : dist < 200 ? "attracted" : "drifting";
  } else {
    document.getElementById("statForce").textContent = "0.000";
    document.getElementById("statState").textContent = "drifting";
  }

  // overlap repulsion (prevent passing through)
  if (dist < minD && dist > MERGE_DIST) {
    const overlap = minD - dist;
    const nx = dx / dist,
      ny = dy / dist;
    if (!ringA.grabbed) {
      ringA.x -= nx * overlap * 0.5;
      ringA.vx -= nx * 0.5;
    }
    if (!ringB.grabbed) {
      ringB.x += nx * overlap * 0.5;
      ringB.vx += nx * 0.5;
    }
    if (!ringA.grabbed) {
      ringA.y -= ny * overlap * 0.5;
      ringA.vy -= ny * 0.5;
    }
    if (!ringB.grabbed) {
      ringB.y += ny * overlap * 0.5;
      ringB.vy += ny * 0.5;
    }
  }

  // MERGE trigger
  if (dist < MERGE_DIST + ringA.radius && !dragging) {
    doMerge();
  }
}

// ══════════════════════════════════════════════════════
//  BACKGROUND
// ══════════════════════════════════════════════════════
function drawBackground() {
  // deep space
  ctx.fillStyle = "rgba(2,4,10,0.3)";
  ctx.fillRect(0, 0, W, H);

  // subtle grid
  ctx.save();
  ctx.globalAlpha = 0.012;
  ctx.strokeStyle = "#4488ff";
  ctx.lineWidth = 0.5;
  const gridSize = 60;
  for (let x = 0; x < W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
}

// ══════════════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════════════
function animate() {
  drawBackground();

  if (!merged) {
    applyMagnetism();
    ringA.update();
    ringB.update();
  }

  // draw connection line
  if (!merged && !merging) {
    const dx = ringB.x - ringA.x;
    const dy = ringB.y - ringA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    drawConnection(ringA, ringB, dist, MAGNET_DIST);
  }

  // draw rings or merge animation
  if (!merged) {
    if (merging) {
      mergeProgress += 0.022;
      // move rings toward each other
      const mx = (ringA.x + ringB.x) / 2;
      const my = (ringA.y + ringB.y) / 2;
      ringA.x += (mx - ringA.x) * 0.08;
      ringA.y += (my - ringA.y) * 0.08;
      ringB.x += (mx - ringB.x) * 0.08;
      ringB.y += (my - ringB.y) * 0.08;

      ringA.draw(mergeProgress);
      ringB.draw(mergeProgress);

      if (mergeProgress >= 1) {
        merged = true;
        mergedRing = { x: mx, y: my, r: 62 };
        document.getElementById("statState").textContent = "unified";
      }
    } else {
      ringA.draw(0);
      ringB.draw(0);
    }
  } else {
    // draw unified ring with slow pulse expand then stabilize
    drawMergedRing(mergedRing.x, mergedRing.y, mergedRing.r, 1);
  }

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(animate);
}

// ── Controls ──────────────────────────────────────────
document.getElementById("resetBtn").addEventListener("click", initRings);
document.getElementById("saveBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `magnetic-rings-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// ── Start ──────────────────────────────────────────────
ctx.fillStyle = "#02040a";
ctx.fillRect(0, 0, W, H);
animate();
