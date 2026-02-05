// ============================================
// FLAPPY SANDAL - A Greek Mythology Flappy Game
// ============================================

// Game Configuration
const CONFIG = {
    GRAVITY: 0.5,
    FLAP_STRENGTH: -9,
    PILLAR_SPEED: 3,
    PILLAR_GAP: 200,           // Vertical gap to fly through
    PILLAR_WIDTH: 80,
    PILLAR_SPACING: 350,       // Horizontal space BETWEEN pillars (not including width)
    GROUND_HEIGHT: 80,
    SANDAL_SIZE: 45
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

    flap() {
        this.playTone(400, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(500, 0.08, 'sine', 0.1), 50);
    }

    score() {
        this.playTone(600, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(800, 0.15, 'sine', 0.12), 100);
    }

    hit() {
        this.playTone(200, 0.3, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.15), 100);
    }

    medal() {
        this.playTone(523, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.15), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.15), 200);
        setTimeout(() => this.playTone(1047, 0.3, 'sine', 0.12), 300);
    }
}

// ============================================
// SANDAL (PLAYER)
// ============================================
class Sandal {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.x = this.game.canvas.width * 0.25;
        this.y = this.game.canvas.height / 2;
        this.velocity = 0;
        this.rotation = 0;
        this.size = CONFIG.SANDAL_SIZE;
        this.wingAngle = 0;
    }

    flap() {
        this.velocity = CONFIG.FLAP_STRENGTH;
        this.game.audio.flap();
    }

    update() {
        // Apply gravity
        this.velocity += CONFIG.GRAVITY;
        this.y += this.velocity;

        // Rotation based on velocity
        this.rotation = Math.min(Math.max(this.velocity * 3, -30), 90);

        // Wing animation
        this.wingAngle += 0.3;

        // Ceiling collision
        if (this.y < this.size / 2) {
            this.y = this.size / 2;
            this.velocity = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);

        // Draw sandal body (golden/brown shoe)
        const gradient = ctx.createLinearGradient(-this.size/2, -this.size/4, this.size/2, this.size/4);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.3, '#D2691E');
        gradient.addColorStop(0.7, '#CD853F');
        gradient.addColorStop(1, '#8B4513');

        // Sandal sole
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 5, this.size * 0.5, this.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sandal straps
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.3, 0);
        ctx.quadraticCurveTo(0, -this.size * 0.3, this.size * 0.3, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-this.size * 0.15, 5);
        ctx.lineTo(-this.size * 0.15, -this.size * 0.15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.size * 0.15, 5);
        ctx.lineTo(this.size * 0.15, -this.size * 0.15);
        ctx.stroke();

        // Wings (animated)
        const wingFlap = Math.sin(this.wingAngle) * 15;

        // Left wing
        ctx.save();
        ctx.translate(-this.size * 0.3, -this.size * 0.1);
        ctx.rotate((-45 + wingFlap) * Math.PI / 180);
        this.drawWing(ctx, true);
        ctx.restore();

        // Right wing
        ctx.save();
        ctx.translate(this.size * 0.3, -this.size * 0.1);
        ctx.rotate((45 - wingFlap) * Math.PI / 180);
        this.drawWing(ctx, false);
        ctx.restore();

        ctx.restore();
    }

    drawWing(ctx, isLeft) {
        const dir = isLeft ? -1 : 1;

        // Wing feathers
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;

        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(
                dir * (i * 4 - 8),
                -i * 3,
                6,
                15 - i * 2,
                dir * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
        }
    }

    getBounds() {
        return {
            x: this.x - this.size * 0.35,
            y: this.y - this.size * 0.15,
            width: this.size * 0.7,
            height: this.size * 0.4
        };
    }
}

// ============================================
// CORINTHIAN PILLAR
// ============================================
class Pillar {
    constructor(game, x) {
        this.game = game;
        this.x = x;
        this.width = CONFIG.PILLAR_WIDTH;

        // Random gap position
        const minGapY = 150;
        const maxGapY = game.canvas.height - CONFIG.GROUND_HEIGHT - 150;
        this.gapY = minGapY + Math.random() * (maxGapY - minGapY);
        this.gapHeight = CONFIG.PILLAR_GAP;

        this.passed = false;
    }

