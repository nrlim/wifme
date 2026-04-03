"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
