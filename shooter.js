// ============================================
// SPACE LANE SHOOTER - Mobile Web Game
// ============================================

// Game Configuration
const CONFIG = {
    // Player settings
    PLAYER_SPEED: 8,
    PLAYER_SIZE: 40,
    PLAYER_INITIAL_HEALTH: 3,

    // Shooting
    BASE_FIRE_RATE: 300, // ms between shots
    BULLET_SPEED: 12,

    // Enemies
    ENEMY_SPAWN_RATE: 1500, // ms
    ENEMY_BASE_SPEED: 3,
    ENEMY_SIZE: 35,

    // Power-ups
    POWERUP_SPAWN_RATE: 8000, // ms
    POWERUP_SPEED: 2,
    POWERUP_SIZE: 30,

    // Difficulty scaling
    DIFFICULTY_INCREASE_INTERVAL: 15000, // ms
    MAX_DIFFICULTY: 10
};

// Character definitions
const CHARACTERS = [
    { id: 'fighter', emoji: '🚀', name: 'Fighter', color: '#00ffff', unlocked: true },
    { id: 'warrior', emoji: '🛸', name: 'Warrior', color: '#ff00ff', unlocked: true },
    { id: 'blaster', emoji: '🔥', name: 'Blaster', color: '#ff6600', unlocked: false, scoreRequired: 1000 },
    { id: 'phantom', emoji: '👻', name: 'Phantom', color: '#9900ff', unlocked: false, scoreRequired: 2500 },
    { id: 'dragon', emoji: '🐉', name: 'Dragon', color: '#00ff00', unlocked: false, scoreRequired: 5000 },
    { id: 'star', emoji: '⭐', name: 'Star Lord', color: '#ffff00', unlocked: false, scoreRequired: 10000 }
];

// Weapon definitions (with ammo counts for special weapons)
const WEAPONS = {
    basic: {
        name: 'Basic',
        fireRate: 300,
        bulletCount: 1,
        spread: 0,
        bulletColor: '#00ffff',
        damage: 1,
        ammo: Infinity // Basic weapon has unlimited ammo
    },
    double: {
        name: 'Double Shot',
        fireRate: 300,
        bulletCount: 2,
        spread: 15,
        bulletColor: '#ffff00',
        damage: 1,
        ammo: 120
    },
    triple: {
        name: 'Triple Shot',
        fireRate: 350,
        bulletCount: 3,
        spread: 20,
        bulletColor: '#ff00ff',
        damage: 1,
        ammo: 100
    },
    rapid: {
        name: 'Rapid Fire',
        fireRate: 100,
        bulletCount: 1,
        spread: 5,
        bulletColor: '#ff6600',
        damage: 1,
        ammo: 200
    },
    laser: {
        name: 'Laser Beam',
        fireRate: 50,
        bulletCount: 1,
        spread: 0,
        bulletColor: '#ff0000',
        damage: 0.5,
        isLaser: true,
        ammo: 400
    },
    spread: {
        name: 'Spread Shot',
        fireRate: 400,
        bulletCount: 5,
        spread: 40,
        bulletColor: '#00ff00',
        damage: 1,
        ammo: 80
    },
    homing: {
        name: 'Homing Missile',
        fireRate: 600,
        bulletCount: 1,
        spread: 0,
        bulletColor: '#ff3399',
        damage: 3,
        isHoming: true,
        ammo: 60
    },
    plasma: {
        name: 'Plasma Wave',
        fireRate: 500,
        bulletCount: 1,
        spread: 0,
        bulletColor: '#9933ff',
        damage: 2,
        isPlasma: true,
        ammo: 50
    },
    piercing: {
        name: 'Piercing Shot',
        fireRate: 400,
        bulletCount: 1,
        spread: 0,
        bulletColor: '#00ffcc',
        damage: 1.5,
        isPiercing: true,
        ammo: 80
    },
    burst: {
        name: 'Burst Fire',
        fireRate: 150,
        bulletCount: 3,
        spread: 5,
        bulletColor: '#ffcc00',
        damage: 1,
        isBurst: true,
        burstDelay: 50,
        ammo: 120
    }
};

// Power-up types
const POWERUP_TYPES = [
    { type: 'weapon', weapons: ['double', 'triple', 'rapid', 'laser', 'spread', 'homing', 'plasma', 'piercing', 'burst'], emoji: '🔫', color: '#ffff00' },
    { type: 'health', emoji: '❤️', color: '#ff0000' },
    { type: 'maxhealth', emoji: '💖', color: '#ff69b4' }, // Increases max health permanently
    { type: 'shield', emoji: '🛡️', color: '#00ffff' },
    { type: 'score', emoji: '💎', color: '#ff00ff', points: 500 },
    { type: 'bomb', emoji: '💥', color: '#ff6600' }
];