    update() {
        this.x -= CONFIG.PILLAR_SPEED;
    }

    draw(ctx) {
        const topHeight = this.gapY - this.gapHeight / 2;
        const bottomY = this.gapY + this.gapHeight / 2;
        const bottomHeight = this.game.canvas.height - CONFIG.GROUND_HEIGHT - bottomY;

        // Draw top pillar (upside down)
        this.drawCorinthianPillar(ctx, this.x, 0, this.width, topHeight, true);

        // Draw bottom pillar
        this.drawCorinthianPillar(ctx, this.x, bottomY, this.width, bottomHeight, false);
    }

    drawCorinthianPillar(ctx, x, y, width, height, isTop) {
        if (height <= 0) return;

        const capitalHeight = Math.min(40, height * 0.15);
        const baseHeight = Math.min(30, height * 0.1);
        const shaftHeight = height - capitalHeight - baseHeight;

        if (isTop) {
            // Upside down pillar
            // Base (at top, which is actually the visual bottom)
            this.drawPillarBase(ctx, x, y, width, baseHeight);

            // Shaft
            this.drawPillarShaft(ctx, x, y + baseHeight, width, shaftHeight);

            // Capital (at bottom, which is the visual top - inverted)
            this.drawPillarCapital(ctx, x, y + baseHeight + shaftHeight, width, capitalHeight, true);
        } else {
            // Normal pillar
            // Capital at top
            this.drawPillarCapital(ctx, x, y, width, capitalHeight, false);

            // Shaft
            this.drawPillarShaft(ctx, x, y + capitalHeight, width, shaftHeight);

            // Base at bottom
            this.drawPillarBase(ctx, x, y + capitalHeight + shaftHeight, width, baseHeight);
        }
    }

    drawPillarCapital(ctx, x, y, width, height, inverted) {
        if (height < 5) return;

        // Corinthian capital - ornate with acanthus leaves
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, '#C9B896');
        gradient.addColorStop(0.5, '#E8DCC4');
        gradient.addColorStop(1, '#C9B896');

        ctx.fillStyle = gradient;

        // Main capital body
        ctx.beginPath();
        if (inverted) {
            ctx.moveTo(x - 10, y);
            ctx.lineTo(x + width + 10, y);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x, y + height);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width + 10, y + height);
            ctx.lineTo(x - 10, y + height);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Decorative volutes (scrolls)
        ctx.fillStyle = '#D4C4A8';
        const scrollY = inverted ? y + 5 : y + height - 10;

        // Left scroll
        ctx.beginPath();
        ctx.arc(x + 8, scrollY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right scroll
        ctx.beginPath();
        ctx.arc(x + width - 8, scrollY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Acanthus leaf hints
        ctx.strokeStyle = '#A0927B';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const leafX = x + width * 0.25 + i * width * 0.25;
            const leafY = inverted ? y + height * 0.6 : y + height * 0.4;
            ctx.beginPath();
            ctx.moveTo(leafX, leafY);
            ctx.quadraticCurveTo(leafX, leafY + (inverted ? -10 : 10), leafX + 5, leafY + (inverted ? -15 : 15));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(leafX, leafY);
            ctx.quadraticCurveTo(leafX, leafY + (inverted ? -10 : 10), leafX - 5, leafY + (inverted ? -15 : 15));
            ctx.stroke();
        }
    }

    drawPillarShaft(ctx, x, y, width, height) {
        if (height <= 0) return;

        // Main shaft with fluting
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, '#B8A882');
        gradient.addColorStop(0.2, '#E8DCC4');
        gradient.addColorStop(0.4, '#F5EDE0');
        gradient.addColorStop(0.6, '#E8DCC4');
        gradient.addColorStop(0.8, '#D4C4A8');
        gradient.addColorStop(1, '#B8A882');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Fluting (vertical grooves)
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
        ctx.lineWidth = 1;
        const fluteCount = 8;
        for (let i = 1; i < fluteCount; i++) {
            const fluteX = x + (width / fluteCount) * i;
            ctx.beginPath();
            ctx.moveTo(fluteX, y);
            ctx.lineTo(fluteX, y + height);
            ctx.stroke();
        }

        // Edge shadows
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
    }

    drawPillarBase(ctx, x, y, width, height) {
        if (height < 3) return;

        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, '#A89878');
        gradient.addColorStop(0.5, '#D4C4A8');
        gradient.addColorStop(1, '#A89878');

        ctx.fillStyle = gradient;

        // Stepped base
        const steps = 2;
        const stepHeight = height / steps;

        for (let i = 0; i < steps; i++) {
            const stepWidth = width + (steps - i) * 8;
            const stepX = x - (stepWidth - width) / 2;
            ctx.fillRect(stepX, y + i * stepHeight, stepWidth, stepHeight);
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 1;
            ctx.strokeRect(stepX, y + i * stepHeight, stepWidth, stepHeight);
        }
    }

    getTopBounds() {
        return {
            x: this.x,
            y: 0,
            width: this.width,
            height: this.gapY - this.gapHeight / 2
        };
    }

    getBottomBounds() {
        const bottomY = this.gapY + this.gapHeight / 2;
        return {
            x: this.x,
            y: bottomY,
            width: this.width,
            height: this.game.canvas.height - CONFIG.GROUND_HEIGHT - bottomY
        };
    }

    isOffscreen() {
        return this.x + this.width < 0;
    }
}

