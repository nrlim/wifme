import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Valid status transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // terminal
  CANCELLED: [], // terminal
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Status diperlukan." }, { status: 400 });
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Tidak bisa mengubah status dari ${booking.status} ke ${status}.` },
        { status: 422 }
      );
    }

    // Update
    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ booking: updated });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
