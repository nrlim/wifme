"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Promo {
  id: string;
  code: string;
  description: string | null;
  type: "FIXED_AMOUNT" | "PERCENTAGE";
  value: number;
  minBookingAmount: number;
  maxUsage: number | null;
  usedCount: number;
  expiryDate: string | null;
}

export interface PromoSelection {
  code: string;
  discountAmount: number;
  promo: Promo;
}

interface VoucherPickerProps {
  estimatedTotal: number;
  onSelect: (selection: PromoSelection | null) => void;
  selected?: PromoSelection | null;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  emerald: "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  gold: "#C4973B",
  goldPale: "rgba(196,151,59,0.12)",
  charcoal: "#2C2C2C",
  muted: "#8A8A8A",
  border: "#E0D8CC",
  ivory: "#FAF7F2",
  white: "#FFFFFF",
  error: "#C0392B",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function calcPromoDiscount(promo: Promo, amount: number): number {
  if (amount < promo.minBookingAmount) return 0;
  if (promo.type === "FIXED_AMOUNT") return Math.min(promo.value, amount);
  return Math.round(amount * (promo.value / 100));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Voucher Card ──────────────────────────────────────────────────────────────
function VoucherCard({
  promo,
  estimatedTotal,
  selected,
  onSelect,
}: {
  promo: Promo;
  estimatedTotal: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const discount = calcPromoDiscount(promo, estimatedTotal);
  const final    = Math.max(0, estimatedTotal - discount);
  const eligible = estimatedTotal >= promo.minBookingAmount;
  const isPercent = promo.type === "PERCENTAGE";
  const quotaLeft = promo.maxUsage !== null ? promo.maxUsage - promo.usedCount : null;
  const almostOut = quotaLeft !== null && quotaLeft <= 5;

  return (
    <div
      onClick={eligible ? onSelect : undefined}
      style={{
        position: "relative",
        borderRadius: 14,
        border: `1.5px solid ${selected ? C.emerald : eligible ? C.border : "#EAEAEA"}`,
        background: selected ? C.emeraldPale : eligible ? C.white : "#FAFAFA",
        cursor: eligible ? "pointer" : "not-allowed",
        opacity: eligible ? 1 : 0.5,
        transition: "all 0.18s",
        overflow: "hidden",
        boxShadow: selected ? `0 0 0 3px rgba(27,107,74,0.12)` : "none",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/* Left color stripe */}
      <div style={{
        width: 4, flexShrink: 0,
        background: isPercent
          ? "linear-gradient(180deg,#F59E0B,#FCD34D)"
          : "linear-gradient(180deg,#3B82F6,#93C5FD)",
      }} />

      {/* Discount badge */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0.875rem 0.875rem 0.875rem 0.75rem", flexShrink: 0,
      }}>
        <div style={{
          minWidth: 52, textAlign: "center",
          padding: "0.375rem 0.5rem",
          borderRadius: 10,
          background: isPercent
            ? "linear-gradient(135deg,#FEF3C7,#FDE68A)"
            : "linear-gradient(135deg,#DBEAFE,#BFDBFE)",
          border: `1px solid ${isPercent ? "#FCD34D" : "#93C5FD"}`,
        }}>
          <div style={{ fontWeight: 900, fontSize: "1.0625rem", color: isPercent ? "#92400E" : "#1E3A8A", lineHeight: 1 }}>
            {isPercent ? `${promo.value}%` : `${Math.round(promo.value/1000)}k`}
          </div>
          <div style={{ fontSize: "0.5rem", fontWeight: 700, color: isPercent ? "#92400E" : "#1E3A8A", marginTop: 2, letterSpacing: "0.04em" }}>
            {isPercent ? "DISKON" : "POTONGAN"}
          </div>
        </div>
      </div>

      {/* Dashed separator */}
      <div style={{
        width: 1, margin: "0.625rem 0",
        background: `repeating-linear-gradient(to bottom,${C.border} 0,${C.border} 4px,transparent 4px,transparent 8px)`,
        flexShrink: 0,
      }} />

      {/* Content */}
      <div style={{ flex: 1, padding: "0.75rem 0.75rem", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
              <code style={{ fontWeight: 900, fontSize: "0.875rem", color: C.charcoal, letterSpacing: "0.04em" }}>
                {promo.code}
              </code>
              {selected && (
                <span style={{ fontSize: "0.5rem", fontWeight: 800, background: C.emerald, color: "white", padding: "0.1rem 0.4rem", borderRadius: 99, letterSpacing: "0.06em" }}>
                  AKTIF
                </span>
              )}
              {almostOut && (
                <span style={{ fontSize: "0.5rem", fontWeight: 800, background: "#FEF3C7", color: "#92400E", padding: "0.1rem 0.4rem", borderRadius: 99 }}>
                  🔥 Sisa {quotaLeft}
                </span>
              )}
            </div>
            {promo.description && (
              <div style={{ fontSize: "0.6875rem", color: C.muted, marginTop: "0.2rem", lineHeight: 1.3 }}>
                {promo.description}
              </div>
            )}
            <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.375rem", flexWrap: "wrap" }}>
              {promo.minBookingAmount > 0 && (
                <span style={{ fontSize: "0.5625rem", fontWeight: 600, color: C.muted, background: C.ivory, padding: "0.1rem 0.4rem", borderRadius: 99, border: `1px solid ${C.border}` }}>
                  Min Rp {promo.minBookingAmount.toLocaleString("id-ID")}
                </span>
              )}
              {promo.expiryDate && (
                <span style={{ fontSize: "0.5625rem", fontWeight: 600, color: C.gold, background: C.goldPale, padding: "0.1rem 0.4rem", borderRadius: 99, border: `1px solid ${C.gold}33` }}>
                  s/d {formatDate(promo.expiryDate)}
                </span>
              )}
            </div>
          </div>

          {/* Right: radio circle */}
          {eligible && (
            <div style={{ flexShrink: 0, paddingTop: "0.125rem" }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${selected ? C.emerald : C.border}`,
                background: selected ? C.emerald : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {selected && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Savings row */}
        {eligible && discount > 0 && (
          <div style={{
            marginTop: "0.5rem",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.375rem 0.625rem",
            borderRadius: 8,
            background: selected ? "rgba(27,107,74,0.1)" : "rgba(27,107,74,0.05)",
            border: `1px solid ${C.emerald}1A`,
          }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.emerald }}>
              Hemat Rp {discount.toLocaleString("id-ID")}
            </span>
            <span style={{ fontSize: "0.6875rem", color: C.charcoal }}>
              Bayar <strong style={{ color: C.emerald }}>Rp {final.toLocaleString("id-ID")}</strong>
            </span>
          </div>
        )}

        {!eligible && (
          <div style={{ marginTop: "0.375rem", fontSize: "0.6125rem", color: C.error, fontWeight: 600 }}>
            Kurang Rp {(promo.minBookingAmount - estimatedTotal).toLocaleString("id-ID")} lagi
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VoucherPicker({
  estimatedTotal,
  onSelect,
  selected,
}: VoucherPickerProps) {
  const [open, setOpen]     = useState(false);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localCode, setLocalCode] = useState(selected?.code ?? "");

  const fetchPromos = useCallback(async () => {
    if (promos.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/promotions");
      const data = await res.json();
      setPromos(data.promos ?? []);
    } catch { setPromos([]); }
    finally { setLoading(false); }
  }, [promos.length]);

  useEffect(() => { setMounted(true); }, []);

  const handleOpen = () => { setOpen(true); fetchPromos(); };

  const handleSelect = (code: string) => {
    setLocalCode(prev => prev === code ? "" : code);
  };

  const handleApply = () => {
    if (!localCode) {
      onSelect(null);
    } else {
      const promo = promos.find(p => p.code === localCode);
      if (promo) {
        onSelect({
          code: localCode,
          discountAmount: calcPromoDiscount(promo, estimatedTotal),
          promo,
        });
      }
    }
    setOpen(false);
  };

  const handleRemove = () => {
    setLocalCode("");
    onSelect(null);
    setOpen(false);
  };

  const localPromo   = promos.find(p => p.code === localCode);
  const localDiscount = localPromo ? calcPromoDiscount(localPromo, estimatedTotal) : 0;
  const eligibleCount = promos.filter(p => estimatedTotal >= p.minBookingAmount).length;

  if (!mounted) return null;

  return (
    <>
      {/* ── Trigger — full width standard input style ────────────────────── */}
      <button
        id="voucher-picker-btn"
        type="button"
        onClick={handleOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 0.875rem",
          borderRadius: 10,
          border: selected
            ? `1.5px solid ${C.emerald}66`
            : `1.5px dashed #C8D5CD`,
          background: selected ? C.emeraldPale : C.white,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s ease-in-out",
          boxShadow: selected ? "0 2px 8px rgba(27,107,74,0.08)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1rem" }}>🏷️</span>
          <span style={{
            fontSize: "0.8125rem",
            fontWeight: selected ? 700 : 600,
            color: selected ? C.emerald : C.charcoal,
          }}>
            {selected
              ? <><code style={{ background: "white", padding: "0.15rem 0.4rem", borderRadius: 4, letterSpacing: "0.04em", marginRight: "0.2rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>{selected.code}</code> diterapkan</>
              : "Pakai promo & voucher"}
          </span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selected ? C.emerald : C.muted} strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(5,15,10,0.55)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
              zIndex: 9200,
            }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            zIndex: 9201,
            background: C.white,
            borderRadius: "20px 20px 0 0",
            boxShadow: "0 -12px 48px rgba(0,0,0,0.18)",
            maxHeight: "85dvh",
            display: "flex", flexDirection: "column",
            animation: "vsUp 0.28s cubic-bezier(0.34,1.1,0.64,1) both",
          }}>
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "0.625rem", flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "#D1D5DB" }} />
            </div>

            {/* Header */}
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "1rem", color: C.charcoal }}>Pilih Voucher</div>
                  <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "0.15rem" }}>
                    Estimasi{" "}
                    <strong style={{ color: C.charcoal }}>Rp {estimatedTotal.toLocaleString("id-ID")}</strong>
                    {eligibleCount > 0 && (
                      <span style={{ marginLeft: "0.5rem", fontSize: "0.625rem", fontWeight: 700, background: C.emeraldPale, color: C.emerald, padding: "0.1rem 0.4rem", borderRadius: 99 }}>
                        {eligibleCount} bisa dipakai
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setOpen(false)} style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.charcoal} strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.875rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ height: 90, borderRadius: 14, background: "#F3F4F6", animation: "vsSkeleton 1.2s linear infinite", backgroundSize: "200% 100%", backgroundImage: "linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)" }} />
                ))
              ) : promos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: C.muted }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎟️</div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>Belum ada voucher tersedia</div>
                </div>
              ) : (
                <>
                  {promos.filter(p => estimatedTotal >= p.minBookingAmount).map(promo => (
                    <VoucherCard key={promo.id} promo={promo} estimatedTotal={estimatedTotal}
                      selected={localCode === promo.code} onSelect={() => handleSelect(promo.code)} />
                  ))}
                  {promos.some(p => estimatedTotal < p.minBookingAmount) && (
                    <>
                      <div style={{ fontSize: "0.625rem", fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", paddingTop: "0.25rem" }}>
                        Belum Memenuhi Syarat
                      </div>
                      {promos.filter(p => estimatedTotal < p.minBookingAmount).map(promo => (
                        <VoucherCard key={promo.id} promo={promo} estimatedTotal={estimatedTotal}
                          selected={false} onSelect={() => {}} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.875rem 1.25rem", borderTop: `1px solid ${C.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {localCode && localDiscount > 0 && (
                <div style={{ padding: "0.5rem 0.75rem", borderRadius: 10, background: C.emeraldPale, border: `1px solid ${C.emerald}22`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.emerald }}>Hemat Rp {localDiscount.toLocaleString("id-ID")}</span>
                  <span style={{ fontSize: "0.75rem", color: C.charcoal }}>Total <strong style={{ color: C.emerald }}>Rp {Math.max(0, estimatedTotal - localDiscount).toLocaleString("id-ID")}</strong></span>
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(selected || localCode) && (
                  <button onClick={handleRemove} style={{ padding: "0.75rem 1rem", borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.charcoal, fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                    Hapus
                  </button>
                )}
                <button
                  id="voucher-apply-btn"
                  onClick={handleApply}
                  style={{
                    flex: 1, padding: "0.75rem", borderRadius: 10, border: "none",
                    background: localCode ? `linear-gradient(135deg,${C.emerald},${C.emeraldLight})` : "#E5E7EB",
                    color: localCode ? "white" : C.muted,
                    fontWeight: 700, fontSize: "0.875rem",
                    cursor: localCode ? "pointer" : "default",
                    fontFamily: "inherit",
                    boxShadow: localCode ? "0 3px 12px rgba(27,107,74,0.28)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {localCode ? `Pakai "${localCode}"` : "Pilih voucher di atas"}
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes vsUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes vsSkeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          `}</style>
        </>
      )}
    </>
  );
}
