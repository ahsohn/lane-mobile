// ============================================
// MACHINE SHOP PINBALL
// ============================================

const CONFIG = {
    BALL_RADIUS: 8,
    GRAVITY: 0.15,
    FRICTION: 0.999,
    WALL_BOUNCE: 0.6,
    BUMPER_BOUNCE: 1.8,
    FLIPPER_LENGTH: 55,
    FLIPPER_SPEED: 0.18,
    FLIPPER_POWER: 12,
    PLUNGER_MAX: 120,
    MAX_BALL_SPEED: 18,
    STARTING_BALLS: 3,
    TABLE_SLOPE: 0.03
};

// ============================================
// AUDIO SYSTEM
// ============================================
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            this.enabled = false;
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = frequency;
        osc.type = type;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    bumperHit() {
        this.playTone(600 + Math.random() * 200, 0.08, 'square', 0.12);
        setTimeout(() => this.playTone(800, 0.05, 'sine', 0.08), 30);
    }

    gearHit() {
        this.playTone(300, 0.12, 'sawtooth', 0.1);
        setTimeout(() => this.playTone(450, 0.08, 'triangle', 0.08), 50);
    }

    flipper() {
        this.playTone(200, 0.06, 'square', 0.06);
    }

    wallBounce() {
        this.playTone(150 + Math.random() * 100, 0.04, 'triangle', 0.04);
    }

    launch() {
        this.playTone(100, 0.2, 'sawtooth', 0.1);
        setTimeout(() => this.playTone(200, 0.15, 'sawtooth', 0.08), 80);
        setTimeout(() => this.playTone(350, 0.1, 'sawtooth', 0.06), 160);
    }

    drain() {
        this.playTone(200, 0.3, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.12), 150);
        setTimeout(() => this.playTone(80, 0.4, 'sawtooth', 0.1), 300);
    }

    target() {
        this.playTone(523, 0.06, 'sine', 0.12);
        setTimeout(() => this.playTone(659, 0.06, 'sine', 0.1), 60);
        setTimeout(() => this.playTone(784, 0.08, 'sine', 0.08), 120);
    }

    slingshot() {
        this.playTone(500, 0.05, 'square', 0.1);
        this.playTone(700, 0.05, 'square', 0.08);
    }

    multiball() {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => this.playTone(400 + i * 80, 0.08, 'sine', 0.1), i * 60);
        }
    }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
class Sparks {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, color = '#FF8F00', speed = 4) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = (0.5 + Math.random()) * speed;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 1,
                decay: 0.03 + Math.random() * 0.04,
                size: 1 + Math.random() * 3,
                color
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

// ============================================
// SCORE POPUP
// ============================================
class ScorePopup {
    constructor(x, y, text, color = '#FF8F00') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1;
    }

    update() {
        this.y -= 1.2;
        this.life -= 0.02;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }

    isDone() { return this.life <= 0; }
}

