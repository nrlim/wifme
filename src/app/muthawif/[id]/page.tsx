import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import MuthawifReviewsSection from "./MuthawifReviewsSection";

const PAGE_SIZE = 5;

const LOCATION_LABELS: Record<string, string> = {
  MAKKAH: "Makkah",
  MADINAH: "Madinah",
  BOTH: "Makkah & Madinah",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <svg key={v} width={size} height={size} viewBox="0 0 24 24"
          fill={v <= Math.round(rating) ? "var(--gold)" : "none"}
          stroke={v <= Math.round(rating) ? "var(--gold)" : "var(--border)"}
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

  const session = await getSession();

  const profile = await prisma.muthawifProfile.findUnique({
    where: { userId: id },
    include: {
      user: { select: { id: true, name: true, email: true, photoUrl: true } },
    },
  });

  if (!profile || profile.verificationStatus !== "VERIFIED") notFound();

  // Server-side paginated reviews
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

  // Rating distribution
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
      <div style={{ minHeight: "100vh", background: "var(--ivory)", paddingTop: "5.5rem", paddingBottom: "4rem" }}>
        <div className="container" style={{ maxWidth: 820 }}>

          {/* Back link */}
          <Link href="/search" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "1.5rem", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            Kembali ke Pencarian
          </Link>

          {/* Profile Card */}
          <div style={{ background: "white", borderRadius: 28, border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", overflow: "hidden", marginBottom: "2rem" }}>
            {/* Header gradient strip */}
            <div style={{ height: 8, background: "linear-gradient(90deg, var(--emerald), var(--gold), var(--emerald))" }} />

            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{
                  width: 88, height: 88, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--emerald), var(--emerald-light))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontSize: "1.75rem", fontWeight: 800,
                  border: "3px solid var(--emerald-pale)", overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(27,107,74,0.2)",
                }}>
                  {profile.user.photoUrl
                    ? <img src={profile.user.photoUrl} alt={profile.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--charcoal)", marginBottom: "0.375rem" }}>
                    {profile.user.name}
                  </h1>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.875rem" }}>
                    <span className="badge badge-emerald">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
                      {LOCATION_LABELS[profile.location] ?? profile.location}
                    </span>
                    {profile.experience > 0 && (
                      <span className="badge badge-sand">{profile.experience} th pengalaman</span>
                    )}
                    {profile.specializations.slice(0, 2).map((s) => (
                      <span key={s} className="badge badge-gold">{s}</span>
                    ))}
                  </div>

                  {/* Rating summary inline */}
                  {profile.rating > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <StarDisplay rating={profile.rating} size={18} />
                      <span style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--charcoal)" }}>
                        {profile.rating.toFixed(1)}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        ({profile.totalReviews} ulasan)
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic" }}>Belum ada ulasan</span>
                  )}
                </div>

                {/* Price */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Harga / hari</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--emerald)" }}>
                    Rp {profile.basePrice.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {profile.bio && (
                <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "var(--ivory)", borderRadius: 14, borderLeft: "3px solid var(--emerald)" }}>
                  <p style={{ fontSize: "0.9375rem", color: "var(--text-body)", lineHeight: 1.7 }}>{profile.bio}</p>
                </div>
              )}

              {/* Languages */}
              {profile.languages.length > 0 && (
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-muted)", marginRight: "0.25rem" }}>Bahasa:</span>
                  {profile.languages.map((l) => (
                    <span key={l} style={{ fontSize: "0.8125rem", background: "var(--ivory-dark)", color: "var(--brown)", padding: "0.2rem 0.625rem", borderRadius: 99, fontWeight: 500 }}>{l}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reviews Section — client component handles pagination UI + CTA */}
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
      </div>
    </>
  );
}
