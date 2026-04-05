import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { simulatePayment } from "@/actions/finance";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "JAMAAH") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // simulatePayment handles: booking status → CONFIRMED + PAID,
    // escrow wallet credit for muthawif, and transaction log.
    await simulatePayment(bookingId);

    return NextResponse.json({ message: "Payment simulation successful" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";

    // Map known error messages to appropriate status codes
    if (message === "Already paid") {
      return NextResponse.json({ error: "Pesanan ini sudah lunas." }, { status: 400 });
    }
    if (message === "Booking not found") {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