// ============================================
// BALL
// ============================================
class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = CONFIG.BALL_RADIUS;
        this.active = true;
        this.trail = [];
    }

    update(tableWidth, tableHeight) {
        // Gravity + table slope
        this.vy += CONFIG.GRAVITY;
        this.vx += CONFIG.TABLE_SLOPE * (this.x < tableWidth / 2 ? -0.01 : 0.01);

        // Friction
        this.vx *= CONFIG.FRICTION;
        this.vy *= CONFIG.FRICTION;

        // Speed cap
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.MAX_BALL_SPEED) {
            this.vx = (this.vx / speed) * CONFIG.MAX_BALL_SPEED;
            this.vy = (this.vy / speed) * CONFIG.MAX_BALL_SPEED;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();
    }

    draw(ctx) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const alpha = (i / this.trail.length) * 0.2;
            ctx.fillStyle = `rgba(200, 200, 210, ${alpha})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ball (chrome ball bearing)
        const gradient = ctx.createRadialGradient(
            this.x - 2, this.y - 2, 1,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, '#d0d0d8');
        gradient.addColorStop(0.7, '#909098');
        gradient.addColorStop(1, '#505058');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// FLIPPER
// ============================================
class Flipper {
    constructor(x, y, side) {
        this.pivotX = x;
        this.pivotY = y;
        this.side = side; // 'left' or 'right'
        this.length = CONFIG.FLIPPER_LENGTH;
        this.width = 10;
        this.restAngle = side === 'left' ? 0.4 : Math.PI - 0.4;
        this.activeAngle = side === 'left' ? -0.6 : Math.PI + 0.6;
        this.angle = this.restAngle;
        this.isActive = false;
        this.angularVelocity = 0;
    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
    }

    update() {
        const target = this.isActive ? this.activeAngle : this.restAngle;
        const diff = target - this.angle;
        this.angularVelocity = diff * CONFIG.FLIPPER_SPEED;

        if (this.isActive) {
            this.angularVelocity = diff * 0.35;
        }

        this.angle += this.angularVelocity;
    }

    getTipX() {
        return this.pivotX + Math.cos(this.angle) * this.length;
    }

    getTipY() {
        return this.pivotY + Math.sin(this.angle) * this.length;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.pivotX, this.pivotY);
        ctx.rotate(this.angle);

        // Flipper body (metallic)
        const grad = ctx.createLinearGradient(0, -this.width / 2, 0, this.width / 2);
        grad.addColorStop(0, '#999');
        grad.addColorStop(0.5, '#666');
        grad.addColorStop(1, '#444');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -this.width / 2);
        ctx.lineTo(this.length, -3);
        ctx.lineTo(this.length, 3);
        ctx.lineTo(0, this.width / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pivot bolt
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Collision check: ball vs flipper (line segment)
    checkCollision(ball) {
        const tipX = this.getTipX();
        const tipY = this.getTipY();

        // Line segment from pivot to tip
        const dx = tipX - this.pivotX;
        const dy = tipY - this.pivotY;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len; // normal
        const ny = dx / len;

        // Vector from pivot to ball
        const bx = ball.x - this.pivotX;
        const by = ball.y - this.pivotY;

        // Project ball onto flipper line
        const proj = (bx * dx + by * dy) / (len * len);
        const clampedProj = Math.max(0, Math.min(1, proj));

        // Closest point on flipper
        const closestX = this.pivotX + dx * clampedProj;
        const closestY = this.pivotY + dy * clampedProj;

        // Flipper width at this point (tapers)
        const widthAtPoint = this.width / 2 * (1 - clampedProj * 0.4);

        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist < ball.radius + widthAtPoint) {
            // Collision! Push ball out
            const overlap = ball.radius + widthAtPoint - dist;
            const pushX = distX / dist;
            const pushY = distY / dist;

            ball.x += pushX * overlap;
            ball.y += pushY * overlap;

            // Flipper angular velocity contributes to ball velocity
            const flipperTipSpeed = this.angularVelocity * this.length * clampedProj;
            const contactSpeed = flipperTipSpeed * CONFIG.FLIPPER_POWER;

            // Reflect velocity
            const dot = ball.vx * pushX + ball.vy * pushY;
            ball.vx -= 2 * dot * pushX;
            ball.vy -= 2 * dot * pushY;

            // Add flipper motion
            if (this.isActive) {
                ball.vx += nx * contactSpeed * 0.6;
                ball.vy += ny * contactSpeed * 0.6;
                ball.vy -= Math.abs(contactSpeed) * 0.5;
            }

            // Dampen
            ball.vx *= 0.85;
            ball.vy *= 0.85;

            return true;
        }
        return false;
    }
}

// ============================================
// GEAR BUMPER
// ============================================
class GearBumper {
    constructor(x, y, radius, points, teethCount) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.points = points;
        this.teethCount = teethCount || 8;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * 0.005;
        this.hitTimer = 0;
        this.baseColor = '#555';
        this.hitColor = '#FF8F00';
    }

    update() {
        this.rotation += this.rotSpeed;
        if (this.hitTimer > 0) {
            this.hitTimer--;
            this.rotSpeed *= 1.02; // Speed up briefly
        } else {
            // Gradually return to normal speed
            const target = this.rotSpeed > 0 ? 0.005 : -0.005;
            this.rotSpeed += (target - this.rotSpeed) * 0.02;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const isHit = this.hitTimer > 0;
        const outerR = this.radius;
        const innerR = this.radius * 0.75;
        const toothDepth = this.radius * 0.2;

        // Gear teeth
        ctx.fillStyle = isHit ? this.hitColor : this.baseColor;
        ctx.beginPath();
        for (let i = 0; i < this.teethCount; i++) {
            const a1 = (Math.PI * 2 / this.teethCount) * i;
            const a2 = a1 + Math.PI / this.teethCount * 0.5;
            const a3 = a1 + Math.PI / this.teethCount;
            const a4 = a1 + Math.PI / this.teethCount * 1.5;

            if (i === 0) {
                ctx.moveTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
            }
            ctx.lineTo(Math.cos(a2) * (outerR + toothDepth), Math.sin(a2) * (outerR + toothDepth));
            ctx.lineTo(Math.cos(a3) * (outerR + toothDepth), Math.sin(a3) * (outerR + toothDepth));
            ctx.lineTo(Math.cos(a4) * outerR, Math.sin(a4) * outerR);
        }
        ctx.closePath();
        ctx.fill();

        // Inner gear body
        const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, innerR);
        bodyGrad.addColorStop(0, isHit ? '#FFB74D' : '#777');
        bodyGrad.addColorStop(1, isHit ? '#E65100' : '#444');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, innerR, 0, Math.PI * 2);
        ctx.fill();

        // Center hole
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, innerR * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Axle bolt
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(0, 0, innerR * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Points label
        ctx.rotate(-this.rotation); // Counter-rotate text
        if (isHit) {
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(10, this.radius * 0.35)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.points, 0, 0);
        }

        ctx.restore();
    }

    checkCollision(ball) {
        const dx = ball.x - this.x;
        const dy = ball.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.radius + CONFIG.BALL_RADIUS + this.radius * 0.2;

        if (dist < minDist) {
            // Push ball out
            const nx = dx / dist;
            const ny = dy / dist;
            ball.x = this.x + nx * minDist;
            ball.y = this.y + ny * minDist;

            // Bounce with energy boost
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= 2 * dot * nx;
            ball.vy -= 2 * dot * ny;
            ball.vx *= CONFIG.BUMPER_BOUNCE;
            ball.vy *= CONFIG.BUMPER_BOUNCE;

            this.hitTimer = 15;
            return true;
        }
        return false;
    }
}

// ============================================
// DROP TARGET (Machine tools)
// ============================================
class DropTarget {
    constructor(x, y, width, height, label, points) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.label = label;
        this.points = points;
        this.isDown = false;
        this.animY = 0;
    }

    reset() {
        this.isDown = false;
        this.animY = 0;
    }

    draw(ctx) {
        if (this.isDown) {
            // Dropped - show slot
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(this.x - this.width / 2, this.y - 2, this.width, 4);
            return;
        }

        ctx.save();
        ctx.translate(0, this.animY);

        // Target plate (steel)
        const grad = ctx.createLinearGradient(this.x - this.width / 2, this.y, this.x + this.width / 2, this.y);
        grad.addColorStop(0, '#888');
        grad.addColorStop(0.5, '#bbb');
        grad.addColorStop(1, '#888');

        ctx.fillStyle = grad;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Label
        ctx.fillStyle = '#222';
        ctx.font = `bold ${Math.min(10, this.width * 0.3)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x, this.y);

        ctx.restore();
    }

    checkCollision(ball) {
        if (this.isDown) return false;

        const dx = Math.abs(ball.x - this.x);
        const dy = Math.abs(ball.y - this.y);

        if (dx < this.width / 2 + ball.radius && dy < this.height / 2 + ball.radius) {
            this.isDown = true;

            // Bounce ball back
            if (ball.vy > 0) {
                ball.vy = -Math.abs(ball.vy) * 0.5;
            } else {
                ball.vy = Math.abs(ball.vy) * 0.5;
            }

            return true;
        }
        return false;
    }
}

