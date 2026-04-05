"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const ReviewModal = dynamic(() => import("@/components/ReviewModal"), { ssr: false });

interface ReviewButtonProps {
  bookingId: string;
  muthawifId: string;
  muthawifName: string;
  hasReview: boolean;
  /** Redirect destination setelah review/navigasi — disesuaikan dengan role user */
  dashboardHref: string;
}

export default function ReviewButton({ bookingId, muthawifId, muthawifName, hasReview, dashboardHref }: ReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(hasReview);

  if (submitted) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        border: "1px solid rgba(196,151,59,0.25)",
        borderRadius: 16,
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {/* Stars decoration */}
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map(v => (
              <svg key={v} width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.875rem", color: "#92400E" }}>Ulasan Sudah Dikirim!</div>
            <div style={{ fontSize: "0.75rem", color: "#A16207", fontWeight: 500 }}>
              Terima kasih telah membantu jamaah lain memilih muthawif terbaik.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Prominent review CTA card */}
      <div style={{
        background: "linear-gradient(135deg, #FFFBF2 0%, #FFF7EA 100%)",
        border: "1.5px dashed rgba(196,151,59,0.4)",
        borderRadius: 16,
        padding: "1.125rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}>
        {/* Icon column */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "rgba(196,151,59,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.75">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </div>

        {/* Text column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.875rem", color: "var(--charcoal)", marginBottom: "0.2rem" }}>
            Bagaimana ibadah Anda bersama {muthawifName}?
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Ulasan Anda membantu jamaah lain menemukan muthawif terpercaya. Hanya butuh 1 menit!
          </div>
        </div>

        {/* CTA */}
        <button
          id={`review-btn-${bookingId}`}
          onClick={() => setOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.625rem 1.125rem",
            background: "var(--gold)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: "0.8125rem", fontWeight: 800, fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(196,151,59,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 16px rgba(196,151,59,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "none";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(196,151,59,0.3)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
          Beri Ulasan
        </button>
      </div>

      {open && (
        <ReviewModal
          bookingId={bookingId}
          muthawifName={muthawifName}
          onClose={() => setOpen(false)}
          onSubmitted={() => {
            setOpen(false);
            setSubmitted(true);
          }}
        />
      )}
    </>
  );
}
