# Emoji Tetris / Brick Breaker Hybrid Game - Implementation Plan

## Game Concept
A Tetris game where each square is an emoji. Standard Tetris gameplay, but when the player scores a **Tetris** (clears 4 lines at once), the board **flips around** and becomes a **Brick Breaker** game. The remaining Tetris blocks become bricks to break. Once all bricks are cleared, it flips back to Tetris. This cycle continues, escalating in difficulty.

---

## Files to Create
- `tetris.html` - Game page (follows existing pattern: canvas + DOM overlays)
- `tetris.css` - Styling (dark theme, overlays, HUD)
- `tetris.js` - All game logic

## Files to Modify
- `index.html` - Add game card to launcher grid + bump version to `v5.0.0`
- `CLAUDE.md` - Add game documentation

---

## Detailed Design

### 1. Tetris Mode

**Grid**: 10 columns x 20 rows (standard Tetris)

**Tetrominoes** (standard 7 shapes, each mapped to an emoji):
| Shape | Emoji | Description |
|-------|-------|-------------|
| I | 🟦 | Straight line (4 in a row) |
| O | 🟨 | Square (2x2) |
| T | 🟪 | T-shape |
| S | 🟩 | S-shape (skew right) |
| Z | 🟥 | Z-shape (skew left) |
| J | 🔵 | J-shape |
| L | 🟧 | L-shape |

**Mechanics**:
- Standard rotation (SRS - Super Rotation System with wall kicks)
- Left/right movement, soft drop, hard drop
- Ghost piece showing where the piece will land
- Next piece preview
- Line clearing with animation
- Increasing speed as level progresses (every 10 lines = 1 level)
- **Tetris detection**: When exactly 4 lines are cleared simultaneously, trigger the flip

**Controls**:
- **Mobile**: Swipe left/right to move, swipe down for soft drop, tap to rotate, swipe up for hard drop
- **Desktop**: Arrow keys (left/right/down) + Up to rotate, Space for hard drop

**Scoring** (classic Tetris scoring):
- 1 line = 100 x level
- 2 lines = 300 x level
- 3 lines = 500 x level
- 4 lines (Tetris!) = 800 x level + triggers flip

### 2. The Flip Transition

When a Tetris is scored:
1. Flash/celebrate animation on the cleared lines
2. **3D flip animation** (CSS perspective transform or canvas-drawn): the board visually rotates 180 degrees on its horizontal axis
3. During the flip, the grid transforms:
   - Each remaining block in the Tetris grid becomes a **2x2 group of bricks** (so a 10x20 grid with blocks becomes a 20x40 brick field, but we only keep the rows that have blocks)
   - The view **widens and zooms in** to show the expanded brick field
   - Some bricks are randomly replaced with **power-up bricks** (visually distinct with a power-up emoji inside)
4. A paddle appears at the bottom, a ball launches, and Brick Breaker begins

### 3. Brick Breaker Mode

**Grid Transformation**:
- Each Tetris cell that had a block becomes 4 bricks (2x2)
- The brick field is wider (20 columns instead of 10)
- Each brick retains the emoji of its parent Tetris block
- Power-up bricks are randomly inserted (~15% of bricks)

