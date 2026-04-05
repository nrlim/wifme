"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchFormProps {
  initialValues?: {
    startDate?: string;
    duration?: string;
    location?: string;
  };
  supportedLocations?: string[];
}

export default function SearchForm({ initialValues, supportedLocations = ["Makkah", "Madinah"] }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [form, setForm] = useState({
    startDate: initialValues?.startDate || "",
    duration: initialValues?.duration || "7",
    location: initialValues?.location || "ALL"
  });
  const [loading, setLoading] = useState(false);

  // Fix continuous loading when route changes without page unmount
  useEffect(() => {
    setLoading(false);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({ startDate: form.startDate, duration: form.duration, location: form.location });
    router.push(`/search?${params.toString()}`);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: "1.5px solid rgba(255,255,255,0.3)",
    borderRadius: "12px",
    fontSize: "0.9375rem",
    fontFamily: "inherit",
    color: "#2C2C2C",
    background: "white",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 700,
    color: "#4A4A4A",
    marginBottom: "0.375rem",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: "24px",
        padding: "clamp(1.25rem, 5vw, 1.75rem)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.8)",
        width: "100%",
        maxWidth: 500,
        boxSizing: "border-box",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg, #1B6B4A, #27AE60)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#2C2C2C", lineHeight: 1.2 }}>Cari Muthawif</div>
          <div style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.1rem" }}>Temukan pembimbing sesuai jadwal Anda</div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "1rem" }}>
        <div>
          <label htmlFor="sf-date" style={labelStyle}>
            📅 Tanggal Pelaksanaan
          </label>
          <input
            id="sf-date"
            type="date"
            min={today}
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#1B6B4A")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label htmlFor="sf-duration" style={labelStyle}>
              ⏱ Durasi (Hari)
            </label>
            <input
              id="sf-duration"
              type="number"
              min="1"
              max="60"
              placeholder="7"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              required
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#1B6B4A")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
            />
          </div>

          <div>
            <label htmlFor="sf-location" style={labelStyle}>
              📍 Lokasi
            </label>
            <select
              id="sf-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              style={{ ...inputStyle, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", paddingRight: "2.25rem" }}
            >
              <option value="ALL">Semua Lokasi</option>
              {supportedLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: "14px",
          background: loading ? "#9CA3AF" : "linear-gradient(135deg, #1B6B4A, #27AE60)",
          color: "white",
          fontWeight: 800,
          fontSize: "1rem",
          fontFamily: "inherit",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          boxShadow: loading ? "none" : "0 4px 16px rgba(27,107,74,0.4)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
        onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = "translateY(0)")}
      >
        {loading ? (
          <span className="spinner" style={{ width: 20, height: 20, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white", borderWidth: 2.5 }} />
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Cari Muthawif
          </>
        )}
      </button>
    </form>
  );
}
