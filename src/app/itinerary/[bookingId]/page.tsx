import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, ChevronLeft, Clock, MapPin, PackageCheck, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

function shortBookingId(id: string): string {
  return id.includes("-") ? id.split("-")[0].toUpperCase() : id.slice(0, 8).toUpperCase();
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

function formatShortDate(value: Date): string {
  return value.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default async function ItineraryPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      jamaah: { select: { id: true, name: true } },
      muthawif: {
        select: {
          id: true,
          name: true,
          profile: { select: { operatingAreas: true } },
        },
      },
      bundle: { select: { name: true } },
      items: {
        include: { activity: true },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!booking) notFound();

  const isJamaahOwner = session.role === "JAMAAH" && booking.jamaahId === session.id;
  const isMuthawifOwner = session.role === "MUTHAWIF" && booking.muthawifId === session.id;
  if (!isJamaahOwner && !isMuthawifOwner) notFound();

  if (booking.paymentStatus !== "PAID" || !["CONFIRMED", "COMPLETED"].includes(booking.status)) {
    redirect(session.role === "MUTHAWIF" ? "/dashboard/muthawif/bookings" : "/dashboard?tab=beranda");
  }

  const shortId = shortBookingId(booking.id);
  const backHref = session.role === "MUTHAWIF" ? "/dashboard/muthawif/bookings" : "/dashboard?tab=beranda";
  const counterpartName = session.role === "MUTHAWIF" ? booking.jamaah.name : booking.muthawif.name;
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
      price: item.price,
    };
  });

  const totalDurationDays = generatedItems.reduce((sum, item) => sum + item.durationDays, 0);
  const completed = booking.status === "COMPLETED";

  const computedStartDate = booking.items.length > 0 ? booking.items.reduce((min, item) => item.date < min ? item.date : min, booking.items[0].date) : new Date();
  const computedEndDate = booking.items.length > 0 ? booking.items.reduce((max, item) => { const end = addDays(item.date, item.activity?.durationDays ?? 1); return end > max ? end : max; }, new Date(0)) : new Date();

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--ivory)",
        paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
      }}
    >
      <section
        style={{
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: 900,
          padding: "1rem 1rem 2rem",
        }}
      >
        {/* Back button */}
        <div>
          <Link
            id="itinerary-back-link"
            href={backHref}
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
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
              minHeight: 42,
            }}
          >
            <ChevronLeft size={16} />
            Kembali
          </Link>
        </div>

        {/* Hero card */}
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Gradient header */}
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
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 60,
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
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "rgba(255,255,255,0.55)",
                  marginBottom: "0.5rem",
                }}
              >
                Itinerary Booking #{shortId}
              </div>
              <h1
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
              >
                Itinerary Kegiatan
              </h1>
              <p style={{ margin: 0, fontSize: "0.9375rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                Itinerary ini dibuat otomatis dari kegiatan yang dipilih Jamaah saat booking.
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              background: "white",
            }}
          >
            {[
              {
                icon: <UserRound size={14} color="var(--emerald)" />,
                label: session.role === "MUTHAWIF" ? "Jamaah" : "Muthawif",
                value: counterpartName,
              },
              {
                icon: <CalendarDays size={14} color="var(--emerald)" />,
                label: "Perjalanan",
                value: `${formatDate(computedStartDate)} – ${formatDate(computedEndDate)}`,
              },
              {
                icon: <Clock size={14} color="var(--gold)" />,
                label: "Durasi",
                value: `${totalDurationDays} hari`,
              },
              {
                icon: <PackageCheck size={14} color="var(--gold)" />,
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
                    fontSize: "0.6rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    marginBottom: "0.375rem",
                  }}
                >
                  {stat.icon}
                  {stat.label}
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--charcoal)", lineHeight: 1.35 }}>
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "1.125rem 1.5rem",
              borderBottom: "1px solid var(--border)",
              background: "var(--ivory)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--text-muted)",
                  marginBottom: "0.25rem",
                }}
              >
                Rangkaian Kegiatan
              </div>
              <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 900, color: "var(--charcoal)" }}>
                {generatedItems.length} agenda otomatis
              </h2>
            </div>
            <span
              style={{
                padding: "0.3rem 0.875rem",
                borderRadius: 99,
                fontSize: "0.75rem",
                fontWeight: 800,
                background: completed ? "var(--emerald-pale)" : "rgba(196,151,59,0.12)",
                color: completed ? "var(--emerald)" : "var(--gold)",
                whiteSpace: "nowrap",
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
                padding: "3.5rem 2rem",
                textAlign: "center",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-muted)",
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
                  {/* Left accent bar */}
                  <div
                    style={{
                      width: 4,
                      flexShrink: 0,
                      background: "linear-gradient(to bottom, var(--emerald), var(--gold))",
                    }}
                  />
                  {/* Content */}
                  <div style={{ flex: 1, padding: "1rem 1.125rem", minWidth: 0 }}>
                    {/* Day label + duration badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.625rem",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: "var(--emerald)",
                            marginBottom: "0.25rem",
                          }}
                        >
                          Hari {item.order}
                        </div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "1rem",
                            fontWeight: 900,
                            color: "var(--charcoal)",
                            lineHeight: 1.25,
                          }}
                        >
                          {item.title}
                        </h3>
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
                          whiteSpace: "nowrap",
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
                        <CalendarDays size={13} color="var(--emerald)" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                        <MapPin size={13} color="var(--gold)" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
      </section>
    </main>
  );
}
