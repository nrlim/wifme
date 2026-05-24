"use client";

import { useRouter } from "next/navigation";
import { type FeeConfig } from "@/lib/fee";

interface Props {
  muthawifId: string;
  muthawifName: string;
  basePrice: number;
  isLoggedIn: boolean;
  isJamaah: boolean;
  profileUrl: string;
  initialStartDate?: string;
  initialDuration?: number;
  feeConfig?: FeeConfig;
  panelId: "mobile" | "desktop";
}

const C = {
  emerald: "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  charcoal: "#2C2C2C",
  muted: "#8A8A8A",
  border: "#E0D8CC",
  ivory: "#FAF7F2",
  white: "#FFFFFF",
};

export default function BookingPanel({
  muthawifId,
  muthawifName,
  basePrice,
  isLoggedIn,
  isJamaah,
  profileUrl,
  panelId,
}: Props) {
  const router = useRouter();

  const handleBook = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=${encodeURIComponent(profileUrl)}`);
      return;
    }
    if (!isJamaah) return;
    
    // Redirect to new activity-based booking wizard
    router.push(`/book/${muthawifId}`);
  };

  return (
    <div className="booking-panel" style={{
      background: C.white,
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      boxShadow: "0 8px 32px rgba(27,107,74,0.08)",
      overflow: "hidden",
    }}>
      {/* Top accent strip */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.emerald}, #C4973B, ${C.emerald})` }} />

      <div className="booking-panel-body" style={{ padding: "1.5rem" }}>
        {/* Pricing Info */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
            Biaya Pemandu Mulai Dari
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 900, color: C.emerald, lineHeight: 1, letterSpacing: "-0.02em" }}>
              Rp {basePrice.toLocaleString("id-ID")}
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "0.375rem" }}>
            Harga akhir bergantung pada kegiatan yang Anda pilih.
          </div>
        </div>

        {/* Info List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
          {[
            { icon: "📋", text: "Pilih kegiatan yang Anda inginkan" },
            { icon: "📅", text: "Atur jadwal secara fleksibel" },
            { icon: "💳", text: "Bayar total tagihan dengan mudah" }
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.8125rem", color: C.charcoal, fontWeight: 600 }}>
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {!isLoggedIn ? (
          <button
            onClick={handleBook}
            style={{
              width: "100%", padding: "1rem", borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
              color: C.white, fontWeight: 800, fontSize: "1rem",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: "0 4px 18px rgba(27,107,74,0.3)",
            }}
          >
            Masuk untuk Memesan
          </button>
        ) : !isJamaah ? (
          <div style={{
            padding: "0.875rem", borderRadius: 12, background: C.ivory, border: `1px dashed ${C.border}`,
            textAlign: "center", fontSize: "0.8125rem", color: C.muted,
          }}>
            Hanya Jamaah yang dapat melakukan pemesanan.
          </div>
        ) : (
          <button
            onClick={handleBook}
            style={{
              width: "100%", padding: "1rem", borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
              color: C.white, fontWeight: 800, fontSize: "1rem",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: "0 4px 18px rgba(27,107,74,0.3)",
            }}
          >
            Pilih Kegiatan & Jadwal
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        )}
      </div>

      <style>{`
        .booking-panel button {
          touch-action: manipulation;
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .booking-panel button:active {
          transform: scale(0.98);
        }
        @media (max-width: 639px) {
          .booking-panel {
            border-radius: 18px !important;
            box-shadow: 0 4px 20px rgba(27,107,74,0.08) !important;
          }
          .booking-panel-body {
            padding: 1.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}
