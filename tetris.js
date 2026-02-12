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
    // Scoring
    SCORE_1_LINE: 100,
    SCORE_2_LINES: 300,
    SCORE_3_LINES: 500,
    SCORE_4_LINES: 800,
    // Brick breaker
    BALL_SPEED: 5,
    BALL_RADIUS: 6,
    PADDLE_HEIGHT: 12,
    PADDLE_WIDTH_RATIO: 0.2,
    PADDLE_WIDE_MULTIPLIER: 1.6,
    POWERUP_CHANCE: 0.15,
    POWERUP_FALL_SPEED: 2,
    POWERUP_DURATION_WIDE: 15000,
    POWERUP_DURATION_FIRE: 8000,
    POWERUP_DURATION_SLOW: 10000,
    POWERUP_DURATION_STICKY: 10000,
    SLOW_BALL_FACTOR: 0.5,
    BRICK_SCORE: 10,
    POWERUP_SCORE: 50,
    ALL_CLEAR_BONUS: 2000,
    // Breaker trigger: every BREAKER_SCORE_INTERVAL points triggers breaker
    // Tetris (4 lines) triggers it immediately regardless of score
    BREAKER_SCORE_INTERVAL: 3000,
    BREAKER_TIME_LIMIT: 30000, // 30 seconds
    // Flip
    FLIP_DURATION: 1200,
    // Touch
    SWIPE_THRESHOLD: 30,
    TAP_THRESHOLD: 10,
    MOVE_REPEAT_DELAY: 120,
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

// Shapes defined as [row][col] offsets; each rotation state
const SHAPES = [
    // I
    [
        [[0,0],[0,1],[0,2],[0,3]],
        [[0,0],[1,0],[2,0],[3,0]],
        [[0,0],[0,1],[0,2],[0,3]],
        [[0,0],[1,0],[2,0],[3,0]],
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
        [[0,0],[1,0],[1,1],[2,0]],
        [[0,0],[0,1],[0,2],[1,1]],
        [[0,1],[1,0],[1,1],[2,1]],
    ],
    // S
    [
        [[0,1],[0,2],[1,0],[1,1]],
        [[0,0],[1,0],[1,1],[2,1]],
        [[0,1],[0,2],[1,0],[1,1]],
        [[0,0],[1,0],[1,1],[2,1]],
    ],
    // Z
    [
        [[0,0],[0,1],[1,1],[1,2]],
        [[0,1],[1,0],[1,1],[2,0]],
        [[0,0],[0,1],[1,1],[1,2]],
        [[0,1],[1,0],[1,1],[2,0]],
    ],
    // J
    [
        [[0,0],[1,0],[1,1],[1,2]],
        [[0,0],[0,1],[1,0],[2,0]],
        [[0,0],[0,1],[0,2],[1,2]],
        [[0,0],[1,0],[2,0],[2,-1]],
    ],
    // L
    [
        [[0,2],[1,0],[1,1],[1,2]],
        [[0,0],[1,0],[2,0],[2,1]],
        [[0,0],[0,1],[0,2],[1,0]],
        [[0,0],[0,1],[1,1],[2,1]],
    ],
];

