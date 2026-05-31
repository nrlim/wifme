"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Search } from "lucide-react";

interface SearchFormProps {
  initialValues?: {
    location?: string;
  };
  supportedLocations?: string[];
  variant?: "hero" | "panel";
}

export default function SearchForm({
  initialValues,
  supportedLocations = ["Makkah", "Madinah"],
  variant = "panel",
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({ location: initialValues?.location || "ALL" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({ location: form.location });
    router.push(`/search?${params.toString()}`);
  };

  const chevronBg =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

  /* ── HERO VARIANT ───────────────────────────────────────────── */
  if (variant === "hero") {
    return (
      <form
        onSubmit={handleSubmit}
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 16,
          padding: "clamp(1.5rem, 5vw, 2rem)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.12)",
          border: "1px solid rgba(255,255,255,0.9)",
          width: "100%",
          maxWidth: 400,
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #1B6B4A, #27956A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 6px 20px rgba(27,107,74,0.35)",
            }}
          >
            <Search size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>
              Cari Muthawif
            </div>
            <div style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: 2 }}>
              Temukan pendamping ibadah ideal Anda
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, #E0D8CC, transparent)",
            marginBottom: "1.375rem",
          }}
        />

        {/* Location Field */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="hero-sf-location"
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              fontSize: "0.71875rem", fontWeight: 700, color: "#6B7280",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem",
            }}
          >
            <MapPin size={13} color="#1B6B4A" />
            Tujuan Ibadah
          </label>
          <select
            id="hero-sf-location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            style={{
              width: "100%", padding: "0.875rem 1rem", paddingRight: "2.5rem",
              borderRadius: 10, border: "1.5px solid #E0D8CC",
              fontSize: "0.9375rem", fontFamily: "inherit", fontWeight: 600,
              backgroundColor: "#FAFAF8", color: "#1a1a1a", outline: "none",
              cursor: "pointer", appearance: "none", boxSizing: "border-box",
              transition: "border-color 0.2s",
              backgroundImage: chevronBg,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
            }}
          >
            <option value="ALL">Semua Lokasi (Makkah & Madinah)</option>
            {supportedLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* Trust Badges */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.375rem" }}>
          {["500+ Muthawif", "Terverifikasi", "Escrow Aman"].map((badge) => (
            <span
              key={badge}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.25rem",
                padding: "0.3rem 0.625rem", borderRadius: 6,
                background: "rgba(27,107,74,0.07)", border: "1px solid rgba(27,107,74,0.15)",
                fontSize: "0.6875rem", fontWeight: 700, color: "#1B6B4A",
              }}
            >
              ✓ {badge}
            </span>
          ))}
        </div>

        {/* Submit */}
        <button
          id="hero-search-submit"
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "1.0625rem", borderRadius: 10,
            background: loading ? "#9CA3AF" : "linear-gradient(135deg, #1B6B4A, #27956A)",
            color: "white", fontWeight: 800, fontSize: "1rem",
            fontFamily: "inherit", border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: loading ? "none" : "0 6px 24px rgba(27,107,74,0.45)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(27,107,74,0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 24px rgba(27,107,74,0.45)";
            }
          }}
        >
          {loading ? (
            <span
              style={{
                width: 20, height: 20, borderRadius: "50%", display: "inline-block",
                border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <>
              <Search size={18} />
              Temukan Muthawif Sekarang
            </>
          )}
        </button>

        {/* Footer note */}
        <p style={{ textAlign: "center", fontSize: "0.6875rem", color: "#9CA3AF", marginTop: "0.875rem", lineHeight: 1.6 }}>
          Gratis · Tanpa biaya pendaftaran · Bayar hanya saat booking
        </p>
      </form>
    );
  }

  /* ── PANEL VARIANT (Default) ─────────────────────────────────── */
  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        padding: "clamp(1.25rem, 5vw, 1.75rem)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.8)",
        width: "100%", maxWidth: 500, boxSizing: "border-box", margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg, #1B6B4A, #27956A)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Search size={20} color="white" />
        </div>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#2C2C2C", lineHeight: 1.2 }}>Cari Muthawif</div>
          <div style={{ fontSize: "0.75rem", color: "#8A8A8A", marginTop: "0.1rem" }}>Temukan pembimbing sesuai jadwal Anda</div>
        </div>
      </div>

      {/* Field */}
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="panel-sf-location"
          style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "#4A4A4A", marginBottom: "0.375rem" }}
        >
          Lokasi
        </label>
        <select
          id="panel-sf-location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          style={{
            width: "100%", padding: "0.75rem 1rem", paddingRight: "2.25rem",
            border: "1.5px solid #E0D8CC", borderRadius: 8,
            fontSize: "0.9375rem", fontFamily: "inherit",
            backgroundColor: "white", color: "#2C2C2C", outline: "none",
            transition: "border-color 0.2s", boxSizing: "border-box",
            appearance: "none", cursor: "pointer",
            backgroundImage: chevronBg,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
          }}
        >
          <option value="ALL">Semua Lokasi</option>
          {supportedLocations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        id="panel-search-submit"
        type="submit"
        disabled={loading}
        style={{
          width: "100%", padding: "1rem", borderRadius: 10,
          background: loading ? "#9CA3AF" : "linear-gradient(135deg, #1B6B4A, #27956A)",
          color: "white", fontWeight: 800, fontSize: "1rem",
          fontFamily: "inherit", border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          boxShadow: loading ? "none" : "0 4px 16px rgba(27,107,74,0.4)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
        onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = "translateY(0)")}
      >
        {loading ? (
          <span
            style={{
              width: 20, height: 20, borderRadius: "50%", display: "inline-block",
              border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white",
              animation: "spin 0.8s linear infinite",
            }}
          />
        ) : (
          <>
            <Search size={18} />
            Cari Muthawif
          </>
        )}
      </button>
    </form>
  );
}
