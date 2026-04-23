"use client";

import { useRef, useState } from "react";
import Draggable from "react-draggable";

export type VirtualKeyboardProps = {
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
};

const KEYBOARD_LAYOUT = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["{shift}", "z", "x", "c", "v", "b", "n", "m", "{bksp}"],
  ["{space}", "{enter}"],
];

const NUMERIC_LAYOUT = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  [".", "0", "{bksp}"],
  ["{enter}"],
];

export default function VirtualKeyboard({ value, onChange, numeric = false }: VirtualKeyboardProps) {
  const [isShiftKey, setIsShiftKey] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleKeyPress = (button: string) => {
    if (button === "{shift}") {
      setIsShiftKey(!isShiftKey);
      return;
    }
    if (button === "{bksp}") {
      onChange(value.slice(0, -1));
      return;
    }
    if (button === "{space}") {
      onChange(value + " ");
      return;
    }
    if (button === "{enter}") {
      onChange(value + "\n");
      return;
    }

    const charToAdd = isShiftKey ? button.toUpperCase() : button;
    onChange(value + charToAdd);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 text-slate-800 shadow-lg backdrop-blur-md border border-slate-200/60 z-[9999] pointer-events-auto hover:bg-white transition-colors"
        title="Open Keyboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
          <path d="M6 8h.001" /><path d="M10 8h.001" /><path d="M14 8h.001" /><path d="M18 8h.001" />
          <path d="M8 12h.001" /><path d="M12 12h.001" /><path d="M16 12h.001" />
          <path d="M7 16h10" />
        </svg>
      </button>
    );
  }

  const layout = numeric ? NUMERIC_LAYOUT : KEYBOARD_LAYOUT;

  const renderKey = (key: string) => {
    let display = key;
    let wClass = numeric ? "flex-1" : "w-5";
    let bgClass = "bg-slate-50 hover:bg-slate-200 active:bg-slate-300 text-slate-700";

    if (key === "{shift}") {
      display = "⇧";
      wClass = "w-7";
      bgClass = isShiftKey
        ? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"
        : "bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700";
    } else if (key === "{bksp}") {
      display = "⌫";
      wClass = numeric ? "flex-1" : "w-7";
      bgClass = "bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700";
    } else if (key === "{space}") {
      display = "⎵";
      wClass = "flex-1";
    } else if (key === "{enter}") {
      display = "↵ Done";
      wClass = numeric ? "flex-1" : "w-7";
      bgClass = "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white";
    } else {
      display = isShiftKey && !numeric ? key.toUpperCase() : key;
    }

    return (
      <button
        key={key}
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleKeyPress(key);
        }}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className={`h-6 flex items-center justify-center rounded font-bold text-[10px] shadow-sm outline-none transition-colors border border-slate-300/60 ${wClass} ${bgClass}`}
      >
        {display}
      </button>
    );
  };

  return (
    <Draggable handle=".drag-handle" bounds="parent" nodeRef={nodeRef}>
      <div
        ref={nodeRef}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className={`absolute bottom-2 right-2 rounded-lg bg-white/95 p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.15)] backdrop-blur-xl border border-slate-200 flex flex-col gap-0.5 z-[9999] pointer-events-auto select-none ${numeric ? "w-[110px]" : "max-w-[220px]"}`}
      >
        {/* Display current value */}
        {/* {numeric && (
          <div style={{ background: "#f0f6ff", border: "1px solid #bfdbfe", borderRadius: 4, padding: "2px 6px", marginBottom: 2, textAlign: "right", fontSize: 12, fontWeight: 700, color: "#1e40af", minHeight: 20, letterSpacing: "0.05em" }}>
            {value || "0"}
          </div>
        )}
        <div className="flex justify-between items-center px-0.5 mb-0.5 drag-handle cursor-move group">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5 group-hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
            {numeric ? "123" : "KB"}
          </span>
          <button
            onPointerDown={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="text-slate-400 hover:text-slate-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div> */}
        {layout.map((row, i) => (
          <div key={i} className="flex justify-center gap-0.5 w-full">
            {row.map(renderKey)}
          </div>
        ))}
      </div>
    </Draggable>
  );
}