// Wall kick data (SRS) for J,L,S,T,Z pieces
const WALL_KICKS = [
    // 0->1
    [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    // 1->2
    [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    // 2->3
    [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    // 3->0
    [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
];

// Wall kick data for I piece
const I_WALL_KICKS = [
    // 0->1
    [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    // 1->2
    [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
    // 2->3
    [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    // 3->0
    [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
];

// --- POWER-UP TYPES ---
const POWERUP_TYPES = [
    { id: 'multiball', emoji: '⚡', label: 'MULTI-BALL', color: '#ffeb3b' },
    { id: 'wide', emoji: '↔️', label: 'WIDE PADDLE', color: '#29b6f6' },
    { id: 'fire', emoji: '🔥', label: 'FIREBALL', color: '#ff5722' },
    { id: 'slow', emoji: '🐢', label: 'SLOW', color: '#66bb6a' },
    { id: 'bonus', emoji: '💎', label: '+500', color: '#e040fb' },
    { id: 'sticky', emoji: '🧲', label: 'STICKY', color: '#ff9800' },
];

// --- AUDIO SYSTEM ---
class AudioSystem {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (this.ctx) return;
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
    flipSound() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => this.play(200 + i * 80, 0.1, 'sawtooth', 0.08), i * 50);
        }
    }
    brickBreak() { this.play(500 + Math.random() * 300, 0.06, 'square', 0.08); }
    paddleHit() { this.play(300, 0.08, 'triangle', 0.1); }
    wallBounce() { this.play(250, 0.05, 'sine', 0.06); }
    powerup() {
        this.play(600, 0.1, 'sine', 0.12);
        setTimeout(() => this.play(800, 0.15, 'sine', 0.12), 80);
    }
    gameOver() {
        const notes = [400, 350, 300, 200];
        notes.forEach((n, i) => setTimeout(() => this.play(n, 0.3, 'sawtooth', 0.12), i * 200));
    }
}

// --- PARTICLE SYSTEM ---
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
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
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
        this.texts.push({ x, y, text, color, size, life: 1, vy: -1.5 });
    }
    update() {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y += t.vy;
            t.life -= 0.015;
            if (t.life <= 0) this.texts.splice(i, 1);
        }
    }
    draw(ctx) {
        for (const t of this.texts) {
            ctx.globalAlpha = t.life;
            ctx.fillStyle = t.color;
            ctx.font = `bold ${t.size}px Arial`;
            ctx.textAlign = 'center';
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
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const audio = new AudioSystem();
const particles = new Particles();
const floatingTexts = new FloatingTexts();

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const hudEl = document.getElementById('hud');
const nextPieceEl = document.getElementById('next-piece');
const infoDisplayEl = document.getElementById('info-display');
const scoreDisplay = document.getElementById('score-display');
const modeDisplay = document.getElementById('mode-display');
const levelDisplay = document.getElementById('level-display');
const linesDisplay = document.getElementById('lines-display');
const finalScoreEl = document.getElementById('final-score');
const highScoreEl = document.getElementById('high-score');
const finalRoundEl = document.getElementById('final-round');

// --- GAME STATE ---
let state = 'START'; // START, TETRIS, FLIPPING_TO_BREAKER, BREAKER, FLIPPING_TO_TETRIS, GAMEOVER
let score = 0;
let level = 1;
let totalLines = 0;
let round = 1;
let grid = []; // Tetris grid: grid[row][col] = { type, color, emoji } or null
let currentPiece = null;
let nextPieceType = -1;
let dropTimer = 0;
let lastTime = 0;
let lockDelay = 0;
let lockDelayMax = 500;
let animating = false;

// Breaker state
let breakerGrid = []; // breakerGrid[row][col] = { color, emoji, powerup } or null
let breakerCols = 0;
let breakerRows = 0;
let balls = [];
let paddle = { x: 0, width: 0, baseWidth: 0 };
let powerups = []; // falling powerup items
let activePowerups = {}; // { wide: endTime, fire: endTime, slow: endTime, sticky: endTime }
let stickyBall = null; // ball stuck to paddle
let breakerCellSize = 0;
let breakerOffsetX = 0;
let breakerOffsetY = 0;
let bricksRemaining = 0;

// Breaker timer & score trigger
let breakerStartTime = 0;
let breakerTimeRemaining = 0;
let nextBreakerScoreThreshold = CONFIG.BREAKER_SCORE_INTERVAL;
let ballsLost = false;

// Flip animation
let flipProgress = 0;
let flipDirection = 0; // 1 = to breaker, -1 = to tetris

// Canvas sizing
let cellSize = 0;
let gridOffsetX = 0;
let gridOffsetY = 0;
let canvasW = 0;
let canvasH = 0;

// Input
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchId = null;
let moveRepeatTimer = 0;
let moveDir = 0;
let softDropping = false;
let keysDown = {};

// Line clear animation
let clearingLines = [];
let clearAnimProgress = 0;
let clearAnimDuration = 400;

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

    // Calculate cell size and offsets for tetris grid
    const maxCellW = (canvasW * 0.7) / CONFIG.COLS;
    const maxCellH = (canvasH * 0.9) / CONFIG.ROWS;
    cellSize = Math.floor(Math.min(maxCellW, maxCellH));
    const gridW = cellSize * CONFIG.COLS;
    const gridH = cellSize * CONFIG.ROWS;
    gridOffsetX = Math.floor((canvasW - gridW) / 2);
    gridOffsetY = Math.floor((canvasH - gridH) / 2) + 15;

    // Next piece canvas
    const nDpr = dpr;
    const nSize = Math.min(80, cellSize * 4);
    nextCanvas.width = nSize * nDpr;
    nextCanvas.height = nSize * nDpr;
    nextCanvas.style.width = nSize + 'px';
    nextCanvas.style.height = nSize + 'px';
    nextCtx.setTransform(nDpr, 0, 0, nDpr, 0, 0);

    // Recalculate breaker layout if in breaker mode
    if (state === 'BREAKER') {
        calcBreakerLayout();
    }
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
    initGrid();
    currentPiece = null;
    nextPieceType = randomPieceType();
    spawnPiece();
    dropTimer = 0;
    lockDelay = 0;
    clearingLines = [];
    animating = false;
    balls = [];
    powerups = [];
    activePowerups = {};
    stickyBall = null;
    nextBreakerScoreThreshold = CONFIG.BREAKER_SCORE_INTERVAL;
    ballsLost = false;
    breakerStartTime = 0;
    breakerTimeRemaining = 0;
    state = 'TETRIS';
    updateHUD();
    hudEl.classList.remove('hidden');
    nextPieceEl.classList.remove('hidden');
    infoDisplayEl.classList.remove('hidden');
}

// ============================================================
// TETRIS LOGIC
// ============================================================
function randomPieceType() {
    return Math.floor(Math.random() * 7);
}

function spawnPiece() {
    const type = nextPieceType;
    nextPieceType = randomPieceType();
    const shape = SHAPES[type][0];
    // Calculate spawn position (center top)
    let minC = 99, maxC = -1;
    for (const [r, c] of shape) {
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
    }
    const pieceWidth = maxC - minC + 1;
    const col = Math.floor((CONFIG.COLS - pieceWidth) / 2) - minC;

    currentPiece = {
        type,
        rotation: 0,
        row: 0,
        col,
        shape: shape,
    };

    // Check if spawn position is blocked
    if (!isValidPosition(currentPiece.row, currentPiece.col, currentPiece.shape)) {
        // Try one row up
        currentPiece.row = -1;
        if (!isValidPosition(currentPiece.row, currentPiece.col, currentPiece.shape)) {
            // Game over
            state = 'GAMEOVER';
            onGameOver();
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

function movePiece(dCol) {
    if (!currentPiece || animating) return;
    const newCol = currentPiece.col + dCol;
    if (isValidPosition(currentPiece.row, newCol, currentPiece.shape)) {
        currentPiece.col = newCol;
        lockDelay = 0;
        audio.move();
        return true;
    }
    return false;
}

function rotatePiece() {
    if (!currentPiece || animating) return;
    const type = currentPiece.type;
    const oldRot = currentPiece.rotation;
    const newRot = (oldRot + 1) % 4;
    const newShape = SHAPES[type][newRot];

    // Try wall kicks
    const kicks = type === 0 ? I_WALL_KICKS[oldRot] : WALL_KICKS[oldRot];
    for (const [kc, kr] of kicks) {
        const newRow = currentPiece.row - kr;
        const newCol = currentPiece.col + kc;
        if (isValidPosition(newRow, newCol, newShape)) {
            currentPiece.rotation = newRot;
            currentPiece.shape = newShape;
            currentPiece.row = newRow;
            currentPiece.col = newCol;
            lockDelay = 0;
            audio.rotate();
            return;
        }
    }
}

function softDrop() {
    if (!currentPiece || animating) return;
    if (isValidPosition(currentPiece.row + 1, currentPiece.col, currentPiece.shape)) {
        currentPiece.row++;
        score += 1;
        dropTimer = 0;
        return true;
    }
    return false;
}

function hardDrop() {
    if (!currentPiece || animating) return;
    let rows = 0;
    while (isValidPosition(currentPiece.row + 1, currentPiece.col, currentPiece.shape)) {
        currentPiece.row++;
        rows++;
    }
    score += rows * 2;
    audio.drop();
    lockPiece();
}

function getGhostRow() {
    if (!currentPiece) return 0;
    let row = currentPiece.row;
    while (isValidPosition(row + 1, currentPiece.col, currentPiece.shape)) {
        row++;
    }
    return row;
}

function lockPiece() {
    if (!currentPiece) return;
    const type = currentPiece.type;
    for (const [dr, dc] of currentPiece.shape) {
        const r = currentPiece.row + dr;
        const c = currentPiece.col + dc;
        if (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS) {
            grid[r][c] = {
                type,
                color: PIECE_COLORS[type],
                emoji: EMOJIS[type],
            };
        }
    }
    currentPiece = null;

    // Check for line clears
    checkLineClears();
}

function checkLineClears() {
    const lines = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
        if (grid[r].every(cell => cell !== null)) {
            lines.push(r);
        }
    }

    if (lines.length > 0) {
        animating = true;
        clearingLines = lines;
        clearAnimProgress = 0;

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

        audio.lineClear(lines.length);

        // Score
        const lineScores = [0, CONFIG.SCORE_1_LINE, CONFIG.SCORE_2_LINES, CONFIG.SCORE_3_LINES, CONFIG.SCORE_4_LINES];
        const gained = (lineScores[lines.length] || CONFIG.SCORE_4_LINES) * level;
        score += gained;
        totalLines += lines.length;

        // Show floating text
        const midR = lines[Math.floor(lines.length / 2)];
        const px = gridOffsetX + (CONFIG.COLS * cellSize) / 2;
        const py = gridOffsetY + midR * cellSize;
        if (lines.length === 4) {
            floatingTexts.add(px, py, 'TETRIS!', '#ffeb3b', 28);
        } else {
            floatingTexts.add(px, py, '+' + gained, '#fff', 20);
        }

        // Level up
        level = Math.floor(totalLines / CONFIG.LINES_PER_LEVEL) + 1;

        // After animation, process the line clear
        setTimeout(() => {
            // Remove cleared lines
            for (const r of lines.sort((a, b) => b - a)) {
                grid.splice(r, 1);
                grid.unshift(new Array(CONFIG.COLS).fill(null));
            }
            clearingLines = [];
            animating = false;

            // Tetris (4 lines) = immediate flip to breaker
            // Otherwise, check if score crossed the next threshold
            const shouldFlip = lines.length === 4 || score >= nextBreakerScoreThreshold;
            if (shouldFlip && hasBlocksOnGrid()) {
                if (lines.length === 4) audio.tetris();
                nextBreakerScoreThreshold = score + CONFIG.BREAKER_SCORE_INTERVAL;
                startFlipToBreaker();
            } else {
                if (score >= nextBreakerScoreThreshold) {
                    nextBreakerScoreThreshold = score + CONFIG.BREAKER_SCORE_INTERVAL;
                }
                spawnPiece();
            }
        }, clearAnimDuration);
    } else {
        spawnPiece();
    }
}

function getDropInterval() {
    return Math.max(CONFIG.MIN_DROP_INTERVAL, CONFIG.BASE_DROP_INTERVAL - (level - 1) * CONFIG.SPEED_DECREASE_PER_LEVEL);
}

function hasBlocksOnGrid() {
    for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
            if (grid[r][c]) return true;
        }
    }
    return false;
}

function updateTetris(dt) {
    if (animating) {
        clearAnimProgress += dt / clearAnimDuration;
        return;
    }

    if (!currentPiece) return;

    // Auto-drop
    dropTimer += dt;
    const interval = softDropping ? CONFIG.SOFT_DROP_REPEAT : getDropInterval();
    if (dropTimer >= interval) {
        dropTimer = 0;
        if (!isValidPosition(currentPiece.row + 1, currentPiece.col, currentPiece.shape)) {
            lockDelay += interval;
            if (lockDelay >= lockDelayMax) {
                lockPiece();
            }
        } else {
            currentPiece.row++;
            if (softDropping) score += 1;
            lockDelay = 0;
        }
    }

    // Handle held movement keys
    if (moveDir !== 0) {
        moveRepeatTimer += dt;
        if (moveRepeatTimer >= CONFIG.MOVE_REPEAT_DELAY) {
            moveRepeatTimer = 0;
            movePiece(moveDir);
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

    // Border
    ctx.strokeStyle = 'rgba(224, 64, 251, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(gridOffsetX, gridOffsetY, gw, gh);
}

function drawCell(x, y, size, cell, alpha = 1) {
    if (!cell) return;
    ctx.globalAlpha = alpha;

    // Draw colored background
    ctx.fillStyle = cell.color;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Draw highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 1, y + 1, size - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, size - 2);

    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + 1, y + size - 4, size - 2, 3);
    ctx.fillRect(x + size - 4, y + 1, 3, size - 2);

    // Draw emoji
    const fontSize = Math.max(10, size * 0.6);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cell.emoji, x + size / 2, y + size / 2 + 1);

    ctx.globalAlpha = 1;
}

function drawPlacedBlocks() {
    for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
            if (grid[r][c]) {
                // Check if this row is being cleared
                let alpha = 1;
                if (clearingLines.includes(r)) {
                    alpha = 1 - clearAnimProgress;
                }
                const x = gridOffsetX + c * cellSize;
                const y = gridOffsetY + r * cellSize;
                drawCell(x, y, cellSize, grid[r][c], alpha);
            }
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
            });
        }
    }
}

