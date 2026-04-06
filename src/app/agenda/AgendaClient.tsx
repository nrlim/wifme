"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import type { ItineraryItem } from "@/components/ItineraryTimeline";
import MobileSidebarDrawer from "@/components/MobileSidebarDrawer";

/* ── Types ─────────────────────────────────────────────── */
interface MuthawifInfo {
  id: string; name: string; email: string; photoUrl: string | null;
}
interface TripPackage {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  muthawifId: string;
  muthawif: MuthawifInfo;
  itineraries: ItineraryItem[];
}
interface Props {
  packages: TripPackage[];
  role: string;
  userName: string;
}

/* ── Design tokens ─────────────────────────────────────── */
const C = {
  emerald:     "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  gold:        "#C4973B",
  goldPale:    "rgba(196,151,59,0.12)",
  charcoal:    "#2C2C2C",
  muted:       "#8A8A8A",
  border:      "#E0D8CC",
  ivory:       "#FAF7F2",
  ivoryDark:   "#F0EBE1",
  white:       "#FFFFFF",
  ongoing:     "#D97706",
  ongoingPale: "rgba(217,119,6,0.1)",
  blue:        "#3B82F6",
  error:       "#C0392B",
};

type FilterTab = "all" | "active" | "upcoming" | "past";

/* ── Helpers ───────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
function dayCount(s: string, e: string) {
  return Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000));
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function pkgStatus(startDate: string, endDate: string): "active" | "upcoming" | "past" {
  const now = new Date();
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (s <= now && e >= now) return "active";
  if (s > now) return "upcoming";
  return "past";
}
function pctDone(items: ItineraryItem[]) {
  if (!items.length) return 0;
  return Math.round((items.filter((i) => i.status === "COMPLETED").length / items.length) * 100);
}

/* ── Avatar ────────────────────────────────────────────── */
function Avatar({ person, size = 36, gradient = "linear-gradient(135deg,#1B6B4A,#27956A)" }: {
  person: MuthawifInfo; size?: number; gradient?: string;
}) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: gradient, color: "white", fontWeight: 800, fontSize: size * 0.35, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)" }}>
      {person.photoUrl
        ? <img src={person.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials(person.name)}
    </div>
  );
}

/* ── Package Status Badge ───────────────────────────────── */
function StatusBadge({ status }: { status: ReturnType<typeof pkgStatus> }) {
  const cfg = {
    active:   { bg: "rgba(27,107,74,0.12)",   color: C.emerald,  dot: C.emerald,  label: "Berlangsung" },
    upcoming: { bg: C.goldPale,                color: C.gold,     dot: C.gold,     label: "Akan Datang" },
    past:     { bg: "rgba(138,138,138,0.12)",  color: C.muted,    dot: C.muted,    label: "Selesai"     },
  }[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.625rem", fontWeight: 800, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, ...(status === "active" ? { animation: "blink 1s infinite" } : {}) }} />
      {cfg.label}
    </span>
  );
}

