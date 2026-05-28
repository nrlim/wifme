import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { name, description, price, sortOrder, isActive, activityIds } = await req.json();

    const bundle = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.bundleItem.deleteMany({
        where: { bundleId: id }
      });

      // Update bundle and recreate items
      return await tx.activityBundle.update({
        where: { id },
        data: {
          name: name ? String(name).trim() : undefined,
          description: description !== undefined ? (description ? String(description).trim() : null) : undefined,
          price: price !== undefined ? Number(price) : undefined,
          sortOrder,
          isActive,
          items: {
            create: activityIds.map((actId: string) => ({
              activityId: actId
            }))
          }
        },
        include: {
          items: {
            include: {
              activity: true
            }
          }
        }
      });
    });

    return NextResponse.json({ bundle });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Terjadi kesalahan server saat memperbarui data." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const bundle = await prisma.activityBundle.delete({
      where: { id },
      include: { items: { include: { activity: true } } }
    });

    return NextResponse.json({ bundle });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Terjadi kesalahan server saat menghapus data." }, { status: 500 });
  }
}
