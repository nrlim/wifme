"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LOCATIONS = [
  { value: "ALL", label: "Semua Lokasi" },
  { value: "MAKKAH", label: "Makkah" },
  { value: "MADINAH", label: "Madinah" },
  { value: "BOTH", label: "Makkah & Madinah" },
];

export default function DashboardSearchForm({
  initialStartDate,
  initialDuration,
  initialLocation,
}: {
  initialStartDate?: string;
  initialDuration?: string;
  initialLocation?: string;
}) {
  const router = useRouter();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [form, setForm] = useState({
    startDate: initialStartDate || "",
    duration: initialDuration || "7",
    location: initialLocation || "ALL",
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
    router.push(`/dashboard?tab=cari&${params.toString()}`);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "1rem", width: "100%" }}>
      <div style={{ flex: "2 1 200px" }}>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.375rem" }}>Tanggal Keberangkatan</label>
        <input type="date" className="form-input" min={today} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required style={{ width: "100%", background: "var(--ivory)", border: "1px solid var(--border)", height: "48px" }} />
      </div>
      <div style={{ flex: "1 1 120px" }}>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.375rem" }}>Durasi (Hari)</label>
        <input type="number" className="form-input" min="1" max="60" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required style={{ width: "100%", background: "var(--ivory)", border: "1px solid var(--border)", height: "48px" }} />
      </div>
      <div style={{ flex: "1 1 160px" }}>
        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.375rem" }}>Lokasi</label>
        <select className="form-input form-select" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} style={{ width: "100%", background: "var(--ivory)", border: "1px solid var(--border)", height: "48px" }}>
          {LOCATIONS.map((loc) => (
            <option key={loc.value} value={loc.value}>{loc.label}</option>
          ))}
        </select>
      </div>
      <div style={{ flex: "0 0 auto", width: "100%", maxWidth: "160px" }}>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: "48px", width: "100%", justifyContent: "center" }}>
          {loading ? <span className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px", borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white" }} /> : "Cari"}
        </button>
      </div>
    </form>
  );
}
