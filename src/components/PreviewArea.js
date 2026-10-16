import React, { useRef } from "react";
import { useApp } from "../context/AppContext";
import SpeechBubble from "./SpeechBubble";
import SpriteManager from "./SpriteManager";
import { STAGE_W, STAGE_H, SPRITE_SIZE } from "../interpreter/interpreter";

/**
 * Stage — right panel.
 * Renders all sprites at their runtime positions with speech/thought bubbles.
 * Coordinate system: origin at center, x right, y up (Scratch convention).
 * CSS mapping: cssLeft = W/2 + x - spriteSize/2, cssTop = H/2 - y - spriteSize/2
 */
export default function PreviewArea() {
  const { state, dispatch } = useApp();
  const { sprites, selectedSpriteId } = state;
  const stageRef = useRef(null);

  const HALF_W = STAGE_W / 2;
  const HALF_H = STAGE_H / 2;
  const SS = SPRITE_SIZE;

  // Convert Scratch coords to CSS position (top-left of sprite element)
  const toCSS = (x, y) => ({
    left: HALF_W + x - SS / 2,
    top: HALF_H - y - SS / 2,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#F8FAFF",
      }}
    >
      {/* Stage label */}
      <div
        style={{
          padding: "6px 10px",
          fontSize: 10,
          fontWeight: 700,
          color: "#64748B",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          borderBottom: "1px solid #E2E8F0",
          background: "white",
          flexShrink: 0,
        }}
      >
        Stage (480 × 360)
      </div>

      {/* Stage canvas */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
        <div
          ref={stageRef}
          style={{
            width: STAGE_W,
            height: STAGE_H,
            background: "white",
            border: "2px solid #CBD5E1",
            borderRadius: 8,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            flexShrink: 0,
          }}
        >
          {/* Grid lines (subtle) */}
          <StageGrid />

          {/* Axis indicators */}
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#E2E8F0", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#E2E8F0", pointerEvents: "none" }} />

          {/* Coordinate labels */}
          <CoordLabel style={{ top: 4, left: "50%", transform: "translateX(-50%)" }}>y:+</CoordLabel>
          <CoordLabel style={{ bottom: 4, left: "50%", transform: "translateX(-50%)" }}>y:-</CoordLabel>
          <CoordLabel style={{ left: 4, top: "50%", transform: "translateY(-50%)" }}>x:-</CoordLabel>
          <CoordLabel style={{ right: 4, top: "50%", transform: "translateY(-50%)" }}>x:+</CoordLabel>

          {/* Sprites */}
          {sprites.map((sprite) => {
            const { left, top } = toCSS(sprite.x, sprite.y);
            const isSelected = sprite.id === selectedSpriteId;
            const rotation = sprite.direction - 90; // CSS rotation from Scratch direction

            return (
              <div
                key={sprite.id}
                onClick={() => dispatch({ type: "SELECT_SPRITE", id: sprite.id })}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: SS,
                  height: SS,
                  transform: `rotate(${rotation}deg)`,
                  cursor: "pointer",
                  zIndex: isSelected ? 10 : 5,
                }}
              >
                {/* Selection ring */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      inset: -4,
                      borderRadius: "50%",
                      border: `2px solid ${sprite.color}`,
                      boxShadow: `0 0 0 3px ${sprite.color}44`,
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Sprite body */}
                <SpriteFigure color={sprite.color} size={SS} />

                {/* Speech/thought bubble (un-rotated) */}
                {sprite.speech && (
                  <div style={{ transform: `rotate(${-rotation}deg)` }}>
                    <SpeechBubble
                      type={sprite.speech.type}
                      text={sprite.speech.text}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sprite manager */}
      <SpriteManager />
    </div>
  );
}

// ─── Simple sprite figure ──────────────────────────────────────────────────────
function SpriteFigure({ color, size }) {
  const r = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      {/* Shadow */}
      <ellipse cx={r} cy={size - 4} rx={r - 4} ry={4} fill="rgba(0,0,0,0.1)" />
      {/* Body */}
      <circle cx={r} cy={r - 2} r={r - 4} fill={color} />
      {/* Direction indicator (triangle pointing up = "forward") */}
      <polygon
        points={`${r},4 ${r - 6},${r + 2} ${r + 6},${r + 2}`}
        fill="rgba(255,255,255,0.75)"
      />
      {/* Eyes */}
      <circle cx={r - 6} cy={r - 4} r={3} fill="white" />
      <circle cx={r + 6} cy={r - 4} r={3} fill="white" />
      <circle cx={r - 5} cy={r - 4} r={1.5} fill="#1a1a2e" />
      <circle cx={r + 7} cy={r - 4} r={1.5} fill="#1a1a2e" />
    </svg>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────
function StageGrid() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F1F5F9" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

function CoordLabel({ children, style }) {
  return (
    <div
      style={{
        position: "absolute",
        fontSize: 9,
        color: "#CBD5E1",
        fontFamily: "monospace",
        pointerEvents: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
