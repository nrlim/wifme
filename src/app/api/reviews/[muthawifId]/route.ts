import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 5;

// GET /api/reviews/[muthawifId]?page=1
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ muthawifId: string }> }
) {
  try {
    const { muthawifId } = await params;
    const url = new URL(_req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const skip = (page - 1) * PAGE_SIZE;

    // Resolve profileId from the user id (muthawifId is the User.id)
    const profile = await prisma.muthawifProfile.findUnique({
      where: { userId: muthawifId },
      select: {
        id: true,
        rating: true,
        totalReviews: true,
        user: { select: { name: true, photoUrl: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil muthawif tidak ditemukan." }, { status: 404 });
    }

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
          reviewer: {
            select: { name: true, photoUrl: true },
          },
        },
      }),
    ]);

    // Rating distribution (1-5)
    const distribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { profileId: profile.id },
      _count: { rating: true },
    });

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      dist[d.rating] = d._count.rating;
    }

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
      summary: {
        rating: profile.rating,
        totalReviews: profile.totalReviews,
        distribution: dist,
      },
    });
  } catch (error) {
    console.error("[GET /api/reviews/[muthawifId]]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