/* ── Create Package Modal ───────────────────────────────── */
function CreatePackageModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (pkg: TripPackage) => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!form.title || !form.startDate || !form.endDate) {
      setError("Nama paket, tanggal mulai, dan tanggal selesai wajib diisi.");
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/trip-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Gagal membuat paket."); return; }
        onCreated(data.package);
        onClose();
      } catch {
        setError("Terjadi kesalahan. Coba lagi.");
      }
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.72rem 0.875rem", borderRadius: 10,
    border: `1.5px solid ${C.border}`, fontSize: "0.9rem", color: C.charcoal,
    background: C.ivory, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,44,44,0.55)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: 20, width: "100%", maxWidth: 520, padding: "2rem", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.emeraldPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>📦</div>
          <div>
            <h3 style={{ fontWeight: 900, fontSize: "1.0625rem", color: C.charcoal, margin: 0 }}>Buat Paket Perjalanan</h3>
            <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.125rem 0 0" }}>Jadwal ini akan terlihat oleh semua Jamaah yang ada di rentang tanggal ini.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: C.error, padding: "0.625rem 0.875rem", borderRadius: 10, fontSize: "0.8125rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem" }}>Nama Paket *</label>
            <input type="text" placeholder="Contoh: Umrah Reguler — April 2026" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem" }}>Tanggal Mulai *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem" }}>Tanggal Selesai *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem" }}>Deskripsi Paket</label>
            <textarea rows={3} placeholder="Ringkasan isi paket perjalanan, tempat-tempat yang dikunjungi, dll..."
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "0.875rem", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit" }}>
            Batal
          </button>
          <button disabled={isPending} onClick={handleSubmit}
            style={{ flex: 2, padding: "0.875rem", borderRadius: 12, border: "none", background: isPending ? C.emeraldPale : C.emerald, color: isPending ? C.emerald : C.white, fontWeight: 800, fontSize: "0.9375rem", cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
            {isPending ? "Membuat..." : "🚀 Buat Paket"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Trip Package Card ─────────────────────────────────── */
function PackageCard({ pkg, role, isSelected, onClick }: {
  pkg: TripPackage;
  role: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = pkgStatus(pkg.startDate, pkg.endDate);
  const progress = pctDone(pkg.itineraries);
  const totalItems = pkg.itineraries.length;
  const completedItems = pkg.itineraries.filter((i) => i.status === "COMPLETED").length;
  const ongoingItems = pkg.itineraries.filter((i) => i.status === "ONGOING").length;
  const d = dayCount(pkg.startDate, pkg.endDate);

  const borderColor =
    isSelected ? C.emerald :
    status === "active" ? `${C.emerald}44` :
    C.border;

  const cardBg =
    isSelected ? `linear-gradient(135deg, ${C.emeraldPale} 0%, rgba(235,245,239,0) 100%)` :
    C.white;

  return (
    <button
      id={`pkg-card-${pkg.id}`}
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        background: cardBg,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 16,
        padding: "1.25rem",
        transition: "all 0.2s",
        boxShadow: isSelected
          ? `0 0 0 3px ${C.emerald}22, 0 8px 24px rgba(27,107,74,0.1)`
          : status === "active"
            ? "0 4px 16px rgba(27,107,74,0.07)"
            : "0 2px 8px rgba(0,0,0,0.04)",
        position: "relative",
        outline: "none",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.boxShadow =
          status === "active" ? "0 4px 16px rgba(27,107,74,0.07)" : "0 2px 8px rgba(0,0,0,0.04)";
      }}
    >
      {/* Active indicator bar */}
      {status === "active" && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.emerald}, ${C.gold})` }} />
      )}

      {/* Top row: title + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.625rem" }}>
        <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: C.charcoal, lineHeight: 1.3, flex: 1 }}>{pkg.title}</div>
        <StatusBadge status={status} />
      </div>

      {/* Muthawif info (for Jamaah/Amir view) */}
      {role !== "MUTHAWIF" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
          <Avatar person={pkg.muthawif} size={22} />
          <span style={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>{pkg.muthawif.name}</span>
        </div>
      )}

      {/* Date range */}
      <div style={{ fontSize: "0.75rem", color: C.muted, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <span style={{ fontSize: "0.875rem" }}>📅</span>
        {fmtShort(pkg.startDate)} — {fmtShort(pkg.endDate)}
        <span style={{ padding: "0.1rem 0.4rem", background: C.ivoryDark, borderRadius: 6, fontSize: "0.625rem", fontWeight: 800, color: C.charcoal }}>{d} hari</span>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {[
          { label: "Agenda", val: totalItems, color: C.charcoal },
          { label: "Selesai", val: completedItems, color: C.emerald },
          ...(ongoingItems > 0 ? [{ label: "Berjalan", val: ongoingItems, color: C.ongoing }] : []),
        ].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
            <span style={{ fontWeight: 900, fontSize: "1rem", color: s.color }}>{s.val}</span>
            <span style={{ fontSize: "0.625rem", color: C.muted, fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: C.muted, marginBottom: "0.3rem", fontWeight: 700 }}>
            <span>Progres</span>
            <span style={{ color: progress === 100 ? C.emerald : C.muted }}>{progress}%</span>
          </div>
          <div style={{ height: 5, background: C.ivoryDark, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? `linear-gradient(90deg, ${C.emerald}, #34D399)` : `linear-gradient(90deg, ${C.gold}, #E4B55A)`, borderRadius: 3, transition: "width 0.5s ease" }} />
          </div>
        </div>
      )}

      {totalItems === 0 && (
        <div style={{ fontSize: "0.75rem", color: C.muted, fontStyle: "italic" }}>
          {role === "MUTHAWIF" ? "Belum ada agenda — klik untuk menambahkan" : "Muthawif belum membuat agenda"}
        </div>
      )}
    </button>
  );
}

