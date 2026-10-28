// ============================================================
// EMOJI TETRIS / BRICK BREAKER HYBRID
// ============================================================

// --- CONFIG ---
const CONFIG = {
    // Tetris grid
    COLS: 10,
    ROWS: 20,
    // Speeds (ms per drop)
    BASE_DROP_INTERVAL: 800,
    MIN_DROP_INTERVAL: 80,
    SPEED_DECREASE_PER_LEVEL: 60,
    LINES_PER_LEVEL: 10,
    LOCK_DELAY: 500,
    MAX_LOCK_RESETS: 15,
    NEXT_QUEUE_SIZE: 3,
    // Scoring (all multiplied by level)
    LINE_SCORES: [0, 100, 300, 500, 800],
    TSPIN_SCORES: [400, 800, 1200, 1600],
    BACK_TO_BACK_MULT: 1.5,
    COMBO_SCORE: 50,
    PERFECT_CLEAR_BONUS: 3000,
    CASCADE_SCORE: 100, // per line restored-and-cleared after breaker
    // Breaker trigger: a Tetris or T-Spin Double/Triple flips immediately,
    // otherwise every BREAKER_LINES_INTERVAL lines flips
    BREAKER_LINES_INTERVAL: 10,
    // Brick breaker
    BALL_SPEED: 350, // pixels per second (dt-normalized)
    BALL_SPEED_PER_ROUND: 0.05, // +5% per round
    BALL_SPEED_MAX_MULT: 1.6,
    BALL_RADIUS: 6,
    MAX_BALLS: 8,
    PADDLE_HEIGHT: 12,
    PADDLE_WIDTH_RATIO: 0.2,
    PADDLE_WIDE_MULTIPLIER: 1.6,
    PADDLE_KEY_SPEED: 480, // pixels per second
    POWERUP_CHANCE: 0.1, // per tetris cell (one of its 4 bricks carries it)
    POWERUP_FALL_SPEED: 120, // pixels per second
    POWERUP_DURATION_WIDE: 15000,
    POWERUP_DURATION_FIRE: 8000,
    POWERUP_DURATION_SLOW: 10000,
    POWERUP_DURATION_STICKY: 10000,
    SLOW_BALL_FACTOR: 0.5,
    BRICK_SCORE: 10,
    BRICK_COMBO_STEP: 8, // bricks per combo multiplier step
    BRICK_COMBO_MAX: 5,
    POWERUP_SCORE: 50,
    ALL_CLEAR_BONUS: 2000,
    // A tetris cell comes back only if at least this many of its 4 bricks survive
    CELL_SURVIVE_MIN_BRICKS: 2,
    BREAKER_TIME_LIMIT: 30000, // 30 seconds
    BREAKER_TIME_PER_BRICK: 300, // ms added per brick broken
    BREAKER_COUNTDOWN: 2000,
    // Perks carried back to Tetris from caught power-ups
    PERK_SLOW_PIECES: 10,
    PERK_SLOW_FACTOR: 2,
    PERK_STICKY_PIECES: 10,
    PERK_STICKY_LOCK_DELAY: 1500,
    PERK_DOUBLE_DURATION: 30000,
    // Flip
    FLIP_DURATION: 1200,
    LAYOUT_MORPH_DURATION: 500,
    // Touch
    SWIPE_THRESHOLD: 30,
    TAP_THRESHOLD: 10,
    FLICK_VELOCITY: 0.9, // px per ms downward to count as a hard drop
    // Keyboard auto-repeat
    MOVE_DAS: 170,
    MOVE_ARR: 50,
    SOFT_DROP_REPEAT: 50,
};

// --- TETROMINO DEFINITIONS ---
const EMOJIS = ['🟦', '🟨', '🟪', '🟩', '🟥', '🔵', '🟧'];
const PIECE_COLORS = [
    '#29b6f6', // I - blue
    '#ffee58', // O - yellow
    '#ab47bc', // T - purple
    '#66bb6a', // S - green
    '#ef5350', // Z - red
    '#1e88e5', // J - deep blue
    '#ffa726', // L - orange
];

// SRS rotation states as [row][col] offsets inside each piece's bounding box
// (4x4 for I, 2x2 for O, 3x3 for the rest) so wall kicks line up with SRS
const SHAPES = [
    // I
    [
        [[1,0],[1,1],[1,2],[1,3]],
        [[0,2],[1,2],[2,2],[3,2]],
        [[2,0],[2,1],[2,2],[2,3]],
        [[0,1],[1,1],[2,1],[3,1]],
    ],
    // O
    [
        [[0,0],[0,1],[1,0],[1,1]],
        [[0,0],[0,1],[1,0],[1,1]],
        [[0,0],[0,1],[1,0],[1,1]],
        [[0,0],[0,1],[1,0],[1,1]],
    ],
    // T
    [
        [[0,1],[1,0],[1,1],[1,2]],
        [[0,1],[1,1],[1,2],[2,1]],
        [[1,0],[1,1],[1,2],[2,1]],
        [[0,1],[1,0],[1,1],[2,1]],
    ],
    // S
    [
        [[0,1],[0,2],[1,0],[1,1]],
        [[0,1],[1,1],[1,2],[2,2]],
        [[1,1],[1,2],[2,0],[2,1]],
        [[0,0],[1,0],[1,1],[2,1]],
    ],
    // Z
    [
        [[0,0],[0,1],[1,1],[1,2]],
        [[0,2],[1,1],[1,2],[2,1]],
        [[1,0],[1,1],[2,1],[2,2]],
        [[0,1],[1,0],[1,1],[2,0]],
    ],
    // J
    [
        [[0,0],[1,0],[1,1],[1,2]],
        [[0,1],[0,2],[1,1],[2,1]],
        [[1,0],[1,1],[1,2],[2,2]],
        [[0,1],[1,1],[2,0],[2,1]],
    ],
    // L
    [
        [[0,2],[1,0],[1,1],[1,2]],
        [[0,1],[1,1],[2,1],[2,2]],
        [[1,0],[1,1],[1,2],[2,0]],
        [[0,0],[0,1],[1,1],[2,1]],
    ],
];

// SRS wall kicks as [dx, dy] (y up), indexed by the rotation state being left
// J,L,S,T,Z clockwise: 0->R, R->2, 2->L, L->0
const WALL_KICKS_CW = [
    [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
];
// J,L,S,T,Z counter-clockwise: 0->L, R->0, 2->R, L->2
const WALL_KICKS_CCW = [
    [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
];
// I piece clockwise
const I_WALL_KICKS_CW = [
    [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
    [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
];
// I piece counter-clockwise
const I_WALL_KICKS_CCW = [
    [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
    [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
];

// --- POWER-UP TYPES ---
// Each power-up caught in Breaker also banks a perk for the next Tetris round
const POWERUP_TYPES = [
    { id: 'multiball', emoji: '⚡', label: 'MULTI-BALL', color: '#ffeb3b', perk: 'I-PIECE NEXT' },
    { id: 'wide', emoji: '↔️', label: 'WIDE PADDLE', color: '#29b6f6', perk: 'HEAD START' },
    { id: 'fire', emoji: '🔥', label: 'FIREBALL', color: '#ff5722', perk: 'BURN ROW' },
    { id: 'slow', emoji: '🐢', label: 'SLOW', color: '#66bb6a', perk: 'SLOW DROP' },
    { id: 'bonus', emoji: '💎', label: '+500', color: '#e040fb', perk: '2× SCORE' },
    { id: 'sticky', emoji: '🧲', label: 'STICKY', color: '#ff9800', perk: 'STICKY LOCK' },
];

// --- AUDIO SYSTEM ---
class AudioSystem {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {}
    }
    play(freq, dur, type = 'square', vol = 0.15) {
        if (!this.ctx) return;
        try {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type;
            o.frequency.value = freq;
            g.gain.value = vol;
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            o.connect(g);
            g.connect(this.ctx.destination);
            o.start();
            o.stop(this.ctx.currentTime + dur);
        } catch (e) {}
    }
    move() { this.play(200, 0.05, 'square', 0.08); }
    rotate() { this.play(400, 0.08, 'sine', 0.1); }
    hold() { this.play(520, 0.08, 'triangle', 0.1); setTimeout(() => this.play(390, 0.08, 'triangle', 0.1), 60); }
    drop() { this.play(150, 0.15, 'triangle', 0.12); }
    lineClear(count) {
        const base = 300;
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.play(base + i * 100, 0.15, 'square', 0.12), i * 80);
        }
    }
    tetris() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => setTimeout(() => this.play(n, 0.3, 'square', 0.15), i * 100));
    }
    tSpin() {
        const notes = [440, 554, 659, 880];
        notes.forEach((n, i) => setTimeout(() => this.play(n, 0.2, 'sine', 0.14), i * 70));
    }
    cascade() {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => this.play(900 - i * 90, 0.12, 'triangle', 0.1), i * 60);
        }
    }
    flipSound() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => this.play(200 + i * 80, 0.1, 'sawtooth', 0.08), i * 50);
        }
    }
    brickBreak(combo = 0) { this.play(500 + Math.min(combo, 30) * 15 + Math.random() * 60, 0.06, 'square', 0.08); }
    paddleHit() { this.play(300, 0.08, 'triangle', 0.1); }
    wallBounce() { this.play(250, 0.05, 'sine', 0.06); }
    powerup() {
        this.play(600, 0.1, 'sine', 0.12);
        setTimeout(() => this.play(800, 0.15, 'sine', 0.12), 80);
    }
    perk() {
        const notes = [660, 880, 1100];
        notes.forEach((n, i) => setTimeout(() => this.play(n, 0.12, 'sine', 0.1), i * 90));
    }
    gameOver() {
        const notes = [400, 350, 300, 200];
        notes.forEach((n, i) => setTimeout(() => this.play(n, 0.3, 'sawtooth', 0.12), i * 200));
    }
}

// --- PARTICLE SYSTEM ---
// Speeds and decay are tuned per 60fps frame and scaled by dt
const FRAME_MS = 1000 / 60;

