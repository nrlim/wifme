"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calcTotalWithFee, calcServiceFee, type FeeConfig } from "@/lib/fee";

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
  goldPale: "rgba(196,151,59,0.1)",
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

  const baseFee = basePrice * duration;
  const serviceFee = calcServiceFee(basePrice, duration, feeConfig);
  const totalFee = calcTotalWithFee(basePrice, duration, feeConfig);

  const handleBook = () => {
    if (!isLoggedIn) {
      // redirect to login, then back to this muthawif page
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(profileUrl)}`;
      router.push(loginUrl);
      return;
    }
    if (!isJamaah) return; // Muthawif / Amir can't book

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
        // Redirect ke dashboard riwayat pesanan (tombol bayar ada di sana)
        router.push("/dashboard?tab=beranda");
      } catch {
        setError("Terjadi kesalahan jaringan. Coba lagi.");
      }
    });
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

  const breakdownRows = [
    { label: "Tarif/hari", value: `Rp ${basePrice.toLocaleString("id-ID")}` },
    { label: "Durasi", value: `${duration} hari` },
    {
      label: "Biaya Layanan",
      value: serviceFee > 0
        ? `Rp ${serviceFee.toLocaleString("id-ID")}`
        : "Gratis",
      muted: serviceFee === 0,
    },
  ];

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        boxShadow: "0 8px 32px rgba(27,107,74,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Header strip */}
      <div
        style={{
          height: 5,
          background: `linear-gradient(90deg, ${C.emerald}, ${C.gold}, ${C.emerald})`,
        }}
      />

      <div style={{ padding: "1.5rem" }}>
        {/* Price */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.25rem",
            }}
          >
            Mulai dari
          </div>
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 900,
              color: C.emerald,
              lineHeight: 1,
            }}
          >
            Rp {basePrice.toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "0.2rem" }}>
            per hari
          </div>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Tanggal Mulai */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: C.charcoal,
                marginBottom: "0.3rem",
              }}
            >
              Tanggal Mulai
            </label>
            <input
              type="date"
              style={inputStyle}
              min={todayStr()}
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setError(""); }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.emerald; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>

          {/* Durasi */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: C.charcoal,
                marginBottom: "0.3rem",
              }}
            >
              Durasi (hari): <span style={{ color: C.emerald }}>{duration} hari</span>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.emerald }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.6875rem",
                color: C.muted,
                marginTop: "0.2rem",
              }}
            >
              <span>1 hari</span>
              <span>30 hari</span>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 700,
                color: C.charcoal,
                marginBottom: "0.3rem",
              }}
            >
              Catatan (opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Permintaan khusus, alergi, dll..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, resize: "vertical", minHeight: 64 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.emerald; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>
        </div>

        {/* Price breakdown */}
        <div
          style={{
            marginTop: "1.125rem",
            padding: "0.875rem",
            background: C.ivory,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
          }}
        >
          {breakdownRows.map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.8125rem",
                marginBottom: "0.375rem",
              }}
            >
              <span style={{ color: C.muted }}>{r.label}</span>
              <span style={{
                fontWeight: 700,
                color: r.muted ? C.muted : C.charcoal,
                fontStyle: r.muted ? "italic" : "normal",
              }}>{r.value}</span>
            </div>
          ))}
          <div
            style={{
              borderTop: `1px dashed ${C.border}`,
              marginTop: "0.5rem",
              paddingTop: "0.5rem",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontWeight: 800, color: C.charcoal }}>Estimasi Total</span>
            <span style={{ fontWeight: 900, color: C.emerald, fontSize: "1.0625rem" }}>
              Rp {totalFee.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.625rem 0.875rem",
              background: C.errorBg,
              border: `1px solid ${C.error}33`,
              borderRadius: 10,
              fontSize: "0.8125rem",
              color: C.error,
              display: "flex",
              gap: "0.375rem",
              alignItems: "center",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* CTA Button */}
        {!isLoggedIn ? (
          <button
            onClick={handleBook}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "1rem",
              borderRadius: 14,
              border: "none",
              background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
              color: C.white,
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 18px rgba(27,107,74,0.3)",
              transition: "all 0.2s",
            }}
          >
            🔐 Masuk untuk Memesan
          </button>
        ) : !isJamaah ? (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.875rem",
              borderRadius: 12,
              background: C.ivory,
              border: `1px dashed ${C.border}`,
              textAlign: "center",
              fontSize: "0.8125rem",
              color: C.muted,
            }}
          >
            Hanya Jamaah yang dapat melakukan pemesanan.
          </div>
        ) : (
          <button
            onClick={handleBook}
            disabled={isPending}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "1rem",
              borderRadius: 14,
              border: "none",
              background: isPending
                ? C.muted
                : `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
              color: C.white,
              fontWeight: 800,
              fontSize: "1rem",
              cursor: isPending ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: isPending ? "none" : "0 4px 18px rgba(27,107,74,0.3)",
              transition: "all 0.2s",
            }}
          >
            {isPending ? (
              <>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    animation: "bk-spin 0.8s linear infinite",
                    flexShrink: 0,
                  }}
                />
                Memproses...
              </>
            ) : (
              <>
                🕌 Pesan {muthawifName}
              </>
            )}
          </button>
        )}

        {/* Trust badges */}
        <div
          style={{
            marginTop: "0.875rem",
            display: "flex",
            gap: "0.5rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {["🔒 Pembayaran Aman", "✅ Terverifikasi", "💬 Respon Cepat"].map((b) => (
            <span
              key={b}
              style={{
                fontSize: "0.5875rem",
                fontWeight: 700,
                color: C.muted,
                background: C.ivory,
                padding: "0.2rem 0.5rem",
                borderRadius: 99,
                border: `1px solid ${C.border}`,
              }}
            >
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
