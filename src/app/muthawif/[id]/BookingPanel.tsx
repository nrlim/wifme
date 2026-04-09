"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calcTotalWithFee, calcServiceFee, type FeeConfig } from "@/lib/fee";
import VoucherPicker, { type PromoSelection } from "@/components/VoucherPicker";

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
}

const C = {
  emerald: "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  gold: "#C4973B",
  charcoal: "#2C2C2C",
  muted: "#8A8A8A",
  border: "#E0D8CC",
  ivory: "#FAF7F2",
  white: "#FFFFFF",
  error: "#C0392B",
  errorBg: "#FEF2F2",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function BookingPanel({
  muthawifId,
  muthawifName,
  basePrice,
  isLoggedIn,
  isJamaah,
  profileUrl,
  initialStartDate = "",
  initialDuration = 7,
  feeConfig = { feeType: "PERCENT", feeValue: 0 },
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [startDate, setStartDate] = useState(initialStartDate);
  const [duration, setDuration] = useState(initialDuration);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [voucher, setVoucher] = useState<PromoSelection | null>(null);

  // ── Derived prices ────────────────────────────────────────────────────────
  const baseFee      = basePrice * duration;
  const serviceFee   = calcServiceFee(basePrice, duration, feeConfig);
  const subtotal     = calcTotalWithFee(basePrice, duration, feeConfig); // baseFee + serviceFee

  // Recalculate discount against current subtotal whenever duration changes
  const discountAmt  = (() => {
    if (!voucher) return 0;
    const p = voucher.promo;
    if (subtotal < p.minBookingAmount) return 0;
    if (p.type === "FIXED_AMOUNT") return Math.min(p.value, subtotal);
    return Math.round(subtotal * (p.value / 100));
  })();

  const totalAfterDiscount = Math.max(0, subtotal - discountAmt);

  // ── Book handler ──────────────────────────────────────────────────────────
  const handleBook = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=${encodeURIComponent(profileUrl)}`);
      return;
    }
    if (!isJamaah) return;
    if (!startDate) {
      setError("Pilih tanggal mulai terlebih dahulu.");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ muthawifId, startDate, duration, notes }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Gagal membuat pesanan.");
          return;
        }
        const bookingId = data.booking?.id;
        if (bookingId) {
          const url = voucher
            ? `/booking/${bookingId}?promo=${encodeURIComponent(voucher.code)}`
            : `/booking/${bookingId}`;
          router.push(url);
        } else {
          router.push("/dashboard?tab=beranda");
        }
      } catch {
        setError("Terjadi kesalahan jaringan. Coba lagi.");
      }
    });
  };

  // ── Handle voucher — recalculate discount when estimatedTotal changes ─────
  const handleVoucherSelect = (sel: PromoSelection | null) => {
    setVoucher(sel);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 0.875rem",
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    fontSize: "0.9rem",
    color: C.charcoal,
    background: C.ivory,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const hasServiceFee = serviceFee > 0;
  const hasFlatFee    = feeConfig.feeType === "FLAT" && serviceFee > 0;

  return (
    <div style={{
      background: C.white,
      borderRadius: 20,
      border: `1px solid ${C.border}`,
      boxShadow: "0 8px 32px rgba(27,107,74,0.08)",
      overflow: "hidden",
    }}>
      {/* Top accent strip */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${C.emerald}, ${C.gold}, ${C.emerald})` }} />

      <div style={{ padding: "1.375rem 1.375rem 1.25rem" }}>

        {/* ── Per-day price ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.625rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
            Tarif Harian
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
            <span style={{ fontSize: "1.625rem", fontWeight: 900, color: C.emerald, lineHeight: 1 }}>
              Rp {basePrice.toLocaleString("id-ID")}
            </span>
            <span style={{ fontSize: "0.8125rem", color: C.muted, fontWeight: 600 }}>/hari</span>
          </div>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>

          {/* Tanggal Mulai */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem" }}>
              Tanggal Mulai
            </label>
            <input
              type="date"
              style={inputStyle}
              min={todayStr()}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setError(""); }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.emerald; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = C.border;  }}
            />
          </div>

          {/* Durasi */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal }}>
                Durasi
              </label>
              <span style={{
                fontSize: "0.8125rem", fontWeight: 800, color: C.emerald,
                background: C.emeraldPale, padding: "0.1rem 0.625rem",
                borderRadius: 99, border: `1px solid ${C.emerald}22`,
              }}>
                {duration} hari
              </span>
            </div>
            <input
              type="range"
              min={1} max={30}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.emerald }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: C.muted, marginTop: "0.15rem" }}>
              <span>1 hari</span><span>30 hari</span>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem" }}>
              Catatan <span style={{ fontWeight: 400, color: C.muted }}>(opsional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Permintaan khusus, kebutuhan khusus, dll..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.emerald; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = C.border;  }}
            />
          </div>

          {/* Voucher trigger */}
          {isJamaah && (
            <div style={{ width: "100%" }}>
              <VoucherPicker
                estimatedTotal={subtotal}
                selected={voucher}
                onSelect={handleVoucherSelect}
              />
            </div>
          )}
        </div>

        {/* ── Price Breakdown ────────────────────────────────────────────── */}
        <div style={{
          marginTop: "1.125rem",
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            background: C.ivory,
            padding: "0.625rem 1rem",
            borderBottom: `1px solid ${C.border}`,
            fontSize: "0.625rem",
            fontWeight: 800,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            Rincian Estimasi Harga
          </div>

          <div style={{ padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>

            {/* Base fee calculation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", color: C.charcoal, fontWeight: 600 }}>
                Tarif ({duration} hari)
              </span>
              <span style={{ fontWeight: 700, fontSize: "0.875rem", color: C.charcoal }}>
                Rp {baseFee.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Service fee */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8125rem", color: C.charcoal, fontWeight: 600 }}>
                Biaya Layanan ({hasFlatFee ? "Flat" : `${feeConfig.feeValue}%`})
              </span>
              <span style={{ fontWeight: 700, fontSize: "0.875rem", color: hasServiceFee ? C.charcoal : C.emerald, fontStyle: hasServiceFee ? "normal" : "italic" }}>
                {hasServiceFee ? `Rp ${serviceFee.toLocaleString("id-ID")}` : "Gratis"}
              </span>
            </div>

            {/* Subtotal line — shown only when there's a discount */}
            {voucher && discountAmt > 0 && (
              <>
                <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: "0.125rem", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8125rem", color: C.muted, fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: C.muted }}>
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Discount row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <span style={{ fontSize: "0.8125rem", color: C.emerald, fontWeight: 700 }}>
                      🏷️ Voucher
                    </span>
                    <code style={{ fontSize: "0.6875rem", fontWeight: 800, color: C.emerald, background: C.emeraldPale, padding: "0.1rem 0.4rem", borderRadius: 6, border: `1px solid ${C.emerald}22` }}>
                      {voucher.code}
                    </code>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: "0.875rem", color: C.emerald }}>
                    −Rp {discountAmt.toLocaleString("id-ID")}
                  </span>
                </div>
              </>
            )}

            {/* ── Total line ── */}
            <div style={{
              margin: "0.5rem -1rem -0.875rem",
              padding: "0.875rem 1rem",
              background: voucher && discountAmt > 0 ? C.emeraldPale : C.ivory,
              borderTop: `1px solid ${voucher && discountAmt > 0 ? `${C.emerald}33` : C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: C.charcoal, whiteSpace: "nowrap" }}>
                  Estimasi Total
                </div>
                <div style={{ fontSize: "0.625rem", color: C.muted, fontStyle: "italic", marginTop: "0.2rem", whiteSpace: "nowrap" }}>
                  * Final saat pembayaran
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem" }}>
                {voucher && discountAmt > 0 && (
                  <span style={{
                    fontSize: "0.8125rem",
                    color: C.muted,
                    textDecoration: "line-through",
                    fontWeight: 600,
                    lineHeight: 1
                  }}>
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                )}
                <span style={{
                  fontSize: "1.375rem",
                  fontWeight: 900,
                  color: voucher && discountAmt > 0 ? C.emerald : C.charcoal,
                  lineHeight: 1
                }}>
                  Rp {totalAfterDiscount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            marginTop: "0.75rem",
            padding: "0.625rem 0.875rem",
            background: C.errorBg,
            border: `1px solid ${C.error}33`,
            borderRadius: 10,
            fontSize: "0.8125rem",
            color: C.error,
            display: "flex",
            gap: "0.375rem",
            alignItems: "flex-start",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── CTA Button ───────────────────────────────────────────────── */}
        {!isLoggedIn ? (
          <button
            onClick={handleBook}
            style={{
              marginTop: "1rem", width: "100%", padding: "1rem",
              borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
              color: C.white, fontWeight: 800, fontSize: "1rem",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: "0 4px 18px rgba(27,107,74,0.3)", transition: "all 0.2s",
            }}
          >
            🔐 Masuk untuk Memesan
          </button>
        ) : !isJamaah ? (
          <div style={{
            marginTop: "1rem", padding: "0.875rem", borderRadius: 12,
            background: C.ivory, border: `1px dashed ${C.border}`,
            textAlign: "center", fontSize: "0.8125rem", color: C.muted,
          }}>
            Hanya Jamaah yang dapat melakukan pemesanan.
          </div>
        ) : (
          <button
            onClick={handleBook}
            disabled={isPending}
            style={{
              marginTop: "1rem", width: "100%", padding: "1rem",
              borderRadius: 14, border: "none",
              background: isPending ? C.muted : `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
              color: C.white, fontWeight: 800, fontSize: "1rem",
              cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: isPending ? "none" : "0 4px 18px rgba(27,107,74,0.3)",
              transition: "all 0.2s",
            }}
          >
            {isPending ? (
              <>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                  animation: "bk-spin 0.8s linear infinite", flexShrink: 0,
                }} />
                Memproses...
              </>
            ) : (
              <>🕌 Pesan {muthawifName}</>
            )}
          </button>
        )}

        {/* Trust badges */}
        <div style={{
          marginTop: "0.875rem",
          display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap",
        }}>
          {["🔒 Pembayaran Aman", "✅ Terverifikasi", "💬 Respon Cepat"].map((b) => (
            <span key={b} style={{
              fontSize: "0.5625rem", fontWeight: 700, color: C.muted,
              background: C.ivory, padding: "0.2rem 0.5rem",
              borderRadius: 99, border: `1px solid ${C.border}`,
            }}>
              {b}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bk-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
