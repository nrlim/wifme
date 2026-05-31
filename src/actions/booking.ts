"use server";

import { prisma } from "@/lib/prisma";
import { getFeeConfig } from "@/lib/fee";
import { getSession } from "@/lib/auth";

export async function getBookingWizardData(muthawifId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activities = await prisma.activity.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    const bundles = await prisma.activityBundle.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          include: {
            activity: true
          }
        }
      }
    });

    const feeConfig = await getFeeConfig();

    const availabilities = await prisma.availability.findMany({
      where: {
        profile: { userId: muthawifId },
        date: { gte: today }
      }
    });

    const bookedItems = await prisma.bookingItem.findMany({
      where: {
        booking: {
          muthawifId: muthawifId,
          status: { in: ["PENDING", "PAYMENT_REVIEW", "CONFIRMED"] },
        },
        date: { gte: today }
      },
      select: {
        date: true
      }
    });

    return { success: true, data: { activities, bundles, feeConfig, availabilities, bookedItems } };
  } catch (error) {
    console.error("Error fetching booking wizard data:", error);
    return { success: false, error: "Gagal mengambil data kegiatan." };
  }
}
