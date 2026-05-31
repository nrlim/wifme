import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const location = searchParams.get("location");

    if (!startDate) {
      // Return all available muthawif if no date filter
      const muthawifs = await prisma.muthawifProfile.findMany({
        where: { isAvailable: true, verificationStatus: "VERIFIED" },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { rating: "desc" },
        take: 50, // cap results
      });
      return NextResponse.json({ muthawifs });
    }

    // Validate and sanitize inputs
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    // Build location filter using the new operatingAreas array field
    let locationFilter = {};
    if (location && location !== "ALL") {
      if (location === "MAKKAH") {
        locationFilter = { operatingAreas: { has: "Makkah" } };
      } else if (location === "MADINAH") {
        locationFilter = { operatingAreas: { has: "Madinah" } };
      } else if (location === "BOTH") {
        // Find muthawif that covers both Makkah and Madinah
        locationFilter = { operatingAreas: { hasEvery: ["Makkah", "Madinah"] } };
      }
    }

    // Query muthawif that DON'T have overlapping bookings
    const muthawifs = await prisma.muthawifProfile.findMany({
      where: {
        isAvailable: true,
        verificationStatus: "VERIFIED",
        ...locationFilter,
        user: {
          bookingsAsMuthawif: {
            none: {
              status: { in: ["PENDING", "PAYMENT_REVIEW", "CONFIRMED"] },
              AND: [
                { startDate: { lt: end } },
                { endDate: { gt: start } },
              ],
            },
          },
        },
      },
      include: {
        // Never expose email in public search results
        user: { select: { id: true, name: true } },
      },
      orderBy: { rating: "desc" },
      take: 50, // Always cap results
    });

    return NextResponse.json({ muthawifs, startDate, endDate: end.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
