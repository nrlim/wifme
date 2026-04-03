"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/UIProvider";

export default function PaymentSimulationButton({ bookingId, amount }: { bookingId: string; amount: number }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const confirmed = await confirm({
      title: "Konfirmasi Pembayaran",
      message: `Anda akan membayar Rp ${amount.toLocaleString("id-ID")} untuk pesanan ini. Lanjutkan proses pembayaran?`,
      confirmLabel: "Ya, Bayar Sekarang",
      cancelLabel: "Batal",
      variant: "primary",
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (res.ok) {
        toast("success", "Pembayaran Berhasil!", "Status pesanan Anda telah diperbarui menjadi Lunas.");
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
    <button
      onClick={handlePay}
      disabled={loading}
      className="btn btn-primary btn-sm"
      style={{
        padding: "0.5rem 1rem",
        fontSize: "0.75rem",
        justifyContent: "center",
        borderRadius: "8px",
        background: "var(--charcoal)",
        borderColor: "var(--charcoal)",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        opacity: loading ? 0.7 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "opacity 0.2s",
      }}
    >
      {loading ? (
        <span
          className="spinner"
          style={{ width: 14, height: 14, borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white", borderWidth: 2 }}
        />
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          Bayar Sekarang
        </>
      )}
    </button>
  );
}
