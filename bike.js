// ============================================
// ROAD RIDER CB650 - Side-Scrolling Bike Game
// ============================================

// Game Configuration
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_STRENGTH: -14,
    GROUND_HEIGHT: 100,
    SCROLL_SPEED: 6,
    OBSTACLE_SPAWN_RATE: 2000,
    PLATFORM_MIN_WIDTH: 100,
    PLATFORM_MAX_WIDTH: 250,
    RAMP_WIDTH: 120
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
        // Engine rumble sound
        this.playTone(80 + Math.random() * 20, 0.1, 'sawtooth', 0.03);
    }

    jump() {
        this.playTone(150, 0.15, 'square', 0.1);
        setTimeout(() => this.playTone(200, 0.1, 'square', 0.08), 50);
    }

    land() {
        this.playTone(100, 0.1, 'square', 0.1);
    }

    crash() {
        this.playTone(100, 0.4, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(80, 0.3, 'sawtooth', 0.15), 100);
        setTimeout(() => this.playTone(60, 0.3, 'sawtooth', 0.1), 200);
    }

    milestone() {
        this.playTone(523, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.12), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.1), 200);
    }
}

// ============================================
// MOTORCYCLE (Honda CB650)
// ============================================
class Motorcycle {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.x = 100;
        this.groundY = this.game.canvas.height - CONFIG.GROUND_HEIGHT;
        this.y = this.groundY;
        this.width = 140;
        this.height = 80;
        this.velocityY = 0;
        this.isJumping = false;
        this.rotation = 0;
        this.wheelRotation = 0;
        this.onGround = true;
    }

    jump() {
        if (this.onGround) {
            this.velocityY = CONFIG.JUMP_STRENGTH;
            this.isJumping = true;
            this.onGround = false;
            this.game.audio.jump();
        }
    }

    update(groundLevel) {
        // Apply gravity
        this.velocityY += CONFIG.GRAVITY;
        this.y += this.velocityY;

        // Rotation based on velocity
        if (!this.onGround) {
            this.rotation = Math.min(Math.max(this.velocityY * 1.5, -20), 25);
        } else {
            this.rotation *= 0.8; // Smooth return to 0
        }

        // Ground collision
        if (this.y >= groundLevel) {
            if (!this.onGround && this.velocityY > 5) {
                this.game.audio.land();
            }
            this.y = groundLevel;
            this.velocityY = 0;
            this.isJumping = false;
            this.onGround = true;
        }

        // Wheel rotation (visual effect)
        this.wheelRotation += CONFIG.SCROLL_SPEED * 0.15;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);

        const scale = 0.9;
        ctx.scale(scale, scale);

        // Draw the Honda CB650
        this.drawBike(ctx);

        ctx.restore();
    }

    drawBike(ctx) {
        // Wheel positions
        const rearWheelX = -40;
        const frontWheelX = 50;
        const wheelY = 0;
        const wheelRadius = 28;

        // Draw rear wheel
        this.drawWheel(ctx, rearWheelX, wheelY, wheelRadius);

        // Draw front wheel
        this.drawWheel(ctx, frontWheelX, wheelY, wheelRadius);

        // Frame and body
        ctx.fillStyle = '#1a1a1a';

        // Lower frame
        ctx.beginPath();
        ctx.moveTo(rearWheelX, wheelY - 10);
        ctx.lineTo(rearWheelX + 20, wheelY - 35);
        ctx.lineTo(frontWheelX - 15, wheelY - 35);
        ctx.lineTo(frontWheelX, wheelY - 10);
        ctx.closePath();
        ctx.fill();

        // Engine block
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(rearWheelX + 5, wheelY - 35, 45, 25);

        // Engine details
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(rearWheelX + 10, wheelY - 30, 35, 8);
        ctx.fillRect(rearWheelX + 10, wheelY - 18, 35, 8);

        // Engine fins
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(rearWheelX + 12 + i * 6, wheelY - 32);
            ctx.lineTo(rearWheelX + 12 + i * 6, wheelY - 12);
            ctx.stroke();
        }

        // Exhaust pipes
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(rearWheelX - 5, wheelY - 20);
        ctx.quadraticCurveTo(rearWheelX - 15, wheelY - 15, rearWheelX - 20, wheelY + 5);
        ctx.lineTo(rearWheelX - 15, wheelY + 5);
        ctx.quadraticCurveTo(rearWheelX - 10, wheelY - 10, rearWheelX, wheelY - 17);
        ctx.fill();

        // Gas tank (red Honda tank)
        const tankGradient = ctx.createLinearGradient(-10, wheelY - 55, 20, wheelY - 40);
        tankGradient.addColorStop(0, '#C41E3A');
        tankGradient.addColorStop(0.3, '#E83A3A');
        tankGradient.addColorStop(0.7, '#C41E3A');
        tankGradient.addColorStop(1, '#8B0000');

        ctx.fillStyle = tankGradient;
        ctx.beginPath();
        ctx.moveTo(-15, wheelY - 38);
        ctx.quadraticCurveTo(-20, wheelY - 55, 0, wheelY - 58);
        ctx.quadraticCurveTo(25, wheelY - 60, 35, wheelY - 50);
        ctx.lineTo(35, wheelY - 38);
        ctx.closePath();
        ctx.fill();

        // Tank stripe (white)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, wheelY - 48);
        ctx.quadraticCurveTo(10, wheelY - 52, 30, wheelY - 46);
        ctx.stroke();

        // HONDA text on tank
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px Arial';
        ctx.fillText('HONDA', 0, wheelY - 45);

        // Side panel (red with CB650)
        ctx.fillStyle = '#C41E3A';
        ctx.beginPath();
        ctx.moveTo(rearWheelX + 15, wheelY - 35);
        ctx.lineTo(rearWheelX + 10, wheelY - 20);
        ctx.lineTo(rearWheelX + 35, wheelY - 20);
        ctx.lineTo(rearWheelX + 40, wheelY - 35);
        ctx.closePath();
        ctx.fill();

        // CB650 text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 6px Arial';
        ctx.fillText('CB650', rearWheelX + 15, wheelY - 25);

        // Seat
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(-5, wheelY - 38);
        ctx.quadraticCurveTo(-20, wheelY - 45, -35, wheelY - 38);
        ctx.lineTo(-35, wheelY - 35);
        ctx.lineTo(-5, wheelY - 35);
        ctx.closePath();
        ctx.fill();

        // Front forks
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(frontWheelX - 5, wheelY - 40);
        ctx.lineTo(frontWheelX, wheelY);
        ctx.stroke();

        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(frontWheelX + 5, wheelY - 40);
        ctx.lineTo(frontWheelX + 3, wheelY);
        ctx.stroke();

        // Handlebars
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(frontWheelX - 15, wheelY - 55);
        ctx.lineTo(frontWheelX + 15, wheelY - 55);
        ctx.stroke();

        // Handlebar grips
        ctx.fillStyle = '#333';
        ctx.fillRect(frontWheelX - 18, wheelY - 57, 8, 5);
        ctx.fillRect(frontWheelX + 10, wheelY - 57, 8, 5);

        // Mirrors
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(frontWheelX - 20, wheelY - 60, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(frontWheelX + 20, wheelY - 60, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Headlight
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(frontWheelX + 5, wheelY - 42, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffcc';
        ctx.beginPath();
        ctx.arc(frontWheelX + 5, wheelY - 42, 8, 0, Math.PI * 2);
        ctx.fill();

        // Speedometer/gauges
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(frontWheelX - 8, wheelY - 48, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(frontWheelX - 8, wheelY - 48, 4, 0, Math.PI, true);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Rear fender
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(rearWheelX, wheelY, wheelRadius + 5, Math.PI, 0, true);
        ctx.lineTo(rearWheelX + wheelRadius + 5, wheelY);
        ctx.lineTo(rearWheelX - wheelRadius - 5, wheelY);
        ctx.closePath();
        ctx.fill();

        // Front fender
        ctx.beginPath();
        ctx.arc(frontWheelX, wheelY, wheelRadius + 5, Math.PI * 1.2, Math.PI * -0.2, true);
        ctx.stroke();
        ctx.fillStyle = '#c0c0c0';
        ctx.fill();
    }

    drawWheel(ctx, x, y, radius) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.wheelRotation);

        // Tire
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Tire tread
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
        ctx.stroke();

        // Rim
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(0, 0, radius - 6, 0, Math.PI * 2);
        ctx.fill();

        // Spokes
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * (radius - 8), Math.sin(angle) * (radius - 8));
            ctx.stroke();
        }

        // Hub
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2 + 20,
            y: this.y - this.height,
            width: this.width - 40,
            height: this.height - 10
        };
    }
}

