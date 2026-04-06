import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import MuthawifReviewsSection from "./MuthawifReviewsSection";
import BookingPanel from "./BookingPanel";
import { getFeeConfig, type FeeConfig } from "@/lib/fee";

const PAGE_SIZE = 5;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    startDate?: string;
    duration?: string;
    location?: string;
  }>;
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <svg key={v} width={size} height={size} viewBox="0 0 24 24"
          fill={v <= Math.round(rating) ? "#F1C40F" : "none"}
          stroke={v <= Math.round(rating) ? "#F1C40F" : "#D1D5DB"}
          strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const profile = await prisma.muthawifProfile.findUnique({
    where: { userId: id },
    include: { user: { select: { name: true } } },
  });
  if (!profile) return { title: "Muthawif Tidak Ditemukan" };
  return {
    title: `${profile.user.name} — Profil Muthawif | Wif–Me`,
    description: profile.bio ?? `Lihat profil dan ulasan muthawif ${profile.user.name}`,
  };
}

export default async function MuthawifDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const backParams = new URLSearchParams();
  if (sp.startDate) backParams.set("startDate", sp.startDate);
  if (sp.duration) backParams.set("duration", sp.duration);
  if (sp.location) backParams.set("location", sp.location);

  const [session, feeConfig] = await Promise.all([
    getSession(),
    getFeeConfig(),
  ]);

  const backHref = session
    ? backParams.toString()
      ? `/dashboard?tab=cari&${backParams.toString()}`
      : "/dashboard?tab=cari"
    : backParams.toString()
    ? `/search?${backParams.toString()}`
    : "/search";

  const profileUrl = `/muthawif/${id}${backParams.toString() ? `?${backParams.toString()}` : ""}`;

  const profile = await prisma.muthawifProfile.findUnique({
    where: { userId: id },
    include: {
      user: { select: { id: true, name: true, email: true, photoUrl: true } },
    },
  });

  if (!profile || profile.verificationStatus !== "VERIFIED") notFound();

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { profileId: profile.id } }),
    prisma.review.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { name: true, photoUrl: true } },
      },
    }),
  ]);

  const distribution = await prisma.review.groupBy({
    by: ["rating"],
    where: { profileId: profile.id },
    _count: { rating: true },
  });

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of distribution) {
    dist[d.rating] = d._count.rating;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const initials = profile.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Navbar user={session} />

      {/* ── Hero Banner ── */}
      <div style={{
        background: "linear-gradient(160deg, #0d2818 0%, #1B6B4A 60%, #27956A 100%)",
        paddingTop: "5.5rem",
        paddingBottom: "5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* decorative blobs */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "absolute", bottom: -80, left: "30%", width: 260, height: 260, borderRadius: "50%", background: "rgba(196,151,59,0.08)" }} />
        </div>

        <div className="mdp-container" style={{ position: "relative" }}>
          {/* Back link */}
          <Link href={backHref} style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.75)",
            marginBottom: "1.75rem", textDecoration: "none",
            transition: "color 0.15s",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali ke Pencarian
          </Link>

          {/* Profile hero row */}
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{
              width: 110, height: 110, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #27956A, #1B6B4A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: "2rem", fontWeight: 900,
              border: "4px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}>
              {profile.user.photoUrl
                ? <img src={profile.user.photoUrl} alt={profile.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Verified badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.3rem",
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 99, padding: "0.2rem 0.625rem",
                fontSize: "0.625rem", fontWeight: 800, color: "rgba(255,255,255,0.9)",
                textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: "0.5rem",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ECC71" }} />
                Terverifikasi AMIR
              </div>

              <h1 style={{
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 900, color: "white",
                margin: "0 0 0.5rem", lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}>
                {profile.user.name}
              </h1>

              {/* Badges row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.75rem" }}>
                {profile.operatingAreas.slice(0, 3).map((area) => (
                  <span key={area} style={{
                    display: "inline-flex", alignItems: "center", gap: "0.25rem",
                    background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 99, padding: "0.25rem 0.625rem",
                    fontSize: "0.75rem", fontWeight: 700, color: "white",
                  }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    {area}
                  </span>
                ))}
                {profile.experience > 0 && (
                  <span style={{
                    background: "rgba(196,151,59,0.25)", border: "1px solid rgba(196,151,59,0.4)",
                    borderRadius: 99, padding: "0.25rem 0.625rem",
                    fontSize: "0.75rem", fontWeight: 700, color: "#F1C40F",
                  }}>
                    {profile.experience} th pengalaman
                  </span>
                )}
                {profile.specializations.slice(0, 2).map((s) => (
                  <span key={s} style={{
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 99, padding: "0.25rem 0.625rem",
                    fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.8)",
                  }}>
                    {s}
                  </span>
                ))}
              </div>

              {/* Rating */}
              {profile.rating > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StarDisplay rating={profile.rating} size={16} />
                  <span style={{ fontWeight: 800, fontSize: "1rem", color: "white" }}>
                    {profile.rating.toFixed(1)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8125rem" }}>
                    ({profile.totalReviews} ulasan)
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                  Belum ada ulasan
                </span>
              )}
            </div>

            {/* Price pill (desktop only) */}
            <div className="mdp-price-hero" style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 20, padding: "1rem 1.5rem",
              textAlign: "center", flexShrink: 0,
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: "0.625rem", fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                Tarif / Hari
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
                Rp {profile.basePrice.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ background: "var(--ivory)", minHeight: "50vh", paddingBottom: "5rem" }}>
        <div className="mdp-container">

          {/* Two-column sticky layout */}
          <div className="mdp-grid" style={{ paddingTop: "2rem" }}>

            {/* LEFT: Detail columns */}
            <div className="mdp-main">

              {/* Bio card */}
              {profile.bio && (
                <div style={{
                  background: "white", borderRadius: 20,
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 12px rgba(27,107,74,0.05)",
                  marginBottom: "1.25rem",
                  overflow: "hidden",
                }}>
                  <div style={{ height: 4, background: "linear-gradient(90deg, var(--emerald), var(--gold))" }} />
                  <div style={{ padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--emerald-pale)", color: "var(--emerald)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                      Tentang Muthawif
                    </h2>
                    <p style={{ fontSize: "0.9375rem", color: "var(--text-body)", lineHeight: 1.75, margin: 0 }}>
                      {profile.bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Stats grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "0.875rem",
                marginBottom: "1.25rem",
              }}>
                {[
                  {
                    icon: "🕌",
                    label: "Pengalaman",
                    value: profile.experience > 0 ? `${profile.experience} Tahun` : "—",
                    color: "var(--emerald)",
                    bg: "var(--emerald-pale)",
                  },
                  {
                    icon: "⭐",
                    label: "Rating",
                    value: profile.rating > 0 ? `${profile.rating.toFixed(1)} / 5` : "Baru",
                    color: "#F59E0B",
                    bg: "rgba(245,158,11,0.1)",
                  },
                  {
                    icon: "💬",
                    label: "Total Ulasan",
                    value: `${profile.totalReviews}`,
                    color: "#6366F1",
                    bg: "rgba(99,102,241,0.08)",
                  },
                  {
                    icon: "📍",
                    label: "Area Operasi",
                    value: profile.operatingAreas.length > 0 ? `${profile.operatingAreas.length} area` : "Semua",
                    color: "var(--gold)",
                    bg: "rgba(196,151,59,0.1)",
                  },
                ].map((s) => (
                  <div key={s.label} style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    padding: "1rem",
                    display: "flex", flexDirection: "column", gap: "0.375rem",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: s.bg, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.125rem", marginBottom: "0.25rem",
                    }}>
                      {s.icon}
                    </div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Languages + Specializations */}
              {(profile.languages.length > 0 || profile.specializations.length > 0) && (
                <div style={{
                  background: "white", borderRadius: 20,
                  border: "1px solid var(--border)",
                  padding: "1.5rem",
                  marginBottom: "1.25rem",
                }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.1)", color: "#6366F1", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
                    </span>
                    Keahlian & Bahasa
                  </h2>
                  {profile.languages.length > 0 && (
                    <div style={{ marginBottom: profile.specializations.length > 0 ? "1rem" : 0 }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                        Bahasa yang dikuasai
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                        {profile.languages.map((l) => (
                          <span key={l} style={{
                            fontSize: "0.8125rem", background: "var(--ivory)", color: "var(--text-body)",
                            border: "1px solid var(--border)", padding: "0.3rem 0.75rem",
                            borderRadius: 99, fontWeight: 600,
                          }}>
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.specializations.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                        Spesialisasi layanan
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                        {profile.specializations.map((s) => (
                          <span key={s} style={{
                            fontSize: "0.8125rem",
                            background: "rgba(196,151,59,0.08)",
                            color: "var(--gold)",
                            border: "1px solid rgba(196,151,59,0.25)",
                            padding: "0.3rem 0.75rem",
                            borderRadius: 99, fontWeight: 700,
                          }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile-only Booking Panel (shown below profile on small screens) */}
              <div className="mdp-booking-mobile">
                <BookingPanel
                  muthawifId={id}
                  muthawifName={profile.user.name}
                  basePrice={profile.basePrice}
                  isLoggedIn={!!session}
                  isJamaah={session?.role === "JAMAAH"}
                  profileUrl={profileUrl}
                  initialStartDate={sp.startDate ?? ""}
                  initialDuration={sp.duration ? parseInt(sp.duration, 10) : 7}
                  feeConfig={feeConfig}
                />
              </div>

              {/* Reviews */}
              <MuthawifReviewsSection
                muthawifId={id}
                muthawifName={profile.user.name}
                initialReviews={reviews}
                initialTotal={total}
                initialPage={page}
                totalPages={totalPages}
                summary={{
                  rating: profile.rating,
                  totalReviews: profile.totalReviews,
                  distribution: dist,
                }}
              />
            </div>

            {/* RIGHT: Sticky booking panel (desktop only) */}
            <div className="mdp-sidebar">
              <div style={{ position: "sticky", top: "6.5rem" }}>
                <BookingPanel
                  muthawifId={id}
                  muthawifName={profile.user.name}
                  basePrice={profile.basePrice}
                  isLoggedIn={!!session}
                  isJamaah={session?.role === "JAMAAH"}
                  profileUrl={profileUrl}
                  initialStartDate={sp.startDate ?? ""}
                  initialDuration={sp.duration ? parseInt(sp.duration, 10) : 7}
                  feeConfig={feeConfig}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        /* ── Container: wider on desktop ── */
        .mdp-container {
          width: 94%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0;
        }

        /* ── 2-col grid: left=content, right=sidebar ── */
        .mdp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        /* Mobile: hide desktop sidebar (duplicate), show inline panel */
        .mdp-sidebar { display: none; }
        .mdp-booking-mobile { display: block; margin-bottom: 1.25rem; }

        /* Desktop: show sidebar, hide inline */
        @media (min-width: 860px) {
          .mdp-grid {
            grid-template-columns: 1fr 360px;
            gap: 1.75rem;
            align-items: start;
          }
          .mdp-sidebar { display: block; }
          .mdp-booking-mobile { display: none; }
          .mdp-price-hero { display: block; }
        }

        /* Hero price pill hidden on mobile */
        .mdp-price-hero { display: none; }
        @media (min-width: 640px) {
          .mdp-price-hero { display: block; }
        }
      `}</style>
    </>
  );
}
