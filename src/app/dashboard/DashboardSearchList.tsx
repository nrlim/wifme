"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/UIProvider";

export default function DashboardSearchList({ muthawifs, startDate, duration }: { muthawifs: any[]; startDate: string; duration: string }) {
  const router = useRouter();
  const { toast, confirm } = useUI();
  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleBook = async (muthawifId: string, muthawifName: string, totalPrice: number) => {
    const confirmed = await confirm({
      title: "Konfirmasi Booking",
      message: `Anda akan memesan ${muthawifName} selama ${duration} hari seharga Rp ${totalPrice.toLocaleString("id-ID")}. Lanjutkan?`,
      confirmLabel: "Ya, Book Sekarang",
      cancelLabel: "Batal",
      variant: "primary",
    });
    if (!confirmed) return;

    setBookingId(muthawifId);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muthawifId, startDate, duration, notes: "" }),
      });

      if (res.ok) {
        toast("success", "Booking Berhasil!", `Pesanan untuk ${muthawifName} telah dibuat. Silakan lakukan pembayaran.`);
        router.push("/dashboard?tab=beranda");
        router.refresh();
      } else {
        const data = await res.json();
        toast("error", "Booking Gagal", data.error || "Gagal membuat pesanan. Silakan coba lagi.");
      }
    } catch {
      toast("error", "Koneksi Bermasalah", "Tidak dapat terhubung ke server.");
    } finally {
      setBookingId(null);
    }
  };


  if (muthawifs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.4)", borderRadius: "16px", border: "1px dashed var(--border)", marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--charcoal)", marginBottom: "0.5rem" }}>Muthawif Tidak Ditemukan</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Tidak ada list muthawif yang tersedia untuk jadwal tersebut.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {muthawifs.map((m) => {
        const initials = m.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div key={m.id} style={{ display: "flex", background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--border)", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--emerald)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
              {m.user.photoUrl ? <img src={m.user.photoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={m.user.name} /> : initials}
            </div>
            
            <div style={{ flex: "1 1 350px", minWidth: 0 }}>
              <h4 style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--charcoal)", marginBottom: "0.25rem" }}>{m.user.name}</h4>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: "0.875rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  {m.location === "BOTH" ? "Makkah & Madinah" : m.location}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                  {m.rating > 0 ? m.rating.toFixed(1) : "Baru"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--brown)" }}>
                  {m.experience} th pengalaman
                </span>
              </div>
              
              {m.bio && (
                <p style={{
                  fontSize: "0.875rem",
                  color: "var(--text-body)",
                  lineHeight: 1.65,
                  marginBottom: "0.875rem",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {m.bio}
                </p>
              )}

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {m.specializations && m.specializations.length > 0 && m.specializations.map((spec: string) => (
                  <span key={spec} style={{ fontSize: "0.6875rem", background: "var(--emerald-pale)", color: "var(--emerald)", padding: "0.2rem 0.6rem", borderRadius: "99px", border: "1px solid rgba(27, 107, 74, 0.2)", fontWeight: 600 }}>
                    {spec}
                  </span>
                ))}
                {m.languages && m.languages.length > 0 && m.languages.map((lang: string) => (
                  <span key={lang} style={{ fontSize: "0.6875rem", background: "var(--ivory-dark)", color: "var(--text-muted)", padding: "0.2rem 0.6rem", borderRadius: "99px", border: "1px solid var(--border)", fontWeight: 600 }}>
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "right", borderLeft: "1px dashed var(--border)", paddingLeft: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total {duration} hari</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--emerald)", marginBottom: "0.75rem" }}>
                Rp {(m.basePrice * parseInt(duration)).toLocaleString("id-ID")}
              </div>
              <button 
                onClick={() => handleBook(m.user.id, m.user.name, m.basePrice * parseInt(duration))} 
                className="btn btn-primary" 
                disabled={bookingId === m.user.id}
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", minWidth: "140px", justifyContent: "center" }}
              >
                {bookingId === m.user.id ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: "white", borderColor: "rgba(255,255,255,0.4)", borderWidth: 2 }} /> : "Book Sekarang"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
