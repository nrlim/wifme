"use client";

import MuthawifCard from "@/components/MuthawifCard";
import type { FeeConfig } from "@/lib/fee";

interface Muthawif {
  id: string;
  rating: number;
  totalReviews: number;
  basePrice: number;
  operatingAreas: string[];
  experience: number;
  bio: string | null;
  languages: string[];
  specializations: string[];
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
  };
}

interface Props {
  muthawifs: Muthawif[];
  startDate: string;
  duration: string;
  feeConfig?: FeeConfig;
}

export default function DashboardSearchList({ muthawifs, startDate, duration, feeConfig }: Props) {
  if (muthawifs.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "4rem 2rem",
        background: "white",
        borderRadius: 20,
        border: "1px dashed var(--border)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--emerald-pale)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.5rem" }}>
          Muthawif Tidak Tersedia
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: 320, margin: "0 auto" }}>
          Tidak ada muthawif yang tersedia untuk jadwal tersebut. Coba ubah tanggal atau durasi.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.25rem",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--emerald)" }} />
          {muthawifs.length} muthawif tersedia
        </div>
        <span style={{
          fontSize: "0.8125rem", color: "var(--text-muted)",
          background: "var(--ivory-dark)", padding: "0.25rem 0.75rem",
          borderRadius: 99, border: "1px solid var(--border)", fontWeight: 600,
        }}>
          Durasi: {duration} hari
        </span>
      </div>

      {/* Card grid similar to Search page */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "1.5rem",
      }}>
        {muthawifs.map((m) => (
          <MuthawifCard
            key={m.id}
            muthawif={m}
            startDate={startDate}
            duration={duration}
            isLoggedIn={true}
            dashboardHref="/dashboard?tab=beranda"
            searchLocation="ALL"
            feeConfig={feeConfig}
          />
        ))}
      </div>
    </div>
  );
}
