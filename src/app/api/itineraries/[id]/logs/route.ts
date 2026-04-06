import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/itineraries/[id]/logs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // @ts-ignore
    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      include: {
        // @ts-ignore
        package: { select: { muthawifId: true, startDate: true, endDate: true } },
        logs: { orderBy: { checkInTime: "asc" } },
      },
    });

    if (!itinerary) return NextResponse.json({ error: "Agenda tidak ditemukan." }, { status: 404 });

    let hasAccess = false;
    if (session.role === "AMIR") {
      hasAccess = true;
    // @ts-ignore
    } else if (session.role === "MUTHAWIF" && itinerary.package.muthawifId === session.id) {
      hasAccess = true;
    } else if (session.role === "JAMAAH") {
      // @ts-ignore
      const pkg = itinerary.package;
      const booking = await prisma.booking.findFirst({
        where: {
          jamaahId: session.id,
          muthawifId: pkg.muthawifId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startDate: { lte: pkg.endDate },
          endDate: { gte: pkg.startDate },
        },
      });
      hasAccess = !!booking;
    }

    if (!hasAccess) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

    return NextResponse.json({ logs: itinerary.logs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

// POST /api/itineraries/[id]/logs  — check-in (Muthawif only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "MUTHAWIF")
      return NextResponse.json({ error: "Hanya Muthawif yang dapat melakukan check-in." }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { photoUrl, notes } = body;

    // @ts-ignore
    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      // @ts-ignore
      include: { package: { select: { muthawifId: true } } },
    });

    if (!itinerary) return NextResponse.json({ error: "Agenda tidak ditemukan." }, { status: 404 });
    // @ts-ignore
    if (itinerary.package.muthawifId !== session.id)
      return NextResponse.json({ error: "Bukan agenda Anda." }, { status: 403 });

    // @ts-ignore
    const log = await prisma.serviceLog.create({
      data: {
        itineraryId: id,
        photoUrl: photoUrl ? String(photoUrl).trim() : null,
        notes: notes ? String(notes).trim().slice(0, 2000) : null,
        checkInTime: new Date(),
      },
    });

    // Auto-transition to ONGOING on first check-in
    if (itinerary.status === "PLANNED") {
      // @ts-ignore
      await prisma.itinerary.update({ where: { id }, data: { status: "ONGOING" } });
    }

    return NextResponse.json({ log }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
