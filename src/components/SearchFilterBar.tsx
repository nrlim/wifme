"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LOCATIONS = [
  { value: "ALL", label: "Semua Lokasi" },
  { value: "MAKKAH", label: "Makkah" },
  { value: "MADINAH", label: "Madinah" },
  { value: "BOTH", label: "Makkah & Madinah" },
];

interface SearchFilterBarProps {
  startDate?: string;
  duration?: string;
  location?: string;
  supportedLocations?: string[];
  forceOpen?: boolean;
}

const DEFAULT_LOC_LABELS: Record<string, string> = {
  ALL: "Semua Lokasi",
  MAKKAH: "Makkah",
  MADINAH: "Madinah",
};

export default function SearchFilterBar({
  startDate,
  duration,
  location,
  supportedLocations = ["Makkah", "Madinah"],
  forceOpen = false,
}: SearchFilterBarProps) {
  const router = useRouter();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [isEditing, setIsEditing] = useState(forceOpen);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    startDate: startDate || "",
    duration: duration || "7",
    location: location || "ALL",
  });

  // Reset loading and close form when search results change (props update)
  useEffect(() => {
    setLoading(false);
    setIsEditing(false);
    setForm({
      startDate: startDate || "",
      duration: duration || "7",
      location: location || "ALL",
    });
  }, [startDate, duration, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({
      startDate: form.startDate,
      duration: form.duration,
      location: form.location,
    });
    router.push(`/search?${params.toString()}`);
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    border: "1.5px solid var(--border)",
    borderRadius: "10px",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    color: "var(--charcoal)",
    background: "white",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    padding: "0.625rem 0.875rem",
  };

  const labelBase: React.CSSProperties = {
    display: "block",
    fontSize: "0.6875rem",
    fontWeight: 800,
    color: "var(--text-muted)",
    marginBottom: "0.3rem",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  };

  /* ── Active filter chips (read-only display) ── */
  const chipCount = [startDate, duration, location && location !== "ALL"].filter(Boolean).length;

  return (
    <>
      {/* ─── Active Filter Summary Row ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          flexWrap: "wrap",
        }}
      >
        {/* Chips */}
        {startDate && (
          <div style={chipStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <div>
              <div style={chipLabelStyle}>Berangkat</div>
              <div style={chipValueStyle}>
                {new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          </div>
        )}
        {duration && (
          <div style={chipStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <div style={chipLabelStyle}>Durasi</div>
              <div style={chipValueStyle}>{duration} Hari</div>
            </div>
          </div>
        )}
        {location && location !== "ALL" && (
          <div style={chipStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <div style={chipLabelStyle}>Lokasi</div>
              <div style={chipValueStyle}>{location === "ALL" ? "Semua Lokasi" : location}</div>
            </div>
          </div>
        )}

        {/* Ubah Pencarian toggle */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 0.875rem",
            borderRadius: 10,
            border: isEditing
              ? "1.5px solid var(--emerald)"
              : "1.5px solid var(--border)",
            background: isEditing ? "var(--emerald-pale)" : "white",
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: isEditing ? "var(--emerald)" : "var(--text-muted)",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          {isEditing ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Tutup
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Ubah Pencarian
              {chipCount > 0 && (
                <span style={{
                  background: "var(--emerald)",
                  color: "white",
                  borderRadius: 99,
                  fontSize: "0.5625rem",
                  fontWeight: 800,
                  padding: "0.1rem 0.4rem",
                  lineHeight: 1.4,
                }}>
                  {chipCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* ─── Inline Edit Form (full-width, below chips) ─── */}
      {isEditing && (
        <div style={{
          marginTop: "1.25rem",
          animation: "sfbFadeIn 0.25s ease-out",
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: "white",
              borderRadius: 18,
              padding: "1.25rem 1.5rem",
              border: "1.5px solid rgba(27,107,74,0.15)",
              boxShadow: "0 8px 32px rgba(27,107,74,0.1), 0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {/* Form header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, var(--emerald), #27956A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--charcoal)" }}>Ubah Kriteria Pencarian</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Perbarui tanggal, durasi, atau lokasi</div>
              </div>
            </div>

            {/* Fields — single row on desktop */}
            <div className="sfb-fields">
              {/* Date */}
              <div>
                <label htmlFor="sfb-date" style={labelBase}>📅 Tanggal Berangkat</label>
                <input
                  id="sfb-date"
                  type="date"
                  min={today}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  style={inputBase}
                  onFocus={(e) => { e.target.style.borderColor = "var(--emerald)"; e.target.style.boxShadow = "0 0 0 3px rgba(27,107,74,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="sfb-duration" style={labelBase}>⏱ Durasi (Hari)</label>
                <input
                  id="sfb-duration"
                  type="number"
                  min="1"
                  max="60"
                  placeholder="7"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  required
                  style={inputBase}
                  onFocus={(e) => { e.target.style.borderColor = "var(--emerald)"; e.target.style.boxShadow = "0 0 0 3px rgba(27,107,74,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="sfb-location" style={labelBase}>📍 Lokasi</label>
                <select
                  id="sfb-location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  style={{
                    ...inputBase,
                    appearance: "none",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    paddingRight: "2.25rem",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--emerald)"; e.target.style.boxShadow = "0 0 0 3px rgba(27,107,74,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.65rem 1.25rem",
                    borderRadius: 10,
                    background: loading
                      ? "#9CA3AF"
                      : "linear-gradient(135deg, var(--emerald), #27956A)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: loading ? "none" : "0 4px 14px rgba(27,107,74,0.35)",
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = "none")}
                >
                  {loading ? (
                    <span className="spinner" style={{ width: 16, height: 16, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white", borderWidth: 2 }} />
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                      </svg>
                      Terapkan
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes sfbFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sfb-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .sfb-fields {
            grid-template-columns: 1.6fr 0.8fr 1.2fr auto;
            align-items: end;
            gap: 0.875rem;
          }
        }
      `}</style>
    </>
  );
}

/* ── Reusable chip styles ── */
const chipStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  background: "white",
  border: "1.5px solid var(--border)",
  borderRadius: 10,
  padding: "0.5rem 0.75rem",
  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
};
const chipLabelStyle: React.CSSProperties = {
  fontSize: "0.5rem",
  fontWeight: 800,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  lineHeight: 1,
};
const chipValueStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  fontWeight: 800,
  color: "var(--charcoal)",
  lineHeight: 1.3,
};
