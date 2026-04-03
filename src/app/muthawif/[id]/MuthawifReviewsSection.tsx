"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date;
  reviewer: { name: string; photoUrl: string | null };
}

interface RatingSummary {
  rating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

interface Props {
  muthawifId: string;
  muthawifName: string;
  initialReviews: Review[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
  summary: RatingSummary;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <svg key={v} width="14" height="14" viewBox="0 0 24 24"
          fill={v <= rating ? "var(--gold)" : "none"}
          stroke={v <= rating ? "var(--gold)" : "var(--border)"}
          strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

function DistributionBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", width: 48, textAlign: "right", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 8, borderRadius: 99, background: "var(--ivory-dark)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 99,
          background: "linear-gradient(90deg, var(--gold-light), var(--gold))",
          transition: "width 0.6s ease",
        }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", width: 28, flexShrink: 0 }}>
        {count}
      </span>
    </div>
  );
}

export default function MuthawifReviewsSection({
  muthawifId,
  muthawifName,
  initialReviews,
  initialTotal,
  initialPage,
  totalPages,
  summary,
}: Props) {
  const router = useRouter();
  const [reviews] = useState<Review[]>(initialReviews);
  const [page] = useState(initialPage);

  const navigatePage = (newPage: number) => {
    router.push(`/muthawif/${muthawifId}?page=${newPage}`);
  };

  const hasReviews = initialTotal > 0;

  return (
    <section>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--charcoal)" }}>
          Ulasan Jamaah
        </h2>
        {hasReviews && (
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-muted)" }}>
            {initialTotal} ulasan
          </span>
        )}
      </div>

      {/* Rating overview — only if reviews exist */}
      {hasReviews && (
        <div style={{
          background: "white", borderRadius: 20, border: "1px solid var(--border)",
          padding: "1.5rem", marginBottom: "1.5rem",
          boxShadow: "var(--shadow-sm)",
          display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start",
        }}>
          {/* Aggregate */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "var(--charcoal)", lineHeight: 1, marginBottom: "0.5rem" }}>
              {summary.rating.toFixed(1)}
            </div>
            <div style={{ display: "flex", gap: 3, marginBottom: "0.375rem" }}>
              {[1, 2, 3, 4, 5].map((v) => {
                const fill = v <= Math.round(summary.rating);
                return (
                  <svg key={v} width="18" height="18" viewBox="0 0 24 24"
                    fill={fill ? "var(--gold)" : "none"}
                    stroke={fill ? "var(--gold)" : "var(--border)"}
                    strokeWidth="1.5">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                );
              })}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
              {summary.totalReviews} ulasan
            </div>
          </div>

          {/* Distribution bars */}
          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[5, 4, 3, 2, 1].map((star) => (
              <DistributionBar
                key={star}
                label={`${star} ★`}
                count={summary.distribution[star] ?? 0}
                total={summary.totalReviews}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      {!hasReviews ? (
        <div style={{
          background: "white", borderRadius: 20, border: "1px dashed var(--border)",
          padding: "3rem 2rem", textAlign: "center",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--ivory-dark)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
          <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>Belum Ada Ulasan</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
            {muthawifName} belum memiliki ulasan. Jadilah yang pertama memberikan ulasan setelah perjalanan Anda!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {reviews.map((review, i) => {
            const date = new Date(review.createdAt);
            const reviewerInitials = review.reviewer.name
              .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div
                key={review.id}
                style={{
                  background: "white", borderRadius: 18,
                  border: "1px solid var(--border)", padding: "1.25rem 1.5rem",
                  boxShadow: "var(--shadow-sm)",
                  animation: `fadeInUp 0.3s ease ${i * 0.05}s both`,
                }}
              >
                <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                  {/* Reviewer avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, var(--emerald), #2A8A60)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: "0.875rem", overflow: "hidden",
                  }}>
                    {review.reviewer.photoUrl
                      ? <img src={review.reviewer.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : reviewerInitials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--charcoal)" }}>
                        {review.reviewer.name}
                      </span>
                      <StarRow rating={review.rating} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                        {date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>

                    {review.comment ? (
                      <p style={{ fontSize: "0.9rem", color: "var(--text-body)", lineHeight: 1.65, margin: 0 }}>
                        {review.comment}
                      </p>
                    ) : (
                      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                        Tidak ada komentar.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap",
            }}>
              <button
                onClick={() => navigatePage(page - 1)}
                disabled={page <= 1}
                style={{
                  padding: "0.5rem 1rem", borderRadius: 10, border: "1px solid var(--border)",
                  background: "white", cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontSize: "0.875rem", fontWeight: 600, color: page <= 1 ? "var(--text-muted)" : "var(--charcoal)",
                  opacity: page <= 1 ? 0.5 : 1, fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "0.25rem",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: "0.5rem 0.25rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => navigatePage(item as number)}
                      style={{
                        width: 38, height: 38, borderRadius: 10, border: "1px solid",
                        borderColor: page === item ? "var(--emerald)" : "var(--border)",
                        background: page === item ? "var(--emerald)" : "white",
                        color: page === item ? "white" : "var(--charcoal)",
                        fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => navigatePage(page + 1)}
                disabled={page >= totalPages}
                style={{
                  padding: "0.5rem 1rem", borderRadius: 10, border: "1px solid var(--border)",
                  background: "white", cursor: page >= totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.875rem", fontWeight: 600, color: page >= totalPages ? "var(--text-muted)" : "var(--charcoal)",
                  opacity: page >= totalPages ? 0.5 : 1, fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "0.25rem",
                }}
              >
                Next
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Halaman {page} dari {totalPages} · {initialTotal} ulasan total
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
