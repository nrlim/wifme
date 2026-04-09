import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public endpoint — returns all ACTIVE promotions for display in the
 * voucher picker on the muthawif booking page.
 * No auth required (read-only, non-sensitive).
 */
export async function GET() {
  const now = new Date();

  const promos = await prisma.promotion.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: now } },
      ],
    },
    select: {
      id: true,
      code: true,
      description: true,
      type: true,
      value: true,
      minBookingAmount: true,
      maxUsage: true,
      usedCount: true,
      expiryDate: true,
    },
    orderBy: [{ value: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  // Filter out exhausted promos in JS (simpler than complex Prisma query)
  const available = promos.filter(
    (p) => p.maxUsage === null || p.usedCount < p.maxUsage
  );

  return NextResponse.json({ promos: available });
}
