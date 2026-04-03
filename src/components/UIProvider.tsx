"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

/* ─── Types ─────────────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}

interface UIContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

/* ─── Context ────────────────────────────────────────────────────────── */
const UIContext = createContext<UIContextValue | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within <UIProvider>");
  return ctx;
}

/* ─── Toast icons ────────────────────────────────────────────────────── */
const TOAST_ICON: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const TOAST_COLORS: Record<ToastType, { bg: string; icon: string; bar: string }> = {
  success: { bg: "#F0FDF4", icon: "#16A34A", bar: "#16A34A" },
  error:   { bg: "#FFF1F2", icon: "#E11D48", bar: "#E11D48" },
  warning: { bg: "#FFFBEB", icon: "#D97706", bar: "#D97706" },
  info:    { bg: "#EFF6FF", icon: "#2563EB", bar: "#2563EB" },
};

/* ─── Individual Toast ───────────────────────────────────────────────── */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const colors = TOAST_COLORS[toast.type];
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const t = setTimeout(dismiss, 4500);
    return () => clearTimeout(t);
  }, [dismiss]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        background: colors.bg,
        border: "1px solid rgba(0,0,0,0.07)",
        borderLeft: `4px solid ${colors.bar}`,
        borderRadius: "12px",
        padding: "0.875rem 1rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        minWidth: 280,
        maxWidth: 360,
        opacity: exiting ? 0 : 1,
        transform: exiting ? "translateX(120%)" : "translateX(0)",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: "all",
      }}
    >
      <div style={{ color: colors.icon, flexShrink: 0, marginTop: "1px" }}>
        {TOAST_ICON[toast.type]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#111827" }}>{toast.title}</div>
        {toast.message && (
          <div style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "0.25rem", lineHeight: 1.5 }}>{toast.message}</div>
        )}
      </div>
      <button
        onClick={dismiss}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "0", flexShrink: 0, display: "flex", alignItems: "center", marginTop: "1px" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────── */
interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: (result: boolean) => void }) {
  const isDestructive = state.variant === "danger";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={() => onClose(false)}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", animation: "fadeIn 0.2s ease" }} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          padding: "2rem",
          maxWidth: 420,
          width: "100%",
          animation: "scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Icon */}
        <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", background: isDestructive ? "#FFF1F2" : "var(--emerald-pale)" }}>
          {isDestructive ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: "0.625rem" }}>
          {state.title}
        </h3>
        <p style={{ fontSize: "0.9375rem", color: "#6B7280", textAlign: "center", lineHeight: 1.65, marginBottom: "1.75rem" }}>
          {state.message}
        </p>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => onClose(false)}
            style={{ flex: 1, padding: "0.75rem", borderRadius: "10px", border: "1px solid #E5E7EB", background: "white", fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", color: "#374151", transition: "all 0.15s", fontFamily: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}
          >
            {state.cancelLabel || "Batal"}
          </button>
          <button
            onClick={() => onClose(true)}
            style={{ flex: 1, padding: "0.75rem", borderRadius: "10px", border: "none", background: isDestructive ? "#E11D48" : "var(--emerald)", color: "white", fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            {state.confirmLabel || "Konfirmasi"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </div>
  );
}

/* ─── Provider ───────────────────────────────────────────────────────── */
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <UIContext.Provider value={{ toast: addToast, confirm: showConfirm }}>
      {children}

      {/* Toast container - top right */}
      <div
        style={{ position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 9998, display: "flex", flexDirection: "column", gap: "0.625rem", pointerEvents: "none" }}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState && <ConfirmDialog state={confirmState} onClose={handleConfirmClose} />}
    </UIContext.Provider>
  );
}