// ============================================
// OBSTACLE (Platform or Ramp)
// ============================================
class Obstacle {
    constructor(game, type, x) {
        this.game = game;
        this.type = type; // 'platform', 'ramp', 'gap', 'rock'
        this.x = x;

        const groundY = game.canvas.height - CONFIG.GROUND_HEIGHT;

        if (type === 'platform') {
            this.width = CONFIG.PLATFORM_MIN_WIDTH + Math.random() * (CONFIG.PLATFORM_MAX_WIDTH - CONFIG.PLATFORM_MIN_WIDTH);
            this.height = 20 + Math.random() * 30;
            this.y = groundY - this.height;
        } else if (type === 'ramp') {
            this.width = CONFIG.RAMP_WIDTH;
            this.height = 40 + Math.random() * 30;
            this.y = groundY;
        } else if (type === 'gap') {
            this.width = 80 + Math.random() * 60;
            this.height = CONFIG.GROUND_HEIGHT;
            this.y = groundY;
        } else if (type === 'rock') {
            this.width = 40 + Math.random() * 30;
            this.height = 30 + Math.random() * 25;
            this.y = groundY - this.height;
        }
    }

    update() {
        this.x -= CONFIG.SCROLL_SPEED;
    }

    draw(ctx) {
        if (this.type === 'platform') {
            this.drawPlatform(ctx);
        } else if (this.type === 'ramp') {
            this.drawRamp(ctx);
        } else if (this.type === 'gap') {
            this.drawGap(ctx);
        } else if (this.type === 'rock') {
            this.drawRock(ctx);
        }
    }

