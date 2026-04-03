import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import MuthawifCard from "@/components/MuthawifCard";
import Link from "next/link";

interface SearchPageProps {
  searchParams: Promise<{
    startDate?: string;
    duration?: string;
    location?: string;
  }>;
}

const LOCATION_LABELS: Record<string, string> = {
  ALL: "Semua Lokasi",
  MAKKAH: "Makkah",
  MADINAH: "Madinah",
  BOTH: "Makkah & Madinah",
};

async function fetchMuthawifs(startDate?: string, duration?: string, location?: string) {
  if (!startDate || !duration) {
    return prisma.muthawifProfile.findMany({
      where: { isAvailable: true, verificationStatus: "VERIFIED" },
      include: { user: { select: { id: true, name: true, email: true, photoUrl: true } } },
      orderBy: { rating: "desc" },
    });
  }

  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + parseInt(duration));

  const locationFilter =
    location && location !== "ALL"
      ? {
          OR: [
            { location: location as "MAKKAH" | "MADINAH" | "BOTH" },
            { location: "BOTH" as const },
          ],
        }
      : {};

  return prisma.muthawifProfile.findMany({
    where: {
      isAvailable: true,
      verificationStatus: "VERIFIED",
      ...locationFilter,
      user: {
        bookingsAsMuthawif: {
          none: {
            status: { in: ["PENDING", "CONFIRMED"] },
            AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
          },
        },
      },
      availability: {
        none: {
          status: { in: ["OFF", "BOOKED"] },
          date: { gte: start, lt: end },
        },
      },
    },
    include: { user: { select: { id: true, name: true, email: true, photoUrl: true } } },
    orderBy: { rating: "desc" },
  });
}

/* ── Skeleton Cards ───────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: "white",
      borderRadius: 20,
      border: "1px solid var(--border)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--ivory-dark)", flexShrink: 0 }} className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: "60%", background: "var(--ivory-dark)", borderRadius: 8, marginBottom: 8 }} className="animate-pulse" />
            <div style={{ height: 10, width: "40%", background: "var(--ivory-dark)", borderRadius: 8 }} className="animate-pulse" />
          </div>
        </div>
      </div>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ height: 10, width: "90%", background: "var(--ivory-dark)", borderRadius: 8, marginBottom: 8 }} className="animate-pulse" />
        <div style={{ height: 10, width: "70%", background: "var(--ivory-dark)", borderRadius: 8, marginBottom: 20 }} className="animate-pulse" />
        <div style={{ height: 44, background: "var(--ivory-dark)", borderRadius: 12 }} className="animate-pulse" />
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────── */
function EmptyState() {
  return (
    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem 2rem" }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "var(--ivory-dark)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 1.5rem",
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "0.75rem", color: "var(--charcoal)" }}>
        Muthawif Tidak Ditemukan
      </h3>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem", maxWidth: 360, margin: "0 auto 2rem", lineHeight: 1.6, fontSize: "0.9375rem" }}>
        Tidak ada Muthawif tersedia untuk kriteria yang dipilih. Coba ubah tanggal atau lokasi.
      </p>
      <Link href="/" className="btn btn-secondary" style={{ display: "inline-flex" }}>
        ← Ubah Pencarian
      </Link>
    </div>
  );
}