// ============================================
// SLINGSHOT
// ============================================
class Slingshot {
    constructor(x1, y1, x2, y2, x3, y3) {
        // Triangle defined by 3 points; the hypotenuse is the active edge
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
        this.x3 = x3; this.y3 = y3;
        this.hitTimer = 0;
        this.points = 10;
    }

    update() {
        if (this.hitTimer > 0) this.hitTimer--;
    }

    draw(ctx) {
        const isHit = this.hitTimer > 0;

        ctx.fillStyle = isHit ? 'rgba(255, 143, 0, 0.4)' : 'rgba(80, 80, 80, 0.3)';
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineTo(this.x3, this.y3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isHit ? '#FF8F00' : '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();

        // Rubber band (active edge between x1,y1 and x2,y2)
        ctx.strokeStyle = isHit ? '#FFB74D' : '#888';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }

    checkCollision(ball) {
        // Check ball distance to line segment (x1,y1)-(x2,y2)
        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;

        const bx = ball.x - this.x1;
        const by = ball.y - this.y1;
        const proj = (bx * dx + by * dy) / (len * len);

        if (proj < 0 || proj > 1) return false;

        const closestX = this.x1 + dx * proj;
        const closestY = this.y1 + dy * proj;
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist < ball.radius + 4) {
            // Figure out which side the ball is on
            const side = bx * nx + by * ny;
            const pushDir = side > 0 ? 1 : -1;

            ball.x += nx * pushDir * (ball.radius + 6 - dist);
            ball.y += ny * pushDir * (ball.radius + 6 - dist);

            ball.vx += nx * pushDir * 6;
            ball.vy += ny * pushDir * 6;

            this.hitTimer = 10;
            return true;
        }
        return false;
    }
}

