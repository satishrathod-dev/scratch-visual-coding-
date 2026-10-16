import React from "react";
import { useApp } from "../context/AppContext";

/**
 * Sprite manager panel — below the stage.
 * Lists all sprites with selection, add, and delete controls.
 */
export default function SpriteManager() {
  const { state, dispatch } = useApp();
  const { sprites, selectedSpriteId } = state;

  const selectSprite = (id) => dispatch({ type: "SELECT_SPRITE", id });
  const addSprite = () => dispatch({ type: "ADD_SPRITE" });
  const deleteSprite = (id) => dispatch({ type: "DELETE_SPRITE", id });

  return (
    <div
      style={{
        borderTop: "1px solid #E2E8F0",
        background: "#F8FAFF",
        padding: "8px 10px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 8,
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          Sprites
        </span>
        <button
          onClick={addSprite}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "#4C97FF",
            border: "none",
            borderRadius: 5,
            color: "white",
            padding: "3px 8px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
          }}
          title="Add new sprite"
        >
          + Add Sprite
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {sprites.map((s) => (
          <div
            key={s.id}
            onClick={() => selectSprite(s.id)}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 8px",
              borderRadius: 8,
              border: s.id === selectedSpriteId
                ? `2px solid ${s.color}`
                : "2px solid transparent",
              background: s.id === selectedSpriteId
                ? `${s.color}18`
                : "white",
              cursor: "pointer",
              minWidth: 64,
              transition: "all 0.15s",
              boxShadow: s.id === selectedSpriteId
                ? `0 0 0 3px ${s.color}33`
                : "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {/* Sprite avatar */}
            <SpriteAvatar color={s.color} size={32} />

            {/* Name */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: s.id === selectedSpriteId ? s.color : "#475569",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 64,
              }}
            >
              {s.name}
            </span>

            {/* Position info */}
            <span style={{ fontSize: 9, color: "#94A3B8" }}>
              {Math.round(s.x)}, {Math.round(s.y)}
            </span>

            {/* Delete button */}
            {sprites.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSprite(s.id);
                }}
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  background: "#EF4444",
                  border: "none",
                  borderRadius: "50%",
                  width: 14,
                  height: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "white",
                  fontSize: 9,
                  lineHeight: 1,
                  padding: 0,
                  opacity: 0.8,
                }}
                title="Delete sprite"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple CSS-drawn sprite avatar
export function SpriteAvatar({ color, size = 40 }) {
  const s = size;
  const r = s / 2;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      {/* Body circle */}
      <circle cx={r} cy={r} r={r - 2} fill={color} />
      {/* Eyes */}
      <circle cx={r - 5} cy={r - 4} r={2.5} fill="white" />
      <circle cx={r + 5} cy={r - 4} r={2.5} fill="white" />
      <circle cx={r - 4.5} cy={r - 3.5} r={1.2} fill="#1a1a2e" />
      <circle cx={r + 5.5} cy={r - 3.5} r={1.2} fill="#1a1a2e" />
      {/* Smile */}
      <path
        d={`M ${r - 5} ${r + 3} Q ${r} ${r + 8} ${r + 5} ${r + 3}`}
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