// ============================================
// CLOUD
// ============================================
class Cloud {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset(true);
    }

    reset(initial = false) {
        this.x = initial ? Math.random() * this.canvas.width : this.canvas.width + 100;
        this.y = Math.random() * (this.canvas.height * 0.4) + 30;
        this.width = 60 + Math.random() * 80;
        this.speed = 0.5 + Math.random() * 0.5;
        this.opacity = 0.6 + Math.random() * 0.4;
    }

    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;

        // Draw fluffy cloud
        const y = this.y;
        ctx.beginPath();
        ctx.arc(this.x, y, this.width * 0.25, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.25, y - this.width * 0.1, this.width * 0.3, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.55, y, this.width * 0.25, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.3, y + this.width * 0.1, this.width * 0.2, 0, Math.PI * 2);
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
        this.state = 'menu'; // menu, playing, gameover
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappySandalHighScore') || '0');

        this.sandal = null;
        this.pillars = [];
        this.clouds = [];

        this.lastPillarX = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupUI();
        this.setupInput();
        this.initClouds();

        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.sandal) {
            this.sandal.x = this.canvas.width * 0.25;
        }
    }

    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push(new Cloud(this.canvas));
        }
    }

    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
    }

    setupInput() {
        // Touch/click to flap
        const handleInput = (e) => {
            e.preventDefault();
            this.audio.init();

            if (this.state === 'playing') {
                this.sandal.flap();
            }
        };

        this.canvas.addEventListener('touchstart', handleInput, { passive: false });
        this.canvas.addEventListener('mousedown', handleInput);

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                this.audio.init();
                if (this.state === 'playing') {
                    this.sandal.flap();
                } else if (this.state === 'menu') {
                    this.startGame();
                }
            }
        });
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.pillars = [];
        // Set to 0 so first pillar spawns immediately off-screen
        // Player still has time as pillar travels from right edge
        this.lastPillarX = 0;

        this.sandal = new Sandal(this);

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('score-display').textContent = '0';
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.hit();

        // Check for new high score
        const isNewHighScore = this.score > this.highScore;
        if (isNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('flappySandalHighScore', this.highScore.toString());
            setTimeout(() => this.audio.medal(), 500);
        }

        // Determine medal
        let medal = '';
        if (this.score >= 40) medal = '🏆'; // Gold trophy
        else if (this.score >= 30) medal = '🥇';
        else if (this.score >= 20) medal = '🥈';
        else if (this.score >= 10) medal = '🥉';
        else if (this.score >= 5) medal = '🏅';

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('medal-display').textContent = medal;

        if (isNewHighScore) {
            document.getElementById('high-score').classList.add('new-highscore');
        } else {
            document.getElementById('high-score').classList.remove('new-highscore');
        }

        document.getElementById('gameover-screen').classList.remove('hidden');
    }

    spawnPillars() {
        // Calculate where the next pillar should spawn
        const spawnX = this.canvas.width + 50;

        // Only spawn if the last pillar has moved far enough left
        // (last pillar X + pillar width + spacing) should be less than spawn position
        if (this.lastPillarX + CONFIG.PILLAR_WIDTH + CONFIG.PILLAR_SPACING > spawnX) {
            return; // Wait for more space
        }

        const pillar = new Pillar(this, spawnX);
        this.pillars.push(pillar);
        this.lastPillarX = spawnX;
    }

    checkCollisions() {
        const sandalBounds = this.sandal.getBounds();

        // Ground collision
        if (this.sandal.y + this.sandal.size / 2 > this.canvas.height - CONFIG.GROUND_HEIGHT) {
            return true;
        }

        // Pillar collisions
        for (const pillar of this.pillars) {
            const topBounds = pillar.getTopBounds();
            const bottomBounds = pillar.getBottomBounds();

            if (this.rectIntersect(sandalBounds, topBounds) ||
                this.rectIntersect(sandalBounds, bottomBounds)) {
                return true;
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

    checkScoring() {
        for (const pillar of this.pillars) {
            if (!pillar.passed && pillar.x + pillar.width < this.sandal.x) {
                pillar.passed = true;
                this.score++;
                this.audio.score();
                document.getElementById('score-display').textContent = this.score;

                // Show score popup
                this.showScorePopup();
            }
        }
    }

    showScorePopup() {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = '+1';
        popup.style.left = (this.sandal.x + 30) + 'px';
        popup.style.top = (this.sandal.y - 30) + 'px';
        document.getElementById('game-container').appendChild(popup);

        setTimeout(() => popup.remove(), 800);
    }

    update() {
        // Update clouds always
        this.clouds.forEach(cloud => cloud.update());

        if (this.state !== 'playing') return;

        // Update sandal
        this.sandal.update();

        // Spawn and update pillars
        this.spawnPillars();

        this.pillars.forEach(pillar => pillar.update());
        this.pillars = this.pillars.filter(pillar => !pillar.isOffscreen());

        // Track last pillar X for spawning
        if (this.pillars.length > 0) {
            this.lastPillarX = Math.max(...this.pillars.map(p => p.x));
        }

        // Check collisions
        if (this.checkCollisions()) {
            this.gameOver();
            return;
        }

        // Check scoring
        this.checkScoring();
    }

    drawBackground() {
        // Sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#B0E0E6');
        skyGradient.addColorStop(1, '#F0E68C');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Sun
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 80, 80, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // Sun glow
        const sunGlow = this.ctx.createRadialGradient(
            this.canvas.width - 80, 80, 40,
            this.canvas.width - 80, 80, 100
        );
        sunGlow.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        sunGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = sunGlow;
        this.ctx.fillRect(this.canvas.width - 180, 0, 200, 200);

        // Clouds
        this.clouds.forEach(cloud => cloud.draw(this.ctx));
    }

    drawGround() {
        const groundY = this.canvas.height - CONFIG.GROUND_HEIGHT;

        // Grass
        const grassGradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        grassGradient.addColorStop(0, '#7CBA5F');
        grassGradient.addColorStop(0.3, '#5A9A3F');
        grassGradient.addColorStop(1, '#3D6B2A');
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, groundY, this.canvas.width, CONFIG.GROUND_HEIGHT);

        // Grass top edge
        this.ctx.fillStyle = '#8FD573';
        this.ctx.fillRect(0, groundY, this.canvas.width, 5);

        // Ground details - stone pattern
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.fillRect(i, groundY + 20, 35, 3);
            this.ctx.fillRect(i + 20, groundY + 40, 35, 3);
            this.ctx.fillRect(i, groundY + 60, 35, 3);
        }
    }

    draw() {
        // Clear and draw background
        this.drawBackground();

        // Draw pillars
        this.pillars.forEach(pillar => pillar.draw(this.ctx));

        // Draw ground
        this.drawGround();

        // Draw sandal
        if (this.sandal && (this.state === 'playing' || this.state === 'gameover')) {
            this.sandal.draw(this.ctx);
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
