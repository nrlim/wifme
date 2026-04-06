import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/trip-packages  — list packages visible to the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get("status"); // "upcoming" | "active" | "past"

    if (session.role === "MUTHAWIF") {
      // Muthawif sees their own packages
      // @ts-ignore
      const packages = await prisma.tripPackage.findMany({
        where: { muthawifId: session.id, isPublished: true },
        include: {
          muthawif: { select: { id: true, name: true, email: true, photoUrl: true } },
          itineraries: {
            include: { logs: { orderBy: { checkInTime: "asc" } } },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { startDate: "desc" },
      });
      return NextResponse.json({ packages: applyStatusFilter(packages, statusFilter) });
    }

    if (session.role === "JAMAAH") {
      // Jamaah sees packages from their confirmed Muthawifs where dates overlap
      const bookings = await prisma.booking.findMany({
        where: {
          jamaahId: session.id,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        select: {
          muthawifId: true,
          startDate: true,
          endDate: true,
          muthawif: { select: { id: true, name: true, email: true, photoUrl: true } },
          status: true,
          totalFee: true,
          paymentStatus: true,
        },
      });

      if (bookings.length === 0) return NextResponse.json({ packages: [] });

      // Fetch all published packages from Muthawifs the Jamaah has booked
      const muthawifIds = [...new Set(bookings.map((b) => b.muthawifId))];

      // @ts-ignore
      const allPackages = await prisma.tripPackage.findMany({
        where: {
          muthawifId: { in: muthawifIds },
          isPublished: true,
        },
        include: {
          muthawif: { select: { id: true, name: true, email: true, photoUrl: true } },
          itineraries: {
            include: { logs: { orderBy: { checkInTime: "asc" } } },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { startDate: "desc" },
      });

      // Filter: only packages whose date range overlaps with at least one Jamaah booking
      const visiblePackages = allPackages.filter((pkg: { muthawifId: string; startDate: Date; endDate: Date }) =>
        bookings.some(
          (b) =>
            b.muthawifId === pkg.muthawifId &&
            new Date(b.startDate) <= new Date(pkg.endDate) &&
            new Date(b.endDate) >= new Date(pkg.startDate)
        )
      );

      return NextResponse.json({ packages: applyStatusFilter(visiblePackages, statusFilter) });
    }

    if (session.role === "AMIR") {
      // @ts-ignore
      const packages = await prisma.tripPackage.findMany({
        include: {
          muthawif: { select: { id: true, name: true, email: true, photoUrl: true } },
          itineraries: {
            include: { logs: { orderBy: { checkInTime: "asc" } } },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { startDate: "desc" },
      });
      return NextResponse.json({ packages: applyStatusFilter(packages, statusFilter) });
    }

    return NextResponse.json({ packages: [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

// POST /api/trip-packages  — Muthawif creates a new package
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "MUTHAWIF")
      return NextResponse.json({ error: "Hanya Muthawif yang dapat membuat paket perjalanan." }, { status: 403 });

    const body = await request.json();
    const { title, description, startDate, endDate } = body;

    if (!title || !startDate || !endDate)
      return NextResponse.json({ error: "title, startDate, endDate wajib diisi." }, { status: 400 });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start)
      return NextResponse.json({ error: "Tanggal selesai harus setelah tanggal mulai." }, { status: 400 });

    // @ts-ignore
    const pkg = await prisma.tripPackage.create({
      data: {
        muthawifId: session.id,
        title: String(title).trim().slice(0, 200),
        description: description ? String(description).trim().slice(0, 1000) : null,
        startDate: start,
        endDate: end,
        isPublished: true,
      },
      include: {
        muthawif: { select: { id: true, name: true, email: true, photoUrl: true } },
        itineraries: { include: { logs: true } },
      },
    });

    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}

// ── Helpers ────────────────────────────────────────────────────
function applyStatusFilter<T extends { startDate: Date | string; endDate: Date | string }>(
  packages: T[],
  filter: string | null
): T[] {
  if (!filter || filter === "all") return packages;
  const now = new Date();
  return packages.filter((pkg) => {
    const start = new Date(pkg.startDate);
    const end = new Date(pkg.endDate);
    if (filter === "active")   return start <= now && end >= now;
    if (filter === "upcoming") return start > now;
    if (filter === "past")     return end < now;
    return true;
  });
}
