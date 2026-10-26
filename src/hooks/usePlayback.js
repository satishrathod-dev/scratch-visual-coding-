import { useRef, useCallback, useEffect } from "react";
import { runProgram, SPRITE_SIZE } from "../interpreter/interpreter";

/**
 * Manages play / stop / reset and collision-based program swapping.
 *
 * Architecture:
 *  - runtimeRef  holds mutable sprite state that the interpreter reads/writes directly,
 *    avoiding stale-closure issues with React state.
 *  - scheduleSync  batches runtimeRef → React state updates via requestAnimationFrame.
 *  - Collision detection runs in its own RAF loop and fires at most once per "contact entry".
 *  - On collision: runtime programs are swapped, both interpreters are restarted.
 *    A SWAP_PROGRAMS action also updates React state so the editor reflects the swap.
 */
export function usePlayback(stateRef, dispatch) {
  // Mutable runtime (does NOT trigger re-renders)
  const runtimeRef = useRef({
    isPlaying: false,
    sprites: {},        // id → { x, y, direction, speech, name }
    programs: {},       // id → Block[] (can be swapped independently of React state)
    collidingPairs: new Set(),
  });

  const cancelFnsRef = useRef({});      // id → () => void
  const collisionRafRef = useRef(null);
  const syncRafRef = useRef(null);

  // ── Sync runtime → React state (batched via RAF) ─────────────────────────────
  const scheduleSync = useCallback(() => {
    if (syncRafRef.current) return;
    syncRafRef.current = requestAnimationFrame(() => {
      syncRafRef.current = null;
      const runtimeSprites = {};
      Object.entries(runtimeRef.current.sprites).forEach(([id, s]) => {
        runtimeSprites[id] = { x: s.x, y: s.y, direction: s.direction, speech: s.speech };
      });
      dispatch({ type: "SYNC_RUNTIME", runtimeSprites });
    });
  }, [dispatch]);

  // ── Start one sprite's interpreter ───────────────────────────────────────────
  const startSpriteInterpreter = useCallback(
    (spriteId) => {
      // Cancel any running interpreter for this sprite (forced, not natural completion)
      if (cancelFnsRef.current[spriteId]) {
        cancelFnsRef.current[spriteId]();
        delete cancelFnsRef.current[spriteId];
      }

      const program = runtimeRef.current.programs[spriteId];
      if (!program || program.length === 0) return;

      const getSpriteState = () => ({ ...runtimeRef.current.sprites[spriteId] });
      const updateSprite = (updates) => {
        runtimeRef.current.sprites[spriteId] = {
          ...runtimeRef.current.sprites[spriteId],
          ...updates,
        };
        scheduleSync();
      };

      const onComplete = () => {
        delete cancelFnsRef.current[spriteId];
        // Auto-stop when all sprite programs have finished naturally
        if (Object.keys(cancelFnsRef.current).length === 0 && runtimeRef.current.isPlaying) {
          runtimeRef.current.isPlaying = false;
          if (collisionRafRef.current) {
            cancelAnimationFrame(collisionRafRef.current);
            collisionRafRef.current = null;
          }
          dispatch({ type: "SET_PLAYING", value: false });
        }
      };

      const cancel = runProgram({ blocks: program, getSpriteState, updateSprite, onComplete });
      cancelFnsRef.current[spriteId] = cancel;
    },
    [scheduleSync, dispatch]
  );

  // ── Handle collision: swap runtime programs and restart both interpreters ─────
  const handleCollision = useCallback(
    (id1, id2) => {
      const rt = runtimeRef.current;
      const prog1 = rt.programs[id1];
      const prog2 = rt.programs[id2];
      if (!prog1 || !prog2) return;

      // Swap runtime programs
      rt.programs[id1] = prog2;
      rt.programs[id2] = prog1;

      // Restart interpreters with new programs
      startSpriteInterpreter(id1);
      startSpriteInterpreter(id2);

      // Sync swap to React state (editor reflects the swap, notification shown)
      dispatch({ type: "SWAP_PROGRAMS", id1, id2 });
    },
    [startSpriteInterpreter, dispatch]
  );

  // ── Collision detection loop ──────────────────────────────────────────────────
  const startCollisionDetection = useCallback(() => {
    const HITBOX = SPRITE_SIZE; // distance threshold for overlap

    const detect = () => {
      if (!runtimeRef.current.isPlaying) return;

      const rt = runtimeRef.current;
      const ids = Object.keys(rt.sprites);

      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const id1 = ids[i];
          const id2 = ids[j];
          const s1 = rt.sprites[id1];
          const s2 = rt.sprites[id2];
          if (!s1 || !s2) continue;

          const pairKey = [id1, id2].sort().join("|");
          const dist = Math.sqrt((s1.x - s2.x) ** 2 + (s1.y - s2.y) ** 2);
          const isColliding = dist < HITBOX;
          const wasColliding = rt.collidingPairs.has(pairKey);

          if (isColliding && !wasColliding) {
            rt.collidingPairs.add(pairKey);
            handleCollision(id1, id2);
          } else if (!isColliding && wasColliding) {
            rt.collidingPairs.delete(pairKey);
          }
        }
      }

      collisionRafRef.current = requestAnimationFrame(detect);
    };

    collisionRafRef.current = requestAnimationFrame(detect);
  }, [handleCollision]);

  // ── Cancel all running interpreters and loops ─────────────────────────────────
  const cancelAll = useCallback(() => {
    runtimeRef.current.isPlaying = false;

    Object.values(cancelFnsRef.current).forEach((fn) => fn && fn());
    cancelFnsRef.current = {};

    if (collisionRafRef.current) {
      cancelAnimationFrame(collisionRafRef.current);
      collisionRafRef.current = null;
    }
    if (syncRafRef.current) {
      cancelAnimationFrame(syncRafRef.current);
      syncRafRef.current = null;
    }
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    const state = stateRef.current;
    const rt = runtimeRef.current;

    rt.isPlaying = true;
    rt.collidingPairs = new Set();

    // Initialize runtime from current React state
    state.sprites.forEach((s) => {
      rt.sprites[s.id] = {
        x: s.x,
        y: s.y,
        direction: s.direction,
        speech: null,
        name: s.name,
      };
      // Deep-copy program so swaps don't mutate React state arrays
      rt.programs[s.id] = JSON.parse(JSON.stringify(s.program));
    });

    dispatch({ type: "SET_PLAYING", value: true });

    // Start all interpreters
    state.sprites.forEach((s) => startSpriteInterpreter(s.id));

    // Start collision detection
    startCollisionDetection();
  }, [stateRef, dispatch, startSpriteInterpreter, startCollisionDetection]);

  const stop = useCallback(() => {
    cancelAll();
    dispatch({ type: "SET_PLAYING", value: false });
  }, [cancelAll, dispatch]);

  const reset = useCallback(() => {
    cancelAll();
    dispatch({ type: "RESET" });
  }, [cancelAll, dispatch]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => cancelAll();
  }, [cancelAll]);

  return { play, stop, reset };
}
