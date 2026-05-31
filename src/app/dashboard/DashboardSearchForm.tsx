"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Search } from "lucide-react";

export default function DashboardSearchForm({
  initialStartDate,
  initialLocation,
  supportedLocations = ["Makkah", "Madinah"],
}: {
  initialStartDate?: string;
  initialLocation?: string;
  supportedLocations?: string[];
}) {
  const router = useRouter();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const locationOptions = ["ALL", ...supportedLocations.filter((loc) => loc.trim().length > 0)];

  const [form, setForm] = useState({
    startDate: initialStartDate || "",
    location: initialLocation || "ALL",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams({
      startDate: form.startDate,
      location: form.location,
    });
    router.push(`/dashboard?tab=cari&${params.toString()}`);
    setLoading(false);
  };

  return (
    <form className="dashboard-search-form native-mobile-form" onSubmit={handleSubmit}>
      <div className="nmf-grid">
        <div className="nmf-input-group">
          <div className="nmf-icon"><Calendar size={18} /></div>
          <div className="nmf-field">
            <label htmlFor="dashboard-search-start-date">Tanggal Keberangkatan</label>
            <input 
              id="dashboard-search-start-date" 
              type="date" 
              min={today} 
              value={form.startDate} 
              onChange={(e) => setForm({ ...form, startDate: e.target.value })} 
              required 
            />
          </div>
        </div>


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
      </div>

      <button id="dashboard-search-submit" type="submit" className="nmf-submit-btn" disabled={loading}>
        {loading ? (
          <span className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px", borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white" }} />
        ) : (
          <>
            <Search size={18} strokeWidth={2.5} />
            <span>Cari Muthawif</span>
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
          border-radius: 20px;
          border: 1px solid var(--border);
          padding: 0.5rem;
        }
        .nmf-input-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: white;
          border-radius: 14px;
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
          border-radius: 10px;
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
        .nmf-field select {
          cursor: pointer;
        }
        .nmf-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 52px;
          background: linear-gradient(135deg, var(--emerald), #27956A);
          color: white;
          border: none;
          border-radius: 16px;
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
            padding: 0.875rem 1rem;
            border-radius: 16px;
          }
        }

        /* Desktop view (> 900px) */
        @media (min-width: 901px) {
          .native-mobile-form {
            flex-direction: row;
            align-items: center;
            background: var(--ivory);
            border-radius: 24px;
            border: 1px solid var(--border);
            padding: 0.5rem;
            gap: 0.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          }
          .nmf-grid {
            flex: 1;
            grid-template-columns: 1.2fr 0.8fr 1fr;
            background: transparent;
            border: none;
            padding: 0;
            gap: 0.5rem;
          }
          .nmf-input-group {
            background: white;
            border-radius: 18px;
            border: 1px solid rgba(0,0,0,0.04);
            box-shadow: 0 2px 10px rgba(0,0,0,0.01);
          }
          .nmf-submit-btn {
            height: 56px;
            padding: 0 2rem;
            border-radius: 18px;
            margin: 0;
            flex-shrink: 0;
            white-space: nowrap;
          }
        }
      `}</style>
    </form>
  );
}
