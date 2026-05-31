"use client";

import { useState } from "react";
import MuthawifCard from "@/components/MuthawifCard";
import type { FeeConfig } from "@/lib/fee";
import BookingPopup from "@/components/BookingPopup";

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
  location?: string;
  specialization?: string;
  language?: string;
  feeConfig?: FeeConfig;
}

export default function DashboardSearchList({ muthawifs, location, specialization, language, feeConfig }: Props) {
  const [selectedMuthawif, setSelectedMuthawif] = useState<Muthawif | null>(null);

  const activeFilters = [
    location && location !== "ALL" ? (location === "BOTH" ? "Makkah & Madinah" : location) : null,
    specialization && specialization !== "ALL" ? specialization : null,
    language && language !== "ALL" ? language : null,
  ].filter(Boolean);

  if (muthawifs.length === 0) {
    return (
      <div className="dashboard-search-empty" style={{
        textAlign: "center",
        padding: "4rem 2rem",
        background: "white",
        borderRadius: 16,
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
          Muthawif Tidak Ditemukan
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: 320, margin: "0 auto" }}>
          Tidak ada muthawif yang tersedia dengan kombinasi kriteria pencarian Anda. Coba sesuaikan atau hapus beberapa filter pencarian.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results header */}
      <div className="dashboard-results-header" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.25rem",
        flexWrap: "wrap",
        gap: "0.5rem",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--emerald)" }} />
          {muthawifs.length} muthawif tersedia
        </div>
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {activeFilters.length > 0 ? (
            activeFilters.map((f, i) => (
              <span key={i} style={{
                fontSize: "0.75rem", color: "var(--emerald)",
                background: "var(--emerald-pale)", padding: "0.25rem 0.625rem",
                borderRadius: 8, border: "1px solid rgba(27,107,74,0.15)", fontWeight: 700,
              }}>
                {f}
              </span>
            ))
          ) : (
            <span style={{
              fontSize: "0.75rem", color: "var(--text-muted)",
              background: "var(--ivory-dark)", padding: "0.25rem 0.625rem",
              borderRadius: 8, border: "1px solid var(--border)", fontWeight: 600,
            }}>
              Semua Filter
            </span>
          )}
        </div>
      </div>

      {/* Card grid similar to Search page */}
      <div className="dashboard-search-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "1.5rem",
      }}>
        {muthawifs.map((m) => (
          <MuthawifCard
            key={m.id}
            muthawif={m}
            isLoggedIn={true}
            dashboardHref="/dashboard?tab=beranda"
            searchLocation="ALL"
            feeConfig={feeConfig}
            onBookClick={() => setSelectedMuthawif(m)}
          />
        ))}
      </div>

      {selectedMuthawif && (
        <BookingPopup
          muthawifId={selectedMuthawif.user.id}
          muthawifName={selectedMuthawif.user.name}
          onClose={() => setSelectedMuthawif(null)}
        />
      )}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-search-empty {
            padding: 2.5rem 1rem !important;
            border-radius: 16px !important;
          }
          .dashboard-results-header {
            align-items: flex-start !important;
            flex-direction: column;
            gap: 0.6rem;
            margin-bottom: 0.85rem !important;
          }
          .dashboard-search-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
}