/* ── Search Results (Server Component) ───────────────────────── */
async function SearchResults({
  startDate, duration, location, isLoggedIn,
}: {
  startDate?: string;
  duration?: string;
  location?: string;
  isLoggedIn: boolean;
}) {
  let muthawifs: Awaited<ReturnType<typeof fetchMuthawifs>> = [];

  try {
    muthawifs = await fetchMuthawifs(startDate, duration, location);
  } catch {
    return (
      <div className="alert alert-error" style={{ gridColumn: "1/-1" }}>
        Koneksi database gagal. Pastikan DATABASE_URL sudah benar.
      </div>
    );
  }

  if (muthawifs.length === 0) return <EmptyState />;

  return (
    <>
      {muthawifs.map((m: any) => (
        <MuthawifCard
          key={m.id}
          muthawif={m}
          startDate={startDate}
          duration={duration}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </>
  );
}

/* ── Main Page ───────────────────────────────────── */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const session = await getSession();
  const { startDate, duration, location } = params;
  const isLoggedIn = !!session;

  const hasFilters = startDate || duration || (location && location !== "ALL");

  return (
    <>
      <Navbar user={session} />

      <div style={{ minHeight: "100vh", background: "var(--ivory)", paddingTop: "4.5rem" }}>

        {/* ─── Guest Banner (not logged in) ─── */}
        {!isLoggedIn && (
          <div style={{
            background: "linear-gradient(135deg, var(--emerald) 0%, #27956A 100%)",
            padding: "0.875rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}>
            <span style={{ color: "white", fontSize: "0.875rem", fontWeight: 600, textAlign: "center" }}>
              🔒 Masuk atau daftar untuk langsung memesan Muthawif pilihan Anda
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <Link href="/auth/login" style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.4)",
                padding: "0.375rem 1rem",
                borderRadius: 8,
                fontSize: "0.8125rem",
                fontWeight: 700,
                textDecoration: "none",
                backdropFilter: "blur(4px)",
              }}>
                Masuk
              </Link>
              <Link href="/auth/register" style={{
                background: "white",
                color: "var(--emerald)",
                padding: "0.375rem 1rem",
                borderRadius: 8,
                fontSize: "0.8125rem",
                fontWeight: 800,
                textDecoration: "none",
              }}>
                Daftar Gratis
              </Link>
            </div>
          </div>
        )}

        {/* ─── Page Header ─── */}
        <div style={{
          background: "linear-gradient(160deg, #ffffff 0%, var(--emerald-pale) 100%)",
          borderBottom: "1px solid var(--border)",
          padding: "2rem 1rem 2.5rem",
        }}>
          <div className="container">
            {/* Title */}
            <div style={{ textAlign: "center", marginBottom: hasFilters ? "1.75rem" : "0" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "var(--emerald-pale)", color: "var(--emerald)",
                fontSize: "0.6875rem", fontWeight: 800,
                letterSpacing: "0.15em", textTransform: "uppercase",
                padding: "0.3rem 0.875rem", borderRadius: 99,
                marginBottom: "0.875rem",
                border: "1px solid rgba(27,107,74,0.15)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ECC71" }} />
                Muthawif Terverifikasi
              </div>
              <h1 style={{
                fontSize: "clamp(1.625rem, 5vw, 2.5rem)",
                fontWeight: 900,
                color: "var(--charcoal)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}>
                Temukan{" "}
                <span style={{
                  background: "linear-gradient(135deg, var(--emerald), #27956A)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  Muthawif
                </span>
                {" "}Terbaik
              </h1>
              <p style={{
                color: "var(--text-muted)",
                fontSize: "0.9375rem",
                lineHeight: 1.65,
                maxWidth: 520,
                margin: "0 auto",
              }}>
                Muthawif berpengalaman & berlisensi siap mendampingi ibadah Anda di Tanah Suci.
              </p>
            </div>

            {/* Filter Chips */}
            {hasFilters && (
              <div style={{
                display: "flex",
                gap: "0.625rem",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
              }}>
                {startDate && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    background: "white",
                    border: "1.5px solid var(--border)",
                    borderRadius: 12,
                    padding: "0.5625rem 0.875rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: "0.5625rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1 }}>Berangkat</div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--charcoal)", lineHeight: 1.3 }}>
                        {new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                )}

                {duration && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    background: "white",
                    border: "1.5px solid var(--border)",
                    borderRadius: 12,
                    padding: "0.5625rem 0.875rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: "0.5625rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1 }}>Durasi</div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--charcoal)", lineHeight: 1.3 }}>
                        {duration} Hari
                      </div>
                    </div>
                  </div>
                )}

                {location && location !== "ALL" && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    background: "white",
                    border: "1.5px solid var(--border)",
                    borderRadius: 12,
                    padding: "0.5625rem 0.875rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div>
                      <div style={{ fontSize: "0.5625rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1 }}>Lokasi</div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--charcoal)", lineHeight: 1.3 }}>
                        {LOCATION_LABELS[location] || location}
                      </div>
                    </div>
                  </div>
                )}

                <Link href="/" style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.5625rem 0.875rem",
                  borderRadius: 12,
                  border: "1.5px solid var(--border)",
                  background: "white",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  whiteSpace: "nowrap",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Ubah Pencarian
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ─── Results Grid ─── */}
        <div style={{ padding: "2rem 0 5rem" }}>
          <div className="container">
            <Suspense fallback={
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
                gap: "1.25rem",
              }}>
                {[1, 2, 3, 4, 5, 6].map((n) => <SkeletonCard key={n} />)}
              </div>
            }>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
                gap: "1.25rem",
              }}>
                <SearchResults
                  startDate={startDate}
                  duration={duration}
                  location={location}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            </Suspense>
          </div>
        </div>

      </div>
    </>
  );
}
