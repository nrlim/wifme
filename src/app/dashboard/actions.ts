"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { formatWhatsAppNumber } from "@/lib/phone";

export async function approveMuthawif(profileId: string) {
  const session = await getSession();
  if (!session || session.role !== "AMIR") {
    throw new Error("Unauthorized");
  }

  await prisma.muthawifProfile.update({
    where: { id: profileId },
    data: { verificationStatus: "VERIFIED", isAvailable: true },
  });

  revalidatePath("/dashboard");
}

export async function rejectMuthawif(profileId: string) {
  const session = await getSession();
  if (!session || session.role !== "AMIR") {
    throw new Error("Unauthorized");
  }

  await prisma.muthawifProfile.update({
    where: { id: profileId },
    data: { verificationStatus: "REJECTED" },
  });

  revalidatePath("/dashboard");
}

export async function suspendMuthawif(profileId: string) {
  const session = await getSession();
  if (!session || session.role !== "AMIR") {
    throw new Error("Unauthorized");
  }

  await prisma.muthawifProfile.update({
    where: { id: profileId },
    data: { verificationStatus: "REJECTED", isAvailable: false },
  });

  revalidatePath("/dashboard");
}

export async function activateMuthawif(profileId: string) {
  const session = await getSession();
  if (!session || session.role !== "AMIR") {
    throw new Error("Unauthorized");
  }

  await prisma.muthawifProfile.update({
    where: { id: profileId },
    data: { verificationStatus: "VERIFIED", isAvailable: true },
  });

  revalidatePath("/dashboard");
}

export async function updateMuthawifPhone(userId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "AMIR") {
    throw new Error("Unauthorized");
  }

  const rawNumber = formData.get("whatsappNumber")?.toString();
  const formattedNumber = rawNumber ? formatWhatsAppNumber(rawNumber) : null;

  await prisma.user.update({
    where: { id: userId },
    data: { whatsappNumber: formattedNumber },
  });

  revalidatePath("/dashboard");
}
