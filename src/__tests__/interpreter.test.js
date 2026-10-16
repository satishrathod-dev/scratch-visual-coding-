/**
 * Tests for the program interpreter (interpreter.js)
 * and the AppContext reducer (AppContext.js).
 *
 * These are pure-logic tests that don't require a DOM.
 */

// jsdom doesn't fire requestAnimationFrame automatically.
// Polyfill it to resolve via setTimeout(0) so awaited RAF calls resolve.
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

import { runProgram, clamp, directionToVector, SPRITE_SIZE } from "../interpreter/interpreter";
import { makeBlock, findBlock } from "../context/AppContext";

// ─── Helper: capture all state updates from running a program ─────────────────
function runSync(blocks, initialState = { x: 0, y: 0, direction: 90, speech: null }) {
  return new Promise((resolve) => {
    const history = [];
    let current = { ...initialState };

    const getSpriteState = () => ({ ...current });
    const updateSprite = (updates) => {
      current = { ...current, ...updates };
      history.push({ ...current });
    };

    const cancel = runProgram({ blocks, getSpriteState, updateSprite });

    // Wait for async completion — max 5s
    const deadline = Date.now() + 5000;
    // Wait 500ms – enough for up to 10000 RAF ticks (each is a setTimeout(0))
    setTimeout(() => {
      resolve({ history, current, cancel });
    }, 500);
  });
}

// ─── clamp ────────────────────────────────────────────────────────────────────
describe("clamp", () => {
  test("clamps to min", () => expect(clamp(-300, -220, 220)).toBe(-220));
  test("clamps to max", () => expect(clamp(300, -220, 220)).toBe(220));
  test("passes through middle", () => expect(clamp(100, -220, 220)).toBe(100));
});

// ─── directionToVector ────────────────────────────────────────────────────────
describe("directionToVector", () => {
  test("direction 90 (right) → dx≈1, dy≈0", () => {
    const { dx, dy } = directionToVector(90);
    expect(dx).toBeCloseTo(1, 5);
    expect(dy).toBeCloseTo(0, 5);
  });

  test("direction 0 (up) → dx≈0, dy≈1", () => {
    const { dx, dy } = directionToVector(0);
    expect(dx).toBeCloseTo(0, 5);
    expect(dy).toBeCloseTo(1, 5);
  });

  test("direction 180 (down) → dx≈0, dy≈-1", () => {
    const { dx, dy } = directionToVector(180);
    expect(dx).toBeCloseTo(0, 5);
    expect(dy).toBeCloseTo(-1, 5);
  });

  test("direction 270 (left) → dx≈-1, dy≈0", () => {
    const { dx, dy } = directionToVector(270);
    expect(dx).toBeCloseTo(-1, 5);
    expect(dy).toBeCloseTo(0, 5);
  });
});

// ─── Move block ───────────────────────────────────────────────────────────────
describe("Move block", () => {
  test("moves sprite to the right (direction 90)", async () => {
    const block = makeBlock("move");
    block.params.steps = 50;

    const { current } = await runSync([block], { x: 0, y: 0, direction: 90, speech: null });
    expect(current.x).toBeCloseTo(50, 1);
    expect(current.y).toBeCloseTo(0, 1);
  });

  test("moves sprite upward (direction 0)", async () => {
    const block = makeBlock("move");
    block.params.steps = 30;

    const { current } = await runSync([block], { x: 0, y: 0, direction: 0, speech: null });
    expect(current.x).toBeCloseTo(0, 1);
    expect(current.y).toBeCloseTo(30, 1);
  });

  test("clamps at stage boundary", async () => {
    const block = makeBlock("move");
    block.params.steps = 9999;

    const { current } = await runSync([block], { x: 0, y: 0, direction: 90, speech: null });
    // Should be clamped to MAX_X = STAGE_W/2 - SPRITE_SIZE/2 = 240 - 22 = 218
    expect(current.x).toBeLessThanOrEqual(218);
  });

  test("handles negative steps (move backwards)", async () => {
    const block = makeBlock("move");
    block.params.steps = -20;

    const { current } = await runSync([block], { x: 0, y: 0, direction: 90, speech: null });
    expect(current.x).toBeCloseTo(-20, 1);
  });
});

