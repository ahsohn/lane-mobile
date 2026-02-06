// ============================================
// ROAD RIDER CB650 - Vertical Racing Game
// ============================================

// Game Configuration
const CONFIG = {
    ROAD_WIDTH: 260,
    SCROLL_SPEED: 5,
    MAX_SPEED: 16,
    BIKE_WIDTH: 50,
    BIKE_HEIGHT: 90,
    CURVE_FREQUENCY: 0.008,
    CURVE_AMPLITUDE: 150,
    OBSTACLE_SPAWN_RATE: 5000,
    RAMP_SPAWN_RATE: 8000
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

    engine() {
        this.playTone(80 + Math.random() * 30, 0.08, 'sawtooth', 0.02);
    }

    crash() {
        this.playTone(100, 0.4, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(80, 0.3, 'sawtooth', 0.15), 100);
        setTimeout(() => this.playTone(60, 0.3, 'sawtooth', 0.1), 200);
    }

    ramp() {
        this.playTone(300, 0.15, 'square', 0.1);
        setTimeout(() => this.playTone(400, 0.1, 'square', 0.08), 100);
    }

    milestone() {
        this.playTone(523, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.12), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.1), 200);
    }
}

// ============================================
// PROCEDURAL ROAD
// ============================================
class Road {
    constructor(game) {
        this.game = game;
        this.segments = [];
        this.distance = 0;
        this.curveOffset = 0;
        this.curvePhase = 0;
        this.segmentHeight = 5;
        this.totalDistance = 0;
        // Keep road straight for first 2000 pixels (~5 seconds at speed 8)
        this.straightDistance = 2000;
        // Ramp up curves over next 1000 pixels
        this.curveRampDistance = 1000;
        this.generateInitialRoad();
    }

    generateInitialRoad() {
        const segmentCount = Math.ceil(this.game.canvas.height / this.segmentHeight) + 20;
        for (let i = 0; i < segmentCount; i++) {
            this.addSegment(this.game.canvas.height - i * this.segmentHeight, true);
        }
    }

    addSegment(y, isInitial = false) {
        // Track total distance (only count non-initial segments)
        if (!isInitial) {
            this.totalDistance += this.segmentHeight;
        }

        // Calculate curve intensity based on distance traveled
        let curveIntensity = 0;
        if (this.totalDistance > this.straightDistance) {
            // Gradually ramp up curves
            const distanceIntoCurves = this.totalDistance - this.straightDistance;
            curveIntensity = Math.min(1, distanceIntoCurves / this.curveRampDistance);
        }

        // Only advance curve phase when we have curves
        if (curveIntensity > 0) {
            this.curvePhase += CONFIG.CURVE_FREQUENCY;
        }

        // Multiple sine waves for more interesting curves (scaled by intensity)
        const curve1 = Math.sin(this.curvePhase) * CONFIG.CURVE_AMPLITUDE * curveIntensity;
        const curve2 = Math.sin(this.curvePhase * 0.5) * CONFIG.CURVE_AMPLITUDE * 0.5 * curveIntensity;
        const curve3 = Math.sin(this.curvePhase * 2) * CONFIG.CURVE_AMPLITUDE * 0.25 * curveIntensity;

        const centerX = this.game.canvas.width / 2 + curve1 + curve2 + curve3;

        this.segments.push({
            y: y,
            centerX: centerX,
            width: CONFIG.ROAD_WIDTH
        });
    }

    update(speed) {
        this.distance += speed;

        // Move all segments down
        for (let i = this.segments.length - 1; i >= 0; i--) {
            this.segments[i].y += speed;

            // Remove segments that are off screen
            if (this.segments[i].y > this.game.canvas.height + 50) {
                this.segments.splice(i, 1);
            }
        }

        // Add new segments at the top
        while (this.segments.length > 0 && this.segments[this.segments.length - 1].y > -50) {
            const lastSegment = this.segments[this.segments.length - 1];
            this.addSegment(lastSegment.y - this.segmentHeight);
        }
    }

