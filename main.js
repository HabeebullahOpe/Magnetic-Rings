const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const flashEl = document.getElementById("flash");
const cursorEl = document.getElementById("cursor");

let W = (canvas.width = window.innerWidth);
let H = (canvas.height = window.innerHeight);

// Responsive ring size
const isMobile = () => window.innerWidth < 768;
const ringSize = () => (isMobile() ? Math.min(W, H) * 0.09 : 55);

window.addEventListener("resize", () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
});

// ══════════════════════════════════════════════════════
//  RING CLASS
// ══════════════════════════════════════════════════════
class Ring {
  constructor(x, y, radius, color, glowColor) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * (isMobile() ? 1.5 : 3);
    this.vy = (Math.random() - 0.5) * (isMobile() ? 1.5 : 3);
    this.radius = radius;
    this.color = color;
    this.glowColor = glowColor;
    this.lineWidth = isMobile() ? 2 : 2.5;
    this.grabbed = false;
    this.trail = [];
    this.maxTrail = isMobile() ? 16 : 28;
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
        this.vx *= -0.72;
        spawnBounceParticles(this.x, this.y, this.glowColor);
      }
      if (this.x + r > W) {
        this.x = W - r;
        this.vx *= -0.72;
        spawnBounceParticles(this.x, this.y, this.glowColor);
      }
      if (this.y - r < 0) {
        this.y = r;
        this.vy *= -0.72;
        spawnBounceParticles(this.x, this.y, this.glowColor);
      }
      if (this.y + r > H) {
        this.y = H - r;
        this.vy *= -0.72;
        spawnBounceParticles(this.x, this.y, this.glowColor);
      }
      // more drag on mobile for control
      const drag = isMobile() ? 0.985 : 0.992;
      this.vx *= drag;
      this.vy *= drag;
    }
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

    // Trail
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.strokeStyle = this.glowColor.replace("1)", `${t * 0.18 * alpha})`);
      ctx.lineWidth = t * 3;
      ctx.stroke();
    }

    // Outer glow rings
    for (const g of [
      { extra: 18, a: 0.04 + pulse * 0.03 },
      { extra: 9, a: 0.09 + pulse * 0.05 },
      { extra: 4, a: 0.15 + pulse * 0.08 },
    ]) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, r + g.extra, 0, Math.PI * 2);
      ctx.strokeStyle = this.glowColor.replace("1)", `${g.a * alpha})`);
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    // Main ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = this.color.replace("1)", `${alpha})`);
    ctx.lineWidth = this.lineWidth + pulse * 1.2;
    ctx.shadowBlur = 16 + pulse * 10;
    ctx.shadowColor = this.glowColor.replace("1)", "0.8)");
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Electric arcs
    for (let i = 0; i < 6; i++) {
      const startA = this.arcOffset + (i / 6) * Math.PI * 2;
      const endA = startA + ((Math.PI * 2) / 6) * 0.35;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, startA, endA);
      ctx.strokeStyle = `rgba(200,230,255,${(0.5 + pulse * 0.4) * alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Inner shimmer
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
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 2.5;
    particles.push(new Particle(x, y, color, Math.cos(a) * s, Math.sin(a) * s));
  }
}

function spawnMergeParticles(x, y) {
  const count = isMobile() ? 50 : 80;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 2 + Math.random() * 7;
    particles.push(
      new Particle(
        x,
        y,
        Math.random() < 0.5 ? "rgba(100,180,255,1)" : "rgba(160,220,255,1)",
        Math.cos(a) * s,
        Math.sin(a) * s,
        1.2,
      ),
    );
  }
}

// ══════════════════════════════════════════════════════
//  CONNECTION
// ══════════════════════════════════════════════════════
function drawConnection(r1, r2, dist, maxDist) {
  if (dist > maxDist) return;
  const t = 1 - dist / maxDist;
  const cx = (r1.x + r2.x) / 2;
  const cy = (r1.y + r2.y) / 2;
  const wobble = Math.sin(Date.now() * 0.004) * 20 * t;
  const nx = -(r2.y - r1.y) / dist;
  const ny = (r2.x - r1.x) / dist;

  ctx.save();
  ctx.globalAlpha = t * 0.7;
  ctx.beginPath();
  ctx.moveTo(r1.x, r1.y);
  ctx.quadraticCurveTo(cx + nx * wobble, cy + ny * wobble, r2.x, r2.y);
  ctx.strokeStyle = `rgba(140,200,255,${t * 0.5})`;
  ctx.lineWidth = t * 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r1.x, r1.y);
  ctx.quadraticCurveTo(cx + nx * wobble, cy + ny * wobble, r2.x, r2.y);
  ctx.strokeStyle = `rgba(200,230,255,${t * 0.18})`;
  ctx.lineWidth = t * 8;
  ctx.stroke();

  const sparks = Math.floor(t * 4);
  for (let i = 0; i < sparks; i++) {
    const p = (Date.now() * 0.0008 + i / sparks) % 1;
    const sx = r1.x + (r2.x - r1.x) * p + nx * wobble * Math.sin(p * Math.PI);
    const sy = r1.y + (r2.y - r1.y) * p + ny * wobble * Math.sin(p * Math.PI);
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
let merging = false,
  mergeProgress = 0,
  mergedRing = null,
  merged = false;

function doMerge() {
  if (merging || merged) return;
  merging = true;
  spawnMergeParticles((ringA.x + ringB.x) / 2, (ringA.y + ringB.y) / 2);
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
  for (const g of [
    { e: 28, a: 0.06 },
    { e: 15, a: 0.12 },
    { e: 7, a: 0.2 },
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r + g.e, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(120,200,255,${g.a * alpha * (0.7 + pulse * 0.3)})`;
    ctx.lineWidth = 7;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  grad.addColorStop(0, `rgba(100,200,255,${alpha})`);
  grad.addColorStop(0.5, `rgba(160,230,255,${alpha})`);
  grad.addColorStop(1, `rgba(80,160,255,${alpha})`);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3 + pulse * 2;
  ctx.shadowBlur = 28 + pulse * 18;
  ctx.shadowColor = "rgba(100,200,255,0.9)";
  ctx.stroke();
  ctx.shadowBlur = 0;
  const t2 = Date.now() * 0.001;
  for (let i = 0; i < 8; i++) {
    const a1 = t2 + (i / 8) * Math.PI * 2;
    const a2 = a1 + 0.3 + Math.sin(t2 + i) * 0.15;
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
  const rs = ringSize();
  ringA = new Ring(
    W * 0.25,
    H * 0.4,
    rs,
    "rgba(80,160,255,1)",
    "rgba(80,160,255,1)",
  );
  ringA.vx = isMobile() ? 1.2 : 2;
  ringA.vy = isMobile() ? -1 : -1.5;

  ringB = new Ring(
    W * 0.75,
    H * 0.6,
    rs,
    "rgba(120,210,255,1)",
    "rgba(120,210,255,1)",
  );
  ringB.vx = isMobile() ? -1.2 : -2;
  ringB.vy = isMobile() ? 0.8 : 1.2;

  particles = [];
  merging = false;
  mergeProgress = 0;
  mergedRing = null;
  merged = false;
  document.getElementById("statState").textContent = "drifting";
}