function drawNextPiece() {
    const nw = parseInt(nextCanvas.style.width);
    const nh = parseInt(nextCanvas.style.height);
    nextCtx.clearRect(0, 0, nw, nh);

    const shape = SHAPES[nextPieceType][0];
    let minR = 99, maxR = -1, minC = 99, maxC = -1;
    for (const [r, c] of shape) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
    }
    const pw = maxC - minC + 1;
    const ph = maxR - minR + 1;
    const cs = Math.floor(Math.min(nw / (pw + 1), nh / (ph + 1)));
    const ox = Math.floor((nw - pw * cs) / 2);
    const oy = Math.floor((nh - ph * cs) / 2);

    for (const [r, c] of shape) {
        const x = ox + (c - minC) * cs;
        const y = oy + (r - minR) * cs;
        nextCtx.fillStyle = PIECE_COLORS[nextPieceType];
        nextCtx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        nextCtx.fillStyle = 'rgba(255,255,255,0.2)';
        nextCtx.fillRect(x + 1, y + 1, cs - 2, 2);
        const fontSize = Math.max(8, cs * 0.55);
        nextCtx.font = `${fontSize}px Arial`;
        nextCtx.textAlign = 'center';
        nextCtx.textBaseline = 'middle';
        nextCtx.fillText(EMOJIS[nextPieceType], x + cs / 2, y + cs / 2 + 1);
    }
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

    // Only size based on rows that have bricks, with some padding
    const brickRowCount = bottomRow - topRow + 1;
    const paddleArea = 80; // space for paddle at bottom
    const topMargin = 50; // space for HUD at top

    const availW = canvasW * 0.95;
    const availH = canvasH - paddleArea - topMargin;
    const cs = Math.floor(Math.min(availW / breakerCols, availH / brickRowCount));
    breakerCellSize = Math.max(cs, 10);
    const totalW = breakerCols * breakerCellSize;
    breakerOffsetX = Math.floor((canvasW - totalW) / 2);
    // Position so bricks start at the top margin, shifted by topRow
    breakerOffsetY = topMargin - topRow * breakerCellSize;

    // Paddle
    paddle.baseWidth = Math.floor(canvasW * CONFIG.PADDLE_WIDTH_RATIO);
    paddle.width = paddle.baseWidth;
    paddle.x = canvasW / 2;
    paddle.y = canvasH - 40;
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
                // Fill 2x2
                for (let dr = 0; dr < 2; dr++) {
                    for (let dc = 0; dc < 2; dc++) {
                        const br = r * 2 + dr;
                        const bc = c * 2 + dc;
                        let powerup = null;
                        if (Math.random() < CONFIG.POWERUP_CHANCE) {
                            powerup = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                        }
                        breakerGrid[br][bc] = {
                            color: cell.color,
                            emoji: cell.emoji,
                            powerup,
                        };
                        bricksRemaining++;
                    }
                }
            }
        }
    }

    calcBreakerLayout();
}