// ============================================
// WALL SEGMENT
// ============================================
class Wall {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
    }

    checkCollision(ball) {
        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return false;

        const nx = -dy / len; // normal
        const ny = dx / len;

        const bx = ball.x - this.x1;
        const by = ball.y - this.y1;
        const proj = (bx * dx + by * dy) / (len * len);
        const clamped = Math.max(0, Math.min(1, proj));

        const closestX = this.x1 + dx * clamped;
        const closestY = this.y1 + dy * clamped;
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist < ball.radius) {
            const pushX = distX / (dist || 1);
            const pushY = distY / (dist || 1);
            ball.x = closestX + pushX * ball.radius;
            ball.y = closestY + pushY * ball.radius;

            const dot = ball.vx * pushX + ball.vy * pushY;
            ball.vx -= 2 * dot * pushX;
            ball.vy -= 2 * dot * pushY;
            ball.vx *= CONFIG.WALL_BOUNCE;
            ball.vy *= CONFIG.WALL_BOUNCE;

            return true;
        }
        return false;
    }

    draw(ctx, color = '#555') {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }
}

// ============================================
// PLUNGER
// ============================================
class Plunger {
    constructor(x, y, width, maxPull) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.maxPull = maxPull;
        this.pullAmount = 0;
        this.isPulling = false;
        this.released = false;
    }

    pull(amount) {
        this.pullAmount = Math.min(this.maxPull, amount);
        this.isPulling = true;
    }

    release() {
        this.released = true;
        this.isPulling = false;
    }

    update() {
        if (this.released && this.pullAmount > 0) {
            this.pullAmount -= 8;
            if (this.pullAmount <= 0) {
                this.pullAmount = 0;
                this.released = false;
            }
        }
    }

    getLaunchPower() {
        return this.pullAmount / this.maxPull;
    }

    draw(ctx, laneTop, laneBottom) {
        // Plunger lane background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.x - this.width / 2 - 2, laneTop, this.width + 4, laneBottom - laneTop);

        // Lane borders
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2 - 2, laneTop);
        ctx.lineTo(this.x - this.width / 2 - 2, laneBottom);
        ctx.stroke();

        // Plunger head
        const headY = this.y + this.pullAmount;
        const grad = ctx.createLinearGradient(this.x - this.width / 2, headY, this.x + this.width / 2, headY);
        grad.addColorStop(0, '#777');
        grad.addColorStop(0.5, '#aaa');
        grad.addColorStop(1, '#777');

        ctx.fillStyle = grad;
        ctx.fillRect(this.x - this.width / 2, headY, this.width, 20);

        // Spring coils
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        const springTop = headY + 20;
        const springBottom = laneBottom - 10;
        const coils = 6;
        const coilHeight = (springBottom - springTop) / coils;
        for (let i = 0; i < coils; i++) {
            const cy = springTop + i * coilHeight + coilHeight / 2;
            ctx.beginPath();
            ctx.moveTo(this.x - this.width / 3, cy - coilHeight / 3);
            ctx.lineTo(this.x + this.width / 3, cy);
            ctx.lineTo(this.x - this.width / 3, cy + coilHeight / 3);
            ctx.stroke();
        }

        // Power indicator
        if (this.pullAmount > 0) {
            const power = this.pullAmount / this.maxPull;
            ctx.fillStyle = `rgba(255, ${Math.floor(200 * (1 - power))}, 0, ${0.5 + power * 0.5})`;
            ctx.fillRect(this.x - this.width / 2, headY - 4, this.width * power, 3);
        }
    }
}

// ============================================
// TABLE (handles layout at any size)
// ============================================
class Table {
    constructor(game) {
        this.game = game;
        this.build();
    }

