import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { simulatePayment } from "@/actions/finance";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "JAMAAH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, promoCode } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // ── Step 1: Apply promo code if provided (before payment) ───────────────
    if (promoCode) {
      await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
          select: {
            id: true,
            jamaahId: true,
            paymentStatus: true,
            totalFee: true,
            baseFee: true,
            discountAmount: true,
            promotionId: true,
          },
        });

        if (!booking) throw new Error("Booking not found");
        if (booking.paymentStatus === "PAID") throw new Error("Already paid");
        if (booking.jamaahId !== session.id) throw new Error("Unauthorized");

        // Only apply if no promo already applied
        if (booking.promotionId) return; // promo already locked in

        const code = String(promoCode).trim().toUpperCase();
        const promo = await tx.promotion.findUnique({
          where: { code },
          include: {
            bookings: { where: { jamaahId: session.id }, select: { id: true } },
          },
        });

        if (!promo || promo.status !== "ACTIVE") return; // silently ignore invalid
        if (promo.expiryDate && promo.expiryDate < new Date()) return;
        if (promo.maxUsage !== null && promo.usedCount >= promo.maxUsage) return;
        if (booking.totalFee < promo.minBookingAmount) return;
        if (promo.bookings.length > 0) return; // already used by this user

        // Calculate discount against original fee (before any previous discount)
        const originalFee = booking.baseFee > 0
          ? booking.baseFee
          : booking.totalFee + booking.discountAmount;

        // Re-fetch the un-discounted totalFee from baseFee + service portion
        const undiscountedTotal = booking.totalFee + booking.discountAmount;

        let discountAmount = 0;
        if (promo.type === "FIXED_AMOUNT") {
          discountAmount = Math.min(promo.value, undiscountedTotal);
        } else {
          discountAmount = Math.round(undiscountedTotal * (promo.value / 100));
        }
        const newTotalFee = Math.max(0, undiscountedTotal - discountAmount);

        // Apply: update booking + increment usedCount atomically
        await Promise.all([
          tx.booking.update({
            where: { id: bookingId },
            data: {
              totalFee: newTotalFee,
              discountAmount,
              promotionId: promo.id,
            },
          }),
          tx.promotion.update({
            where: { id: promo.id },
            data: { usedCount: { increment: 1 } },
          }),
        ]);
      });
    }

    // ── Step 2: Process payment with the (possibly discounted) totalFee ─────
    await simulatePayment(bookingId);

    return NextResponse.json({ message: "Payment simulation successful" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";

    if (message === "Already paid") {
      return NextResponse.json({ error: "Pesanan ini sudah lunas." }, { status: 400 });
    }
    if (message === "Booking not found") {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
