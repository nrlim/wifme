"use client";

import { useState, useEffect, useRef } from "react";

interface ReviewModalProps {
  bookingId: string;
  muthawifName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const STAR_LABELS: Record<number, { text: string; emoji: string; color: string; bg: string }> = {
  1: { text: "Sangat Buruk",  emoji: "😞", color: "#EF4444", bg: "#FEF2F2" },
  2: { text: "Kurang Baik",   emoji: "😕", color: "#F97316", bg: "#FFF7ED" },
  3: { text: "Cukup",         emoji: "😐", color: "#EAB308", bg: "#FEFCE8" },
  4: { text: "Bagus",         emoji: "😊", color: "#22C55E", bg: "#F0FDF4" },
  5: { text: "Luar Biasa!",   emoji: "🤩", color: "#1B6B4A", bg: "#ECFDF5" },
};

function StarPicker({ rating, onChange }: { rating: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || rating;
  const label = STAR_LABELS[active];

  return (
    <div style={{ textAlign: "center" }}>
      {/* Stars row */}
      <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center", marginBottom: "1rem" }}>
        {[1, 2, 3, 4, 5].map((v) => {
          const filled = v <= active;
          return (
            <button
              key={v}
              type="button"
              aria-label={`${v} bintang`}
              onClick={() => onChange(v)}
              onMouseEnter={() => setHovered(v)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: "none",
                border: "none",
                padding: "0.25rem",
                cursor: "pointer",
                transform: filled ? "scale(1.25)" : "scale(1)",
                transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                lineHeight: 1,
                display: "block",
              }}
            >
              <svg
                width="44" height="44"
                viewBox="0 0 24 24"
                fill={filled ? "#F1C40F" : "none"}
                stroke={filled ? "#E2B007" : "#D1D5DB"}
                strokeWidth="1.5"
                style={{
                  filter: filled ? "drop-shadow(0 3px 6px rgba(241,196,15,0.45))" : "none",
                  display: "block",
                }}
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Sentiment label */}
      <div style={{
        height: 40,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {label ? (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.4rem 1.125rem",
            borderRadius: 99,
            background: label.bg,
            border: `1.5px solid ${label.color}22`,
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>{label.emoji}</span>
            <span style={{ fontSize: "0.9375rem", fontWeight: 800, color: label.color }}>
              {label.text}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            Ketuk bintang untuk memberi nilai
          </span>
        )}
      </div>
    </div>
  );
}

export default function ReviewModal({ bookingId, muthawifName, onClose, onSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Pilih rating bintang terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      if (res.ok) {
        onSubmitted();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal mengirim ulasan.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(5, 15, 10, 0.65)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          zIndex: 9000,
          display: "flex",
          alignItems: "center",       /* center on desktop */
          justifyContent: "center",
          padding: "1rem",
        }}
        className="rm-backdrop"
      >
        {/* ── Modal panel ── */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          style={{
            background: "white",
            borderRadius: 28,
            boxShadow: "0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)",
            width: "100%",
            maxWidth: 500,
            maxHeight: "90dvh",
            overflowY: "auto",
            animation: "rmIn 0.3s cubic-bezier(0.34,1.1,0.64,1) both",
            position: "relative",
          }}
          className="rm-panel"
        >
          {/* Top accent bar */}
          <div style={{
            height: 5,
            background: "linear-gradient(90deg, var(--emerald) 0%, var(--gold) 100%)",
            borderRadius: "28px 28px 0 0",
          }} />

          {/* ── Header ── */}
          <div style={{ padding: "1.5rem 1.75rem 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <h2
                  id="review-modal-title"
                  style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--charcoal)", marginBottom: "0.3rem", lineHeight: 1.2 }}
                >
                  Beri Ulasan
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                  Bagaimana layanan{" "}
                  <strong style={{ color: "var(--charcoal)", fontWeight: 800 }}>{muthawifName}</strong>{" "}
                  mendampingi ibadah Anda?
                </p>
              </div>
              <button
                id="review-modal-close"
                onClick={onClose}
                aria-label="Tutup modal"
                style={{
                  flexShrink: 0,
                  background: "var(--ivory-dark)",
                  border: "1px solid var(--border)",
                  borderRadius: "50%",
                  width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ivory-dark)")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "1.25rem 0 0" }} />
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ padding: "1.5rem 1.75rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

            {/* Step 1: Rating */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "var(--emerald)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 900, flexShrink: 0,
                }}>1</div>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--charcoal)" }}>
                  Rating Keseluruhan <span style={{ color: "var(--error)" }}>*</span>
                </span>
              </div>
              {/* Star picker card */}
              <div style={{
                background: "var(--ivory)",
                border: "1px solid var(--border)",
                borderRadius: 18,
                padding: "1.5rem 1rem",
              }}>
                <StarPicker rating={rating} onChange={setRating} />
              </div>
            </div>

            {/* Step 2: Comment */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: rating > 0 ? "var(--emerald)" : "var(--border)",
                  color: rating > 0 ? "white" : "var(--text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 900, flexShrink: 0,
                  transition: "background 0.2s, color 0.2s",
                }}>2</div>
                <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--charcoal)" }}>
                  Ceritakan Pengalaman Anda{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.8125rem" }}>(opsional)</span>
                </span>
              </div>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={
                  rating === 0
                    ? "Isi rating bintang dulu, lalu ceritakan pengalaman Anda..."
                    : rating >= 4
                    ? "Apa yang membuat pengalaman ibadah Anda begitu berkesan?"
                    : "Apa yang bisa ditingkatkan oleh muthawif ini ke depannya?"
                }
                disabled={rating === 0}
                style={{
                  width: "100%",
                  padding: "0.9375rem 1.125rem",
                  border: "1.5px solid var(--border)",
                  borderRadius: 14,
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  color: "var(--charcoal)",
                  background: rating === 0 ? "var(--ivory)" : "white",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.7,
                  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--emerald)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(27,107,74,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  Ulasan ditampilkan publik di profil muthawif
                </span>
                <span style={{
                  fontSize: "0.6875rem", fontWeight: 700,
                  color: comment.length > 800 ? "var(--gold)" : "var(--text-muted)",
                }}>
                  {comment.length}/1000
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                background: "#FEF2F2", color: "#B91C1C",
                border: "1px solid #FECACA",
                padding: "0.875rem 1rem", borderRadius: 12,
                fontSize: "0.875rem", fontWeight: 600,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "0.9375rem",
                  borderRadius: 14,
                  background: "var(--ivory-dark)",
                  border: "1.5px solid var(--border)",
                  fontFamily: "inherit",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ivory-dark)")}
              >
                Batal
              </button>
              <button
                id="review-submit-btn"
                type="submit"
                disabled={loading || rating === 0}
                style={{
                  flex: 2,
                  padding: "0.9375rem",
                  borderRadius: 14,
                  background: rating === 0
                    ? "#E5E7EB"
                    : loading
                    ? "var(--emerald)"
                    : "var(--emerald)",
                  color: rating === 0 ? "var(--text-muted)" : "white",
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: "0.9375rem",
                  fontWeight: 800,
                  cursor: (loading || rating === 0) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "background 0.2s, box-shadow 0.2s, transform 0.15s",
                  boxShadow: rating > 0 ? "0 4px 18px rgba(27,107,74,0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (rating > 0 && !loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 22px rgba(27,107,74,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = rating > 0 ? "0 4px 18px rgba(27,107,74,0.3)" : "none";
                }}
              >
                {loading ? (
                  <span className="spinner" style={{ width: 20, height: 20, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white", borderWidth: 2.5 }} />
                ) : (
                  <>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Kirim Ulasan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes rmIn {
          from { opacity: 0; transform: scale(0.94) translateY(16px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }

        /* Mobile: bottom-sheet style */
        @media (max-width: 600px) {
          .rm-backdrop {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .rm-panel {
            border-radius: 24px 24px 0 0 !important;
            max-height: 94dvh !important;
            animation: rmSheet 0.3s cubic-bezier(0.34,1.1,0.64,1) both !important;
          }
          .rm-panel > div:first-child {
            border-radius: 24px 24px 0 0 !important;
          }
        }

        @keyframes rmSheet {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
