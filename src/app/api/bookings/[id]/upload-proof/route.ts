import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { proofUrl } = body;

    if (!proofUrl || typeof proofUrl !== 'string') {
      return NextResponse.json({ error: "URL bukti wajib diisi." }, { status: 400 });
    }

    try {
      const parsedUrl = new URL(proofUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "URL bukti tidak valid." }, { status: 400 });
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    // Only the jamaah who created the booking can upload proof
    if (booking.jamaahId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Pesanan ini sudah lunas." }, { status: 400 });
    }

    // Update booking payment status
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        paymentProofUrl: proofUrl,
        paymentStatus: "PAYMENT_REVIEW",
        status: "PAYMENT_REVIEW",
        paymentRejectedReason: null,
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Upload proof error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
