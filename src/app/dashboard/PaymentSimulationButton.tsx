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
      style={{
        width: "100%",
        padding: "0.75rem 1.25rem",
        fontSize: "0.875rem",
        fontWeight: 700,
        fontFamily: "inherit",
        justifyContent: "center",
        borderRadius: "10px",
        background: "var(--emerald)",
        border: "none",
        color: "white",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        opacity: loading ? 0.7 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "opacity 0.2s, background 0.2s",
      }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = "var(--emerald-light)")}
      onMouseLeave={e => !loading && (e.currentTarget.style.background = "var(--emerald)")}
    >
      {loading ? (
        <span
          className="spinner"
          style={{ width: 16, height: 16, borderColor: "rgba(255,255,255,0.4)", borderTopColor: "white", borderWidth: 2 }}
        />
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          Bayar Sekarang
        </>
      )}
    </button>
  );
}
