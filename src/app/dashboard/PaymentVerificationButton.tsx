"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  bookingId: string;
  proofUrl: string | null;
}

export default function PaymentVerificationButton({ bookingId, proofUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  if (!proofUrl) return null;

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal memproses pembayaran.");
      }
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.375rem",
          padding: "0.3rem 0.75rem", borderRadius: 8,
          border: "1.5px solid var(--gold)", background: "var(--ivory)",
          color: "var(--gold)", fontSize: "0.6875rem", fontWeight: 800,
          cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap"
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Verifikasi Pembayaran
      </button>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowModal(false)}>
          <div style={{ background: "white", borderRadius: 16, padding: "1.5rem", width: "100%", maxWidth: 500, boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "1rem" }}>Verifikasi Bukti Pembayaran</h3>
            
            <div style={{ width: "100%", height: 300, background: "var(--ivory)", borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={proofUrl} alt="Bukti Transfer" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", color: "var(--error)", padding: "0.75rem", borderRadius: 8, fontSize: "0.8125rem", marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button 
                onClick={() => handleAction("reject")} disabled={loading}
                style={{ padding: "0.75rem 1.25rem", borderRadius: 8, border: "1.5px solid var(--error)", background: "white", color: "var(--error)", fontWeight: 700, fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer" }}
              >
                Tolak
              </button>
              <button 
                onClick={() => handleAction("approve")} disabled={loading}
                style={{ padding: "0.75rem 1.25rem", borderRadius: 8, border: "none", background: "var(--emerald)", color: "white", fontWeight: 700, fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Memproses..." : "Terima (Lunas)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
