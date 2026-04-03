import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.jamaahId !== session.id) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Booking already paid" }, { status: 400 });
    }

    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
      return NextResponse.json({ error: "Cannot pay for a closed booking" }, { status: 400 });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({ message: "Payment simulation successful" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server saat memproses pembayaran" }, { status: 500 });
  }
}