    build() {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        // Playfield dimensions (leave room for plunger lane on right)
        this.plungerLaneWidth = Math.max(30, w * 0.08);
        this.playWidth = w - this.plungerLaneWidth;
        this.playHeight = h;

        const pw = this.playWidth;
        const ph = this.playHeight;

        // Flipper positions
        const flipperY = ph * 0.9;
        const flipperGap = pw * 0.15;
        const flipperCenterX = pw * 0.5;

        this.leftFlipper = new Flipper(flipperCenterX - flipperGap, flipperY, 'left');
        this.rightFlipper = new Flipper(flipperCenterX + flipperGap, flipperY, 'right');

        // Plunger
        const plungerX = pw + this.plungerLaneWidth / 2;
        this.plunger = new Plunger(plungerX, ph * 0.72, this.plungerLaneWidth * 0.6, CONFIG.PLUNGER_MAX);

        // Ball start position (in plunger lane)
        this.ballStartX = plungerX;
        this.ballStartY = ph * 0.7;

        // Drain zone
        this.drainY = ph + 30;

        // Walls - outer boundaries
        this.walls = [];

        // Left wall
        this.walls.push(new Wall(0, ph * 0.05, 0, ph * 0.82));
        // Left drain guide
        this.walls.push(new Wall(0, ph * 0.82, flipperCenterX - flipperGap - 10, flipperY + 5));

        // Right wall (up to plunger lane)
        this.walls.push(new Wall(pw, ph * 0.05, pw, ph * 0.82));
        // Right drain guide
        this.walls.push(new Wall(pw, ph * 0.82, flipperCenterX + flipperGap + 10, flipperY + 5));

        // Top wall (arched)
        this.walls.push(new Wall(0, ph * 0.05, pw * 0.3, ph * 0.02));
        this.walls.push(new Wall(pw * 0.3, ph * 0.02, pw * 0.7, ph * 0.02));
        this.walls.push(new Wall(pw * 0.7, ph * 0.02, pw, ph * 0.05));

        // Plunger lane walls
        this.walls.push(new Wall(pw, ph * 0.05, pw, ph)); // Left wall of lane = right wall of playfield
        // Top curve into playfield (ball entry)
        this.walls.push(new Wall(pw + this.plungerLaneWidth, ph * 0.08, pw, ph * 0.05));
        // Right wall of plunger lane
        this.walls.push(new Wall(pw + this.plungerLaneWidth, ph * 0.08, pw + this.plungerLaneWidth, ph));

        // Inner guide rails
        // Upper left guide
        this.walls.push(new Wall(pw * 0.08, ph * 0.2, pw * 0.18, ph * 0.35));
        // Upper right guide
        this.walls.push(new Wall(pw * 0.92, ph * 0.2, pw * 0.82, ph * 0.35));

        // Gear bumpers
        this.gearBumpers = [];
        // Main gear cluster (center-top area)
        this.gearBumpers.push(new GearBumper(pw * 0.35, ph * 0.22, pw * 0.055, 500, 10));
        this.gearBumpers.push(new GearBumper(pw * 0.65, ph * 0.22, pw * 0.055, 500, 10));
        this.gearBumpers.push(new GearBumper(pw * 0.5, ph * 0.16, pw * 0.065, 1000, 12));

        // Mid-field gears
        this.gearBumpers.push(new GearBumper(pw * 0.25, ph * 0.42, pw * 0.04, 250, 8));
        this.gearBumpers.push(new GearBumper(pw * 0.75, ph * 0.42, pw * 0.04, 250, 8));

        // Slingshots (above flippers)
        this.slingshots = [];
        // Left slingshot
        this.slingshots.push(new Slingshot(
            pw * 0.1, ph * 0.72,
            pw * 0.1, ph * 0.82,
            pw * 0.22, ph * 0.8
        ));
        // Right slingshot
        this.slingshots.push(new Slingshot(
            pw * 0.9, ph * 0.72,
            pw * 0.9, ph * 0.82,
            pw * 0.78, ph * 0.8
        ));

        // Drop targets (machine tools)
        this.dropTargets = [];
        const targetW = pw * 0.08;
        const targetH = 14;

        // Top target bank: "D R I L L"
        const drillLabels = ['D', 'R', 'I', 'L', 'L'];
        const drillY = ph * 0.1;
        const drillStartX = pw * 0.28;
        const drillSpacing = pw * 0.11;
        for (let i = 0; i < 5; i++) {
            this.dropTargets.push(new DropTarget(
                drillStartX + i * drillSpacing, drillY,
                targetW, targetH, drillLabels[i], 200
            ));
        }

        // Side target bank: "L A T H E"
        const latheLabels = ['L', 'A', 'T', 'H', 'E'];
        const latheX = pw * 0.12;
        const latheStartY = ph * 0.45;
        const latheSpacing = ph * 0.05;
        for (let i = 0; i < 5; i++) {
            this.dropTargets.push(new DropTarget(
                latheX, latheStartY + i * latheSpacing,
                targetW, targetH, latheLabels[i], 200
            ));
        }

        // Kickback walls (save ball)
        this.walls.push(new Wall(pw * 0.04, ph * 0.75, pw * 0.04, ph * 0.85));
        this.walls.push(new Wall(pw * 0.96, ph * 0.75, pw * 0.96, ph * 0.85));
    }

    drawBackground(ctx) {
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const pw = this.playWidth;

        // Table surface
        const tableGrad = ctx.createLinearGradient(0, 0, 0, h);
        tableGrad.addColorStop(0, '#2a2a2a');
        tableGrad.addColorStop(0.5, '#222');
        tableGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = tableGrad;
        ctx.fillRect(0, 0, w, h);

        // Playfield surface (slightly lighter, industrial floor)
        ctx.fillStyle = '#252528';
        ctx.fillRect(0, 0, pw, h);

        // Diamond plate texture hints
        ctx.strokeStyle = 'rgba(255,255,255,0.02)';
        ctx.lineWidth = 1;
        for (let row = 0; row < h / 20; row++) {
            for (let col = 0; col < pw / 20; col++) {
                const cx = col * 20 + (row % 2 ? 10 : 0);
                const cy = row * 20;
                ctx.beginPath();
                ctx.moveTo(cx, cy - 3);
                ctx.lineTo(cx + 4, cy);
                ctx.lineTo(cx, cy + 3);
                ctx.lineTo(cx - 4, cy);
                ctx.closePath();
                ctx.stroke();
            }
        }

        // Caution stripes on drain area
        const stripeY = h * 0.92;
        ctx.fillStyle = '#333';
        ctx.fillRect(0, stripeY, pw, h - stripeY);
        ctx.strokeStyle = 'rgba(255, 143, 0, 0.15)';
        ctx.lineWidth = 8;
        for (let i = -10; i < pw / 15 + 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 15, stripeY);
            ctx.lineTo(i * 15 + (h - stripeY), h);
            ctx.stroke();
        }

