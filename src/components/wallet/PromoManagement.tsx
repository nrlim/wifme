"use client";

import { useState, useTransition, useCallback } from "react";
import {
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotions,
} from "@/actions/promotions";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Promotion {
  id: string;
  code: string;
  description: string | null;
  type: "FIXED_AMOUNT" | "PERCENTAGE";
  value: number;
  minBookingAmount: number;
  maxUsage: number | null;
  usedCount: number;
  expiryDate: Date | string | null;
  status: "ACTIVE" | "EXPIRED" | "DISABLED";
  discountTarget: string;
  createdAt: Date | string;
  _count?: { bookings: number };
}

interface PromoManagementProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any;
}

// ── Color constants ────────────────────────────────────────────────────────────
const C = {
  emerald: "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  gold: "#C4973B",
  goldPale: "rgba(196,151,59,0.12)",
  error: "#C0392B",
  errorPale: "#FEF2F2",
  charcoal: "#2C2C2C",
  muted: "#8A8A8A",
  border: "#E0D8CC",
  ivory: "#FAF7F2",
  white: "#FFFFFF",
  indigo: "#4F46E5",
  indigoPale: "#EEF2FF",
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:   { label: "Aktif",       bg: C.emeraldPale, color: C.emerald },
  EXPIRED:  { label: "Kadaluarsa",  bg: C.goldPale,    color: C.gold    },
  DISABLED: { label: "Nonaktif",    bg: "#F3F4F6",     color: "#6B7280" },
};

