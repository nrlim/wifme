"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BookingStatusButtonProps {
  bookingId: string;
  currentStatus: string;
  endDate: string; // ISO string — needed to gate "Selesaikan"
}

interface NextAction {
  label: string;
  status: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  /** If set, button is hidden unless condition is true */
  condition?: boolean;
}

export default function BookingStatusButton({ bookingId, currentStatus, endDate }: BookingStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEndDatePassed = new Date(endDate) <= new Date();

  const NEXT_MAP: Record<string, NextAction | null> = {
    PENDING: {
      label: "Konfirmasi",
      status: "CONFIRMED",
      color: "var(--emerald)",
      bg: "var(--emerald-pale)",
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    CONFIRMED: isEndDatePassed
      ? {
          label: "Tandai Selesai",
          status: "COMPLETED",
          color: "#2563EB",
          bg: "#EFF6FF",
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ),
        }
      : null, // endDate belum lewat → jangan tampilkan tombol
    COMPLETED: null,
    CANCELLED: null,
  };

  const next = NEXT_MAP[currentStatus];

  // If CONFIRMED but endDate not yet passed, show an info badge instead of button
  if (currentStatus === "CONFIRMED" && !isEndDatePassed) {
    const endDateObj = new Date(endDate);
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.275rem 0.625rem",
        borderRadius: 8,
        background: "#F0F9FF",
        border: "1.5px solid #BAE6FD",
        color: "#0369A1",
        fontSize: "0.6rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Selesai: {endDateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
      </div>
    );
  }

  if (!next) return null;

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next.status }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal mengubah status.");
      }
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        title={`Ubah ke: ${next.status}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.3rem 0.75rem",
          borderRadius: 8,
          border: `1.5px solid ${next.color}`,
          background: loading ? next.bg : "white",
          color: next.color,
          fontFamily: "inherit",
          fontSize: "0.6875rem",
          fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "background 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = next.bg; }}
        onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "white"; }}
      >
        {loading ? (
          <span
            className="spinner"
            style={{ width: 11, height: 11, borderColor: `${next.color}40`, borderTopColor: next.color, borderWidth: "1.5px" }}
          />
        ) : (
          next.icon
        )}
        {loading ? "Memproses..." : next.label}
      </button>
      {error && (
        <div style={{ fontSize: "0.625rem", color: "var(--error)", marginTop: "0.25rem", fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  );
}