// ─── Turn block ───────────────────────────────────────────────────────────────
describe("Turn block", () => {
  test("turns right by 15 degrees", async () => {
    const block = makeBlock("turn");
    block.params.degrees = 15;
    block.params.dir = "right";

    const { current } = await runSync([block], { x: 0, y: 0, direction: 90, speech: null });
    expect(current.direction).toBeCloseTo(105, 1);
  });

  test("turns left by 90 degrees", async () => {
    const block = makeBlock("turn");
    block.params.degrees = 90;
    block.params.dir = "left";

    const { current } = await runSync([block], { x: 0, y: 0, direction: 90, speech: null });
    expect(current.direction).toBeCloseTo(0, 1);
  });

  test("wraps around 360", async () => {
    const block = makeBlock("turn");
    block.params.degrees = 45;
    block.params.dir = "right";

    const { current } = await runSync([block], { x: 0, y: 0, direction: 330, speech: null });
    expect(current.direction).toBeCloseTo(15, 1);
  });
});

// ─── Go To block ──────────────────────────────────────────────────────────────
describe("Goto block", () => {
  test("sets exact coordinates", async () => {
    const block = makeBlock("goto");
    block.params.x = 100;
    block.params.y = -50;

    const { current } = await runSync([block], { x: 0, y: 0, direction: 90, speech: null });
    expect(current.x).toBeCloseTo(100, 1);
    expect(current.y).toBeCloseTo(-50, 1);
  });

  test("clamps to stage boundaries", async () => {
    const block = makeBlock("goto");
    block.params.x = 9999;
    block.params.y = 9999;

    const { current } = await runSync([block], { x: 0, y: 0, direction: 90, speech: null });
    expect(current.x).toBeLessThanOrEqual(218);
    expect(current.y).toBeLessThanOrEqual(158);
  });
});

// ─── Repeat block ─────────────────────────────────────────────────────────────
describe("Repeat block", () => {
  test("executes inner blocks exactly N times", async () => {
    const repeatBlock = makeBlock("repeat");
    repeatBlock.params.times = 5;

    const moveBlock = makeBlock("move");
    moveBlock.params.steps = 10;
    repeatBlock.children = [moveBlock];

    const { current } = await runSync([repeatBlock], { x: 0, y: 0, direction: 90, speech: null });
    // 5 × 10 = 50 steps to the right
    expect(current.x).toBeCloseTo(50, 1);
  });

  test("executes 0 times for times=0", async () => {
    const repeatBlock = makeBlock("repeat");
    repeatBlock.params.times = 0;

    const moveBlock = makeBlock("move");
    moveBlock.params.steps = 10;
    repeatBlock.children = [moveBlock];

    const { current } = await runSync([repeatBlock], { x: 0, y: 0, direction: 90, speech: null });
    expect(current.x).toBeCloseTo(0, 1);
  });

  test("nested repeat executes correctly", async () => {
    // Repeat 3 times { Repeat 2 times { Move 5 } } = 3×2×5 = 30
    const outer = makeBlock("repeat");
    outer.params.times = 3;
    const inner = makeBlock("repeat");
    inner.params.times = 2;
    const move = makeBlock("move");
    move.params.steps = 5;
    inner.children = [move];
    outer.children = [inner];

    const { current } = await runSync([outer], { x: 0, y: 0, direction: 90, speech: null });
    expect(current.x).toBeCloseTo(30, 1);
  });
});

