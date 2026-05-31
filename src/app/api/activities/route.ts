import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const activityCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.coerce.number().finite().min(0).max(1_000_000_000),
  location: z.enum(["MAKKAH", "MADINAH", "BOTH"]).optional().nullable().or(z.literal("")),
  durationDays: z.coerce.number().int().min(1).max(60).default(1),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    let includeInactive = searchParams.get("includeInactive") === "true";
    
    if (includeInactive) {
      const session = await getSession();
      if (!session || session.role !== "AMIR") {
        includeInactive = false;
      }
    }

    const activities = await prisma.activity.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody: unknown = await request.json();
    const parsed = activityCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data kegiatan tidak valid." }, { status: 400 });
    }
    const { name, description, price, location, durationDays, isActive } = parsed.data;

    let finalSortOrder = 0;
    const lastActivity = await prisma.activity.findFirst({
      orderBy: { sortOrder: 'desc' }
    });
    if (lastActivity) {
      finalSortOrder = lastActivity.sortOrder + 1;
    }

    const activity = await prisma.activity.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        price: Math.round(price),
        location: location ? location : null,
        durationDays,
        sortOrder: finalSortOrder,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server saat menyimpan data." }, { status: 500 });
  }
}
