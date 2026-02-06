// ============================================
// LEMON CHOMPER - Pac-Man Style Game
// ============================================

// Game Configuration
const CONFIG = {
    TILE_SIZE: 24,
    PLAYER_SPEED: 4,
    GHOST_SPEED: 3,
    POWER_DURATION: 8000,
    GHOST_COUNT: 4
};

// Maze layout (0 = wall, 1 = dot, 2 = empty, 3 = power pellet, 4 = ghost house)
const MAZE_TEMPLATE = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
    [0,3,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,3,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
    [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
    [0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0],
    [2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,0,2,2,2],
    [0,0,0,0,1,0,1,0,0,4,0,0,1,0,1,0,0,0,0],
    [1,1,1,1,1,1,1,0,4,4,4,0,1,1,1,1,1,1,1],
    [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
    [2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,0,2,2,2],
    [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
    [0,3,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,3,0],
    [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0],
    [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// Ghost colors and personalities
const GHOST_TYPES = [
    { emoji: '😺', color: '#ff0000', name: 'Red Cat', behavior: 'chase' },
    { emoji: '🐱', color: '#ffb8ff', name: 'Pink Cat', behavior: 'ambush' },
    { emoji: '😸', color: '#00ffff', name: 'Cyan Cat', behavior: 'random' },
    { emoji: '😻', color: '#ffb852', name: 'Orange Cat', behavior: 'patrol' }
];

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

    chomp() {
        this.playTone(200, 0.05, 'square', 0.08);
        setTimeout(() => this.playTone(150, 0.05, 'square', 0.08), 60);
    }

    powerUp() {
        this.playTone(400, 0.1, 'sine', 0.1);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(600, 0.15, 'sine', 0.1), 200);
    }

    eatGhost() {
        this.playTone(600, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(800, 0.1, 'square', 0.12), 100);
        setTimeout(() => this.playTone(1000, 0.15, 'square', 0.1), 200);
    }

    death() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(400 - i * 60, 0.15, 'sawtooth', 0.1);
            }, i * 150);
        }
    }

    levelComplete() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.15), i * 150);
        });
    }
}

