import React, { createContext, useContext, useReducer } from "react";

// ─── ID factory ────────────────────────────────────────────────────────────────
let _idCtr = 0;
export const uid = () => `b${++_idCtr}_${Math.random().toString(36).slice(2, 6)}`;

// ─── Block metadata ────────────────────────────────────────────────────────────
export const BLOCK_COLORS = {
  move: "#4C97FF",
  turn: "#4C97FF",
  goto: "#4C97FF",
  say: "#9966FF",
  think: "#9966FF",
  repeat: "#FFAB19",
};

export const BLOCK_DEFAULTS = {
  move: { steps: 10 },
  turn: { degrees: 15, dir: "right" },
  goto: { x: 0, y: 0 },
  say: { message: "Hello!", seconds: 2 },
  think: { message: "Hmm...", seconds: 2 },
  repeat: { times: 10 },
};

export const PALETTE_GROUPS = [
  {
    label: "Motion",
    color: "#4C97FF",
    blocks: [
      { type: "move", label: "Move steps" },
      { type: "turn", label: "Turn degrees" },
      { type: "goto", label: "Go to x y" },
    ],
  },
  {
    label: "Looks",
    color: "#9966FF",
    blocks: [
      { type: "say", label: "Say for secs" },
      { type: "think", label: "Think for secs" },
    ],
  },
  {
    label: "Control",
    color: "#FFAB19",
    blocks: [{ type: "repeat", label: "Repeat times" }],
  },
];

export const makeBlock = (type) => ({
  id: uid(),
  type,
  params: { ...BLOCK_DEFAULTS[type] },
  children: type === "repeat" ? [] : undefined,
});

// ─── Sprite metadata ───────────────────────────────────────────────────────────
const SPRITE_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];
const INIT_POSITIONS = [
  { x: -80, y: 0 },
  { x: 80, y: 0 },
  { x: 0, y: 60 },
  { x: -150, y: 0 },
  { x: 150, y: 0 },
  { x: 0, y: -60 },
];

let _spriteCtr = 0;
const makeSprite = (index) => {
  const n = ++_spriteCtr;
  const pos = INIT_POSITIONS[index % INIT_POSITIONS.length];
  return {
    id: `sprite${n}`,
    name: `Sprite ${n}`,
    color: SPRITE_COLORS[index % SPRITE_COLORS.length],
    x: pos.x,
    y: pos.y,
    direction: 90, // Scratch convention: 90 = right
    visible: true,
    speech: null, // { type: 'say'|'think', text: string }
    program: [],
    initX: pos.x,
    initY: pos.y,
  };
};

// ─── Program manipulation helpers ──────────────────────────────────────────────
export const findBlock = (program, id) => {
  for (const b of program) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlock(b.children, id);
      if (found) return found;
    }
  }
  return null;
};

const removeBlock = (program, id) =>
  program
    .filter((b) => b.id !== id)
    .map((b) =>
      b.children ? { ...b, children: removeBlock(b.children, id) } : b
    );

const insertBlock = (program, block, afterId, insideId) => {
  // Insert as child of a repeat block
  if (insideId) {
    return program.map((b) => {
      if (b.id === insideId) {
        return { ...b, children: [...(b.children || []), block] };
      }
      if (b.children) {
        return { ...b, children: insertBlock(b.children, block, afterId, insideId) };
      }
      return b;
    });
  }

  // Append to end
  if (!afterId) return [...program, block];

  const idx = program.findIndex((b) => b.id === afterId);
  if (idx === -1) {
    // May be nested
    return program.map((b) =>
      b.children
        ? { ...b, children: insertBlock(b.children, block, afterId, insideId) }
        : b
    );
  }
  const result = [...program];
  result.splice(idx + 1, 0, block);
  return result;
};

const updateParams = (program, id, params) =>
  program.map((b) => {
    if (b.id === id) return { ...b, params: { ...b.params, ...params } };
    if (b.children) return { ...b, children: updateParams(b.children, id, params) };
    return b;
  });

// ─── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  sprites: [makeSprite(0), makeSprite(1)],
  selectedSpriteId: "sprite1",
  isPlaying: false,
  collisionNotification: null, // { message, id }
};

// ─── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case "SELECT_SPRITE":
      return { ...state, selectedSpriteId: action.id };

    case "ADD_SPRITE": {
      const sprite = makeSprite(state.sprites.length);
      return {
        ...state,
        sprites: [...state.sprites, sprite],
        selectedSpriteId: sprite.id,
      };
    }

    case "DELETE_SPRITE": {
      if (state.sprites.length <= 1) return state;
      const sprites = state.sprites.filter((s) => s.id !== action.id);
      const selectedSpriteId =
        state.selectedSpriteId === action.id
          ? sprites[0].id
          : state.selectedSpriteId;
      return { ...state, sprites, selectedSpriteId };
    }

    case "ADD_BLOCK": {
      const { spriteId, block, afterId, insideId } = action;
      return {
        ...state,
        sprites: state.sprites.map((s) =>
          s.id !== spriteId
            ? s
            : { ...s, program: insertBlock(s.program, block, afterId, insideId) }
        ),
      };
    }

    case "REMOVE_BLOCK":
      return {
        ...state,
        sprites: state.sprites.map((s) =>
          s.id !== action.spriteId
            ? s
            : { ...s, program: removeBlock(s.program, action.blockId) }
        ),
      };

    case "UPDATE_BLOCK_PARAMS":
      return {
        ...state,
        sprites: state.sprites.map((s) =>
          s.id !== action.spriteId
            ? s
            : { ...s, program: updateParams(s.program, action.blockId, action.params) }
        ),
      };

    case "MOVE_BLOCK": {
      const { spriteId, blockId, afterId, insideId } = action;
      return {
        ...state,
        sprites: state.sprites.map((s) => {
          if (s.id !== spriteId) return s;
          const block = findBlock(s.program, blockId);
          if (!block) return s;
          const without = removeBlock(s.program, blockId);
          return { ...s, program: insertBlock(without, block, afterId, insideId) };
        }),
      };
    }

    case "SYNC_RUNTIME": {
      // Batch-update all sprite positions/direction/speech from interpreter runtime
      const { runtimeSprites } = action;
      return {
        ...state,
        sprites: state.sprites.map((s) => {
          const rt = runtimeSprites[s.id];
          if (!rt) return s;
          return { ...s, x: rt.x, y: rt.y, direction: rt.direction, speech: rt.speech };
        }),
      };
    }

    case "SWAP_PROGRAMS": {
      const { id1, id2 } = action;
      const s1 = state.sprites.find((s) => s.id === id1);
      const s2 = state.sprites.find((s) => s.id === id2);
      if (!s1 || !s2) return state;
      return {
        ...state,
        sprites: state.sprites.map((s) => {
          if (s.id === id1) return { ...s, program: JSON.parse(JSON.stringify(s2.program)) };
          if (s.id === id2) return { ...s, program: JSON.parse(JSON.stringify(s1.program)) };
          return s;
        }),
        collisionNotification: {
          message: `${s1.name} & ${s2.name} swapped programs!`,
          id: Date.now(),
        },
      };
    }

    case "SET_PLAYING":
      return { ...state, isPlaying: action.value };

    case "RESET": {
      return {
        ...state,
        isPlaying: false,
        collisionNotification: null,
        sprites: state.sprites.map((s) => ({
          ...s,
          x: s.initX,
          y: s.initY,
          direction: 90,
          visible: true,
          speech: null,
        })),
      };
    }

    case "CLEAR_NOTIFICATION":
      return { ...state, collisionNotification: null };

    default:
      return state;
  }
}

// ─── Context & Provider ────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