    draw(ctx) {
        // Draw grass/dirt background
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        // Draw road segments
        for (let i = 0; i < this.segments.length - 1; i++) {
            const seg = this.segments[i];
            const nextSeg = this.segments[i + 1];

            // Road surface
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(seg.centerX - seg.width / 2, seg.y);
            ctx.lineTo(seg.centerX + seg.width / 2, seg.y);
            ctx.lineTo(nextSeg.centerX + nextSeg.width / 2, nextSeg.y);
            ctx.lineTo(nextSeg.centerX - nextSeg.width / 2, nextSeg.y);
            ctx.closePath();
            ctx.fill();

            // Road edge lines (white)
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;

            // Left edge
            ctx.beginPath();
            ctx.moveTo(seg.centerX - seg.width / 2, seg.y);
            ctx.lineTo(nextSeg.centerX - nextSeg.width / 2, nextSeg.y);
            ctx.stroke();

            // Right edge
            ctx.beginPath();
            ctx.moveTo(seg.centerX + seg.width / 2, seg.y);
            ctx.lineTo(nextSeg.centerX + nextSeg.width / 2, nextSeg.y);
            ctx.stroke();
        }

        // Draw center dashed line
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        for (let i = 0; i < this.segments.length - 1; i++) {
            const seg = this.segments[i];
            if (i === 0) {
                ctx.moveTo(seg.centerX, seg.y);
            } else {
                ctx.lineTo(seg.centerX, seg.y);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    getRoadCenterAt(y) {
        // Find the segment at this y position
        for (let i = 0; i < this.segments.length - 1; i++) {
            const seg = this.segments[i];
            const nextSeg = this.segments[i + 1];

            if (y <= seg.y && y >= nextSeg.y) {
                // Interpolate between segments
                const t = (seg.y - y) / (seg.y - nextSeg.y);
                return seg.centerX + (nextSeg.centerX - seg.centerX) * t;
            }
        }
        return this.game.canvas.width / 2;
    }

    getRoadWidthAt(y) {
        return CONFIG.ROAD_WIDTH;
    }

    isOnRoad(x, y) {
        const center = this.getRoadCenterAt(y);
        const width = this.getRoadWidthAt(y);
        return Math.abs(x - center) < width / 2 - 10;
    }
}

// ============================================
// MOTORCYCLE (Top-down view)
// ============================================
class Motorcycle {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.x = this.game.canvas.width / 2;
        this.y = this.game.canvas.height - 150;
        this.width = CONFIG.BIKE_WIDTH;
        this.height = CONFIG.BIKE_HEIGHT;
        this.targetX = this.x;
        this.speed = CONFIG.SCROLL_SPEED;
        this.isJumping = false;
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.rotation = 0;
        this.wheelRotation = 0;
    }

    moveTo(x) {
        this.targetX = Math.max(this.width / 2, Math.min(this.game.canvas.width - this.width / 2, x));
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = -12;
            this.game.audio.ramp();
        }
    }

    update() {
        // Smooth movement towards target
        const dx = this.targetX - this.x;
        this.x += dx * 0.12;

        // Calculate rotation based on movement
        this.rotation = dx * 0.8;
        this.rotation = Math.max(-25, Math.min(25, this.rotation));

        // Jump physics
        if (this.isJumping) {
            this.jumpVelocity += 0.6; // gravity
            this.jumpHeight += this.jumpVelocity;

            if (this.jumpHeight >= 0) {
                this.jumpHeight = 0;
                this.jumpVelocity = 0;
                this.isJumping = false;
            }
        }

        // Wheel animation
        this.wheelRotation += this.speed * 0.3;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.jumpHeight);
        ctx.rotate(this.rotation * Math.PI / 180);

        // Scale up slightly when jumping
        const jumpScale = 1 + Math.abs(this.jumpHeight) * 0.003;
        ctx.scale(jumpScale, jumpScale);

        // Shadow when jumping
        if (this.isJumping) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, -this.jumpHeight + 10, 30 * jumpScale, 15 * jumpScale, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawBikeTopDown(ctx);

        ctx.restore();
    }

