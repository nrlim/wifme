"use client";

import { useState } from "react";
import Link from "next/link";

const TRUST_ITEMS = [
  { icon: "✅", text: "Terverifikasi pemerintah" },
  { icon: "🔒", text: "Pembayaran aman & terlindungi" },
  { icon: "⭐", text: "Rating rata-rata 4.9★" },
  { icon: "📞", text: "Support 24/7" },
];

const STEPS = [
  { num: "1", icon: "🔍", title: "Cari & Pilih", desc: "Temukan Muthawif sesuai jadwal, lokasi & budget Anda" },
  { num: "2", icon: "📝", title: "Daftar Gratis", desc: "Buat akun dalam 30 detik, tanpa biaya pendaftaran" },
  { num: "3", icon: "✈️", title: "Berangkat!", desc: "Nikmati ibadah Umrah bersama Muthawif pilihan Anda" },
];

export default function GuestSearchBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      {/* ── Sticky Top CTA Bar ── */}
      <div
        id="guest-topbar"
        style={{
          background: "linear-gradient(135deg, #0d2818 0%, #1B6B4A 60%, #27956A 100%)",
          padding: "0.625rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 10,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Left: message */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(196,151,59,0.25)",
            border: "1px solid rgba(196,151,59,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: "0.875rem",
          }}>
            🌙
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "rgba(228,181,90,0.95)", fontSize: "0.6875rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Anda belum login
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8125rem", fontWeight: 500 }}>
              Daftar gratis untuk langsung memesan Muthawif pilihan Anda
            </div>
          </div>
        </div>

        {/* Right: buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <Link
            href="/auth/login"
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              textDecoration: "none",
              padding: "0.375rem 0.75rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              whiteSpace: "nowrap",
              transition: "background 0.2s",
            }}
          >
            Masuk
          </Link>
          <Link
            href="/auth/register"
            style={{
              background: "linear-gradient(135deg, #C4973B, #E4B55A)",
              color: "white",
              fontSize: "0.8125rem",
              fontWeight: 800,
              textDecoration: "none",
              padding: "0.375rem 1rem",
              borderRadius: 8,
              boxShadow: "0 2px 12px rgba(196,151,59,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            ✨ Daftar Gratis
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Tutup banner"
            style={{
              width: 24, height: 24,
              borderRadius: 6,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem",
              padding: 0,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Value Proposition Section ── */}
      <div
        style={{
          background: "linear-gradient(160deg, #faf9f7 0%, #f0f7f4 50%, #faf9f7 100%)",
          borderBottom: "1px solid var(--border)",
          padding: "1.5rem 1rem",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative blobs */}
        <div aria-hidden="true" style={{
          position: "absolute", top: -40, right: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(27,107,74,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", bottom: -20, left: -20,
          width: 140, height: 140, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,151,59,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>

          {/* Steps row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}>
            {STEPS.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  background: "white",
                  borderRadius: 16,
                  border: "1px solid rgba(27,107,74,0.1)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                className="guest-step-card"
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: "linear-gradient(135deg, var(--emerald-pale), rgba(27,107,74,0.12))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.125rem",
                  border: "1px solid rgba(27,107,74,0.12)",
                }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
                    <span style={{
                      fontSize: "0.5625rem", fontWeight: 800, color: "var(--emerald)",
                      background: "var(--emerald-pale)", padding: "0.1rem 0.375rem",
                      borderRadius: 99, letterSpacing: "0.06em",
                    }}>LANGKAH {step.num}</span>
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.2rem" }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust pills */}
          <div style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                background: "white",
                border: "1px solid var(--border)",
                padding: "0.3125rem 0.625rem",
                borderRadius: 99,
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <span>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .guest-step-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(27,107,74,0.12) !important;
        }
        .guest-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(27,107,74,0.4) !important;
        }
      `}</style>
    </>
  );
}
