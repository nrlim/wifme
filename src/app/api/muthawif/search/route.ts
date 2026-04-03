import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const duration = searchParams.get("duration");
    const location = searchParams.get("location");

    if (!startDate || !duration) {
      // Return all available muthawif if no date filter
      const muthawifs = await prisma.muthawifProfile.findMany({
        where: { isAvailable: true, verificationStatus: "VERIFIED" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { rating: "desc" },
      });
      return NextResponse.json({ muthawifs });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(duration));

    // Build location filter
    const locationFilter =
      location && location !== "ALL"
        ? {
            OR: [
              { location: location as "MAKKAH" | "MADINAH" | "BOTH" },
              { location: "BOTH" as const },
            ],
          }
        : {};

    // Query muthawif that DON'T have overlapping bookings
    const muthawifs = await prisma.muthawifProfile.findMany({
      where: {
        isAvailable: true,
        verificationStatus: "VERIFIED",
        ...locationFilter,
        user: {
          bookingsAsMuthawif: {
            none: {
              status: { in: ["PENDING", "CONFIRMED"] },
              AND: [
                { startDate: { lt: end } },
                { endDate: { gt: start } },
              ],
            },
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { rating: "desc" },
    });

    return NextResponse.json({ muthawifs, startDate, endDate: end.toISOString(), duration });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