class Particles {
    constructor() {
        this.particles = [];
    }
    emit(x, y, count, color, speed = 3) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.5 + Math.random());
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 1,
                decay: 0.02 + Math.random() * 0.03,
                color,
                size: 2 + Math.random() * 3,
            });
        }
    }
    update(dt) {
        const k = dt / FRAME_MS;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * k;
            p.y += p.vy * k;
            p.life -= p.decay * k;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }
    draw(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }
}

// --- FLOATING TEXT ---
class FloatingTexts {
    constructor() {
        this.texts = [];
    }
    add(x, y, text, color = '#fff', size = 20) {
        // Stack texts that spawn close together so they don't overlap
        for (const t of this.texts) {
            if (t.life > 0.85 && Math.abs(t.x - x) < 120 && Math.abs(t.y - y) < size + 4) {
                y = t.y + t.size + 6;
            }
        }
        this.texts.push({ x, y, text, color, size, life: 1, vy: -1.5 });
    }
    update(dt) {
        const k = dt / FRAME_MS;
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y += t.vy * k;
            t.life -= 0.015 * k;
            if (t.life <= 0) this.texts.splice(i, 1);
        }
    }
    draw(ctx) {
        ctx.textBaseline = 'middle';
        for (const t of this.texts) {
            ctx.globalAlpha = t.life;
            ctx.font = `bold ${t.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.globalAlpha = 1;
    }
}

// ============================================================
// MAIN GAME
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const audio = new AudioSystem();
const particles = new Particles();
const floatingTexts = new FloatingTexts();

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const hudEl = document.getElementById('hud');
const infoDisplayEl = document.getElementById('info-display');
const scoreDisplay = document.getElementById('score-display');
const modeDisplay = document.getElementById('mode-display');
const levelDisplay = document.getElementById('level-display');
const linesDisplay = document.getElementById('lines-display');
const pauseBtn = document.getElementById('pause-btn');
const finalScoreEl = document.getElementById('final-score');
const highScoreEl = document.getElementById('high-score');
const newBestEl = document.getElementById('new-best');
const finalRoundEl = document.getElementById('final-round');
const finalLinesEl = document.getElementById('final-lines');
const finalTetrisesEl = document.getElementById('final-tetrises');

// --- GAME STATE ---
let state = 'START'; // START, TETRIS, FLIPPING_TO_BREAKER, BREAKER, FLIPPING_TO_TETRIS, GAMEOVER
let paused = false;
let loopRunning = false;
let score = 0;
let level = 1;
let totalLines = 0;
let round = 1;
let linesSinceBreaker = 0;
let grid = []; // Tetris grid: grid[row][col] = { type, color, emoji } or null
let currentPiece = null;
let pieceQueue = []; // upcoming piece types
let bag = []; // 7-bag randomizer
let holdType = -1;
let holdUsed = false;
let dropTimer = 0;
let lockTimer = 0;
let lockResets = 0;
let lowestRow = 0;
let lastMoveRotation = false;
let backToBack = false;
let lineCombo = -1; // consecutive line-clearing pieces (-1 = none)
let lastTime = 0;
let animating = false;
let stats = { tetrises: 0, tSpins: 0, maxCombo: 0 };

// Perks earned from power-ups caught in Breaker
let perks = { slowPieces: 0, stickyPieces: 0, doubleTime: 0 };
let caughtTypes = new Set(); // power-up ids caught during the current breaker round

// Breaker state
let breakerGrid = []; // breakerGrid[row][col] = { type, color, emoji, powerup } or null
let breakerCols = 0;
let breakerRows = 0;
let balls = [];
let paddle = { x: 0, y: 0, width: 0, baseWidth: 0 };
let powerups = []; // falling powerup items
let activePowerups = {}; // { wide: msLeft, fire: msLeft, slow: msLeft, sticky: msLeft }
let stickyBall = null; // ball stuck to paddle
let breakerCellSize = 0;
let breakerOffsetX = 0;
let breakerOffsetY = 0;
let bricksRemaining = 0;
let brickCombo = 0; // bricks broken since the last paddle hit
let layoutMorph = 1; // 0 = bricks drawn on the tetris grid, 1 = breaker layout
let landingPreview = null; // tetris grid you'd get back if breaker ended now
let landingCascadeRows = 0;
let previewDirty = true;

// Breaker timer
let breakerTimeRemaining = 0;
let breakerCountdown = 0; // ms remaining before ball starts moving

// Flip animation
let flipProgress = 0;
let flipDirection = 0; // 1 = to breaker, -1 = to tetris

// Screen shake
let shakeTime = 0;
let shakeMag = 0;

// Canvas sizing
let cellSize = 0;
let gridOffsetX = 0;
let gridOffsetY = 0;
let canvasW = 0;
let canvasH = 0;
let holdRect = { x: 0, y: 0, w: 0, h: 0 };

// Input
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchId = null;
let touchLastX = 0;
let touchLastY = 0;
let touchDragCol = 0; // accumulated fractional column movement
let touchDragRow = 0; // accumulated fractional row movement (soft drop)
let touchAxis = null; // 'x' or 'y' once a drag direction is locked in
let touchConsumed = false;
let touchSamples = []; // recent { y, t } for flick velocity
let moveRepeatTimer = 0;
let moveDasDone = false;
let moveDir = 0;
let softDropping = false;
let keysDown = {};

// Line clear animation
let clearingLines = [];
let clearAnimProgress = 0;
let clearAnimDuration = 400;
let pendingClear = null;

// ============================================================
// INITIALIZATION
// ============================================================
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Leave room on both sides of the grid for the hold and next panels
    const sidePanel = Math.max(48, Math.min(90, canvasW * 0.15));
    const maxCellW = (canvasW - sidePanel * 2 - 16) / CONFIG.COLS;
    const maxCellH = (canvasH - 110) / CONFIG.ROWS;
    cellSize = Math.floor(Math.min(maxCellW, maxCellH));
    const gridW = cellSize * CONFIG.COLS;
    const gridH = cellSize * CONFIG.ROWS;
    gridOffsetX = Math.floor((canvasW - gridW) / 2);
    gridOffsetY = 50 + Math.floor((canvasH - 110 - gridH) / 2);

    const pw = getPanelWidth();
    holdRect = { x: gridOffsetX - 6 - pw, y: gridOffsetY, w: pw, h: Math.round(pw * 0.8) + 16 };

    // Recalculate breaker layout if in breaker mode
    if (state === 'BREAKER' || state === 'FLIPPING_TO_BREAKER') {
        calcBreakerLayout();
    }
}

function getPanelWidth() {
    return Math.max(36, Math.min(90, gridOffsetX - 12));
}

function initGrid() {
    grid = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
        grid.push(new Array(CONFIG.COLS).fill(null));
    }
}

function resetGame() {
    score = 0;
    level = 1;
    totalLines = 0;
    round = 1;
    linesSinceBreaker = 0;
    initGrid();
    bag = [];
    pieceQueue = [];
    fillQueue();
    holdType = -1;
    holdUsed = false;
    backToBack = false;
    lineCombo = -1;
    stats = { tetrises: 0, tSpins: 0, maxCombo: 0 };
    perks = { slowPieces: 0, stickyPieces: 0, doubleTime: 0 };
    caughtTypes = new Set();
    currentPiece = null;
    dropTimer = 0;
    clearingLines = [];
    pendingClear = null;
    animating = false;
    balls = [];
    powerups = [];
    activePowerups = {};
    stickyBall = null;
    breakerTimeRemaining = 0;
    moveDir = 0;
    softDropping = false;
    shakeTime = 0;
    paused = false;
    pauseBtn.textContent = '⏸';
    particles.particles = [];
    floatingTexts.texts = [];
    state = 'TETRIS';
    spawnPiece();
    modeDisplay.textContent = 'TETRIS';
    modeDisplay.style.background = 'rgba(224, 64, 251, 0.4)';
    updateHUD();
    hudEl.classList.remove('hidden');
    infoDisplayEl.classList.remove('hidden');
    pauseBtn.classList.remove('hidden');
}

function startGame() {
    audio.init();
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    resizeCanvas();
    resetGame();
    lastTime = 0;
    // Only ever run one game loop, even across restarts
    if (!loopRunning) {
        loopRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

function shake(magnitude, duration) {
    shakeMag = Math.max(shakeMag * (shakeTime > 0 ? 1 : 0), magnitude);
    shakeTime = Math.max(shakeTime, duration);
}

function recomputeLevel() {
    level = Math.floor(totalLines / CONFIG.LINES_PER_LEVEL) + 1;
}

function scoreMultiplier() {
    return perks.doubleTime > 0 ? 2 : 1;
}

// ============================================================
// TETRIS LOGIC
// ============================================================
function fillQueue() {
    while (pieceQueue.length < CONFIG.NEXT_QUEUE_SIZE) {
        if (bag.length === 0) {
            bag = [0, 1, 2, 3, 4, 5, 6];
            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
        }
        pieceQueue.push(bag.pop());
    }
}

function spawnPiece(type = null) {
    if (type === null) {
        type = pieceQueue.shift();
        fillQueue();
    }
    const shape = SHAPES[type][0];
    // SRS spawn: centered, I sits one row higher because of its 4x4 box
    const col = type === 1 ? 4 : 3;
    const row = type === 0 ? -1 : 0;

    currentPiece = { type, rotation: 0, row, col, shape };
    dropTimer = 0;
    lockTimer = 0;
    lockResets = 0;
    lowestRow = row;
    lastMoveRotation = false;
    holdUsed = false;

    // Check if spawn position is blocked
    if (!isValidPosition(currentPiece.row, currentPiece.col, currentPiece.shape)) {
        // Try one row up
        currentPiece.row -= 1;
        if (!isValidPosition(currentPiece.row, currentPiece.col, currentPiece.shape)) {
            triggerGameOver();
        }
    }
}

function isValidPosition(row, col, shape) {
    for (const [dr, dc] of shape) {
        const r = row + dr;
        const c = col + dc;
        if (c < 0 || c >= CONFIG.COLS || r >= CONFIG.ROWS) return false;
        if (r >= 0 && grid[r][c] !== null) return false;
    }
    return true;
}

function isOnGround() {
    return !isValidPosition(currentPiece.row + 1, currentPiece.col, currentPiece.shape);
}

// Moving or rotating on the ground restarts the lock timer, a limited number of times
function onPieceMoved() {
    if (isOnGround() && lockResets < CONFIG.MAX_LOCK_RESETS) {
        lockTimer = 0;
        lockResets++;
    }
}

function movePiece(dCol) {
    if (!currentPiece || animating) return false;
    const newCol = currentPiece.col + dCol;
    if (isValidPosition(currentPiece.row, newCol, currentPiece.shape)) {
        currentPiece.col = newCol;
        lastMoveRotation = false;
        onPieceMoved();
        audio.move();
        return true;
    }
    return false;
}

function rotatePiece(dir = 1) {
    if (!currentPiece || animating) return;
    const type = currentPiece.type;
    if (type === 1) return; // O doesn't rotate
    const oldRot = currentPiece.rotation;
    const newRot = (oldRot + dir + 4) % 4;
    const newShape = SHAPES[type][newRot];

    // Try wall kicks
    let kicks;
    if (type === 0) kicks = dir === 1 ? I_WALL_KICKS_CW : I_WALL_KICKS_CCW;
    else kicks = dir === 1 ? WALL_KICKS_CW : WALL_KICKS_CCW;
    for (const [kc, kr] of kicks[oldRot]) {
        const newRow = currentPiece.row - kr;
        const newCol = currentPiece.col + kc;
        if (isValidPosition(newRow, newCol, newShape)) {
            currentPiece.rotation = newRot;
            currentPiece.shape = newShape;
            currentPiece.row = newRow;
            currentPiece.col = newCol;
            lastMoveRotation = true;
            onPieceMoved();
            audio.rotate();
            return;
        }
    }
}

// Move the piece down one row; returns false if it is resting on something
function stepDown(awardPoints) {
    if (!isValidPosition(currentPiece.row + 1, currentPiece.col, currentPiece.shape)) return false;
    currentPiece.row++;
    if (awardPoints) score += 1;
    lastMoveRotation = false;
    if (currentPiece.row > lowestRow) {
        lowestRow = currentPiece.row;
        lockResets = 0;
        lockTimer = 0;
    }
    return true;
}

function softDrop() {
    if (!currentPiece || animating) return false;
    dropTimer = 0;
    return stepDown(true);
}

function hardDrop() {
    if (!currentPiece || animating) return;
    let rows = 0;
    while (stepDown(false)) rows++;
    score += rows * 2;
    audio.drop();
    if (rows > 0) {
        // Dust kicked up where the piece lands
        for (const [dr, dc] of currentPiece.shape) {
            const px = gridOffsetX + (currentPiece.col + dc) * cellSize + cellSize / 2;
            const py = gridOffsetY + (currentPiece.row + dr + 1) * cellSize;
            particles.emit(px, py, 2, PIECE_COLORS[currentPiece.type], 1.5);
        }
        shake(2, 80);
    }
    lockPiece();
}

function holdPiece() {
    if (state !== 'TETRIS' || !currentPiece || animating || holdUsed) return;
    const type = currentPiece.type;
    if (holdType === -1) {
        holdType = type;
        spawnPiece();
    } else {
        const swap = holdType;
        holdType = type;
        spawnPiece(swap);
    }
    holdUsed = true;
    audio.hold();
}

function getGhostRow() {
    if (!currentPiece) return 0;
    let row = currentPiece.row;
    while (isValidPosition(row + 1, currentPiece.col, currentPiece.shape)) {
        row++;
    }
    return row;
}

// 3-corner rule: T piece, last move was a rotation, 3 of 4 box corners blocked
function detectTSpin() {
    if (!currentPiece || currentPiece.type !== 2 || !lastMoveRotation) return false;
    const r = currentPiece.row;
    const c = currentPiece.col;
    const corners = [[r, c], [r, c + 2], [r + 2, c], [r + 2, c + 2]];
    let blocked = 0;
    for (const [rr, cc] of corners) {
        if (cc < 0 || cc >= CONFIG.COLS || rr >= CONFIG.ROWS || (rr >= 0 && grid[rr][cc])) blocked++;
    }
    return blocked >= 3;
}

function lockPiece() {
    if (!currentPiece) return;
    const type = currentPiece.type;
    const tSpin = detectTSpin();
    let lockedAboveTop = false;
    for (const [dr, dc] of currentPiece.shape) {
        const r = currentPiece.row + dr;
        const c = currentPiece.col + dc;
        if (r < 0) {
            lockedAboveTop = true;
        } else if (r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS) {
            grid[r][c] = {
                type,
                color: PIECE_COLORS[type],
                emoji: EMOJIS[type],
            };
        }
    }
    currentPiece = null;

    // Piece-count perks tick down per piece placed
    if (perks.slowPieces > 0) perks.slowPieces--;
    if (perks.stickyPieces > 0) perks.stickyPieces--;

    if (lockedAboveTop) {
        triggerGameOver();
        return;
    }

    checkLineClears(tSpin);
}

function findFullRows() {
    const lines = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
        if (grid[r].every(cell => cell !== null)) {
            lines.push(r);
        }
    }
    return lines;
}

function checkLineClears(tSpin) {
    const lines = findFullRows();
    const n = lines.length;
    const midX = gridOffsetX + (CONFIG.COLS * cellSize) / 2;

    if (n === 0) {
        lineCombo = -1;
        if (tSpin) {
            const gained = Math.round(CONFIG.TSPIN_SCORES[0] * level * scoreMultiplier());
            score += gained;
            stats.tSpins++;
            floatingTexts.add(midX, gridOffsetY + CONFIG.ROWS * cellSize * 0.4, `T-SPIN +${gained}`, '#ce93d8', 22);
            audio.tSpin();
        }
        spawnPiece();
        return;
    }

    // Score
    const difficult = n >= 4 || tSpin;
    let base = tSpin ? CONFIG.TSPIN_SCORES[Math.min(n, 3)] : CONFIG.LINE_SCORES[Math.min(n, 4)];
    const isBackToBack = difficult && backToBack;
    if (isBackToBack) base *= CONFIG.BACK_TO_BACK_MULT;
    backToBack = difficult;
    lineCombo++;
    let gained = base * level;
    if (lineCombo > 0) gained += CONFIG.COMBO_SCORE * lineCombo * level;
    gained = Math.round(gained * scoreMultiplier());
    score += gained;
    totalLines += n;
    linesSinceBreaker += n;
    if (n >= 4) stats.tetrises++;
    if (tSpin) stats.tSpins++;
    stats.maxCombo = Math.max(stats.maxCombo, lineCombo);
    recomputeLevel();

    // Show floating text
    const midR = lines[Math.floor(n / 2)];
    const py = gridOffsetY + midR * cellSize;
    const names = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];
    if (tSpin) {
        floatingTexts.add(midX, py, `T-SPIN ${names[Math.min(n, 3)]}!`, '#ce93d8', 26);
    } else if (n >= 4) {
        floatingTexts.add(midX, py, 'TETRIS!', '#ffeb3b', 30);
    }
    floatingTexts.add(midX, py, '+' + gained, '#fff', 20);
    if (isBackToBack) floatingTexts.add(midX, py, 'BACK-TO-BACK', '#ff9800', 16);
    if (lineCombo > 0) floatingTexts.add(midX, py, `COMBO ×${lineCombo}`, '#4fc3f7', 16);

    if (tSpin) audio.tSpin();
    else audio.lineClear(n);
    if (difficult) shake(6, 250);

    // Tetris or T-Spin Double/Triple flips right away; otherwise every N lines
    const triggerFlip = n >= 4 || (tSpin && n >= 2) || linesSinceBreaker >= CONFIG.BREAKER_LINES_INTERVAL;
    startLineClear(lines, { triggerFlip, isTetris: n >= 4, cascade: false });
}

function startLineClear(lines, opts) {
    animating = true;
    clearingLines = lines;
    clearAnimProgress = 0;
    pendingClear = opts;

    // Emit particles on clearing lines
    for (const r of lines) {
        for (let c = 0; c < CONFIG.COLS; c++) {
            const cell = grid[r][c];
            if (cell) {
                const px = gridOffsetX + c * cellSize + cellSize / 2;
                const py = gridOffsetY + r * cellSize + cellSize / 2;
                particles.emit(px, py, 4, cell.color, 2);
            }
        }
    }
}

function removeRows(rows) {
    const doomed = new Set(rows);
    grid = grid.filter((_, r) => !doomed.has(r));
    while (grid.length < CONFIG.ROWS) {
        grid.unshift(new Array(CONFIG.COLS).fill(null));
    }
}

function finishLineClear() {
    const opts = pendingClear;
    removeRows(clearingLines);
    clearingLines = [];
    pendingClear = null;
    animating = false;

    // Cascade clears after breaker never chain into another breaker round
    if (opts.cascade) {
        spawnPiece();
        return;
    }

    if (!hasBlocksOnGrid()) {
        const bonus = Math.round(CONFIG.PERFECT_CLEAR_BONUS * level * scoreMultiplier());
        score += bonus;
        floatingTexts.add(canvasW / 2, gridOffsetY + CONFIG.ROWS * cellSize / 2, `PERFECT CLEAR +${bonus}`, '#ffeb3b', 24);
        audio.tetris();
        shake(8, 300);
        // Nothing to break, so start the breaker count over
        linesSinceBreaker = 0;
        spawnPiece();
        return;
    }

    if (opts.triggerFlip) {
        if (opts.isTetris) audio.tetris();
        startFlipToBreaker();
    } else {
        spawnPiece();
    }
}

function getDropInterval() {
    const base = Math.max(CONFIG.MIN_DROP_INTERVAL, CONFIG.BASE_DROP_INTERVAL - (level - 1) * CONFIG.SPEED_DECREASE_PER_LEVEL);
    return perks.slowPieces > 0 ? base * CONFIG.PERK_SLOW_FACTOR : base;
}

function getLockDelay() {
    return perks.stickyPieces > 0 ? CONFIG.PERK_STICKY_LOCK_DELAY : CONFIG.LOCK_DELAY;
}

function hasBlocksOnGrid() {
    for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
            if (grid[r][c]) return true;
        }
    }
    return false;
}

function getStackTopRow() {
    for (let r = 0; r < CONFIG.ROWS; r++) {
        if (grid[r].some(cell => cell !== null)) return r;
    }
    return CONFIG.ROWS;
}

function updateTetris(dt) {
    if (perks.doubleTime > 0) perks.doubleTime = Math.max(0, perks.doubleTime - dt);

    if (animating) {
        clearAnimProgress += dt / clearAnimDuration;
        if (clearAnimProgress >= 1) finishLineClear();
        return;
    }

    if (!currentPiece) return;

    // Handle held movement keys (DAS then auto-repeat)
    if (moveDir !== 0) {
        moveRepeatTimer += dt;
        if (!moveDasDone) {
            if (moveRepeatTimer >= CONFIG.MOVE_DAS) {
                moveDasDone = true;
                moveRepeatTimer = 0;
                movePiece(moveDir);
            }
        } else {
            while (moveRepeatTimer >= CONFIG.MOVE_ARR) {
                moveRepeatTimer -= CONFIG.MOVE_ARR;
                if (!movePiece(moveDir)) break;
            }
        }
    }

    // Gravity / lock delay
    if (isOnGround()) {
        lockTimer += dt;
        if (lockTimer >= getLockDelay()) {
            lockPiece();
        }
    } else {
        dropTimer += dt;
        const interval = softDropping ? Math.min(CONFIG.SOFT_DROP_REPEAT, getDropInterval()) : getDropInterval();
        while (dropTimer >= interval) {
            dropTimer -= interval;
            if (!stepDown(softDropping)) break;
        }
    }
}

// ============================================================
// DRAWING - TETRIS
// ============================================================
function drawTetrisGrid() {
    const gw = CONFIG.COLS * cellSize;
    const gh = CONFIG.ROWS * cellSize;

    // Background
    ctx.fillStyle = '#0d0d20';
    ctx.fillRect(gridOffsetX, gridOffsetY, gw, gh);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= CONFIG.ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(gridOffsetX, gridOffsetY + r * cellSize);
        ctx.lineTo(gridOffsetX + gw, gridOffsetY + r * cellSize);
        ctx.stroke();
    }
    for (let c = 0; c <= CONFIG.COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(gridOffsetX + c * cellSize, gridOffsetY);
        ctx.lineTo(gridOffsetX + c * cellSize, gridOffsetY + gh);
        ctx.stroke();
    }

    // Border pulses red when the stack gets close to the top
    const dangerRows = 5 - getStackTopRow();
    if (state === 'TETRIS' && dangerRows > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150);
        ctx.strokeStyle = `rgba(239, 83, 80, ${0.4 + 0.5 * pulse})`;
        ctx.lineWidth = 2 + dangerRows * 0.6;
        ctx.fillStyle = `rgba(239, 83, 80, ${0.06 * pulse * dangerRows})`;
        ctx.fillRect(gridOffsetX, gridOffsetY, gw, gh);
    } else {
        ctx.strokeStyle = 'rgba(224, 64, 251, 0.4)';
        ctx.lineWidth = 2;
    }
    ctx.strokeRect(gridOffsetX, gridOffsetY, gw, gh);
}

function drawCell(x, y, size, cell, alpha = 1) {
    if (!cell) return;
    ctx.globalAlpha = alpha;
    const edge = Math.max(1, Math.round(size * 0.12));

    // Draw colored background
    ctx.fillStyle = cell.color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Draw highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 1, y + 1, size - 2, edge);
    ctx.fillRect(x + 1, y + 1, edge, size - 2);

    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 1, y + size - 1 - edge, size - 2, edge);
    ctx.fillRect(x + size - 1 - edge, y + 1, edge, size - 2);

    // Draw emoji
    if (size >= 9) {
        ctx.font = `${Math.floor(size * 0.6)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.emoji, x + size / 2, y + size / 2 + 1);
    }

    ctx.globalAlpha = 1;
}

