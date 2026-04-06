import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// PATCH /api/trip-packages/[id]  — update package (Muthawif only)
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
    const { title, description, startDate, endDate, isPublished } = body;

    // @ts-ignore
    const existing = await prisma.tripPackage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 404 });
    if (existing.muthawifId !== session.id)
      return NextResponse.json({ error: "Bukan paket Anda." }, { status: 403 });

    const updateData: Record<string, unknown> = {};
    if (title)       updateData.title = String(title).trim().slice(0, 200);
    if (description !== undefined) updateData.description = description ? String(description).trim().slice(0, 1000) : null;
    if (startDate)   updateData.startDate = new Date(startDate);
    if (endDate)     updateData.endDate = new Date(endDate);
    if (typeof isPublished === "boolean") updateData.isPublished = isPublished;

    // @ts-ignore
    const updated = await prisma.tripPackage.update({
      where: { id },
      data: updateData,
      include: {
        muthawif: { select: { id: true, name: true, email: true, photoUrl: true } },
        itineraries: { include: { logs: { orderBy: { checkInTime: "asc" } } }, orderBy: { startTime: "asc" } },
      },
    });

    return NextResponse.json({ package: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

// DELETE /api/trip-packages/[id]  — delete package (Muthawif only)
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
    const existing = await prisma.tripPackage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 404 });
    if (existing.muthawifId !== session.id)
      return NextResponse.json({ error: "Bukan paket Anda." }, { status: 403 });

    // @ts-ignore
    await prisma.tripPackage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
