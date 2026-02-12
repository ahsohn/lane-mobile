# Lane Arcade - Development Notes

## Version Management

**IMPORTANT:** Update the version number in `index.html` every time changes are made and pushed.

Location: `index.html` footer section
```html
<p class="version">vX.X.X</p>
```

Version format: `vMAJOR.MINOR.PATCH`
- **MAJOR** - New games or major feature additions
- **MINOR** - Significant changes to existing games
- **PATCH** - Bug fixes and small tweaks

## Project Structure

```
lane-mobile/
├── index.html      # Game launcher (version number here)
├── shooter.html    # Space Lane Shooter game
├── shooter.css
├── shooter.js
├── flappy.html     # Flappy Sandal game
├── flappy.css
├── flappy.js
├── bike.html       # Road Rider CB650 game
├── bike.css
├── bike.js
├── pacman.html     # Lemon Chomper game
├── pacman.css
├── pacman.js
├── ant.html        # Ant Surfer game
├── ant.css
├── ant.js
├── pinball.html    # Machine Shop Pinball game
├── pinball.css
├── pinball.js
├── tetris.html     # Emoji Tetris game
├── tetris.css
├── tetris.js
└── CLAUDE.md       # This file
```

## Games

### Space Lane Shooter
- Side-scrolling shooter with touch controls
- Features: power-ups, boss fights, unlockable characters
- High scores saved to localStorage (`spaceShooterHighScore`)

### Flappy Sandal
- Flappy Bird clone with Greek mythology theme
- Player: Mars' winged sandal
- Obstacles: Corinthian pillars
- High scores saved to localStorage (`flappySandalHighScore`)

### Road Rider CB650
- Vertical racing game with procedural road generation
- Player: Honda CB650 classic motorcycle
- Drag to steer, stay on the road
- Obstacles: rocks, oil slicks, barriers, ramps
- High scores saved to localStorage (`roadRiderHighScore`)

### Lemon Chomper
- Pac-Man style maze game
- Player: Polly the Parrot
- Dots: Lemons to collect
- Power pellets: Mangos (let you eat the cats)
- Enemies: Hungry cats with different behaviors
- D-pad and swipe controls
- High scores saved to localStorage (`lemonChomperHighScore`)

### Ant Surfer
- Subway Surfers style 3-lane endless runner
- Player: An ant surfing on slithering snakes
- 3 snake lanes with animated slithering bodies
- Obstacles: rocks, twigs, mushrooms, beetles, spider webs, bird shadows
- Collectibles: sugar cubes, breadcrumbs, honeydew drops
- Power-ups: Shield (absorbs one hit), Magnet (attracts collectibles)
- Swipe left/right to switch lanes, swipe up or tap to jump
- Arrow keys / WASD / Space for desktop
- High scores saved to localStorage (`antSurferHighScore`)

### Machine Shop Pinball
- Classic pinball game with machine shop / industrial theme
- Ball: Chrome ball bearing with physics (gravity, bouncing, friction)
- Flippers: Left/right flippers controlled by tapping screen halves or arrow keys
- Bumpers: Spinning gear bumpers with teeth (250-1000 points)
- Drop targets: "DRILL" bank (5 targets) and "LATHE" bank (5 targets)
- Completing a word bank awards 5000 bonus + score multiplier
- Slingshots above flippers for extra bounce
- Spring plunger launcher (pull back to charge, release to launch)
- 3 balls per game
- Controls: Touch left/right halves for flippers, drag plunger; Arrow keys / A,D + Space on desktop
- High scores saved to localStorage (`machineShopPinballHighScore`)

### Emoji Tetris
- Hybrid Tetris / Brick Breaker game
- Tetris side: standard 10x20 grid with emoji blocks (7 tetrominoes)
- Each piece type uses a different emoji: I=🟦, O=🟨, T=🟪, S=🟩, Z=🟥, J=🔵, L=🟧
- SRS rotation with wall kicks, ghost piece, next piece preview
- Score a Tetris (4 lines cleared at once) to flip into Brick Breaker mode
- Flip transition: 3D flip animation, each Tetris block becomes 2x2 bricks
- Brick Breaker side: paddle + ball, destroy all bricks to flip back to Tetris
- Power-ups in bricks: Multi-ball (⚡), Wide Paddle (↔️), Fireball (🔥), Slow Ball (🐢), Score Bonus (💎), Sticky Paddle (🧲)
- Controls: Swipe/tap on mobile; Arrow keys / WASD + Space on desktop
- Game over only on Tetris side (blocks reach top)
- High scores saved to localStorage (`emojiTetrisHighScore`)

## Deployment

Static files - works on GitHub Pages with no backend required.
