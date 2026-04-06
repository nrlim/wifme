"use client";

/**
 * ChatWidget.tsx — Slide-in Chat Drawer
 *
 * Self-contained client component: button + drawer in one.
 * Renders a floating panel that slides in from the right side of the screen,
 * keeping users in the context of the dashboard without navigating away.
 *
 * Usage (in server components, just pass serializable props):
 *   <ChatWidget
 *     bookingId="..."
 *     currentUser={{ id, name, photoUrl, role }}
 *     otherUser={{ id, name, photoUrl, role }}
 *     buttonLabel="💬 Chat"
 *   />
 */

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

// Lazy-load ChatRoom to avoid loading Firebase SDK unless user opens the panel
const ChatRoom = dynamic(() => import("@/components/ChatRoom"), { ssr: false });

interface Participant {
  id: string;
  name: string;
  photoUrl?: string | null;
  role: "JAMAAH" | "MUTHAWIF";
}

interface ChatWidgetProps {
  bookingId: string;
  currentUser: Participant;
  otherUser: Participant;
  /** Label on the trigger button. Defaults to "💬 Chat" */
  buttonLabel?: string;
  /** Visual style of the trigger button */
  variant?: "primary" | "compact" | "icon";
  /** Booking status — passed to ChatRoom to activate read-only mode for COMPLETED */
  bookingStatus?: string;
}

export default function ChatWidget({
  bookingId,
  currentUser,
  otherUser,
  buttonLabel = "💬 Chat",
  variant = "primary",
  bookingStatus,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Avoid React hydration mismatch for portal-style overlay
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mounted]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0); // Reset badge saat drawer dibuka
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  /* ── Button Styles by variant ─────────────────────────────────── */
  const buttonStyle: React.CSSProperties =
    variant === "compact"
      ? {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.3rem",
          padding: "0.375rem 0.875rem",
          background: "linear-gradient(135deg, #1B6B4A, #27956A)",
          color: "#fff",
          borderRadius: 8,
          fontSize: "0.75rem",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "opacity 0.15s, transform 0.15s",
          fontFamily: "inherit",
        }
      : variant === "icon"
      ? {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1B6B4A, #27956A)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          transition: "opacity 0.15s, transform 0.15s",
          fontFamily: "inherit",
          flexShrink: 0,
        }
      : {
          // primary (default)
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.875rem",
          borderRadius: 14,
          background: "linear-gradient(135deg, #1B6B4A, #27956A)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.9375rem",
          border: "none",
          cursor: "pointer",
          width: "100%",
          marginTop: "1rem",
          fontFamily: "inherit",
          transition: "opacity 0.15s, transform 0.15s",
          position: "relative",
        };

  if (!mounted) {
    // SSR placeholder — same layout as button but inert
    return (
      <div style={{ position: "relative", display: "inline-flex" }}>
        <button style={buttonStyle} disabled aria-label={buttonLabel}>
          {variant !== "icon" && buttonLabel}
          {variant === "icon" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ─── Trigger Button (with badge) ────────────────────────────── */}
      <button
        id={`chat-open-btn-${bookingId}`}
        onClick={open}
        style={{ ...buttonStyle, position: "relative" }}
        aria-label={`Buka chat dengan ${otherUser.name}`}
      >
        {variant === "icon" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ) : (
          buttonLabel
        )}

        {/* Badge unread count (di dalam button) */}
        {unreadCount > 0 && (
          <div
            aria-label={`${unreadCount} pesan belum dibaca`}
            style={{
              position: "absolute",
              top: variant === "primary" ? "-8px" : "-8px",
              right: variant === "primary" ? "0px" : "-8px",
              minWidth: unreadCount > 9 ? 22 : 20,
              height: 20,
              borderRadius: 99,
              background: "#EF4444",
              color: "white",
              fontSize: "0.6875rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 5px",
              boxShadow: "0 2px 6px rgba(239,68,68,0.5)",
              border: "2px solid white",
              animation: "badgePop 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 1,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {/* ─── Drawer Overlay ──────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chat dengan ${otherUser.name}`}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9000,
          pointerEvents: isOpen ? "all" : "none",
        }}
      >
        {/* Backdrop */}
        <div
          onClick={close}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(2px)",
            opacity: isOpen ? 1 : 0,
            transition: "opacity 0.28s ease",
          }}
        />

        {/* Drawer Panel */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(480px, 100vw)",
            background: "#fff",
            boxShadow: "-8px 0 48px rgba(0,0,0,0.18)",
            transform: isOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: "20px 0 0 20px",
          }}
        >
          {/*
            ChatRoom always mounted so Firebase connection persists immediately.
            The drawer transform strictly hides it off-screen when closed.
          */}
          <div style={{ display: "contents" }}>
            <ChatRoom
              bookingId={bookingId}
              currentUser={currentUser}
              otherUser={otherUser}
              bookingStatus={bookingStatus}
              onClose={close}
              onUnreadCountChange={setUnreadCount}
              isDrawerOpen={isOpen}
            />
          </div>
        </div>
      </div>

      {/* ─── Animations ────────────────────────────────────── */}
      <style>{`
        #chat-open-btn-${bookingId}:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        #chat-open-btn-${bookingId}:active {
          transform: scale(0.97);
        }
        @keyframes badgePop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
