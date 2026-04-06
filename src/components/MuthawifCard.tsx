"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FeeConfig } from "@/lib/fee";
import { calcTotalWithFee } from "@/lib/fee";

interface MuthawifProfile {
  id: string;
  rating: number;
  totalReviews: number;
  basePrice: number;
  operatingAreas: string[];
  experience: number;
  bio: string | null;
  languages: string[];
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
  };
}

interface MuthawifCardProps {
  muthawif: MuthawifProfile;
  startDate?: string;
  duration?: string;
  isLoggedIn: boolean;
  /** Href dashboard untuk post-booking navigation — sesuai role user */
  dashboardHref?: string;
  /** Lokasi dari parameter pencarian (MAKKAH/MADINAH/BOTH/ALL) */
  searchLocation?: string;
  /** Fee configuration from globalSetting — used to compute total including service fee */
  feeConfig?: FeeConfig;
}


function StarRating({ rating, count }: { rating: number; count: number }) {
  const filled = Math.round(rating);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
      <div style={{ display: "flex", gap: 1 }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <svg key={v} width="11" height="11" viewBox="0 0 24 24"
            fill={v <= filled ? "#F1C40F" : "none"}
            stroke={v <= filled ? "#F1C40F" : "#D1D5DB"}
            strokeWidth="1.5">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        ))}
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--charcoal)" }}>
        {rating > 0 ? rating.toFixed(1) : "—"}
      </span>
      {count > 0 && (
        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>
          ({count})
        </span>
      )}
    </div>
  );
}

