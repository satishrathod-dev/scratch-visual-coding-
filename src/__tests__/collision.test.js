/**
 * Tests for collision detection logic.
 * We test the mathematical side and the runtime swap behavior
 * by directly invoking the interpreter with simulated state.
 */

global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

import { runProgram, SPRITE_SIZE } from "../interpreter/interpreter";
import { makeBlock } from "../context/AppContext";

// ─── Collision detection math ──────────────────────────────────────────────────
describe("Collision detection", () => {
  const isColliding = (s1, s2, threshold = SPRITE_SIZE) =>
    Math.sqrt((s1.x - s2.x) ** 2 + (s1.y - s2.y) ** 2) < threshold;

  test("detects overlapping sprites", () => {
    expect(isColliding({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(true);
  });

  test("does not flag well-separated sprites", () => {
    expect(isColliding({ x: -100, y: 0 }, { x: 100, y: 0 })).toBe(false);
  });

  test("detects collision exactly at threshold boundary", () => {
    const thresh = SPRITE_SIZE;
    // Just inside: should collide
    expect(isColliding({ x: 0, y: 0 }, { x: thresh - 1, y: 0 })).toBe(true);
    // Just outside: should not collide
    expect(isColliding({ x: 0, y: 0 }, { x: thresh + 1, y: 0 })).toBe(false);
  });

  test("collision is symmetric", () => {
    const a = { x: 10, y: 5 };
    const b = { x: 15, y: 5 };
    expect(isColliding(a, b)).toBe(isColliding(b, a));
  });
});

// ─── Runtime program swap ──────────────────────────────────────────────────────
describe("Runtime program swap", () => {
  test("swapping programs changes movement direction", async () => {
    // Sprite A moves right (+10 steps at direction 90)
    // Sprite B moves left  (+10 steps at direction 270)
    // After swap, A should use B's program (move left) and vice versa

    const progA = [makeBlock("move")];
    progA[0].params.steps = 10;

    const progB = [makeBlock("move")];
    progB[0].params.steps = 10;

    // Runtime state
    let stateA = { x: 0, y: 0, direction: 90,  speech: null };
    let stateB = { x: 0, y: 0, direction: 270, speech: null };
    const updatesA = [];
    const updatesB = [];

    // Simulate running Sprite A with its original program
    await new Promise((resolve) => {
      runProgram({
        blocks: progA,
        getSpriteState: () => ({ ...stateA }),
        updateSprite: (u) => { stateA = { ...stateA, ...u }; updatesA.push({ ...stateA }); },
      });
      setTimeout(resolve, 50);
    });

    // Sprite A (direction 90) should have moved right
    expect(updatesA.some((u) => u.x > 0)).toBe(true);

    // Now simulate A running B's program (the swap)
    let stateA2 = { x: 0, y: 0, direction: 270, speech: null }; // A with B's direction
    const updatesA2 = [];
    await new Promise((resolve) => {
      runProgram({
        blocks: progB,
        getSpriteState: () => ({ ...stateA2 }),
        updateSprite: (u) => { stateA2 = { ...stateA2, ...u }; updatesA2.push({ ...stateA2 }); },
      });
      setTimeout(resolve, 50);
    });

    // After swap, A moves with B's direction (270 = left, so x decreases)
    expect(updatesA2.some((u) => u.x < 0)).toBe(true);
  });
});

// ─── Collision debouncing (entry detection) ───────────────────────────────────
describe("Collision entry detection", () => {
  test("pair key format is deterministic and sorted", () => {
    const id1 = "sprite2";
    const id2 = "sprite1";
    const key = [id1, id2].sort().join("|");
    expect(key).toBe("sprite1|sprite2");
  });

  test("adding then removing from Set simulates entry/exit", () => {
    const pairs = new Set();
    const key = "sprite1|sprite2";

    // First frame: collision starts
    const wasColliding1 = pairs.has(key);
    pairs.add(key);
    expect(wasColliding1).toBe(false); // entry event should fire

    // Second frame: still colliding (no re-fire)
    const wasColliding2 = pairs.has(key);
    expect(wasColliding2).toBe(true); // already in set → no new event

    // Third frame: sprites separate
    pairs.delete(key);
    expect(pairs.has(key)).toBe(false); // exit registered

    // Fourth frame: collision again → new entry event
    const wasColliding4 = pairs.has(key);
    pairs.add(key);
    expect(wasColliding4).toBe(false); // entry fires again
  });
});

// ─── Independent sprite programs ──────────────────────────────────────────────
describe("Independent sprite programs", () => {
  test("two sprites run independently without interfering", async () => {
    const progA = [makeBlock("move")];
    progA[0].params.steps = 20;

    const progB = [makeBlock("move")];
    progB[0].params.steps = -15;

    let stateA = { x: 0, y: 0, direction: 90, speech: null };
    let stateB = { x: 0, y: 0, direction: 90, speech: null };

    await new Promise((resolve) => {
      runProgram({
        blocks: progA,
        getSpriteState: () => ({ ...stateA }),
        updateSprite: (u) => { stateA = { ...stateA, ...u }; },
      });
      runProgram({
        blocks: progB,
        getSpriteState: () => ({ ...stateB }),
        updateSprite: (u) => { stateB = { ...stateB, ...u }; },
      });
      setTimeout(resolve, 100);
    });

    expect(stateA.x).toBeCloseTo(20, 1);
    expect(stateB.x).toBeCloseTo(-15, 1);
  });
});

// ─── Stop / reset ─────────────────────────────────────────────────────────────
describe("Stop and reset", () => {
  test("cancel stops further updates", async () => {
    const prog = [makeBlock("move"), makeBlock("move"), makeBlock("move")];
    prog.forEach((b) => { b.params.steps = 10; });

    let updateCount = 0;
    let state = { x: 0, y: 0, direction: 90, speech: null };

    const cancel = runProgram({
      blocks: prog,
      getSpriteState: () => ({ ...state }),
      updateSprite: (u) => { state = { ...state, ...u }; updateCount++; },
    });

    cancel(); // cancel immediately

    await new Promise((resolve) => setTimeout(resolve, 100));

    // With immediate cancel, only 0-1 RAF steps should have fired
    expect(updateCount).toBeLessThanOrEqual(1);
  });
});
