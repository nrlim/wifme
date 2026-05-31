"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Search, Briefcase, Globe } from "lucide-react";

const SPEC_OPTIONS = ["Semua Kegiatan", "Umrah", "Haji", "Ziarah Makkah", "Ziarah Madinah", "City Tour", "Pendampingan Lansia"];
const LANG_OPTIONS = ["Semua Bahasa", "Indonesia", "Sunda", "Jawa", "Inggris", "Arab"];

export default function DashboardSearchForm({
  initialLocation,
  initialSpecialization,
  initialLanguage,
  initialDate,
  supportedLocations = ["Makkah", "Madinah"],
}: {
  initialLocation?: string;
  initialSpecialization?: string;
  initialLanguage?: string;
  supportedLocations?: string[];
}) {
  const router = useRouter();

  const locationOptions = ["ALL", ...supportedLocations.filter((loc) => loc.trim().length > 0)];

  const [form, setForm] = useState({
    location: initialLocation || "ALL",
    specialization: initialSpecialization || "ALL",
    language: initialLanguage || "ALL",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (form.location !== "ALL") params.set("location", form.location);
    if (form.specialization !== "ALL") params.set("specialization", form.specialization);
    if (form.language !== "ALL") params.set("language", form.language);
    
    router.push(`/dashboard?tab=cari&${params.toString()}`);
    setLoading(false);
  };

  return (
    <form className="dashboard-search-form native-mobile-form" onSubmit={handleSubmit}>
      <div className="nmf-grid">
        {/* Location Filter */}
        <div className="nmf-input-group">
          <div className="nmf-icon"><MapPin size={18} /></div>
          <div className="nmf-field">
            <label htmlFor="dashboard-search-location">Lokasi</label>
            <select 
              id="dashboard-search-location" 
              value={form.location} 
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            >
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>{loc === "ALL" ? "Semua Lokasi" : loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Specialization Filter */}
        <div className="nmf-input-group">
          <div className="nmf-icon"><Briefcase size={18} /></div>
          <div className="nmf-field">
            <label htmlFor="dashboard-search-spec">Kegiatan</label>
            <select 
              id="dashboard-search-spec" 
              value={form.specialization} 
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            >
              {SPEC_OPTIONS.map((spec) => (
                <option key={spec} value={spec === "Semua Kegiatan" ? "ALL" : spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Language Filter */}
        <div className="nmf-input-group">
          <div className="nmf-icon"><Globe size={18} /></div>
          <div className="nmf-field">
            <label htmlFor="dashboard-search-lang">Bahasa</label>
            <select 
              id="dashboard-search-lang" 
              value={form.language} 
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            >
              {LANG_OPTIONS.map((lang) => (
                <option key={lang} value={lang === "Semua Bahasa" ? "ALL" : lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>


      </div>

      <button id="dashboard-search-submit" type="submit" className="nmf-submit-btn" disabled={loading}>
        {loading ? (
          <span className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px", borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white" }} />
        ) : (
          <>
            <Search size={18} strokeWidth={2.5} />
            <span>Cari</span>
          </>
        )}
      </button>

      <style>{`
        .native-mobile-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }
        .nmf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 0.75rem;
          background: var(--ivory);
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 0.5rem;
        }
        .nmf-input-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.875rem;
          background: white;
          border-radius: 12px;
          border: 1px solid var(--border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nmf-input-group:focus-within {
          border-color: var(--emerald);
          box-shadow: 0 0 0 3px var(--emerald-pale);
        }
        .nmf-icon {
          color: var(--emerald);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--emerald-pale);
          flex-shrink: 0;
        }
        .nmf-field {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }
        .nmf-field label {
          font-size: 0.625rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.125rem;
        }
        .nmf-field input,
        .nmf-field select {
          border: none;
          background: transparent;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--charcoal);
          padding: 0;
          width: 100%;
          outline: none;
          appearance: none;
        }
        .nmf-field select,
        .nmf-field input[type="date"] {
          cursor: pointer;
        }
        .nmf-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 44px;
          padding: 0 1.5rem;
          background: linear-gradient(135deg, var(--emerald), #27956A);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(27,107,74,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .nmf-submit-btn:active {
          transform: scale(0.98);
        }
        .nmf-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* Tablet/Mobile view (<= 900px) */
        @media (max-width: 900px) {
          .native-mobile-form {
            gap: 0.75rem;
          }
          .nmf-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
            padding: 0;
            background: transparent;
            border: none;
          }
          .nmf-input-group {
            padding: 0.625rem 0.875rem;
            border-radius: 12px;
          }
          .nmf-submit-btn {
            width: 100%;
            height: 48px;
          }
        }

        /* Desktop view (> 900px) */
        @media (min-width: 901px) {
          .native-mobile-form {
            flex-direction: column;
            align-items: stretch;
            background: var(--ivory);
            border-radius: 16px;
            border: 1px solid var(--border);
            padding: 0.5rem;
            gap: 0.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          }
          .nmf-grid {
            flex: 1;
            grid-template-columns: 1fr 1.2fr 1fr;
            background: transparent;
            border: none;
            padding: 0;
            gap: 0.5rem;
          }
          .nmf-input-group {
            border: 1px solid var(--border);
          }
          .nmf-submit-btn {
            width: 100%;
            height: 40px;
            border-radius: 10px;
          }
        }
        
        @media (min-width: 1200px) {
          .native-mobile-form {
            flex-direction: row;
            align-items: center;
          }
          .nmf-submit-btn {
            width: auto;
            height: 48px;
            padding: 0 2rem;
            border-radius: 12px;
          }
        }
      `}</style>
    </form>
  );
}