const TYPE_META: Record<string, { label: string; color: string }> = {
  FIXED_AMOUNT: { label: "Nominal (IDR)", color: C.indigo   },
  PERCENTAGE:   { label: "Persentase (%)", color: C.emerald },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function DiscountBadge({ type, value }: { type: string; value: number }) {
  const isPercent = type === "PERCENTAGE";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.25rem 0.75rem",
        borderRadius: 99,
        fontWeight: 800,
        fontSize: "0.875rem",
        background: isPercent
          ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
          : "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
        color: isPercent ? "#92400E" : "#1E3A8A",
        border: `1px solid ${isPercent ? "#FCD34D" : "#93C5FD"}`,
      }}
    >
      🏷️ {isPercent ? `${value}%` : `Rp ${value.toLocaleString("id-ID")}`}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PromoManagement({ initialData }: PromoManagementProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "PERCENTAGE" as "FIXED_AMOUNT" | "PERCENTAGE",
    value: "",
    minBookingAmount: "",
    maxUsage: "",
    expiryDate: "",
    discountTarget: "PLATFORM",
  });

  const resetForm = () => {
    setForm({
      code: "", description: "", type: "PERCENTAGE", value: "",
      minBookingAmount: "", maxUsage: "", expiryDate: "", discountTarget: "PLATFORM",
    });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const refresh = useCallback(async () => {
    const fresh = await getPromotions({ page: data.page });
    setData(fresh as typeof data);
  }, [data.page]);

  const handleCreate = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await createPromotion({
          code: form.code,
          description: form.description || undefined,
          type: form.type,
          value: parseFloat(form.value),
          minBookingAmount: form.minBookingAmount ? parseFloat(form.minBookingAmount) : 0,
          maxUsage: form.maxUsage ? parseInt(form.maxUsage) : null,
          expiryDate: form.expiryDate || null,
          discountTarget: form.discountTarget,
        });
        setSuccess(`Kode promo "${form.code.toUpperCase()}" berhasil dibuat!`);
        resetForm();
        await refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
      }
    });
  };

  const handleToggleStatus = (promo: Promotion) => {
    const newStatus = promo.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    setError(null);
    startTransition(async () => {
      try {
        await updatePromotion(promo.id, { status: newStatus });
        setSuccess(`Status kode "${promo.code}" diubah ke ${newStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}.`);
        await refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal mengubah status.");
      }
    });
  };

  const handleDelete = (promo: Promotion) => {
    if (!confirm(`Hapus kode promo "${promo.code}"? Tindakan ini permanen.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deletePromotion(promo.id);
        setSuccess(`Kode promo "${promo.code}" berhasil dihapus.`);
        await refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal menghapus promo.");
      }
    });
  };

  const totalActive  = data.items.filter((p: Promotion) => p.status === "ACTIVE").length;
  const totalUsage   = data.items.reduce((s: number, p: Promotion) => s + p.usedCount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── KPI Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "1rem" }}>
        {[
          { label: "Total Promo", value: data.total, color: C.charcoal, bg: "#F3F4F6" },
          { label: "Promo Aktif",  value: totalActive,  color: C.emerald, bg: C.emeraldPale },
          { label: "Total Pemakaian", value: totalUsage, color: C.indigo, bg: C.indigoPale },
        ].map((k) => (
          <div key={k.label} style={{
            background: "white", borderRadius: 16, border: `1px solid ${C.border}`,
            padding: "1.125rem 1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
              background: k.color, borderRadius: "4px 0 0 4px",
            }} />
            <div style={{ fontSize: "0.625rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
              {k.label}
            </div>
            <div style={{ fontSize: "1.625rem", fontWeight: 900, color: k.color, lineHeight: 1 }}>
              {k.value.toLocaleString("id-ID")}
            </div>
          </div>
        ))}
      </div>

      {/* ── Feedback alerts ── */}
      {error && (
        <div style={{ padding: "0.875rem 1.125rem", borderRadius: 12, background: C.errorPale, border: `1px solid ${C.error}33`, color: C.error, fontWeight: 600, fontSize: "0.875rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          ❌ {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.error, cursor: "pointer", fontSize: "1rem" }}>×</button>
        </div>
      )}
      {success && (
        <div style={{ padding: "0.875rem 1.125rem", borderRadius: 12, background: C.emeraldPale, border: `1px solid ${C.emerald}33`, color: C.emerald, fontWeight: 600, fontSize: "0.875rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          ✅ {success}
          <button onClick={() => setSuccess(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.emerald, cursor: "pointer", fontSize: "1rem" }}>×</button>
        </div>
      )}

      {/* ── Header + Create button ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: "1.0625rem", color: C.charcoal, marginBottom: "0.125rem" }}>
            Manajemen Kode Promo
          </h3>
          <p style={{ fontSize: "0.8125rem", color: C.muted, margin: 0 }}>
            {data.total} kode promo terdaftar
          </p>
        </div>
        <button
          id="create-promo-btn"
          onClick={() => { setShowForm(!showForm); setError(null); }}
          style={{
            padding: "0.625rem 1.25rem",
            borderRadius: 10,
            border: "none",
            background: showForm ? "#F3F4F6" : `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
            color: showForm ? C.charcoal : "white",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          {showForm ? "✕ Batal" : "＋ Buat Promo Baru"}
        </button>
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <div style={{
          background: "white", borderRadius: 20, border: `1.5px solid ${C.emerald}33`,
          padding: "1.5rem", boxShadow: "0 4px 24px rgba(27,107,74,0.08)",
          display: "flex", flexDirection: "column", gap: "1.125rem",
        }}>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: C.charcoal, borderBottom: `1px solid ${C.border}`, paddingBottom: "0.875rem" }}>
            🎟️ Buat Kode Promo Baru
          </div>

          {/* Row 1: Code + Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Kode Promo *</span>
              <input
                id="promo-form-code"
                placeholder="UMRAH10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                maxLength={30}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tipe Diskon *</span>
              <select id="promo-form-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "FIXED_AMOUNT" | "PERCENTAGE" })} style={inputStyle}>
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED_AMOUNT">Nominal Tetap (IDR)</option>
              </select>
            </label>
          </div>

          {/* Row 2: Value + Min Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Nilai Diskon {form.type === "PERCENTAGE" ? "(%)" : "(IDR)"} *
              </span>
              <input
                id="promo-form-value"
                type="number"
                placeholder={form.type === "PERCENTAGE" ? "10" : "50000"}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                min={0}
                max={form.type === "PERCENTAGE" ? 100 : undefined}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Min. Total Booking (IDR)</span>
              <input
                id="promo-form-min"
                type="number"
                placeholder="500000"
                value={form.minBookingAmount}
                onChange={(e) => setForm({ ...form, minBookingAmount: e.target.value })}
                min={0}
                style={inputStyle}
              />
            </label>
          </div>

          {/* Row 3: Max Usage + Expiry */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Maks. Pemakaian (kosong=∞)</span>
              <input
                id="promo-form-maxusage"
                type="number"
                placeholder="100"
                value={form.maxUsage}
                onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
                min={1}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tanggal Kadaluarsa</span>
              <input
                id="promo-form-expiry"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                style={inputStyle}
              />
            </label>
          </div>

          {/* Row 4: Description + Target */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Deskripsi (opsional)</span>
              <input
                id="promo-form-desc"
                placeholder="Promo Ramadhan 2025"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={200}
                style={inputStyle}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Target Potongan</span>
              <select id="promo-form-target" value={form.discountTarget} onChange={(e) => setForm({ ...form, discountTarget: e.target.value })} style={inputStyle}>
                <option value="PLATFORM">Platform (Amir menanggung)</option>
                <option value="MUTHAWIF">Muthawif (share pendapatan)</option>
              </select>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem", borderTop: `1px solid ${C.border}` }}>
            <button onClick={resetForm} style={{ padding: "0.625rem 1.25rem", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "white", color: C.charcoal, fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
              Batal
            </button>
            <button
              id="promo-form-submit"
              onClick={handleCreate}
              disabled={isPending || !form.code || !form.value}
              style={{
                padding: "0.625rem 1.5rem", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
                color: "white", fontWeight: 700, cursor: isPending || !form.code || !form.value ? "not-allowed" : "pointer",
                opacity: isPending || !form.code || !form.value ? 0.6 : 1, fontSize: "0.875rem",
              }}
            >
              {isPending ? "Menyimpan..." : "💾 Simpan Promo"}
            </button>
          </div>
        </div>
      )}

      {/* ── Promo Table ── */}
      <div style={{ background: "white", borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr 1fr", gap: "0", padding: "0.75rem 1.5rem", background: C.ivory, borderBottom: `1px solid ${C.border}` }} className="promo-th">
          {["Kode & Deskripsi", "Diskon", "Tipe", "Pemakaian", "Status", "Aksi"].map((h) => (
            <div key={h} style={{ fontSize: "0.5875rem", fontWeight: 900, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</div>
          ))}
        </div>

        {data.items.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: C.muted, fontSize: "0.9375rem" }}>
            Belum ada kode promo. Buat yang pertama! 🎉
          </div>
        ) : (
          data.items.map((promo: Promotion, idx: number) => {
            const sm = STATUS_META[promo.status] ?? STATUS_META.DISABLED;
            const tm = TYPE_META[promo.type] ?? TYPE_META.PERCENTAGE;
            const usageLabel = promo.maxUsage !== null
              ? `${promo.usedCount} / ${promo.maxUsage}`
              : `${promo.usedCount} / ∞`;
            const usagePct = promo.maxUsage ? (promo.usedCount / promo.maxUsage) * 100 : 0;
            const isExpired = promo.expiryDate && new Date(promo.expiryDate) < new Date();

            return (
              <div key={promo.id} style={{ borderBottom: idx < data.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                {/* Desktop row */}
                <div
                  className="promo-row"
                  style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.8fr 1fr", gap: "0", padding: "1rem 1.5rem", alignItems: "center" }}
                >
                  {/* Code + desc */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <code style={{ fontWeight: 800, fontSize: "0.875rem", color: C.charcoal, background: C.ivory, padding: "0.15rem 0.5rem", borderRadius: 6, border: `1px solid ${C.border}` }}>
                        {promo.code}
                      </code>
                      {isExpired && (
                        <span style={{ fontSize: "0.5625rem", fontWeight: 800, color: C.gold, background: C.goldPale, padding: "0.1rem 0.4rem", borderRadius: 99 }}>EXPIRED</span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: C.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {promo.description || "—"}
                    </div>
                    {promo.minBookingAmount > 0 && (
                      <div style={{ fontSize: "0.5625rem", color: C.muted, marginTop: "0.1rem" }}>
                        Min. Rp {promo.minBookingAmount.toLocaleString("id-ID")}
                      </div>
                    )}
                  </div>
                  {/* Diskon value */}
                  <div>
                    <DiscountBadge type={promo.type} value={promo.value} />
                    {promo.expiryDate && (
                      <div style={{ fontSize: "0.5625rem", color: C.muted, marginTop: "0.3rem" }}>
                        s/d {new Date(promo.expiryDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>
                  {/* Type */}
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: tm.color }}>{tm.label}</div>
                  {/* Usage */}
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.charcoal, marginBottom: "0.25rem" }}>{usageLabel}</div>
                    {promo.maxUsage !== null && (
                      <div style={{ height: 4, borderRadius: 99, background: "#E5E7EB", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, background: usagePct >= 90 ? C.error : C.emerald, width: `${Math.min(100, usagePct)}%`, transition: "width 0.3s" }} />
                      </div>
                    )}
                  </div>
                  {/* Status */}
                  <div>
                    <span style={{ padding: "0.25rem 0.625rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 700, background: sm.bg, color: sm.color }}>
                      {sm.label}
                    </span>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleToggleStatus(promo)}
                      disabled={isPending}
                      style={{
                        padding: "0.375rem 0.75rem", borderRadius: 8, border: `1.5px solid ${promo.status === "ACTIVE" ? "#E5E7EB" : C.emerald}`, fontWeight: 700, fontSize: "0.6875rem",
                        background: promo.status === "ACTIVE" ? "#F3F4F6" : C.emeraldPale,
                        color: promo.status === "ACTIVE" ? "#374151" : C.emerald, cursor: isPending ? "not-allowed" : "pointer",
                      }}
                    >
                      {promo.status === "ACTIVE" ? "⏸ Nonaktifkan" : "▶ Aktifkan"}
                    </button>
                    {promo.usedCount === 0 && (
                      <button
                        onClick={() => handleDelete(promo)}
                        disabled={isPending}
                        style={{ padding: "0.375rem 0.75rem", borderRadius: 8, border: `1.5px solid ${C.error}33`, fontWeight: 700, fontSize: "0.6875rem", background: C.errorPale, color: C.error, cursor: isPending ? "not-allowed" : "pointer" }}
                      >
                        🗑 Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile card view */}
                <div className="promo-mobile-card" style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <code style={{ fontWeight: 800, fontSize: "1rem", color: C.charcoal }}>{promo.code}</code>
                      {promo.description && <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "0.125rem" }}>{promo.description}</div>}
                    </div>
                    <span style={{ padding: "0.25rem 0.625rem", borderRadius: 99, fontSize: "0.6875rem", fontWeight: 700, background: sm.bg, color: sm.color }}>{sm.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <DiscountBadge type={promo.type} value={promo.value} />
                    <span style={{ fontSize: "0.6875rem", color: C.muted }}>{usageLabel} pemakaian</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleToggleStatus(promo)} disabled={isPending} style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: `1.5px solid ${C.border}`, fontWeight: 700, fontSize: "0.75rem", background: "white", color: C.charcoal, cursor: "pointer" }}>
                      {promo.status === "ACTIVE" ? "⏸ Nonaktifkan" : "▶ Aktifkan"}
                    </button>
                    {promo.usedCount === 0 && (
                      <button onClick={() => handleDelete(promo)} disabled={isPending} style={{ padding: "0.5rem 1rem", borderRadius: 8, border: `1.5px solid ${C.error}33`, fontWeight: 700, fontSize: "0.75rem", background: C.errorPale, color: C.error, cursor: "pointer" }}>
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .promo-th { display: grid !important; }
        .promo-row:hover { background: ${C.ivory} !important; transition: background 0.15s; }
        .promo-mobile-card { display: none !important; }
        @media (max-width: 768px) {
          .promo-th { display: none !important; }
          .promo-row { display: none !important; }
          .promo-mobile-card { display: flex !important; }
        }
        input[type="text"], input[type="number"], input[type="date"], select {
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        input:focus, select:focus {
          border-color: #1B6B4A !important;
          box-shadow: 0 0 0 3px rgba(27,107,74,0.1) !important;
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.625rem 0.875rem",
  borderRadius: 10,
  border: "1.5px solid #DCE0E4",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#2C2C2C",
  background: "white",
  width: "100%",
  boxSizing: "border-box",
};