function launchBall() {
    const speed = CONFIG.BALL_SPEED;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    balls.push({
        x: paddle.x,
        y: paddle.y - CONFIG.BALL_RADIUS - 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
    });
}

function releaseStickyBall() {
    if (!stickyBall) return;
    const speed = CONFIG.BALL_SPEED;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    stickyBall.vx = Math.cos(angle) * speed;
    stickyBall.vy = Math.sin(angle) * speed;
    stickyBall = null;
}

function updateBreaker(dt) {
    const now = performance.now();

    // Update active powerup timers
    if (activePowerups.wide && now > activePowerups.wide) {
        delete activePowerups.wide;
        paddle.width = paddle.baseWidth;
    }
    if (activePowerups.fire && now > activePowerups.fire) {
        delete activePowerups.fire;
    }
    if (activePowerups.slow && now > activePowerups.slow) {
        delete activePowerups.slow;
    }
    if (activePowerups.sticky && now > activePowerups.sticky) {
        delete activePowerups.sticky;
        // Release any stuck ball with velocity
        if (stickyBall) {
            const speed = CONFIG.BALL_SPEED;
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
            stickyBall.vx = Math.cos(angle) * speed;
            stickyBall.vy = Math.sin(angle) * speed;
            stickyBall = null;
        }
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

        ball.x += ball.vx * speedMult;
        ball.y += ball.vy * speedMult;

        // Wall bounces
        if (ball.x - CONFIG.BALL_RADIUS < 0) {
            ball.x = CONFIG.BALL_RADIUS;
            ball.vx = Math.abs(ball.vx);
            audio.wallBounce();
        }
        if (ball.x + CONFIG.BALL_RADIUS > canvasW) {
            ball.x = canvasW - CONFIG.BALL_RADIUS;
            ball.vx = -Math.abs(ball.vx);
            audio.wallBounce();
        }
        if (ball.y - CONFIG.BALL_RADIUS < 0) {
            ball.y = CONFIG.BALL_RADIUS;
            ball.vy = Math.abs(ball.vy);
            audio.wallBounce();
        }

        // Paddle collision
        if (ball.vy > 0 &&
            ball.y + CONFIG.BALL_RADIUS >= paddle.y &&
            ball.y + CONFIG.BALL_RADIUS <= paddle.y + CONFIG.PADDLE_HEIGHT + 4 &&
            ball.x >= paddle.x - paddle.width / 2 &&
            ball.x <= paddle.x + paddle.width / 2) {

            // Angle based on where it hit the paddle
            // hitPos: 0 = left edge, 1 = right edge
            const hitPos = (ball.x - (paddle.x - paddle.width / 2)) / paddle.width; // 0-1
            // Left edge -> ball goes left (angle ~150deg), right edge -> ball goes right (angle ~30deg)
            const angle = -Math.PI + (Math.PI * 0.17) + hitPos * (Math.PI * 0.66); // ~-150 to ~-30 degrees
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = Math.cos(angle) * speed;
            ball.vy = Math.sin(angle) * speed;
            ball.y = paddle.y - CONFIG.BALL_RADIUS - 1;
            audio.paddleHit();

            // Sticky check
            if (activePowerups.sticky && !stickyBall) {
                stickyBall = ball;
                ball.offsetX = ball.x - paddle.x;
                ball.vx = 0;
                ball.vy = 0;
            }
        }

        // Ball falls below paddle
        if (ball.y - CONFIG.BALL_RADIUS > canvasH) {
            balls.splice(i, 1);
            continue;
        }

        // Brick collision
        checkBrickCollision(ball, isFire);
    }

    // If no balls left, breaker round is over -> convert back to tetris
    if (balls.length === 0 && !stickyBall) {
        floatingTexts.add(canvasW / 2, canvasH / 2, 'BALL LOST!', '#ef5350', 24);
        startFlipToTetris();
        return;
    }

    // 30s time limit
    breakerTimeRemaining = Math.max(0, CONFIG.BREAKER_TIME_LIMIT - (performance.now() - breakerStartTime));
    if (breakerTimeRemaining <= 0) {
        floatingTexts.add(canvasW / 2, canvasH / 2, 'TIME UP!', '#ffeb3b', 24);
        startFlipToTetris();
        return;
    }

    // Update falling powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        pu.y += CONFIG.POWERUP_FALL_SPEED;

        // Collect with paddle
        if (pu.y >= paddle.y - 10 && pu.y <= paddle.y + CONFIG.PADDLE_HEIGHT + 10 &&
            pu.x >= paddle.x - paddle.width / 2 - 10 &&
            pu.x <= paddle.x + paddle.width / 2 + 10) {
            activatePowerup(pu.type);
            powerups.splice(i, 1);
            audio.powerup();
            score += CONFIG.POWERUP_SCORE;
            floatingTexts.add(pu.x, pu.y, pu.type.label, pu.type.color, 16);
            continue;
        }

        // Off screen
        if (pu.y > canvasH + 20) {
            powerups.splice(i, 1);
        }
    }

    // Check if all bricks cleared
    if (bricksRemaining <= 0) {
        score += CONFIG.ALL_CLEAR_BONUS;
        floatingTexts.add(canvasW / 2, canvasH / 2, 'ALL CLEAR! +2000', '#ffeb3b', 24);
        startFlipToTetris();
    }

    updateHUD();
}

