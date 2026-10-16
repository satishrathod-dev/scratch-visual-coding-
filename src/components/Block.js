import React, { useState } from "react";
import { BLOCK_COLORS } from "../context/AppContext";

/**
 * Renders a single block in the workspace.
 * Supports drag-and-drop, inline param editing, and nested children (Repeat).
 */
export default function Block({
  block,
  spriteId,
  depth = 0,
  onUpdateParams,
  onRemove,
  onDragStart,
  onDropSlot,      // (afterId, insideId, data) => void
  onDropInside,    // (insideId, data) => void – for repeat inner zone
  draggingBlockId, // string: ID of block currently being dragged
}) {
  const isDragging = draggingBlockId === block.id;
  const [overInner, setOverInner] = useState(false);
  const [overSlot, setOverSlot] = useState(false);

  const color = BLOCK_COLORS[block.type] || "#888";
  const darkColor = darken(color);

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ source: "workspace", blockId: block.id, spriteId })
    );
    e.dataTransfer.effectAllowed = "move";
    onDragStart && onDragStart(block.id);
  };

  const handleDropOnSlot = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOverSlot(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.source === "palette") {
        onDropSlot && onDropSlot(block.id, null, data);
      } else if (data.source === "workspace" && data.blockId !== block.id) {
        onDropSlot && onDropSlot(block.id, null, data);
      }
    } catch {}
  };

  const handleDropInside = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOverInner(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      onDropInside && onDropInside(block.id, data);
    } catch {}
  };

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Drop slot above this block */}
      <div
        onDragOver={(e) => { e.preventDefault(); setOverSlot(true); }}
        onDragLeave={() => setOverSlot(false)}
        onDrop={handleDropOnSlot}
        style={{
          height: overSlot ? 20 : 4,
          background: overSlot ? "#3B82F6" : "transparent",
          borderRadius: 3,
          transition: "height 0.1s, background 0.1s",
          marginBottom: 1,
        }}
      />

      {/* Block body */}
      <div
        draggable
        onDragStart={handleDragStart}
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 6,
          overflow: "hidden",
          opacity: isDragging ? 0.4 : 1,
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          cursor: "grab",
          userSelect: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: color,
            color: "white",
            display: "flex",
            alignItems: "center",
            padding: "5px 8px",
            gap: 4,
          }}
        >
          <BlockIcon type={block.type} />
          <BlockContent
            block={block}
            color={darkColor}
            onUpdate={(params) => onUpdateParams(block.id, params)}
          />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(block.id); }}
            style={{
              marginLeft: "auto",
              background: "rgba(0,0,0,0.2)",
              border: "none",
              borderRadius: 4,
              color: "white",
              cursor: "pointer",
              padding: "1px 5px",
              fontSize: 11,
              lineHeight: "14px",
            }}
            title="Remove block"
          >
            ×
          </button>
        </div>

        {/* Repeat inner drop zone */}
        {block.type === "repeat" && (
          <div
            style={{
              background: darken(color, 0.85),
              padding: "6px 6px 6px 16px",
              borderTop: `2px solid ${darkColor}`,
            }}
          >
            {(block.children || []).length === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setOverInner(true); }}
                onDragLeave={() => setOverInner(false)}
                onDrop={handleDropInside}
                style={{
                  border: `2px dashed ${overInner ? "#fff" : "rgba(255,255,255,0.4)"}`,
                  borderRadius: 5,
                  padding: "8px 12px",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 11,
                  textAlign: "center",
                  background: overInner ? "rgba(255,255,255,0.15)" : "transparent",
                  transition: "all 0.1s",
                }}
              >
                Drop blocks here
              </div>
            ) : (
              <div>
                {block.children.map((child) => (
                  <Block
                    key={child.id}
                    block={child}
                    spriteId={spriteId}
                    depth={depth + 1}
                    onUpdateParams={onUpdateParams}
                    onRemove={onRemove}
                    onDragStart={onDragStart}
                    onDropSlot={onDropSlot}
                    onDropInside={onDropInside}
                    draggingBlockId={draggingBlockId}
                  />
                ))}
                {/* Empty slot at end of repeat children + drag-into-repeat zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setOverInner(true); }}
                  onDragLeave={() => setOverInner(false)}
                  onDrop={handleDropInside}
                  style={{
                    height: overInner ? 20 : 6,
                    border: `2px dashed ${overInner ? "#fff" : "transparent"}`,
                    borderRadius: 4,
                    background: overInner ? "rgba(255,255,255,0.15)" : "transparent",
                    transition: "all 0.1s",
                    marginTop: 4,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Block content with inline inputs ──────────────────────────────────────────
function BlockContent({ block, color, onUpdate }) {
  const inputStyle = {
    background: "rgba(255,255,255,0.25)",
    border: "1px solid rgba(255,255,255,0.5)",
    borderRadius: 4,
    color: "white",
    fontSize: 12,
    padding: "1px 4px",
    width: 44,
    outline: "none",
    textAlign: "center",
  };

  const textInputStyle = {
    ...inputStyle,
    width: 80,
    textAlign: "left",
  };

  switch (block.type) {
    case "move":
      return (
        <span style={{ fontSize: 12, color: "white", display: "flex", alignItems: "center", gap: 4 }}>
          Move
          <input
            type="number"
            value={block.params.steps}
            onChange={(e) => onUpdate({ steps: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={inputStyle}
          />
          steps
        </span>
      );

    case "turn":
      return (
        <span style={{ fontSize: 12, color: "white", display: "flex", alignItems: "center", gap: 4 }}>
          Turn
          <select
            value={block.params.dir || "right"}
            onChange={(e) => onUpdate({ dir: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={{ ...inputStyle, width: 58, background: "rgba(0,0,0,0.2)", cursor: "pointer" }}
          >
            <option value="right">right</option>
            <option value="left">left</option>
          </select>
          <input
            type="number"
            value={block.params.degrees}
            onChange={(e) => onUpdate({ degrees: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={inputStyle}
          />
          deg
        </span>
      );

    case "goto":
      return (
        <span style={{ fontSize: 12, color: "white", display: "flex", alignItems: "center", gap: 4 }}>
          Go to x:
          <input
            type="number"
            value={block.params.x}
            onChange={(e) => onUpdate({ x: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={inputStyle}
          />
          y:
          <input
            type="number"
            value={block.params.y}
            onChange={(e) => onUpdate({ y: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={inputStyle}
          />
        </span>
      );

    case "say":
    case "think":
      return (
        <span style={{ fontSize: 12, color: "white", display: "flex", alignItems: "center", gap: 4 }}>
          {block.type === "say" ? "Say" : "Think"}
          <input
            type="text"
            value={block.params.message}
            onChange={(e) => onUpdate({ message: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={textInputStyle}
          />
          for
          <input
            type="number"
            value={block.params.seconds}
            onChange={(e) => onUpdate({ seconds: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={{ ...inputStyle, width: 36 }}
          />
          secs
        </span>
      );

    case "repeat":
      return (
        <span style={{ fontSize: 12, color: "white", display: "flex", alignItems: "center", gap: 4 }}>
          Repeat
          <input
            type="number"
            value={block.params.times}
            onChange={(e) => onUpdate({ times: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={inputStyle}
          />
          times
        </span>
      );

    default:
      return <span style={{ fontSize: 12, color: "white" }}>{block.type}</span>;
  }
}

// ─── Small icon for each block type ────────────────────────────────────────────
function BlockIcon({ type }) {
  const icons = {
    move: "→",
    turn: "↻",
    goto: "✦",
    say: "💬",
    think: "💭",
    repeat: "↺",
  };
  return (
    <span style={{ fontSize: 14, lineHeight: 1 }}>{icons[type] || "•"}</span>
  );
}

// ─── Colour helpers ────────────────────────────────────────────────────────────
function darken(hex, factor = 0.75) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * factor);
  const g = Math.round(((n >> 8) & 0xff) * factor);
  const b = Math.round((n & 0xff) * factor);
  return `rgb(${r},${g},${b})`;
}
