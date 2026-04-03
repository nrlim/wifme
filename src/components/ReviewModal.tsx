"use client";

import { useState, useEffect, useRef } from "react";

interface ReviewModalProps {
  bookingId: string;
  muthawifName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const STAR_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
  1: { text: "Sangat Buruk",  emoji: "😞", color: "#EF4444" },
  2: { text: "Kurang Baik",   emoji: "😕", color: "#F97316" },
  3: { text: "Cukup",         emoji: "😐", color: "#EAB308" },
  4: { text: "Bagus",         emoji: "😊", color: "#22C55E" },
  5: { text: "Luar Biasa!",   emoji: "🤩", color: "#1B6B4A" },
};

function StarPicker({
  rating, onChange,
}: { rating: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  const active = hovered || rating;
  const label = STAR_LABELS[active];

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "0.625rem" }}>
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
                transform: filled ? "scale(1.2)" : "scale(1)",
                transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                lineHeight: 1,
              }}
            >
              <svg
                width="40" height="40"
                viewBox="0 0 24 24"
                fill={filled ? "#F1C40F" : "none"}
                stroke={filled ? "#F1C40F" : "#D1D5DB"}
                strokeWidth="1.5"
                style={{
                  filter: filled ? "drop-shadow(0 2px 4px rgba(241,196,15,0.5))" : "none",
                  display: "block",
                }}
              >
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Label */}
      <div style={{
        textAlign: "center",
        height: 28,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
      }}>
        {label ? (
          <>
            <span style={{ fontSize: "1.125rem" }}>{label.emoji}</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 800, color: label.color, transition: "color 0.2s" }}>
              {label.text}
            </span>
          </>
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
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(10, 20, 15, 0.6)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 9000,
          display: "flex",
          alignItems: "flex-end",   /* bottom sheet on mobile */
          justifyContent: "center",
          padding: 0,
        }}
      >
        {/* Modal panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          style={{
            background: "white",
            borderRadius: "28px 28px 0 0",   /* bottom sheet style */
            boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
            width: "100%",
            maxWidth: 520,
            maxHeight: "92dvh",
            overflowY: "auto",
            animation: "sheetUp 0.3s cubic-bezier(0.34,1.1,0.64,1) both",
            position: "relative",
          }}
        >
          {/* Handle bar */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "0.75rem", paddingBottom: "0.25rem" }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border)" }} />
          </div>

          {/* Header */}
          <div style={{ padding: "1rem 1.5rem 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
              <div>
                <h2
                  id="review-modal-title"
                  style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--charcoal)", marginBottom: "0.25rem" }}
                >
                  Beri Ulasan Muthawif
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Bagaimana layanan{" "}
                  <strong style={{ color: "var(--charcoal)", fontWeight: 700 }}>{muthawifName}</strong>{" "}
                  selama mendampingi ibadah Anda?
                </p>
              </div>
              <button
                id="review-modal-close"
                onClick={onClose}
                aria-label="Tutup"
                style={{
                  flexShrink: 0,
                  background: "var(--ivory-dark)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--border)", margin: "1rem 0" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "0 1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Step 1: Stars */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                marginBottom: "1rem",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "var(--emerald)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6875rem", fontWeight: 900, flexShrink: 0,
                }}>1</div>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)" }}>
                  Rating Keseluruhan <span style={{ color: "var(--error)" }}>*</span>
                </span>
              </div>
              <StarPicker rating={rating} onChange={setRating} />
            </div>

            {/* Step 2: Comment */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                marginBottom: "0.875rem",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: rating > 0 ? "var(--emerald)" : "var(--border)",
                  color: rating > 0 ? "white" : "var(--text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6875rem", fontWeight: 900, flexShrink: 0,
                  transition: "background 0.2s, color 0.2s",
                }}>2</div>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)" }}>
                  Kritik & Saran{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>(opsional)</span>
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
                    ? "Ceritakan apa yang membuat pengalaman Anda luar biasa..."
                    : "Ceritakan apa yang bisa ditingkatkan oleh muthawif ini..."
                }
                disabled={rating === 0}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  border: "1.5px solid var(--border)",
                  borderRadius: 14,
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  color: "var(--charcoal)",
                  background: rating === 0 ? "var(--ivory)" : "white",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.65,
                  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--emerald)";
                  e.target.style.boxShadow = "0 0 0 3px var(--emerald-glow)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.375rem" }}>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  Ulasan Anda akan ditampilkan secara publik di profil muthawif
                </span>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  {comment.length}/1000
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "#FEF2F2", color: "var(--error)",
                border: "1px solid #FECACA",
                padding: "0.75rem 0.875rem", borderRadius: 10,
                fontSize: "0.8125rem", fontWeight: 600,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
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
                  padding: "0.875rem",
                  borderRadius: 12,
                  background: "var(--ivory-dark)",
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                id="review-submit-btn"
                type="submit"
                disabled={loading || rating === 0}
                style={{
                  flex: 2,
                  padding: "0.875rem",
                  borderRadius: 12,
                  background: rating === 0 ? "#E5E7EB" : "var(--emerald)",
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
                  transition: "background 0.2s",
                  boxShadow: rating > 0 ? "0 4px 16px rgba(27,107,74,0.2)" : "none",
                }}
              >
                {loading ? (
                  <span
                    className="spinner"
                    style={{ width: 18, height: 18, borderColor: "rgba(255,255,255,0.35)", borderTopColor: "white" }}
                  />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
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
        @keyframes sheetUp {
          from { opacity: 0; transform: translateY(60px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