    drawPlatform(ctx) {
        // Wooden platform
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#654321');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Wood grain lines
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i, this.y + this.height);
            ctx.stroke();
        }

        // Top edge
        ctx.fillStyle = '#9A7B4F';
        ctx.fillRect(this.x, this.y, this.width, 4);
    }

    drawRamp(ctx) {
        // Draw ramp
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y - this.height);
        ctx.closePath();
        ctx.fill();

        // Ramp surface
        ctx.strokeStyle = '#6B5344';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y - this.height);
        ctx.stroke();

        // Support struts
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 3;
        for (let i = 1; i < 4; i++) {
            const px = this.x + (this.width / 4) * i;
            const py = this.y - (this.height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(px, this.y);
            ctx.lineTo(px, py);
            ctx.stroke();
        }
    }

    drawGap(ctx) {
        // Draw pit/gap
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Darkness gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    drawRock(ctx) {
        // Desert rock
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.1, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height * 0.6);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.2);
        ctx.lineTo(this.x + this.width * 0.5, this.y);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.15);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.5);
        ctx.lineTo(this.x + this.width * 0.9, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#6B5344';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    isOffscreen() {
        return this.x + this.width < 0;
    }

    getTopY() {
        if (this.type === 'ramp') {
            // Return the slope
            return this.y - this.height;
        } else if (this.type === 'gap') {
            return this.game.canvas.height; // Fall through
        }
        return this.y;
    }

    getBounds() {
        if (this.type === 'gap') {
            return {
                x: this.x + 10,
                y: this.y + 20,
                width: this.width - 20,
                height: this.height - 20
            };
        }
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// ============================================
// DECORATIVE ELEMENTS
// ============================================
class Cactus {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset(true);
    }

    reset(initial = false) {
        this.x = initial ? Math.random() * this.canvas.width : this.canvas.width + 50;
        this.y = this.canvas.height - CONFIG.GROUND_HEIGHT;
        this.height = 40 + Math.random() * 60;
        this.hasArms = Math.random() > 0.5;
    }

    update() {
        this.x -= CONFIG.SCROLL_SPEED * 0.5; // Background parallax
        if (this.x + 30 < 0) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#228B22';

        // Main trunk
        ctx.fillRect(this.x, this.y - this.height, 15, this.height);

        if (this.hasArms) {
            // Left arm
            ctx.fillRect(this.x - 15, this.y - this.height * 0.6, 15, 8);
            ctx.fillRect(this.x - 15, this.y - this.height * 0.8, 8, this.height * 0.2 + 8);

            // Right arm
            ctx.fillRect(this.x + 15, this.y - this.height * 0.4, 15, 8);
            ctx.fillRect(this.x + 22, this.y - this.height * 0.6, 8, this.height * 0.2 + 8);
        }
    }
}

