import React, { useEffect } from "react";
import { useApp } from "../context/AppContext";
import Icon from "./Icon";

export default function Toolbar({ onPlay, onStop, onReset }) {
  const { state, dispatch } = useApp();
  const { isPlaying, collisionNotification } = state;

  // Auto-dismiss collision notification after 3 s
  useEffect(() => {
    if (!collisionNotification) return;
    const tid = setTimeout(
      () => dispatch({ type: "CLEAR_NOTIFICATION" }),
      3000
    );
    return () => clearTimeout(tid);
  }, [collisionNotification, dispatch]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)",
        padding: "0 16px",
        height: 52,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        zIndex: 100,
        gap: 12,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 16 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: "#FFAB19",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: "bold",
            color: "#1E3A5F",
          }}
        >
          S
        </div>
        <span
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 18,
            fontFamily: "'Segoe UI', sans-serif",
            letterSpacing: 0.5,
          }}
        >
          Scratch
        </span>
      </div>

      {/* Play button */}
      <button
        onClick={isPlaying ? undefined : onPlay}
        disabled={isPlaying}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: isPlaying ? "rgba(74,222,128,0.3)" : "#22C55E",
          border: isPlaying ? "2px solid #4ADE80" : "2px solid #16A34A",
          borderRadius: 8,
          color: "white",
          padding: "6px 16px",
          cursor: isPlaying ? "default" : "pointer",
          fontWeight: 600,
          fontSize: 13,
          transition: "all 0.15s",
          opacity: isPlaying ? 0.7 : 1,
        }}
        title="Play all sprite programs"
      >
        <Icon name="play" size={12} className="text-white" />
        Play
      </button>

      {/* Stop button */}
      <button
        onClick={isPlaying ? onStop : undefined}
        disabled={!isPlaying}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: !isPlaying ? "rgba(239,68,68,0.3)" : "#EF4444",
          border: !isPlaying ? "2px solid rgba(239,68,68,0.4)" : "2px solid #DC2626",
          borderRadius: 8,
          color: "white",
          padding: "6px 16px",
          cursor: !isPlaying ? "default" : "pointer",
          fontWeight: 600,
          fontSize: 13,
          transition: "all 0.15s",
          opacity: !isPlaying ? 0.5 : 1,
        }}
        title="Stop all programs"
      >
        <Icon name="stop" size={12} className="text-white" />
        Stop
      </button>

      {/* Reset button */}
      <button
        onClick={onReset}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.15)",
          border: "2px solid rgba(255,255,255,0.3)",
          borderRadius: 8,
          color: "white",
          padding: "6px 14px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 13,
          transition: "all 0.15s",
        }}
        title="Reset sprites to starting positions"
      >
        <Icon name="sync" size={12} className="text-white" />
        Reset
      </button>

      {/* Collision notification */}
      {collisionNotification && (
        <div
          key={collisionNotification.id}
          style={{
            marginLeft: "auto",
            background: "#FBBF24",
            color: "#78350F",
            borderRadius: 8,
            padding: "6px 14px",
            fontWeight: 600,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            animation: "slideIn 0.3s ease-out",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <span style={{ fontSize: 16 }}>💥</span>
          {collisionNotification.message}
        </div>
      )}

      {/* Right-side hint */}
      {!collisionNotification && (
        <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
          Drag blocks from the palette into the workspace
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
