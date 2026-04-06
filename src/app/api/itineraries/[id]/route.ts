import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// PATCH /api/itineraries/[id]  — update status/fields (Muthawif only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "MUTHAWIF")
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { status, title, description, startTime, endTime, locationName } = body;

    // @ts-ignore
    const existing = await prisma.itinerary.findUnique({
      where: { id },
      // @ts-ignore
      include: { package: { select: { muthawifId: true } } },
    });

    if (!existing) return NextResponse.json({ error: "Agenda tidak ditemukan." }, { status: 404 });
    // @ts-ignore
    if (existing.package.muthawifId !== session.id)
      return NextResponse.json({ error: "Bukan agenda Anda." }, { status: 403 });

    const allowedStatuses = ["PLANNED", "ONGOING", "COMPLETED"];
    const updateData: Record<string, unknown> = {};
    if (status && allowedStatuses.includes(status)) updateData.status = status;
    if (title)       updateData.title       = String(title).trim().slice(0, 200);
    if (description !== undefined) updateData.description = description ? String(description).trim().slice(0, 1000) : null;
    if (startTime)   updateData.startTime   = new Date(startTime);
    if (endTime)     updateData.endTime     = new Date(endTime);
    if (locationName !== undefined) updateData.locationName = locationName ? String(locationName).trim().slice(0, 200) : null;

    // @ts-ignore
    const updated = await prisma.itinerary.update({
      where: { id },
      data: updateData,
      include: { logs: { orderBy: { checkInTime: "asc" } } },
    });

    return NextResponse.json({ itinerary: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

// DELETE /api/itineraries/[id]  — delete an itinerary (Muthawif only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "MUTHAWIF")
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

    const { id } = await params;

    // @ts-ignore
    const existing = await prisma.itinerary.findUnique({
      where: { id },
      // @ts-ignore
      include: { package: { select: { muthawifId: true } } },
    });

    if (!existing) return NextResponse.json({ error: "Agenda tidak ditemukan." }, { status: 404 });
    // @ts-ignore
    if (existing.package.muthawifId !== session.id)
      return NextResponse.json({ error: "Bukan agenda Anda." }, { status: 403 });

    // @ts-ignore
    await prisma.itinerary.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
