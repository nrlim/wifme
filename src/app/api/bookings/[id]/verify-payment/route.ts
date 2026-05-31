import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized. Hanya AMIR yang dapat memverifikasi pembayaran." }, { status: 403 });
    }

    const { id } = await params;
    const { action } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    if (booking.paymentStatus !== "PAYMENT_REVIEW") {
      return NextResponse.json({ error: "Status pembayaran bukan dalam review." }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id },
          data: {
            paymentStatus: "PAID",
            paymentVerifiedAt: new Date(),
            paymentVerifiedBy: session.id,
            status: "CONFIRMED",
          },
        });

        // Pastikan Muthawif memiliki Wallet
        const muthawifWallet = await tx.wallet.upsert({
          where: { userId: booking.muthawifId },
          create: { userId: booking.muthawifId },
          update: {},
        });

        // Update saldo Escrow di Wallet Muthawif
        await tx.wallet.update({
          where: { id: muthawifWallet.id },
          data: {
            escrowBalance: { increment: booking.totalFee },
          },
        });

        // Buat log transaksi
        await tx.transaction.create({
          data: {
            walletId: muthawifWallet.id,
            bookingId: id,
            type: "PAYMENT_ESCROW",
            amount: booking.totalFee,
            status: "SUCCESS",
            referenceId: `MANUAL_VERIFY_${id}`,
          },
        });
      });
      return NextResponse.json({ success: true });
    } else if (action === "reject") {
      await prisma.booking.update({
        where: { id },
        data: {
          paymentStatus: "UNPAID",
          status: "PENDING",
          paymentProofUrl: null,
          paymentRejectedReason: "Bukti pembayaran tidak valid atau dana belum masuk.",
        },
      });
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
