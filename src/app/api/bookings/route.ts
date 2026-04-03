import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { muthawifId, startDate, duration, notes } = body;

    if (!muthawifId || !startDate || !duration) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(duration));

    // Check for conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        muthawifId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [
          { startDate: { lt: end } },
          { endDate: { gt: start } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Muthawif tidak tersedia pada jadwal tersebut." },
        { status: 409 }
      );
    }

    const profile = await prisma.muthawifProfile.findFirst({
      where: { userId: muthawifId },
    });

    const totalFee = profile ? profile.basePrice * parseInt(duration) : 0;

    const hours = parseInt(process.env.AUTO_CANCEL_HOURS || "24");
    const paymentDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        jamaahId: session.id,
        muthawifId,
        startDate: start,
        endDate: end,
        totalFee,
        notes,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentDeadline,
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { jamaahId: session.id },
      include: {
        muthawif: {
          select: {
            name: true,
            photoUrl: true,
            profile: { select: { location: true, rating: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
