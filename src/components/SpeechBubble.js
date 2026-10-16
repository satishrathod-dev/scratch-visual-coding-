import React from "react";

/**
 * Renders a speech or thought bubble positioned above a sprite.
 * type: 'say'  → standard rounded rectangle with a triangular tail
 * type: 'think' → elliptical cloud with dotted trail
 */
export default function SpeechBubble({ type, text }) {
  if (type === "think") {
    return (
      <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 6, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Bubble */}
        <div
          style={{
            background: "white",
            border: "2px solid #ccc",
            borderRadius: 20,
            padding: "6px 10px",
            maxWidth: 140,
            textAlign: "center",
            fontSize: 12,
            fontFamily: "sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>
        {/* Thought dots */}
        <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white", border: "2px solid #ccc" }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "white", border: "2px solid #ccc", alignSelf: "flex-end" }} />
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "white", border: "2px solid #ccc", alignSelf: "flex-end" }} />
        </div>
      </div>
    );
  }

  // 'say' bubble
  return (
    <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 4, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          background: "white",
          border: "2px solid #ccc",
          borderRadius: 10,
          padding: "6px 10px",
          maxWidth: 140,
          textAlign: "center",
          fontSize: 12,
          fontFamily: "sans-serif",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </div>
      {/* Triangle tail */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "8px solid #ccc",
          marginTop: -1,
        }}
      />
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "7px solid white",
          marginTop: -9,
        }}
      />
    </div>
  );
}