initRings();

// ══════════════════════════════════════════════════════
//  INPUT — UNIFIED MOUSE + TOUCH
// ══════════════════════════════════════════════════════
let pointer = { x: W / 2, y: H / 2 };
let dragging = null;
let dragOffX = 0,
  dragOffY = 0;
let prevPX = 0,
  prevPY = 0;
let pointerVX = 0,
  pointerVY = 0;
let hintHidden = false;
// velocity history for smoother throws on mobile
let velHistory = [];

function getPos(e) {
  if (e.touches) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function onPointerDown(e) {
  if (e.touches) e.preventDefault();
  if (merged || merging) return;
  const { x, y } = getPos(e);
  pointer.x = x;
  pointer.y = y;
  prevPX = x;
  prevPY = y;
  velHistory = [];

  const hitA = hitTest(ringA, x, y);
  const hitB = hitTest(ringB, x, y);

  if (hitA) {
    dragging = ringA;
    dragging.grabbed = true;
    dragOffX = ringA.x - x;
    dragOffY = ringA.y - y;
  } else if (hitB) {
    dragging = ringB;
    dragging.grabbed = true;
    dragOffX = ringB.x - x;
    dragOffY = ringB.y - y;
  }

  if (!hintHidden) {
    hintHidden = true;
    document.getElementById("hint").style.opacity = "0";
  }
}

function onPointerMove(e) {
  if (e.touches) e.preventDefault();
  const { x, y } = getPos(e);

  pointerVX = x - pointer.x;
  pointerVY = y - pointer.y;
  pointer.x = x;
  pointer.y = y;

  // keep velocity history (last 4 frames) for smooth throw
  velHistory.push({ vx: pointerVX, vy: pointerVY });
  if (velHistory.length > 4) velHistory.shift();

  // update cursor
  cursorEl.style.left = x + "px";
  cursorEl.style.top = y + "px";

  if (dragging) {
    dragging.x = x + dragOffX;
    dragging.y = y + dragOffY;
    // clamp within screen
    const r = dragging.radius;
    dragging.x = Math.max(r, Math.min(W - r, dragging.x));
    dragging.y = Math.max(r, Math.min(H - r, dragging.y));
  }
}

function onPointerUp(e) {
  if (dragging) {
    // average velocity history for smoother mobile throw
    if (velHistory.length > 0) {
      const avgVX =
        velHistory.reduce((s, v) => s + v.vx, 0) / velHistory.length;
      const avgVY =
        velHistory.reduce((s, v) => s + v.vy, 0) / velHistory.length;
      // cap max throw speed on mobile
      const maxSpeed = isMobile() ? 12 : 20;
      const speed = Math.sqrt(avgVX * avgVX + avgVY * avgVY);
      const scale = speed > maxSpeed ? maxSpeed / speed : 1;
      dragging.vx = avgVX * scale * 0.85;
      dragging.vy = avgVY * scale * 0.85;
    }
    dragging.grabbed = false;
    dragging = null;
    velHistory = [];
  }
}

// Mouse
window.addEventListener("mousedown", onPointerDown);
window.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);

