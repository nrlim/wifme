"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import { supabaseClient, bucketName, compressImage } from "@/lib/supabase-client";

/* ─── Types ─────────────────────────────────────────── */
export type ItineraryStatus = "PLANNED" | "ONGOING" | "COMPLETED";

export interface ServiceLog {
  id: string;
  photoUrl: string | null;
  notes: string | null;
  checkInTime: string;
}

export interface ItineraryItem {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  locationName: string | null;
  status: ItineraryStatus;
  logs: ServiceLog[];
}

interface ItineraryTimelineProps {
  packageId: string;
  initialItineraries: ItineraryItem[];
  /** "JAMAAH" | "MUTHAWIF" | "AMIR" */
  role: string;
}

/* ─── Design tokens ─────────────────────────────────── */
const C = {
  emerald:     "#1B6B4A",
  emeraldPale: "#EBF5EF",
  gold:        "#C4973B",
  goldPale:    "rgba(196,151,59,0.12)",
  charcoal:    "#2C2C2C",
  muted:       "#8A8A8A",
  border:      "#E0D8CC",
  ivory:       "#FAF7F2",
  ivoryDark:   "#F0EBE1",
  white:       "#FFFFFF",
  error:       "#C0392B",
  blue:        "#3B82F6",
  ongoing:     "#D97706",
  ongoingPale: "rgba(217,119,6,0.1)",
};

const STATUS_CONFIG: Record<ItineraryStatus, { label: string; dot: string; bg: string; text: string }> = {
  PLANNED:   { label: "Direncanakan", dot: C.gold,    bg: C.goldPale,    text: C.gold    },
  ONGOING:   { label: "Berlangsung",  dot: C.ongoing, bg: C.ongoingPale, text: C.ongoing },
  COMPLETED: { label: "Selesai",      dot: C.emerald, bg: C.emeraldPale, text: C.emerald },
};

