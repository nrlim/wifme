import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import MuthawifCard from "@/components/MuthawifCard";
import Link from "next/link";
import SearchFilterBar from "@/components/SearchFilterBar";
import GuestSearchBanner from "@/components/GuestSearchBanner";
import { getFeeConfig, type FeeConfig } from "@/lib/fee";

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

  // Filter if specific location is selected (not ALL)
  const locationFilter =
    location && location !== "ALL"
      ? {
          operatingAreas: { has: location },
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

/* ── Skeleton Card ───────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
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
function EmptyState({ startDate, duration, location, supportedLocations }: { startDate?: string; duration?: string; location?: string; supportedLocations?: string[] }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "6rem 2rem", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: "var(--emerald-pale)", color: "var(--emerald)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 8px 32px rgba(27,107,74,0.15)" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
      </div>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.5rem" }}>Muthawif Tidak Ditemukan</h2>
      <p style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "2rem", maxWidth: 500, margin: "0 auto 2rem" }}>
        Maaf, kami tidak menemukan muthawif yang tersedia untuk jadwal tersebut. Silakan coba ubah tanggal, durasi, atau lokasi.
      </p>
      
      <div style={{ background: "white", padding: "1.5rem", borderRadius: 20, boxShadow: "var(--shadow-sm)", textAlign: "left" }}>
        <SearchFilterBar startDate={startDate} duration={duration} location={location} supportedLocations={supportedLocations} forceOpen />
      </div>
    </div>
  );
}

/* ── Search Results (Server Component) ───────────────────────── */
async function SearchResults({
  startDate, duration, location, isLoggedIn, dashboardHref, searchLocation, feeConfig, supportedLocations,
}: {
  startDate?: string;
  duration?: string;
  location?: string;
  isLoggedIn: boolean;
  dashboardHref: string;
  searchLocation?: string;
  feeConfig: FeeConfig;
  supportedLocations: string[];
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

  if (muthawifs.length === 0) {
    return <EmptyState startDate={startDate} duration={duration} location={location} supportedLocations={supportedLocations} />;
  }

  return (
    <>
      {muthawifs.map((m: any) => (
        <MuthawifCard
          key={m.id}
          muthawif={m}
          startDate={startDate}
          duration={duration}
          isLoggedIn={isLoggedIn}
          dashboardHref={dashboardHref}
          searchLocation={searchLocation}
          feeConfig={feeConfig}
        />
      ))}
    </>
  );
}

/* ── Guest Sidebar Widget (Desktop only) ── */
function GuestSidebarWidget() {
  return (
    <div style={{
      background: "linear-gradient(155deg, #0d2818 0%, #1B6B4A 100%)",
      borderRadius: 20,
      padding: "1.5rem",
      color: "white",
      position: "sticky",
      top: "5.5rem",
    }}>
      {/* Icon */}
      <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>🕌</div>
      <h3 style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,0.7)", fontWeight: 900, marginBottom: "0.5rem", lineHeight: 1.3 }}>
        Pesan Muthawif Terpercaya
      </h3>
      <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
        Daftar gratis dan langsung bisa pesan Muthawif terverifikasi untuk ibadah Umrah Anda.
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1.25rem" }}>
        {[
          { num: "500+", lbl: "Muthawif" },
          { num: "4.9★", lbl: "Rating" },
          { num: "10K+", lbl: "Jamaah" },
          { num: "24/7", lbl: "Support" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "0.625rem 0.75rem",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ fontSize: "1.0625rem", fontWeight: 900, color: "white" }}>{s.num}</div>
            <div style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.04em" }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Trust points */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.375rem" }}>
        {[
          "✅ Muthawif terverifikasi resmi",
          "🔒 Pembayaran 100% aman",
          "📞 Support 24/7 siap membantu",
          "🎯 Filter sesuai kebutuhan",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.8)" }}>
            {item}
          </div>
        ))}
      </div>

      <Link
        href="/auth/register"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
          background: "linear-gradient(135deg, #C4973B, #E4B55A)",
          color: "white",
          padding: "0.75rem 1rem",
          borderRadius: 12,
          fontSize: "0.875rem",
          fontWeight: 800,
          textDecoration: "none",
          boxShadow: "0 4px 16px rgba(196,151,59,0.4)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        ✨ Daftar Gratis Sekarang
      </Link>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { startDate, duration, location } = params;

  const [session, feeConfig, globalSet] = await Promise.all([
    getSession(),
    getFeeConfig(),
    prisma.globalSetting.findUnique({ where: { id: "singleton" } }),
  ]);

  const supportedLocations = (globalSet as any)?.supportedLocations || ["Makkah", "Madinah"];
  const isLoggedIn = !!session;
  const dashboardHref = session?.role === "MUTHAWIF"
    ? "/dashboard/muthawif"
    : "/dashboard";

  const hasFilters = !!(startDate || duration || (location && location !== "ALL"));

  return (
    <>
      <Navbar user={session} />

      <div style={{ minHeight: "100vh", background: "var(--ivory)", paddingTop: "4.5rem" }}>

        {/* ─── Guest Banner with Value Prop ─── */}
        {!isLoggedIn && <GuestSearchBanner />}

        {/* ─── Page Header ─── */}
        <div style={{
          background: "linear-gradient(160deg, #ffffff 0%, var(--emerald-pale) 100%)",
          borderBottom: "1px solid var(--border)",
          padding: "2rem 1.5rem 1.75rem",
        }}>
          <div className="sp-container">

            {/* Title + subtitle */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
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
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                fontWeight: 900, color: "var(--charcoal)",
                lineHeight: 1.15, letterSpacing: "-0.025em",
                marginBottom: "0.5rem",
              }}>
                Temukan{" "}
                <span style={{
                  background: "linear-gradient(135deg, var(--emerald), #27956A)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  Muthawif
                </span>
                {" "}Terbaik
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", lineHeight: 1.65, maxWidth: 560, margin: "0 auto" }}>
                {hasFilters
                  ? `Menampilkan Muthawif tersedia${startDate ? ` mulai ${new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}` : ""}${duration ? ` · ${duration} hari` : ""}${location && location !== "ALL" ? ` · ${LOCATION_LABELS[location] || location}` : ""}`
                  : "Muthawif berpengalaman & berlisensi siap mendampingi ibadah Anda di Tanah Suci."
                }
              </p>
            </div>

            {/* Filter Bar — full width */}
            <SearchFilterBar
              startDate={startDate}
              duration={duration}
              location={location}
              supportedLocations={supportedLocations}
            />

          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div style={{ padding: "2rem 1.5rem 5rem" }}>
          <div className="sp-container">

            {/* Desktop: 2-col layout (sidebar + grid) for guests, full grid for logged in */}
            <div className={`sp-layout ${!isLoggedIn ? "sp-layout-guest" : ""}`}>

              {/* ─── Guest sidebar (desktop only) ─── */}
              {!isLoggedIn && (
                <aside className="sp-sidebar">
                  <GuestSidebarWidget />
                </aside>
              )}

              {/* ─── Results grid ─── */}
              <div className="sp-results">


                {/* Cards grid */}
                <Suspense fallback={
                  <div className="sp-cards-grid">
                    {[1, 2, 3, 4, 5, 6].map((n) => <SkeletonCard key={n} />)}
                  </div>
                }>
                  <div className="sp-cards-grid">
                    <SearchResults
                      startDate={startDate}
                      duration={duration}
                      location={location}
                      isLoggedIn={isLoggedIn}
                      dashboardHref={dashboardHref}
                      searchLocation={location}
                      feeConfig={feeConfig as any}
                      supportedLocations={supportedLocations}
                    />
                  </div>
                </Suspense>

              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ─── Global page CSS ─── */}
      <style>{`
        /* Container — wider than standard for search page */
        .sp-container {
          width: 95%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0;
        }

        /* Two-col layout for guests on desktop */
        .sp-layout {
          display: block;
        }
        .sp-layout-guest {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        /* Sidebar hidden on mobile */
        .sp-sidebar {
          display: none;
        }

        /* Cards grid — 1 col mobile, expands on desktop */
        .sp-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.125rem;
        }

        /* ── sm: 2 cols ── */
        @media (min-width: 600px) {
          .sp-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ── md: sidebar appears, grid adjusts ── */
        @media (min-width: 900px) {
          .sp-layout-guest {
            grid-template-columns: 260px 1fr;
          }
          .sp-sidebar {
            display: block;
          }
          /* Guest: 2 col cards in the main area */
          .sp-layout-guest .sp-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          /* Logged in: 3 cols */
          .sp-layout:not(.sp-layout-guest) .sp-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* ── xl: even more columns ── */
        @media (min-width: 1200px) {
          .sp-layout-guest {
            grid-template-columns: 320px 1fr;
          }
          .sp-layout-guest .sp-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .sp-layout:not(.sp-layout-guest) .sp-cards-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* ── 2xl: ultra wide ── */
        @media (min-width: 1600px) {
          .sp-layout-guest .sp-cards-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .sp-layout:not(.sp-layout-guest) .sp-cards-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>
    </>
  );
}