function checkBrickCollision(ball, isFire) {
    // Find which cell the ball is in
    const bx = ball.x - breakerOffsetX;
    const by = ball.y - breakerOffsetY;
    const col = Math.floor(bx / breakerCellSize);
    const row = Math.floor(by / breakerCellSize);

    // Check surrounding cells
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
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
            const dist = Math.sqrt(distX * distX + distY * distY);

            if (dist < CONFIG.BALL_RADIUS) {
                // Destroy brick
                destroyBrick(r, c);

                if (!isFire) {
                    // Reflect
                    const brickCenterX = brickX + breakerCellSize / 2;
                    const brickCenterY = brickY + breakerCellSize / 2;
                    const dx = ball.x - brickCenterX;
                    const dy = ball.y - brickCenterY;

                    if (Math.abs(dx) / breakerCellSize > Math.abs(dy) / breakerCellSize) {
                        ball.vx = -ball.vx;
                    } else {
                        ball.vy = -ball.vy;
                    }
                    // Push ball out
                    ball.x += ball.vx * 2;
                    ball.y += ball.vy * 2;
                    return; // One collision per frame for non-fire
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
    score += CONFIG.BRICK_SCORE;
    audio.brickBreak();
}

function activatePowerup(type) {
    const now = performance.now();
    switch (type.id) {
        case 'multiball':
            // Add 2 more balls
            for (let i = 0; i < 2; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
                const speed = CONFIG.BALL_SPEED;
                balls.push({
                    x: paddle.x + (i === 0 ? -15 : 15),
                    y: paddle.y - CONFIG.BALL_RADIUS - 10,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                });
            }
            break;
        case 'wide':
            activePowerups.wide = now + CONFIG.POWERUP_DURATION_WIDE;
            paddle.width = paddle.baseWidth * CONFIG.PADDLE_WIDE_MULTIPLIER;
            break;
        case 'fire':
            activePowerups.fire = now + CONFIG.POWERUP_DURATION_FIRE;
            break;
        case 'slow':
            activePowerups.slow = now + CONFIG.POWERUP_DURATION_SLOW;
            break;
        case 'bonus':
            score += 500;
            floatingTexts.add(paddle.x, paddle.y - 30, '+500', '#e040fb', 22);
            break;
        case 'sticky':
            activePowerups.sticky = now + CONFIG.POWERUP_DURATION_STICKY;
            break;
    }
}

// ============================================================
// DRAWING - BRICK BREAKER
// ============================================================
function drawBreakerGrid() {
    // Background
    ctx.fillStyle = '#0d0d20';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw bricks
    for (let r = 0; r < breakerRows; r++) {
        if (!breakerGrid[r]) continue;
        for (let c = 0; c < breakerCols; c++) {
            const brick = breakerGrid[r][c];
            if (!brick) continue;
            const x = breakerOffsetX + c * breakerCellSize;
            const y = breakerOffsetY + r * breakerCellSize;

            // Brick body
            ctx.fillStyle = brick.color;
            ctx.fillRect(x + 1, y + 1, breakerCellSize - 2, breakerCellSize - 2);

            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x + 1, y + 1, breakerCellSize - 2, 2);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x + 1, y + breakerCellSize - 3, breakerCellSize - 2, 2);

            // Emoji
            const fontSize = Math.max(6, breakerCellSize * 0.5);
            ctx.font = `${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(brick.emoji, x + breakerCellSize / 2, y + breakerCellSize / 2 + 1);

            // Power-up glow
            if (brick.powerup) {
                ctx.strokeStyle = brick.powerup.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = brick.powerup.color;
                ctx.shadowBlur = 6;
                ctx.strokeRect(x + 1, y + 1, breakerCellSize - 2, breakerCellSize - 2);
                ctx.shadowBlur = 0;

                // Small powerup emoji
                const puSize = Math.max(5, breakerCellSize * 0.35);
                ctx.font = `${puSize}px Arial`;
                ctx.fillText(brick.powerup.emoji, x + breakerCellSize / 2, y + breakerCellSize / 2 + 1);
            }
        }
    }

    // Draw timer bar at top
    if (state === 'BREAKER') {
        const barWidth = canvasW * 0.8;
        const barX = (canvasW - barWidth) / 2;
        const barY = 38;
        const pct = breakerTimeRemaining / CONFIG.BREAKER_TIME_LIMIT;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(barX, barY, barWidth, 4);
        const color = pct > 0.3 ? '#e040fb' : '#ef5350';
        ctx.fillStyle = color;
        ctx.fillRect(barX, barY, barWidth * pct, 4);
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
    for (const ball of balls) {
        const isFire = !!activePowerups.fire;

        // Glow
        ctx.shadowColor = isFire ? '#ff5722' : '#fff';
        ctx.shadowBlur = isFire ? 12 : 6;

        // Trail
        if (isFire) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff5722';
            ctx.beginPath();
            ctx.arc(ball.x - ball.vx * 2, ball.y - ball.vy * 2, CONFIG.BALL_RADIUS * 0.8, 0, Math.PI * 2);
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
    const now = performance.now();
    let y = canvasH - 70;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';

    for (const [key, endTime] of Object.entries(activePowerups)) {
        const remaining = Math.max(0, (endTime - now) / 1000);
        const type = POWERUP_TYPES.find(t => t.id === key);
        if (!type || remaining <= 0) continue;

        ctx.fillStyle = type.color;
        ctx.globalAlpha = 0.8;
        ctx.fillText(`${type.emoji} ${remaining.toFixed(1)}s`, 10, y);
        y -= 18;
    }
    ctx.globalAlpha = 1;
}

// ============================================================
// FLIP TRANSITION
// ============================================================
function startFlipToBreaker() {
    state = 'FLIPPING_TO_BREAKER';
    flipProgress = 0;
    flipDirection = 1;
    currentPiece = null;
    audio.flipSound();
    nextPieceEl.classList.add('hidden');

    // Prepare breaker grid from tetris grid
    convertToBreakerGrid();
    breakerStartTime = performance.now() + CONFIG.FLIP_DURATION; // timer starts after flip
}

function convertBreakerBackToTetris() {
    // Convert remaining breaker bricks back into tetris grid
    // Each 2x2 breaker block maps to 1 tetris cell
    // We sample: if any brick in the 2x2 exists, that tetris cell is filled
    initGrid();
    for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 0; c < CONFIG.COLS; c++) {
            // Check the 2x2 breaker cells
            let found = null;
            for (let dr = 0; dr < 2; dr++) {
                for (let dc = 0; dc < 2; dc++) {
                    const br = r * 2 + dr;
                    const bc = c * 2 + dc;
                    if (br < breakerRows && bc < breakerCols && breakerGrid[br] && breakerGrid[br][bc]) {
                        found = breakerGrid[br][bc];
                    }
                }
            }
            if (found) {
                grid[r][c] = {
                    type: EMOJIS.indexOf(found.emoji),
                    color: found.color,
                    emoji: found.emoji,
                };
            }
        }
    }

    // Apply gravity: drop all blocks to the bottom
    for (let c = 0; c < CONFIG.COLS; c++) {
        // Collect non-null cells from bottom to top
        const cells = [];
        for (let r = CONFIG.ROWS - 1; r >= 0; r--) {
            if (grid[r][c]) cells.push(grid[r][c]);
        }
        // Place them at the bottom
        for (let r = 0; r < CONFIG.ROWS; r++) {
            grid[r][c] = null;
        }
        for (let i = 0; i < cells.length; i++) {
            grid[CONFIG.ROWS - 1 - i][c] = cells[i];
        }
    }
}

function startFlipToTetris() {
    state = 'FLIPPING_TO_TETRIS';
    flipProgress = 0;
    flipDirection = -1;
    audio.flipSound();
    balls = [];
    powerups = [];
    activePowerups = {};
    stickyBall = null;

    // Convert remaining bricks back to tetris with gravity
    convertBreakerBackToTetris();
}

function updateFlip(dt) {
    flipProgress += dt / CONFIG.FLIP_DURATION;
    if (flipProgress >= 1) {
        flipProgress = 1;
        if (flipDirection === 1) {
            // Now in breaker mode
            state = 'BREAKER';
            modeDisplay.textContent = 'BREAKER';
            modeDisplay.style.background = 'rgba(255, 87, 34, 0.4)';
            linesDisplay.textContent = `Bricks: ${bricksRemaining}`;
            launchBall();
        } else {
            // Back to tetris - grid was already set by convertBreakerBackToTetris
            state = 'TETRIS';
            round++;
            level++;
            nextPieceType = randomPieceType();
            spawnPiece();
            modeDisplay.textContent = `TETRIS R${round}`;
            modeDisplay.style.background = 'rgba(224, 64, 251, 0.4)';
            nextPieceEl.classList.remove('hidden');
        }
        updateHUD();
    }
}

function drawFlipTransition() {
    // 3D flip effect using canvas transforms
    const progress = flipProgress;
    const angle = progress * Math.PI; // 0 to PI

    ctx.save();
    ctx.fillStyle = '#0d0d20';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Apply perspective-like scaling
    const scaleY = Math.abs(Math.cos(angle));
    const centerY = canvasH / 2;

    ctx.translate(0, centerY);
    ctx.scale(1, Math.max(0.01, scaleY));
    ctx.translate(0, -centerY);

    if (progress < 0.5) {
        // Show current side (shrinking)
        if (flipDirection === 1) {
            drawTetrisGrid();
            drawPlacedBlocks();
        } else {
            drawBreakerGrid();
        }
    } else {
        // Show target side (growing)
        ctx.translate(0, centerY);
        ctx.scale(1, -1);
        ctx.translate(0, -centerY);
        if (flipDirection === 1) {
            drawBreakerGrid();
        } else {
            drawTetrisGrid();
            drawPlacedBlocks();
        }
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
    if (state === 'TETRIS' || state === 'FLIPPING_TO_BREAKER') {
        linesDisplay.textContent = `Lines: ${totalLines}`;
    } else if (state === 'BREAKER') {
        const secs = Math.ceil(breakerTimeRemaining / 1000);
        linesDisplay.textContent = `Bricks: ${bricksRemaining}  ⏱${secs}s`;
    } else if (state === 'FLIPPING_TO_TETRIS') {
        linesDisplay.textContent = `Bricks: ${bricksRemaining}`;
    }
}

// ============================================================
// GAME OVER
// ============================================================
function onGameOver() {
    audio.gameOver();
    hudEl.classList.add('hidden');
    nextPieceEl.classList.add('hidden');
    infoDisplayEl.classList.add('hidden');
    finalScoreEl.textContent = score;
    finalRoundEl.textContent = round;

    const best = parseInt(localStorage.getItem('emojiTetrisHighScore') || '0');
    if (score > best) {
        localStorage.setItem('emojiTetrisHighScore', score);
    }
    highScoreEl.textContent = Math.max(score, best);

    gameoverScreen.classList.remove('hidden');
}

// ============================================================
// INPUT HANDLING
// ============================================================
function handleTouchStart(e) {
    if (state !== 'TETRIS' && state !== 'BREAKER') return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchId = touch.identifier;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = performance.now();

    if (state === 'BREAKER') {
        paddle.x = touch.clientX;
        paddle.x = Math.max(paddle.width / 2, Math.min(canvasW - paddle.width / 2, paddle.x));
        releaseStickyBall();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
    if (!touch) return;

    if (state === 'BREAKER') {
        paddle.x = touch.clientX;
        // Clamp paddle
        paddle.x = Math.max(paddle.width / 2, Math.min(canvasW - paddle.width / 2, paddle.x));
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
    if (!touch) return;
    touchId = null;

    if (state !== 'TETRIS') return;

    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const elapsed = performance.now() - touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < CONFIG.TAP_THRESHOLD && absDy < CONFIG.TAP_THRESHOLD && elapsed < 300) {
        // Tap = rotate
        rotatePiece();
    } else if (absDy > CONFIG.SWIPE_THRESHOLD && dy > 0 && absDy > absDx) {
        // Swipe down = hard drop
        if (absDy > CONFIG.SWIPE_THRESHOLD * 3) {
            hardDrop();
        } else {
            softDrop();
        }
    } else if (absDx > CONFIG.SWIPE_THRESHOLD && absDx > absDy) {
        // Swipe left/right = move
        movePiece(dx > 0 ? 1 : -1);
    } else if (absDy > CONFIG.SWIPE_THRESHOLD && dy < 0 && absDy > absDx) {
        // Swipe up = hard drop
        hardDrop();
    }

    moveDir = 0;
    softDropping = false;
}

function handleKeyDown(e) {
    if (keysDown[e.key]) return;
    keysDown[e.key] = true;

    if (state === 'TETRIS') {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
                e.preventDefault();
                movePiece(-1);
                moveDir = -1;
                moveRepeatTimer = 0;
                break;
            case 'ArrowRight':
            case 'd':
                e.preventDefault();
                movePiece(1);
                moveDir = 1;
                moveRepeatTimer = 0;
                break;
            case 'ArrowDown':
            case 's':
                e.preventDefault();
                softDropping = true;
                dropTimer = getDropInterval(); // trigger immediate drop
                break;
            case 'ArrowUp':
            case 'w':
                e.preventDefault();
                rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                hardDrop();
                break;
        }
    } else if (state === 'BREAKER') {
        switch (e.key) {
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
    keysDown[e.key] = false;

    if (state === 'TETRIS') {
        if ((e.key === 'ArrowLeft' || e.key === 'a') && moveDir === -1) moveDir = 0;
        if ((e.key === 'ArrowRight' || e.key === 'd') && moveDir === 1) moveDir = 0;
        if (e.key === 'ArrowDown' || e.key === 's') softDropping = false;
    } else if (state === 'BREAKER') {
        if ((e.key === 'ArrowLeft' || e.key === 'a') && moveDir === -1) moveDir = 0;
        if ((e.key === 'ArrowRight' || e.key === 'd') && moveDir === 1) moveDir = 0;
    }
}

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(timestamp) {
    const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
    lastTime = timestamp;

    // Clear
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvasW, canvasH);

    if (state === 'TETRIS') {
        updateTetris(dt);
        drawTetrisGrid();
        drawGhostPiece();
        drawPlacedBlocks();
        drawCurrentPiece();
        drawNextPiece();
    } else if (state === 'BREAKER') {
        // Paddle movement with keys
        if (moveDir !== 0) {
            paddle.x += moveDir * 8;
            paddle.x = Math.max(paddle.width / 2, Math.min(canvasW - paddle.width / 2, paddle.x));
        }
        updateBreaker(dt);
        drawBreakerGrid();
        drawPaddle();
        drawBalls();
        drawPowerupDrops();
        drawActivePowerupIndicators();
    } else if (state === 'FLIPPING_TO_BREAKER' || state === 'FLIPPING_TO_TETRIS') {
        updateFlip(dt);
        drawFlipTransition();
    }

    // Particles and floating texts (always)
    particles.update();
    particles.draw(ctx);
    floatingTexts.update();
    floatingTexts.draw(ctx);

    if (state !== 'GAMEOVER' && state !== 'START') {
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

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

document.getElementById('start-btn').addEventListener('click', () => {
    audio.init();
    startScreen.classList.add('hidden');
    resizeCanvas();
    resetGame();
    lastTime = 0;
    requestAnimationFrame(gameLoop);
});

document.getElementById('restart-btn').addEventListener('click', () => {
    audio.init();
    gameoverScreen.classList.add('hidden');
    resizeCanvas();
    resetGame();
    lastTime = 0;
    requestAnimationFrame(gameLoop);
});

// Initial resize
resizeCanvas();