// Enemy types
const ENEMY_TYPES = [
    { id: 'basic', emoji: '👾', health: 1, speed: 1, points: 10, size: 35 },
    { id: 'fast', emoji: '🦇', health: 1, speed: 2, points: 15, size: 30 },
    { id: 'tank', emoji: '🤖', health: 3, speed: 0.5, points: 30, size: 45, canShoot: true, fireRate: 4000, bulletPattern: 'single' },
    { id: 'zigzag', emoji: '🦑', health: 2, speed: 1, points: 25, size: 35, pattern: 'zigzag', canShoot: true, fireRate: 3000, bulletPattern: 'spread' },
    { id: 'boss', emoji: '👹', health: 20, speed: 0.25, points: 500, size: 80, isBoss: true, pattern: 'boss', canShoot: true, fireRate: 800, bulletPattern: 'boss' }
];

// Boss spawn thresholds (score milestones)
const BOSS_SPAWN_SCORES = [500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000];

// ============================================
// AUDIO SYSTEM (Web Audio API)
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
            console.log('Audio not available');
            this.enabled = false;
        }
    }

    playTone(frequency, duration, type = 'square', volume = 0.1) {
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

    shoot() {
        this.playTone(800, 0.05, 'square', 0.05);
    }

    hit() {
        this.playTone(200, 0.1, 'sawtooth', 0.1);
    }

    explosion() {
        this.playTone(100, 0.3, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(80, 0.2, 'sawtooth', 0.1), 50);
    }

    powerup() {
        this.playTone(600, 0.1, 'sine', 0.1);
        setTimeout(() => this.playTone(800, 0.1, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(1000, 0.15, 'sine', 0.1), 200);
    }

    damage() {
        this.playTone(150, 0.2, 'sawtooth', 0.15);
    }

    gameOver() {
        this.playTone(400, 0.3, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(300, 0.3, 'sawtooth', 0.12), 300);
        setTimeout(() => this.playTone(200, 0.5, 'sawtooth', 0.1), 600);
    }

    jumpScare() {
        // Loud, startling sound for bomb explosion
        this.playTone(150, 0.5, 'sawtooth', 0.4);
        this.playTone(100, 0.5, 'square', 0.3);
        setTimeout(() => {
            this.playTone(80, 0.3, 'sawtooth', 0.35);
            this.playTone(200, 0.2, 'square', 0.3);
        }, 100);
        setTimeout(() => {
            this.playTone(60, 0.4, 'sawtooth', 0.3);
        }, 200);
    }

    bossWarning() {
        // Ominous warning sound when boss appears
        this.playTone(100, 0.5, 'sine', 0.2);
        setTimeout(() => this.playTone(90, 0.5, 'sine', 0.2), 500);
        setTimeout(() => this.playTone(80, 0.8, 'sine', 0.25), 1000);
    }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
class Particle {
    constructor(x, y, color, velocity, size, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life--;
        this.velocity.y += 0.1; // gravity
    }

    draw(ctx) {
        // No fading - keep particles fully visible
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push(new Particle(
                x, y, color,
                { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                Math.random() * 4 + 2,
                Math.random() * 30 + 20
            ));
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

// ============================================
// STAR BACKGROUND
// ============================================
class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.stars = [];
        this.init();
    }

    init() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random()
            });
        }
    }

    update() {
        this.stars.forEach(star => {
            star.y += star.speed;
            star.brightness = 0.3 + Math.sin(Date.now() * 0.005 + star.x) * 0.3;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
    }

    draw(ctx) {
        this.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    resize() {
        this.init();
    }
}

// ============================================
// PLAYER CLASS
// ============================================
class Player {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.x = this.game.canvas.width / 2;
        this.y = this.game.canvas.height - 100;
        this.width = CONFIG.PLAYER_SIZE;
        this.height = CONFIG.PLAYER_SIZE;
        this.health = CONFIG.PLAYER_INITIAL_HEALTH;
        this.maxHealth = CONFIG.PLAYER_INITIAL_HEALTH;
        this.weapon = 'basic';
        this.ammo = Infinity; // Current ammo for weapon
        this.lastShot = 0;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.targetX = this.x;
        this.targetY = this.y;
    }

    setWeapon(weaponName) {
        this.weapon = weaponName;
        this.ammo = WEAPONS[weaponName].ammo;
    }

    setCharacter(character) {
        this.character = character;
    }

    update(deltaTime) {
        // Smooth movement towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.x += dx * 0.15;
        this.y += dy * 0.15;

        // Keep within bounds
        this.x = Math.max(this.width / 2, Math.min(this.game.canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(this.game.canvas.height - this.height / 2, this.y));

        // Update shield
        if (this.shieldActive) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
            }
        }

        // Update invincibility
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Auto-fire
        this.shoot();
    }

    shoot() {
        const weapon = WEAPONS[this.weapon];
        const now = Date.now();

        if (now - this.lastShot < weapon.fireRate) return;
        this.lastShot = now;

        // Check ammo for special weapons
        if (this.weapon !== 'basic') {
            if (this.ammo <= 0) {
                // Out of ammo, revert to basic weapon
                this.weapon = 'basic';
                this.ammo = Infinity;
                this.game.showNotification('Out of ammo!');
                return;
            }
            this.ammo--;
        }

        this.game.audio.shoot();

        // Special handling for plasma wave
        if (weapon.isPlasma) {
            const bullet = {
                x: this.x,
                y: this.y - this.height / 2,
                vx: 0,
                vy: -CONFIG.BULLET_SPEED * 0.8,
                color: weapon.bulletColor,
                damage: weapon.damage,
                isPlasma: true,
                width: 80,
                height: 15
            };
            this.game.bullets.push(bullet);
            return;
        }

        // Special handling for burst fire
        if (weapon.isBurst) {
            for (let b = 0; b < 3; b++) {
                setTimeout(() => {
                    if (this.game.state !== 'playing') return;
                    const bullet = {
                        x: this.x,
                        y: this.y - this.height / 2,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -CONFIG.BULLET_SPEED,
                        color: weapon.bulletColor,
                        damage: weapon.damage,
                        width: 6,
                        height: 12
                    };
                    this.game.bullets.push(bullet);
                }, b * weapon.burstDelay);
            }
            return;
        }

        const bulletCount = weapon.bulletCount;
        const spreadAngle = weapon.spread;

        for (let i = 0; i < bulletCount; i++) {
            let angle = -90; // straight up
            if (bulletCount > 1) {
                angle += (i - (bulletCount - 1) / 2) * spreadAngle / (bulletCount - 1 || 1);
            }
            // Add some randomness for spread weapons
            angle += (Math.random() - 0.5) * weapon.spread * 0.2;

            const rad = angle * Math.PI / 180;
            const bullet = {
                x: this.x,
                y: this.y - this.height / 2,
                vx: Math.cos(rad) * CONFIG.BULLET_SPEED,
                vy: Math.sin(rad) * CONFIG.BULLET_SPEED,
                color: weapon.bulletColor,
                damage: weapon.damage,
                isLaser: weapon.isLaser || false,
                isHoming: weapon.isHoming || false,
                isPiercing: weapon.isPiercing || false,
                width: weapon.isLaser ? 4 : (weapon.isHoming ? 10 : 6),
                height: weapon.isLaser ? 20 : (weapon.isHoming ? 16 : 12)
            };
            this.game.bullets.push(bullet);
        }
    }

    takeDamage() {
        if (this.invincible || this.shieldActive) return false;

        this.health--;
        this.game.audio.damage();
        this.game.particles.emit(this.x, this.y, this.character.color, 15);

        // Brief invincibility after taking damage
        this.invincible = true;
        this.invincibleTimer = 1500;

        if (this.health <= 0) {
            return true; // Player died
        }
        return false;
    }

    activateShield(duration = 5000) {
        this.shieldActive = true;
        this.shieldTimer = duration;
    }

    draw(ctx) {
        ctx.save();

        // Flicker when invincible
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw shield if active
        if (this.shieldActive) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 0.8, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.fill();
        }

        // Draw character emoji
        ctx.font = `${this.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.character.emoji, this.x, this.y);

        // Draw engine glow
        ctx.fillStyle = this.character.color;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height / 2 + 5, 8, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    moveTo(x, y) {
        this.targetX = x;
        if (y !== undefined) {
            // Position ship above finger so it's always visible
            this.targetY = y - 60;
        }
    }
}

// ============================================
// BULLET CLASS
// ============================================
class Bullet {
    static update(bullet, enemies) {
        // Homing missiles track nearest enemy
        if (bullet.isHoming && enemies && enemies.length > 0) {
            let nearestEnemy = null;
            let nearestDist = Infinity;

            for (const enemy of enemies) {
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                const dx = nearestEnemy.x - bullet.x;
                const dy = nearestEnemy.y - bullet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Gradually turn towards target
                const targetVx = (dx / dist) * CONFIG.BULLET_SPEED * 0.9;
                const targetVy = (dy / dist) * CONFIG.BULLET_SPEED * 0.9;

                bullet.vx += (targetVx - bullet.vx) * 0.1;
                bullet.vy += (targetVy - bullet.vy) * 0.1;
            }
        }

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    }

    static draw(ctx, bullet) {
        ctx.fillStyle = bullet.color;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 10;

        if (bullet.isLaser) {
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
        } else if (bullet.isPlasma) {
            // Plasma wave - wide wavy rectangle
            ctx.beginPath();
            const waveOffset = Math.sin(Date.now() * 0.02) * 5;
            ctx.ellipse(bullet.x, bullet.y + waveOffset, bullet.width / 2, bullet.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Inner glow
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.ellipse(bullet.x, bullet.y + waveOffset, bullet.width / 3, bullet.height / 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (bullet.isHoming) {
            // Homing missile - pointed shape
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            const angle = Math.atan2(bullet.vy, bullet.vx);
            ctx.rotate(angle + Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height / 2);
            ctx.lineTo(-bullet.width / 2, bullet.height / 2);
            ctx.lineTo(bullet.width / 2, bullet.height / 2);
            ctx.closePath();
            ctx.fill();
            // Trail
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.ellipse(0, bullet.height / 2 + 5, 4, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (bullet.isPiercing) {
            // Piercing shot - elongated with trail
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height, bullet.width, bullet.height * 2);
            // Bright tip
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y - bullet.height, bullet.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(bullet.x, bullet.y, bullet.width / 2, bullet.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    static isOffscreen(bullet, canvas) {
        return bullet.y < -20 || bullet.y > canvas.height + 20 ||
               bullet.x < -20 || bullet.x > canvas.width + 20;
    }
}

// ============================================
// ENEMY CLASS
// ============================================
class Enemy {
    constructor(game, type, x) {
        this.game = game;
        this.type = type;
        this.x = x;
        this.y = -type.size;
        this.width = type.size;
        this.height = type.size;
        this.health = type.health;
        this.maxHealth = type.health;
        this.points = type.points;
        this.speed = type.speed * CONFIG.ENEMY_BASE_SPEED * (1 + game.difficulty * 0.1);
        this.pattern = type.pattern || 'straight';
        this.startX = x;
        this.time = 0;
        this.lastShot = 0;
        this.canShoot = type.canShoot || false;
        this.fireRate = type.fireRate || 2000;
        this.bulletPattern = type.bulletPattern || 'single';
    }

    update(deltaTime) {
        this.time += deltaTime;

        switch (this.pattern) {
            case 'zigzag':
                this.x = this.startX + Math.sin(this.time * 0.003) * 50;
                break;
            case 'boss':
                // Boss moves slowly side to side across the screen
                const centerX = this.game.canvas.width / 2;
                const amplitude = this.game.canvas.width / 3;
                this.x = centerX + Math.sin(this.time * 0.001) * amplitude;
                // Boss stops at a certain Y position and doesn't go off screen
                if (this.y < 120) {
                    this.y += this.speed;
                }
                break;
            case 'straight':
            default:
                break;
        }

        if (this.pattern !== 'boss') {
            this.y += this.speed;
        }

        // Enemy shooting
        if (this.canShoot && this.y > 0) {
            this.shoot();
        }
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.fireRate) return;
        this.lastShot = now;

        const bulletSpeed = 5;

        switch (this.bulletPattern) {
            case 'single':
                // Single shot straight down
                this.game.enemyBullets.push({
                    x: this.x,
                    y: this.y + this.height / 2,
                    vx: 0,
                    vy: bulletSpeed,
                    color: '#ff4444',
                    size: 8
                });
                break;

            case 'spread':
                // 3-way spread shot
                for (let i = -1; i <= 1; i++) {
                    const angle = 90 + i * 25; // degrees, 90 is straight down
                    const rad = angle * Math.PI / 180;
                    this.game.enemyBullets.push({
                        x: this.x,
                        y: this.y + this.height / 2,
                        vx: Math.cos(rad) * bulletSpeed,
                        vy: Math.sin(rad) * bulletSpeed,
                        color: '#ff66ff',
                        size: 6
                    });
                }
                break;

            case 'boss':
                // Boss has multiple attack patterns that cycle
                const patternIndex = Math.floor(this.time / 3000) % 3;

                if (patternIndex === 0) {
                    // Wide spread
                    for (let i = -2; i <= 2; i++) {
                        const angle = 90 + i * 20;
                        const rad = angle * Math.PI / 180;
                        this.game.enemyBullets.push({
                            x: this.x,
                            y: this.y + this.height / 2,
                            vx: Math.cos(rad) * bulletSpeed,
                            vy: Math.sin(rad) * bulletSpeed,
                            color: '#ff0000',
                            size: 10
                        });
                    }
                } else if (patternIndex === 1) {
                    // Aimed shot at player
                    const dx = this.game.player.x - this.x;
                    const dy = this.game.player.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    this.game.enemyBullets.push({
                        x: this.x,
                        y: this.y + this.height / 2,
                        vx: (dx / dist) * bulletSpeed * 1.2,
                        vy: (dy / dist) * bulletSpeed * 1.2,
                        color: '#ffff00',
                        size: 12
                    });
                } else {
                    // Circular burst
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        this.game.enemyBullets.push({
                            x: this.x,
                            y: this.y,
                            vx: Math.cos(angle) * bulletSpeed * 0.8,
                            vy: Math.sin(angle) * bulletSpeed * 0.8,
                            color: '#ff6600',
                            size: 8
                        });
                    }
                }
                break;
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        this.game.audio.hit();
        this.game.particles.emit(this.x, this.y, '#ff6600', 5);
        return this.health <= 0;
    }

    draw(ctx) {
        // Draw enemy emoji
        ctx.font = `${this.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.emoji, this.x, this.y);

        // Health bar for enemies with more than 1 health
        if (this.maxHealth > 1) {
            const barWidth = this.width;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth, barHeight);

            ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 10, barWidth * healthPercent, barHeight);
        }
    }

    isOffscreen() {
        return this.y > this.game.canvas.height + this.height;
    }
}