function drawPlacedBlocks() {
    for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
            if (grid[r][c]) {
                // Check if this row is being cleared
                let alpha = 1;
                if (clearingLines.includes(r)) {
                    alpha = Math.max(0, 1 - clearAnimProgress);
                }
                const x = gridOffsetX + c * cellSize;
                const y = gridOffsetY + r * cellSize;
                drawCell(x, y, cellSize, grid[r][c], alpha);
            }
        }
    }
    // Flash clearing rows white as they fade
    if (clearingLines.length) {
        ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - clearAnimProgress)})`;
        for (const r of clearingLines) {
            ctx.fillRect(gridOffsetX, gridOffsetY + r * cellSize, CONFIG.COLS * cellSize, cellSize);
        }
    }
}

function drawGhostPiece() {
    if (!currentPiece || animating) return;
    const ghostRow = getGhostRow();
    if (ghostRow === currentPiece.row) return;

    ctx.globalAlpha = 0.25;
    for (const [dr, dc] of currentPiece.shape) {
        const r = ghostRow + dr;
        const c = currentPiece.col + dc;
        if (r >= 0) {
            const x = gridOffsetX + c * cellSize;
            const y = gridOffsetY + r * cellSize;
            ctx.fillStyle = PIECE_COLORS[currentPiece.type];
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        }
    }
    ctx.globalAlpha = 1;
}

function drawCurrentPiece() {
    if (!currentPiece || animating) return;
    // Fade slightly while the lock timer runs out
    const lockFade = isOnGround() ? 1 - 0.35 * Math.min(1, lockTimer / getLockDelay()) : 1;
    for (const [dr, dc] of currentPiece.shape) {
        const r = currentPiece.row + dr;
        const c = currentPiece.col + dc;
        if (r >= 0) {
            const x = gridOffsetX + c * cellSize;
            const y = gridOffsetY + r * cellSize;
            drawCell(x, y, cellSize, {
                type: currentPiece.type,
                color: PIECE_COLORS[currentPiece.type],
                emoji: EMOJIS[currentPiece.type],
            }, lockFade);
        }
    }
}

// Draw a piece centered at (cx, cy) using its spawn rotation
function drawMiniPiece(type, cx, cy, cs, alpha = 1) {
    const shape = SHAPES[type][0];
    let minR = 99, maxR = -1, minC = 99, maxC = -1;
    for (const [r, c] of shape) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
    }
    const ox = cx - ((maxC - minC + 1) * cs) / 2;
    const oy = cy - ((maxR - minR + 1) * cs) / 2;
    for (const [r, c] of shape) {
        drawCell(ox + (c - minC) * cs, oy + (r - minR) * cs, cs, {
            color: PIECE_COLORS[type],
            emoji: EMOJIS[type],
        }, alpha);
    }
}

function drawPanelBox(x, y, w, h, label) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeStyle = 'rgba(224, 64, 251, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#888';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + 9);
}

function drawSidePanels() {
    const pw = getPanelWidth();
    const cs = Math.floor(Math.min(pw / 5, 18));

    // Hold (tap it to hold on mobile)
    drawPanelBox(holdRect.x, holdRect.y, holdRect.w, holdRect.h, 'HOLD');
    if (holdType !== -1) {
        drawMiniPiece(holdType, holdRect.x + holdRect.w / 2, holdRect.y + 16 + (holdRect.h - 16) / 2, cs, holdUsed ? 0.35 : 1);
    }

    // Next queue
    const nextX = gridOffsetX + CONFIG.COLS * cellSize + 6;
    const slotH = Math.round(pw * 0.7);
    const nextH = 18 + slotH * CONFIG.NEXT_QUEUE_SIZE;
    drawPanelBox(nextX, gridOffsetY, pw, nextH, 'NEXT');
    for (let i = 0; i < CONFIG.NEXT_QUEUE_SIZE && i < pieceQueue.length; i++) {
        const scale = i === 0 ? 1 : 0.8;
        drawMiniPiece(pieceQueue[i], nextX + pw / 2, gridOffsetY + 18 + slotH * i + slotH / 2, Math.floor(cs * scale), i === 0 ? 1 : 0.7);
    }

    // Active perks under the hold box
    const perkLines = [];
    if (perks.doubleTime > 0) perkLines.push({ text: `💎 2× ${Math.ceil(perks.doubleTime / 1000)}s`, color: '#e040fb' });
    if (perks.slowPieces > 0) perkLines.push({ text: `🐢 ${perks.slowPieces}`, color: '#66bb6a' });
    if (perks.stickyPieces > 0) perkLines.push({ text: `🧲 ${perks.stickyPieces}`, color: '#ff9800' });
    if (backToBack) perkLines.push({ text: 'B2B', color: '#ff9800' });
    if (lineCombo > 0) perkLines.push({ text: `C×${lineCombo}`, color: '#4fc3f7' });
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let y = holdRect.y + holdRect.h + 14;
    for (const line of perkLines) {
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, holdRect.x + holdRect.w / 2, y);
        y += 17;
    }
}

function drawBreakerProgressBar() {
    // Show progress toward next breaker flip below the tetris grid
    const gw = CONFIG.COLS * cellSize;
    const barWidth = gw;
    const barHeight = 6;
    const barX = gridOffsetX;
    const barY = gridOffsetY + CONFIG.ROWS * cellSize + 8;

    const progress = Math.min(1, linesSinceBreaker / CONFIG.BREAKER_LINES_INTERVAL);

    // Background track
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 3);
    ctx.fill();

    // Fill
    if (progress > 0) {
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY);
        gradient.addColorStop(0, '#e040fb');
        gradient.addColorStop(1, '#ff5722');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth * progress, barHeight, 3);
        ctx.fill();
    }

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`BREAKER ${Math.min(linesSinceBreaker, CONFIG.BREAKER_LINES_INTERVAL)}/${CONFIG.BREAKER_LINES_INTERVAL} · OR SCORE A TETRIS`, barX + barWidth / 2, barY + barHeight + 11);
}

function drawTetrisScene() {
    drawTetrisGrid();
    drawGhostPiece();
    drawPlacedBlocks();
    drawCurrentPiece();
    drawSidePanels();
    drawBreakerProgressBar();
}

// ============================================================
// BRICK BREAKER LOGIC
// ============================================================
function calcBreakerLayout() {
    // Find the bounding box of rows that actually have bricks
    let topRow = breakerRows, bottomRow = 0;
    for (let r = 0; r < breakerRows; r++) {
        for (let c = 0; c < breakerCols; c++) {
            if (breakerGrid[r] && breakerGrid[r][c]) {
                if (r < topRow) topRow = r;
                if (r > bottomRow) bottomRow = r;
            }
        }
    }
    if (topRow > bottomRow) { topRow = 0; bottomRow = 0; }

    // Only size based on rows that have bricks; keep the lower part of the
    // screen open so there is always room to play the ball
    const brickRowCount = bottomRow - topRow + 1;
    const topMargin = 64; // space for HUD, timer and banked perks at top

    const availW = canvasW * 0.95;
    const availH = (canvasH - topMargin) * 0.58;
    const cs = Math.floor(Math.min(availW / breakerCols, availH / brickRowCount));
    breakerCellSize = Math.max(cs, 6);
    const totalW = breakerCols * breakerCellSize;
    breakerOffsetX = Math.floor((canvasW - totalW) / 2);
    // Position so bricks start at the top margin, shifted by topRow
    breakerOffsetY = topMargin - topRow * breakerCellSize;

    // Paddle (keep wide power-up through a resize)
    paddle.baseWidth = Math.floor(canvasW * CONFIG.PADDLE_WIDTH_RATIO);
    paddle.width = paddle.baseWidth * (activePowerups.wide ? CONFIG.PADDLE_WIDE_MULTIPLIER : 1);
    paddle.x = paddle.x ? Math.max(paddle.width / 2, Math.min(canvasW - paddle.width / 2, paddle.x)) : canvasW / 2;
    paddle.y = canvasH - 80;
}

function convertToBreakerGrid() {
    // Each tetris cell becomes 2x2 in breaker
    breakerCols = CONFIG.COLS * 2;
    breakerRows = CONFIG.ROWS * 2;
    breakerGrid = [];
    bricksRemaining = 0;

    for (let r = 0; r < breakerRows; r++) {
        breakerGrid.push(new Array(breakerCols).fill(null));
    }

    for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
            if (grid[r][c]) {
                const cell = grid[r][c];
                // Flip vertically: bottom tetris row -> top breaker row
                const flippedR = CONFIG.ROWS - 1 - r;
                // Roll power-ups per tetris cell; one of its 4 bricks carries it
                let powerupSlot = -1;
                let powerup = null;
                if (Math.random() < CONFIG.POWERUP_CHANCE) {
                    powerupSlot = Math.floor(Math.random() * 4);
                    powerup = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                }
                // Fill 2x2
                for (let i = 0; i < 4; i++) {
                    const br = flippedR * 2 + (i >> 1);
                    const bc = c * 2 + (i & 1);
                    breakerGrid[br][bc] = {
                        type: cell.type,
                        color: cell.color,
                        emoji: cell.emoji,
                        powerup: i === powerupSlot ? powerup : null,
                    };
                    bricksRemaining++;
                }
            }
        }
    }

    paddle.x = canvasW / 2;
    previewDirty = true;
    calcBreakerLayout();
}

function currentBallSpeed() {
    return CONFIG.BALL_SPEED * Math.min(CONFIG.BALL_SPEED_MAX_MULT, 1 + CONFIG.BALL_SPEED_PER_ROUND * (round - 1));
}

function launchBallFromPaddle(ball, spread) {
    const speed = currentBallSpeed();
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
}

function releaseStickyBall() {
    if (!stickyBall) return;
    launchBallFromPaddle(stickyBall, 0.4);
    stickyBall = null;
}

function brickComboMultiplier() {
    return Math.min(CONFIG.BRICK_COMBO_MAX, 1 + Math.floor(brickCombo / CONFIG.BRICK_COMBO_STEP));
}

// Count how many of a tetris cell's 4 bricks are still standing
function cellSurvivors(tr, tc) {
    let count = 0;
    let found = null;
    for (let i = 0; i < 4; i++) {
        const row = breakerGrid[tr * 2 + (i >> 1)];
        const brick = row && row[tc * 2 + (i & 1)];
        if (brick) {
            count++;
            found = brick;
        }
    }
    return { count, found };
}

// Build the tetris grid you'd get back right now: cells with enough
// surviving bricks return, then every column settles to the bottom
function buildReturnGrid() {
    const g = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
        g.push(new Array(CONFIG.COLS).fill(null));
    }
    for (let r = 0; r < CONFIG.ROWS; r++) {
        // Undo the vertical flip from convertToBreakerGrid
        const flippedR = CONFIG.ROWS - 1 - r;
        for (let c = 0; c < CONFIG.COLS; c++) {
            const { count, found } = cellSurvivors(flippedR, c);
            if (count >= CONFIG.CELL_SURVIVE_MIN_BRICKS) {
                g[r][c] = { type: found.type, color: found.color, emoji: found.emoji };
            }
        }
    }

    // Apply gravity: drop all blocks to the bottom
    for (let c = 0; c < CONFIG.COLS; c++) {
        const cells = [];
        for (let r = CONFIG.ROWS - 1; r >= 0; r--) {
            if (g[r][c]) cells.push(g[r][c]);
        }
        for (let r = 0; r < CONFIG.ROWS; r++) {
            g[r][c] = null;
        }
        for (let i = 0; i < cells.length; i++) {
            g[CONFIG.ROWS - 1 - i][c] = cells[i];
        }
    }
    return g;
}

function refreshLandingPreview() {
    landingPreview = buildReturnGrid();
    landingCascadeRows = landingPreview.filter(row => row.every(cell => cell !== null)).length;
    previewDirty = false;
}

function landingPreviewIsEmpty() {
    return landingPreview.every(row => row.every(cell => cell === null));
}

function updateBreaker(dt) {
    const dtSec = dt / 1000; // delta time in seconds
    layoutMorph = Math.min(1, layoutMorph + dt / CONFIG.LAYOUT_MORPH_DURATION);

    // Paddle movement with keys
    if (moveDir !== 0) {
        paddle.x += moveDir * CONFIG.PADDLE_KEY_SPEED * dtSec;
        paddle.x = Math.max(paddle.width / 2, Math.min(canvasW - paddle.width / 2, paddle.x));
    }

    // Countdown before ball starts moving
    if (breakerCountdown > 0) {
        breakerCountdown -= dt;
        for (const ball of balls) {
            if (ball.vx === 0 && ball.vy === 0) {
                ball.x = paddle.x;
                ball.y = paddle.y - CONFIG.BALL_RADIUS - 2;
                if (breakerCountdown <= 0) launchBallFromPaddle(ball, 0.6);
            }
        }
        if (breakerCountdown > 0) return; // Skip all other breaker logic during countdown
        breakerCountdown = 0;
    }

    // Update active powerup timers
    for (const key of Object.keys(activePowerups)) {
        activePowerups[key] -= dt;
        if (activePowerups[key] > 0) continue;
        delete activePowerups[key];
        if (key === 'wide') paddle.width = paddle.baseWidth;
        // Release any stuck ball with velocity
        if (key === 'sticky') releaseStickyBall();
    }

    // Move sticky ball with paddle
    if (stickyBall) {
        stickyBall.x = paddle.x + stickyBall.offsetX;
        stickyBall.y = paddle.y - CONFIG.BALL_RADIUS - 2;
    }

    // Update balls
    const speedMult = activePowerups.slow ? CONFIG.SLOW_BALL_FACTOR : 1;
    const isFire = !!activePowerups.fire;

    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        if (ball === stickyBall) continue;
        if (!updateBall(ball, dtSec * speedMult, isFire)) {
            balls.splice(i, 1);
        }
    }

    // If no balls left, breaker round is over -> convert back to tetris
    if (balls.length === 0) {
        floatingTexts.add(canvasW / 2, canvasH / 2, 'BALL LOST!', '#ef5350', 24);
        startFlipToTetris();
        return;
    }

    // Time limit
    breakerTimeRemaining = Math.max(0, breakerTimeRemaining - dt);
    if (breakerTimeRemaining <= 0) {
        floatingTexts.add(canvasW / 2, canvasH / 2, 'TIME UP!', '#ffeb3b', 24);
        startFlipToTetris();
        return;
    }

    // Update falling powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        pu.y += CONFIG.POWERUP_FALL_SPEED * dtSec;

        // Collect with paddle
        if (pu.y >= paddle.y - 10 && pu.y <= paddle.y + CONFIG.PADDLE_HEIGHT + 10 &&
            pu.x >= paddle.x - paddle.width / 2 - 10 &&
            pu.x <= paddle.x + paddle.width / 2 + 10) {
            activatePowerup(pu.type);
            powerups.splice(i, 1);
            audio.powerup();
            score += CONFIG.POWERUP_SCORE * level;
            floatingTexts.add(pu.x, pu.y - 20, pu.type.label, pu.type.color, 16);
            if (!caughtTypes.has(pu.type.id)) {
                caughtTypes.add(pu.type.id);
                floatingTexts.add(pu.x, pu.y - 20, `+ ${pu.type.perk} banked`, '#fff', 12);
            }
            continue;
        }

        // Off screen
        if (pu.y > canvasH + 20) {
            powerups.splice(i, 1);
        }
    }

    if (previewDirty) refreshLandingPreview();

    // Board is clear once no tetris cell would come back
    if (landingPreviewIsEmpty()) {
        const bonus = CONFIG.ALL_CLEAR_BONUS * level;
        score += bonus;
        floatingTexts.add(canvasW / 2, canvasH / 2, `BOARD CLEAR! +${bonus}`, '#ffeb3b', 24);
        shake(8, 300);
        startFlipToTetris();
    }
}

// Move a ball in small sub-steps so it can't tunnel through bricks or the
// paddle on slow frames. Returns false if the ball fell off the screen.
function updateBall(ball, dtSec, isFire) {
    const R = CONFIG.BALL_RADIUS;
    const travel = Math.max(Math.abs(ball.vx), Math.abs(ball.vy)) * dtSec;
    const steps = Math.max(1, Math.ceil(travel / (R * 0.75)));
    const stepSec = dtSec / steps;

    for (let s = 0; s < steps; s++) {
        ball.x += ball.vx * stepSec;
        ball.y += ball.vy * stepSec;

        // Wall bounces
        if (ball.x - R < 0) {
            ball.x = R;
            ball.vx = Math.abs(ball.vx);
            audio.wallBounce();
        }
        if (ball.x + R > canvasW) {
            ball.x = canvasW - R;
            ball.vx = -Math.abs(ball.vx);
            audio.wallBounce();
        }
        if (ball.y - R < 0) {
            ball.y = R;
            ball.vy = Math.abs(ball.vy);
            audio.wallBounce();
        }

        // Paddle collision
        if (ball.vy > 0 &&
            ball.y + R >= paddle.y &&
            ball.y + R <= paddle.y + CONFIG.PADDLE_HEIGHT + 4 &&
            ball.x >= paddle.x - paddle.width / 2 - R / 2 &&
            ball.x <= paddle.x + paddle.width / 2 + R / 2) {

            // Angle based on where it hit the paddle
            // hitPos: 0 = left edge, 1 = right edge
            const hitPos = Math.max(0, Math.min(1, (ball.x - (paddle.x - paddle.width / 2)) / paddle.width));
            // Left edge -> ball goes left (angle ~150deg), right edge -> ball goes right (angle ~30deg)
            const angle = -Math.PI + (Math.PI * 0.17) + hitPos * (Math.PI * 0.66); // ~-150 to ~-30 degrees
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
            ball.y = paddle.y - R - 1;
            audio.paddleHit();
            brickCombo = 0;

            // Sticky check
            if (activePowerups.sticky && !stickyBall) {
                stickyBall = ball;
                ball.offsetX = ball.x - paddle.x;
                ball.vx = 0;
                ball.vy = 0;
                return true;
            }
        }

        // Ball falls below paddle
        if (ball.y - R > canvasH) return false;

        // Brick collision
        checkBrickCollision(ball, isFire);
    }
    return true;
}

function checkBrickCollision(ball, isFire) {
    const R = CONFIG.BALL_RADIUS;
    // Find which cell the ball is in
    const bx = ball.x - breakerOffsetX;
    const by = ball.y - breakerOffsetY;
    const col = Math.floor(bx / breakerCellSize);
    const row = Math.floor(by / breakerCellSize);
    const reach = Math.ceil(R / breakerCellSize);

    // Check surrounding cells
    for (let dr = -reach; dr <= reach; dr++) {
        for (let dc = -reach; dc <= reach; dc++) {
            const r = row + dr;
            const c = col + dc;
            if (r < 0 || r >= breakerRows || c < 0 || c >= breakerCols) continue;
            if (!breakerGrid[r] || !breakerGrid[r][c]) continue;

            const brickX = breakerOffsetX + c * breakerCellSize;
            const brickY = breakerOffsetY + r * breakerCellSize;

            // AABB collision with ball
            const closestX = Math.max(brickX, Math.min(ball.x, brickX + breakerCellSize));
            const closestY = Math.max(brickY, Math.min(ball.y, brickY + breakerCellSize));
            const distX = ball.x - closestX;
            const distY = ball.y - closestY;

            if (distX * distX + distY * distY < R * R) {
                // Destroy brick
                destroyBrick(r, c);

                if (!isFire) {
                    // Reflect off the face that was hit and push the ball just outside it
                    const dx = ball.x - (brickX + breakerCellSize / 2);
                    const dy = ball.y - (brickY + breakerCellSize / 2);

                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (dx > 0) {
                            ball.vx = Math.abs(ball.vx);
                            ball.x = brickX + breakerCellSize + R;
                        } else {
                            ball.vx = -Math.abs(ball.vx);
                            ball.x = brickX - R;
                        }
                    } else {
                        if (dy > 0) {
                            ball.vy = Math.abs(ball.vy);
                            ball.y = brickY + breakerCellSize + R;
                        } else {
                            ball.vy = -Math.abs(ball.vy);
                            ball.y = brickY - R;
                        }
                    }
                    return; // One collision per step for non-fire
                }
            }
        }
    }
}

function destroyBrick(r, c) {
    const brick = breakerGrid[r][c];
    if (!brick) return;

    // Particles
    const px = breakerOffsetX + c * breakerCellSize + breakerCellSize / 2;
    const py = breakerOffsetY + r * breakerCellSize + breakerCellSize / 2;
    particles.emit(px, py, 5, brick.color, 2.5);

    // Spawn powerup drop if brick had one
    if (brick.powerup) {
        powerups.push({
            x: px,
            y: py,
            type: brick.powerup,
        });
    }

    breakerGrid[r][c] = null;
    bricksRemaining--;
    previewDirty = true;

    // Combo: bricks broken without the ball touching the paddle
    const prevMult = brickComboMultiplier();
    brickCombo++;
    const mult = brickComboMultiplier();
    score += CONFIG.BRICK_SCORE * level * mult;
    if (mult > prevMult) {
        floatingTexts.add(px, py, `COMBO ×${mult}`, '#4fc3f7', 18);
    }

    // Add time for each brick broken
    breakerTimeRemaining += CONFIG.BREAKER_TIME_PER_BRICK;
    audio.brickBreak(brickCombo);
}

function activatePowerup(type) {
    switch (type.id) {
        case 'multiball': {
            // Add up to 2 more balls
            const speed = currentBallSpeed();
            const extra = Math.min(2, CONFIG.MAX_BALLS - balls.length);
            for (let i = 0; i < extra; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
                balls.push({
                    x: paddle.x + (i === 0 ? -15 : 15),
                    y: paddle.y - CONFIG.BALL_RADIUS - 10,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                });
            }
            break;
        }
        case 'wide':
            activePowerups.wide = CONFIG.POWERUP_DURATION_WIDE;
            paddle.width = paddle.baseWidth * CONFIG.PADDLE_WIDE_MULTIPLIER;
            break;
        case 'fire':
            activePowerups.fire = CONFIG.POWERUP_DURATION_FIRE;
            break;
        case 'slow':
            activePowerups.slow = CONFIG.POWERUP_DURATION_SLOW;
            break;
        case 'bonus': {
            const bonus = 500 * level;
            score += bonus;
            floatingTexts.add(paddle.x, paddle.y - 30, '+' + bonus, '#e040fb', 22);
            break;
        }
        case 'sticky':
            activePowerups.sticky = CONFIG.POWERUP_DURATION_STICKY;
            break;
    }
}

// ============================================================
// DRAWING - BRICK BREAKER
// ============================================================

// Draw bricks blended between the tetris grid position (0) and the
// breaker layout (1). Bricks whose cell is already doomed are dimmed,
// and cells one hit from vanishing show a crack.
function drawBreakerBricks(blend) {
    const t = blend * blend * (3 - 2 * blend); // smoothstep
    const subCell = cellSize / 2;
    const size = subCell + (breakerCellSize - subCell) * t;

    for (let tr = 0; tr < CONFIG.ROWS; tr++) {
        for (let tc = 0; tc < CONFIG.COLS; tc++) {
            const { count } = cellSurvivors(tr, tc);
            if (count === 0) continue;
            const doomed = count < CONFIG.CELL_SURVIVE_MIN_BRICKS;
            const cracked = count === CONFIG.CELL_SURVIVE_MIN_BRICKS && count < 4;

            for (let i = 0; i < 4; i++) {
                const r = tr * 2 + (i >> 1);
                const c = tc * 2 + (i & 1);
                const brick = breakerGrid[r][c];
                if (!brick) continue;
                const x = (gridOffsetX + c * subCell) * (1 - t) + (breakerOffsetX + c * breakerCellSize) * t;
                const y = (gridOffsetY + r * subCell) * (1 - t) + (breakerOffsetY + r * breakerCellSize) * t;

                ctx.globalAlpha = doomed ? 0.3 : 1;

                // Brick body
                ctx.fillStyle = brick.color;
                ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(x + 1, y + 1, size - 2, 2);

                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(x + 1, y + size - 3, size - 2, 2);

                // Emoji
                if (size >= 8) {
                    ctx.font = `${Math.floor(size * 0.5)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(brick.emoji, x + size / 2, y + size / 2 + 1);
                }

                if (cracked) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(x + size * 0.2, y + size * 0.25);
                    ctx.lineTo(x + size * 0.5, y + size * 0.55);
                    ctx.lineTo(x + size * 0.8, y + size * 0.4);
                    ctx.stroke();
                }

                // Power-up glow
                if (brick.powerup) {
                    ctx.strokeStyle = brick.powerup.color;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = brick.powerup.color;
                    ctx.shadowBlur = 6;
                    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
                    ctx.shadowBlur = 0;

                    // Small powerup emoji
                    ctx.font = `${Math.max(5, Math.floor(size * 0.55))}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(brick.powerup.emoji, x + size / 2, y + size / 2 + 1);
                }
            }
        }
    }
    ctx.globalAlpha = 1;
}

function drawBreakerHUD() {
    // Timer bar at top
    const barWidth = canvasW * 0.8;
    const barX = (canvasW - barWidth) / 2;
    const barY = 40;
    const pct = Math.min(1, breakerTimeRemaining / CONFIG.BREAKER_TIME_LIMIT);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(barX, barY, barWidth, 4);
    ctx.fillStyle = pct > 0.3 ? '#e040fb' : '#ef5350';
    ctx.fillRect(barX, barY, barWidth * pct, 4);

    ctx.font = 'bold 11px Arial';
    ctx.textBaseline = 'middle';

    // Perks banked so far this round
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    let banked = 'BANKED: ';
    for (const type of POWERUP_TYPES) {
        if (caughtTypes.has(type.id)) banked += type.emoji;
    }
    if (caughtTypes.size === 0) banked += '—';
    ctx.fillText(banked, barX, barY + 13);

    // Brick combo multiplier
    const mult = brickComboMultiplier();
    if (mult > 1) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#4fc3f7';
        ctx.fillText(`COMBO ×${mult}`, barX + barWidth, barY + 13);
    }
}

// Mini-map of the tetris board you'll return to, with cascade rows in gold
function drawLandingPreview() {
    if (!landingPreview) return;
    const cs = Math.max(3, Math.floor(Math.min(canvasW * 0.14 / CONFIG.COLS, canvasH * 0.16 / CONFIG.ROWS)));
    const w = cs * CONFIG.COLS;
    const h = cs * CONFIG.ROWS;
    const x = canvasW - w - 10;
    const y = paddle.y - 26 - h;

    ctx.globalAlpha = 0.75;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.strokeStyle = 'rgba(224, 64, 251, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);

    for (let r = 0; r < CONFIG.ROWS; r++) {
        const full = landingPreview[r].every(cell => cell !== null);
        for (let c = 0; c < CONFIG.COLS; c++) {
            const cell = landingPreview[r][c];
            if (!cell) continue;
            ctx.fillStyle = full ? '#ffd54f' : cell.color;
            ctx.fillRect(x + c * cs, y + r * cs, cs - 1, cs - 1);
        }
    }

    ctx.globalAlpha = 1;
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('YOUR BOARD', x + w / 2, y - 9);
    if (landingCascadeRows > 0) {
        ctx.fillStyle = '#ffd54f';
        ctx.fillText(`CASCADE ×${landingCascadeRows}`, x + w / 2, y + h + 10);
    }
}

function drawPaddle() {
    const px = paddle.x - paddle.width / 2;

    // Glow
    ctx.shadowColor = activePowerups.fire ? '#ff5722' : '#e040fb';
    ctx.shadowBlur = 10;

    // Paddle body
    const gradient = ctx.createLinearGradient(px, paddle.y, px, paddle.y + CONFIG.PADDLE_HEIGHT);
    gradient.addColorStop(0, activePowerups.fire ? '#ff8a65' : '#e040fb');
    gradient.addColorStop(1, activePowerups.fire ? '#d84315' : '#9c27b0');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(px, paddle.y, paddle.width, CONFIG.PADDLE_HEIGHT, 6);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(px + 2, paddle.y + 1, paddle.width - 4, 4, 3);
    ctx.fill();
}

function drawBalls() {
    const isFire = !!activePowerups.fire;
    for (const ball of balls) {
        // Glow
        ctx.shadowColor = isFire ? '#ff5722' : '#fff';
        ctx.shadowBlur = isFire ? 12 : 6;

        // Trail (velocity is px/s, so look back ~30ms)
        if (isFire) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff5722';
            ctx.beginPath();
            ctx.arc(ball.x - ball.vx * 0.03, ball.y - ball.vy * 0.03, CONFIG.BALL_RADIUS * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Ball
        ctx.fillStyle = isFire ? '#ff5722' : '#fff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(ball.x - 2, ball.y - 2, CONFIG.BALL_RADIUS * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPowerupDrops() {
    for (const pu of powerups) {
        // Background circle
        ctx.fillStyle = pu.type.color;
        ctx.shadowColor = pu.type.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Emoji
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type.emoji, pu.x, pu.y);
    }
}

function drawActivePowerupIndicators() {
    let y = canvasH - 70;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const [key, msLeft] of Object.entries(activePowerups)) {
        const remaining = Math.max(0, msLeft / 1000);
        const type = POWERUP_TYPES.find(t => t.id === key);
        if (!type || remaining <= 0) continue;

        ctx.fillStyle = type.color;
        ctx.globalAlpha = 0.8;
        ctx.fillText(`${type.emoji} ${remaining.toFixed(1)}s`, 10, y);
        y -= 18;
    }
    ctx.globalAlpha = 1;
}

function drawBreakerScene() {
    ctx.fillStyle = '#0d0d20';
    ctx.fillRect(0, 0, canvasW, canvasH);
    drawBreakerBricks(layoutMorph);
    drawBreakerHUD();
    drawLandingPreview();
    drawPaddle();
    drawBalls();
    drawPowerupDrops();
    drawActivePowerupIndicators();

    // Draw countdown overlay
    if (breakerCountdown > 0) {
        const secs = Math.ceil(breakerCountdown / 1000);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvasW, canvasH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(secs, canvasW / 2, canvasH / 2 - 20);
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#e040fb';
        ctx.fillText('GET READY', canvasW / 2, canvasH / 2 + 25);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('Break all 4 bricks of a block to remove it', canvasW / 2, canvasH / 2 + 55);
        ctx.fillText('Catch power-ups to bank Tetris perks', canvasW / 2, canvasH / 2 + 73);
    }
}

// ============================================================
// FLIP TRANSITION
// ============================================================
function startFlipToBreaker() {
    state = 'FLIPPING_TO_BREAKER';
    flipProgress = 0;
    flipDirection = 1;
    currentPiece = null;
    moveDir = 0;
    softDropping = false;
    linesSinceBreaker = 0;
    caughtTypes = new Set();
    brickCombo = 0;
    layoutMorph = 0;
    audio.flipSound();

    // Prepare breaker grid from tetris grid
    convertToBreakerGrid();
    refreshLandingPreview();
}

function startFlipToTetris() {
    state = 'FLIPPING_TO_TETRIS';
    flipProgress = 0;
    flipDirection = -1;
    moveDir = 0;
    audio.flipSound();
    balls = [];
    powerups = [];
    activePowerups = {};
    stickyBall = null;
    paddle.width = paddle.baseWidth;

    // Convert remaining bricks back to tetris with gravity
    grid = buildReturnGrid();
}

// Turn the power-ups caught during breaker into Tetris-side perks
function applyBankedPerks() {
    const midX = gridOffsetX + (CONFIG.COLS * cellSize) / 2;
    let y = gridOffsetY + CONFIG.ROWS * cellSize * 0.3;
    for (const type of POWERUP_TYPES) {
        if (!caughtTypes.has(type.id)) continue;
        switch (type.id) {
            case 'multiball':
                pieceQueue.unshift(0); // I piece next
                break;
            case 'wide':
                linesSinceBreaker = Math.max(linesSinceBreaker, Math.floor(CONFIG.BREAKER_LINES_INTERVAL / 2));
                break;
            case 'fire': {
                // Burn away the bottom row
                const bottom = CONFIG.ROWS - 1;
                if (grid[bottom].some(cell => cell)) {
                    for (let c = 0; c < CONFIG.COLS; c++) {
                        if (grid[bottom][c]) {
                            particles.emit(gridOffsetX + c * cellSize + cellSize / 2, gridOffsetY + bottom * cellSize + cellSize / 2, 6, '#ff5722', 3);
                        }
                    }
                    removeRows([bottom]);
                }
                break;
            }
            case 'slow':
                perks.slowPieces += CONFIG.PERK_SLOW_PIECES;
                break;
            case 'bonus':
                perks.doubleTime += CONFIG.PERK_DOUBLE_DURATION;
                break;
            case 'sticky':
                perks.stickyPieces += CONFIG.PERK_STICKY_PIECES;
                break;
        }
        floatingTexts.add(midX, y, `${type.emoji} ${type.perk}`, type.color, 18);
        y += 24;
    }
    if (caughtTypes.size > 0) audio.perk();
    caughtTypes = new Set();
}

function updateFlip(dt) {
    flipProgress += dt / CONFIG.FLIP_DURATION;
    if (flipProgress >= 1) {
        flipProgress = 1;
        if (flipDirection === 1) {
            // Now in breaker mode with a countdown before ball moves
            state = 'BREAKER';
            modeDisplay.textContent = 'BREAKER';
            modeDisplay.style.background = 'rgba(255, 87, 34, 0.4)';
            breakerCountdown = CONFIG.BREAKER_COUNTDOWN;
            breakerTimeRemaining = CONFIG.BREAKER_TIME_LIMIT;
            layoutMorph = 0;
            // Place ball on paddle but don't give it velocity yet
            balls.push({
                x: paddle.x,
                y: paddle.y - CONFIG.BALL_RADIUS - 2,
                vx: 0,
                vy: 0,
            });
        } else {
            // Back to tetris - grid was already set by startFlipToTetris
            state = 'TETRIS';
            round++;
            modeDisplay.textContent = `TETRIS R${round}`;
            modeDisplay.style.background = 'rgba(224, 64, 251, 0.4)';
            applyBankedPerks();

            // Rows that came back full clear right away as a cascade bonus
            const full = findFullRows();
            if (full.length > 0) {
                const gained = Math.round(CONFIG.CASCADE_SCORE * full.length * level * scoreMultiplier());
                score += gained;
                totalLines += full.length;
                recomputeLevel();
                floatingTexts.add(gridOffsetX + (CONFIG.COLS * cellSize) / 2, gridOffsetY + full[0] * cellSize, `CASCADE ×${full.length} +${gained}`, '#ffd54f', 22);
                audio.cascade();
                shake(4, 200);
                startLineClear(full, { cascade: true });
            } else {
                spawnPiece();
            }
        }
        updateHUD();
    }
}

function drawFlipTransition() {
    // 3D flip effect using canvas transforms. The board turns over top to
    // bottom, so the breaker side already has its rows flipped.
    const progress = flipProgress;
    const scaleY = Math.max(0.01, Math.abs(Math.cos(progress * Math.PI)));
    const centerY = canvasH / 2;

    ctx.save();
    ctx.fillStyle = '#0d0d20';
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.translate(0, centerY);
    ctx.scale(1, scaleY);
    ctx.translate(0, -centerY);

    const showTetrisSide = (progress < 0.5) === (flipDirection === 1);
    if (showTetrisSide) {
        drawTetrisGrid();
        drawPlacedBlocks();
    } else {
        // Leaving breaker: bricks slide from the breaker layout back onto the grid
        const blend = flipDirection === -1 ? Math.max(0, 1 - progress * 2) : 0;
        drawBreakerBricks(blend);
    }

    ctx.restore();

    // Flash effect at midpoint
    if (progress > 0.4 && progress < 0.6) {
        const flash = 1 - Math.abs(progress - 0.5) * 5;
        ctx.fillStyle = `rgba(224, 64, 251, ${flash * 0.5})`;
        ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Text
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = Math.sin(progress * Math.PI);
    if (flipDirection === 1) {
        ctx.fillText('BREAK IT!', canvasW / 2, canvasH / 2 - 20);
        ctx.font = 'bold 18px Arial';
        ctx.fillText('Flipping to Breaker...', canvasW / 2, canvasH / 2 + 20);
    } else {
        ctx.fillText('BACK TO TETRIS!', canvasW / 2, canvasH / 2 - 20);
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`Round ${round + 1}`, canvasW / 2, canvasH / 2 + 20);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

// ============================================================
// HUD
// ============================================================
function updateHUD() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = `Lv ${level}`;
    if (state === 'TETRIS' || state === 'FLIPPING_TO_BREAKER' || state === 'GAMEOVER') {
        linesDisplay.textContent = `Lines: ${totalLines}`;
    } else if (state === 'BREAKER') {
        const secs = Math.ceil(breakerTimeRemaining / 1000);
        linesDisplay.textContent = `Bricks: ${bricksRemaining}  ⏱${secs}s`;
    } else if (state === 'FLIPPING_TO_TETRIS') {
        linesDisplay.textContent = `Bricks: ${bricksRemaining}`;
    }
}

// ============================================================
// PAUSE
// ============================================================
function isPlaying() {
    return state === 'TETRIS' || state === 'BREAKER' || state === 'FLIPPING_TO_BREAKER' || state === 'FLIPPING_TO_TETRIS';
}

function setPaused(p) {
    if (!isPlaying()) return;
    paused = p;
    pauseBtn.textContent = paused ? '▶' : '⏸';
    moveDir = 0;
    softDropping = false;
    keysDown = {};
    if (!paused) audio.init();
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvasW / 2, canvasH / 2 - 15);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#e040fb';
    ctx.fillText('Tap to resume', canvasW / 2, canvasH / 2 + 25);
}

// ============================================================
// GAME OVER
// ============================================================
function triggerGameOver() {
    if (state === 'GAMEOVER') return;
    state = 'GAMEOVER';
    currentPiece = null;
    onGameOver();
}

function onGameOver() {
    audio.gameOver();
    shake(10, 400);
    hudEl.classList.add('hidden');
    infoDisplayEl.classList.add('hidden');
    pauseBtn.classList.add('hidden');
    finalScoreEl.textContent = score;
    finalRoundEl.textContent = round;
    finalLinesEl.textContent = totalLines;
    finalTetrisesEl.textContent = stats.tetrises;

    const best = parseInt(localStorage.getItem('emojiTetrisHighScore') || '0');
    if (score > best) {
        localStorage.setItem('emojiTetrisHighScore', score);
    }
    newBestEl.classList.toggle('hidden', !(score > best && score > 0));
    highScoreEl.textContent = Math.max(score, best);

    gameoverScreen.classList.remove('hidden');
}

// ============================================================
// INPUT HANDLING
// ============================================================
function pointInRect(x, y, rect, pad = 0) {
    return x >= rect.x - pad && x <= rect.x + rect.w + pad && y >= rect.y - pad && y <= rect.y + rect.h + pad;
}

function handleTouchStart(e) {
    if (!isPlaying()) return;
    e.preventDefault();
    audio.init();
    const touch = e.changedTouches[0];
    touchId = touch.identifier;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = performance.now();
    touchLastX = touch.clientX;
    touchLastY = touch.clientY;
    touchDragCol = 0;
    touchDragRow = 0;
    touchAxis = null;
    touchConsumed = false;
    touchSamples = [{ y: touch.clientY, t: touchStartTime }];

    if (paused) {
        setPaused(false);
        touchConsumed = true;
        return;
    }

    if (state === 'TETRIS' && pointInRect(touch.clientX, touch.clientY, holdRect, 8)) {
        holdPiece();
        touchConsumed = true;
        return;
    }

    if (state === 'BREAKER') {
        paddle.x = touch.clientX;
        paddle.x = Math.max(paddle.width / 2, Math.min(canvasW - paddle.width / 2, paddle.x));
        releaseStickyBall();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
    if (!touch || touchConsumed || paused) return;

    const now = performance.now();
    touchSamples.push({ y: touch.clientY, t: now });
    while (touchSamples.length > 2 && now - touchSamples[0].t > 100) touchSamples.shift();

    if (state === 'TETRIS' && currentPiece && !animating) {
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        // Lock the drag to one axis once the finger moves far enough
        if (!touchAxis) {
            if (Math.abs(dx) > CONFIG.TAP_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
                touchAxis = 'x';
                touchLastX = touch.clientX;
            } else if (dy > CONFIG.TAP_THRESHOLD && dy > Math.abs(dx)) {
                touchAxis = 'y';
                touchLastY = touch.clientY;
            }
        }
        if (touchAxis === 'x') {
            touchDragCol += (touch.clientX - touchLastX) / cellSize;
            // Move piece for each full cell crossed
            while (touchDragCol >= 1) {
                movePiece(1);
                touchDragCol -= 1;
            }
            while (touchDragCol <= -1) {
                movePiece(-1);
                touchDragCol += 1;
            }
            touchLastX = touch.clientX;
        } else if (touchAxis === 'y') {
            // Dragging down soft-drops one row per cell of finger travel
            touchDragRow += (touch.clientY - touchLastY) / cellSize;
            while (touchDragRow >= 1) {
                softDrop();
                touchDragRow -= 1;
            }
            if (touchDragRow < 0) touchDragRow = 0;
            touchLastY = touch.clientY;
        }
    } else if (state === 'BREAKER') {
        paddle.x = touch.clientX;
        paddle.x = Math.max(paddle.width / 2, Math.min(canvasW - paddle.width / 2, paddle.x));
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
    if (!touch) return;
    touchId = null;

    if (state !== 'TETRIS' || touchConsumed || paused) return;

    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const now = performance.now();
    const elapsed = now - touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Recent downward speed decides whether a vertical drag ends in a hard drop
    const first = touchSamples[0];
    const flickVelocity = first && now > first.t ? (touch.clientY - first.y) / (now - first.t) : 0;

    if (touchAxis === 'y') {
        if (dy > CONFIG.SWIPE_THRESHOLD && flickVelocity > CONFIG.FLICK_VELOCITY) {
            hardDrop();
        }
    } else if (!touchAxis) {
        if (absDx < CONFIG.TAP_THRESHOLD && absDy < CONFIG.TAP_THRESHOLD && elapsed < 300) {
            // Tap = rotate (left half counter-clockwise, right half clockwise)
            rotatePiece(touch.clientX < canvasW / 2 ? -1 : 1);
        } else if (absDy > CONFIG.SWIPE_THRESHOLD && dy < 0 && absDy > absDx) {
            // Swipe up = hold
            holdPiece();
        }
    }

    touchAxis = null;
    moveDir = 0;
    softDropping = false;
}

function normalizeKey(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}

function handleKeyDown(e) {
    const key = normalizeKey(e);
    if (keysDown[key]) return;
    keysDown[key] = true;

    if (key === 'p' || key === 'Escape') {
        e.preventDefault();
        setPaused(!paused);
        return;
    }
    if (paused) return;

    if (state === 'TETRIS') {
        switch (key) {
            case 'ArrowLeft':
            case 'a':
                e.preventDefault();
                movePiece(-1);
                moveDir = -1;
                moveRepeatTimer = 0;
                moveDasDone = false;
                break;
            case 'ArrowRight':
            case 'd':
                e.preventDefault();
                movePiece(1);
                moveDir = 1;
                moveRepeatTimer = 0;
                moveDasDone = false;
                break;
            case 'ArrowDown':
            case 's':
                e.preventDefault();
                softDropping = true;
                if (currentPiece && !animating) softDrop(); // immediate first step
                break;
            case 'ArrowUp':
            case 'w':
            case 'x':
                e.preventDefault();
                rotatePiece(1);
                break;
            case 'z':
            case 'q':
                e.preventDefault();
                rotatePiece(-1);
                break;
            case 'c':
            case 'Shift':
                e.preventDefault();
                holdPiece();
                break;
            case ' ':
                e.preventDefault();
                hardDrop();
                break;
        }
    } else if (state === 'BREAKER') {
        switch (key) {
            case 'ArrowLeft':
            case 'a':
                e.preventDefault();
                moveDir = -1;
                break;
            case 'ArrowRight':
            case 'd':
                e.preventDefault();
                moveDir = 1;
                break;
            case ' ':
                e.preventDefault();
                releaseStickyBall();
                break;
        }
    }
}

function handleKeyUp(e) {
    const key = normalizeKey(e);
    keysDown[key] = false;

    if ((key === 'ArrowLeft' || key === 'a') && moveDir === -1) moveDir = 0;
    if ((key === 'ArrowRight' || key === 'd') && moveDir === 1) moveDir = 0;
    if (key === 'ArrowDown' || key === 's') softDropping = false;
}

// ============================================================
// GAME LOOP
// ============================================================
function update(dt) {
    if (state === 'TETRIS') {
        updateTetris(dt);
    } else if (state === 'BREAKER') {
        updateBreaker(dt);
    } else if (state === 'FLIPPING_TO_BREAKER' || state === 'FLIPPING_TO_TETRIS') {
        updateFlip(dt);
    }
    particles.update(dt);
    floatingTexts.update(dt);
    if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
}

function render() {
    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.save();
    if (shakeTime > 0 && !paused) {
        const mag = shakeMag * Math.min(1, shakeTime / 150);
        ctx.translate((Math.random() - 0.5) * 2 * mag, (Math.random() - 0.5) * 2 * mag);
    }

    if (state === 'TETRIS' || state === 'GAMEOVER') {
        drawTetrisScene();
    } else if (state === 'BREAKER') {
        drawBreakerScene();
    } else if (state === 'FLIPPING_TO_BREAKER' || state === 'FLIPPING_TO_TETRIS') {
        drawFlipTransition();
    }

    // Particles and floating texts (always)
    particles.draw(ctx);
    floatingTexts.draw(ctx);
    ctx.restore();

    if (paused) drawPauseOverlay();
}

function gameLoop(timestamp) {
    const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
    lastTime = timestamp;

    if (!paused) update(dt);
    render();

    if (isPlaying()) {
        updateHUD();
    }

    requestAnimationFrame(gameLoop);
}

// ============================================================
// EVENT LISTENERS
// ============================================================
window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Auto-pause when the app is backgrounded so breaker time isn't lost
document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
});
window.addEventListener('blur', () => setPaused(true));

pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setPaused(!paused);
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// Initial resize
resizeCanvas();
