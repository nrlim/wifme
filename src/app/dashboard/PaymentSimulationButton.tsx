"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/UIProvider";
import PromoInput from "@/components/PromoInput";

interface PromoResult {
  valid: boolean;
  code?: string;
  discountAmount?: number;
  finalAmount?: number;
  message: string;
}

interface Props {
  bookingId: string;
  amount: number;
  jamaahId: string;
  fullWidth?: boolean;
}

export default function PaymentSimulationButton({ bookingId, amount, jamaahId, fullWidth = false }: Props) {
  const router = useRouter();
  const { toast } = useUI();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promo, setPromo] = useState<PromoResult | null>(null);

  const effectiveAmount = promo?.valid && promo.finalAmount !== undefined ? promo.finalAmount : amount;
  const discountAmount  = promo?.valid && promo.discountAmount ? promo.discountAmount : 0;

  const handlePromoApplied = useCallback((result: PromoResult | null) => {
    setPromo(result);
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          promoCode: promo?.valid ? promo.code : undefined,
        }),
      });

      if (res.ok) {
        setOpen(false);
        toast("success", "Pembayaran Berhasil! 🎉", "Status pesanan Anda telah diperbarui menjadi Lunas. Persiapkan ibadah Anda!");
        router.refresh();
      } else {
        const data = await res.json();
        toast("error", "Pembayaran Gagal", data.error || "Terjadi kesalahan saat memproses pembayaran.");
      }
    } catch {
      toast("error", "Koneksi Bermasalah", "Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={fullWidth ? {
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          width: "100%",
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 800,
          fontFamily: "inherit",
          borderRadius: 12,
          background: "linear-gradient(135deg, var(--emerald), #27956A)",
          border: "none",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(27,107,74,0.25)",
          transition: "all 0.15s",
        } : {
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.3rem",
          padding: "0.5rem 0.5rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          fontFamily: "inherit",
          borderRadius: 8,
          background: "var(--emerald)",
          border: "none",
          color: "white",
          cursor: "pointer",
          whiteSpace: "normal",
          lineHeight: 1.2,
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(27,107,74,0.25)",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "none"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        {fullWidth ? `Bayar Sekarang — Rp ${amount.toLocaleString("id-ID")}` : "Bayar Sekarang"}
      </button>

      {/* ── Payment Modal ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => !loading && setOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(5,15,10,0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 9100,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1rem",
            }}
            className="pay-backdrop"
          >
            {/* Panel */}
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: 24,
                width: "100%",
                maxWidth: 480,
                boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
                overflow: "hidden",
                animation: "payIn 0.28s cubic-bezier(0.34,1.1,0.64,1) both",
                maxHeight: "90dvh",
                overflowY: "auto",
              }}
              className="pay-panel"
            >
              {/* Header */}
              <div style={{
                background: "linear-gradient(135deg, #0d2818 0%, #1B6B4A 100%)",
                padding: "1.5rem 1.75rem",
                color: "white",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: "0.9375rem", lineHeight: 1 }}>Midtrans</div>
                      <div style={{ fontSize: "0.5625rem", opacity: 0.6, letterSpacing: "0.05em", marginTop: 2 }}>PAYMENT GATEWAY SIMULATION</div>
                    </div>
                  </div>
                  <button
                    onClick={() => !loading && setOpen(false)}
                    disabled={loading}
                    style={{
                      background: "rgba(255,255,255,0.12)", border: "none",
                      borderRadius: "50%", width: 30, height: 30,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: loading ? "not-allowed" : "pointer", color: "white",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.65, marginBottom: "0.3rem" }}>Total Pembayaran</div>
                  {discountAmount > 0 ? (
                    <>
                      <div style={{ fontSize: "1rem", opacity: 0.5, textDecoration: "line-through", lineHeight: 1, marginBottom: "0.2rem" }}>
                        Rp {amount.toLocaleString("id-ID")}
                      </div>
                      <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        Rp {effectiveAmount.toLocaleString("id-ID")}
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "rgba(255,255,255,0.18)", padding: "0.2rem 0.625rem", borderRadius: 99, letterSpacing: 0 }}>
                          Hemat Rp {discountAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>
                      Rp {effectiveAmount.toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "1.375rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.125rem" }}>

                {/* ── Promo Code Input ── */}
                <PromoInput
                  bookingAmount={amount}
                  jamaahId={jamaahId}
                  onPromoApplied={handlePromoApplied}
                  applied={promo ?? undefined}
                />

                {/* Transaction detail */}
                <div style={{ background: "var(--ivory)", borderRadius: 14, padding: "1rem", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.625rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    Detail Transaksi
                  </div>
                  {[
                    { label: "Order ID", value: `#${bookingId.slice(0, 8).toUpperCase()}`, mono: true },
                    { label: "Merchant", value: "Wif–Me Marketplace" },
                    ...(discountAmount > 0 ? [{ label: "Kode Promo", value: promo?.code ?? "—", mono: true }] : []),
                    ...(discountAmount > 0 ? [{ label: "Diskon", value: `- Rp ${discountAmount.toLocaleString("id-ID")}`, highlight: true }] : []),
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", marginBottom: "0.5rem", borderBottom: "1px dashed var(--border)" }}>
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>{row.label}</span>
                      <span style={{
                        fontSize: "0.8125rem", fontWeight: 700,
                        color: (row as { highlight?: boolean }).highlight ? "var(--emerald)" : "var(--charcoal)",
                        fontFamily: row.mono ? "monospace" : "inherit",
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--charcoal)", fontWeight: 700 }}>Total</span>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 900, color: "var(--emerald)" }}>
                      Rp {effectiveAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Payment methods */}
                <div>
                  <div style={{ fontSize: "0.625rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                    Metode Pembayaran (Simulasi)
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", border: "2px solid var(--emerald)", borderRadius: 12, background: "rgba(27,107,74,0.04)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--emerald-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--charcoal)" }}>Virtual Account</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>BCA · BNI · Mandiri · BRI</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--emerald)", background: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", background: "rgba(196,151,59,0.06)", border: "1px solid rgba(196,151,59,0.2)", borderRadius: 10, padding: "0.625rem 0.75rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Ini adalah <strong>simulasi pembayaran</strong> untuk keperluan demo. Tidak ada dana nyata yang diproses.</span>
                </div>

                {/* CTA */}
                <button
                  onClick={handlePay}
                  disabled={loading}
                  style={{
                    width: "100%", padding: "1rem", borderRadius: 14,
                    background: loading ? "var(--text-muted)" : "linear-gradient(135deg, var(--emerald), #27956A)",
                    color: "white", border: "none", fontFamily: "inherit",
                    fontSize: "1rem", fontWeight: 800,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
                    boxShadow: loading ? "none" : "0 4px 18px rgba(27,107,74,0.3)",
                    transition: "all 0.15s",
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white", borderWidth: 2.5 }} />
                      Memproses Pembayaran...
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Bayar Rp {effectiveAmount.toLocaleString("id-ID")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes payIn {
              from { opacity: 0; transform: scale(0.94) translateY(12px); }
              to   { opacity: 1; transform: scale(1)   translateY(0); }
            }
            @media (max-width: 600px) {
              .pay-backdrop { align-items: flex-end !important; padding: 0 !important; }
              .pay-panel { border-radius: 20px 20px 0 0 !important; max-height: 95dvh; overflow-y: auto; }
            }
          `}</style>
        </>
      )}
    </>
  );
}