// Touch — preventDefault stops page scroll while dragging rings
canvas.addEventListener("touchstart", onPointerDown, { passive: false });
canvas.addEventListener("touchmove", onPointerMove, { passive: false });
canvas.addEventListener("touchend", onPointerUp, { passive: false });
canvas.addEventListener("touchcancel", onPointerUp, { passive: false });

function hitTest(ring, mx, my) {
  const dx = mx - ring.x,
    dy = my - ring.y;
  // bigger hit target on mobile
  const extra = isMobile() ? 30 : 20;
  return Math.sqrt(dx * dx + dy * dy) < ring.radius + extra;
}

// ══════════════════════════════════════════════════════
//  PHYSICS
// ══════════════════════════════════════════════════════
const MAGNET_DIST = () => (isMobile() ? Math.min(W, H) * 0.65 : 380);
// Merge threshold handled inline

function applyMagnetism() {
  if (merged || merging) return;
  const dx = ringB.x - ringA.x;
  const dy = ringB.y - ringA.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minD = ringA.radius + ringB.radius;
  const md = MAGNET_DIST();
  const speed = Math.sqrt(
    (ringA.vx ** 2 + ringA.vy ** 2 + ringB.vx ** 2 + ringB.vy ** 2) / 2,
  );

  document.getElementById("statDist").textContent = Math.round(dist) + "px";

  if (dist < md) {
    const force = Math.min(0.25, ((md - dist) / md) * 0.2 + 0.015);
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
      dist < minD * 1.5
        ? "collapsing"
        : dist < md * 0.5
          ? "attracted"
          : "drifting";
  } else {
    document.getElementById("statForce").textContent = "0.000";
    document.getElementById("statState").textContent = "drifting";
  }

  // overlap repulsion
  if (dist < minD && dist > 2) {
    const overlap = minD - dist;
    const nx = dx / dist,
      ny = dy / dist;
    if (!ringA.grabbed) {
      ringA.x -= nx * overlap * 0.5;
      ringA.vx -= nx * 0.6;
      ringA.vy -= ny * 0.6;
    }
    if (!ringB.grabbed) {
      ringB.x += nx * overlap * 0.5;
      ringB.vx += nx * 0.6;
      ringB.vy += ny * 0.6;
    }
  }

  // Merge — only when centers are nearly touching, not grabbed, and moving slowly
  if (dist < minD * 0.55 && !dragging && speed < 3.5) {
    doMerge();
  }
}

// ══════════════════════════════════════════════════════
//  BACKGROUND
// ══════════════════════════════════════════════════════
function drawBackground() {
  ctx.fillStyle = "rgba(2,4,10,0.3)";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.012;
  ctx.strokeStyle = "#4488ff";
  ctx.lineWidth = 0.5;
  const g = isMobile() ? 45 : 60;
  for (let x = 0; x < W; x += g) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += g) {
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

  if (!merged && !merging) {
    const dx = ringB.x - ringA.x,
      dy = ringB.y - ringA.y;
    drawConnection(ringA, ringB, Math.sqrt(dx * dx + dy * dy), MAGNET_DIST());
  }

  if (!merged) {
    if (merging) {
      mergeProgress += 0.02;
      const mx = (ringA.x + ringB.x) / 2,
        my = (ringA.y + ringB.y) / 2;
      ringA.x += (mx - ringA.x) * 0.08;
      ringA.y += (my - ringA.y) * 0.08;
      ringB.x += (mx - ringB.x) * 0.08;
      ringB.y += (my - ringB.y) * 0.08;
      ringA.draw(mergeProgress);
      ringB.draw(mergeProgress);
      if (mergeProgress >= 1) {
        merged = true;
        mergedRing = { x: mx, y: my, r: ringSize() * 1.15 };
        document.getElementById("statState").textContent = "unified";
      }
    } else {
      ringA.draw(0);
      ringB.draw(0);
    }
  } else {
    drawMergedRing(mergedRing.x, mergedRing.y, mergedRing.r, 1);
  }

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

ctx.fillStyle = "#02040a";
ctx.fillRect(0, 0, W, H);
animate();
