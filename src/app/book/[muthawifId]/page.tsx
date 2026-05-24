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

export default async function BookingPage({ params }: { params: Promise<{ muthawifId: string }> }) {
  const { muthawifId } = await params;
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

  return (
    <div style={{ background: "var(--ivory)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <BookingWizard
        muthawifId={muthawifId}
        muthawifName={muthawif.name}
        activities={activities}
        bundles={bundles}
        feeConfig={feeConfig}
      />
    </div>
  );
}