**Mechanics**:
- Paddle at the bottom of the screen (touch drag / arrow keys to move)
- Ball bounces off walls, paddle, and bricks
- Ball physics: angle of reflection based on where it hits the paddle
- Ball speed increases slightly over time
- Lose a ball if it goes below the paddle (but don't end the game - just relaunch from paddle)
- **Clear all bricks** to trigger the flip back to Tetris

**Power-ups** (drop down when their brick is broken):
| Power-up | Emoji | Effect |
|----------|-------|--------|
| Multi-ball | ⚡ | Splits ball into 3 balls |
| Wide Paddle | ↔️ | Paddle becomes 1.5x wider for 15 seconds |
| Fireball | 🔥 | Ball passes through bricks (destroys without bouncing) for 8 seconds |
| Slow Ball | 🐢 | Ball slows down for 10 seconds |
| Score Bonus | 💎 | Instant +500 points |
| Sticky Paddle | 🧲 | Ball sticks to paddle on contact, tap to release (10 seconds) |

**Scoring**:
- Each brick broken = 10 points
- Power-up collected = 50 points
- All bricks cleared bonus = 2000 points

### 4. Flip Back to Tetris

When all bricks are cleared in Brick Breaker:
1. Celebration animation
2. Reverse flip animation (board rotates back)
3. Tetris resumes with an **empty board** but:
   - Level increases by 1 (faster piece falling)
   - Score carries over
   - A "Round X" indicator shows which Tetris/Breaker cycle the player is on

### 5. Game Over Conditions
- **Tetris side**: A new piece cannot spawn because the top of the grid is blocked (standard Tetris game over)
- **Brick Breaker side**: No game over on this side - the ball just relaunches from the paddle if lost. The goal is to clear all bricks to return to Tetris.

### 6. HUD Display
- **Score** (top-left)
- **Level** (top-right)
- **Lines cleared** (top-center, Tetris mode)
- **Bricks remaining** (top-center, Brick Breaker mode)
- **Next piece** preview (right side, Tetris mode)
- **Round indicator** ("Round 1", "Round 2", etc.)
- **Current mode indicator** ("TETRIS" / "BREAKER" label)

### 7. Audio (Web Audio API synthesized tones)
- Piece move sound
- Piece rotate sound
- Line clear sound (escalating for multi-line)
- Tetris! sound (big fanfare)
- Flip transition whoosh sound
- Brick break sound
- Power-up collect sound
- Ball bounce sound (paddle, wall)
- Game over sound

### 8. Visual Design
- Dark background (consistent with other games)
- Emoji blocks rendered on canvas at appropriate size
- Grid lines visible but subtle
- Ghost piece at 30% opacity
- Particle effects on line clears and brick breaks
- Glow effects on power-up bricks
- Smooth flip animation (CSS 3D or canvas-drawn)

---

## Implementation Steps

### Step 1: Create tetris.html
- Standard game page template (canvas + overlays)
- Start screen with title "Emoji Tetris" and description
- Game over screen with score/high score
- HUD elements
- Back button to index.html

### Step 2: Create tetris.css
- Dark theme styling
- Screen overlays (start, game over)
- HUD positioning
- Flip animation CSS (if using CSS transforms)
- Responsive design for mobile/desktop

### Step 3: Create tetris.js - Core Tetris Engine
- CONFIG object with all constants
- AudioSystem class
- Particle/Sparks system
- Grid data structure (10x20 array)
- Tetromino definitions (shapes, rotations, emojis)
- Piece spawning, movement, rotation with wall kicks
- Collision detection
- Line clearing logic with Tetris detection
- Ghost piece calculation
- Next piece preview
- Scoring system
- Level/speed progression
- Input handling (touch + keyboard)
- Game loop (requestAnimationFrame)
- Canvas rendering (grid, pieces, effects)

### Step 4: Create tetris.js - Brick Breaker Engine
- Grid transformation (1 block -> 2x2 bricks)
- Paddle class (position, width, movement)
- Ball class (position, velocity, physics)
- Brick collision detection
- Power-up system (spawn, fall, collect, activate, timer)
- Ball-paddle angle reflection
- Ball-wall bouncing
- Brick break animations
- Clear detection (all bricks gone)

### Step 5: Create tetris.js - Flip Transition System
- Flip animation (canvas-based 3D perspective effect)
- State machine: TETRIS -> FLIPPING_TO_BREAKER -> BREAKER -> FLIPPING_TO_TETRIS -> TETRIS
- Grid conversion logic (Tetris grid -> Brick grid with 2x2 expansion)
- Power-up brick placement during conversion
- Round tracking

### Step 6: Update index.html
- Add game card for "Emoji Tetris" with 🧱 emoji icon
- Add theme CSS (purple/magenta gradient theme to differentiate)
- Bump version to `v5.0.0` (new game = major version)

### Step 7: Update CLAUDE.md
- Add Emoji Tetris game documentation
- Add file entries to project structure

---

## State Machine

```
START_SCREEN
    |
    v
TETRIS_PLAYING  <-------------------+
    |                                |
    | (4 lines cleared = Tetris!)    |
    v                                |
FLIPPING_TO_BREAKER                  |
    |                                |
    v                                |
BREAKER_PLAYING                      |
    |                                |
    | (all bricks cleared)           |
    v                                |
FLIPPING_TO_TETRIS ------------------+

TETRIS_PLAYING --> GAME_OVER (blocks reach top)
```

## localStorage Key
- `emojiTetrisHighScore` - Consistent with existing naming pattern
