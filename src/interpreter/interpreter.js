// Async program interpreter
// Each block type is executed sequentially; Repeat nests execution.
// Returns a cancel function that stops execution at the next safe point.

export const STAGE_W = 480;
export const STAGE_H = 360;
export const SPRITE_SIZE = 44; // CSS px; used for collision hitbox

const HALF_W = STAGE_W / 2;
const HALF_H = STAGE_H / 2;

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Maximum boundary for sprite center so it stays on stage
const MAX_X = HALF_W - SPRITE_SIZE / 2;
const MAX_Y = HALF_H - SPRITE_SIZE / 2;

// Convert Scratch direction (degrees) to a movement vector
// Scratch: 90 = right, 0 = up, 180 = down, -90/270 = left
export function directionToVector(direction) {
  const rad = direction * (Math.PI / 180);
  return { dx: Math.sin(rad), dy: Math.cos(rad) };
}

function raf() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

/**
 * Run a list of blocks for one sprite.
 *
 * @param {Object} opts
 * @param {Block[]}   opts.blocks          - Program to execute
 * @param {Function}  opts.getSpriteState  - () => { x, y, direction, speech }
 * @param {Function}  opts.updateSprite    - (updates: Partial<SpriteState>) => void
 *   Writes to the mutable runtime ref AND schedules React sync.
 * @returns {Function} cancel – call to abort execution
 */
export function runProgram({ blocks, getSpriteState, updateSprite, onComplete }) {
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };

  async function execute(blockList) {
    for (const block of blockList) {
      if (cancelled) return;
      await executeBlock(block);
    }
  }

  async function executeBlock(block) {
    if (cancelled) return;

    switch (block.type) {
      case "move": {
        const steps = parseFloat(block.params.steps) || 0;
        const s = getSpriteState();
        const { dx, dy } = directionToVector(s.direction);
        updateSprite({
          x: clamp(s.x + steps * dx, -MAX_X, MAX_X),
          y: clamp(s.y + steps * dy, -MAX_Y, MAX_Y),
        });
        await raf();
        break;
      }

      case "turn": {
        const deg = parseFloat(block.params.degrees) || 0;
        const sign = block.params.dir === "left" ? -1 : 1;
        const s = getSpriteState();
        const newDir = ((s.direction + sign * deg) % 360 + 360) % 360;
        updateSprite({ direction: newDir });
        await raf();
        break;
      }

      case "goto": {
        const x = clamp(parseFloat(block.params.x) || 0, -MAX_X, MAX_X);
        const y = clamp(parseFloat(block.params.y) || 0, -MAX_Y, MAX_Y);
        updateSprite({ x, y });
        await raf();
        break;
      }

      case "say":
      case "think": {
        const text = String(block.params.message || "");
        const secs = Math.max(0.1, parseFloat(block.params.seconds) || 1);
        updateSprite({ speech: { type: block.type, text } });
        await sleep(secs * 1000);
        if (!cancelled) updateSprite({ speech: null });
        break;
      }

      case "repeat": {
        const times = Math.max(0, Math.min(10000, parseInt(block.params.times, 10) || 0));
        const children = block.children || [];
        for (let i = 0; i < times && !cancelled; i++) {
          await execute(children);
          // Yield at end of each repeat iteration to keep UI responsive
          await raf();
        }
        break;
      }

      default:
        break;
    }
  }

  // Kick off async execution; call onComplete when program finishes naturally
  execute(blocks)
    .then(() => { if (!cancelled && onComplete) onComplete(); })
    .catch((err) => { if (!cancelled) console.error("Interpreter error:", err); });

  return cancel;
}