// ============================================
// POWERUP CLASS
// ============================================
class PowerUp {
    constructor(game, type, x) {
        this.game = game;
        this.typeData = type;
        this.x = x;
        this.y = -CONFIG.POWERUP_SIZE;
        this.width = CONFIG.POWERUP_SIZE;
        this.height = CONFIG.POWERUP_SIZE;
        this.speed = CONFIG.POWERUP_SPEED;
        this.bobOffset = Math.random() * Math.PI * 2;

        // If it's a weapon powerup, pick a random weapon
        if (type.type === 'weapon') {
            const weaponKeys = type.weapons;
            this.weapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        }
    }

    update(deltaTime) {
        this.y += this.speed;
        this.bobOffset += 0.1;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 5;

        // Glow effect
        ctx.fillStyle = this.typeData.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.width * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw emoji
        ctx.font = `${this.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.typeData.emoji, this.x, this.y + bobY);
    }

    isOffscreen() {
        return this.y > this.game.canvas.height + this.height;
    }

    apply(player) {
        this.game.audio.powerup();

        switch (this.typeData.type) {
            case 'weapon':
                player.setWeapon(this.weapon);
                const ammoCount = WEAPONS[this.weapon].ammo;
                this.game.showNotification(`${WEAPONS[this.weapon].name}! (${ammoCount} shots)`);
                break;
            case 'health':
                if (player.health < player.maxHealth) {
                    player.health++;
                    this.game.showNotification('Health +1!');
                } else {
                    this.game.showNotification('Health Full!');
                }
                break;
            case 'maxhealth':
                player.maxHealth++;
                player.health++; // Also restore one health
                this.game.showNotification(`Max Health Up! (${player.maxHealth} hearts)`);
                break;
            case 'shield':
                player.activateShield(5000);
                this.game.showNotification('Shield Active!');
                break;
            case 'score':
                this.game.score += this.typeData.points;
                this.game.showNotification(`+${this.typeData.points} Points!`);
                break;
            case 'bomb':
                this.game.triggerBombJumpScare();
                this.game.clearAllEnemies();
                break;
        }
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
        this.particles = new ParticleSystem();

        this.state = 'menu'; // menu, playing, paused, gameover
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('spaceShooterHighScore') || '0');
        this.difficulty = 0;
        this.selectedCharacter = CHARACTERS[0];
        this.unlockedCharacters = this.loadUnlockedCharacters();

        this.player = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerups = [];

        this.lastEnemySpawn = 0;
        this.lastPowerupSpawn = 0;
        this.lastDifficultyIncrease = 0;
        this.lastTime = 0;

        this.touchStartX = 0;
        this.playerStartX = 0;

        // Boss tracking
        this.nextBossIndex = 0; // Index into BOSS_SPAWN_SCORES
        this.bossActive = false; // Whether a boss is currently on screen

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.starField = new StarField(this.canvas);

        this.setupUI();
        this.setupInput();
        this.setupCharacterSelect();

        this.gameLoop(0);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.starField) {
            this.starField.resize();
        }

        if (this.player) {
            this.player.y = this.canvas.height - 100;
        }
    }

    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
    }

    setupInput() {
        // Touch controls - ship follows finger position
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();

            if (this.state === 'playing' && this.player) {
                const touch = e.touches[0];
                this.player.moveTo(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();

            if (this.state === 'playing' && this.player) {
                const touch = e.touches[0];
                this.player.moveTo(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        // Mouse controls for desktop testing
        let mouseDown = false;
        this.canvas.addEventListener('mousedown', (e) => {
            this.audio.init();
            mouseDown = true;
            if (this.state === 'playing' && this.player) {
                this.player.moveTo(e.clientX, e.clientY);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (mouseDown && this.state === 'playing' && this.player) {
                this.player.moveTo(e.clientX, e.clientY);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            mouseDown = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            mouseDown = false;
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing' || !this.player) return;

            if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.player.moveTo(this.player.targetX - 30);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                this.player.moveTo(this.player.targetX + 30);
            } else if (e.key === 'Escape' || e.key === 'p') {
                this.pauseGame();
            }
        });
    }

    setupCharacterSelect() {
        const container = document.getElementById('character-options');
        container.innerHTML = '';

        CHARACTERS.forEach((char, index) => {
            const div = document.createElement('div');
            div.className = 'character-option';
            div.textContent = char.emoji;

            const isUnlocked = this.unlockedCharacters.includes(char.id);

            if (!isUnlocked) {
                div.classList.add('locked');
                div.title = `Score ${char.scoreRequired} to unlock`;
            } else {
                div.addEventListener('click', () => {
                    document.querySelectorAll('.character-option').forEach(el => el.classList.remove('selected'));
                    div.classList.add('selected');
                    this.selectedCharacter = char;
                });
            }

            if (index === 0) {
                div.classList.add('selected');
            }

            container.appendChild(div);
        });
    }

    loadUnlockedCharacters() {
        const saved = localStorage.getItem('unlockedCharacters');
        if (saved) {
            return JSON.parse(saved);
        }
        return CHARACTERS.filter(c => c.unlocked).map(c => c.id);
    }

    saveUnlockedCharacters() {
        localStorage.setItem('unlockedCharacters', JSON.stringify(this.unlockedCharacters));
    }

    checkUnlocks() {
        let newUnlock = false;
        CHARACTERS.forEach(char => {
            if (!this.unlockedCharacters.includes(char.id) && char.scoreRequired && this.score >= char.scoreRequired) {
                this.unlockedCharacters.push(char.id);
                newUnlock = true;
                this.showNotification(`${char.emoji} ${char.name} Unlocked!`);
            }
        });

        if (newUnlock) {
            this.saveUnlockedCharacters();
            this.setupCharacterSelect();
        }
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.difficulty = 0;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerups = [];
        this.lastEnemySpawn = Date.now();
        this.lastPowerupSpawn = Date.now();
        this.lastDifficultyIncrease = Date.now();

        // Reset boss tracking
        this.nextBossIndex = 0;
        this.bossActive = false;

        this.player = new Player(this);
        this.player.setCharacter(this.selectedCharacter);

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');

        this.updateHUD();
    }

    pauseGame() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-screen').classList.remove('hidden');
        }
    }

    resumeGame() {
        if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-screen').classList.add('hidden');
            this.lastTime = performance.now();
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.gameOver();

        // Check for new high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('spaceShooterHighScore', this.highScore.toString());
        }

        // Check for character unlocks
        this.checkUnlocks();

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('gameover-screen').classList.remove('hidden');
    }

    spawnEnemy() {
        // Check if we should spawn a boss
        if (this.nextBossIndex < BOSS_SPAWN_SCORES.length &&
            this.score >= BOSS_SPAWN_SCORES[this.nextBossIndex] &&
            !this.bossActive) {
            this.spawnBoss();
            return;
        }

        // Don't spawn regular enemies while boss is active (except reduced rate)
        if (this.bossActive && Math.random() > 0.3) return;

        const now = Date.now();
        const spawnRate = CONFIG.ENEMY_SPAWN_RATE / (1 + this.difficulty * 0.15);

        if (now - this.lastEnemySpawn < spawnRate) return;
        this.lastEnemySpawn = now;

        // Select enemy type based on difficulty (excluding boss - index 4)
        let availableTypes = [ENEMY_TYPES[0]]; // Basic always available

        if (this.difficulty >= 1) availableTypes.push(ENEMY_TYPES[1]); // Fast
        if (this.difficulty >= 2) availableTypes.push(ENEMY_TYPES[2]); // Tank
        if (this.difficulty >= 3) availableTypes.push(ENEMY_TYPES[3]); // Zigzag

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const x = Math.random() * (this.canvas.width - type.size * 2) + type.size;

        this.enemies.push(new Enemy(this, type, x));
    }

    spawnBoss() {
        this.bossActive = true;
        this.nextBossIndex++;

        // Warning effect
        this.audio.bossWarning();
        this.showNotification('WARNING: BOSS INCOMING!');

        // Spawn boss after a short delay
        setTimeout(() => {
            const bossType = ENEMY_TYPES[4]; // Boss type
            // Scale boss health based on how many bosses have been defeated
            const scaledBossType = {
                ...bossType,
                health: bossType.health + (this.nextBossIndex - 1) * 10, // Each boss has 10 more HP
                points: bossType.points + (this.nextBossIndex - 1) * 200 // More points too
            };
            const x = this.canvas.width / 2;
            const boss = new Enemy(this, scaledBossType, x);
            boss.isBoss = true;
            this.enemies.push(boss);
        }, 1500);
    }

    spawnPowerup() {
        const now = Date.now();
        const spawnRate = CONFIG.POWERUP_SPAWN_RATE;

        if (now - this.lastPowerupSpawn < spawnRate) return;
        this.lastPowerupSpawn = now;

        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        const x = Math.random() * (this.canvas.width - CONFIG.POWERUP_SIZE * 2) + CONFIG.POWERUP_SIZE;

        this.powerups.push(new PowerUp(this, type, x));
    }

    updateDifficulty() {
        const now = Date.now();
        if (now - this.lastDifficultyIncrease >= CONFIG.DIFFICULTY_INCREASE_INTERVAL) {
            this.lastDifficultyIncrease = now;
            if (this.difficulty < CONFIG.MAX_DIFFICULTY) {
                this.difficulty++;
            }
        }
    }

    clearAllEnemies() {
        this.enemies.forEach(enemy => {
            this.score += enemy.points;
            this.particles.emit(enemy.x, enemy.y, '#ff6600', 20);
            this.audio.explosion();
        });
        this.enemies = [];
    }

    triggerBombJumpScare() {
        // Play the jump scare sound
        this.audio.jumpScare();

        // Create the jump scare visual overlay
        const jumpScareDiv = document.createElement('div');
        jumpScareDiv.className = 'jumpscare-overlay';
        jumpScareDiv.innerHTML = `
            <div class="jumpscare-face">💀</div>
            <div class="jumpscare-text">BOOM!</div>
        `;
        document.getElementById('game-container').appendChild(jumpScareDiv);

        // Screen shake effect
        this.canvas.style.animation = 'screenShake 0.3s ease-in-out';

        // Flash the screen
        const flashDiv = document.createElement('div');
        flashDiv.className = 'screen-flash';
        document.getElementById('game-container').appendChild(flashDiv);

        // Remove effects after animation
        setTimeout(() => {
            jumpScareDiv.remove();
            flashDiv.remove();
            this.canvas.style.animation = '';
            this.showNotification('BOMB!');
        }, 400);

        // Massive particle explosion
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height * 0.7;
                this.particles.emit(x, y, '#ff6600', 30);
                this.particles.emit(x, y, '#ffff00', 20);
                this.particles.emit(x, y, '#ff0000', 15);
            }, i * 50);
        }
    }

    showNotification(text) {
        const existing = document.querySelector('.powerup-notification');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'powerup-notification';
        div.textContent = text;
        document.getElementById('game-container').appendChild(div);

        setTimeout(() => div.remove(), 2000);
    }

    checkCollisions() {
        // Bullet vs Enemy collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];

                if (this.rectCollision(
                    bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height,
                    enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height
                )) {
                    // Remove bullet (unless it's a laser, piercing, or plasma)
                    if (!bullet.isLaser && !bullet.isPiercing && !bullet.isPlasma) {
                        this.bullets.splice(i, 1);
                    }

                    // Damage enemy
                    if (enemy.takeDamage(bullet.damage)) {
                        this.score += enemy.points;
                        this.particles.emit(enemy.x, enemy.y, '#ff6600', 20);
                        this.audio.explosion();

                        // Check if this was a boss
                        if (enemy.isBoss || enemy.type.isBoss) {
                            this.bossActive = false;
                            this.showNotification('BOSS DEFEATED! +' + enemy.points + ' pts');
                            // Extra celebration particles
                            for (let k = 0; k < 5; k++) {
                                setTimeout(() => {
                                    this.particles.emit(enemy.x + (Math.random() - 0.5) * 100,
                                                       enemy.y + (Math.random() - 0.5) * 100,
                                                       '#ffff00', 25);
                                }, k * 100);
                            }
                        }

                        this.enemies.splice(j, 1);
                    }

                    if (!bullet.isLaser) break;
                }
            }
        }

        // Player vs Enemy collisions
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            if (this.circleCollision(
                this.player.x, this.player.y, this.player.width / 3,
                enemy.x, enemy.y, enemy.width / 3
            )) {
                // Destroy enemy
                this.particles.emit(enemy.x, enemy.y, '#ff6600', 15);
                this.audio.explosion();
                this.enemies.splice(i, 1);

                // Damage player
                if (this.player.takeDamage()) {
                    this.gameOver();
                    return;
                }
            }
        }

        // Player vs Powerup collisions
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];

            if (this.circleCollision(
                this.player.x, this.player.y, this.player.width / 2,
                powerup.x, powerup.y, powerup.width / 2
            )) {
                powerup.apply(this.player);
                this.particles.emit(powerup.x, powerup.y, powerup.typeData.color, 15);
                this.powerups.splice(i, 1);
            }
        }

        // Enemy Bullet vs Player collisions
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];

            if (this.circleCollision(
                this.player.x, this.player.y, this.player.width / 3,
                bullet.x, bullet.y, bullet.size / 2
            )) {
                // Remove bullet
                this.enemyBullets.splice(i, 1);
                this.particles.emit(bullet.x, bullet.y, bullet.color, 10);

                // Damage player
                if (this.player.takeDamage()) {
                    this.gameOver();
                    return;
                }
            }
        }
    }

    rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < r1 + r2;
    }

    updateHUD() {
        document.getElementById('score').textContent = this.score;

        // Health hearts
        let hearts = '';
        for (let i = 0; i < this.player.maxHealth; i++) {
            hearts += i < this.player.health ? '❤️' : '🖤';
        }
        document.getElementById('health-hearts').textContent = hearts;

        // Weapon display with ammo count
        const weaponName = WEAPONS[this.player.weapon].name;
        if (this.player.weapon === 'basic') {
            document.getElementById('current-weapon').textContent = weaponName;
        } else {
            document.getElementById('current-weapon').textContent = `${weaponName} [${this.player.ammo}]`;
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;

        // Update difficulty
        this.updateDifficulty();

        // Spawn enemies and powerups
        this.spawnEnemy();
        this.spawnPowerup();

        // Update player
        this.player.update(deltaTime);

        // Update player bullets
        this.bullets = this.bullets.filter(bullet => {
            Bullet.update(bullet, this.enemies);
            return !Bullet.isOffscreen(bullet, this.canvas);
        });

        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            return bullet.x > -20 && bullet.x < this.canvas.width + 20 &&
                   bullet.y > -20 && bullet.y < this.canvas.height + 20;
        });

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(deltaTime);
            if (enemy.isOffscreen()) {
                return false;
            }
            return true;
        });

        // Update powerups
        this.powerups = this.powerups.filter(powerup => {
            powerup.update(deltaTime);
            return !powerup.isOffscreen();
        });

        // Update particles
        this.particles.update();

        // Check collisions
        this.checkCollisions();

        // Update HUD
        this.updateHUD();

        // Update star field
        this.starField.update();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw star field
        this.starField.draw(this.ctx);

        if (this.state === 'playing' || this.state === 'paused') {
            // Draw powerups
            this.powerups.forEach(powerup => powerup.draw(this.ctx));

            // Draw enemies
            this.enemies.forEach(enemy => enemy.draw(this.ctx));

            // Draw player bullets
            this.bullets.forEach(bullet => Bullet.draw(this.ctx, bullet));

            // Draw enemy bullets
            this.enemyBullets.forEach(bullet => {
                // Outer glow
                this.ctx.fillStyle = bullet.color;
                this.ctx.shadowColor = bullet.color;
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, bullet.size / 2 + 2, 0, Math.PI * 2);
                this.ctx.fill();

                // Bright core for visibility
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, bullet.size / 4, 0, Math.PI * 2);
                this.ctx.fill();
            });

            // Draw player
            if (this.player) {
                this.player.draw(this.ctx);
            }

            // Draw particles
            this.particles.draw(this.ctx);
        }
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
