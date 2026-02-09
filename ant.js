// ============================================
// ANT SURFER - Subway Surfer Style Game
// Surf on slithering snakes through the garden!
// ============================================

const CONFIG = {
    LANE_COUNT: 3,
    SCROLL_SPEED: 6,
    MAX_SPEED: 18,
    SPEED_INCREMENT: 0.0003,
    ANT_WIDTH: 36,
    ANT_HEIGHT: 44,
    LANE_SWITCH_SPEED: 0.18,
    JUMP_VELOCITY: -14,
    GRAVITY: 0.7,
    OBSTACLE_SPAWN_INTERVAL: 1200,
    COLLECTIBLE_SPAWN_INTERVAL: 800,
    SNAKE_SEGMENT_LENGTH: 8,
    SNAKE_WAVE_SPEED: 0.04,
    SNAKE_WAVE_AMPLITUDE: 6
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
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + duration);
    }

    laneSwich() {
        this.playTone(440, 0.08, 'sine', 0.08);
        setTimeout(() => this.playTone(550, 0.06, 'sine', 0.06), 40);
    }

    jump() {
        this.playTone(300, 0.12, 'square', 0.08);
        setTimeout(() => this.playTone(450, 0.1, 'square', 0.06), 60);
        setTimeout(() => this.playTone(600, 0.08, 'square', 0.04), 120);
    }

    collect() {
        this.playTone(800, 0.08, 'sine', 0.12);
        setTimeout(() => this.playTone(1000, 0.06, 'sine', 0.08), 50);
    }

    crash() {
        this.playTone(150, 0.3, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(100, 0.3, 'sawtooth', 0.15), 100);
        setTimeout(() => this.playTone(70, 0.4, 'sawtooth', 0.1), 200);
    }

    milestone() {
        this.playTone(523, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.12), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.1), 200);
    }

    powerup() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.playTone(400 + i * 100, 0.08, 'sine', 0.1), i * 50);
        }
    }

    hiss() {
        this.playTone(2500 + Math.random() * 500, 0.04, 'sawtooth', 0.01);
    }
}

// ============================================
// SNAKE LANES
// ============================================
class SnakeLanes {
    constructor(game) {
        this.game = game;
        this.time = 0;
        this.snakeColors = [
            { body: '#2E7D32', belly: '#4CAF50', pattern: '#1B5E20', eye: '#FFD700' },
            { body: '#5D4037', belly: '#8D6E63', pattern: '#3E2723', eye: '#FF5722' },
            { body: '#1565C0', belly: '#42A5F5', pattern: '#0D47A1', eye: '#FFC107' }
        ];
    }

    getLaneX(laneIndex) {
        const laneWidth = this.game.canvas.width / CONFIG.LANE_COUNT;
        return laneWidth * laneIndex + laneWidth / 2;
    }

    getLaneWidth() {
        return this.game.canvas.width / CONFIG.LANE_COUNT;
    }

    update() {
        this.time += CONFIG.SNAKE_WAVE_SPEED;
    }

