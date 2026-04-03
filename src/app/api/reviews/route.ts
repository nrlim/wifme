import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/reviews — submit a new review for a completed booking
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, rating, comment } = body;

    if (!bookingId || !rating) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Rating harus antara 1-5." }, { status: 400 });
    }

    // Verify booking belongs to this user and is COMPLETED
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        review: true,
        muthawif: {
          select: {
            id: true,
            profile: { select: { id: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    if (booking.jamaahId !== session.id) {
      return NextResponse.json({ error: "Anda tidak berhak mereview booking ini." }, { status: 403 });
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json({ error: "Hanya booking yang sudah selesai yang bisa direview." }, { status: 400 });
    }

    if (booking.review) {
      return NextResponse.json({ error: "Anda sudah memberikan ulasan untuk booking ini." }, { status: 409 });
    }

    const profileId = booking.muthawif.profile?.id;
    if (!profileId) {
      return NextResponse.json({ error: "Profil muthawif tidak ditemukan." }, { status: 404 });
    }

    // Create review in a transaction, then recalculate average rating
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          bookingId,
          profileId,
          reviewerId: session.id,
          rating: ratingNum,
          comment: comment?.trim() || null,
        },
      });

      // Recalculate average rating for the muthawif profile
      const agg = await tx.review.aggregate({
        where: { profileId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.muthawifProfile.update({
        where: { id: profileId },
        data: {
          rating: agg._avg.rating ?? 0,
          totalReviews: agg._count.rating,
        },
      });

      return newReview;
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/reviews]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
