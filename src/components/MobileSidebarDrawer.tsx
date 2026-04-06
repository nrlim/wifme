"use client";

import { useState, useEffect, useCallback } from "react";

interface Props {
  /** Sub-label under Wif–Me brand in compact mobile top bar */
  brandLabel?: string;
  /** The full sidebar content (nav, stats, etc.) */
  children: React.ReactNode;
}

/**
 * Desktop (≥769px): renders children normally inside the sidebar flow.
 * Mobile  (≤768px): collapses sidebar to a 52px sticky top bar + hamburger.
 *   Tap hamburger → sidebar slides in as a fixed left drawer with backdrop.
 */
export default function MobileSidebarDrawer({ brandLabel = "DASHBOARD", children }: Props) {
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* ── Compact mobile top bar (hidden on desktop via CSS) ── */}
      <div className="mob-topbar" style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        width: "100%",
        height: 52,
        background: "linear-gradient(135deg, #0d2818 0%, #1B6B4A 100%)",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 900, fontSize: "0.9375rem", letterSpacing: "-0.02em", lineHeight: 1 }}>
              Wif<span style={{ color: "#E4B55A" }}>–Me</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.4375rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
              {brandLabel}
            </div>
          </div>
        </div>

        <button
          aria-label="Buka menu navigasi"
          onClick={() => setOpen(true)}
          style={{
            width: 36, height: 36, borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Backdrop (mobile only, when open) ── */}
      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(13,40,24,0.6)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* ── Sidebar: normal on desktop, drawer on mobile (CSS in globals.css) ── */}
      <aside
        className={`dashboard-sidebar-fixed mob-sidebar${open ? " mob-open" : ""}`}
        style={{
          background: "linear-gradient(170deg, #0d2818 0%, #1B6B4A 70%, #27956A 100%)",
          borderRight: "none",
        }}
      >
        {/* Close X button — shown on mobile via .mob-close-btn in globals.css */}
        <button
          className="mob-close-btn"
          aria-label="Tutup menu"
          onClick={close}
          style={{
            position: "absolute", top: "0.75rem", right: "0.75rem",
            width: 32, height: 32,
            borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 10,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {children}
      </aside>
    </>
  );
}
