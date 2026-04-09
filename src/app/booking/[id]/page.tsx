import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import BookingPayButton from "./BookingPayButton";

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
  PAID: "Lunas ✓",
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
    },
  });

  if (!booking) notFound();

  // Only the booking owner or AMIR can see this
  if (session.role !== "AMIR" && booking.jamaah.id !== session.id) {
    redirect("/dashboard");
  }

  const duration = Math.max(
    1,
    Math.round(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
        86400000
    )
  );

  const isPaid = booking.paymentStatus === "PAID";
  const isCancelled = booking.status === "CANCELLED";
  const isUnpaid = booking.paymentStatus === "UNPAID" && !isCancelled;

  const muthawifPhotoInitials = booking.muthawif.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusColor = isPaid
    ? C.emerald
    : isCancelled
    ? C.error
    : C.gold;
  const statusBg = isPaid
    ? C.emeraldPale
    : isCancelled
    ? "#FEF2F2"
    : C.goldPale;

  return (
    <>
      <Navbar user={session} />
      <div
        style={{
          minHeight: "100vh",
          background: C.ivory,
          paddingTop: "5.5rem",
          paddingBottom: "4rem",
        }}
      >
        <div className="container" style={{ maxWidth: 720 }}>
          {/* Back */}
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: C.muted,
              marginBottom: "1.5rem",
              textDecoration: "none",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali ke Dashboard
          </Link>

          {/* Header card */}
          <div
            style={{
              background: C.white,
              borderRadius: 24,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              marginBottom: "1.5rem",
              boxShadow: "0 8px 32px rgba(27,107,74,0.06)",
            }}
          >
            {/* Gradient strip */}
            <div
              style={{
                height: 6,
                background: isPaid
                  ? `linear-gradient(90deg, ${C.emerald}, #34D399)`
                  : isCancelled
                  ? "linear-gradient(90deg, #EF4444, #F87171)"
                  : `linear-gradient(90deg, ${C.gold}, #E4B55A)`,
              }}
            />

            <div style={{ padding: "1.75rem 2rem" }}>
              {/* Status badge + title */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 800,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: "0.375rem",
                    }}
                  >
                    Konfirmasi Pesanan
                  </div>
                  <h1
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 900,
                      color: C.charcoal,
                      margin: "0 0 0.375rem",
                    }}
                  >
                    {isPaid ? "🎉 Pembayaran Berhasil!" : isCancelled ? "❌ Pesanan Dibatalkan" : "⏳ Selesaikan Pembayaran"}
                  </h1>
                  <p style={{ fontSize: "0.875rem", color: C.muted, margin: 0 }}>
                    {isPaid
                      ? "Pesanan Anda telah dikonfirmasi. Muthawif akan segera menghubungi Anda."
                      : isCancelled
                      ? "Pesanan ini telah dibatalkan. Silakan buat pesanan baru."
                      : "Selesaikan pembayaran sebelum batas waktu untuk mengamankan jadwal Anda."}
                  </p>
                </div>

                {/* Status chip */}
                <span
                  style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: 99,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    background: statusBg,
                    color: statusColor,
                    border: `1px solid ${statusColor}33`,
                    flexShrink: 0,
                  }}
                >
                  {PAY_STATUS_LABEL[booking.paymentStatus as string] ?? booking.paymentStatus}
                </span>
              </div>

              {/* Muthawif card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  background: C.ivory,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
                    color: C.white,
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: `3px solid ${C.emeraldPale}`,
                  }}
                >
                  {booking.muthawif.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={booking.muthawif.photoUrl}
                      alt={booking.muthawif.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    muthawifPhotoInitials
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "1.0625rem",
                      color: C.charcoal,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {booking.muthawif.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.375rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    {booking.muthawif.profile?.operatingAreas?.slice(0, 2).map((a) => (
                      <span
                        key={a}
                        style={{
                          background: C.emeraldPale,
                          color: C.emerald,
                          padding: "0.15rem 0.5rem",
                          borderRadius: 99,
                          fontWeight: 700,
                        }}
                      >
                        📍 {a}
                      </span>
                    ))}
                    {booking.muthawif.profile?.experience ? (
                      <span
                        style={{
                          background: C.goldPale,
                          color: C.gold,
                          padding: "0.15rem 0.5rem",
                          borderRadius: 99,
                          fontWeight: 700,
                        }}
                      >
                        {booking.muthawif.profile.experience} th pengalaman
                      </span>
                    ) : null}
                  </div>
                </div>
                <Link
                  href={`/muthawif/${booking.muthawif.id}`}
                  style={{
                    flexShrink: 0,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: C.emerald,
                    textDecoration: "underline",
                  }}
                >
                  Lihat Profil →
                </Link>
              </div>

              {/* Detail rows */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                {[
                  {
                    icon: "📋",
                    label: "Order ID",
                    value: `#${booking.id.slice(0, 8).toUpperCase()}`,
                    mono: true,
                  },
                  {
                    icon: "📅",
                    label: "Tanggal Mulai",
                    value: new Date(booking.startDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  },
                  {
                    icon: "⏱",
                    label: "Durasi",
                    value: `${duration} hari`,
                  },
                  {
                    icon: "📅",
                    label: "Tanggal Selesai",
                    value: new Date(booking.endDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  },
                  {
                    icon: "📌",
                    label: "Status Pesanan",
                    value: STATUS_LABEL[booking.status] || booking.status,
                  },
                  ...(booking.notes
                    ? [{ icon: "📝", label: "Catatan", value: booking.notes, mono: false }]
                    : []),
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "0.875rem 1rem",
                      background: C.ivory,
                      borderRadius: 14,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 800,
                        color: C.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {item.icon} {item.label}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: C.charcoal,
                        fontFamily: item.mono ? "monospace" : "inherit",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div
                style={{
                  padding: "1.125rem 1.25rem",
                  background: isPaid ? C.emeraldPale : C.goldPale,
                  borderRadius: 16,
                  border: `1px solid ${isPaid ? C.emerald : C.gold}33`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: isUnpaid ? "1rem" : 0,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: isPaid ? C.emerald : C.gold,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Total Pembayaran
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: C.muted }}>
                    Tarif muthawif + biaya layanan platform
                  </div>
                  {(booking as any).discountAmount > 0 && (
                    <div style={{ fontSize: "0.75rem", color: C.emerald, fontWeight: 700, marginTop: "0.25rem" }}>
                      🏷️ Promo diterapkan — Hemat Rp {((booking as any).discountAmount as number).toLocaleString("id-ID")}
                    </div>
                  )}
                </div>
                <div>
                  {(booking as any).discountAmount > 0 && (
                    <div style={{ fontSize: "0.875rem", color: C.muted, textDecoration: "line-through", textAlign: "right" }}>
                      Rp {(booking.totalFee + (booking as any).discountAmount).toLocaleString("id-ID")}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "1.625rem",
                      fontWeight: 900,
                      color: isPaid ? C.emerald : C.charcoal,
                    }}
                  >
                    Rp {booking.totalFee.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* Payment deadline warning */}
              {isUnpaid && booking.paymentDeadline && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "0.75rem 1rem",
                    background: "rgba(196,151,59,0.07)",
                    border: `1px solid ${C.gold}44`,
                    borderRadius: 12,
                    fontSize: "0.8125rem",
                    color: C.gold,
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    fontWeight: 600,
                  }}
                >
                  ⏰ Batas pembayaran:{" "}
                  <strong>
                    {new Date(booking.paymentDeadline).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </strong>
                </div>
              )}

              {isUnpaid && (
                <BookingPayButton
                  bookingId={booking.id}
                  amount={booking.totalFee}
                  muthawifName={booking.muthawif.name}
                  jamaahId={booking.jamaah.id}
                  initialVoucher={initialPromo}
                />
              )}

              {/* Success state */}
              {isPaid && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    padding: "1.25rem",
                    background: C.emeraldPale,
                    borderRadius: 16,
                    border: `1px solid ${C.emerald}33`,
                    display: "flex",
                    gap: "0.875rem",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: C.emerald,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 800,
                        color: C.emerald,
                        fontSize: "0.9375rem",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Pembayaran Dikonfirmasi
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: C.muted, lineHeight: 1.6 }}>
                      Muthawif telah mendapatkan notifikasi. Persiapkan perjalanan ibadah Anda! 🕌
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav links */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/dashboard"
              style={{
                flex: 1,
                minWidth: 140,
                padding: "0.875rem",
                borderRadius: 14,
                border: `1.5px solid ${C.border}`,
                background: C.white,
                color: C.charcoal,
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              📋 Lihat Semua Pesanan
            </Link>
            <Link
              href="/search"
              style={{
                flex: 1,
                minWidth: 140,
                padding: "0.875rem",
                borderRadius: 14,
                border: "none",
                background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldLight})`,
                color: C.white,
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              🔍 Cari Muthawif Lain
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