/* ── Main Export ────────────────────────────────────────── */
export default function AgendaClient({ packages: initialPackages, role, userName }: Props) {
  const [packages, setPackages] = useState<TripPackage[]>(initialPackages);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPackages.length === 1 ? initialPackages[0].id : null
  );
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mobileView, setMobileView] = useState<"grid" | "detail">("grid");

  const selected = packages.find((p) => p.id === selectedId) ?? null;

  /* Filter packages */
  const filteredPackages = packages.filter((pkg) => {
    const status = pkgStatus(pkg.startDate, pkg.endDate);
    if (filter === "all") return true;
    return status === filter;
  });

  /* Sort: active first, then upcoming, then past */
  const sortedPackages = [...filteredPackages].sort((a, b) => {
    const order: Record<string, number> = { active: 0, upcoming: 1, past: 2 };
    const sa = pkgStatus(a.startDate, a.endDate);
    const sb = pkgStatus(b.startDate, b.endDate);
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMobileView("detail");
    // Scroll to top of main content on mobile
    document.getElementById("agenda-main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePackageCreated = (pkg: TripPackage) => {
    setPackages((prev) => [pkg, ...prev]);
    setSelectedId(pkg.id);
  };

  const handlePackageDeleted = async (id: string) => {
    if (!confirm("Hapus paket beserta semua agenda di dalamnya?")) return;
    await fetch(`/api/trip-packages/${id}`, { method: "DELETE" });
    setPackages((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  /* Aggregate stats */
  const totalAgenda  = packages.reduce((s, p) => s + p.itineraries.length, 0);
  const doneAgenda   = packages.reduce((s, p) => s + p.itineraries.filter((i) => i.status === "COMPLETED").length, 0);
  const activeCount  = packages.filter((p) => pkgStatus(p.startDate, p.endDate) === "active").length;
  const overallPct   = totalAgenda > 0 ? Math.round((doneAgenda / totalAgenda) * 100) : 0;

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all",      label: "Semua",        count: packages.length },
    { id: "active",   label: "Berlangsung",  count: packages.filter((p) => pkgStatus(p.startDate, p.endDate) === "active").length },
    { id: "upcoming", label: "Akan Datang",  count: packages.filter((p) => pkgStatus(p.startDate, p.endDate) === "upcoming").length },
    { id: "past",     label: "Selesai",      count: packages.filter((p) => pkgStatus(p.startDate, p.endDate) === "past").length },
  ];

  return (
    <div className="dashboard-fullscreen">

      {/* ══ SIDEBAR — mobile drawer ══ */}
      <MobileSidebarDrawer brandLabel="AGENDA PERJALANAN">
        {/* Brand */}
        <div style={{ padding: "1.25rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 900, fontSize: "1rem", letterSpacing: "-0.02em", lineHeight: 1 }}>Wif<span style={{ color: "#E4B55A" }}>–Me</span></div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.07em", marginTop: 2 }}>AGENDA PERJALANAN</div>
          </div>
        </div>

        {/* User greeting */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.5625rem", fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
            {role === "MUTHAWIF" ? "Muthawif" : role === "JAMAAH" ? "Jamaah" : "Admin"}
          </div>
          <div style={{ fontWeight: 800, color: "white", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
        </div>

        {/* Stats */}
        <div style={{ margin: "0.875rem 0.875rem 0", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "0.875rem", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: "0.5rem", fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.625rem" }}>Ringkasan</div>
          {[
            { label: "Total Paket",  val: packages.length,  color: "white" },
            { label: "Total Agenda", val: totalAgenda,       color: "rgba(255,255,255,0.7)" },
            { label: "Selesai",      val: doneAgenda,        color: "#34D399" },
            { label: "Aktif",        val: activeCount,       color: "#FCD34D" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)" }}>{s.label}</span>
              <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
          ))}
          {totalAgenda > 0 && (
            <div style={{ marginTop: "0.625rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.5rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem", fontWeight: 700 }}>
                <span>Kepatuhan</span><span>{overallPct}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${overallPct}%`, background: "linear-gradient(90deg,#34D399,#059669)", borderRadius: 2 }} />
              </div>
            </div>
          )}
        </div>

        {/* Package list in sidebar */}
        <div style={{ padding: "0.875rem 0.875rem 0", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: "0.5rem", fontWeight: 900, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            {sortedPackages.length} Paket Perjalanan
          </div>
          {sortedPackages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0.5rem", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
              {filter !== "all" ? `Tidak ada paket "${filterTabs.find(t => t.id === filter)?.label}"` : "Belum ada paket."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {sortedPackages.map((pkg) => {
                const status = pkgStatus(pkg.startDate, pkg.endDate);
                const isActive = pkg.id === selectedId;
                const progress = pctDone(pkg.itineraries);
                return (
                  <button key={pkg.id} onClick={() => handleSelect(pkg.id)}
                    style={{
                      width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                      background: isActive ? "rgba(255,255,255,0.16)" : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.22)" : "1px solid transparent",
                      borderRadius: 10, padding: "0.625rem 0.75rem",
                      transition: "all 0.18s", position: "relative",
                    }}
                  >
                    {isActive && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: "70%", background: "#E4B55A", borderRadius: "0 2px 2px 0" }} />}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.375rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {pkg.title}
                      </div>
                      <span style={{
                        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                        background: status === "active" ? "#34D399" : status === "upcoming" ? C.gold : "rgba(255,255,255,0.25)",
                        ...(status === "active" ? { animation: "blink 1s infinite" } : {}),
                      }} />
                    </div>
                    <div style={{ fontSize: "0.5625rem", color: "rgba(255,255,255,0.38)", marginTop: "0.2rem" }}>
                      {fmtShort(pkg.startDate)} – {fmtShort(pkg.endDate)} · {pkg.itineraries.length} agenda
                    </div>
                    {pkg.itineraries.length > 0 && (
                      <div style={{ marginTop: "0.375rem", height: 2, background: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? "#34D399" : "#E4B55A", borderRadius: 2 }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Create new package (Muthawif) */}
        {role === "MUTHAWIF" && (
          <div style={{ padding: "0.75rem 0.875rem 1rem" }}>
            <button id="create-package-btn" onClick={() => setShowCreateModal(true)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: 10, border: "1.5px dashed rgba(255,255,255,0.25)", background: "transparent", color: "rgba(255,255,255,0.65)", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "all 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)"; }}
            >
              ＋ Buat Paket Baru
            </button>
          </div>
        )}
      </MobileSidebarDrawer>

      {/* ══ MAIN AREA ══ */}
      <div id="agenda-main" className="dashboard-main-area">

        {/* Header */}
        <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 900, color: C.charcoal, margin: 0, lineHeight: 1.2 }}>
              {selected ? selected.title : "Agenda Perjalanan"}
            </h2>
            <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.125rem 0 0" }}>
              {selected
                ? `${fmtDate(selected.startDate)} — ${fmtDate(selected.endDate)} · ${dayCount(selected.startDate, selected.endDate)} hari`
                : `Halo, ${userName} — pilih atau buat paket perjalanan`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {activeCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: 99, background: C.ongoingPale, fontSize: "0.75rem", fontWeight: 800, color: C.ongoing, flexShrink: 0 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.ongoing, animation: "blink 1s infinite", display: "inline-block" }} />
                {activeCount} Aktif
              </div>
            )}
            {/* Mobile: back button */}
            {mobileView === "detail" && selected && (
              <button onClick={() => setMobileView("grid")} className="mobile-back-btn"
                style={{ display: "none", alignItems: "center", gap: "0.375rem", padding: "0.4rem 0.875rem", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ← Paket
              </button>
            )}
            <Link href={role === "MUTHAWIF" ? "/dashboard/muthawif" : "/dashboard"}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: 10, textDecoration: "none", background: C.white, color: C.charcoal, border: `1.5px solid ${C.border}`, fontSize: "0.8125rem", fontWeight: 700, transition: "all 0.15s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = C.ivoryDark; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = C.white; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 5, background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>🏠</div>
              Dashboard
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main style={{ padding: "clamp(1rem,3vw,1.75rem)", flex: 1, minHeight: 0, overflowY: "auto" }}>

          {/* ── No packages ── */}
          {packages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, padding: "4rem 2rem", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.emeraldPale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1.25rem" }}>🕌</div>
              <h3 style={{ fontWeight: 800, color: C.charcoal, marginBottom: "0.5rem" }}>Belum Ada Paket Perjalanan</h3>
              <p style={{ color: C.muted, fontSize: "0.875rem", maxWidth: 320, lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {role === "MUTHAWIF"
                  ? "Buat paket jadwal pertamamu. Semua Jamaah di rentang tanggal tersebut akan otomatis melihat agenda yang kamu buat."
                  : "Muthawif Anda belum membuat jadwal perjalanan. Silakan hubungi Muthawif Anda."}
              </p>
              {role === "MUTHAWIF" && (
                <button id="create-first-package" onClick={() => setShowCreateModal(true)}
                  style={{ padding: "0.875rem 1.75rem", borderRadius: 12, border: "none", background: C.emerald, color: C.white, fontWeight: 800, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  📦 Buat Paket Pertama
                </button>
              )}
            </div>
          )}

          {/* ── Packages exist ── */}
          {packages.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Filter tabs */}
              <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                {filterTabs.map((tab) => (
                  <button key={tab.id} onClick={() => setFilter(tab.id)}
                    style={{
                      padding: "0.4rem 0.875rem", borderRadius: 99, border: "none",
                      background: filter === tab.id ? C.charcoal : C.ivoryDark,
                      color: filter === tab.id ? C.white : C.muted,
                      fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
                      fontFamily: "inherit", transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: "0.375rem",
                    }}>
                    {tab.label}
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center",
                      background: filter === tab.id ? "rgba(255,255,255,0.2)" : C.border,
                      color: filter === tab.id ? C.white : C.charcoal,
                      fontSize: "0.625rem", fontWeight: 900, padding: "0 4px",
                    }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
                {role === "MUTHAWIF" && (
                  <button id="create-package-main" onClick={() => setShowCreateModal(true)}
                    style={{ marginLeft: "auto", padding: "0.4rem 1rem", borderRadius: 99, border: `1.5px solid ${C.emerald}`, background: C.emeraldPale, color: C.emerald, fontWeight: 800, fontSize: "0.8125rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "0.375rem" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.emerald; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.emeraldPale; (e.currentTarget as HTMLButtonElement).style.color = C.emerald; }}>
                    ＋ Paket Baru
                  </button>
                )}
              </div>

              {/* Package grid */}
              {!selected && (
                <div className="pkg-grid">
                  {sortedPackages.length === 0 ? (
                    <div style={{ gridColumn: "1/-1", padding: "3rem", textAlign: "center", color: C.muted, fontSize: "0.875rem" }}>
                      Tidak ada paket dengan filter ini.
                    </div>
                  ) : (
                    sortedPackages.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        role={role}
                        isSelected={pkg.id === selectedId}
                        onClick={() => handleSelect(pkg.id)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Selected package detail */}
              {selected && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Package header card */}
                  <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: "1.125rem 1.375rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
                    {/* Package info */}
                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: "0.9375rem", color: C.charcoal, marginBottom: "0.25rem" }}>{selected.title}</div>
                      {selected.description && (
                        <div style={{ fontSize: "0.8125rem", color: C.muted, lineHeight: 1.5, marginBottom: "0.5rem" }}>{selected.description}</div>
                      )}
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        <StatusBadge status={pkgStatus(selected.startDate, selected.endDate)} />
                        <span style={{ fontSize: "0.75rem", color: C.muted }}>
                          {fmtDate(selected.startDate)} – {fmtDate(selected.endDate)} · {dayCount(selected.startDate, selected.endDate)} hari
                        </span>
                      </div>
                    </div>

                    {/* Muthawif info */}
                    {role !== "MUTHAWIF" && (
                      <>
                        <div style={{ width: 1, height: 40, background: C.border }} className="info-divider" />
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: "0 0 auto" }}>
                          <Avatar person={selected.muthawif} size={38} />
                          <div>
                            <div style={{ fontSize: "0.5625rem", fontWeight: 900, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Muthawif</div>
                            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: C.charcoal }}>{selected.muthawif.name}</div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.625rem", flex: "0 0 auto", marginLeft: "auto" }}>
                      <button onClick={() => { setSelectedId(null); setMobileView("grid"); }}
                        style={{ padding: "0.5rem 0.875rem", borderRadius: 9, border: `1px solid ${C.border}`, background: C.ivoryDark, color: C.charcoal, fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
                        ← Semua Paket
                      </button>
                      {role === "MUTHAWIF" && (
                        <button onClick={() => handlePackageDeleted(selected.id)}
                          style={{ padding: "0.5rem 0.875rem", borderRadius: 9, border: "1.5px solid #FECACA", background: "#FEF2F2", color: C.error, fontWeight: 700, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
                          🗑️ Hapus Paket
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Itinerary timeline */}
                  <ItineraryTimeline
                    packageId={selected.id}
                    initialItineraries={selected.itineraries}
                    role={role}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create package modal */}
      {showCreateModal && (
        <CreatePackageModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePackageCreated}
        />
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* Package grid: responsive columns */
        .pkg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .info-divider { display: block !important; }
        .mobile-back-btn { display: none !important; }

        @media (max-width: 768px) {
          .pkg-grid { grid-template-columns: 1fr; }
          .info-divider { display: none !important; }
          .mobile-back-btn { display: flex !important; }
        }
        @media (min-width: 1280px) {
          .pkg-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
