"use client";

/**
 * ChatRoom.tsx — Fully Responsive, Mobile-First Chat UI for Wif-Me
 *
 * Architecture:
 * ─ Auth: Firebase Custom Token (via /api/chat/token)
 * ─ Realtime: Firebase RTDB via ChatService abstraction layer
 * ─ Profiles: Resolved from Prisma data (props) — zero Firebase storage overhead
 * ─ Migration-ready: All RTDB calls isolated in ChatService; swap to Socket.io later
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInWithCustomToken,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import {
  subscribeToMessages,
  sendMessage,
  subscribeToSessionMetadata,
  type ChatMessage,
  type ChatSessionMetadata,
} from "@/lib/chat-service";

/* ── Types ───────────────────────────────────────────────────── */
interface Participant {
  id: string;
  name: string;
  photoUrl?: string | null;
  role: "JAMAAH" | "MUTHAWIF";
}

interface ChatRoomProps {
  bookingId: string;
  currentUser: Participant;
  otherUser: Participant;
  /** Booking status — COMPLETED means read-only history mode */
  bookingStatus?: string;
  /** Called when user closes the chat panel */
  onClose?: () => void;
  /** Called whenever unread message count changes — used by ChatWidget to show badge */
  onUnreadCountChange?: (count: number) => void;
  /** Whether the parent drawer is currently visible — prevents false unread resets */
  isDrawerOpen?: boolean;
}

/* ── Colour palette (Wifme design system) ───────────────────── */
const C = {
  emerald: "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  emeraldGlow: "rgba(27,107,74,0.12)",
  gold: "#C4973B",
  goldPale: "rgba(196,151,59,0.08)",
  charcoal: "#2C2C2C",
  muted: "#8A8A8A",
  border: "#E0D8CC",
  ivory: "#FAF7F2",
  ivoryDark: "#F0EBE1",
  white: "#FFFFFF",
  error: "#C0392B",
  errorPale: "#FEF2F2",
};

