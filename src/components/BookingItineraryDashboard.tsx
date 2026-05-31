import Link from "next/link";
import { CalendarDays, Clock, MapPin, PackageCheck, UserRound, ArrowLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

type Role = "JAMAAH" | "MUTHAWIF";

interface BookingItineraryDashboardProps {
  userId: string;
  role: Role;
  bookingId?: string;
  baseHref: string;
}

function shortBookingId(id: string): string {
  return id.includes("-") ? id.split("-")[0].toUpperCase() : id.slice(0, 8).toUpperCase();
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatShortDate(value: Date): string {
  return value.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const bookingInclude = {
  jamaah: { select: { id: true, name: true } },
  muthawif: { select: { id: true, name: true, profile: { select: { operatingAreas: true } } } },
  bundle: { select: { name: true } },
  items: { include: { activity: true }, orderBy: { date: "asc" as const } },
};

function itineraryHref(baseHref: string, id: string): string {
  return `${baseHref}${baseHref.includes("?") ? "&" : "?"}bookingId=${id}`;
}

export default async function BookingItineraryDashboard({ userId, role, bookingId, baseHref }: BookingItineraryDashboardProps) {
  const ownerWhere = role === "JAMAAH" ? { jamaahId: userId } : { muthawifId: userId };

  /* ─── BOOKING LIST VIEW ─────────────────────────────────────── */
  if (!bookingId) {
    const bookings = await prisma.booking.findMany({
      where: {
        ...ownerWhere,
        paymentStatus: "PAID",
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return (
      <div className="flex flex-col gap-4">
        {/* Page header */}
        <div
          style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "1.25rem 1.5rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              fontSize: "0.65rem",
              fontWeight: 900,
              textTransform: "uppercase" as const,
              letterSpacing: "0.12em",
              color: "var(--emerald)",
              marginBottom: "0.375rem",
            }}
          >
            Itinerary Kegiatan
          </div>
          <h2 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 900, color: "var(--charcoal)", letterSpacing: "-0.02em" }}>
            Pilih Booking
          </h2>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Itinerary dibuat otomatis berdasarkan kegiatan atau bundle yang dipilih saat booking.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div
            style={{
              background: "white",
              border: "1.5px dashed var(--border)",
              borderRadius: 12,
              padding: "3.5rem 2rem",
              textAlign: "center",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--emerald-pale)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                color: "var(--emerald)",
              }}
            >
              <CalendarDays size={24} />
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
              Belum ada itinerary
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Belum ada booking aktif yang memiliki itinerary.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {bookings.map((booking) => {
              const counterpartName = role === "MUTHAWIF" ? booking.jamaah.name : booking.muthawif.name;
              const computedStartDate = booking.items.length > 0 ? booking.items.reduce((min: Date, item: any) => item.date < min ? item.date : min, booking.items[0].date) : new Date();
              const computedEndDate = booking.items.length > 0 ? booking.items.reduce((max: Date, item: any) => { const end = addDays(item.date, item.activity?.durationDays || 1); return end > max ? end : max; }, new Date(0)) : new Date();
              const durationDays = booking.items.reduce((acc: number, item: any) => acc + (item.activity?.durationDays || 1), 0);
              const isCompleted = booking.status === "COMPLETED";
              return (
                <Link
                  id={`itinerary-booking-${booking.id}`}
                  key={booking.id}
                  href={itineraryHref(baseHref, booking.id)}
                  style={{
                    display: "block",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "1.25rem",
                    textDecoration: "none",
                    boxShadow: "var(--shadow-sm)",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Top accent line */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: isCompleted
                        ? "linear-gradient(90deg, #3B82F6, #60A5FA)"
                        : "linear-gradient(90deg, var(--emerald), var(--gold))",
                    }}
                  />
                  <div style={{ paddingTop: "0.375rem" }}>
                    {/* Booking ID + Status row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                      <span
                        style={{
                          background: "var(--emerald-pale)",
                          color: "var(--emerald)",
                          fontSize: "0.6875rem",
                          fontWeight: 900,
                          padding: "0.2rem 0.6rem",
                          borderRadius: 99,
                          letterSpacing: "0.04em",
                        }}
                      >
                        #{shortBookingId(booking.id)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          color: isCompleted ? "#3B82F6" : "var(--gold)",
                        }}
                      >
                        {isCompleted ? "Selesai" : "Aktif"}
                      </span>
                    </div>

                    {/* Name */}
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.25rem", lineHeight: 1.3 }}>
                      {counterpartName}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "1rem" }}>
                      {formatShortDate(computedStartDate)} – {formatShortDate(computedEndDate)}
                    </div>

                    {/* Meta pills */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span
                          style={{
                            background: "var(--ivory)",
                            border: "1px solid var(--border)",
                            color: "var(--charcoal)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.625rem",
                            borderRadius: 99,
                          }}
                        >
                          {durationDays} hari
                        </span>
                        <span
                          style={{
                            background: "var(--ivory)",
                            border: "1px solid var(--border)",
                            color: "var(--charcoal)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.625rem",
                            borderRadius: 99,
                          }}
                        >
                          {booking.bundle?.name ?? `${booking.items.length} kegiatan`}
                        </span>
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ─── BOOKING DETAIL ITINERARY VIEW ─────────────────────────── */
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...ownerWhere,
      paymentStatus: "PAID",
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    include: bookingInclude,
  });

  if (!booking) {
    return (
      <div
        style={{
          background: "white",
          border: "1.5px dashed var(--border)",
          borderRadius: 12,
          padding: "3.5rem 2rem",
          textAlign: "center",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          Itinerary tidak ditemukan atau belum dapat diakses.
        </div>
        <Link
          id="itinerary-back-to-list"
          href={baseHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--emerald)",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 700,
            padding: "0.625rem 1.25rem",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={15} />
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const shortId = shortBookingId(booking.id);
  const counterpartName = role === "MUTHAWIF" ? booking.jamaah.name : booking.muthawif.name;
  const locationLabel = booking.muthawif.profile?.operatingAreas?.join(", ") || "Lokasi menyesuaikan";
  const generatedItems = booking.items.map((item, index) => {
    const durationDays = item.activity?.durationDays ?? 1;
    const startDate = item.date;
    const endDate = addDays(startDate, durationDays);
    return {
      id: item.id,
      order: index + 1,
      title: item.activity?.name ?? "Kegiatan",
      description: item.activity?.description,
      location: item.activity?.location === "BOTH" ? "Makkah & Madinah" : item.activity?.location || locationLabel,
      durationDays,
      startDate,
      endDate,
    };
  });
  const computedStartDate = booking.items.length > 0 ? booking.items.reduce((min: Date, item: any) => item.date < min ? item.date : min, booking.items[0].date) : new Date();
  const computedEndDate = booking.items.length > 0 ? booking.items.reduce((max: Date, item: any) => { const end = addDays(item.date, item.activity?.durationDays || 1); return end > max ? end : max; }, new Date(0)) : new Date();
  const totalDurationDays = generatedItems.reduce((sum, item) => sum + item.durationDays, 0);
  const completed = booking.status === "COMPLETED";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Back button */}
      <div>
        <Link
          id="itinerary-back-list"
          href={baseHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "white",
            border: "1px solid var(--border)",
            color: "var(--charcoal)",
            fontSize: "0.8125rem",
            fontWeight: 700,
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            boxShadow: "var(--shadow-sm)",
            minHeight: 40,
          }}
        >
          <ArrowLeft size={15} />
          Kembali ke daftar
        </Link>
      </div>

      {/* Header card with gradient */}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Gradient hero */}
        <div
          style={{
            background: "linear-gradient(135deg, #0d3326 0%, var(--emerald) 50%, var(--emerald-light) 100%)",
            padding: "1.5rem 1.5rem 1.75rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              right: -30,
              top: -30,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 50,
              bottom: -50,
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
            }}
          />

          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: "0.625rem",
                fontWeight: 900,
                textTransform: "uppercase" as const,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.55)",
                marginBottom: "0.5rem",
              }}
            >
              Itinerary Booking #{shortId}
            </div>
            <h2
              style={{
                margin: "0 0 0.5rem",
                fontSize: "clamp(1.375rem, 4vw, 2rem)",
                fontWeight: 900,
                color: "white",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Itinerary Kegiatan
            </h2>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              Dibuat otomatis dari kegiatan yang dipilih Jamaah saat booking.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 0,
            background: "white",
          }}
        >
          {[
            {
              icon: <UserRound size={15} color="var(--emerald)" />,
              label: role === "MUTHAWIF" ? "Jamaah" : "Muthawif",
              value: counterpartName,
            },
            {
              icon: <CalendarDays size={15} color="var(--emerald)" />,
              label: "Perjalanan",
              value: `${formatShortDate(computedStartDate)} – ${formatShortDate(computedEndDate)}`,
            },
            {
              icon: <Clock size={15} color="var(--gold)" />,
              label: "Durasi",
              value: `${totalDurationDays} hari`,
            },
            {
              icon: <PackageCheck size={15} color="var(--gold)" />,
              label: "Pilihan",
              value: booking.bundle?.name ?? `${generatedItems.length} kegiatan satuan`,
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "1rem 1.25rem",
                borderTop: "1px solid var(--border)",
                borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none",
                background: i % 2 === 0 ? "white" : "var(--ivory)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.625rem",
                  fontWeight: 900,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  marginBottom: "0.375rem",
                }}
              >
                {stat.icon}
                {stat.label}
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--charcoal)", lineHeight: 1.3 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline section */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        {/* Section header */}
        <div
          style={{
            padding: "1.125rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            background: "var(--ivory)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.625rem",
                fontWeight: 900,
                textTransform: "uppercase" as const,
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                marginBottom: "0.25rem",
              }}
            >
              Rangkaian Kegiatan
            </div>
            <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 900, color: "var(--charcoal)" }}>
              {generatedItems.length} agenda otomatis
            </h3>
          </div>
          <span
            style={{
              padding: "0.3rem 0.875rem",
              borderRadius: 99,
              fontSize: "0.75rem",
              fontWeight: 800,
              background: completed ? "var(--emerald-pale)" : "rgba(196,151,59,0.12)",
              color: completed ? "var(--emerald)" : "var(--gold)",
              whiteSpace: "nowrap" as const,
              flexShrink: 0,
            }}
          >
            {completed ? "Selesai" : "Aktif"}
          </span>
        </div>

        {/* Items */}
        {generatedItems.length === 0 ? (
          <div
            style={{
              padding: "3rem 2rem",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Belum ada kegiatan pada booking ini.
          </div>
        ) : (
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {generatedItems.map((item) => (
              <article
                key={item.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  background: "white",
                  display: "flex",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                {/* Left accent */}
                <div
                  style={{
                    width: 4,
                    flexShrink: 0,
                    background: "linear-gradient(to bottom, var(--emerald), var(--gold))",
                  }}
                />
                {/* Content */}
                <div style={{ flex: 1, padding: "1rem 1.125rem", minWidth: 0 }}>
                  {/* Top row: day label + duration badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 900,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.1em",
                          color: "var(--emerald)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Hari {item.order}
                      </div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "1rem",
                          fontWeight: 900,
                          color: "var(--charcoal)",
                          lineHeight: 1.25,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.title}
                      </h4>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        background: "var(--emerald-pale)",
                        color: "var(--emerald)",
                        fontSize: "0.6875rem",
                        fontWeight: 800,
                        padding: "0.2rem 0.625rem",
                        borderRadius: 99,
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {item.durationDays} hari
                    </span>
                  </div>

                  {/* Meta: date + location */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      marginTop: "0.625rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        background: "var(--ivory)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "0.4rem 0.625rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                      }}
                    >
                      <CalendarDays size={13} style={{ color: "var(--emerald)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {formatShortDate(item.startDate)} – {formatShortDate(item.endDate)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        background: "var(--ivory)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "0.4rem 0.625rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                      }}
                    >
                      <MapPin size={13} style={{ color: "var(--gold)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {item.location}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p
                      style={{
                        margin: "0.75rem 0 0",
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.6,
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
