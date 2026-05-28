import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await request.json();
    const { name, description, price, location, duration, sortOrder, isActive } = body;

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(price !== undefined && { price: Number(price) }),
        ...(location !== undefined && { location: location ? String(location).trim() : null }),
        ...(duration !== undefined && { duration: duration ? String(duration).trim() : null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ activity });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Kegiatan tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server saat memperbarui data." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const activity = await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({ activity });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Kegiatan tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server saat menghapus data." }, { status: 500 });
  }
}
