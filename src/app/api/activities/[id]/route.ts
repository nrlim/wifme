import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const activityUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.coerce.number().finite().min(0).max(1_000_000_000).optional(),
  location: z.enum(["MAKKAH", "MADINAH", "BOTH"]).optional().nullable().or(z.literal("")),
  durationDays: z.coerce.number().int().min(1).max(60).optional(),
  sortOrder: z.coerce.number().int().min(0).max(100_000).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const rawBody: unknown = await request.json();
    const parsed = activityUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data kegiatan tidak valid." }, { status: 400 });
    }
    const { name, description, price, location, durationDays, sortOrder, isActive } = parsed.data;

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(price !== undefined && { price: Math.round(price) }),
        ...(location !== undefined && { location: location ? location : null }),
        ...(durationDays !== undefined && { durationDays }),
        ...(sortOrder !== undefined && { sortOrder }),
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
