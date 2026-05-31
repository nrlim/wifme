"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Briefcase, Globe, Calendar, Search, X, SlidersHorizontal } from "lucide-react";

interface SearchFilterBarProps {
  location?: string;
  specialization?: string;
  language?: string;
  supportedLocations?: string[];
  forceOpen?: boolean;
}

const SPEC_OPTIONS = ["Semua Kegiatan", "Umrah", "Haji", "Ziarah Makkah", "Ziarah Madinah", "City Tour", "Pendampingan Lansia"];
const LANG_OPTIONS = ["Semua Bahasa", "Indonesia", "Sunda", "Jawa", "Inggris", "Arab"];

export default function SearchFilterBar({
  location,
  specialization,
  language,
  supportedLocations = ["Makkah", "Madinah"],
  forceOpen = false,
}: SearchFilterBarProps) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(forceOpen);
  const [loading, setLoading] = useState(false);
  const locationOptions = ["ALL", ...supportedLocations.filter((loc) => loc.trim().length > 0)];

  const [form, setForm] = useState({
    location: location || "ALL",
    specialization: specialization || "ALL",
    language: language || "ALL",
  });

  // Reset loading and close form when search results change (props update)
  useEffect(() => {
    setLoading(false);
    setIsEditing(false);
    setForm({
      location: location || "ALL",
      specialization: specialization || "ALL",
      language: language || "ALL",
    });
  }, [location, specialization, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (form.location !== "ALL") params.set("location", form.location);
    if (form.specialization !== "ALL") params.set("specialization", form.specialization);
    if (form.language !== "ALL") params.set("language", form.language);
    
    router.push(`/search?${params.toString()}`);
  };

  const handleClear = () => {
    router.push("/search");
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
    paddingLeft: "2.25rem", // space for icon
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
  const chipCount = [
    location && location !== "ALL",
    specialization && specialization !== "ALL",
    language && language !== "ALL",
  ].filter(Boolean).length;

  if (!isEditing && chipCount > 0) {
    return (
      <div 
        style={{ 
          background: "var(--ivory)", padding: "1rem 1.25rem", borderRadius: "16px", 
          border: "1px solid var(--border)", display: "flex", gap: "1rem", 
          alignItems: "center", justifyContent: "space-between", cursor: "pointer", 
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)", transition: "all 0.2s" 
        }} 
        onClick={() => setIsEditing(true)}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", flex: 1 }}>
          {location && location !== "ALL" && (
            <div style={chipStyle}>
              <MapPin size={14} />
              {location === "BOTH" ? "Makkah & Madinah" : location}
            </div>
          )}
          {specialization && specialization !== "ALL" && (
            <div style={chipStyle}>
              <Briefcase size={14} />
              {specialization}
            </div>
          )}
          {language && language !== "ALL" && (
            <div style={chipStyle}>
              <Globe size={14} />
              {language}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            style={{ 
              width: "36px", height: "36px", borderRadius: "50%", background: "white", 
              display: "flex", alignItems: "center", justifyContent: "center", 
              border: "1px solid var(--border)", color: "var(--error)", cursor: "pointer" 
            }}
            title="Hapus Filter"
          >
            <X size={16} />
          </button>
          <div style={{ 
            width: "36px", height: "36px", borderRadius: "50%", background: "var(--emerald)", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            border: "none", color: "white" 
          }}>
            <SlidersHorizontal size={16} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Inline Edit Form (full-width) ─── */}
      <div style={{
        marginTop: "1.25rem",
        animation: "sfbFadeIn 0.25s ease-out",
      }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: "white",
            borderRadius: 16,
            padding: "1.5rem",
            border: "1.5px solid rgba(27,107,74,0.15)",
            boxShadow: "0 12px 40px rgba(27,107,74,0.08), 0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          {/* Form header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, var(--emerald), #27956A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Search size={18} color="white" />
              </div>
              <div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--charcoal)" }}>Detail Pencarian</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Sesuaikan kriteria Muthawif Anda</div>
              </div>
            </div>
            
            {chipCount > 0 && (
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                style={{ 
                  background: "var(--ivory)", border: "1px solid var(--border)", 
                  borderRadius: "50%", width: 32, height: 32, display: "flex", 
                  alignItems: "center", justifyContent: "center", cursor: "pointer",
                  color: "var(--text-muted)"
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Fields Grid */}
          <div className="sfb-fields">
            {/* Location */}
            <div style={{ position: "relative" }}>
              <label htmlFor="sf-location" style={labelBase}>Lokasi</label>
              <MapPin size={16} color="var(--emerald)" style={{ position: "absolute", left: "0.75rem", bottom: "0.7rem", pointerEvents: "none" }} />
              <select
                id="sf-location"
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
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>{loc === "ALL" ? "Semua Lokasi" : loc}</option>
                ))}
              </select>
            </div>

            {/* Specialization */}
            <div style={{ position: "relative" }}>
              <label htmlFor="sf-spec" style={labelBase}>Kegiatan</label>
              <Briefcase size={16} color="var(--emerald)" style={{ position: "absolute", left: "0.75rem", bottom: "0.7rem", pointerEvents: "none" }} />
              <select
                id="sf-spec"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
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
                {SPEC_OPTIONS.map((spec) => (
                  <option key={spec} value={spec === "Semua Kegiatan" ? "ALL" : spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div style={{ position: "relative" }}>
              <label htmlFor="sf-lang" style={labelBase}>Bahasa</label>
              <Globe size={16} color="var(--emerald)" style={{ position: "absolute", left: "0.75rem", bottom: "0.7rem", pointerEvents: "none" }} />
              <select
                id="sf-lang"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
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
                {LANG_OPTIONS.map((lang) => (
                  <option key={lang} value={lang === "Semua Bahasa" ? "ALL" : lang}>{lang}</option>
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
                  height: "44px", // match input height roughly
                }}
              >
                {loading ? (
                  <span className="spinner" style={{ width: 16, height: 16, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white", borderWidth: 2 }} />
                ) : (
                  <>
                    <Search size={16} />
                    Cari
                  </>
                )}
              </button>
            </div>
            </div>
          </form>
        </div>

      <style>{`
        @keyframes sfbFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sfb-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 640px) {
          .sfb-fields {
            grid-template-columns: repeat(2, 1fr);
            align-items: end;
          }
        }
        @media (min-width: 1024px) {
          .sfb-fields {
            grid-template-columns: 1fr 1.2fr 1fr auto;
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
  display: "inline-flex",
  alignItems: "center",
  gap: "0.375rem",
  background: "white",
  padding: "0.375rem 0.875rem",
  borderRadius: "10px",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "var(--emerald)",
  border: "1px solid rgba(27,107,74,0.1)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
};