    draw(ctx) {
        const h = this.game.canvas.height;
        const laneWidth = this.getLaneWidth();
        const snakeBodyWidth = laneWidth * 0.7;

        for (let lane = 0; lane < CONFIG.LANE_COUNT; lane++) {
            const centerX = this.getLaneX(lane);
            const colors = this.snakeColors[lane];

            // Draw snake body segments from bottom to top
            const segmentH = CONFIG.SNAKE_SEGMENT_LENGTH;
            const segCount = Math.ceil(h / segmentH) + 4;

            for (let s = 0; s < segCount; s++) {
                const y = h - s * segmentH + (this.time * 60 % segmentH);
                const wave = Math.sin(this.time * 2 + s * 0.3 + lane * 1.5) * CONFIG.SNAKE_WAVE_AMPLITUDE;
                const nextWave = Math.sin(this.time * 2 + (s + 1) * 0.3 + lane * 1.5) * CONFIG.SNAKE_WAVE_AMPLITUDE;
                const sx = centerX + wave;
                const nsx = centerX + nextWave;

                // Body
                ctx.fillStyle = s % 6 < 3 ? colors.body : colors.pattern;
                ctx.beginPath();
                ctx.moveTo(sx - snakeBodyWidth / 2, y);
                ctx.lineTo(sx + snakeBodyWidth / 2, y);
                ctx.lineTo(nsx + snakeBodyWidth / 2, y - segmentH);
                ctx.lineTo(nsx - snakeBodyWidth / 2, y - segmentH);
                ctx.closePath();
                ctx.fill();

                // Belly stripe
                const bellyWidth = snakeBodyWidth * 0.3;
                ctx.fillStyle = colors.belly;
                ctx.beginPath();
                ctx.moveTo(sx - bellyWidth / 2, y);
                ctx.lineTo(sx + bellyWidth / 2, y);
                ctx.lineTo(nsx + bellyWidth / 2, y - segmentH);
                ctx.lineTo(nsx - bellyWidth / 2, y - segmentH);
                ctx.closePath();
                ctx.fill();

                // Scale pattern (diamond shapes every few segments)
                if (s % 4 === 0) {
                    ctx.fillStyle = colors.pattern;
                    ctx.globalAlpha = 0.3;
                    const midY = y - segmentH / 2;
                    const midX = (sx + nsx) / 2;
                    ctx.beginPath();
                    ctx.moveTo(midX, midY - 6);
                    ctx.lineTo(midX + 8, midY);
                    ctx.lineTo(midX, midY + 6);
                    ctx.lineTo(midX - 8, midY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }

            // Draw snake head at top of screen
            const headY = 30;
            const headWave = Math.sin(this.time * 2 + lane * 1.5) * CONFIG.SNAKE_WAVE_AMPLITUDE;
            const headX = centerX + headWave;
            this.drawSnakeHead(ctx, headX, headY, snakeBodyWidth, colors);
        }
    }

    drawSnakeHead(ctx, x, y, width, colors) {
        // Head shape (wider than body)
        const headW = width * 0.65;
        const headH = width * 0.45;

        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(x, y, headW, headH, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeOffX = headW * 0.45;
        const eyeOffY = -headH * 0.15;
        const eyeR = headH * 0.25;

        // Left eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x - eyeOffX, y + eyeOffY, eyeR, eyeR, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(x - eyeOffX, y + eyeOffY, eyeR * 0.5, eyeR * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(x + eyeOffX, y + eyeOffY, eyeR, eyeR, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(x + eyeOffX, y + eyeOffY, eyeR * 0.5, eyeR * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tongue (flickering)
        if (Math.sin(this.time * 8) > 0.3) {
            ctx.strokeStyle = '#c62828';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - headH);
            ctx.lineTo(x, y - headH - 12);
            ctx.moveTo(x, y - headH - 10);
            ctx.lineTo(x - 4, y - headH - 16);
            ctx.moveTo(x, y - headH - 10);
            ctx.lineTo(x + 4, y - headH - 16);
            ctx.stroke();
        }
    }

    getSnakeWaveOffset(lane, y) {
        const segIndex = (this.game.canvas.height - y) / CONFIG.SNAKE_SEGMENT_LENGTH;
        return Math.sin(this.time * 2 + segIndex * 0.3 + lane * 1.5) * CONFIG.SNAKE_WAVE_AMPLITUDE;
    }
}

// ============================================
// ANT PLAYER
// ============================================
class Ant {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.lane = 1; // Start in center lane
        this.targetLane = 1;
        this.x = this.game.snakeLanes.getLaneX(1);
        this.targetX = this.x;
        this.y = this.game.canvas.height * 0.75;
        this.width = CONFIG.ANT_WIDTH;
        this.height = CONFIG.ANT_HEIGHT;
        this.isJumping = false;
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.legPhase = 0;
        this.shieldTimer = 0;
        this.magnetTimer = 0;
        this.alive = true;
        this.deathAnimation = 0;
    }

    switchLane(direction) {
        const newLane = this.targetLane + direction;
        if (newLane >= 0 && newLane < CONFIG.LANE_COUNT) {
            this.targetLane = newLane;
            this.targetX = this.game.snakeLanes.getLaneX(newLane);
            this.game.audio.laneSwich();
        }
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = CONFIG.JUMP_VELOCITY;
            this.game.audio.jump();
        }
    }

    update() {
        if (!this.alive) {
            this.deathAnimation += 0.05;
            return;
        }

        // Smooth lane switching
        const dx = this.targetX - this.x;
        this.x += dx * CONFIG.LANE_SWITCH_SPEED;

        // Snap to lane when close
        if (Math.abs(dx) < 1) {
            this.x = this.targetX;
            this.lane = this.targetLane;
        }

        // Add snake wave offset
        const waveOffset = this.game.snakeLanes.getSnakeWaveOffset(this.targetLane, this.y);
        this.displayX = this.x + waveOffset;

        // Jump physics
        if (this.isJumping) {
            this.jumpVelocity += CONFIG.GRAVITY;
            this.jumpHeight += this.jumpVelocity;
            if (this.jumpHeight >= 0) {
                this.jumpHeight = 0;
                this.jumpVelocity = 0;
                this.isJumping = false;
            }
        }

        // Leg animation
        this.legPhase += 0.2;

        // Decrement power-up timers
        if (this.shieldTimer > 0) this.shieldTimer--;
        if (this.magnetTimer > 0) this.magnetTimer--;
    }

