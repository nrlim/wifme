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

    // Input Validation
    if (!muthawifId || typeof muthawifId !== 'string' || !startDate || !duration) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }
    // Prevent self-booking
    if (session.id === muthawifId) {
      return NextResponse.json({ error: "Anda tidak dapat memesan Muthawif untuk diri sendiri." }, { status: 400 });
    }
    const durationInt = parseInt(String(duration), 10);
    if (isNaN(durationInt) || durationInt < 1 || durationInt > 60) {
      return NextResponse.json({ error: "Durasi harus antara 1 hingga 60 hari." }, { status: 400 });
    }
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
    }
    // Prevent backdated bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json({ error: "Tanggal pemesanan tidak boleh di masa lalu." }, { status: 400 });
    }
    const sanitizedNotes = notes ? String(notes).trim().slice(0, 1000) : null;

    const end = new Date(start);
    end.setDate(end.getDate() + durationInt);

    const booking = await prisma.$transaction(async (tx) => {
      // 1. Conflict Check
      const conflict = await tx.booking.findFirst({
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
        throw new Error("CONFLICT");
      }

      // 2. Pricing and Profile Calculation
      const [profile, settings] = await Promise.all([
        tx.muthawifProfile.findFirst({ where: { userId: muthawifId } }),
        tx.globalSetting.findUnique({ where: { id: "singleton" } }),
      ]);

      const baseFee = profile ? profile.basePrice * durationInt : 0;
      let serviceFee = 0;
      if (settings) {
        if (settings.feeType === "PERCENT") {
          serviceFee = Math.round(baseFee * (settings.feeValue / 100));
        } else {
          serviceFee = Math.round(settings.feeValue);
        }
      }

      const totalFee = baseFee + serviceFee;
      const hours = parseInt(process.env.AUTO_CANCEL_HOURS || "24");
      const paymentDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

      // 3. Create Booking
      return tx.booking.create({
        data: {
          jamaahId: session.id,
          muthawifId,
          startDate: start,
          endDate: end,
          totalFee,
          baseFee,
          notes: sanitizedNotes,
          status: "PENDING",
          paymentStatus: "UNPAID",
          paymentDeadline,
        },
      });
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    if (error.message === "CONFLICT") {
      return NextResponse.json(
        { error: "Muthawif tidak tersedia pada jadwal tersebut." },
        { status: 409 }
      );
    }
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
            profile: { select: { operatingAreas: true, rating: true } },
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
