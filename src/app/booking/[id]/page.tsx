import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import PaymentProofUpload from "./PaymentProofUpload";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ promo?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { muthawif: { select: { name: true } } },
  });
  if (!booking) return { title: "Pesanan Tidak Ditemukan" };
  return {
    title: `Konfirmasi Pesanan — ${booking.muthawif.name} | Wif–Me`,
    description: "Selesaikan pembayaran untuk mengonfirmasi pesanan Muthawif Anda.",
  };
}

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

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  CONFIRMED: "Dikonfirmasi",
  CANCELLED: "Dibatalkan",
  COMPLETED: "Selesai",
};

const PAY_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  PAID: "Lunas",
};

export default async function BookingConfirmationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { promo: initialPromo } = await searchParams;
  const session = await getSession();

  if (!session) {
    redirect(`/auth/login?redirect=/booking/${id}`);
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      muthawif: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
          profile: {
            select: {
              basePrice: true,
              operatingAreas: true,
              experience: true,
              languages: true,
              specializations: true,
              rating: true,
              totalReviews: true,
            },
          },
        },
      },
      jamaah: { select: { id: true, name: true, email: true } },
      items: { include: { activity: true } },
    },
  });

  const settings = await prisma.globalSetting.findUnique({ where: { id: "singleton" } });

  if (!booking) notFound();

  if (session.role !== "AMIR" && booking.jamaah.id !== session.id) {
    redirect("/dashboard");
  }

  const duration = booking.items.reduce((acc, item) => acc + (item.activity?.durationDays || 1), 0);
  
  const computedStartDate = booking.items.length > 0
    ? booking.items.reduce((min, item) => item.date < min ? item.date : min, booking.items[0].date)
    : new Date();

  const computedEndDate = booking.items.length > 0
    ? booking.items.reduce((max, item) => {
        const itemEnd = new Date(item.date);
        itemEnd.setDate(itemEnd.getDate() + (item.activity?.durationDays || 1));
        return itemEnd > max ? itemEnd : max;
      }, new Date(0))
    : new Date();

  const isPaid = booking.paymentStatus === "PAID";
  const isCancelled = booking.status === "CANCELLED";
  const isReview = booking.paymentStatus === "PAYMENT_REVIEW";
  const isUnpaid = booking.paymentStatus === "UNPAID" && !isCancelled;

  const muthawifPhotoInitials = booking.muthawif.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusColor = isPaid ? C.emerald : isCancelled ? C.error : C.gold;
  const statusBg = isPaid ? C.emeraldPale : isCancelled ? "#FEF2F2" : C.goldPale;

  const detailRows = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
        </svg>
      ),
      label: "Order ID",
      value: `#${booking.id.slice(0, 8).toUpperCase()}`,
      mono: true,
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      label: "Tanggal Kegiatan Pertama",
      value: computedStartDate.toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      }),
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      label: "Durasi",
      value: `${duration} hari`,
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      label: "Tanggal Kegiatan Terakhir",
      value: computedEndDate.toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      }),
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      label: "Status Pesanan",
      value: STATUS_LABEL[booking.status] || booking.status,
    },
    ...(booking.notes
      ? [{
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          ),
          label: "Catatan",
          value: booking.notes,
          mono: false,
        }]
      : []),
  ];

  return (
    <>
      <div className="bcp-root">
        <div className="bcp-container">



          {/* ══════════════════════════
              CLEAN HERO STATUS
          ══════════════════════════ */}
          <div className="bcp-hero-clean">
            <div className="bcp-hero-badge" style={{ background: statusBg, color: statusColor }}>
              <span className="bcp-hero-badge-dot" style={{ background: statusColor }}></span>
              {PAY_STATUS_LABEL[booking.paymentStatus as string] ?? booking.paymentStatus}
            </div>
            <h1 className="bcp-hero-title">
              {isPaid ? "Pembayaran Berhasil" : isCancelled ? "Pesanan Dibatalkan" : isReview ? "Menunggu Verifikasi" : "Selesaikan Pembayaran"}
            </h1>
            <p className="bcp-hero-sub">
              {isPaid
                ? "Pesanan Anda telah dikonfirmasi. Muthawif akan segera menghubungi Anda."
                : isCancelled
                ? "Pesanan ini telah dibatalkan. Silakan buat pesanan baru."
                : isReview
                ? "Bukti pembayaran Anda sedang diverifikasi oleh admin. Mohon tunggu."
                : "Selesaikan pembayaran untuk mengamankan jadwal pendampingan Anda."}
            </p>
            <div className="bcp-hero-amount" style={{ color: isPaid ? C.emerald : C.charcoal }}>
              Rp {booking.totalFee.toLocaleString("id-ID")}
            </div>
          </div>

          {/* ══════════════════════════
              MUTHAWIF SUMMARY CARD
          ══════════════════════════ */}
          <div className="bcp-section">
            <div className="bcp-muthawif-card">
              <div className="bcp-muthawif-avatar">
                {booking.muthawif.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={booking.muthawif.photoUrl} alt={booking.muthawif.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  muthawifPhotoInitials
                )}
              </div>
              <div className="bcp-muthawif-info">
                <div className="bcp-muthawif-name">{booking.muthawif.name}</div>
                <div className="bcp-muthawif-tags">
                  {booking.muthawif.profile?.operatingAreas?.slice(0, 2).map((a) => (
                    <span key={a} className="bcp-tag bcp-tag-emerald">{a}</span>
                  ))}
                  {booking.muthawif.profile?.experience ? (
                    <span className="bcp-tag bcp-tag-gold">{booking.muthawif.profile.experience} th</span>
                  ) : null}
                  {booking.muthawif.profile?.rating ? (
                    <span className="bcp-tag bcp-tag-gold">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#C4973B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {booking.muthawif.profile.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>
              <Link href={`/muthawif/${booking.muthawif.id}`} className="bcp-profile-link">
                Profil
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          </div>

          {/* ══════════════════════════
              DETAIL ROWS (Compact)
          ══════════════════════════ */}
          <div className="bcp-section">
            <div className="bcp-section-title">Detail Pesanan</div>
            <div className="bcp-detail-list">
              {detailRows.map((row) => (
                <div key={row.label} className="bcp-detail-row">
                  <div className="bcp-detail-label-wrapper">
                    <div className="bcp-detail-icon" style={{ color: C.emerald }}>{row.icon}</div>
                    <div className="bcp-detail-label">{row.label}</div>
                  </div>
                  <div className="bcp-detail-value" style={{ fontFamily: row.mono ? "monospace" : "inherit" }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════
              PAYMENT DEADLINE WARNING
          ══════════════════════════ */}
          {isUnpaid && booking.paymentDeadline && (
            <div className="bcp-section">
              <div className="bcp-deadline-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: C.gold }}>Batas Waktu Pembayaran</div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 800, color: C.charcoal, marginTop: "0.125rem" }}>
                    {new Date(booking.paymentDeadline).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════
              TOTAL SUMMARY
          ══════════════════════════ */}
          <div className="bcp-section">
            <div className="bcp-total-card" style={{ background: isPaid ? C.emeraldPale : C.goldPale, borderColor: isPaid ? `${C.emerald}33` : `${C.gold}33` }}>
              <div>
                <div className="bcp-total-label" style={{ color: isPaid ? C.emerald : C.gold }}>Total Pembayaran</div>
                <div className="bcp-total-sub">Tarif muthawif + biaya layanan</div>
                {(booking as { discountAmount?: number }).discountAmount && (booking as { discountAmount?: number }).discountAmount! > 0 ? (
                  <div className="bcp-total-promo">
                    Promo diterapkan — Hemat Rp {((booking as { discountAmount?: number }).discountAmount!).toLocaleString("id-ID")}
                  </div>
                ) : null}
              </div>
              <div className="bcp-total-amount-wrapper">
                {(booking as { discountAmount?: number }).discountAmount && (booking as { discountAmount?: number }).discountAmount! > 0 ? (
                  <div className="bcp-total-original">
                    Rp {(booking.totalFee + (booking as { discountAmount?: number }).discountAmount!).toLocaleString("id-ID")}
                  </div>
                ) : null}
                <div className="bcp-total-amount" style={{ color: isPaid ? C.emerald : C.charcoal }}>
                  Rp {booking.totalFee.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════
              SUCCESS STATE
          ══════════════════════════ */}
          {isPaid && (
            <div className="bcp-section">
              <div className="bcp-success-banner">
                <div className="bcp-success-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: C.emerald, fontSize: "0.9375rem", marginBottom: "0.2rem" }}>
                    Pembayaran Dikonfirmasi
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: C.muted, lineHeight: 1.6 }}>
                    Muthawif telah mendapatkan notifikasi. Persiapkan perjalanan ibadah Anda!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════
              CTA BUTTONS
          ══════════════════════════ */}
          <div className="bcp-section bcp-actions" style={{ marginBottom: 0 }}>
            {isUnpaid ? (
              <PaymentProofUpload
                bookingId={booking.id}
                amount={booking.totalFee}
                bankName={settings?.platformBankName || undefined}
                bankAccount={settings?.platformBankAccount || undefined}
                bankHolder={settings?.platformBankHolder || undefined}
              />
            ) : (
              <div className="bcp-nav-links" style={{ marginTop: "1rem" }}>
                <Link href="/dashboard" className="bcp-btn-secondary" style={{ width: "100%" }}>
                  Kembali ke Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* ─── Root & Layout ─── */
        .bcp-root {
          min-height: 100dvh;
          background: rgba(5,15,10,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }
        .bcp-container {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          background: ${C.white};
          border-radius: 24px;
          border: 1px solid ${C.border};
          padding: 2rem;
          box-shadow: 0 12px 40px rgba(0,0,0,0.06);
        }

        /* ─── Back button ─── */
        .bcp-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: ${C.muted};
          text-decoration: none;
          margin-bottom: 1.5rem;
          transition: color 0.15s;
        }
        .bcp-back-btn:hover { color: ${C.charcoal}; }

        /* ─── Clean Hero ─── */
        .bcp-hero-clean {
          margin-bottom: 2rem;
        }
        .bcp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.875rem;
          border-radius: 99px;
          font-size: 0.6875rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 1.25rem;
        }
        .bcp-hero-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .bcp-hero-title {
          font-size: clamp(1.75rem, 5vw, 2.25rem);
          font-weight: 900;
          color: ${C.charcoal};
          margin: 0 0 0.5rem;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .bcp-hero-sub {
          font-size: 0.9rem;
          color: ${C.muted};
          margin: 0 0 1.5rem;
          line-height: 1.6;
        }
        .bcp-hero-amount {
          font-size: clamp(2rem, 6vw, 2.75rem);
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        /* ─── Sections ─── */
        .bcp-section {
          margin-bottom: 1.25rem;
        }
        .bcp-section-title {
          font-size: 0.6875rem;
          font-weight: 900;
          color: ${C.muted};
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
          padding: 0 0.25rem;
        }

        /* ─── Muthawif Card ─── */
        .bcp-muthawif-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          border-radius: 20px;
          border: 1px solid ${C.border};
          padding: 1.25rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .bcp-muthawif-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight});
          color: white;
          font-size: 1.25rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .bcp-muthawif-info { flex: 1; min-width: 0; }
        .bcp-muthawif-name {
          font-weight: 800;
          font-size: 1rem;
          color: ${C.charcoal};
          margin-bottom: 0.375rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bcp-muthawif-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .bcp-tag {
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 99px;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .bcp-tag-emerald { background: ${C.emeraldPale}; color: ${C.emerald}; }
        .bcp-tag-gold { background: rgba(196,151,59,0.12); color: ${C.gold}; }
        .bcp-profile-link {
          flex-shrink: 0;
          font-size: 0.75rem;
          font-weight: 800;
          color: ${C.emerald};
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.2rem;
          padding: 0.5rem 0.75rem;
          background: ${C.emeraldPale};
          border-radius: 12px;
        }

        /* ─── Detail List (Compact) ─── */
        .bcp-detail-list {
          background: white;
          border-radius: 20px;
          border: 1px solid ${C.border};
          padding: 0.5rem 1.25rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .bcp-detail-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.875rem 0;
          border-bottom: 1px dashed ${C.border};
        }
        .bcp-detail-row:last-child { border-bottom: none; }
        .bcp-detail-label-wrapper {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .bcp-detail-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.8;
        }
        .bcp-detail-label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: ${C.muted};
        }
        .bcp-detail-value {
          font-weight: 800;
          font-size: 0.875rem;
          color: ${C.charcoal};
          text-align: right;
        }

        /* ─── Deadline Banner ─── */
        .bcp-deadline-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: rgba(196,151,59,0.08);
          border: 1px solid rgba(196,151,59,0.3);
          border-radius: 16px;
          padding: 1rem 1.25rem;
        }

        /* ─── Total Card ─── */
        .bcp-total-card {
          border-radius: 20px;
          border: 1.5px solid;
          padding: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .bcp-total-label {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.25rem;
        }
        .bcp-total-sub { font-size: 0.8125rem; color: ${C.muted}; }
        .bcp-total-promo {
          font-size: 0.75rem;
          color: ${C.emerald};
          font-weight: 700;
          margin-top: 0.375rem;
        }
        .bcp-total-amount-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .bcp-total-original {
          font-size: 0.875rem;
          color: ${C.muted};
          text-decoration: line-through;
          margin-bottom: 0.125rem;
        }
        .bcp-total-amount {
          font-size: clamp(1.375rem, 4vw, 1.625rem);
          font-weight: 900;
          flex-shrink: 0;
        }

        /* ─── Success Banner ─── */
        .bcp-success-banner {
          display: flex;
          gap: 1rem;
          align-items: center;
          background: ${C.emeraldPale};
          border: 1px solid ${C.emerald}33;
          border-radius: 20px;
          padding: 1.25rem;
        }
        .bcp-success-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${C.emerald};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ─── Actions ─── */
        .bcp-actions { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
        .bcp-nav-links {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .bcp-btn-secondary, .bcp-btn-primary {
          flex: 1;
          min-width: 140px;
          padding: 0.875rem;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.9375rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s, opacity 0.15s;
        }
        .bcp-btn-secondary {
          border: 1.5px solid ${C.border};
          background: white;
          color: ${C.charcoal};
        }
        .bcp-btn-primary {
          border: none;
          background: ${C.charcoal};
          color: white;
        }
        .bcp-btn-secondary:hover, .bcp-btn-primary:hover { opacity: 0.85; }

        /* ═══════════════════════════
            MOBILE OVERRIDES
        ═══════════════════════════ */
        @media (max-width: 640px) {
          .bcp-container {
            padding: 1.5rem;
            border-radius: 20px;
          }
          .bcp-detail-row {
            flex-direction: column;
            gap: 0.375rem;
            align-items: flex-start;
          }
          .bcp-detail-value {
            padding-left: 2rem;
            text-align: left;
          }
          .bcp-nav-links {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