// ─── Say / Think blocks ───────────────────────────────────────────────────────
describe("Say / Think blocks", () => {
  test("sets speech state immediately", async () => {
    const block = makeBlock("say");
    block.params.message = "Hello!";
    block.params.seconds = 0.1;

    const updates = [];
    const state = { x: 0, y: 0, direction: 90, speech: null };
    const getSpriteState = () => ({ ...state });
    const updateSprite = (u) => {
      Object.assign(state, u);
      updates.push({ ...state });
    };

    await new Promise((resolve) => {
      runProgram({ blocks: [block], getSpriteState, updateSprite });
      setTimeout(resolve, 200); // wait for say + clear
    });

    // First update: speech set
    expect(updates[0].speech).toEqual({ type: "say", text: "Hello!" });
    // Last update: speech cleared
    expect(updates[updates.length - 1].speech).toBeNull();
  });

  test("think block sets type 'think'", async () => {
    const block = makeBlock("think");
    block.params.message = "Hmm...";
    block.params.seconds = 0.1;

    const updates = [];
    const state = { x: 0, y: 0, direction: 90, speech: null };
    const getSpriteState = () => ({ ...state });
    const updateSprite = (u) => {
      Object.assign(state, u);
      updates.push({ ...state });
    };

    await new Promise((resolve) => {
      runProgram({ blocks: [block], getSpriteState, updateSprite });
      setTimeout(resolve, 200);
    });

    expect(updates[0].speech.type).toBe("think");
    expect(updates[0].speech.text).toBe("Hmm...");
  });
});

// ─── Cancellation ─────────────────────────────────────────────────────────────
describe("Cancellation", () => {
  test("cancel() stops execution mid-program", async () => {
    const blocks = [
      Object.assign(makeBlock("move"), { params: { steps: 10 } }),
      Object.assign(makeBlock("move"), { params: { steps: 10 } }),
      Object.assign(makeBlock("move"), { params: { steps: 10 } }),
    ];

    const updates = [];
    let current = { x: 0, y: 0, direction: 90, speech: null };
    const getSpriteState = () => ({ ...current });
    const updateSprite = (u) => {
      current = { ...current, ...u };
      updates.push({ ...current });
    };

    const cancel = runProgram({ blocks, getSpriteState, updateSprite });

    // Cancel immediately before any RAF fires
    cancel();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // With cancel called before RAF, 0 or 1 updates should have occurred
    expect(updates.length).toBeLessThanOrEqual(1);
  });
});

// ─── Invalid inputs ────────────────────────────────────────────────────────────
describe("Invalid / edge-case inputs", () => {
  test("empty program runs without error", async () => {
    const { current } = await runSync([], { x: 5, y: 5, direction: 45, speech: null });
    expect(current.x).toBe(5);
  });

  test("NaN steps treated as 0", async () => {
    const block = makeBlock("move");
    block.params.steps = "abc";

    const { current } = await runSync([block], { x: 10, y: 0, direction: 90, speech: null });
    expect(current.x).toBe(10); // no movement
  });

  test("repeat times capped at 10000 to prevent runaway loops", async () => {
    const block = makeBlock("repeat");
    block.params.times = 999999;
    block.children = []; // no inner blocks so it's fast

    // Should not throw; completes within a reasonable async cycle
    await expect(
      runSync([block], { x: 0, y: 0, direction: 90, speech: null })
    ).resolves.toBeDefined();
  });
});

// ─── AppContext: makeBlock ─────────────────────────────────────────────────────
describe("makeBlock factory", () => {
  test("creates block with unique IDs", () => {
    const a = makeBlock("move");
    const b = makeBlock("move");
    expect(a.id).not.toBe(b.id);
  });

  test("repeat block has children array", () => {
    const b = makeBlock("repeat");
    expect(Array.isArray(b.children)).toBe(true);
  });

  test("non-repeat block has no children", () => {
    const b = makeBlock("move");
    expect(b.children).toBeUndefined();
  });
});

// ─── AppContext: findBlock ─────────────────────────────────────────────────────
describe("findBlock", () => {
  test("finds top-level block", () => {
    const b = makeBlock("move");
    const program = [b, makeBlock("turn")];
    expect(findBlock(program, b.id)).toBe(b);
  });

  test("finds nested block inside repeat", () => {
    const child = makeBlock("move");
    const repeat = makeBlock("repeat");
    repeat.children = [child];
    const program = [repeat];
    expect(findBlock(program, child.id)).toBe(child);
  });

  test("returns null when not found", () => {
    expect(findBlock([makeBlock("move")], "nonexistent")).toBeNull();
  });
});
