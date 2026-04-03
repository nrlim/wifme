"use server";

import { prisma } from "@/lib/prisma";
import { getSession, signJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type ActionState = {
  success: boolean;
  message: string;
};

export async function updateUserProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const photoUrl = formData.get("photoUrl") as string;

  if (!name || name.trim() === "") {
    return { success: false, message: "Nama tidak boleh kosong" };
  }

  try {
    // Update User
    await prisma.user.update({
      where: { id: session.id },
      data: {
        name,
        // @ts-ignore: Prisma client typings are stale until dev restart
        photoUrl: photoUrl || null,
      },
    });

    // If muthawif, we also update muthawif profile photoUrl if they have one so it stays in sync
    if (session.role === "MUTHAWIF") {
      const p = await prisma.muthawifProfile.findUnique({
        where: { userId: session.id }
      });
    }

    // Update session cookie
    const token = await signJWT({
      ...session,
      name,
    });
    
    const cookieStore = await cookies();
    cookieStore.set({
      name: "wifme_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/muthawif");
    
    return { success: true, message: "Profil berhasil diperbarui" };
  } catch (error) {
    return { success: false, message: "Gagal memperbarui profil" };
  }
}
