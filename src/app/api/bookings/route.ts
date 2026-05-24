import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { applyPromoCodeTx } from "@/actions/promotions";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { muthawifId, items, notes, promoCode, bundleId } = body;

    // Input Validation
    if (!muthawifId || typeof muthawifId !== 'string' || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Data pesanan tidak lengkap." }, { status: 400 });
    }
    // Prevent self-booking
    if (session.id === muthawifId) {
      return NextResponse.json({ error: "Anda tidak dapat memesan Muthawif untuk diri sendiri." }, { status: 400 });
    }

    const sanitizedNotes = notes ? String(notes).trim().slice(0, 1000) : null;
    const sanitizedPromoCode = promoCode ? String(promoCode).trim().toUpperCase() : null;

    // Parse and validate items
    const parsedItems = items.map((item: any) => {
      const date = new Date(item.date);
      if (isNaN(date.getTime())) throw new Error("Format tanggal tidak valid");
      return {
        activityId: String(item.activityId),
        date: date,
        timeSlot: item.timeSlot ? String(item.timeSlot) : null,
        price: Number(item.price),
      };
    });

    // Check backdated
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasPastDate = parsedItems.some((item) => item.date < today);
    if (hasPastDate) {
      return NextResponse.json({ error: "Tanggal pemesanan tidak boleh di masa lalu." }, { status: 400 });
    }

    const startDates = parsedItems.map(i => i.date.getTime());
    const startDate = new Date(Math.min(...startDates));
    const endDate = new Date(Math.max(...startDates));
    const durationInt = parsedItems.length;

    const booking = await prisma.$transaction(async (tx) => {
      // Check for date conflicts (1 date = 1 activity constraint will be handled by unique constraint on BookingItem)
      // But we also might want to check if Muthawif is already booked by ANOTHER jamaah? 
      // The current system checks if the muthawif is fully booked. Since dates don't have to be continuous,
      // it's tricky. Let's just create it and let the muthawif/admin manage. Or we can keep the simple overlap check:
      // A muthawif can only handle one booking per day maybe? We skip conflict check for now since it's activity-based.

      // 2. Pricing and Profile Calculation
      const settings = await tx.globalSetting.findUnique({ where: { id: "singleton" } });

      let baseFee = 0;
      if (bundleId) {
        const bdl = await tx.activityBundle.findUnique({ where: { id: bundleId } });
        if (!bdl) throw new Error("Paket Bundling tidak ditemukan");
        baseFee = bdl.price;
      } else {
        baseFee = parsedItems.reduce((sum, item) => sum + item.price, 0);
      }
      let serviceFee = 0;
      if (settings) {
        if (settings.feeType === "PERCENT") {
          serviceFee = Math.round(baseFee * (settings.feeValue / 100));
        } else {
          serviceFee = Math.round(settings.feeValue);
        }
      }

      let totalFee = baseFee + serviceFee;
      let discountAmount = 0;
      let promotionId: string | null = null;

      // 3. Apply Promo Code (if provided)
      if (sanitizedPromoCode) {
        try {
          const promoResult = await applyPromoCodeTx(tx, sanitizedPromoCode, totalFee, session.id);
          discountAmount = promoResult.discountAmount;
          totalFee = promoResult.finalAmount;
          promotionId = promoResult.promotionId;
        } catch (promoErr: unknown) {
          const promoMsg = promoErr instanceof Error ? promoErr.message : "PROMO_ERROR";
          throw new Error(`PROMO:${promoMsg}`);
        }
      }

      const hours = settings?.paymentTimeoutHours ?? parseInt(process.env.AUTO_CANCEL_HOURS || "24");
      const paymentDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

      // 4. Create Booking
      return tx.booking.create({
        data: {
          jamaahId: session.id,
          muthawifId,
          startDate,
          endDate,
          totalFee,
          baseFee,
          discountAmount,
          ...(promotionId && { promotionId }),
          ...(bundleId && { bundleId }),
          notes: sanitizedNotes,
          status: "PENDING",
          paymentStatus: "UNPAID",
          paymentDeadline,
          items: {
            create: parsedItems.map(item => ({
              activityId: item.activityId,
              date: item.date,
              timeSlot: item.timeSlot,
              price: item.price,
            }))
          }
        },
        include: { items: true }
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
    // Promo-specific errors
    if (error.message?.startsWith("PROMO:")) {
      const promoKey = error.message.replace("PROMO:", "");
      const promoMessages: Record<string, string> = {
        PROMO_INVALID: "Kode promo tidak valid atau sudah tidak aktif.",
        PROMO_EXPIRED: "Kode promo sudah kadaluarsa.",
        PROMO_QUOTA: "Kuota penggunaan kode promo sudah habis.",
        PROMO_MIN_AMOUNT: "Nominal pesanan tidak memenuhi syarat minimum promo.",
        PROMO_USED: "Anda sudah pernah menggunakan kode promo ini.",
      };
      return NextResponse.json(
        { error: promoMessages[promoKey] ?? "Kode promo tidak dapat digunakan." },
        { status: 422 }
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