export default function MuthawifCard({
  muthawif, startDate, duration, isLoggedIn,
  dashboardHref = "/dashboard",
  searchLocation = "ALL",
  feeConfig,
}: MuthawifCardProps) {
  const router = useRouter();
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  const handleBook = async () => {
    if (!isLoggedIn) {
      // Belum login: simpan URL profil muthawif sebagai tujuan redirect setelah registrasi
      const muthawifUrl = `/muthawif/${muthawif.user.id}${startDate ? `?startDate=${startDate}&duration=${duration}&location=${searchLocation}` : ''}`;
      router.push(`/auth/register?redirect=${encodeURIComponent(muthawifUrl)}`);
      return;
    }
    if (!startDate || !duration) {
      setError("Silakan lengkapi tanggal dan durasi terlebih dahulu.");
      return;
    }

    setBooking(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muthawifId: muthawif.user.id, startDate, duration, notes: "" }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect ke halaman konfirmasi pesanan dengan tombol bayar
        router.push(`/booking/${data.booking.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal melakukan pemesanan.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setBooking(false);
    }
  };

  const durationNum = parseInt(duration || "1");
  const fee: FeeConfig = feeConfig ?? { feeType: "PERCENT", feeValue: 0 };
  const totalFee = duration
    ? calcTotalWithFee(muthawif.basePrice, durationNum, fee)
    : muthawif.basePrice;
  const initials = muthawif.user.name
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      id={`muthawif-card-${muthawif.id}`}
      style={{
        background: "white",
        borderRadius: 20,
        border: "1px solid var(--border)",
        boxShadow: "0 2px 8px rgba(44,44,44,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(27,107,74,0.12), 0 2px 8px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "none";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(44,44,44,0.06)";
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: "1.125rem 1.25rem",
        background: "linear-gradient(135deg, #F8FBF9 0%, #EEF7F2 100%)",
        borderBottom: "1px solid rgba(224,216,204,0.5)",
        display: "flex",
        gap: "0.875rem",
        alignItems: "center",
      }}>
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "1.0625rem", fontWeight: 800,
          border: "2px solid white",
          boxShadow: "0 2px 8px rgba(27,107,74,0.25)",
          overflow: "hidden",
          position: "relative",
        }}>
          {muthawif.user.photoUrl
            ? <img src={muthawif.user.photoUrl} alt={muthawif.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
          {/* Online dot */}
          <div style={{
            position: "absolute", bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: "50%",
            background: "#2ECC71", border: "1.5px solid white",
          }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--charcoal)", marginBottom: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {muthawif.user.name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.2rem",
              fontSize: "0.6875rem", fontWeight: 700,
              color: "var(--emerald)", background: "var(--emerald-pale)",
              padding: "0.175rem 0.5rem", borderRadius: 99,
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              {muthawif.operatingAreas.slice(0, 2).join(", ")}
              {muthawif.operatingAreas.length > 2 && "..."}
            </span>
            {muthawif.experience > 0 && (
              <span style={{
                fontSize: "0.6875rem", fontWeight: 700,
                color: "var(--brown)", background: "var(--ivory-dark)",
                padding: "0.175rem 0.5rem", borderRadius: 99,
              }}>
                {muthawif.experience} th
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        <Link href={`/muthawif/${muthawif.user.id}${startDate ? `?startDate=${startDate}&duration=${duration}&location=${searchLocation}` : ""}`} style={{ textDecoration: "none", flexShrink: 0, textAlign: "right" }}>
          {muthawif.rating > 0 ? (
            <StarRating rating={muthawif.rating} count={muthawif.totalReviews} />
          ) : (
            <span style={{
              fontSize: "0.625rem", fontWeight: 800, color: "var(--emerald)",
              background: "var(--emerald-pale)", padding: "0.2rem 0.5rem",
              borderRadius: 99, letterSpacing: "0.05em",
            }}>
              BARU ✨
            </span>
          )}
        </Link>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "1rem 1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {/* Bio */}
        {muthawif.bio && (
          <p style={{
            fontSize: "0.8125rem",
            color: "var(--text-body)",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
          }}>
            {muthawif.bio}
          </p>
        )}

        {/* Languages */}
        {muthawif.languages.length > 0 && (
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {muthawif.languages.slice(0, 4).map((lang) => (
              <span key={lang} style={{
                fontSize: "0.625rem", fontWeight: 700,
                background: "var(--ivory)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                padding: "0.175rem 0.5rem", borderRadius: 6,
                letterSpacing: "0.02em",
              }}>
                {lang}
              </span>
            ))}
            {muthawif.languages.length > 4 && (
              <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", padding: "0.175rem 0.25rem" }}>
                +{muthawif.languages.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Price Row */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingTop: "0.75rem",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
        }}>
          <div>
            <div style={{ fontSize: "0.5625rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>
              {duration ? `Paket ${duration} hari` : "Per hari"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--emerald)" }}>Rp</span>
              <span style={{ fontSize: "1.1875rem", fontWeight: 900, color: "var(--emerald)", letterSpacing: "-0.02em" }}>
                {(duration ? totalFee : muthawif.basePrice).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
          <Link
            href={`/muthawif/${muthawif.user.id}${startDate ? `?startDate=${startDate}&duration=${duration}&location=${searchLocation}` : ""}`}
            style={{
              display: "flex", alignItems: "center", gap: "0.25rem",
              fontSize: "0.75rem", fontWeight: 700,
              color: "var(--emerald)",
              textDecoration: "none",
              opacity: 0.85,
            }}
          >
            Profil
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: "0 1.25rem 1.25rem" }}>
        {error && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "0.375rem",
            background: "#FEF2F2", color: "var(--error)",
            border: "1px solid #FECACA",
            padding: "0.625rem 0.75rem", borderRadius: 10,
            fontSize: "0.75rem", fontWeight: 600,
            marginBottom: "0.75rem", lineHeight: 1.4,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {booked ? (
          <div style={{ background: "var(--emerald-pale)", border: "1px solid rgba(27,107,74,0.2)", borderRadius: 12, padding: "0.875rem", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontWeight: 800, fontSize: "0.875rem", color: "var(--emerald)" }}>Pesanan Berhasil Dikirim!</span>
            </div>
            <Link href={dashboardHref} style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--emerald)", textDecoration: "underline" }}>Cek Status di Dashboard →</Link>
          </div>
        ) : (
          /* CTA button — for both logged in and guest users */
          <button
            onClick={handleBook}
            disabled={booking}
            id={`book-btn-${muthawif.id}`}
            style={{
              width: "100%",
              padding: "0.8125rem",
              borderRadius: 12,
              background: booking
                ? "var(--emerald-light)"
                : isLoggedIn
                ? "var(--emerald)"
                : "linear-gradient(135deg, #C4973B, #E4B55A)",
              color: "white",
              border: "none",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              fontWeight: 800,
              cursor: booking ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: isLoggedIn
                ? "0 4px 16px rgba(27,107,74,0.2)"
                : "0 4px 16px rgba(196,151,59,0.25)",
              transition: "background 0.2s, transform 0.15s",
            }}
          >
            {booking ? (
              <span className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(255,255,255,0.35)", borderTopColor: "white" }} />
            ) : isLoggedIn ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                Pesan Sekarang
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Daftar &amp; Pesan
              </>
            )}
          </button>
        )}

      </div>
    </div>
  );
}
