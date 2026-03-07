const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const flashEl = document.getElementById('flash');
const cursorEl = document.getElementById('cursor');

let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
});

class Ring {
    constructor(x, y, radius, color, glowColor) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.radius = radius;
        this.color  = color;
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
                this.x = r; this.vx *= -0.75; spawnBounceParticles(this.x, this.y, this.glowColor);  
            }
            if (this.x + r > W) {
                this.x = W - r; this.vx *= -0.75; spawnBounceParticles(this.x, this.y, this.glowColor);
            }
            if (this.y - r < 0) {
                this.y = r; this.vy *= -0.75; spawnBounceParticles(this.x, this.y, this.glowColor);
            }
            if (this.y + r > H) {
                this.y = H - r; this.vy *= -0.75; spawnBounceParticles(this.x, this.y, this.glowColor);
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
            ctx.strokeStyle = this.glowColor.replace('1)', `${a})`);
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
            ctx.strokeStyle = this.glowColor.replace('1)', `${g.a * alpha})`);
            ctx.lineWidth = 6;
            ctx.stroke();
        }

        // ---Main Ring---
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = this.color.replace('1)', `${alpha})`);
        ctx.lineWidth = this.lineWidth + pulse * 1.2;
        ctx.shadowBlur = 18 + pulse * 12;
        ctx.shadowColor = this.glowColor.replace('1)', '0.8)');
        ctx.stroke();
        ctx.shadowBlur = 0;


    }
}