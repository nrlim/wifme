import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AgendaClient from "./AgendaClient";

export const metadata = {
  title: "Agenda Perjalanan – Wif-Me",
  description: "Pantau jadwal dan laporan perjalanan umrah Anda secara real-time.",
};

export default async function AgendaPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?redirect=/agenda");

  /* ── Fetch TripPackages based on role ─────────────────── */
  let rawPackages: {
    id: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    isPublished: boolean;
    muthawifId: string;
    muthawif: { id: string; name: string; email: string; photoUrl: string | null };
    itineraries: {
      id: string;
      title: string;
      description: string | null;
      startTime: Date;
      endTime: Date;
      locationName: string | null;
      status: "PLANNED" | "ONGOING" | "COMPLETED";
      logs: { id: string; photoUrl: string | null; notes: string | null; checkInTime: Date }[];
    }[];
  }[] = [];

  if (session.role === "MUTHAWIF") {
    // @ts-ignore
    rawPackages = await prisma.tripPackage.findMany({
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
  } else if (session.role === "JAMAAH") {
    // Get Jamaah's confirmed bookings to determine which muthawifs they have
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
      },
    });

    if (bookings.length > 0) {
      const muthawifIds = [...new Set(bookings.map((b) => b.muthawifId))];

      // @ts-ignore
      const allPackages = await prisma.tripPackage.findMany({
        where: { muthawifId: { in: muthawifIds }, isPublished: true },
        include: {
          muthawif: { select: { id: true, name: true, email: true, photoUrl: true } },
          itineraries: {
            include: { logs: { orderBy: { checkInTime: "asc" } } },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { startDate: "desc" },
      });

      // Filter: only packages whose date range overlaps with at least one booking
      rawPackages = allPackages.filter(
        (pkg: { muthawifId: string; startDate: Date; endDate: Date }) =>
          bookings.some(
            (b) =>
              b.muthawifId === pkg.muthawifId &&
              b.startDate <= pkg.endDate &&
              b.endDate >= pkg.startDate
          )
      );
    }
  } else if (session.role === "AMIR") {
    // @ts-ignore
    rawPackages = await prisma.tripPackage.findMany({
      include: {
        muthawif: { select: { id: true, name: true, email: true, photoUrl: true } },
        itineraries: {
          include: { logs: { orderBy: { checkInTime: "asc" } } },
          orderBy: { startTime: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }

  /* ── Serialise ─────────────────────────────────────────── */
  const packages = rawPackages.map((pkg) => ({
    id: pkg.id,
    title: pkg.title,
    description: pkg.description,
    startDate: pkg.startDate.toISOString(),
    endDate: pkg.endDate.toISOString(),
    isPublished: pkg.isPublished,
    muthawifId: pkg.muthawifId,
    muthawif: pkg.muthawif,
    itineraries: pkg.itineraries.map((it) => ({
      id: it.id,
      title: it.title,
      description: it.description,
      startTime: it.startTime.toISOString(),
      endTime: it.endTime.toISOString(),
      locationName: it.locationName,
      status: it.status as "PLANNED" | "ONGOING" | "COMPLETED",
      logs: it.logs.map((l) => ({
        id: l.id,
        photoUrl: l.photoUrl,
        notes: l.notes,
        checkInTime: l.checkInTime.toISOString(),
      })),
    })),
  }));

  return (
    <AgendaClient
      packages={packages}
      role={session.role}
      userName={session.name}
    />
  );
}