class Mountain {
    constructor(canvas, layer) {
        this.canvas = canvas;
        this.layer = layer; // 0 = far, 1 = mid, 2 = near
        this.reset(true);
    }

    reset(initial = false) {
        const baseX = initial ? Math.random() * this.canvas.width : this.canvas.width;
        this.x = baseX;
        this.width = 150 + Math.random() * 200 + this.layer * 50;
        this.height = 80 + Math.random() * 100 + this.layer * 30;
        this.y = this.canvas.height - CONFIG.GROUND_HEIGHT;

        // Color based on layer (further = lighter)
        const shade = 100 + (2 - this.layer) * 40;
        this.color = `rgb(${shade}, ${shade - 20}, ${shade - 30})`;
    }

    update() {
        const speed = CONFIG.SCROLL_SPEED * (0.1 + this.layer * 0.1);
        this.x -= speed;
        if (this.x + this.width < 0) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y - this.height);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.closePath();
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

        this.bike = null;
        this.obstacles = [];
        this.cacti = [];
        this.mountains = [];

        this.lastObstacleSpawn = 0;
        this.engineSoundTimer = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupUI();
        this.setupInput();
        this.initBackground();

        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.bike) {
            this.bike.groundY = this.canvas.height - CONFIG.GROUND_HEIGHT;
        }
    }

    initBackground() {
        // Mountains (3 layers)
        this.mountains = [];
        for (let layer = 0; layer < 3; layer++) {
            for (let i = 0; i < 3; i++) {
                this.mountains.push(new Mountain(this.canvas, layer));
            }
        }

        // Cacti
        this.cacti = [];
        for (let i = 0; i < 5; i++) {
            this.cacti.push(new Cactus(this.canvas));
        }
    }

    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
    }

    setupInput() {
        const handleInput = (e) => {
            e.preventDefault();
            this.audio.init();

            if (this.state === 'playing') {
                this.bike.jump();
            }
        };

        this.canvas.addEventListener('touchstart', handleInput, { passive: false });
        this.canvas.addEventListener('mousedown', handleInput);

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                this.audio.init();
                if (this.state === 'playing') {
                    this.bike.jump();
                } else if (this.state === 'menu') {
                    this.startGame();
                }
            }
        });
    }

    startGame() {
        this.state = 'playing';
        this.distance = 0;
        this.obstacles = [];
        this.lastObstacleSpawn = Date.now();

        this.bike = new Motorcycle(this);

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
        const spawnRate = Math.max(1200, CONFIG.OBSTACLE_SPAWN_RATE - this.distance * 0.5);

        if (now - this.lastObstacleSpawn < spawnRate) return;
        this.lastObstacleSpawn = now;

        const types = ['rock', 'rock', 'gap', 'platform', 'ramp'];
        const type = types[Math.floor(Math.random() * types.length)];

        this.obstacles.push(new Obstacle(this, type, this.canvas.width + 50));
    }

    checkCollisions() {
        const bikeBounds = this.bike.getBounds();

        for (const obstacle of this.obstacles) {
            const obsBounds = obstacle.getBounds();

            // Check if bike is in obstacle area
            if (bikeBounds.x < obsBounds.x + obsBounds.width &&
                bikeBounds.x + bikeBounds.width > obsBounds.x) {

                if (obstacle.type === 'gap') {
                    // Check if falling into gap
                    if (bikeBounds.y + bikeBounds.height > obsBounds.y) {
                        return true;
                    }
                } else if (obstacle.type === 'rock') {
                    // Check collision with rock
                    if (bikeBounds.y + bikeBounds.height > obsBounds.y &&
                        bikeBounds.y < obsBounds.y + obsBounds.height) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getGroundLevel() {
        let groundY = this.canvas.height - CONFIG.GROUND_HEIGHT;

        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'platform' || obstacle.type === 'ramp') {
                const bikeCenterX = this.bike.x;

                if (bikeCenterX > obstacle.x && bikeCenterX < obstacle.x + obstacle.width) {
                    if (obstacle.type === 'platform') {
                        groundY = Math.min(groundY, obstacle.y);
                    } else if (obstacle.type === 'ramp') {
                        // Calculate ramp height at bike position
                        const progress = (bikeCenterX - obstacle.x) / obstacle.width;
                        const rampY = obstacle.y - obstacle.height * progress;
                        groundY = Math.min(groundY, rampY);
                    }
                }
            } else if (obstacle.type === 'gap') {
                const bikeCenterX = this.bike.x;
                if (bikeCenterX > obstacle.x && bikeCenterX < obstacle.x + obstacle.width) {
                    groundY = this.canvas.height + 100; // Fall through
                }
            }
        }

        return groundY;
    }

    updateHUD() {
        document.getElementById('distance-display').textContent = this.distance + 'm';
        const speed = Math.floor(60 + this.distance * 0.1);
        document.getElementById('speed-display').textContent = Math.min(speed, 200) + ' km/h';
    }

    update() {
        // Update background
        this.mountains.forEach(m => m.update());
        this.cacti.forEach(c => c.update());

        if (this.state !== 'playing') return;

        // Update distance
        this.distance += Math.floor(CONFIG.SCROLL_SPEED * 0.5);

        // Milestone sound
        if (this.distance % 500 === 0 && this.distance > 0) {
            this.audio.milestone();
        }

        // Engine sound
        this.engineSoundTimer++;
        if (this.engineSoundTimer % 10 === 0) {
            this.audio.engine();
        }

        // Spawn obstacles
        this.spawnObstacle();

        // Get current ground level
        const groundLevel = this.getGroundLevel();

        // Update bike
        this.bike.update(groundLevel);

        // Update obstacles
        this.obstacles.forEach(o => o.update());
        this.obstacles = this.obstacles.filter(o => !o.isOffscreen());

        // Check collisions
        if (this.checkCollisions()) {
            this.gameOver();
            return;
        }

        // Check if fell off screen
        if (this.bike.y > this.canvas.height + 50) {
            this.gameOver();
            return;
        }

        this.updateHUD();
    }

    drawBackground() {
        // Sky gradient (desert)
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.4, '#B8D4E8');
        skyGradient.addColorStop(0.7, '#E8D4B8');
        skyGradient.addColorStop(1, '#D4A574');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Sun
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 100, 80, 50, 0, Math.PI * 2);
        this.ctx.fill();

        // Sun glow
        const sunGlow = this.ctx.createRadialGradient(
            this.canvas.width - 100, 80, 50,
            this.canvas.width - 100, 80, 120
        );
        sunGlow.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        sunGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = sunGlow;
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 100, 80, 120, 0, Math.PI * 2);
        this.ctx.fill();

        // Mountains
        this.mountains.sort((a, b) => a.layer - b.layer);
        this.mountains.forEach(m => m.draw(this.ctx));

        // Cacti
        this.cacti.forEach(c => c.draw(this.ctx));
    }

    drawGround() {
        const groundY = this.canvas.height - CONFIG.GROUND_HEIGHT;

        // Road
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, groundY, this.canvas.width, CONFIG.GROUND_HEIGHT);

        // Road surface texture
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(0, groundY, this.canvas.width, 10);

        // Road lines (dashed center line)
        this.ctx.strokeStyle = '#ffcc00';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([30, 20]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY + CONFIG.GROUND_HEIGHT / 2);
        this.ctx.lineTo(this.canvas.width, groundY + CONFIG.GROUND_HEIGHT / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Road edges
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, groundY, this.canvas.width, 3);
        this.ctx.fillRect(0, this.canvas.height - 3, this.canvas.width, 3);
    }

    draw() {
        this.drawBackground();
        this.drawGround();

        // Draw obstacles
        this.obstacles.forEach(o => o.draw(this.ctx));

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
