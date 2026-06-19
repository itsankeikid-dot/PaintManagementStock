"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * KioskGuard — keeps the app focused and prevents accidental closure
 * in factory / kiosk / industrial environments.
 *
 * Features:
 *  1. Blocks beforeunload (tab close / refresh / navigation)
 *  2. Intercepts dangerous keyboard shortcuts (Ctrl+W, Alt+F4, etc.)
 *  3. Disables right-click context menu (optional)
 *  4. Auto-refocuses the window when it loses focus
 *  5. Shows an unlock panel for maintenance (hidden triple-click)
 */

interface KioskGuardProps {
  /** Disable right-click context menu — default true */
  disableContextMenu?: boolean;
  /** Refocus window on blur — default true */
  autoRefocus?: boolean;
  /** Block dangerous shortcuts — default true */
  blockShortcuts?: boolean;
}

// Dangerous key combos that close / navigate away from the tab
const BLOCKED_COMBOS: Array<{ key: string; ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean }> = [
  { key: "w", ctrl: true },           // Ctrl+W  — close tab
  { key: "W", ctrl: true },
  { key: "F4", alt: true },           // Alt+F4  — close window
  { key: "q", ctrl: true },           // Ctrl+Q  — quit browser (Firefox)
  { key: "Q", ctrl: true },
  { key: "q", ctrl: true, shift: true },
  { key: "t", ctrl: true },           // Ctrl+T  — new tab (distraction)
  { key: "T", ctrl: true },
  { key: "n", ctrl: true },           // Ctrl+N  — new window
  { key: "N", ctrl: true },
  { key: "Tab", alt: true },          // Alt+Tab — switch app (cannot fully block, but mitigate)
  { key: "F5", ctrl: true },          // Ctrl+F5 — hard refresh
  { key: "r", ctrl: true },           // Ctrl+R  — refresh
  { key: "R", ctrl: true },
];

// In development mode, disable all kiosk protections for easier debugging
const isDev = process.env.NODE_ENV === "development";

function comboMatches(
  e: KeyboardEvent,
  combo: (typeof BLOCKED_COMBOS)[number]
): boolean {
  return (
    e.key.toLowerCase() === combo.key.toLowerCase() &&
    !!combo.ctrl === e.ctrlKey &&
    !!combo.alt === e.altKey &&
    !!combo.shift === e.shiftKey
  );
}

export default function KioskGuard({
  disableContextMenu = true,
  autoRefocus = true,
  blockShortcuts = true,
}: KioskGuardProps) {
  const refocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Beforeunload ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (unlocked || isDev) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = "Are you sure you want to leave? Unsaved changes may be lost.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler, { capture: true });
    return () => window.removeEventListener("beforeunload", handler, { capture: true });
  }, [unlocked]);

  // ─── Keyboard shortcut blocker ─────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (unlocked || isDev) return;
      if (!blockShortcuts) return;

      const matched = BLOCKED_COMBOS.some((combo) => comboMatches(e, combo));
      if (matched) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },
    [blockShortcuts, unlocked]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [handleKeyDown]);

  // ─── Context menu blocker ──────────────────────────────────────────────────
  useEffect(() => {
    if (unlocked || isDev || !disableContextMenu) return;
    const handler = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handler, { capture: true });
    return () => document.removeEventListener("contextmenu", handler, { capture: true });
  }, [disableContextMenu, unlocked]);

  // ─── Auto-refocus on blur ──────────────────────────────────────────────────
  useEffect(() => {
    if (unlocked || isDev || !autoRefocus) return;

    const handleBlur = () => {
      // Small delay to let legitimate OS-level focus changes settle
      refocusTimerRef.current = setTimeout(() => {
        window.focus();
      }, 200);
    };

    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
      if (refocusTimerRef.current) clearTimeout(refocusTimerRef.current);
    };
  }, [autoRefocus, unlocked]);

  // ─── Hidden unlock gesture (triple-click bottom-right corner) ─────────────
  // Allows maintenance access without editing code.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Only count clicks in the bottom-right 60×60 px
      const isCorner =
        e.clientX > window.innerWidth - 60 &&
        e.clientY > window.innerHeight - 60;

      if (!isCorner) {
        clickCountRef.current = 0;
        return;
      }

      clickCountRef.current += 1;

      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

      if (clickCountRef.current >= 5) {
        clickCountRef.current = 0;
        setUnlocked((prev) => !prev);
      } else {
        clickTimerRef.current = setTimeout(() => {
          clickCountRef.current = 0;
        }, 1500);
      }
    };

    document.addEventListener("click", handler);
    return () => {
      document.removeEventListener("click", handler);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  // ─── Unlock banner (shown when protections are disabled) ──────────────────
  if (unlocked) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: "#f59e0b",
          color: "#000",
          textAlign: "center",
          padding: "6px 16px",
          fontSize: "13px",
          fontFamily: "sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <span>⚠ KioskGuard is DISABLED — protections are off.</span>
        <button
          onClick={() => setUnlocked(false)}
          style={{
            background: "#000",
            color: "#f59e0b",
            border: "none",
            borderRadius: "4px",
            padding: "3px 12px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Re-enable
        </button>
      </div>
    );
  }

  return null;
}
