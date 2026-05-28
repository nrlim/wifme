import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

    const body = await request.json();
    const { name, description, price, location, duration, isActive } = body;

    if (!name || typeof price !== "number") {
      return NextResponse.json({ error: "Nama dan harga wajib diisi dengan benar." }, { status: 400 });
    }

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
        price,
        location: location ? String(location).trim() : null,
        duration: duration ? String(duration).trim() : null,
        sortOrder: finalSortOrder,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server saat menyimpan data." }, { status: 500 });
  }
}
