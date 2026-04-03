"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LOCATIONS = [
  { value: "ALL", label: "Semua Lokasi" },
  { value: "MAKKAH", label: "Makkah" },
  { value: "MADINAH", label: "Madinah" },
  { value: "BOTH", label: "Makkah & Madinah" },
];

export default function SearchForm() {
  const router = useRouter();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const today = `${year}-${month}-${day}`;

  const [form, setForm] = useState({
    startDate: "",
    duration: "7",
    location: "ALL",
  });

  const [loading, setLoading] = useState(false);

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

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(16px)",
        borderRadius: "var(--radius-xl)",
        padding: "1.75rem",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid rgba(255,255,255,0.8)",
        width: "100%",
        maxWidth: 620,
      }}
    >
      <div style={{ marginBottom: "1.125rem" }}>
        <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.25rem" }}>
          Cari Muthawif Tersedia
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Temukan pembimbing terbaik sesuai jadwal Anda
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "0.875rem" }}>
        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="form-label" htmlFor="startDate">
            Tanggal Keberangkatan
          </label>
          <input
            id="startDate"
            type="date"
            className="form-input"
            min={today}
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="duration">
            Durasi (Hari)
          </label>
          <input
            id="duration"
            type="number"
            className="form-input"
            min="1"
            max="60"
            placeholder="misal: 10"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="location">
            Lokasi
          </label>
          <select
            id="location"
            className="form-input form-select"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full"
        style={{ width: "100%", justifyContent: "center", padding: "0.9375rem" }}
        disabled={loading}
      >
        {loading ? (
          <span className="spinner" />
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Cari Muthawif
          </>
        )}
      </button>
    </form>
  );
}
