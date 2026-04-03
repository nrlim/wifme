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

async function SearchResults({
  startDate,
  duration,
  location,
  isLoggedIn,
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
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ color: "var(--error)" }}>Koneksi database belum dikonfigurasi. Silakan setup DATABASE_URL.</p>
      </div>
    );
  }

  if (muthawifs.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "4rem 2rem",
        background: "var(--white)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--ivory-dark)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Muthawif Tidak Ditemukan
        </h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Tidak ada Muthawif tersedia pada tanggal dan lokasi yang dipilih.
        </p>
        <Link href="/" className="btn btn-secondary">
          Ubah Pencarian
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
      gap: "2rem",
      animation: "fadeInUp 0.5s ease-out forwards"
    }}>
      {muthawifs.map((m) => (
        <MuthawifCard
          key={m.id}
          muthawif={m}
          startDate={startDate}
          duration={duration}
          isLoggedIn={isLoggedIn}
        />
      ))}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

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
          date: {
            gte: start,
            lt: end, // using lt for end because end is the checkout day
          },
        },
      },
    },
    include: { user: { select: { id: true, name: true, email: true, photoUrl: true } } },
    orderBy: { rating: "desc" },
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const session = await getSession();
  const { startDate, duration, location } = params;

  const isLoggedIn = !!session;

  return (
    <>
      <Navbar user={session} />
      <div style={{
        minHeight: "100vh",
        background: "var(--ivory)",
        paddingTop: "6rem",
        paddingBottom: "4rem",
      }}>
        <div className="container">
          {/* Header */}
          <div style={{ 
            marginBottom: "3rem", 
            padding: "2.5rem 2rem", 
            background: "linear-gradient(135deg, white 0%, var(--emerald-pale) 100%)", 
            borderRadius: "24px", 
            border: "1px solid var(--border)", 
            boxShadow: "0 10px 40px rgba(27, 107, 74, 0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center"
          }}>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, marginBottom: "1rem", color: "var(--charcoal)", letterSpacing: "-0.02em" }}>
              Rekomendasi <span style={{ color: "var(--emerald)" }}>Muthawif</span> Anda
            </h1>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem", maxWidth: "600px", lineHeight: "1.6", fontSize: "0.9375rem" }}>
              Berikut adalah daftar Muthawif berlisensi dengan ulasan terbaik yang siap mendampingi ibadah Anda berdasarkan kriteria pencarian yang Anda tentukan.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
              {startDate && (
                <span style={{ background: "white", padding: "0.625rem 1.25rem", borderRadius: "14px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  {new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
              {duration && (
                <span style={{ background: "white", padding: "0.625rem 1.25rem", borderRadius: "14px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {duration} Hari Layanan
                </span>
              )}
              {location && location !== "ALL" && (
                <span style={{ background: "white", padding: "0.625rem 1.25rem", borderRadius: "14px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--charcoal)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {LOCATION_LABELS[location] || location}
                </span>
              )}
            </div>
          </div>

          {/* Results */}
          <Suspense fallback={
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{
                  background: "var(--white)",
                  borderRadius: "var(--radius-lg)",
                  height: 280,
                  border: "1px solid var(--border)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          }>
            <SearchResults
              startDate={startDate}
              duration={duration}
              location={location}
              isLoggedIn={isLoggedIn}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
