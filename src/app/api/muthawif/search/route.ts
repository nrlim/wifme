import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");

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

    const muthawifs = await prisma.muthawifProfile.findMany({
      where: {
        isAvailable: true,
        verificationStatus: "VERIFIED",
        ...locationFilter,
      },
      include: {
        // Never expose email in public search results
        user: { select: { id: true, name: true } },
      },
      orderBy: { rating: "desc" },
      take: 50, // Always cap results
    });

    return NextResponse.json({ muthawifs });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
