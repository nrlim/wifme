import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Auto-Status Cron Job
 * Called by Vercel Cron every hour via vercel.json schedule.
 *
 * Rules applied on every run:
 *  1. CONFIRMED + endDate ≤ now                           → COMPLETED
 *  2. PENDING/CONFIRMED + UNPAID + paymentDeadline ≤ now  → CANCELLED
 *  3. PENDING + no paymentDeadline + UNPAID + 24h elapsed → CANCELLED
 *
 * Secured by CRON_SECRET env var (set in Vercel dashboard).
 * Vercel automatically sends: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const cronType = process.env.CRON_TYPE || "VPS";
  const now = new Date();
  
  // CRON_SECRET is required — if not set, block all access
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Triggered manually or by cron
  const results = { completed: 0, cancelledUnpaid: 0, cancelledPendingExpired: 0 };
  const hours = parseInt(process.env.AUTO_CANCEL_HOURS || "24");
  const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

  try {
    // ── Rule 1: CONFIRMED + endDate passed → COMPLETED ──────────────────
    const toComplete = await prisma.booking.findMany({
      where: { status: "CONFIRMED", endDate: { lte: now } },
      select: { id: true },
    });
    if (toComplete.length > 0) {
      await prisma.booking.updateMany({
        where: { id: { in: toComplete.map(b => b.id) } },
        data: { status: "COMPLETED" },
      });
      results.completed = toComplete.length;
    }

    // ── Rule 2: UNPAID + explicit paymentDeadline passed → CANCELLED ────
    const toCancelUnpaid = await prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        paymentStatus: "UNPAID",
        paymentDeadline: { not: null, lte: now },
      },
      select: { id: true },
    });
    if (toCancelUnpaid.length > 0) {
      await prisma.booking.updateMany({
        where: { id: { in: toCancelUnpaid.map(b => b.id) } },
        data: { status: "CANCELLED" },
      });
      results.cancelledUnpaid = toCancelUnpaid.length;
    }

    // ── Rule 3: PENDING + no deadline + AUTO_CANCEL_HOURS elapsed + UNPAID → CANCELLED ───
    const toCancelExpired = await prisma.booking.findMany({
      where: {
        status: "PENDING",
        paymentDeadline: null,
        paymentStatus: "UNPAID",
        createdAt: { lte: cutoff },
      },
      select: { id: true },
    });
    if (toCancelExpired.length > 0) {
      await prisma.booking.updateMany({
        where: { id: { in: toCancelExpired.map(b => b.id) } },
        data: { status: "CANCELLED" },
      });
      results.cancelledPendingExpired = toCancelExpired.length;
    }

    // Done
    return NextResponse.json({ ok: true, results, timestamp: now.toISOString(), config: { cutoffHours: hours } });

  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Always re-run, never cache
export const dynamic = "force-dynamic";
