import React, { useRef, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { usePlayback } from "./hooks/usePlayback";
import Toolbar from "./components/Toolbar";
import Sidebar from "./components/Sidebar";
import MidArea from "./components/MidArea";
import PreviewArea from "./components/PreviewArea";

// Inner component (needs access to context)
function ScratchEditor() {
  const { state, dispatch } = useApp();

  // Keep a ref to the latest state so the playback hook never reads stale state
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const { play, stop, reset } = usePlayback(stateRef, dispatch);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        background: "#EFF6FF",
      }}
    >
      {/* Top toolbar */}
      <Toolbar onPlay={play} onStop={stop} onReset={reset} />

      {/* Main editor area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>
        {/* Left: Block palette */}
        <Sidebar />

        {/* Center: Workspace */}
        <div
          style={{
            flex: 1,
            display: "flex",
            minWidth: 0,
            borderRight: "1px solid #E2E8F0",
          }}
        >
          <MidArea />
        </div>

        {/* Right: Stage + sprite manager */}
        <div
          style={{
            width: 520,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            background: "#F8FAFF",
          }}
        >
          <PreviewArea />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ScratchEditor />
    </AppProvider>
  );
}