// ============================================
// PLAYER (PARROT)
// ============================================
class Player {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        // Start position (center bottom of maze)
        this.tileX = 9;
        this.tileY = 15;
        this.x = this.tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.y = this.tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.mouthOpen = true;
        this.mouthTimer = 0;
        this.powered = false;
        this.powerTimer = 0;
    }

    setDirection(dx, dy) {
        this.nextDirection = { x: dx, y: dy };
    }

    canMove(dx, dy) {
        const nextTileX = this.tileX + dx;
        const nextTileY = this.tileY + dy;

        // Tunnel wrap
        if (nextTileX < 0) return true;
        if (nextTileX >= this.game.maze[0].length) return true;

        // Check bounds
        if (nextTileY < 0 || nextTileY >= this.game.maze.length) return false;

        // Check wall
        const tile = this.game.maze[nextTileY][nextTileX];
        return tile !== 0 && tile !== 4;
    }

    update(deltaTime) {
        // Update mouth animation
        this.mouthTimer += deltaTime;
        if (this.mouthTimer > 100) {
            this.mouthOpen = !this.mouthOpen;
            this.mouthTimer = 0;
        }

        // Update power timer
        if (this.powered) {
            this.powerTimer -= deltaTime;
            if (this.powerTimer <= 0) {
                this.powered = false;
            }
        }

        // Calculate center of current tile
        const tileCenterX = this.tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const tileCenterY = this.tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

        // Check if at tile center (with tolerance)
        const atCenterX = Math.abs(this.x - tileCenterX) < CONFIG.PLAYER_SPEED;
        const atCenterY = Math.abs(this.y - tileCenterY) < CONFIG.PLAYER_SPEED;

        if (atCenterX && atCenterY) {
            // Snap to center
            this.x = tileCenterX;
            this.y = tileCenterY;

            // Try to change direction
            if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
                if (this.canMove(this.nextDirection.x, this.nextDirection.y)) {
                    this.direction = { ...this.nextDirection };
                }
            }

            // Check if current direction is still valid
            if (!this.canMove(this.direction.x, this.direction.y)) {
                this.direction = { x: 0, y: 0 };
            }
        }

        // Move
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            this.x += this.direction.x * CONFIG.PLAYER_SPEED;
            this.y += this.direction.y * CONFIG.PLAYER_SPEED;

            // Update tile position
            this.tileX = Math.floor(this.x / CONFIG.TILE_SIZE);
            this.tileY = Math.floor(this.y / CONFIG.TILE_SIZE);

            // Tunnel wrap
            if (this.x < 0) {
                this.x = this.game.maze[0].length * CONFIG.TILE_SIZE;
                this.tileX = this.game.maze[0].length - 1;
            }
            if (this.x > this.game.maze[0].length * CONFIG.TILE_SIZE) {
                this.x = 0;
                this.tileX = 0;
            }
        }

        // Collect dots
        this.collectDot();
    }

    collectDot() {
        const tile = this.game.maze[this.tileY]?.[this.tileX];

        if (tile === 1) {
            // Regular dot (lemon)
            this.game.maze[this.tileY][this.tileX] = 2;
            this.game.score += 10;
            this.game.dotsCollected++;
            this.game.audio.chomp();
        } else if (tile === 3) {
            // Power pellet
            this.game.maze[this.tileY][this.tileX] = 2;
            this.game.score += 50;
            this.game.dotsCollected++;
            this.powered = true;
            this.powerTimer = CONFIG.POWER_DURATION;
            this.game.audio.powerUp();

            // Scare ghosts
            this.game.ghosts.forEach(ghost => {
                ghost.scared = true;
                ghost.scaredTimer = CONFIG.POWER_DURATION;
            });
        }
    }

    draw(ctx, offsetX, offsetY) {
        ctx.save();
        ctx.translate(this.x + offsetX, this.y + offsetY);

        // Rotate based on direction
        let rotation = 0;
        if (this.direction.x === 1) rotation = 0;
        else if (this.direction.x === -1) rotation = Math.PI;
        else if (this.direction.y === 1) rotation = Math.PI / 2;
        else if (this.direction.y === -1) rotation = -Math.PI / 2;

        ctx.rotate(rotation);

        // Draw parrot
        const size = CONFIG.TILE_SIZE * 0.9;

        // Body (green)
        ctx.fillStyle = this.powered ? '#00ff00' : '#22cc22';
        ctx.beginPath();
        if (this.mouthOpen && (this.direction.x !== 0 || this.direction.y !== 0)) {
            // Open mouth
            ctx.arc(0, 0, size / 2, 0.3, Math.PI * 2 - 0.3);
            ctx.lineTo(0, 0);
        } else {
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        }
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(size / 6, -size / 5, size / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(size / 5, -size / 5, size / 10, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(size / 3, 0);
        ctx.lineTo(size / 2 + 4, -3);
        ctx.lineTo(size / 2 + 4, 3);
        ctx.closePath();
        ctx.fill();

        // Crest feathers
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.ellipse(-size / 4, -size / 3, size / 6, size / 4, -0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Power indicator
        if (this.powered) {
            ctx.strokeStyle = `rgba(0, 255, 0, ${0.5 + Math.sin(Date.now() * 0.01) * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + offsetX, this.y + offsetY, size / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// ============================================
// GHOST (CAT)
// ============================================
class Ghost {
    constructor(game, type, index) {
        this.game = game;
        this.type = type;
        this.index = index;
        this.reset();
    }

    reset() {
        // Start in ghost house
        this.tileX = 9 + (this.index % 2) - 1;
        this.tileY = 9;
        this.x = this.tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.y = this.tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.direction = { x: 0, y: -1 };
        this.scared = false;
        this.scaredTimer = 0;
        this.eaten = false;
        this.exitDelay = this.index * 2000; // Stagger exits
        this.exited = false;
    }

    update(deltaTime) {
        // Exit delay
        if (!this.exited) {
            this.exitDelay -= deltaTime;
            if (this.exitDelay <= 0) {
                this.exited = true;
                this.tileY = 7;
                this.y = this.tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            }
            return;
        }

        // Update scared timer
        if (this.scared) {
            this.scaredTimer -= deltaTime;
            if (this.scaredTimer <= 0) {
                this.scared = false;
            }
        }

        // If eaten, return to ghost house
        if (this.eaten) {
            const homeX = 9 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const homeY = 9 * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const dx = homeX - this.x;
            const dy = homeY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.GHOST_SPEED * 2) {
                this.eaten = false;
                this.scared = false;
                this.x = homeX;
                this.y = homeY;
                this.tileX = 9;
                this.tileY = 9;
            } else {
                this.x += (dx / dist) * CONFIG.GHOST_SPEED * 2;
                this.y += (dy / dist) * CONFIG.GHOST_SPEED * 2;
            }
            return;
        }

        const speed = this.scared ? CONFIG.GHOST_SPEED * 0.6 : CONFIG.GHOST_SPEED;

        // Calculate center of current tile
        const tileCenterX = this.tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const tileCenterY = this.tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

        // Check if at tile center
        const atCenterX = Math.abs(this.x - tileCenterX) < speed;
        const atCenterY = Math.abs(this.y - tileCenterY) < speed;

        if (atCenterX && atCenterY) {
            this.x = tileCenterX;
            this.y = tileCenterY;

            // Choose new direction
            this.chooseDirection();
        }

        // Move
        this.x += this.direction.x * speed;
        this.y += this.direction.y * speed;

        // Update tile position
        this.tileX = Math.floor(this.x / CONFIG.TILE_SIZE);
        this.tileY = Math.floor(this.y / CONFIG.TILE_SIZE);

        // Tunnel wrap
        if (this.x < 0) {
            this.x = this.game.maze[0].length * CONFIG.TILE_SIZE;
            this.tileX = this.game.maze[0].length - 1;
        }
        if (this.x > this.game.maze[0].length * CONFIG.TILE_SIZE) {
            this.x = 0;
            this.tileX = 0;
        }
    }

    chooseDirection() {
        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        // Filter valid directions (no reversing, no walls)
        const validDirs = directions.filter(dir => {
            // Don't reverse
            if (dir.x === -this.direction.x && dir.y === -this.direction.y) return false;

            const nextX = this.tileX + dir.x;
            const nextY = this.tileY + dir.y;

            // Bounds check
            if (nextX < 0 || nextX >= this.game.maze[0].length) return true; // Tunnel
            if (nextY < 0 || nextY >= this.game.maze.length) return false;

            // Wall check
            const tile = this.game.maze[nextY][nextX];
            return tile !== 0;
        });

        if (validDirs.length === 0) {
            // Reverse if stuck
            this.direction = { x: -this.direction.x, y: -this.direction.y };
            return;
        }

        // Choose based on behavior
        if (this.scared) {
            // Run away from player
            const playerDist = (dir) => {
                const nextX = this.tileX + dir.x;
                const nextY = this.tileY + dir.y;
                const dx = this.game.player.tileX - nextX;
                const dy = this.game.player.tileY - nextY;
                return Math.sqrt(dx * dx + dy * dy);
            };
            validDirs.sort((a, b) => playerDist(b) - playerDist(a));
            this.direction = validDirs[0];
        } else {
            switch (this.type.behavior) {
                case 'chase':
                    // Chase player directly
                    const chaseDist = (dir) => {
                        const nextX = this.tileX + dir.x;
                        const nextY = this.tileY + dir.y;
                        const dx = this.game.player.tileX - nextX;
                        const dy = this.game.player.tileY - nextY;
                        return Math.sqrt(dx * dx + dy * dy);
                    };
                    validDirs.sort((a, b) => chaseDist(a) - chaseDist(b));
                    this.direction = validDirs[0];
                    break;

                case 'ambush':
                    // Target ahead of player
                    const targetX = this.game.player.tileX + this.game.player.direction.x * 4;
                    const targetY = this.game.player.tileY + this.game.player.direction.y * 4;
                    const ambushDist = (dir) => {
                        const nextX = this.tileX + dir.x;
                        const nextY = this.tileY + dir.y;
                        const dx = targetX - nextX;
                        const dy = targetY - nextY;
                        return Math.sqrt(dx * dx + dy * dy);
                    };
                    validDirs.sort((a, b) => ambushDist(a) - ambushDist(b));
                    this.direction = validDirs[0];
                    break;

                case 'random':
                case 'patrol':
                default:
                    // Random direction
                    this.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
                    break;
            }
        }
    }

    draw(ctx, offsetX, offsetY) {
        ctx.save();
        ctx.translate(this.x + offsetX, this.y + offsetY);

        const size = CONFIG.TILE_SIZE * 0.9;

        if (this.eaten) {
            // Just eyes when eaten
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-size / 5, -size / 6, size / 5, 0, Math.PI * 2);
            ctx.arc(size / 5, -size / 6, size / 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#00f';
            ctx.beginPath();
            ctx.arc(-size / 5 + this.direction.x * 2, -size / 6 + this.direction.y * 2, size / 8, 0, Math.PI * 2);
            ctx.arc(size / 5 + this.direction.x * 2, -size / 6 + this.direction.y * 2, size / 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw cat emoji
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (this.scared) {
                // Scared appearance - blue tint and flashing
                const flash = this.scaredTimer < 2000 && Math.floor(Date.now() / 200) % 2;
                ctx.fillText(flash ? '🙀' : '😿', 0, 0);
            } else {
                ctx.fillText(this.type.emoji, 0, 0);
            }
        }

        ctx.restore();
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
        this.highScore = parseInt(localStorage.getItem('lemonChomperHighScore') || '0');
        this.lives = 3;
        this.level = 1;

        this.maze = [];
        this.player = null;
        this.ghosts = [];
        this.dotsCollected = 0;
        this.totalDots = 0;

        this.offsetX = 0;
        this.offsetY = 0;

        this.lastTime = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupUI();
        this.setupInput();

        this.gameLoop(0);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Calculate offset to center maze
        const mazeWidth = MAZE_TEMPLATE[0].length * CONFIG.TILE_SIZE;
        const mazeHeight = MAZE_TEMPLATE.length * CONFIG.TILE_SIZE;

        this.offsetX = (this.canvas.width - mazeWidth) / 2;
        this.offsetY = (this.canvas.height - mazeHeight) / 2 - 30;
    }

    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());

        // D-pad buttons
        document.getElementById('btn-up').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();
            if (this.player) this.player.setDirection(0, -1);
        });
        document.getElementById('btn-down').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();
            if (this.player) this.player.setDirection(0, 1);
        });
        document.getElementById('btn-left').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();
            if (this.player) this.player.setDirection(-1, 0);
        });
        document.getElementById('btn-right').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.audio.init();
            if (this.player) this.player.setDirection(1, 0);
        });

        // Mouse clicks for desktop
        document.getElementById('btn-up').addEventListener('click', () => {
            this.audio.init();
            if (this.player) this.player.setDirection(0, -1);
        });
        document.getElementById('btn-down').addEventListener('click', () => {
            this.audio.init();
            if (this.player) this.player.setDirection(0, 1);
        });
        document.getElementById('btn-left').addEventListener('click', () => {
            this.audio.init();
            if (this.player) this.player.setDirection(-1, 0);
        });
        document.getElementById('btn-right').addEventListener('click', () => {
            this.audio.init();
            if (this.player) this.player.setDirection(1, 0);
        });
    }

    setupInput() {
        // Swipe controls
        this.canvas.addEventListener('touchstart', (e) => {
            this.audio.init();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - this.touchStartX;
            const dy = e.changedTouches[0].clientY - this.touchStartY;

            const minSwipe = 30;
            if (Math.abs(dx) > minSwipe || Math.abs(dy) > minSwipe) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.player?.setDirection(dx > 0 ? 1 : -1, 0);
                } else {
                    this.player?.setDirection(0, dy > 0 ? 1 : -1);
                }
            }
        }, { passive: true });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.player) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    this.player.setDirection(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                    this.player.setDirection(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.player.setDirection(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                    this.player.setDirection(1, 0);
                    break;
            }
        });
    }

    initMaze() {
        // Deep copy maze template
        this.maze = MAZE_TEMPLATE.map(row => [...row]);
        this.dotsCollected = 0;
        this.totalDots = 0;

        // Count dots
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                if (this.maze[y][x] === 1 || this.maze[y][x] === 3) {
                    this.totalDots++;
                }
            }
        }
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.lives = 3;
        this.level = 1;

        this.initMaze();

        this.player = new Player(this);
        this.ghosts = GHOST_TYPES.map((type, i) => new Ghost(this, type, i));

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('levelcomplete-screen').classList.add('hidden');

        this.updateHUD();
    }

    nextLevel() {
        this.level++;
        this.initMaze();

        this.player.reset();
        this.ghosts.forEach(ghost => ghost.reset());

        // Speed up ghosts each level
        CONFIG.GHOST_SPEED = 3 + this.level * 0.3;

        document.getElementById('next-level').textContent = this.level;
        document.getElementById('levelcomplete-screen').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('levelcomplete-screen').classList.add('hidden');
            this.state = 'playing';
        }, 2000);
    }

    loseLife() {
        this.lives--;
        this.audio.death();

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.player.reset();
            this.ghosts.forEach(ghost => ghost.reset());
            this.updateHUD();
        }
    }

    gameOver() {
        this.state = 'gameover';

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('lemonChomperHighScore', this.highScore.toString());
        }

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
        document.getElementById('gameover-screen').classList.remove('hidden');

        // Reset ghost speed
        CONFIG.GHOST_SPEED = 3;
    }

    checkCollisions() {
        for (const ghost of this.ghosts) {
            if (ghost.eaten || !ghost.exited) continue;

            const dx = this.player.x - ghost.x;
            const dy = this.player.y - ghost.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.TILE_SIZE * 0.7) {
                if (ghost.scared) {
                    // Eat ghost
                    ghost.eaten = true;
                    this.score += 200;
                    this.audio.eatGhost();
                } else {
                    // Player dies
                    this.loseLife();
                    return;
                }
            }
        }
    }

    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;

        // Lives as parrots
        let livesStr = '';
        for (let i = 0; i < this.lives; i++) {
            livesStr += '🦜';
        }
        document.getElementById('lives').textContent = livesStr;
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;

        this.player.update(deltaTime);
        this.ghosts.forEach(ghost => ghost.update(deltaTime));

        this.checkCollisions();

        // Check level complete
        if (this.dotsCollected >= this.totalDots) {
            this.state = 'levelcomplete';
            this.audio.levelComplete();
            setTimeout(() => this.nextLevel(), 1500);
        }

        this.updateHUD();
    }

    drawMaze() {
        for (let y = 0; y < this.maze.length; y++) {
            for (let x = 0; x < this.maze[y].length; x++) {
                const tile = this.maze[y][x];
                const px = x * CONFIG.TILE_SIZE + this.offsetX;
                const py = y * CONFIG.TILE_SIZE + this.offsetY;

                if (tile === 0) {
                    // Wall
                    this.ctx.fillStyle = '#1a1aff';
                    this.ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

                    // Wall highlight
                    this.ctx.fillStyle = '#3333ff';
                    this.ctx.fillRect(px + 2, py + 2, CONFIG.TILE_SIZE - 4, CONFIG.TILE_SIZE - 4);
                } else if (tile === 1) {
                    // Dot (lemon)
                    this.ctx.font = `${CONFIG.TILE_SIZE * 0.5}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('🍋', px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2);
                } else if (tile === 3) {
                    // Power pellet (big tropical fruit)
                    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.2;
                    this.ctx.font = `${CONFIG.TILE_SIZE * 0.7 * pulse}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('🥭', px + CONFIG.TILE_SIZE / 2, py + CONFIG.TILE_SIZE / 2);
                } else if (tile === 4) {
                    // Ghost house door
                    this.ctx.fillStyle = '#ff69b4';
                    this.ctx.fillRect(px, py + CONFIG.TILE_SIZE / 3, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE / 3);
                }
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw maze
        this.drawMaze();

        if (this.state === 'playing' || this.state === 'levelcomplete') {
            // Draw ghosts
            this.ghosts.forEach(ghost => ghost.draw(this.ctx, this.offsetX, this.offsetY));

            // Draw player
            if (this.player) {
                this.player.draw(this.ctx, this.offsetX, this.offsetY);
            }
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

// Start the game
window.addEventListener('load', () => {
    new Game();
});
