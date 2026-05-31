import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { applyPromoCodeTx } from "@/actions/promotions";
import { z } from "zod";

const bookingItemSchema = z.object({
  activityId: z.string().min(1),
  date: z.string().min(1),
});

const createBookingSchema = z.object({
  muthawifId: z.string().min(1),
  items: z.array(bookingItemSchema).min(1).max(60),
  notes: z.string().max(1000).optional().nullable(),
  promoCode: z.string().max(64).optional().nullable(),
  bundleId: z.string().min(1).optional().nullable(),
});

function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  return next;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody: unknown = await req.json();
    const parsedBody = createBookingSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Data pesanan tidak lengkap atau tidak valid." }, { status: 400 });
    }
    const { muthawifId, items, notes, promoCode, bundleId } = parsedBody.data;

    // Prevent self-booking
    if (session.id === muthawifId) {
      return NextResponse.json({ error: "Anda tidak dapat memesan Muthawif untuk diri sendiri." }, { status: 400 });
    }

    const sanitizedNotes = notes ? String(notes).trim().slice(0, 1000) : null;
    const sanitizedPromoCode = promoCode ? String(promoCode).trim().toUpperCase() : null;

    const uniqueActivityIds = Array.from(new Set(items.map((item) => item.activityId)));
    if (uniqueActivityIds.length !== items.length) {
      return NextResponse.json({ error: "Kegiatan tidak boleh duplikat dalam satu pesanan." }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const booking = await prisma.$transaction(async (tx) => {
      const muthawif = await tx.user.findFirst({
        where: { id: muthawifId, role: "MUTHAWIF", profile: { verificationStatus: "VERIFIED" } },
        select: { id: true, profile: { select: { id: true } } },
      });
      if (!muthawif?.profile) throw new Error("Muthawif tidak ditemukan");

      const dbActivities = await tx.activity.findMany({
        where: { id: { in: uniqueActivityIds }, isActive: true },
        select: { id: true, price: true, durationDays: true },
      });
      if (dbActivities.length !== uniqueActivityIds.length) throw new Error("Kegiatan tidak ditemukan");

      const activityMap = new Map(dbActivities.map((activity) => [activity.id, activity]));
      const requestedItemMap = new Map(items.map((item) => [item.activityId, item.date]));

      const assignedDateStrs = new Set<string>();

      const parsedItems = uniqueActivityIds.map((activityId) => {
        const activity = activityMap.get(activityId);
        if (!activity) throw new Error("Kegiatan tidak ditemukan");
        
        const customDateStr = requestedItemMap.get(activityId);
        if (!customDateStr) throw new Error("Tanggal kegiatan harus diisi.");

        const assignedDate = parseDateOnly(customDateStr);
        if (!assignedDate) throw new Error("Format tanggal kegiatan tidak valid.");
        
        if (assignedDate < today) throw new Error("Tanggal kegiatan tidak boleh di masa lalu.");

        const dateStr = assignedDate.toISOString().split("T")[0];
        if (assignedDateStrs.has(dateStr)) {
          throw new Error("Tidak boleh ada kegiatan yang dimulai di hari yang sama (1 hari = 1 kegiatan).");
        }
        assignedDateStrs.add(dateStr);

        return {
          activityId,
          price: activity.price,
          durationDays: activity.durationDays,
          assignedDate,
        };
      });

      // 2. Pricing and availability validation
      const settings = await tx.globalSetting.findUnique({ where: { id: "singleton" } });

      let baseFee = 0;
      if (bundleId) {
        const bdl = await tx.activityBundle.findFirst({
          where: { id: bundleId, isActive: true },
          include: { items: { select: { activityId: true } } },
        });
        if (!bdl) throw new Error("Paket Bundling tidak ditemukan");
        const bundleActivityIds = bdl.items.map((item) => item.activityId).sort();
        const requestedActivityIds = [...uniqueActivityIds].sort();
        if (bundleActivityIds.length !== requestedActivityIds.length || bundleActivityIds.some((id, index) => id !== requestedActivityIds[index])) {
          throw new Error("Paket Bundling tidak sesuai dengan kegiatan yang dipilih");
        }
        baseFee = bdl.price;
      } else {
        baseFee = parsedItems.reduce((sum, item) => sum + item.price, 0);
      }

      // Check day-by-day conflicts for scheduled activities
      const requestedDates: Date[] = [];
      for (const item of parsedItems) {
        for (let i = 0; i < item.durationDays; i++) {
          requestedDates.push(addDays(item.assignedDate, i));
        }
      }
      
      const conflictingItem = await tx.bookingItem.findFirst({
        where: {
          booking: {
            muthawifId,
            status: { in: ["PENDING", "PAYMENT_REVIEW", "CONFIRMED"] },
          },
          date: { in: requestedDates },
        },
        select: { id: true },
      });
      if (conflictingItem) throw new Error("CONFLICT");

      const blockedAvailability = await tx.availability.findFirst({
        where: {
          profileId: muthawif.profile.id,
          date: { in: requestedDates },
          status: { in: ["OFF", "BOOKED"] },
        },
        select: { id: true },
      });
      if (blockedAvailability) throw new Error("CONFLICT");
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
            create: parsedItems.map((item) => {
              return {
                activityId: item.activityId,
                date: item.assignedDate,
                timeSlot: null,
                price: item.price,
              };
            })
          }
        },
        include: { items: true }
      });
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    if (errorMessage === "CONFLICT") {
      return NextResponse.json(
        { error: "Muthawif tidak tersedia pada jadwal tersebut." },
        { status: 409 }
      );
    }
    // Promo-specific errors
    if (errorMessage.startsWith("PROMO:")) {
      const promoKey = errorMessage.replace("PROMO:", "");
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
    
    if (errorMessage.includes("tidak ditemukan") || errorMessage.includes("tidak sesuai") || errorMessage.includes("tanggal")) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
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