    draw(ctx) {
        ctx.save();
        const drawX = this.displayX || this.x;
        ctx.translate(drawX, this.y + this.jumpHeight);

        // Jump shadow
        if (this.isJumping) {
            const shadowScale = 1 + Math.abs(this.jumpHeight) * 0.005;
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(0, -this.jumpHeight + 5, 18 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Scale when jumping
        const jumpScale = 1 + Math.abs(this.jumpHeight) * 0.002;
        ctx.scale(jumpScale, jumpScale);

        // Shield glow
        if (this.shieldTimer > 0) {
            ctx.strokeStyle = `rgba(0, 200, 255, ${0.5 + Math.sin(this.legPhase * 2) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, -10, 24, 28, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Death animation
        if (!this.alive) {
            ctx.globalAlpha = Math.max(0, 1 - this.deathAnimation);
            ctx.rotate(this.deathAnimation * 3);
        }

        this.drawAnt(ctx);

        ctx.restore();
    }

    drawAnt(ctx) {
        const legSwing = Math.sin(this.legPhase) * 8;

        // Legs (3 pairs)
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;

        // Back legs
        ctx.beginPath();
        ctx.moveTo(-8, 8);
        ctx.lineTo(-18 - legSwing, 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, 8);
        ctx.lineTo(18 + legSwing, 16);
        ctx.stroke();

        // Middle legs
        ctx.beginPath();
        ctx.moveTo(-9, -2);
        ctx.lineTo(-20 + legSwing, 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(9, -2);
        ctx.lineTo(20 - legSwing, 4);
        ctx.stroke();

        // Front legs
        ctx.beginPath();
        ctx.moveTo(-7, -12);
        ctx.lineTo(-16 - legSwing, -6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(7, -12);
        ctx.lineTo(16 + legSwing, -6);
        ctx.stroke();

        // Abdomen (back segment, largest)
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.ellipse(0, 12, 11, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Abdomen stripes
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.ellipse(0, 9, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 15, 8, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Thorax (middle segment)
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.ellipse(0, -2, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.ellipse(0, -16, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-4, -18, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -18, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-4, -19, 1.5, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -19, 1.5, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Antennae
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1.5;
        const antennaWave = Math.sin(this.legPhase * 0.5) * 3;
        ctx.beginPath();
        ctx.moveTo(-3, -23);
        ctx.quadraticCurveTo(-10 + antennaWave, -35, -8 + antennaWave, -38);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, -23);
        ctx.quadraticCurveTo(10 - antennaWave, -35, 8 - antennaWave, -38);
        ctx.stroke();

        // Antenna tips
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(-8 + antennaWave, -38, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8 - antennaWave, -38, 2, 0, Math.PI * 2);
        ctx.fill();

        // Mandibles
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3, -9);
        ctx.lineTo(-6, -7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, -9);
        ctx.lineTo(6, -7);
        ctx.stroke();
    }

    getBounds() {
        const drawX = this.displayX || this.x;
        return {
            x: drawX - this.width / 2 + 6,
            y: this.y - this.height / 2 + this.jumpHeight,
            width: this.width - 12,
            height: this.height - 8
        };
    }
}

// ============================================
// OBSTACLES
// ============================================
class Obstacle {
    constructor(game, type, lane, y) {
        this.game = game;
        this.type = type;
        this.lane = lane;
        this.y = y;
        this.x = game.snakeLanes.getLaneX(lane);
        this.rotation = 0;

        switch (type) {
            case 'rock':
                this.width = 40;
                this.height = 35;
                this.tall = false;
                break;
            case 'twig':
                this.width = 60;
                this.height = 15;
                this.tall = false;
                break;
            case 'mushroom':
                this.width = 36;
                this.height = 45;
                this.tall = true;
                break;
            case 'beetle':
                this.width = 34;
                this.height = 30;
                this.tall = false;
                this.animPhase = Math.random() * Math.PI * 2;
                break;
            case 'web':
                this.width = 55;
                this.height = 55;
                this.tall = true;
                break;
            case 'bird':
                this.width = 50;
                this.height = 20;
                this.tall = true;
                this.wingPhase = 0;
                break;
        }
    }

    update(speed) {
        this.y += speed;
        const waveOffset = this.game.snakeLanes.getSnakeWaveOffset(this.lane, this.y);
        this.displayX = this.x + waveOffset;

        if (this.type === 'beetle') {
            this.animPhase += 0.1;
        }
        if (this.type === 'bird') {
            this.wingPhase += 0.15;
        }
    }

    draw(ctx) {
        const dx = this.displayX || this.x;
        ctx.save();
        ctx.translate(dx, this.y);

        switch (this.type) {
            case 'rock': this.drawRock(ctx); break;
            case 'twig': this.drawTwig(ctx); break;
            case 'mushroom': this.drawMushroom(ctx); break;
            case 'beetle': this.drawBeetle(ctx); break;
            case 'web': this.drawWeb(ctx); break;
            case 'bird': this.drawBird(ctx); break;
        }

        ctx.restore();
    }

    drawRock(ctx) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(3, 5, this.width / 2, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, this.height / 4);
        ctx.lineTo(-this.width / 3, -this.height / 2);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 2, -this.height / 6);
        ctx.lineTo(this.width / 3, this.height / 3);
        ctx.closePath();
        ctx.fill();

        // Highlights
        ctx.fillStyle = '#9E9E9E';
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, -this.height / 3);
        ctx.lineTo(0, -this.height / 2 + 3);
        ctx.lineTo(this.width / 5, -this.height / 4);
        ctx.closePath();
        ctx.fill();
    }

    drawTwig(ctx) {
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(this.width / 2, -3);
        ctx.stroke();

        // Branch stubs
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -1);
        ctx.lineTo(-15, -10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(12, -2);
        ctx.lineTo(18, -12);
        ctx.stroke();
    }

    drawMushroom(ctx) {
        // Stem
        ctx.fillStyle = '#F5F5DC';
        ctx.beginPath();
        ctx.moveTo(-6, 10);
        ctx.lineTo(-8, -5);
        ctx.lineTo(8, -5);
        ctx.lineTo(6, 10);
        ctx.closePath();
        ctx.fill();

        // Cap
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.ellipse(0, -10, 18, 14, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, -10, 18, 5, 0, 0, Math.PI);
        ctx.fill();

        // White dots on cap
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-8, -16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -18, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -13, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBeetle(ctx) {
        const bob = Math.sin(this.animPhase) * 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(2, 8, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(0, bob);

        // Legs
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        const legMove = Math.sin(this.animPhase * 2) * 4;
        for (let side = -1; side <= 1; side += 2) {
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(side * 10, i * 6);
                ctx.lineTo(side * 16 + (i === 0 ? legMove * side : -legMove * side), i * 8 + 4);
                ctx.stroke();
            }
        }

        // Body shell
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing line
        ctx.strokeStyle = '#0D3B0F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 12);
        ctx.stroke();

        // Shell sheen
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.ellipse(-3, -4, 5, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, -14, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pincers
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-3, -19, 4, 0.5, Math.PI - 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(3, -19, 4, 0.3, Math.PI - 0.5);
        ctx.stroke();

        ctx.restore();
    }

    drawWeb(ctx) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;

        const r = this.width / 2;

        // Radial lines
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            ctx.stroke();
        }

        // Concentric rings
        for (let ring = 1; ring <= 4; ring++) {
            const ringR = (r / 4) * ring;
            ctx.beginPath();
            for (let i = 0; i <= 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const px = Math.cos(angle) * ringR;
                const py = Math.sin(angle) * ringR;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        // Dewdrops
        ctx.fillStyle = 'rgba(200,230,255,0.6)';
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * r * 0.8;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBird(ctx) {
        // Bird shadow on the ground (it flies overhead)
        const wingSpan = Math.sin(this.wingPhase) * 12;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';

        // Body shadow
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.quadraticCurveTo(-20, -wingSpan, -25, -wingSpan * 0.5);
        ctx.quadraticCurveTo(-20, wingSpan * 0.3, -8, 0);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.quadraticCurveTo(20, -wingSpan, 25, -wingSpan * 0.5);
        ctx.quadraticCurveTo(20, wingSpan * 0.3, 8, 0);
        ctx.fill();
    }

    isOffscreen() {
        return this.y > this.game.canvas.height + 100;
    }

    getBounds() {
        const dx = this.displayX || this.x;
        return {
            x: dx - this.width / 2 + 4,
            y: this.y - this.height / 2 + 4,
            width: this.width - 8,
            height: this.height - 8
        };
    }
}

// ============================================
// COLLECTIBLES
// ============================================
class Collectible {
    constructor(game, type, lane, y) {
        this.game = game;
        this.type = type;
        this.lane = lane;
        this.y = y;
        this.x = game.snakeLanes.getLaneX(lane);
        this.collected = false;
        this.collectAnim = 0;
        this.bobPhase = Math.random() * Math.PI * 2;

        switch (type) {
            case 'sugar':
                this.width = 16;
                this.height = 16;
                this.value = 10;
                break;
            case 'crumb':
                this.width = 12;
                this.height = 12;
                this.value = 5;
                break;
            case 'honeydew':
                this.width = 14;
                this.height = 14;
                this.value = 25;
                break;
            case 'shield':
                this.width = 20;
                this.height = 20;
                this.value = 0;
                this.isPowerup = true;
                break;
            case 'magnet':
                this.width = 20;
                this.height = 20;
                this.value = 0;
                this.isPowerup = true;
                break;
        }
    }

    update(speed) {
        this.y += speed;
        this.bobPhase += 0.08;

        const waveOffset = this.game.snakeLanes.getSnakeWaveOffset(this.lane, this.y);
        this.displayX = this.x + waveOffset;

        if (this.collected) {
            this.collectAnim += 0.1;
        }

        // Magnet attraction
        if (!this.collected && this.game.ant.magnetTimer > 0 && !this.isPowerup) {
            const antX = this.game.ant.displayX || this.game.ant.x;
            const dx = antX - (this.displayX || this.x);
            const dy = this.game.ant.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                this.x += dx * 0.08;
                this.y += dy * 0.08;
            }
        }
    }

    draw(ctx) {
        if (this.collected && this.collectAnim > 1) return;

        const dx = this.displayX || this.x;
        const bob = Math.sin(this.bobPhase) * 3;

        ctx.save();
        ctx.translate(dx, this.y + bob);

        if (this.collected) {
            ctx.globalAlpha = 1 - this.collectAnim;
            ctx.scale(1 + this.collectAnim, 1 + this.collectAnim);
        }

        switch (this.type) {
            case 'sugar': this.drawSugar(ctx); break;
            case 'crumb': this.drawCrumb(ctx); break;
            case 'honeydew': this.drawHoneydew(ctx); break;
            case 'shield': this.drawShield(ctx); break;
            case 'magnet': this.drawMagnet(ctx); break;
        }

        ctx.restore();
    }

    drawSugar(ctx) {
        // Sugar cube
        ctx.fillStyle = '#fff';
        ctx.fillRect(-7, -7, 14, 14);

        // Sparkle
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(-3, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(-7, -7, 14, 14);
    }

    drawCrumb(ctx) {
        ctx.fillStyle = '#D4A574';
        ctx.beginPath();
        ctx.moveTo(-5, 3);
        ctx.lineTo(-3, -5);
        ctx.lineTo(4, -4);
        ctx.lineTo(6, 2);
        ctx.lineTo(1, 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#C49A6C';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHoneydew(ctx) {
        // Glowing green drop
        ctx.fillStyle = '#76FF03';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.quadraticCurveTo(8, 0, 0, 8);
        ctx.quadraticCurveTo(-8, 0, 0, -8);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = 'rgba(200, 255, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(-1, -1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.shadowColor = '#76FF03';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(118, 255, 3, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawShield(ctx) {
        // Shield shape
        ctx.fillStyle = '#00BCD4';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(10, -4);
        ctx.lineTo(10, 4);
        ctx.lineTo(0, 12);
        ctx.lineTo(-10, 4);
        ctx.lineTo(-10, -4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Star on shield
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', 0, 1);
    }

    drawMagnet(ctx) {
        // Magnet shape
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.arc(0, -3, 10, Math.PI, Math.PI * 2);
        ctx.lineTo(10, 8);
        ctx.lineTo(5, 8);
        ctx.lineTo(5, 0);
        ctx.arc(0, 0, 5, 0, Math.PI, true);
        ctx.lineTo(-5, 8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();

        // Magnet tips
        ctx.fillStyle = '#ccc';
        ctx.fillRect(-10, 4, 5, 5);
        ctx.fillRect(5, 4, 5, 5);
    }

    isOffscreen() {
        return this.y > this.game.canvas.height + 50;
    }

    isDone() {
        return (this.collected && this.collectAnim > 1) || this.isOffscreen();
    }

    getBounds() {
        const dx = this.displayX || this.x;
        return {
            x: dx - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================
// GARDEN SCENERY
// ============================================
class GardenScenery {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.generateInitial();
    }

    generateInitial() {
        for (let i = 0; i < 15; i++) {
            this.addItem(-Math.random() * this.game.canvas.height);
        }
    }

    addItem(y) {
        const types = ['grass', 'flower', 'pebble', 'leaf', 'clover'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Place scenery in the gaps between snake lanes or at edges
        const laneWidth = this.game.snakeLanes.getLaneWidth();
        const positions = [];
        // Left edge
        positions.push(Math.random() * laneWidth * 0.15);
        // Between lane 0 and 1
        positions.push(laneWidth * 0.85 + Math.random() * laneWidth * 0.3);
        // Between lane 1 and 2
        positions.push(laneWidth * 1.85 + Math.random() * laneWidth * 0.3);
        // Right edge
        positions.push(this.game.canvas.width - Math.random() * laneWidth * 0.15);

        const x = positions[Math.floor(Math.random() * positions.length)];

        this.items.push({
            x, y, type,
            size: 8 + Math.random() * 16,
            rotation: Math.random() * Math.PI * 2,
            color: type === 'flower' ? ['#E91E63', '#9C27B0', '#FF9800', '#FFEB3B', '#2196F3'][Math.floor(Math.random() * 5)] : null
        });
    }

    update(speed) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            this.items[i].y += speed;
            if (this.items[i].y > this.game.canvas.height + 30) {
                this.items.splice(i, 1);
            }
        }

        while (this.items.length < 15) {
            const lastY = this.items.length > 0 ? Math.min(...this.items.map(i => i.y)) : 0;
            this.addItem(lastY - 30 - Math.random() * 80);
        }
    }

    draw(ctx) {
        for (const item of this.items) {
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.rotate(item.rotation);

            switch (item.type) {
                case 'grass':
                    ctx.fillStyle = '#388E3C';
                    ctx.beginPath();
                    ctx.moveTo(-3, 0);
                    ctx.lineTo(-1, -item.size);
                    ctx.lineTo(1, 0);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(2, 0);
                    ctx.lineTo(5, -item.size * 0.8);
                    ctx.lineTo(6, 0);
                    ctx.fill();
                    break;
                case 'flower':
                    ctx.fillStyle = '#388E3C';
                    ctx.fillRect(-1, 0, 2, item.size * 0.6);
                    ctx.fillStyle = item.color;
                    for (let p = 0; p < 5; p++) {
                        const a = (Math.PI * 2 / 5) * p;
                        ctx.beginPath();
                        ctx.ellipse(Math.cos(a) * 4, -item.size * 0.5 + Math.sin(a) * 4, 3, 3, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.fillStyle = '#FDD835';
                    ctx.beginPath();
                    ctx.arc(0, -item.size * 0.5, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'pebble':
                    ctx.fillStyle = '#9E9E9E';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, item.size * 0.4, item.size * 0.3, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'leaf':
                    ctx.fillStyle = '#558B2F';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, item.size * 0.3, item.size * 0.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#33691E';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(0, -item.size * 0.5);
                    ctx.lineTo(0, item.size * 0.5);
                    ctx.stroke();
                    break;
                case 'clover':
                    ctx.fillStyle = '#43A047';
                    for (let c = 0; c < 3; c++) {
                        const a = (Math.PI * 2 / 3) * c - Math.PI / 2;
                        ctx.beginPath();
                        ctx.ellipse(Math.cos(a) * 4, Math.sin(a) * 4, 4, 5, a, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.strokeStyle = '#2E7D32';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, 5);
                    ctx.lineTo(0, 14);
                    ctx.stroke();
                    break;
            }

            ctx.restore();
        }
    }
}

// ============================================
// PARTICLE EFFECTS
// ============================================
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, color, speed = 3) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * speed * 2,
                vy: (Math.random() - 0.5) * speed * 2 - 1,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 3,
                color
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
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
    constructor(x, y, text, color = '#FFD700') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1;
    }

    update() {
        this.y -= 1.5;
        this.life -= 0.025;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }

    isDone() {
        return this.life <= 0;
    }
}

// ============================================
// MAIN GAME CLASS
// ============================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.audio = new AudioSystem();
        this.state = 'menu';
        this.score = 0;
        this.collectiblesGathered = 0;
        this.distance = 0;
        this.highScore = parseInt(localStorage.getItem('antSurferHighScore') || '0');
        this.speed = CONFIG.SCROLL_SPEED;

        this.snakeLanes = new SnakeLanes(this);
        this.ant = null;
        this.obstacles = [];
        this.collectibles = [];
        this.scenery = null;
        this.particles = new ParticleSystem();
        this.scorePopups = [];

        this.lastObstacleSpawn = 0;
        this.lastCollectibleSpawn = 0;
        this.hissSoundTimer = 0;
        this.frameCount = 0;

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

        this.snakeLanes = new SnakeLanes(this);

        if (this.ant) {
            this.ant.x = this.snakeLanes.getLaneX(this.ant.targetLane);
            this.ant.targetX = this.ant.x;
            this.ant.y = this.canvas.height * 0.75;
        }
        if (this.scenery) {
            this.scenery = new GardenScenery(this);
        }
    }

    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
    }

    setupInput() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let swiped = false;

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();

            if (this.state === 'playing') {
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                touchStartTime = Date.now();
                swiped = false;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();

            if (this.state === 'playing' && this.ant && !swiped) {
                const touch = e.touches[0];
                const dx = touch.clientX - touchStartX;
                const dy = touch.clientY - touchStartY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                const swipeThreshold = 30;

                if (absDx > swipeThreshold && absDx > absDy) {
                    // Horizontal swipe
                    this.ant.switchLane(dx > 0 ? 1 : -1);
                    swiped = true;
                } else if (absDy > swipeThreshold && absDy > absDx && dy < 0) {
                    // Swipe up = jump
                    this.ant.jump();
                    swiped = true;
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.state === 'playing' && !swiped && this.ant) {
                // Quick tap = jump
                const elapsed = Date.now() - touchStartTime;
                if (elapsed < 200) {
                    this.ant.jump();
                }
            }
        }, { passive: false });

        // Mouse controls for desktop
        let mouseStartX = 0;
        let mouseStartY = 0;
        let mouseDown = false;
        let mouseSwiped = false;

        this.canvas.addEventListener('mousedown', (e) => {
            this.audio.init();
            if (this.state === 'playing') {
                mouseDown = true;
                mouseStartX = e.clientX;
                mouseStartY = e.clientY;
                mouseSwiped = false;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (mouseDown && this.state === 'playing' && this.ant && !mouseSwiped) {
                const dx = e.clientX - mouseStartX;
                const dy = e.clientY - mouseStartY;
                const swipeThreshold = 40;

                if (Math.abs(dx) > swipeThreshold && Math.abs(dx) > Math.abs(dy)) {
                    this.ant.switchLane(dx > 0 ? 1 : -1);
                    mouseSwiped = true;
                } else if (dy < -swipeThreshold && Math.abs(dy) > Math.abs(dx)) {
                    this.ant.jump();
                    mouseSwiped = true;
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (mouseDown && !mouseSwiped && this.ant && this.state === 'playing') {
                this.ant.jump();
            }
            mouseDown = false;
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing' || !this.ant) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.ant.switchLane(-1);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.ant.switchLane(1);
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                case ' ':
                    e.preventDefault();
                    this.ant.jump();
                    break;
            }
        });
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.collectiblesGathered = 0;
        this.distance = 0;
        this.speed = CONFIG.SCROLL_SPEED;
        this.obstacles = [];
        this.collectibles = [];
        this.scorePopups = [];
        this.particles = new ParticleSystem();
        this.lastObstacleSpawn = Date.now();
        this.lastCollectibleSpawn = Date.now();
        this.frameCount = 0;

        this.snakeLanes = new SnakeLanes(this);
        this.ant = new Ant(this);
        this.scenery = new GardenScenery(this);

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');

        this.updateHUD();
    }

    gameOver() {
        this.state = 'gameover';
        this.ant.alive = false;
        this.audio.crash();

        // Emit death particles
        const dx = this.ant.displayX || this.ant.x;
        this.particles.emit(dx, this.ant.y, 20, '#5D4037');

        const finalScore = this.score;

        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            localStorage.setItem('antSurferHighScore', this.highScore.toString());
        }

        setTimeout(() => {
            document.getElementById('final-score').textContent = finalScore;
            document.getElementById('high-score').textContent = this.highScore;
            document.getElementById('gameover-screen').classList.remove('hidden');
        }, 800);
    }

    spawnObstacle() {
        const now = Date.now();
        if (now - this.lastObstacleSpawn < CONFIG.OBSTACLE_SPAWN_INTERVAL) return;

        this.lastObstacleSpawn = now;

        // Increase difficulty over time
        const difficulty = Math.min(1, this.distance / 8000);

        // Choose how many lanes to block (never all 3)
        const blockedCount = difficulty > 0.5 && Math.random() < 0.3 ? 2 : 1;
        const lanes = [0, 1, 2];

        // Shuffle lanes
        for (let i = lanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
        }

        const types = ['rock', 'twig', 'mushroom', 'beetle'];
        if (difficulty > 0.3) types.push('web');
        if (difficulty > 0.6) types.push('bird');

        for (let i = 0; i < blockedCount; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            this.obstacles.push(new Obstacle(this, type, lanes[i], -50));
        }

        // Decrease spawn interval as difficulty increases
        CONFIG.OBSTACLE_SPAWN_INTERVAL = Math.max(600, 1200 - difficulty * 400);
    }

    spawnCollectible() {
        const now = Date.now();
        if (now - this.lastCollectibleSpawn < CONFIG.COLLECTIBLE_SPAWN_INTERVAL) return;

        this.lastCollectibleSpawn = now;

        const lane = Math.floor(Math.random() * CONFIG.LANE_COUNT);

        // Check if there's an obstacle in this lane nearby
        const hasNearbyObstacle = this.obstacles.some(o =>
            o.lane === lane && o.y < 50 && o.y > -100
        );
        if (hasNearbyObstacle) return;

        // Weighted random type selection
        const rand = Math.random();
        let type;
        if (rand < 0.4) type = 'sugar';
        else if (rand < 0.7) type = 'crumb';
        else if (rand < 0.9) type = 'honeydew';
        else if (rand < 0.95) type = 'shield';
        else type = 'magnet';

        this.collectibles.push(new Collectible(this, type, lane, -30));
    }

    checkCollisions() {
        if (!this.ant || !this.ant.alive) return;

        const antBounds = this.ant.getBounds();

        // Check obstacle collisions
        for (const obs of this.obstacles) {
            const obsBounds = obs.getBounds();

            if (this.rectIntersect(antBounds, obsBounds)) {
                // If jumping, skip ground-level obstacles
                if (this.ant.isJumping && this.ant.jumpHeight < -20 && !obs.tall) {
                    continue;
                }
                // If tall obstacle, can't jump over it
                if (obs.tall && this.ant.isJumping && this.ant.jumpHeight > -40) {
                    // Still hit it
                }

                if (this.ant.shieldTimer > 0) {
                    // Shield absorbs the hit
                    this.ant.shieldTimer = 0;
                    this.particles.emit(obs.displayX || obs.x, obs.y, 10, '#00BCD4');
                    this.obstacles = this.obstacles.filter(o => o !== obs);
                    return;
                }

                this.gameOver();
                return;
            }
        }

        // Check collectible collisions
        for (const col of this.collectibles) {
            if (col.collected) continue;

            const colBounds = col.getBounds();
            if (this.rectIntersect(antBounds, colBounds)) {
                col.collected = true;
                this.audio.collect();

                const cx = col.displayX || col.x;

                if (col.isPowerup) {
                    if (col.type === 'shield') {
                        this.ant.shieldTimer = 300; // ~5 seconds
                        this.audio.powerup();
                        this.scorePopups.push(new ScorePopup(cx, col.y, 'SHIELD!', '#00BCD4'));
                    } else if (col.type === 'magnet') {
                        this.ant.magnetTimer = 360; // ~6 seconds
                        this.audio.powerup();
                        this.scorePopups.push(new ScorePopup(cx, col.y, 'MAGNET!', '#f44336'));
                    }
                } else {
                    this.score += col.value;
                    this.collectiblesGathered++;
                    this.particles.emit(cx, col.y, 6, '#FFD700', 2);
                    this.scorePopups.push(new ScorePopup(cx, col.y, '+' + col.value));
                }
            }
        }
    }

    rectIntersect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    updateHUD() {
        document.getElementById('score-display').textContent = this.score;
        document.getElementById('collectible-display').textContent = '\uD83C\uDF6C ' + this.collectiblesGathered;
    }

    update() {
        if (this.state !== 'playing' && this.state !== 'gameover') return;

        this.frameCount++;

        // Gradually increase speed
        if (this.state === 'playing') {
            this.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.SCROLL_SPEED + this.distance * CONFIG.SPEED_INCREMENT);
            this.distance += this.speed;
            this.score += Math.floor(this.speed * 0.1);

            // Milestone sounds
            if (Math.floor(this.distance / 1000) > Math.floor((this.distance - this.speed) / 1000)) {
                this.audio.milestone();
            }
        }

        // Snake hiss ambient
        this.hissSoundTimer++;
        if (this.hissSoundTimer % 60 === 0) {
            this.audio.hiss();
        }

        // Update snake lanes
        this.snakeLanes.update();

        // Update scenery
        if (this.scenery) {
            this.scenery.update(this.speed);
        }

        if (this.state === 'playing') {
            // Spawn obstacles and collectibles
            this.spawnObstacle();
            this.spawnCollectible();
        }

        // Update obstacles
        for (const obs of this.obstacles) {
            obs.update(this.speed);
        }
        this.obstacles = this.obstacles.filter(o => !o.isOffscreen());

        // Update collectibles
        for (const col of this.collectibles) {
            col.update(this.speed);
        }
        this.collectibles = this.collectibles.filter(c => !c.isDone());

        // Update ant
        if (this.ant) {
            this.ant.update();
        }

        // Check collisions
        if (this.state === 'playing') {
            this.checkCollisions();
        }

        // Update particles
        this.particles.update();

        // Update score popups
        for (const popup of this.scorePopups) {
            popup.update();
        }
        this.scorePopups = this.scorePopups.filter(p => !p.isDone());

        if (this.state === 'playing') {
            this.updateHUD();
        }
    }

    draw() {
        const ctx = this.ctx;

        // Garden ground background
        const bgGradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#1B5E20');
        bgGradient.addColorStop(0.5, '#2E7D32');
        bgGradient.addColorStop(1, '#388E3C');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dirt/soil texture hint
        ctx.fillStyle = 'rgba(62, 39, 35, 0.15)';
        for (let i = 0; i < 30; i++) {
            const dx = (i * 97 + this.frameCount * 0.3) % this.canvas.width;
            const dy = (i * 143 + this.frameCount * 0.5) % this.canvas.height;
            ctx.beginPath();
            ctx.arc(dx, dy, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw scenery (behind snakes)
        if (this.scenery) {
            this.scenery.draw(ctx);
        }

        // Draw snake lanes
        this.snakeLanes.draw(ctx);

        // Draw collectibles
        for (const col of this.collectibles) {
            col.draw(ctx);
        }

        // Draw obstacles
        for (const obs of this.obstacles) {
            obs.draw(ctx);
        }

        // Draw ant
        if (this.ant && (this.state === 'playing' || this.state === 'gameover')) {
            this.ant.draw(ctx);
        }

        // Draw particles
        this.particles.draw(ctx);

        // Draw score popups
        for (const popup of this.scorePopups) {
            popup.draw(ctx);
        }

        // Draw power-up indicators
        if (this.ant && this.state === 'playing') {
            let indicatorY = 60;

            if (this.ant.shieldTimer > 0) {
                ctx.fillStyle = '#00BCD4';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'left';
                const barWidth = 60;
                const barFill = (this.ant.shieldTimer / 300) * barWidth;
                ctx.fillText('SHIELD', 20, indicatorY);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(20, indicatorY + 5, barWidth, 6);
                ctx.fillStyle = '#00BCD4';
                ctx.fillRect(20, indicatorY + 5, barFill, 6);
                indicatorY += 28;
            }

            if (this.ant.magnetTimer > 0) {
                ctx.fillStyle = '#f44336';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'left';
                const barWidth = 60;
                const barFill = (this.ant.magnetTimer / 360) * barWidth;
                ctx.fillText('MAGNET', 20, indicatorY);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(20, indicatorY + 5, barWidth, 6);
                ctx.fillStyle = '#f44336';
                ctx.fillRect(20, indicatorY + 5, barFill, 6);
            }
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
window.addEventListener('load', () => {
    new Game();
});
