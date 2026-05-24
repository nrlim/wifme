"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/UIProvider";
import PromoInput from "@/components/PromoInput";

interface Props {
  bookingId: string;
  amount: number;
  muthawifName: string;
  jamaahId: string;
  initialVoucher?: string;
}

interface PromoResult {
  valid: boolean;
  promotionId?: string;
  code?: string;
  discountAmount?: number;
  finalAmount?: number;
  message: string;
}

const C = {
  emerald: "#1B6B4A",
  emeraldLight: "#27956A",
  emeraldPale: "#EBF5EF",
  gold: "#C4973B",
  charcoal: "#2C2C2C",
  muted: "#8A8A8A",
  border: "#E0D8CC",
  ivory: "#FAF7F2",
  white: "#FFFFFF",
  error: "#C0392B",
};

export default function BookingPayButton({ bookingId, amount, muthawifName, jamaahId, initialVoucher }: Props) {
  const router = useRouter();
  const { toast } = useUI();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [promo, setPromo] = useState<PromoResult | null>(null);

  const resolvedInitial = initialVoucher?.trim().toUpperCase() || undefined;

  const effectiveAmount = promo?.valid && promo.finalAmount !== undefined ? promo.finalAmount : amount;
  const discountAmount = promo?.valid && promo.discountAmount ? promo.discountAmount : 0;

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
        toast(
          "success",
          "Pembayaran Berhasil!",
          `Pesanan Anda dengan ${muthawifName} telah dikonfirmasi. Semoga ibadah lancar!`
        );
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
      {/* ── Trigger Button ── */}
      <button
        id="booking-pay-trigger"
        onClick={() => setOpen(true)}
        className="bpb-trigger"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        Bayar Sekarang
      </button>

      {/* ── Payment Sheet / Modal ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="bpb-backdrop"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Sheet (bottom sheet on mobile, centered modal on desktop) */}
          <div className="bpb-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Mobile drag handle */}
            <div className="bpb-handle" />

            {/* Header */}
            <div className="bpb-header">
              <div className="bpb-header-left">
                <div className="bpb-header-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <div className="bpb-header-title">Konfirmasi Pembayaran</div>
                  <div className="bpb-header-sub">Simulasi Midtrans Payment Gateway</div>
                </div>
              </div>
              <button
                className="bpb-close"
                onClick={() => !loading && setOpen(false)}
                disabled={loading}
                aria-label="Tutup"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Amount Hero */}
            <div className="bpb-amount-hero">
              <div className="bpb-amount-label">Total Pembayaran</div>
              {discountAmount > 0 ? (
                <div>
                  <div className="bpb-amount-original">Rp {amount.toLocaleString("id-ID")}</div>
                  <div className="bpb-amount-main">
                    Rp {effectiveAmount.toLocaleString("id-ID")}
                    <span className="bpb-discount-badge">Hemat Rp {discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ) : (
                <div className="bpb-amount-main">Rp {effectiveAmount.toLocaleString("id-ID")}</div>
              )}
            </div>

            {/* Body */}
            <div className="bpb-body">
              {/* Promo Input */}
              <PromoInput
                bookingAmount={amount}
                jamaahId={jamaahId}
                onPromoApplied={handlePromoApplied}
                applied={promo ?? undefined}
                initialCode={resolvedInitial}
              />

              {/* Transaction Detail */}
              <div className="bpb-detail-box">
                <div className="bpb-detail-title">Detail Transaksi</div>
                {[
                  { label: "Order ID", value: `#${bookingId.slice(0, 8).toUpperCase()}`, mono: true },
                  { label: "Muthawif", value: muthawifName },
                  { label: "Merchant", value: "Wif-Me Pendamping Umroh" },
                  ...(discountAmount > 0 ? [{ label: "Kode Promo", value: promo?.code ?? "—", mono: true }] : []),
                  ...(discountAmount > 0 ? [{ label: "Diskon", value: `- Rp ${discountAmount.toLocaleString("id-ID")}`, highlight: true }] : []),
                ].map((row) => (
                  <div key={row.label} className="bpb-detail-row">
                    <span className="bpb-detail-key">{row.label}</span>
                    <span
                      className="bpb-detail-val"
                      style={{
                        fontFamily: row.mono ? "monospace" : "inherit",
                        color: (row as { highlight?: boolean }).highlight ? C.emerald : C.charcoal,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
                <div className="bpb-detail-total">
                  <span>Total</span>
                  <span style={{ color: C.emerald }}>Rp {effectiveAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bpb-method">
                <div className="bpb-detail-title">Metode Pembayaran (Simulasi)</div>
                <div className="bpb-method-card">
                  <div className="bpb-method-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="bpb-method-info">
                    <div className="bpb-method-name">Virtual Account</div>
                    <div className="bpb-method-banks">BCA · BNI · Mandiri · BRI</div>
                  </div>
                  <div className="bpb-method-check">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bpb-disclaimer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Ini adalah <strong>simulasi pembayaran</strong> untuk keperluan demo. Tidak ada dana nyata yang diproses.</span>
              </div>

              {/* CTA */}
              <button
                id="booking-pay-confirm"
                onClick={handlePay}
                disabled={loading}
                className="bpb-cta"
              >
                {loading ? (
                  <>
                    <span className="bpb-spinner" />
                    Memproses...
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

          <style>{`
            /* Backdrop */
            .bpb-backdrop {
              position: fixed;
              inset: 0;
              background: rgba(5,15,10,0.6);
              backdrop-filter: blur(6px);
              -webkit-backdrop-filter: blur(6px);
              z-index: 9100;
              animation: bpb-fade-in 0.22s ease both;
            }

            /* Sheet base */
            .bpb-sheet {
              position: fixed;
              z-index: 9200;
              background: white;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }

            /* Handle (mobile only) */
            .bpb-handle {
              display: none;
              width: 40px;
              height: 4px;
              border-radius: 99px;
              background: #D7D1C7;
              margin: 0.6rem auto 0;
              flex-shrink: 0;
            }

            /* Header */
            .bpb-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1rem;
              padding: 1.25rem 1.5rem 0;
              flex-shrink: 0;
            }
            .bpb-header-left {
              display: flex;
              align-items: center;
              gap: 0.75rem;
            }
            .bpb-header-icon {
              width: 38px;
              height: 38px;
              border-radius: 10px;
              background: linear-gradient(135deg, #0d2818, ${C.emerald});
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .bpb-header-title {
              font-weight: 900;
              font-size: 0.9375rem;
              color: ${C.charcoal};
              line-height: 1;
            }
            .bpb-header-sub {
              font-size: 0.5625rem;
              color: ${C.muted};
              letter-spacing: 0.04em;
              margin-top: 2px;
              text-transform: uppercase;
              font-weight: 700;
            }
            .bpb-close {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 1px solid ${C.border};
              background: ${C.ivory};
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: ${C.muted};
              flex-shrink: 0;
              transition: background 0.15s;
            }
            .bpb-close:hover:not(:disabled) { background: #eee; }
            .bpb-close:disabled { opacity: 0.5; cursor: not-allowed; }

            /* Amount Hero */
            .bpb-amount-hero {
              padding: 1.25rem 1.5rem;
              border-bottom: 1px solid ${C.border};
              flex-shrink: 0;
            }
            .bpb-amount-label {
              font-size: 0.75rem;
              color: ${C.muted};
              font-weight: 600;
              margin-bottom: 0.3rem;
            }
            .bpb-amount-original {
              font-size: 1rem;
              color: ${C.muted};
              text-decoration: line-through;
              line-height: 1;
              margin-bottom: 0.25rem;
            }
            .bpb-amount-main {
              font-size: 1.875rem;
              font-weight: 900;
              color: ${C.charcoal};
              letter-spacing: -0.02em;
              line-height: 1;
              display: flex;
              align-items: center;
              gap: 0.75rem;
              flex-wrap: wrap;
            }
            .bpb-discount-badge {
              font-size: 0.75rem;
              font-weight: 700;
              background: ${C.emeraldPale};
              color: ${C.emerald};
              padding: 0.25rem 0.625rem;
              border-radius: 99px;
              letter-spacing: 0;
            }

            /* Body */
            .bpb-body {
              overflow-y: auto;
              padding: 1.25rem 1.5rem;
              display: flex;
              flex-direction: column;
              gap: 1rem;
              flex: 1;
            }

            /* Detail box */
            .bpb-detail-box {
              background: ${C.ivory};
              border-radius: 14px;
              padding: 1rem;
              border: 1px solid ${C.border};
            }
            .bpb-detail-title {
              font-size: 0.625rem;
              font-weight: 800;
              color: ${C.muted};
              text-transform: uppercase;
              letter-spacing: 0.08em;
              margin-bottom: 0.75rem;
            }
            .bpb-detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 0.5rem;
              margin-bottom: 0.5rem;
              border-bottom: 1px dashed ${C.border};
            }
            .bpb-detail-key {
              font-size: 0.8125rem;
              color: ${C.muted};
              font-weight: 600;
            }
            .bpb-detail-val {
              font-size: 0.8125rem;
              font-weight: 700;
              color: ${C.charcoal};
            }
            .bpb-detail-total {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 0.9375rem;
              font-weight: 800;
              color: ${C.charcoal};
            }

            /* Payment method */
            .bpb-method-card {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 0.875rem 1rem;
              border: 2px solid ${C.emerald};
              border-radius: 14px;
              background: rgba(27,107,74,0.03);
              margin-top: 0.5rem;
            }
            .bpb-method-icon {
              width: 38px;
              height: 38px;
              border-radius: 10px;
              background: ${C.emeraldPale};
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .bpb-method-info { flex: 1; }
            .bpb-method-name {
              font-weight: 700;
              font-size: 0.875rem;
              color: ${C.charcoal};
            }
            .bpb-method-banks {
              font-size: 0.6875rem;
              color: ${C.muted};
            }
            .bpb-method-check {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: ${C.emerald};
              display: flex;
              align-items: center;
              justify-content: center;
            }

            /* Disclaimer */
            .bpb-disclaimer {
              display: flex;
              gap: 0.5rem;
              align-items: flex-start;
              font-size: 0.6875rem;
              color: ${C.muted};
              background: rgba(196,151,59,0.06);
              border: 1px solid rgba(196,151,59,0.2);
              border-radius: 10px;
              padding: 0.625rem 0.75rem;
            }

            /* CTA */
            .bpb-cta {
              width: 100%;
              padding: 1rem;
              border-radius: 14px;
              background: linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight});
              color: white;
              border: none;
              font-family: inherit;
              font-size: 1rem;
              font-weight: 800;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.625rem;
              box-shadow: 0 4px 18px rgba(27,107,74,0.3);
              transition: all 0.15s;
              flex-shrink: 0;
            }
            .bpb-cta:disabled {
              background: ${C.muted};
              box-shadow: none;
              cursor: not-allowed;
            }
            .bpb-cta:not(:disabled):hover {
              transform: translateY(-1px);
              box-shadow: 0 8px 24px rgba(27,107,74,0.35);
            }
            .bpb-cta:not(:disabled):active { transform: scale(0.98); }

            /* Trigger */
            .bpb-trigger {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 0.625rem;
              width: 100%;
              padding: 1rem 2rem;
              font-size: 1rem;
              font-weight: 800;
              font-family: inherit;
              border-radius: 16px;
              background: linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight});
              border: none;
              color: white;
              cursor: pointer;
              box-shadow: 0 4px 22px rgba(27,107,74,0.3);
              transition: all 0.2s;
            }
            .bpb-trigger:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 28px rgba(27,107,74,0.35);
            }
            .bpb-trigger:active { transform: scale(0.98); }

            /* Spinner */
            .bpb-spinner {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2.5px solid rgba(255,255,255,0.3);
              border-top-color: white;
              animation: bpb-spin 0.8s linear infinite;
              display: inline-block;
            }

            /* Animations */
            @keyframes bpb-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes bpb-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes bpb-scale-in { from { opacity: 0; transform: scale(0.94) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes bpb-spin { to { transform: rotate(360deg); } }

            /* ── Desktop: centered modal ── */
            @media (min-width: 641px) {
              .bpb-sheet {
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100%;
                max-width: 480px;
                border-radius: 24px;
                max-height: 90vh;
                box-shadow: 0 24px 80px rgba(0,0,0,0.2);
                animation: bpb-scale-in 0.28s cubic-bezier(0.34,1.1,0.64,1) both;
              }
            }

            /* ── Mobile: bottom sheet ── */
            @media (max-width: 640px) {
              .bpb-handle { display: block; }
              .bpb-sheet {
                bottom: 0;
                left: 0;
                right: 0;
                border-radius: 24px 24px 0 0;
                max-height: 92dvh;
                animation: bpb-slide-up 0.32s cubic-bezier(0.32, 0.72, 0, 1) both;
                padding-bottom: env(safe-area-inset-bottom);
              }
              .bpb-amount-main {
                font-size: 1.625rem;
              }
              .bpb-cta {
                border-radius: 14px;
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}
