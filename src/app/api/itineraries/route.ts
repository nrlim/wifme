import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/itineraries?packageId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const packageId = request.nextUrl.searchParams.get("packageId");
    if (!packageId) return NextResponse.json({ error: "packageId diperlukan." }, { status: 400 });

    // Verify access to the package
    // @ts-ignore
    const pkg = await prisma.tripPackage.findUnique({
      where: { id: packageId },
      select: { muthawifId: true },
    });
    if (!pkg) return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 404 });

    let hasAccess = false;
    if (session.role === "AMIR") {
      hasAccess = true;
    } else if (session.role === "MUTHAWIF") {
      hasAccess = pkg.muthawifId === session.id;
    } else if (session.role === "JAMAAH") {
      // Check if Jamaah has a booking with this Muthawif that overlaps the package dates
      // @ts-ignore
      const pkgFull = await prisma.tripPackage.findUnique({
        where: { id: packageId },
        select: { startDate: true, endDate: true, muthawifId: true },
      });
      if (pkgFull) {
        const booking = await prisma.booking.findFirst({
          where: {
            jamaahId: session.id,
            muthawifId: pkgFull.muthawifId,
            status: { in: ["CONFIRMED", "COMPLETED"] },
            startDate: { lte: pkgFull.endDate },
            endDate: { gte: pkgFull.startDate },
          },
        });
        hasAccess = !!booking;
      }
    }

    if (!hasAccess) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

    // @ts-ignore
    const itineraries = await prisma.itinerary.findMany({
      where: { packageId },
      include: { logs: { orderBy: { checkInTime: "asc" } } },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ itineraries });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

// POST /api/itineraries  — Muthawif creates a new itinerary item inside a package
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "MUTHAWIF")
      return NextResponse.json({ error: "Hanya Muthawif yang dapat membuat agenda." }, { status: 403 });

    const body = await request.json();
    const { packageId, title, description, startTime, endTime, locationName } = body;

    if (!packageId || !title || !startTime || !endTime)
      return NextResponse.json({ error: "Field wajib: packageId, title, startTime, endTime." }, { status: 400 });

    // @ts-ignore
    const pkg = await prisma.tripPackage.findUnique({
      where: { id: packageId },
      select: { muthawifId: true },
    });
    if (!pkg) return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 404 });
    if (pkg.muthawifId !== session.id)
      return NextResponse.json({ error: "Bukan paket Anda." }, { status: 403 });

    // @ts-ignore
    const itinerary = await prisma.itinerary.create({
      data: {
        packageId,
        title: String(title).trim().slice(0, 200),
        description: description ? String(description).trim().slice(0, 1000) : null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        locationName: locationName ? String(locationName).trim().slice(0, 200) : null,
        status: "PLANNED",
      },
      include: { logs: true },
    });

    return NextResponse.json({ itinerary }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
