import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFeeConfig } from "@/lib/fee";

function getPeriodRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "last_3_months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { start, end };
    }
    default: {
      // All time
      const start = new Date(2020, 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return { start, end };
    }
  }
}

// Build monthly chart data from bookings
function buildMonthlyChartData(
  bookings: { createdAt: Date; totalFee: number; baseFee: number; status: string }[],
  feeRate: number
) {
  const months: Record<string, { month: string; gross: number; net: number; count: number }> = {};

  for (const b of bookings) {
    if (b.status !== "COMPLETED") continue;
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    if (!months[key]) months[key] = { month: label, gross: 0, net: 0, count: 0 };
    const gross = b.baseFee || b.totalFee;
    const platformFee = gross * (feeRate / 100);
    months[key].gross += gross;
    months[key].net += gross - platformFee;
    months[key].count += 1;
  }

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ ...v, gross: Math.round(v.gross), net: Math.round(v.net) }));
}

// ── MUTHAWIF ANALYTICS ──────────────────────────────────────────────────────
async function getMuthawifAnalytics(userId: string, period: string) {
  const { start, end } = getPeriodRange(period);
  const feeConfig = await getFeeConfig();
  const feeRate = feeConfig.feeType === "PERCENT" ? feeConfig.feeValue : 0;

  const [wallet, allBookings, periodBookings, recentTransactions, payouts, profile] =
    await Promise.all([
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.booking.findMany({
        where: { muthawifId: userId },
        select: { totalFee: true, baseFee: true, status: true, createdAt: true },
      }),
      prisma.booking.findMany({
        where: {
          muthawifId: userId,
          createdAt: { gte: start, lte: end },
        },
        select: { totalFee: true, baseFee: true, status: true, createdAt: true },
      }),
      prisma.transaction.findMany({
        where: { wallet: { userId }, createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.payout.findMany({
        where: { wallet: { userId } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.muthawifProfile.findUnique({
        where: { userId },
        select: { rating: true, totalReviews: true },
      }),
    ]);

  const completedInPeriod = periodBookings.filter((b) => b.status === "COMPLETED");
  const grossEarnings = completedInPeriod.reduce(
    (s, b) => s + (b.baseFee || b.totalFee),
    0
  );
  const platformFeeTotal = grossEarnings * (feeRate / 100);
  const netIncome = grossEarnings - platformFeeTotal;

  const pendingBookings = allBookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED"
  );
  const pendingBalance = wallet?.escrowBalance ?? 0;
  const availableBalance = wallet?.availableBalance ?? 0;

  const chartData = buildMonthlyChartData(allBookings, feeRate);

  // Weekly trend (last 8 weeks)
  const weeklyTrend: { week: string; amount: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekBookings = allBookings.filter((b) => {
      const d = new Date(b.createdAt);
      return b.status === "COMPLETED" && d >= weekStart && d <= weekEnd;
    });
    const total = weekBookings.reduce((s, b) => s + (b.baseFee || b.totalFee), 0);
    weeklyTrend.push({
      week: weekEnd.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      amount: Math.round(total),
    });
  }

  return {
    role: "MUTHAWIF",
    period,
    summary: {
      availableBalance,
      pendingBalance,
      grossEarnings: Math.round(grossEarnings),
      netIncome: Math.round(netIncome),
      platformFeeTotal: Math.round(platformFeeTotal),
      feeRate,
      totalCompleted: completedInPeriod.length,
      totalPending: pendingBookings.length,
      rating: profile?.rating ?? 0,
      totalReviews: profile?.totalReviews ?? 0,
    },
    chartData,
    weeklyTrend,
    transactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      status: t.status,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      bankName: p.bankName,
      accountHolderName: p.accountHolderName,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

// ── AMIR ANALYTICS ──────────────────────────────────────────────────────────
async function getAmirAnalytics(period: string) {
  const { start, end } = getPeriodRange(period);
  const feeConfig = await getFeeConfig();
  const feeRate = feeConfig.feeType === "PERCENT" ? feeConfig.feeValue : 0;

  const [allBookings, periodBookings, totalMuthawifs, verifiedMuthawifs, pendingPayouts] =
    await Promise.all([
      prisma.booking.findMany({
        select: { totalFee: true, baseFee: true, status: true, createdAt: true, muthawifId: true },
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: {
          id: true,
          totalFee: true,
          baseFee: true,
          status: true,
          createdAt: true,
          muthawifId: true,
          muthawif: { select: { name: true } },
          jamaah: { select: { name: true } },
        },
      }),
      prisma.muthawifProfile.count(),
      prisma.muthawifProfile.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.payout.findMany({
        where: { status: "PENDING" },
        include: {
          wallet: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
    ]);

  const completedAll = allBookings.filter((b) => b.status === "COMPLETED");
  const gmv = completedAll.reduce((s, b) => s + b.totalFee, 0);
  const completedInPeriod = periodBookings.filter((b) => b.status === "COMPLETED");
  const periodGmv = completedInPeriod.reduce((s, b) => s + b.totalFee, 0);

  // Platform commission = totalFee - baseFee summed for all completed
  const totalCommission = completedAll.reduce((s, b) => {
    const base = b.baseFee || b.totalFee;
    return s + (b.totalFee - base);
  }, 0);
  const periodCommission = completedInPeriod.reduce((s, b) => {
    const base = b.baseFee || b.totalFee;
    return s + (b.totalFee - base);
  }, 0);

  const chartData = buildMonthlyChartData(
    allBookings.map((b) => ({
      ...b,
      // for AMIR, gross = totalFee (full amount)
      baseFee: 0,
      totalFee: b.totalFee,
    })),
    0
  ).map((d) => ({ ...d, gross: d.gross }));

  // Build proper monthly chart for AMIR showing GMV
  const monthlyGmv: Record<string, { month: string; gmv: number; commission: number; count: number }> = {};
  for (const b of allBookings) {
    if (b.status !== "COMPLETED") continue;
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    if (!monthlyGmv[key]) monthlyGmv[key] = { month: label, gmv: 0, commission: 0, count: 0 };
    monthlyGmv[key].gmv += b.totalFee;
    monthlyGmv[key].commission += b.totalFee - (b.baseFee || b.totalFee);
    monthlyGmv[key].count += 1;
  }
  const gmvChartData = Object.entries(monthlyGmv)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      month: v.month,
      gmv: Math.round(v.gmv),
      commission: Math.round(v.commission),
      count: v.count,
    }));

  // Top earners (muthawif with most completed earnings)
  const earnerMap: Record<string, { name: string; total: number; count: number }> = {};
  for (const b of completedAll) {
    if (!earnerMap[b.muthawifId]) earnerMap[b.muthawifId] = { name: "", total: 0, count: 0 };
    earnerMap[b.muthawifId].total += b.baseFee || b.totalFee;
    earnerMap[b.muthawifId].count += 1;
  }
  // Enrich with names from periodBookings (may be partial, but good enough)
  for (const b of periodBookings) {
    if (earnerMap[b.muthawifId]) earnerMap[b.muthawifId].name = b.muthawif.name;
  }
  const topEarners = Object.entries(earnerMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Booking status distribution in period
  const statusDist = {
    PENDING: periodBookings.filter((b) => b.status === "PENDING").length,
    CONFIRMED: periodBookings.filter((b) => b.status === "CONFIRMED").length,
    COMPLETED: periodBookings.filter((b) => b.status === "COMPLETED").length,
    CANCELLED: periodBookings.filter((b) => b.status === "CANCELLED").length,
  };

  return {
    role: "AMIR",
    period,
    summary: {
      gmv: Math.round(gmv),
      periodGmv: Math.round(periodGmv),
      totalCommission: Math.round(totalCommission),
      periodCommission: Math.round(periodCommission),
      feeRate,
      totalBookings: allBookings.length,
      periodBookings: periodBookings.length,
      totalMuthawifs,
      verifiedMuthawifs,
      pendingPayoutsCount: pendingPayouts.length,
      pendingPayoutsAmount: pendingPayouts.reduce((s, p) => s + p.amount, 0),
      statusDistribution: statusDist,
    },
    gmvChartData,
    topEarners,
    pendingPayouts: pendingPayouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      bankName: p.bankName,
      accountHolderName: p.accountHolderName,
      userName: p.wallet.user.name,
      userEmail: p.wallet.user.email,
      createdAt: p.createdAt.toISOString(),
    })),
    recentTransactions: periodBookings.slice(0, 20).map((b) => ({
      id: b.id,
      muthawifName: b.muthawif.name,
      jamaahName: b.jamaah.name,
      amount: b.totalFee,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "this_month";

    if (session.role === "MUTHAWIF") {
      const data = await getMuthawifAnalytics(session.id, period);
      return NextResponse.json(data);
    }

    if (session.role === "AMIR") {
      const data = await getAmirAnalytics(period);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Role tidak memiliki akses analytics" }, { status: 403 });
  } catch (error) {
    console.error("[Analytics API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