    drawBikeTopDown(ctx) {
        // Back wheel
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, 30, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Back wheel rim
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.ellipse(0, 30, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Back fender
        ctx.fillStyle = '#C41E3A';
        ctx.beginPath();
        ctx.ellipse(0, 25, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Seat
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.roundRect(-12, 5, 24, 25, 5);
        ctx.fill();

        // Gas tank (red with HONDA text area)
        const tankGradient = ctx.createLinearGradient(-15, -25, 15, -25);
        tankGradient.addColorStop(0, '#8B0000');
        tankGradient.addColorStop(0.3, '#C41E3A');
        tankGradient.addColorStop(0.5, '#E83A3A');
        tankGradient.addColorStop(0.7, '#C41E3A');
        tankGradient.addColorStop(1, '#8B0000');

        ctx.fillStyle = tankGradient;
        ctx.beginPath();
        ctx.moveTo(-18, 5);
        ctx.quadraticCurveTo(-20, -15, -15, -30);
        ctx.lineTo(15, -30);
        ctx.quadraticCurveTo(20, -15, 18, 5);
        ctx.closePath();
        ctx.fill();

        // Tank stripe
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -28);
        ctx.stroke();

        // HONDA text on tank
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 6px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HONDA', 0, -12);

        // Handlebars
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-22, -32);
        ctx.lineTo(22, -32);
        ctx.stroke();

        // Handlebar grips
        ctx.fillStyle = '#222';
        ctx.fillRect(-25, -35, 8, 6);
        ctx.fillRect(17, -35, 8, 6);

        // Mirrors
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(-26, -38, 4, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(26, -38, 4, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Front fork
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(-3, -35, 6, 15);

        // Front wheel
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, -42, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front wheel rim
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.ellipse(0, -42, 10, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Headlight
        ctx.fillStyle = '#ffffcc';
        ctx.beginPath();
        ctx.ellipse(0, -48, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(0, -48, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Engine sides visible
        ctx.fillStyle = '#444';
        ctx.fillRect(-20, 0, 6, 15);
        ctx.fillRect(14, 0, 6, 15);

        // Exhaust pipes
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.moveTo(-18, 15);
        ctx.quadraticCurveTo(-25, 20, -22, 35);
        ctx.lineTo(-19, 35);
        ctx.quadraticCurveTo(-22, 22, -16, 15);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(18, 15);
        ctx.quadraticCurveTo(25, 20, 22, 35);
        ctx.lineTo(19, 35);
        ctx.quadraticCurveTo(22, 22, 16, 15);
        ctx.fill();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2 + 10,
            y: this.y - this.height / 2 + this.jumpHeight,
            width: this.width - 20,
            height: this.height
        };
    }
}

// ============================================
// OBSTACLES
// ============================================
class Obstacle {
    constructor(game, type, x, y) {
        this.game = game;
        this.type = type; // 'rock', 'oil', 'barrier', 'ramp'
        this.x = x;
        this.y = y;

        if (type === 'rock') {
            this.width = 30 + Math.random() * 20;
            this.height = 25 + Math.random() * 15;
        } else if (type === 'oil') {
            this.width = 50 + Math.random() * 30;
            this.height = 40 + Math.random() * 20;
        } else if (type === 'barrier') {
            this.width = 60;
            this.height = 20;
        } else if (type === 'ramp') {
            this.width = 60;
            this.height = 80;
        }
    }

    update(speed) {
        this.y += speed;
    }

    draw(ctx) {
        if (this.type === 'rock') {
            this.drawRock(ctx);
        } else if (this.type === 'oil') {
            this.drawOil(ctx);
        } else if (this.type === 'barrier') {
            this.drawBarrier(ctx);
        } else if (this.type === 'ramp') {
            this.drawRamp(ctx);
        }
    }

    drawRock(ctx) {
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 3, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 4, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width / 3, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawOil(ctx) {
        ctx.fillStyle = 'rgba(20, 20, 30, 0.7)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Oil sheen
        ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x - 5, this.y - 5, this.width / 3, this.height / 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBarrier(ctx) {
        // Red and white striped barrier
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        ctx.fillStyle = '#fff';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(this.x - this.width / 2 + i * 20, this.y - this.height / 2, 10, this.height);
        }
    }

    drawRamp(ctx) {
        // Yellow ramp with stripes
        const gradient = ctx.createLinearGradient(this.x, this.y - this.height / 2, this.x, this.y + this.height / 2);
        gradient.addColorStop(0, '#ffcc00');
        gradient.addColorStop(1, '#ff9900');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 2 + 10, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 2 - 10, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();

        // Stripes on ramp
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const yPos = this.y - this.height / 2 + i * (this.height / 5) + 10;
            ctx.beginPath();
            ctx.moveTo(this.x - this.width / 2 + 5, yPos);
            ctx.lineTo(this.x + this.width / 2 - 5, yPos);
            ctx.stroke();
        }

        // Arrow
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2 + 15);
        ctx.lineTo(this.x - 10, this.y);
        ctx.lineTo(this.x + 10, this.y);
        ctx.closePath();
        ctx.fill();
    }

    isOffscreen() {
        return this.y > this.game.canvas.height + 100;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================
// SCENERY (trees, rocks on sides)
// ============================================
class Scenery {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.generateInitial();
    }

    generateInitial() {
        for (let i = 0; i < 20; i++) {
            this.addItem(-Math.random() * this.game.canvas.height);
        }
    }

    addItem(y) {
        const side = Math.random() > 0.5 ? 'left' : 'right';
        const type = Math.random() > 0.7 ? 'cactus' : 'rock';

        const x = side === 'left'
            ? Math.random() * 80 + 20
            : this.game.canvas.width - Math.random() * 80 - 20;

        this.items.push({
            x: x,
            y: y,
            type: type,
            size: 20 + Math.random() * 30,
            side: side
        });
    }

    update(speed) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            this.items[i].y += speed;

            if (this.items[i].y > this.game.canvas.height + 50) {
                this.items.splice(i, 1);
            }
        }

        // Add new items
        while (this.items.length < 20) {
            const lastY = this.items.length > 0
                ? Math.min(...this.items.map(i => i.y))
                : 0;
            this.addItem(lastY - 50 - Math.random() * 100);
        }
    }

    draw(ctx) {
        for (const item of this.items) {
            if (item.type === 'cactus') {
                this.drawCactus(ctx, item);
            } else {
                this.drawRock(ctx, item);
            }
        }
    }

    drawCactus(ctx, item) {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(item.x - 5, item.y - item.size, 10, item.size);

        // Arms
        if (item.size > 30) {
            ctx.fillRect(item.x - 15, item.y - item.size * 0.6, 10, 5);
            ctx.fillRect(item.x - 15, item.y - item.size * 0.8, 5, item.size * 0.2 + 5);

            ctx.fillRect(item.x + 5, item.y - item.size * 0.4, 10, 5);
            ctx.fillRect(item.x + 10, item.y - item.size * 0.6, 5, item.size * 0.2 + 5);
        }
    }

    drawRock(ctx, item) {
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.arc(item.x, item.y - item.size / 2, item.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6B5344';
        ctx.beginPath();
        ctx.arc(item.x + 3, item.y - item.size / 2 + 3, item.size / 3, 0, Math.PI * 2);
        ctx.fill();
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
        this.distance = 0;
        this.highScore = parseInt(localStorage.getItem('roadRiderHighScore') || '0');
        this.speed = CONFIG.SCROLL_SPEED;

        this.road = null;
        this.bike = null;
        this.obstacles = [];
        this.scenery = null;

        this.lastObstacleSpawn = 0;
        this.lastRampSpawn = 0;
        this.engineSoundTimer = 0;

        this.touchStartX = 0;
        this.bikeStartX = 0;

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

        if (this.road) {
            this.road = new Road(this);
        }
        if (this.bike) {
            // Re-center bike on new canvas size
            this.bike.x = this.canvas.width / 2;
            this.bike.targetX = this.canvas.width / 2;
        }
        if (this.scenery) {
            this.scenery = new Scenery(this);
        }
    }

    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
    }

    setupInput() {
        // Touch controls - drag to move
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();

            if (this.state === 'playing') {
                const touch = e.touches[0];
                this.touchStartX = touch.clientX;
                this.bikeStartX = this.bike.x;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();

            if (this.state === 'playing' && this.bike) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - this.touchStartX;
                this.bike.moveTo(this.bikeStartX + deltaX);
            }
        }, { passive: false });

        // Mouse controls for desktop
        let mouseDown = false;
        this.canvas.addEventListener('mousedown', (e) => {
            this.audio.init();
            mouseDown = true;
            if (this.state === 'playing') {
                this.touchStartX = e.clientX;
                this.bikeStartX = this.bike.x;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (mouseDown && this.state === 'playing' && this.bike) {
                const deltaX = e.clientX - this.touchStartX;
                this.bike.moveTo(this.bikeStartX + deltaX);
            }
        });

        this.canvas.addEventListener('mouseup', () => mouseDown = false);
        this.canvas.addEventListener('mouseleave', () => mouseDown = false);

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing' || !this.bike) return;

            if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.bike.moveTo(this.bike.x - 20);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                this.bike.moveTo(this.bike.x + 20);
            }
        });
    }

    startGame() {
        this.state = 'playing';
        this.distance = 0;
        this.speed = CONFIG.SCROLL_SPEED;
        this.obstacles = [];
        this.lastObstacleSpawn = Date.now();
        this.lastRampSpawn = Date.now();

        this.road = new Road(this);
        this.bike = new Motorcycle(this);
        this.scenery = new Scenery(this);

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');

        this.updateHUD();
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.crash();

        if (this.distance > this.highScore) {
            this.highScore = this.distance;
            localStorage.setItem('roadRiderHighScore', this.highScore.toString());
        }

        document.getElementById('final-score').textContent = this.distance;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('gameover-screen').classList.remove('hidden');
    }

    spawnObstacle() {
        const now = Date.now();

        // Don't spawn anything if we spawned recently (prevents clustering)
        const minTimeBetweenAny = 3000;
        const lastSpawn = Math.max(this.lastObstacleSpawn, this.lastRampSpawn);
        if (now - lastSpawn < minTimeBetweenAny) {
            return;
        }

        // Regular obstacles
        if (now - this.lastObstacleSpawn > CONFIG.OBSTACLE_SPAWN_RATE) {
            this.lastObstacleSpawn = now;

            const roadCenter = this.road.getRoadCenterAt(0);
            const types = ['rock', 'oil', 'barrier'];
            const type = types[Math.floor(Math.random() * types.length)];

            // Spawn on road
            const offsetX = (Math.random() - 0.5) * CONFIG.ROAD_WIDTH * 0.5;
            this.obstacles.push(new Obstacle(this, type, roadCenter + offsetX, -50));
            return; // Only spawn one thing per frame
        }

        // Ramps (less frequent)
        if (now - this.lastRampSpawn > CONFIG.RAMP_SPAWN_RATE) {
            this.lastRampSpawn = now;

            const roadCenter = this.road.getRoadCenterAt(0);
            this.obstacles.push(new Obstacle(this, 'ramp', roadCenter, -50));
        }
    }

    checkCollisions() {
        if (this.bike.isJumping) return false; // Can't collide while jumping

        const bikeBounds = this.bike.getBounds();

        for (const obstacle of this.obstacles) {
            const obsBounds = obstacle.getBounds();

            if (this.rectIntersect(bikeBounds, obsBounds)) {
                if (obstacle.type === 'ramp') {
                    this.bike.jump();
                    return false;
                } else if (obstacle.type === 'oil') {
                    // Oil makes you spin but doesn't crash
                    this.bike.rotation += 30;
                    return false;
                } else {
                    return true; // Crash!
                }
            }
        }

        return false;
    }

    rectIntersect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    checkRoadBounds() {
        if (this.bike.isJumping) return true; // Can go off-road while jumping

        return this.road.isOnRoad(this.bike.x, this.bike.y);
    }

    updateHUD() {
        document.getElementById('distance-display').textContent = this.distance + 'm';
        const speedKmh = Math.floor(this.speed * 10);
        document.getElementById('speed-display').textContent = speedKmh + ' km/h';
    }

    update() {
        if (this.state !== 'playing') return;

        // Gradually increase speed (slower ramp up)
        this.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.SCROLL_SPEED + this.distance * 0.0005);

        // Update distance
        this.distance += Math.floor(this.speed * 0.3);

        // Milestone sound
        if (this.distance % 500 === 0 && this.distance > 0) {
            this.audio.milestone();
        }

        // Engine sound
        this.engineSoundTimer++;
        if (this.engineSoundTimer % 8 === 0) {
            this.audio.engine();
        }

        // Update road
        this.road.update(this.speed);

        // Update scenery
        this.scenery.update(this.speed);

        // Spawn obstacles
        this.spawnObstacle();

        // Update obstacles
        for (const obs of this.obstacles) {
            obs.update(this.speed);
        }
        this.obstacles = this.obstacles.filter(o => !o.isOffscreen());

        // Update bike
        this.bike.update();

        // Check if on road
        if (!this.checkRoadBounds()) {
            this.gameOver();
            return;
        }

        // Check collisions
        if (this.checkCollisions()) {
            this.gameOver();
            return;
        }

        this.updateHUD();
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw road (includes dirt background)
        if (this.road) {
            this.road.draw(this.ctx);
        }

        // Draw scenery
        if (this.scenery) {
            this.scenery.draw(this.ctx);
        }

        // Draw obstacles
        for (const obs of this.obstacles) {
            obs.draw(this.ctx);
        }

        // Draw bike
        if (this.bike && (this.state === 'playing' || this.state === 'gameover')) {
            this.bike.draw(this.ctx);
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