        // Decorative labels
        ctx.save();
        ctx.fillStyle = 'rgba(255, 143, 0, 0.12)';
        ctx.font = `bold ${pw * 0.08}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('MACHINE SHOP', pw * 0.5, h * 0.6);

        ctx.font = `bold ${pw * 0.04}px Arial`;
        ctx.fillStyle = 'rgba(255, 143, 0, 0.08)';
        ctx.fillText('DRILL BONUS', pw * 0.5, h * 0.08);

        // LATHE label
        ctx.save();
        ctx.translate(pw * 0.06, h * 0.55);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('LATHE BONUS', 0, 0);
        ctx.restore();

        ctx.restore();
    }
}

// ============================================
// MAIN GAME
// ============================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.audio = new AudioSystem();
        this.state = 'menu'; // menu, playing, launching, gameover
        this.score = 0;
        this.ballsLeft = CONFIG.STARTING_BALLS;
        this.highScore = parseInt(localStorage.getItem('machineShopPinballHighScore') || '0');
        this.multiplier = 1;
        this.multiplierTimer = 0;

        this.ball = null;
        this.table = null;
        this.sparks = new Sparks();
        this.scorePopups = [];

        this.leftFlipperDown = false;
        this.rightFlipperDown = false;
        this.plungerHeld = false;
        this.plungerStartY = 0;

        this.drillHits = 0;
        this.latheHits = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupUI();
        this.setupInput();
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.table = new Table(this);

        if (this.ball && this.state === 'launching') {
            this.ball.x = this.table.ballStartX;
            this.ball.y = this.table.ballStartY;
        }
    }

    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
    }

    setupInput() {
        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();

            for (const touch of e.changedTouches) {
                const x = touch.clientX;
                const y = touch.clientY;

                if (this.state === 'launching') {
                    // Check if touching plunger area
                    if (x > this.table.playWidth) {
                        this.plungerHeld = true;
                        this.plungerStartY = y;
                        return;
                    }
                }

                if (this.state === 'playing' || this.state === 'launching') {
                    if (x < this.canvas.width / 2) {
                        this.leftFlipperDown = true;
                        this.table.leftFlipper.activate();
                        this.audio.flipper();
                    } else if (x < this.table.playWidth) {
                        this.rightFlipperDown = true;
                        this.table.rightFlipper.activate();
                        this.audio.flipper();
                    }
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.plungerHeld) {
                for (const touch of e.changedTouches) {
                    const pull = Math.max(0, touch.clientY - this.plungerStartY);
                    this.table.plunger.pull(pull);
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const x = touch.clientX;
                if (this.plungerHeld) {
                    this.plungerHeld = false;
                    this.launchBall();
                    return;
                }
                if (x < this.canvas.width / 2) {
                    this.leftFlipperDown = false;
                    this.table.leftFlipper.deactivate();
                } else {
                    this.rightFlipperDown = false;
                    this.table.rightFlipper.deactivate();
                }
            }
        }, { passive: false });

        // Mouse
        this.canvas.addEventListener('mousedown', (e) => {
            this.audio.init();
            const x = e.clientX;

            if (this.state === 'launching' && x > this.table.playWidth) {
                this.plungerHeld = true;
                this.plungerStartY = e.clientY;
                return;
            }

            if (this.state === 'playing' || this.state === 'launching') {
                if (x < this.canvas.width / 2) {
                    this.leftFlipperDown = true;
                    this.table.leftFlipper.activate();
                    this.audio.flipper();
                } else if (x < this.table.playWidth) {
                    this.rightFlipperDown = true;
                    this.table.rightFlipper.activate();
                    this.audio.flipper();
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.plungerHeld) {
                const pull = Math.max(0, e.clientY - this.plungerStartY);
                this.table.plunger.pull(pull);
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (this.plungerHeld) {
                this.plungerHeld = false;
                this.launchBall();
                return;
            }
            const x = e.clientX;
            if (x < this.canvas.width / 2) {
                this.leftFlipperDown = false;
                this.table.leftFlipper.deactivate();
            } else {
                this.rightFlipperDown = false;
                this.table.rightFlipper.deactivate();
            }
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing' && this.state !== 'launching') return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (!this.leftFlipperDown) {
                        this.leftFlipperDown = true;
                        this.table.leftFlipper.activate();
                        this.audio.flipper();
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (!this.rightFlipperDown) {
                        this.rightFlipperDown = true;
                        this.table.rightFlipper.activate();
                        this.audio.flipper();
                    }
                    break;
                case ' ':
                case 'ArrowDown':
                    e.preventDefault();
                    if (this.state === 'launching') {
                        this.table.plunger.pull(this.table.plunger.pullAmount + 4);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (this.state === 'launching' && this.table.plunger.pullAmount > 0) {
                        this.launchBall();
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.leftFlipperDown = false;
                    this.table.leftFlipper.deactivate();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.rightFlipperDown = false;
                    this.table.rightFlipper.deactivate();
                    break;
                case ' ':
                case 'ArrowDown':
                    if (this.state === 'launching' && this.table.plunger.pullAmount > 0) {
                        this.launchBall();
                    }
                    break;
            }
        });
    }

    startGame() {
        this.state = 'launching';
        this.score = 0;
        this.ballsLeft = CONFIG.STARTING_BALLS;
        this.multiplier = 1;
        this.multiplierTimer = 0;
        this.drillHits = 0;
        this.latheHits = 0;
        this.scorePopups = [];
        this.sparks = new Sparks();

        this.table = new Table(this);
        this.prepareBall();

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        this.updateHUD();
    }

    prepareBall() {
        this.ball = new Ball(this.table.ballStartX, this.table.ballStartY);
        this.state = 'launching';
        this.table.plunger.pullAmount = 0;
    }

    launchBall() {
        if (this.state !== 'launching' || !this.ball) return;
        const power = this.table.plunger.getLaunchPower();
        if (power < 0.05) return;

        this.ball.vy = -power * 20 - 4;
        this.ball.vx = -0.5;
        this.state = 'playing';
        this.table.plunger.release();
        this.audio.launch();
    }

    addScore(points, x, y) {
        const actual = points * this.multiplier;
        this.score += actual;
        if (x !== undefined && y !== undefined) {
            this.scorePopups.push(new ScorePopup(x, y,
                this.multiplier > 1 ? `${actual} (x${this.multiplier})` : `+${actual}`,
                '#FFD54F'));
        }
    }

    checkBonuses() {
        // Check DRILL completion
        const drillTargets = this.table.dropTargets.slice(0, 5);
        if (drillTargets.every(t => t.isDown)) {
            this.addScore(5000, this.table.playWidth * 0.5, this.canvas.height * 0.1);
            this.scorePopups.push(new ScorePopup(
                this.table.playWidth * 0.5, this.canvas.height * 0.12,
                'DRILL BONUS!', '#FF8F00'));
            this.multiplier = Math.min(5, this.multiplier + 1);
            this.multiplierTimer = 600;
            drillTargets.forEach(t => t.reset());
            this.audio.multiball();
            this.sparks.emit(this.table.playWidth * 0.5, this.canvas.height * 0.1, 30, '#FF8F00', 6);
        }

        // Check LATHE completion
        const latheTargets = this.table.dropTargets.slice(5, 10);
        if (latheTargets.every(t => t.isDown)) {
            this.addScore(5000, this.table.playWidth * 0.12, this.canvas.height * 0.55);
            this.scorePopups.push(new ScorePopup(
                this.table.playWidth * 0.2, this.canvas.height * 0.55,
                'LATHE BONUS!', '#FF8F00'));
            this.multiplier = Math.min(5, this.multiplier + 1);
            this.multiplierTimer = 600;
            latheTargets.forEach(t => t.reset());
            this.audio.multiball();
            this.sparks.emit(this.table.playWidth * 0.12, this.canvas.height * 0.55, 30, '#FF8F00', 6);
        }
    }

    drainBall() {
        this.ballsLeft--;
        this.audio.drain();
        this.multiplier = 1;

        if (this.ballsLeft <= 0) {
            this.gameOver();
        } else {
            // Reset targets for new ball? Keep them for continuity
            setTimeout(() => {
                this.prepareBall();
                this.updateHUD();
            }, 1000);
        }
    }

    gameOver() {
        this.state = 'gameover';

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('machineShopPinballHighScore', this.highScore.toString());
        }

        setTimeout(() => {
            document.getElementById('final-score').textContent = this.score.toLocaleString();
            document.getElementById('high-score').textContent = this.highScore.toLocaleString();
            document.getElementById('gameover-screen').classList.remove('hidden');
        }, 800);
    }

    updateHUD() {
        document.getElementById('score-display').textContent = this.score.toLocaleString();
        const ballDots = [];
        for (let i = 0; i < this.ballsLeft; i++) ballDots.push('\u26AB');
        document.getElementById('balls-display').textContent = ballDots.join(' ');
    }

    update() {
        if (this.state !== 'playing' && this.state !== 'launching') {
            // Still update flippers for visual
            if (this.table) {
                this.table.leftFlipper.update();
                this.table.rightFlipper.update();
            }
            return;
        }

        // Update flippers
        this.table.leftFlipper.update();
        this.table.rightFlipper.update();

        // Update plunger
        this.table.plunger.update();

        // Update gear bumpers
        for (const gear of this.table.gearBumpers) {
            gear.update();
        }

        // Update slingshots
        for (const sling of this.table.slingshots) {
            sling.update();
        }

        // Multiplier timer
        if (this.multiplierTimer > 0) {
            this.multiplierTimer--;
            if (this.multiplierTimer <= 0) {
                this.multiplier = 1;
            }
        }

        if (!this.ball) return;

        if (this.state === 'launching') {
            // Ball sits in plunger lane
            this.ball.x = this.table.ballStartX;
            this.ball.y = this.table.ballStartY + this.table.plunger.pullAmount * 0.3;
            this.ball.vx = 0;
            this.ball.vy = 0;
            return;
        }

        // Physics update (multiple sub-steps for stability)
        const subSteps = 3;
        for (let step = 0; step < subSteps; step++) {
            this.ball.update(this.canvas.width, this.canvas.height);

            // Wall collisions
            for (const wall of this.table.walls) {
                if (wall.checkCollision(this.ball)) {
                    this.audio.wallBounce();
                }
            }

            // Flipper collisions
            if (this.table.leftFlipper.checkCollision(this.ball)) {
                this.audio.flipper();
            }
            if (this.table.rightFlipper.checkCollision(this.ball)) {
                this.audio.flipper();
            }

            // Gear bumper collisions
            for (const gear of this.table.gearBumpers) {
                if (gear.checkCollision(this.ball)) {
                    this.addScore(gear.points, gear.x, gear.y - gear.radius - 15);
                    this.audio.gearHit();
                    this.sparks.emit(this.ball.x, this.ball.y, 8, '#FF8F00', 3);
                }
            }

            // Slingshot collisions
            for (const sling of this.table.slingshots) {
                if (sling.checkCollision(this.ball)) {
                    this.addScore(sling.points, this.ball.x, this.ball.y - 15);
                    this.audio.slingshot();
                    this.sparks.emit(this.ball.x, this.ball.y, 5, '#FFD54F', 2);
                }
            }

            // Drop target collisions
            for (const target of this.table.dropTargets) {
                if (target.checkCollision(this.ball)) {
                    this.addScore(target.points, target.x, target.y - 20);
                    this.audio.target();
                    this.sparks.emit(target.x, target.y, 6, '#fff', 2);
                    this.checkBonuses();
                }
            }
        }

        // Check drain
        if (this.ball.y > this.table.drainY) {
            this.drainBall();
        }

        // Update effects
        this.sparks.update();
        for (const popup of this.scorePopups) popup.update();
        this.scorePopups = this.scorePopups.filter(p => !p.isDone());

        this.updateHUD();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.table) return;

        // Table background
        this.table.drawBackground(ctx);

        // Walls
        for (const wall of this.table.walls) {
            wall.draw(ctx, '#444');
        }

        // Slingshots
        for (const sling of this.table.slingshots) {
            sling.draw(ctx);
        }

        // Drop targets
        for (const target of this.table.dropTargets) {
            target.draw(ctx);
        }

        // Gear bumpers
        for (const gear of this.table.gearBumpers) {
            gear.draw(ctx);
        }

        // Flippers
        this.table.leftFlipper.draw(ctx);
        this.table.rightFlipper.draw(ctx);

        // Plunger
        this.table.plunger.draw(ctx, this.canvas.height * 0.05, this.canvas.height);

        // Ball
        if (this.ball && (this.state === 'playing' || this.state === 'launching')) {
            this.ball.draw(ctx);
        }

        // Sparks
        this.sparks.draw(ctx);

        // Score popups
        for (const popup of this.scorePopups) {
            popup.draw(ctx);
        }

        // Multiplier display
        if (this.multiplier > 1 && this.state === 'playing') {
            const flash = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
            ctx.globalAlpha = flash;
            ctx.fillStyle = '#FF8F00';
            ctx.font = `bold ${this.table.playWidth * 0.06}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`x${this.multiplier} MULTIPLIER`, this.table.playWidth / 2, this.canvas.height * 0.5);
            ctx.globalAlpha = 1;
        }

        // Launch hint
        if (this.state === 'launching') {
            ctx.fillStyle = 'rgba(255, 143, 0, 0.7)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Pull plunger', this.table.ballStartX, this.canvas.height * 0.85);
            ctx.fillText('or hold SPACE', this.table.ballStartX, this.canvas.height * 0.87);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start
window.addEventListener('load', () => {
    new Game();
});
