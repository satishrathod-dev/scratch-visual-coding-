import React, { useState } from "react";
import { useApp, makeBlock } from "../context/AppContext";
import Block from "./Block";

/**
 * Workspace — central panel.
 * Shows the block program for the currently selected sprite.
 * Supports DnD from the palette, reordering, nested repeat, and trash deletion.
 */
export default function MidArea() {
  const { state, dispatch } = useApp();
  const { sprites, selectedSpriteId } = state;

  const selectedSprite = sprites.find((s) => s.id === selectedSpriteId);
  const program = selectedSprite ? selectedSprite.program : [];

  const [draggingBlockId, setDraggingBlockId] = useState(null);
  const [overTrash, setOverTrash] = useState(false);
  const [overWorkspace, setOverWorkspace] = useState(false);

  // ── Dispatch helpers ────────────────────────────────────────────────────────
  const addBlock = (block, afterId = null, insideId = null) => {
    dispatch({
      type: "ADD_BLOCK",
      spriteId: selectedSpriteId,
      block,
      afterId,
      insideId,
    });
  };

  const removeBlock = (blockId) => {
    dispatch({ type: "REMOVE_BLOCK", spriteId: selectedSpriteId, blockId });
  };

  const moveBlock = (blockId, afterId, insideId = null) => {
    dispatch({
      type: "MOVE_BLOCK",
      spriteId: selectedSpriteId,
      blockId,
      afterId,
      insideId,
    });
  };

  const updateParams = (blockId, params) => {
    dispatch({
      type: "UPDATE_BLOCK_PARAMS",
      spriteId: selectedSpriteId,
      blockId,
      params,
    });
  };

  // ── DnD handlers ────────────────────────────────────────────────────────────
  const handleDrop = (e, afterId, insideId) => {
    e.preventDefault();
    e.stopPropagation();
    setOverWorkspace(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.source === "palette") {
        const block = makeBlock(data.type);
        addBlock(block, afterId, insideId);
      } else if (data.source === "workspace") {
        if (data.blockId !== afterId) {
          moveBlock(data.blockId, afterId, insideId);
        }
      }
    } catch {}
    setDraggingBlockId(null);
  };

  const handleTrashDrop = (e) => {
    e.preventDefault();
    setOverTrash(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.source === "workspace" && data.blockId) {
        removeBlock(data.blockId);
      }
    } catch {}
    setDraggingBlockId(null);
  };

  const handleWorkspaceDrop = (e) => {
    // Drop on workspace background = append to end
    handleDrop(e, null, null);
  };

  // Recursive prop callbacks passed to Block
  const onDropSlot = (afterId, insideId, data) => {
    if (data.source === "palette") {
      const block = makeBlock(data.type);
      addBlock(block, afterId, insideId);
    } else if (data.source === "workspace") {
      if (data.blockId !== afterId) {
        moveBlock(data.blockId, afterId, insideId);
      }
    }
    setDraggingBlockId(null);
  };

  const onDropInside = (insideId, data) => {
    if (data.source === "palette") {
      const block = makeBlock(data.type);
      addBlock(block, null, insideId);
    } else if (data.source === "workspace") {
      moveBlock(data.blockId, null, insideId);
    }
    setDraggingBlockId(null);
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#F1F5F9",
        minWidth: 0,
      }}
    >
      {/* Workspace header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          background: "white",
          borderBottom: "1px solid #E2E8F0",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Sprite tabs */}
        {sprites.map((s) => (
          <button
            key={s.id}
            onClick={() => dispatch({ type: "SELECT_SPRITE", id: s.id })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 6,
              border: s.id === selectedSpriteId ? `2px solid ${s.color}` : "2px solid transparent",
              background: s.id === selectedSpriteId ? `${s.color}22` : "#F8FAFF",
              color: s.id === selectedSpriteId ? s.color : "#64748B",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: s.id === selectedSpriteId ? 700 : 500,
              transition: "all 0.1s",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: s.color,
                display: "inline-block",
              }}
            />
            {s.name}
          </button>
        ))}

        {/* Trash zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setOverTrash(true); }}
          onDragLeave={() => setOverTrash(false)}
          onDrop={handleTrashDrop}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 6,
            border: `2px dashed ${overTrash ? "#EF4444" : "#CBD5E1"}`,
            background: overTrash ? "#FEE2E2" : "transparent",
            color: overTrash ? "#EF4444" : "#94A3B8",
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          🗑 Drop to delete
        </div>
      </div>

      {/* Workspace body */}
      <div
        onDragOver={(e) => { e.preventDefault(); setOverWorkspace(true); }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOverWorkspace(false);
        }}
        onDrop={handleWorkspaceDrop}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          outline: overWorkspace ? "2px dashed #93C5FD" : "none",
          outlineOffset: -4,
          transition: "outline 0.1s",
        }}
      >
        {program.length === 0 ? (
          <EmptyWorkspace />
        ) : (
          <div>
            {program.map((block) => (
              <Block
                key={block.id}
                block={block}
                spriteId={selectedSpriteId}
                onUpdateParams={updateParams}
                onRemove={removeBlock}
                onDragStart={setDraggingBlockId}
                onDropSlot={onDropSlot}
                onDropInside={onDropInside}
                draggingBlockId={draggingBlockId}
              />
            ))}
            {/* Terminal drop slot */}
            <TerminalDropSlot
              onDrop={(e) => handleDrop(e, program[program.length - 1]?.id, null)}
            />
          </div>
        )}
      </div>

      {/* Block count */}
      <div
        style={{
          padding: "4px 12px",
          background: "white",
          borderTop: "1px solid #E2E8F0",
          fontSize: 10,
          color: "#94A3B8",
          flexShrink: 0,
        }}
      >
        {program.length} block{program.length !== 1 ? "s" : ""} for{" "}
        {selectedSprite ? selectedSprite.name : "—"}
      </div>
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: 220,
        color: "#94A3B8",
        textAlign: "center",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 48, opacity: 0.3 }}>🧩</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>No blocks yet</div>
      <div style={{ fontSize: 12 }}>
        Drag blocks from the palette on the left
        <br />
        to build this sprite&apos;s program
      </div>
    </div>
  );
}

function TerminalDropSlot({ onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { setOver(false); onDrop(e); }}
      style={{
        height: over ? 20 : 8,
        background: over ? "#3B82F6" : "transparent",
        borderRadius: 3,
        transition: "all 0.1s",
        marginTop: 2,
      }}
    />
  );
}