/* ── Skeleton loader for messages ───────────────────────────── */
function MessageSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "1rem",
      }}
    >
      {[false, true, false, true, true].map((isOwn, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: isOwn ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              width: `${120 + (i % 3) * 60}px`,
              height: "38px",
              borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: isOwn
                ? "linear-gradient(135deg, rgba(27,107,74,0.15), rgba(39,149,106,0.1))"
                : C.ivoryDark,
              animation: "skeletonPulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Avatar ─────────────────────────────────────────────────── */
function Avatar({ user, size = 36 }: { user: Participant; size?: number }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (user.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photoUrl}
        alt={user.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: `2px solid ${C.emeraldPale}`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
        color: C.white,
        fontSize: size * 0.36,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `2px solid ${C.emeraldPale}`,
        letterSpacing: "-0.5px",
      }}
    >
      {initials}
    </div>
  );
}

/* ── Status icon ─────────────────────────────────────────────── */
function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  if (status === "delivered") {
    // Double checkmark (delivered)
    return (
      <svg width="16" height="10" viewBox="0 0 16 10" fill={C.emeraldLight}>
        <path d="M1 5l3 3 5-6" stroke={C.emeraldLight} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 5l3 3 5-6" stroke={C.emeraldLight} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // Single checkmark (sent)
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M1 5l3 3 7-7" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Message Bubble ──────────────────────────────────────────── */
function MessageBubble({
  message,
  isOwn,
  senderName,
}: {
  message: ChatMessage;
  isOwn: boolean;
  senderName: string;
}) {
  const timeStr = new Date(message.timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        padding: "0.125rem 1rem",
        gap: "0.5rem",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          maxWidth: "min(75%, 460px)",
          display: "flex",
          flexDirection: "column",
          gap: "0.2rem",
        }}
      >
        {/* Sender name (only for received messages) */}
        {!isOwn && (
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: C.emerald,
              paddingLeft: "0.75rem",
              letterSpacing: "0.01em",
            }}
          >
            {senderName}
          </span>
        )}

        <div
          style={{
            padding: "0.6875rem 0.9375rem",
            borderRadius: isOwn
              ? "18px 18px 4px 18px"
              : "18px 18px 18px 4px",
            background: isOwn
              ? `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`
              : C.white,
            border: isOwn ? "none" : `1px solid ${C.border}`,
            boxShadow: isOwn
              ? "0 2px 12px rgba(27,107,74,0.25)"
              : "0 1px 4px rgba(44,44,44,0.06)",
            position: "relative",
            wordBreak: "break-word",
          }}
        >
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.55,
              color: isOwn ? C.white : C.charcoal,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {message.content}
          </p>

          {/* Time + status row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.25rem",
              marginTop: "0.3rem",
            }}
          >
            <span
              style={{
                fontSize: "0.625rem",
                color: isOwn ? "rgba(255,255,255,0.7)" : C.muted,
                letterSpacing: "0.02em",
              }}
            >
              {timeStr}
            </span>
            {isOwn && <StatusIcon status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Date separator ──────────────────────────────────────────── */
function DateSeparator({ date }: { date: Date }) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (date.toDateString() === today.toDateString()) {
    label = "Hari ini";
  } else if (date.toDateString() === yesterday.toDateString()) {
    label = "Kemarin";
  } else {
    label = date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 1rem",
        margin: "0.5rem 0",
      }}
    >
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: C.muted,
          background: C.ivory,
          padding: "0.25rem 0.75rem",
          borderRadius: 99,
          border: `1px solid ${C.border}`,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

/* ── Main ChatRoom Component ─────────────────────────────────── */
export default function ChatRoom({
  bookingId,
  currentUser,
  otherUser,
  bookingStatus = "CONFIRMED",
  onClose,
  onUnreadCountChange,
  isDrawerOpen = true,
}: ChatRoomProps) {
  // Session state
  const [sessionMeta, setSessionMeta] = useState<ChatSessionMetadata | null>(null);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Derived read-only flag
  const isCompleted = bookingStatus === "COMPLETED";
  const isChatClosed = isCompleted || sessionMeta?.status === "closed";

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<
    "idle" | "authenticating" | "ready" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);
  // Refs for detecting new incoming messages
  const prevMsgIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ── Notification sound via Web Audio API (no external files needed) ── */
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // First tone — rising ping
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1100, now + 0.07);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.start(now); osc1.stop(now + 0.35);
      // Second tone — softer follow
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.28);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.start(now + 0.08); osc2.stop(now + 0.55);
      setTimeout(() => ctx.close(), 900);
    } catch {
      // Silently ignore — AudioContext unavailable
    }
  }, []);

  /* Scroll to bottom on new messages */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length === 0 ? "instant" : "smooth");
  }, [messages, scrollToBottom]);

  /* ── Detect new incoming messages & trigger sound ────────────── */
  useEffect(() => {
    // Skip on initial load — just snapshot current message IDs silently
    if (loading || isInitialLoadRef.current) {
      if (!loading) {
        isInitialLoadRef.current = false;
        prevMsgIdsRef.current = new Set(messages.map(m => m.id));
      }
      return;
    }
    // Find genuinely new messages from the other user
    const newFromOther = messages.filter(
      m => m.senderId !== currentUser.id && !prevMsgIdsRef.current.has(m.id)
    );
    if (newFromOther.length > 0) {
      playNotificationSound();
      setUnreadCount(prev => prev + newFromOther.length);
    }
    prevMsgIdsRef.current = new Set(messages.map(m => m.id));
  }, [messages, loading, currentUser.id, playNotificationSound]);

  /* ── Notify parent (ChatWidget) of unread count changes ──────── */
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  /* ── Update document title with unread badge ─────────────────── */
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  /* Reset unread when window regains focus AND drawer is open */
  useEffect(() => {
    const onFocus = () => {
      if (isDrawerOpen) setUnreadCount(0);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isDrawerOpen]);

  /* ── Firebase Auth + RTDB Subscription ─────────────────────── */
  useEffect(() => {
    // Skip Firebase entirely for COMPLETED bookings — DB history is used instead
    if (isCompleted) return;

    let cancelled = false;
    setAuthState("authenticating");

    async function init() {
      try {
        // 1. Fetch Firebase Custom Token from our secure backend
        const res = await fetch("/api/chat/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Gagal memuat sesi chat");
        }

        const { token } = await res.json() as { token: string; uid: string };

        // 2. Sign in to Firebase with custom token
        const auth = getFirebaseAuth();
        await signInWithCustomToken(auth, token);

        if (cancelled) return;

        // 3. Watch auth state
        onAuthStateChanged(auth, (user) => {
          firebaseUserRef.current = user;
        });

        setAuthState("ready");

        // 4. Subscribe to messages via ChatService
        unsubscribeRef.current = subscribeToMessages(
          bookingId,
          (msgs) => {
            if (!cancelled) {
              setMessages(msgs);
              setLoading(false);
            }
          },
          () => {
            // RTDB connection error — show user message without leaking internals
            if (!cancelled) {
              setErrorMessage("Koneksi chat terputus. Coba refresh halaman.");
            }
          }
        );
      } catch (err) {
        if (!cancelled) {
          console.error("[ChatRoom] Init error:", err);
          setAuthState("error");
          setErrorMessage(
            err instanceof Error ? err.message : "Terjadi kesalahan pada chat"
          );
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, [bookingId]);

  /* ── Subscribe to session metadata (closed/open status) ─────── */
  useEffect(() => {
    if (authState !== "ready") return;

    const unsub = subscribeToSessionMetadata(bookingId, (meta) => {
      setSessionMeta(meta);
      // If session just closed: unsubscribe from messages, load history
      if (meta.status === "closed") {
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        // Load archived history from PostgreSQL
        fetch(`/api/chat/history/${bookingId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.messages) {
              setMessages(data.messages as ChatMessage[]);
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    });

    return () => unsub();
  }, [bookingId, authState]);

  /* ── If booking COMPLETED or already closed: load history from DB ─ */
  useEffect(() => {
    if (!isCompleted) return;
    // Skip Firebase init entirely — just load history
    setLoading(true);
    fetch(`/api/chat/history/${bookingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages as ChatMessage[]);
        setLoading(false);
        setAuthState("ready"); // mark as ready so UI renders
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, isCompleted]);

  /* ── Send Message ────────────────────────────────────────────── */
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isSending || authState !== "ready") return;

    setInputValue("");
    setIsSending(true);

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `optimistic_${Date.now()}`,
      senderId: currentUser.id,
      content,
      timestamp: Date.now(),
      status: "sent",
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage(bookingId, {
        senderId: currentUser.id,
        content,
      });
    } catch (err) {
      console.error("[ChatRoom] Send error:", err);
      // Remove optimistic message on failure
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMsg.id)
      );
      setErrorMessage("Gagal mengirim pesan. Coba lagi.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isSending, authState, bookingId, currentUser.id]);

  /* ── Keyboard shortcut: Enter to send, Shift+Enter for newline ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /* ── Close Chat Session (Muthawif only) ──────────────────────── */
  const handleCloseSession = useCallback(async () => {
    if (currentUser.role !== "MUTHAWIF") return;
    setIsClosingSession(true);
    setShowCloseConfirm(false);
    try {
      const res = await fetch("/api/chat/close-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menutup sesi");
      }
      // sessionMeta will update via Firebase subscribeToSessionMetadata
    } catch (err) {
      // Show user-friendly error without leaking internal details to console
      setErrorMessage(err instanceof Error ? err.message : "Gagal menutup sesi chat");
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setIsClosingSession(false);
    }
  }, [bookingId, currentUser.role]);

  /* ── Auto-resize textarea ─────────────────────────────────────── */
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      // Reset then set height to fit content
      e.target.style.height = "44px";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    },
    []
  );

  /* ── Group messages by date for separators ────────────────────── */
  type MessageOrSeparator =
    | { type: "message"; data: ChatMessage }
    | { type: "separator"; date: Date; key: string };

  const renderItems: MessageOrSeparator[] = [];
  let lastDateStr = "";

  for (const msg of messages) {
    const d = new Date(msg.timestamp);
    const dateStr = d.toDateString();
    if (dateStr !== lastDateStr) {
      renderItems.push({ type: "separator", date: d, key: `sep_${dateStr}` });
      lastDateStr = dateStr;
    }
    renderItems.push({ type: "message", data: msg });
  }

  /* ─────────────────────────────────────────────────────────────── */

  return (
    <>
      {/* Keyframe animations injected inline to avoid global CSS dependencies */}
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        .chat-bubble-appear {
          animation: fadeInUp 0.22s ease forwards;
        }
        .chat-input-focused:focus-within {
          border-color: var(--emerald, #1B6B4A) !important;
          box-shadow: 0 0 0 3px rgba(27,107,74,0.12) !important;
        }
        .send-btn:hover:not(:disabled) {
          transform: scale(1.06);
          box-shadow: 0 4px 16px rgba(27,107,74,0.35);
        }
        .send-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .send-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      {/*
        ── LAYOUT ───────────────────────────────────────────────────
        Mobile: full-screen, dvh units so keyboard doesn't cover input
        Desktop: constrained card at max-w ~896px
      */}
      <div
        id="chat-room-container"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",         // Dynamic Viewport Height — keyboard-safe
          maxHeight: "100dvh",
          width: "100%",
          maxWidth: "896px",
          margin: "0 auto",
          background: C.white,
          borderRadius: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ── HEADER ───────────────────────────────────────────── */}
        <div
          id="chat-header"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
            padding: "0.875rem 1.125rem",
            background: `linear-gradient(135deg, #0d2818 0%, ${C.emerald} 100%)`,
            borderBottom: `1px solid rgba(255,255,255,0.1)`,
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          {/* Back / Close button */}
          {onClose && (
            <button
              id="chat-close-btn"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.12)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.white,
                flexShrink: 0,
                transition: "background 0.2s",
              }}
              aria-label="Tutup chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <Avatar user={otherUser} size={40} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: "1rem",
                color: C.white,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {otherUser.name}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              {/* Online indicator */}
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background:
                    authState === "ready" ? "#4ADE80" : "rgba(255,255,255,0.3)",
                  display: "inline-block",
                }}
              />
              {otherUser.role === "MUTHAWIF" ? "Muthawif" : "Jamaah"}
              {authState === "authenticating" && " · Menghubungkan…"}
            </div>
          </div>

          {/* Session status badge + Close Session button (Muthawif only) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            {/* Status indicator */}
            {isChatClosed ? (
              <div style={{
                fontSize: "0.625rem",
                fontWeight: 800,
                color: "rgba(255,255,255,0.7)",
                background: "rgba(239,68,68,0.25)",
                border: "1px solid rgba(239,68,68,0.4)",
                padding: "0.2rem 0.6rem",
                borderRadius: 99,
                letterSpacing: "0.06em",
              }}>
                🔒 DITUTUP
              </div>
            ) : (
              <div style={{
                fontSize: "0.625rem",
                fontWeight: 800,
                color: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.08)",
                padding: "0.25rem 0.625rem",
                borderRadius: 99,
                letterSpacing: "0.06em",
              }}>
                #{bookingId.slice(0, 6).toUpperCase()}
              </div>
            )}

            {/* Tutup Sesi button — Muthawif only, active sessions only */}
            {currentUser.role === "MUTHAWIF" && !isChatClosed && authState === "ready" && (
              <button
                id="chat-close-session-btn"
                onClick={() => setShowCloseConfirm(true)}
                disabled={isClosingSession}
                title="Tutup sesi chat permanen"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.3rem 0.7rem",
                  background: "rgba(239,68,68,0.2)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 8,
                  color: "#FCA5A5",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  letterSpacing: "0.03em",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {isClosingSession ? "Menutup…" : "Tutup Sesi"}
              </button>
            )}
          </div>
        </div>

        {/* ── CLOSE SESSION CONFIRM DIALOG ─────────────────────── */}
        {showCloseConfirm && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "2rem",
                maxWidth: 380,
                width: "100%",
                textAlign: "center",
                boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔒</div>
              <div style={{ fontWeight: 800, fontSize: "1.125rem", color: C.charcoal, marginBottom: "0.5rem" }}>
                Tutup Sesi Chat?
              </div>
              <p style={{ fontSize: "0.875rem", color: C.muted, lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Semua pesan akan diarsipkan ke database. Jamaah tidak lagi bisa mengirim pesan setelah sesi ditutup.
                Riwayat chat tetap tersimpan dan dapat dilihat kapan saja.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: 12,
                    border: `1.5px solid ${C.border}`,
                    background: "transparent",
                    color: C.charcoal,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleCloseSession}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #DC2626, #EF4444)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Ya, Tutup Sesi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ERROR BANNER ─────────────────────────────────────── */}
        {errorMessage && (
          <div
            style={{
              padding: "0.625rem 1.125rem",
              background: C.errorPale,
              borderBottom: `1px solid #FECACA`,
              fontSize: "0.8125rem",
              color: C.error,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ── READ-ONLY BANNER: Chat ditutup muthawif ─────────────── */}
        {!isCompleted && sessionMeta?.status === "closed" && (
          <div
            style={{
              padding: "0.75rem 1.125rem",
              background: "#FEF3C7",
              borderBottom: "1px solid #FDE68A",
              fontSize: "0.8125rem",
              color: "#92400E",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            🔒 Sesi chat telah ditutup oleh Muthawif. Riwayat percakapan masih dapat dilihat.
          </div>
        )}

        {/* ── READ-ONLY BANNER: Booking selesai ───────────────────── */}
        {isCompleted && (
          <div
            style={{
              padding: "0.75rem 1.125rem",
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              borderBottom: "1px solid #86efac",
              fontSize: "0.8125rem",
              color: "#166534",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            ✅ Pesanan telah selesai. Chat hanya dapat dilihat sebagai riwayat — tidak bisa mengirim pesan baru.
          </div>
        )}

        {/* ── MESSAGES AREA ────────────────────────────────────── */}
        <div
          id="chat-messages-area"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            background: C.ivory,
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(27,107,74,0.03) 0%, transparent 50%), " +
              "radial-gradient(circle at 80% 20%, rgba(196,151,59,0.03) 0%, transparent 50%)",
            paddingTop: "0.5rem",
            paddingBottom: "0.75rem",
            // Prevent content jump on mobile when keyboard appears
            contain: "content",
          }}
        >
          {/* Empty state */}
          {!loading && messages.length === 0 && authState === "ready" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: "2rem",
                gap: "1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: C.emeraldPale,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                }}
              >
                💬
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "1.0625rem",
                    color: C.charcoal,
                    marginBottom: "0.375rem",
                  }}
                >
                  Mulai percakapan
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: C.muted,
                    lineHeight: 1.6,
                    maxWidth: 260,
                    margin: "0 auto",
                  }}
                >
                  Kirim pesan pertama Anda kepada{" "}
                  <strong style={{ color: C.emerald }}>
                    {otherUser.name}
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* Skeleton loading state */}
          {loading && <MessageSkeleton />}

          {/* Auth error state */}
          {authState === "error" && !loading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: "2rem",
                gap: "0.75rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.5rem" }}>🔐</div>
              <div style={{ fontWeight: 700, color: C.error }}>
                Tidak dapat terhubung
              </div>
              <p style={{ fontSize: "0.875rem", color: C.muted, maxWidth: 260 }}>
                {errorMessage || "Sesi chat tidak valid. Coba muat ulang halaman."}
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: 10,
                  border: "none",
                  background: C.emerald,
                  color: C.white,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                }}
              >
                Muat Ulang
              </button>
            </div>
          )}

          {/* Message list */}
          {!loading &&
            renderItems.map((item) => {
              if (item.type === "separator") {
                return <DateSeparator key={item.key} date={item.date} />;
              }
              const msg = item.data;
              const isOwn = msg.senderId === currentUser.id;
              const sender = isOwn ? currentUser : otherUser;
              return (
                <div key={msg.id} className="chat-bubble-appear">
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    senderName={sender.name}
                  />
                </div>
              );
            })}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} style={{ height: 1 }} />
        </div>

        {/* ── INPUT BAR — fixed at bottom ───────────────────────── */}
        {isChatClosed ? (
          /* Read-only footer */
          <div
            id="chat-readonly-bar"
            style={{
              flexShrink: 0,
              padding: "1rem 1.25rem",
              background: C.ivoryDark,
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              color: C.muted,
              fontSize: "0.8125rem",
              fontWeight: 600,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {isCompleted ? "Pesanan selesai — hanya riwayat" : "Sesi chat ditutup — hanya riwayat"}
          </div>
        ) : (
          <div
            id="chat-input-bar"
            style={{
              flexShrink: 0,
              padding: "0.75rem 1rem",
              background: C.white,
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "flex-end",
              gap: "0.625rem",
              position: "sticky",
              bottom: 0,
              zIndex: 20,
            }}
          >
            {/* Textarea */}
            <div
              className="chat-input-focused"
              style={{
                flex: 1,
                border: `1.5px solid ${C.border}`,
                borderRadius: 24,
                overflow: "hidden",
                background: C.ivory,
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
            >
              <textarea
                id="chat-message-input"
                ref={inputRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={
                  authState !== "ready"
                    ? "Menghubungkan ke chat…"
                    : `Pesan kepada ${otherUser.name}…`
                }
                disabled={authState !== "ready"}
                rows={1}
                style={{
                  width: "100%",
                  height: 44,
                  maxHeight: 120,
                  padding: "0.6875rem 1rem",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  fontSize: "0.9375rem",
                  color: C.charcoal,
                  background: "transparent",
                  lineHeight: 1.5,
                  display: "block",
                }}
              />
            </div>

            {/* Send button */}
            <button
              id="chat-send-btn"
              className="send-btn"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || authState !== "ready"}
              aria-label="Kirim pesan"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "none",
                background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
                color: C.white,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
              }}
            >
              {isSending ? (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: C.white,
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
