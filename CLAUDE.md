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
- Side-scrolling motorcycle racing game
- Player: Honda CB650 classic motorcycle
- Tap to jump over obstacles (rocks, gaps, platforms, ramps)
- Desert setting with parallax mountains
- High scores saved to localStorage (`roadRiderHighScore`)

## Deployment

Static files - works on GitHub Pages with no backend required.
