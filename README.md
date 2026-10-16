# Scratch Visual Coding Environment

A fully functional visual programming environment built in React, inspired by MIT Scratch. Created for the Juspay ReactJS Assessment.

## Features

### Motion Blocks
- **Move [N] steps** — Moves the sprite in its current direction by N steps
- **Turn [left|right] [N] degrees** — Rotates the sprite
- **Go to x: [X] y: [Y]** — Teleports the sprite to an absolute position

### Looks Blocks
- **Say [message] for [N] seconds** — Shows a speech bubble for N seconds
- **Think [message] for [N] seconds** — Shows a thought bubble for N seconds

### Control Blocks
- **Repeat [N] times** — Executes nested blocks exactly N times (supports nesting)

### Multiple Sprites
- Create multiple independent sprites (each with their own program)
- Click a sprite card to select and edit its program
- Sprites have independent position, direction, and speech state
- Play starts all sprite programs concurrently

### Collision-Based Program Swap (Hero Feature)
When two sprites overlap on the stage:
1. Their **runtime programs are swapped** immediately
2. The editor view updates to reflect the swap
3. A notification banner shows in the toolbar
4. The collision only triggers **once per contact** — no repeated swaps while overlapping
5. Sprites separate → state resets so the next contact triggers again

## Getting Started

### Prerequisites
- Node.js 14+
- npm 6+

### Installation

```bash
npm install
```

### Development

```bash
npm start
# Opens at http://localhost:3000
```

### Production Build

```bash
npm run build
# Output: public/app.js and public/app.css
```

### Tests

```bash
npm test
```

Runs 40 tests covering:
- Block execution (move, turn, goto, repeat, say, think)
- Stage boundary clamping
- Direction-to-vector math
- Collision detection math
- Collision entry/exit debouncing
- Program swap behavior
- Cancellation / stop behavior
- Invalid input handling

## Architecture

```
src/
├── App.js                      Main layout + stateRef for playback
├── context/
│   └── AppContext.js           useReducer state + all block/sprite actions
├── interpreter/
│   └── interpreter.js          Async execution engine (runProgram)
├── hooks/
│   └── usePlayback.js          Play/stop/reset + collision detection
└── components/
    ├── Toolbar.js              Top bar with play/stop/reset + notifications
    ├── Sidebar.js              Draggable block palette (grouped by category)
    ├── MidArea.js              Workspace with HTML5 DnD
    ├── Block.js                Individual block (editable, draggable, nested)
    ├── PreviewArea.js          Stage with sprite rendering
    ├── SpriteManager.js        Sprite list panel
    └── SpeechBubble.js         Say/think bubble rendering
```

### Coordinate System
- Stage: 480×360 pixels
- Origin at center (0, 0)
- X: negative = left, positive = right
- Y: negative = down, positive = up (Scratch convention, inverted in CSS)
- Sprite direction: 90° = right (Scratch convention)

### Interpreter
The interpreter (`runProgram`) is an async function that:
1. Runs blocks sequentially in a `for` loop
2. Uses `await requestAnimationFrame()` after each motion block to yield to the browser
3. Uses `await setTimeout(ms)` for Say/Think duration
4. Supports `repeat` nesting with per-iteration RAF yields
5. Returns a `cancel()` function; sets a flag checked at each block boundary

### Collision Detection
A `requestAnimationFrame` loop runs while playing and:
1. Checks all sprite pairs (Euclidean distance < 44px)
2. Tracks currently-colliding pairs in a `Set`
3. Only fires the swap handler on **entry** (pair was absent, now present)
4. Removes from Set when sprites separate (enables future re-collision)
5. On collision: swaps runtime program refs, restarts both interpreters

### Runtime State Pattern
To avoid stale React closures during fast interpreter execution:
- A `runtimeRef` (mutable ref) holds sprite positions, directions, and programs
- The interpreter reads/writes `runtimeRef` directly (no stale state issues)
- After each write, a `scheduleSync()` call batches React state updates via RAF
- This decouples execution speed from React render frequency

## Drag-and-Drop

Uses the HTML5 native DnD API:
- **Palette → Workspace**: drag a palette block into the workspace area
- **Workspace reorder**: drag any workspace block to a different position (drop slots appear between blocks)
- **Nesting**: drop a block onto a Repeat block's inner zone to add as a child
- **Delete**: drag a workspace block to the trash icon in the workspace header

## Deployment

The app is a pure static SPA — deploy the contents of `public/` to any static host.

### Vercel (recommended)

```bash
npm install -g vercel
vercel
# Build command: npm run build
# Output directory: public
```

### Netlify

```
Build command: npm run build
Publish directory: public
```

No environment variables required.
