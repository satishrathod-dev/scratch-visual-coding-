import React, { useState } from "react";
import { PALETTE_GROUPS, BLOCK_COLORS } from "../context/AppContext";

/**
 * Block Palette — left sidebar.
 * Each block is draggable. DnD data is JSON: { source: 'palette', type, params }
 */
export default function Sidebar() {
  const [expanded, setExpanded] = useState({ Motion: true, Looks: true, Control: true });

  const toggle = (label) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <div
      style={{
        width: 180,
        flexShrink: 0,
        height: "100%",
        overflowY: "auto",
        background: "#F8FAFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        padding: "8px 0",
      }}
    >
      <div
        style={{
          padding: "6px 12px 10px",
          fontSize: 11,
          fontWeight: 700,
          color: "#64748B",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          borderBottom: "1px solid #E2E8F0",
          marginBottom: 6,
        }}
      >
        Blocks
      </div>

      {PALETTE_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 4 }}>
          {/* Category header */}
          <button
            onClick={() => toggle(group.label)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              color: group.color,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: group.color,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {group.label}
            <span style={{ marginLeft: "auto", color: "#94A3B8", fontSize: 10 }}>
              {expanded[group.label] ? "▲" : "▼"}
            </span>
          </button>

          {/* Block list */}
          {expanded[group.label] && (
            <div style={{ padding: "2px 8px 6px" }}>
              {group.blocks.map((b) => (
                <PaletteBlock key={b.type} type={b.type} color={group.color} />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Usage hint */}
      <div
        style={{
          marginTop: "auto",
          padding: "10px 12px",
          fontSize: 10,
          color: "#94A3B8",
          borderTop: "1px solid #E2E8F0",
          lineHeight: 1.4,
        }}
      >
        Drag blocks into the workspace to build a program for each sprite.
      </div>
    </div>
  );
}

// ─── Individual draggable palette block ────────────────────────────────────────
function PaletteBlock({ type, color }) {
  const [hover, setHover] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ source: "palette", type })
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const label = BLOCK_LABELS[type];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? color : lighten(color),
        border: `1.5px solid ${color}`,
        borderRadius: 6,
        padding: "6px 9px",
        marginBottom: 5,
        cursor: "grab",
        color: hover ? "white" : color,
        fontSize: 12,
        fontWeight: 600,
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        gap: 5,
        transition: "all 0.1s",
        boxShadow: hover ? `0 2px 6px ${color}55` : "none",
      }}
    >
      <span style={{ fontSize: 13 }}>{BLOCK_ICONS[type]}</span>
      {label}
    </div>
  );
}

const BLOCK_LABELS = {
  move: "Move steps",
  turn: "Turn degrees",
  goto: "Go to x y",
  say: "Say for secs",
  think: "Think for secs",
  repeat: "Repeat times",
};

const BLOCK_ICONS = {
  move: "→",
  turn: "↻",
  goto: "✦",
  say: "💬",
  think: "💭",
  repeat: "↺",
};

function lighten(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * 0.15 + 255 * 0.85);
  const g = Math.round(((n >> 8) & 0xff) * 0.15 + 255 * 0.85);
  const b = Math.round((n & 0xff) * 0.15 + 255 * 0.85);
  return `rgb(${r},${g},${b})`;
}