/* ─── Skeleton ──────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ display: "flex", gap: "0.75rem", padding: "1rem", background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: "0.875rem", animation: "pulse 1.5s ease-in-out infinite" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.ivoryDark, flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 13, background: C.ivoryDark, borderRadius: 6, width: "55%", marginBottom: 8 }} />
        <div style={{ height: 10, background: C.ivoryDark, borderRadius: 6, width: "35%" }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

/* ─── Add Itinerary Modal ───────────────────────────── */
function AddItineraryModal({ packageId, onClose, onCreated }: {
  packageId: string;
  onClose: () => void;
  onCreated: (item: ItineraryItem) => void;
}) {
  const [form, setForm] = useState({ title: "", description: "", startTime: "", endTime: "", locationName: "" });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!form.title || !form.startTime || !form.endTime) {
      setError("Judul, Waktu Mulai, dan Waktu Selesai wajib diisi.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/itineraries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId, ...form }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Gagal membuat agenda."); return; }
        onCreated(data.itinerary);
        onClose();
      } catch {
        setError("Terjadi kesalahan. Coba lagi.");
      }
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.875rem", border: `1.5px solid ${C.border}`,
    borderRadius: 10, fontSize: "0.9rem", color: C.charcoal, outline: "none",
    fontFamily: "inherit", background: C.ivory, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,44,44,0.5)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: "20px 20px 16px 16px", width: "100%", maxWidth: 560, padding: "1.75rem", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "-0.5rem auto 1.25rem" }} />
        <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: C.charcoal, marginBottom: "1.25rem" }}>➕ Tambah Agenda Baru</h3>

        {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: C.error, padding: "0.625rem 0.875rem", borderRadius: 8, fontSize: "0.8125rem", marginBottom: "1rem" }}>{error}</div>}

        {[
          { key: "title",        label: "Judul Agenda *",   placeholder: "Contoh: Tawaf Qudum",             type: "text" },
          { key: "locationName", label: "Lokasi",           placeholder: "Contoh: Masjidil Haram, Makkah", type: "text" },
          { key: "startTime",    label: "Waktu Mulai *",    placeholder: "",                                type: "datetime-local" },
          { key: "endTime",      label: "Waktu Selesai *",  placeholder: "",                                type: "datetime-local" },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key} style={{ marginBottom: "0.875rem" }}>
            <label style={labelStyle}>{label}</label>
            <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
          </div>
        ))}

        <div style={{ marginBottom: "1.375rem" }}>
          <label style={labelStyle}>Keterangan</label>
          <textarea rows={3} placeholder="Detail kegiatan, instruksi, atau catatan..."
            value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.875rem", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit" }}>Batal</button>
          <button disabled={isPending} onClick={handleSubmit} style={{ flex: 2, padding: "0.875rem", borderRadius: 12, border: "none", background: isPending ? C.emeraldPale : C.emerald, color: isPending ? C.emerald : C.white, fontWeight: 800, fontSize: "0.9375rem", cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.2s", minHeight: 48 }}>
            {isPending ? "Menyimpan..." : "💾 Simpan Agenda"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Check-in Modal ────────────────────────────────── */
function CheckInModal({ itineraryId, itineraryTitle, onClose, onLogged }: {
  itineraryId: string;
  itineraryTitle: string;
  onClose: () => void;
  onLogged: (itineraryId: string, log: ServiceLog, newStatus: ItineraryStatus) => void;
}) {
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/itineraries/${itineraryId}/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes, photoUrl }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Gagal check-in."); return; }
        onLogged(itineraryId, data.log, "ONGOING");
        onClose();
      } catch {
        setError("Terjadi kesalahan. Coba lagi.");
      }
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.875rem", border: `1.5px solid ${C.border}`,
    borderRadius: 10, fontSize: "0.9rem", color: C.charcoal, outline: "none",
    fontFamily: "inherit", background: C.ivory, boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,44,44,0.5)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: C.white, borderRadius: "20px 20px 16px 16px", width: "100%", maxWidth: 520, padding: "1.75rem", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "-0.5rem auto 1.25rem" }} />
        <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: C.charcoal, marginBottom: "0.375rem" }}>📍 Check-in Agenda</h3>
        <p style={{ fontSize: "0.8125rem", color: C.muted, marginBottom: "1.25rem" }}>{itineraryTitle}</p>

        {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: C.error, padding: "0.625rem 0.875rem", borderRadius: 8, fontSize: "0.8125rem", marginBottom: "1rem" }}>{error}</div>}

        <div style={{ marginBottom: "0.875rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem" }}>Foto Bukti (opsional)</label>
          {photoUrl ? (
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1.5px solid ${C.border}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Bukti Check-in" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
              <button onClick={() => setPhotoUrl("")} disabled={isPending}
                 style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                 ✕
              </button>
            </div>
          ) : (
            <label className="btn" style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "center", color: isPending ? C.muted : C.charcoal, cursor: isPending ? "not-allowed" : "pointer", borderStyle: "dashed", minHeight: 60, background: isPending ? C.ivoryDark : C.ivory }}>
              {isPending && !photoUrl ? "Mengunggah..." : "📷 Pilih Foto Bukti (Klik di sini)"}
              <input type="file" accept="image/*" style={{ display: "none" }} disabled={isPending}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  startTransition(async () => {
                    try {
                      const compressed = await compressImage(file, 0.5);
                      const fileExt = compressed.name.split('.').pop() || "jpg";
                      const fileName = `checkin_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                      const filePath = `muthawif/${fileName}`;
                      const { error } = await supabaseClient.storage.from(bucketName).upload(filePath, compressed);
                      if (error) throw error;
                      const { data } = supabaseClient.storage.from(bucketName).getPublicUrl(filePath);
                      setPhotoUrl(data.publicUrl);
                    } catch (err) {
                      setError("Gagal mengunggah gambar. Pastikan ukuran file sesuai dan koneksi stabil.");
                    }
                  });
                }} 
              />
            </label>
          )}
        </div>

        <div style={{ marginBottom: "1.375rem" }}>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.3rem" }}>Catatan Lapangan</label>
          <textarea rows={3} placeholder="Kondisi Jamaah, situasi lokasi, catatan penting..."
            value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.875rem", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit" }}>Batal</button>
          <button disabled={isPending} onClick={handleSubmit} style={{ flex: 2, padding: "0.875rem", borderRadius: 12, border: "none", background: isPending ? C.ongoingPale : C.ongoing, color: isPending ? C.ongoing : C.white, fontWeight: 800, fontSize: "0.9375rem", cursor: isPending ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.2s", minHeight: 48 }}>
            {isPending ? "Mengirim..." : "📍 Kirim Check-in"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Single Timeline Card ──────────────────────────── */
function TimelineCard({ item, role, isLast, onStatusChange, onCheckIn, onDelete }: {
  item: ItineraryItem;
  role: string;
  isLast: boolean;
  onStatusChange: (id: string, status: ItineraryStatus) => void;
  onCheckIn: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState<ItineraryStatus>(item.status);
  const [isUpdating, startTransition] = useTransition();
  const cfg = STATUS_CONFIG[localStatus];

  const handleStatusChange = (newStatus: ItineraryStatus) => {
    setLocalStatus(newStatus);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/itineraries/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) { setLocalStatus(item.status); } else { onStatusChange(item.id, newStatus); }
      } catch { setLocalStatus(item.status); }
    });
  };

  const fmt = (ts: string, mode: "time" | "date") =>
    mode === "time"
      ? new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  /* dot appearance by status */
  const dotBg     = localStatus === "COMPLETED" ? C.emerald : localStatus === "ONGOING" ? C.ongoing : C.white;
  const dotBorder = localStatus === "COMPLETED" ? C.emerald : localStatus === "ONGOING" ? C.ongoing : C.gold;
  const dotContent =
    localStatus === "COMPLETED"
      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
      : localStatus === "ONGOING"
        ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: "white", display: "block" }} />
        : <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold, display: "block" }} />;

  /* connector line gradient */
  const lineGrad =
    localStatus === "COMPLETED" ? `linear-gradient(to bottom, ${C.emerald}, ${C.emerald}40)` :
    localStatus === "ONGOING"   ? `linear-gradient(to bottom, ${C.ongoing}, ${C.ongoing}30)` :
    "linear-gradient(to bottom, #D1C8BC, #E0D8CC88)";

  /* card accent bar */
  const accentGrad =
    localStatus === "COMPLETED" ? `linear-gradient(90deg, ${C.emerald}, #34D399)` :
    localStatus === "ONGOING"   ? `linear-gradient(90deg, ${C.ongoing}, #FBBF24)` :
    `linear-gradient(90deg, ${C.gold}, #E4B55A)`;

  const chipStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: "0.25rem",
    background: C.ivory, border: `1px solid ${C.border}`, borderRadius: 99,
    padding: "0.2rem 0.625rem", fontSize: "0.6875rem", fontWeight: 700, color: C.charcoal,
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", position: "relative" }}>
      {/* ── Left: dot + line ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
        <div
          className={localStatus === "ONGOING" ? "tl-dot-pulse" : ""}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: dotBg, border: `2.5px solid ${dotBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1, marginTop: 16, flexShrink: 0,
            boxShadow:
              localStatus === "ONGOING"   ? `0 0 0 5px ${C.ongoingPale}` :
              localStatus === "COMPLETED" ? `0 0 0 4px ${C.emeraldPale}` :
              "0 0 0 4px rgba(196,151,59,0.1)",
            transition: "all 0.3s",
          }}
        >
          {dotContent}
        </div>
        {!isLast && (
          <div style={{ flex: 1, width: 2, minHeight: 24, background: lineGrad, borderRadius: 2, marginTop: 4 }} />
        )}
      </div>

      {/* ── Right: Card ── */}
      <div style={{
        flex: 1, marginLeft: "0.75rem", marginBottom: isLast ? 0 : "0.875rem", marginTop: 8,
        background: C.white, borderRadius: 14, overflow: "hidden",
        border: `1.5px solid ${localStatus === "ONGOING" ? `${C.ongoing}55` : localStatus === "COMPLETED" ? `${C.emerald}44` : C.border}`,
        boxShadow:
          localStatus === "ONGOING"   ? "0 4px 20px rgba(217,119,6,0.08)" :
          localStatus === "COMPLETED" ? "0 4px 16px rgba(27,107,74,0.07)" :
          "0 2px 8px rgba(44,44,44,0.04)",
        transition: "all 0.25s",
        opacity: isUpdating ? 0.75 : 1,
      }}>
        {/* Accent bar */}
        <div style={{ height: 3, background: accentGrad }} />

        {/* Header (always visible) */}
        <div style={{ padding: "0.875rem 1.125rem", cursor: "pointer", userSelect: "none" }} onClick={() => setExpanded(e => !e)}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: C.charcoal, flex: 1, lineHeight: 1.3 }}>
              {item.title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.625rem", borderRadius: 99, fontSize: "0.625rem", fontWeight: 800, background: cfg.bg, color: cfg.text, whiteSpace: "nowrap" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
                {cfg.label}
              </span>
              <span style={{ color: C.muted, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none", fontSize: "0.75rem" }}>▾</span>
            </div>
          </div>

          {/* Chips row */}
          <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={chipStyle}>🕐 {fmt(item.startTime, "date")} · {fmt(item.startTime, "time")}–{fmt(item.endTime, "time")}</span>
            {item.locationName && <span style={chipStyle}>📍 {item.locationName}</span>}
            {item.logs.length > 0 && (
              <span style={{ ...chipStyle, background: C.emeraldPale, borderColor: `${C.emerald}33`, color: C.emerald }}>
                ✅ {item.logs.length} check-in
              </span>
            )}
          </div>

          {/* Description preview */}
          {item.description && !expanded && (
            <p style={{ fontSize: "0.8rem", color: C.muted, marginTop: "0.375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.5 }}>
              {item.description}
            </p>
          )}
        </div>

        {/* Expanded body */}
        {expanded && (
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {item.description && (
              <div style={{ padding: "0.875rem 1.125rem 0" }}>
                <p style={{ fontSize: "0.875rem", color: "#4A4A4A", lineHeight: 1.65, margin: 0 }}>{item.description}</p>
              </div>
            )}

            {/* Service logs */}
            {item.logs.length > 0 && (
              <div style={{ padding: "0.75rem 1.125rem 0" }}>
                <p style={{ fontSize: "0.625rem", fontWeight: 900, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                  Laporan Check-in
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {item.logs.map((log) => (
                    <div key={log.id} style={{ background: C.ivory, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.625rem 0.875rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 800, color: C.emerald }}>
                        📍 {new Date(log.checkInTime).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {log.notes && <p style={{ fontSize: "0.8125rem", color: "#4A4A4A", lineHeight: 1.5, margin: 0 }}>{log.notes}</p>}
                      {log.photoUrl && <a href={log.photoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: C.blue, fontWeight: 700, textDecoration: "underline" }}>🖼️ Lihat Foto</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Muthawif actions */}
            {role === "MUTHAWIF" && (
              <div style={{ padding: "0.875rem 1.125rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {localStatus !== "COMPLETED" && (
                  <button id={`checkin-${item.id}`} onClick={(e) => { e.stopPropagation(); onCheckIn(item); }}
                    style={{ flex: "1 1 auto", minWidth: 100, padding: "0.625rem 1rem", borderRadius: 9, border: "none", background: C.ongoing, color: C.white, fontWeight: 800, fontSize: "0.8125rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                    📍 Check-in
                  </button>
                )}
                {localStatus === "PLANNED" && (
                  <button id={`start-${item.id}`} disabled={isUpdating} onClick={(e) => { e.stopPropagation(); handleStatusChange("ONGOING"); }}
                    style={{ flex: "1 1 auto", minWidth: 100, padding: "0.625rem 1rem", borderRadius: 9, border: `1.5px solid ${C.ongoing}`, background: C.white, color: C.ongoing, fontWeight: 800, fontSize: "0.8125rem", cursor: isUpdating ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
                    ▶ Mulai
                  </button>
                )}
                {localStatus === "ONGOING" && (
                  <button id={`complete-${item.id}`} disabled={isUpdating} onClick={(e) => { e.stopPropagation(); handleStatusChange("COMPLETED"); }}
                    style={{ flex: "1 1 auto", minWidth: 120, padding: "0.625rem 1rem", borderRadius: 9, border: "none", background: isUpdating ? C.emeraldPale : C.emerald, color: isUpdating ? C.emerald : C.white, fontWeight: 800, fontSize: "0.8125rem", cursor: isUpdating ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", transition: "all 0.2s" }}>
                    {isUpdating ? "Menyimpan..." : "✅ Selesaikan"}
                  </button>
                )}
                <button id={`delete-${item.id}`} onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  style={{ padding: "0.625rem 0.75rem", borderRadius: 9, border: "1.5px solid #FECACA", background: "#FEF2F2", color: C.error, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Hapus Agenda">
                  🗑️
                </button>
              </div>
            )}

            {/* Jamaah view */}
            {role === "JAMAAH" && (
              <div style={{ padding: "0.75rem 1.125rem" }}>
                {item.logs.length === 0 && localStatus === "PLANNED" && (
                  <div style={{ fontSize: "0.8125rem", color: C.muted, fontStyle: "italic", textAlign: "center", padding: "0.375rem" }}>
                    Menunggu Muthawif memulai agenda ini...
                  </div>
                )}
                {item.logs.length > 0 && localStatus !== "COMPLETED" && (
                  <div style={{ background: "rgba(217,119,6,0.07)", border: `1px solid ${C.ongoing}33`, borderRadius: 9, padding: "0.5rem 0.875rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: C.ongoing, fontWeight: 700 }}>
                    🔔 Muthawif sudah check-in! Agenda sedang berlangsung.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Export: ItineraryTimeline ─────────────────── */
export default function ItineraryTimeline({ packageId, initialItineraries, role }: ItineraryTimelineProps) {
  const [items, setItems] = useState<ItineraryItem[]>(initialItineraries);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [checkInTarget, setCheckInTarget] = useState<ItineraryItem | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/itineraries?packageId=${packageId}`);
      const data = await res.json();
      if (res.ok) setItems(data.itineraries);
    } finally { setLoading(false); }
  }, [packageId]);

  const handleCreated = (item: ItineraryItem) => {
    setItems((prev) => [...prev, item].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
  };
  const handleStatusChange = (id: string, status: ItineraryStatus) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  };
  const handleLogged = (itineraryId: string, log: ServiceLog, newStatus: ItineraryStatus) => {
    setItems((prev) => prev.map((it) => it.id === itineraryId ? { ...it, logs: [...it.logs, log], status: newStatus } : it));
  };
  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    try { await fetch(`/api/itineraries/${id}`, { method: "DELETE" }); } catch { refresh(); }
  };

  const total      = items.length;
  const completed  = items.filter((i) => i.status === "COMPLETED").length;
  const ongoing    = items.filter((i) => i.status === "ONGOING").length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div id="itinerary-timeline" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* ── Summary Header ── */}
      <div style={{ background: "linear-gradient(135deg, #1B6B4A 0%, #2A8A60 100%)", borderRadius: 18, padding: "1.25rem 1.5rem", color: C.white, position: "relative", overflow: "hidden" }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 40, bottom: -30, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.875rem", position: "relative" }}>
          <div>
            <div style={{ fontSize: "0.6875rem", fontWeight: 800, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>Agenda Perjalanan</div>
            <div style={{ fontSize: "1.375rem", fontWeight: 900, lineHeight: 1.2 }}>
              {total > 0 ? `${completed} / ${total} Selesai` : "Belum Ada Agenda"}
            </div>
            {ongoing > 0 && (
              <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.8, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.ongoing, display: "inline-block", animation: "blink 1s infinite" }} />
                {ongoing} agenda sedang berlangsung
              </div>
            )}
          </div>
          {/* Stats pills */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {[
              { label: "Direncanakan", val: items.filter((i) => i.status === "PLANNED").length, clr: C.gold },
              { label: "Berjalan",     val: ongoing,   clr: C.ongoing },
              { label: "Selesai",      val: completed, clr: "#10B981" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "0.5rem 0.75rem", backdropFilter: "blur(4px)", textAlign: "center", minWidth: 64 }}>
                <div style={{ fontSize: "1.125rem", fontWeight: 900, color: s.clr }}>{s.val}</div>
                <div style={{ fontSize: "0.5625rem", fontWeight: 800, opacity: 0.65 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ marginTop: "1rem", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", opacity: 0.7, marginBottom: "0.375rem", fontWeight: 700 }}>
              <span>Progress Kepatuhan</span>
              <span>{progressPct}%</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #10B981, #34D399)", borderRadius: 3, transition: "width 0.6s ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Add Button (Muthawif only) ── */}
      {role === "MUTHAWIF" && (
        <button id="add-itinerary-btn" onClick={() => setShowAddModal(true)}
          style={{ width: "100%", minHeight: 48, padding: "0.875rem", borderRadius: 14, border: `2px dashed ${C.emerald}`, background: C.emeraldPale, color: C.emerald, fontWeight: 800, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "all 0.2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.emerald; (e.currentTarget as HTMLButtonElement).style.color = C.white; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.emeraldPale; (e.currentTarget as HTMLButtonElement).style.color = C.emerald; }}>
          ➕ Tambah Agenda Baru
        </button>
      )}

      {/* ── Skeleton ── */}
      {loading && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

      {/* ── Empty State ── */}
      {!loading && items.length === 0 && (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "3rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🕌</div>
          <p style={{ fontWeight: 800, color: C.charcoal, marginBottom: "0.375rem" }}>Belum Ada Agenda</p>
          <p style={{ fontSize: "0.875rem", color: C.muted }}>
            {role === "MUTHAWIF" ? "Tambahkan agenda perjalanan untuk booking ini." : "Muthawif Anda belum membuat agenda perjalanan."}
          </p>
        </div>
      )}

      {/* ── Timeline Items ── */}
      {!loading && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((item, idx) => (
            <TimelineCard
              key={item.id}
              item={item}
              role={role}
              isLast={idx === items.length - 1}
              onStatusChange={handleStatusChange}
              onCheckIn={setCheckInTarget}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Refresh button ── */}
      <button onClick={refresh} disabled={loading}
        style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.625rem", color: C.muted, fontSize: "0.8125rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", transition: "all 0.2s" }}>
        🔄 {loading ? "Memuat..." : "Perbarui Status"}
      </button>

      {/* ── Modals ── */}
      {showAddModal && <AddItineraryModal packageId={packageId} onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
      {checkInTarget && <CheckInModal itineraryId={checkInTarget.id} itineraryTitle={checkInTarget.title} onClose={() => setCheckInTarget(null)} onLogged={handleLogged} />}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes tl-pulse {
          0%,100% { box-shadow: 0 0 0 5px rgba(217,119,6,0.15); }
          50%      { box-shadow: 0 0 0 9px rgba(217,119,6,0.05); }
        }
        .tl-dot-pulse { animation: tl-pulse 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
