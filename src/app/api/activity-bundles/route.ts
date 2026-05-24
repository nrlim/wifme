import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const bundles = await prisma.activityBundle.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          include: {
            activity: true
          }
        }
      }
    });
    return NextResponse.json({ data: bundles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "AMIR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, description, price, isActive, activityIds } = await req.json();

    let finalSortOrder = 0;
    const lastBundle = await prisma.activityBundle.findFirst({
      orderBy: { sortOrder: 'desc' }
    });
    if (lastBundle) {
      finalSortOrder = lastBundle.sortOrder + 1;
    }

    const bundle = await prisma.activityBundle.create({
      data: {
        name,
        description,
        price,
        sortOrder: finalSortOrder,
        isActive,
        items: {
          create: activityIds.map((id: string) => ({
            activityId: id
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

    return NextResponse.json({ bundle }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
