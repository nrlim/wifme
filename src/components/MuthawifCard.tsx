"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MuthawifProfile {
  id: string;
  rating: number;
  basePrice: number;
  location: string;
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
}

const LOCATION_LABELS: Record<string, string> = {
  MAKKAH: "Makkah",
  MADINAH: "Madinah",
  BOTH: "Makkah & Madinah",
};

export default function MuthawifCard({ muthawif, startDate, duration, isLoggedIn }: MuthawifCardProps) {
  const router = useRouter();
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  const handleBook = async () => {
    if (!isLoggedIn) {
      let searchPath = "/search";
      if (startDate && duration) {
        searchPath += `?startDate=${startDate}&duration=${duration}`;
      }
      router.push(`/auth/register?redirect=${encodeURIComponent(searchPath)}`);
      return;
    }

    if (!startDate || !duration) {
      setError("Silakan lengkapi pencarian tanggal dan durasi terlebih dahulu.");
      return;
    }

    setBooking(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muthawifId: muthawif.user.id,
          startDate,
          duration,
          notes: "",
        }),
      });

      if (res.ok) {
        setBooked(true);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal melakukan booking.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setBooking(false);
    }
  };

  const totalFee = muthawif.basePrice * parseInt(duration || "1");
  const initials = muthawif.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-br from-[#E0F2E9] to-[rgba(235,245,239,0.5)] p-6 flex gap-4 items-start border-b border-[#E0D8CC]">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1B6B4A] to-[#2A8A60] flex items-center justify-center text-white text-[1.25rem] font-bold shrink-0 border-3 border-white shadow-sm overflow-hidden">
          {muthawif.user.photoUrl ? (
            <img src={muthawif.user.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            {muthawif.user.name}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-emerald">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              {LOCATION_LABELS[muthawif.location] || muthawif.location}
            </span>
            {muthawif.experience > 0 && (
              <span className="badge badge-sand">
                {muthawif.experience} th pengalaman
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
            <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--charcoal)" }}>
              {muthawif.rating > 0 ? muthawif.rating.toFixed(1) : "Baru"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
        {muthawif.bio && (
          <p style={{
            fontSize: "0.875rem",
            color: "var(--text-body)",
            lineHeight: 1.65,
            marginBottom: "1rem",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {muthawif.bio}
          </p>
        )}

        {/* Languages */}
        {muthawif.languages.length > 0 && (
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {muthawif.languages.map((lang) => (
              <span key={lang} style={{
                fontSize: "0.75rem",
                background: "var(--ivory-dark)",
                color: "var(--brown)",
                padding: "0.2rem 0.625rem",
                borderRadius: "99px",
                fontWeight: 500,
              }}>
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.125rem" }}>
              {duration ? `Total ${duration} hari` : "Per hari"}
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--emerald)" }}>
              Rp {(duration ? totalFee : muthawif.basePrice).toLocaleString("id-ID")}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div style={{ padding: "0 1.5rem 1.5rem" }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "0.75rem", fontSize: "0.8125rem" }}>
            {error}
          </div>
        )}
        {booked ? (
          <div className="alert alert-success" style={{ textAlign: "center" }}>
            Booking berhasil dikirim!{" "}
            <Link href="/dashboard" style={{ fontWeight: 700, textDecoration: "underline" }}>
              Lihat pesanan
            </Link>
          </div>
        ) : (
          <button
            onClick={handleBook}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={booking}
            id={`book-btn-${muthawif.id}`}
          >
            {booking ? (
              <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white" }} />
            ) : !isLoggedIn ? (
              "Masuk untuk Book"
            ) : (
              "Book Sekarang"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
