import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getFeeConfig } from "@/lib/fee";
import BookingWizard from "./BookingWizard";

export async function generateMetadata({ params }: { params: Promise<{ muthawifId: string }> }) {
  const { muthawifId } = await params;
  const muthawif = await prisma.user.findUnique({
    where: { id: muthawifId, role: "MUTHAWIF" },
  });
  if (!muthawif) return { title: "Tidak Ditemukan | Wifme" };
  return { title: `Pesan ${muthawif.name} | Wifme` };
}

export default async function BookingPage({ params, searchParams }: { params: Promise<{ muthawifId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { muthawifId } = await params;
  const sParams = await searchParams;
  const session = await getSession();

  if (!session) {
    redirect(`/auth/login?redirect=/book/${muthawifId}`);
  }
  if (session.role !== "JAMAAH") {
    redirect("/dashboard");
  }

  const muthawif = await prisma.user.findUnique({
    where: { id: muthawifId, role: "MUTHAWIF" },
    include: { profile: true },
  });

  if (!muthawif || !muthawif.profile || muthawif.profile.verificationStatus !== "VERIFIED") {
    notFound();
  }

  // Fetch activities configured by AMIR. Since Opsi B was chosen, activities are global.
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
        status: { in: ["PENDING", "PAYMENT_REVIEW", "CONFIRMED"] }
      },
      date: { gte: today }
    },
    select: {
      date: true
    }
  });

  return (
    <div style={{ background: "var(--ivory)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <BookingWizard
        muthawifId={muthawifId}
        muthawifName={muthawif.name}
        activities={activities}
        bundles={bundles}
        feeConfig={feeConfig}
        availabilities={availabilities}
        bookedItems={bookedItems}
        initialLocation={typeof sParams?.location === "string" ? sParams.location : undefined}
      />
    </div>
  );
}
