"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  basePrice: z.coerce
    .number()
    .min(100000, "Harga minimum Rp 100.000")
    .max(50000000, "Harga terlalu tinggi"),
  operatingAreas: z.string().min(1, "Minimal satu wilayah operasi"),
  experience: z.coerce.number().min(0).max(50),
  languages: z.string().min(1, "Minimal satu bahasa"),
  specializations: z.string().optional(),
});

type ActionState = {
  success: boolean;
  message: string;
};

// ─── Auth Guard ───────────────────────────────────────────────────────────────

async function requireMuthawif() {
  const session = await getSession();
  if (!session || session.role !== "MUTHAWIF") {
    throw new Error("Unauthorized: MUTHAWIF role required");
  }
  return session;
}

// ─── Profile Actions ──────────────────────────────────────────────────────────

export async function updateMuthawifProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireMuthawif();

  const raw = {
    bio: formData.get("bio") as string,
    basePrice: formData.get("basePrice") as string,
    operatingAreas: formData.get("operatingAreas") as string,
    experience: formData.get("experience") as string,
    languages: formData.get("languages") as string,
    specializations: formData.get("specializations") as string,
  };

  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = Object.values(
      parsed.error.flatten().fieldErrors
    )[0]?.[0];
    return { success: false, message: firstError || "Data tidak valid" };
  }

  const { bio, basePrice, operatingAreas, experience, languages, specializations } =
    parsed.data;

  const languageArr = languages
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  const specializationArr = specializations
    ? specializations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const operatingAreasArr = operatingAreas
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  let shouldRedirect = false;

  try {
    await (prisma.muthawifProfile.upsert as any)({
      where: { userId: session.id },
      update: {
        bio: bio || null,
        basePrice,
        operatingAreas: operatingAreasArr,
        experience,
        languages: languageArr,
        specializations: specializationArr,
      },
      create: {
        userId: session.id,
        bio: bio || null,
        basePrice,
        operatingAreas: operatingAreasArr,
        experience,
        languages: languageArr,
        specializations: specializationArr,
      },
    });

    const actionType = formData.get("submitActionRaw");

    if (actionType === "NEXT") {
      if (!bio || bio.trim() === "") {
        return { success: false, message: "Biografi wajib diisi untuk lanjut ke tahap berikutnya!"};
      }
      shouldRedirect = true;
    }
  } catch (err) {
    return { success: false, message: "Gagal menyimpan profil. Coba lagi." };
  }

  if (shouldRedirect) {
    redirect("/dashboard/muthawif?step=2");
  }

  revalidatePath("/dashboard/muthawif");
  const isDraft = formData.get("submitActionRaw") === "DRAFT";
  return { 
    success: true, 
    message: isDraft ? "Draft Profil berhasil disimpan!" : "Informasi Profil berhasil diperbarui!" 
  };
}

export async function submitForReview(): Promise<ActionState> {
  const session = await requireMuthawif();

  try {
    const profile = await prisma.muthawifProfile.findUnique({
      where: { userId: session.id },
      select: { documentsUrl: true },
    });

    if (!profile) {
      return { success: false, message: "Profil tidak ditemukan." };
    }

    const hasKtp = profile.documentsUrl.some(d => d.startsWith("ktp::"));
    const hasSelfie = profile.documentsUrl.some(d => d.startsWith("selfie::"));
    const hasSertif = profile.documentsUrl.some(d => d.startsWith("sertifikasi::"));

    if (!hasKtp || !hasSelfie || !hasSertif) {
      return { success: false, message: "Dokumen belum lengkap. Harap penuhi ke-3 slot dokumen!" };
    }

    await prisma.muthawifProfile.update({
      where: { userId: session.id },
      data: { verificationStatus: "REVIEW" },
    });

    revalidatePath("/dashboard/muthawif");
    return { success: true, message: "Berhasil diajukan ke AMIR untuk direview." };
  } catch (err) {
    return { success: false, message: "Gagal mengajukan review." };
  }
}

// ─── Availability Actions ─────────────────────────────────────────────────────

export async function setDaySchedule(
  date: string,
  status: "AVAILABLE" | "OFF",
  timeSlots: string[]
): Promise<ActionState> {
  const session = await requireMuthawif();

  const profile = await prisma.muthawifProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!profile) {
    return { success: false, message: "Profil tidak ditemukan" };
  }

  try {
    const now = new Date();
    // Midnight UTC today for accurate backdate check
    const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dateObj = new Date(date);
    const utcDate = new Date(
      Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
    );

    if (utcDate < todayUtc) {
      return { success: false, message: "Tidak dapat mengatur jadwal untuk tanggal yang sudah berlalu" };
    }

    if (status === "AVAILABLE" && timeSlots.length === 0) {
      // Remove record → resets to default (unlisted = available, no time restriction)
      await prisma.availability.deleteMany({
        where: { profileId: profile.id, date: utcDate },
      });
    } else {
      await prisma.availability.upsert({
        where: { profileId_date: { profileId: profile.id, date: utcDate } },
        update: { status, timeSlots },
        create: { profileId: profile.id, date: utcDate, status, timeSlots },
      });
    }

    revalidatePath("/dashboard/muthawif");
    return { success: true, message: status === "OFF" ? "Hari ditandai Off ✓" : `Jadwal disimpan · ${timeSlots.length} slot jam ✓` };
  } catch (err) {
    return { success: false, message: "Gagal memperbarui jadwal" };
  }
}

/** @deprecated Use setDaySchedule instead */
export async function toggleAvailability(
  date: string,
  currentStatus: string
): Promise<ActionState> {
  const statusCycle: Record<string, "AVAILABLE" | "BOOKED" | "OFF"> = {
    AVAILABLE: "OFF",
    OFF: "AVAILABLE",
    BOOKED: "AVAILABLE",
  };
  const next = statusCycle[currentStatus] || "OFF";
  return setDaySchedule(date, next === "BOOKED" ? "AVAILABLE" : next, []);
}

// ─── Bulk Template Action ─────────────────────────────────────────────────────

export type SchedulePattern = "ALL_DAYS" | "WEEKDAYS" | "WEEKENDS" | "CUSTOM_DAYS";

export async function applyScheduleTemplate(
  pattern: SchedulePattern,
  customDays: number[],   // 0=Sun, 1=Mon … 6=Sat (only used for CUSTOM_DAYS)
  timeSlots: string[],
  monthsAhead: number     // 1 = current month only, 3, 6
): Promise<ActionState> {
  const session = await requireMuthawif();

  const profile = await prisma.muthawifProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!profile) return { success: false, message: "Profil tidak ditemukan" };

  // Which days-of-week to include
  let targetDays: number[];
  if (pattern === "ALL_DAYS")   targetDays = [0, 1, 2, 3, 4, 5, 6];
  else if (pattern === "WEEKDAYS") targetDays = [1, 2, 3, 4, 5];
  else if (pattern === "WEEKENDS") targetDays = [0, 6];
  else targetDays = customDays;

  if (targetDays.length === 0) {
    return { success: false, message: "Pilih setidaknya satu hari." };
  }

  // Build the list of UTC dates from today through (monthsAhead) months ahead
  const now = new Date();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  // For the backdate protection, make sure we only generate future or present dates
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  const utcDates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (targetDays.includes(cursor.getDay())) {
      utcDates.push(
        new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))
      );
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (utcDates.length === 0) {
    return { success: false, message: "Tidak ada tanggal yang cocok." };
  }

  try {
    // Batch upsert in a transaction — Prisma supports up to ~32k ops, slice if needed
    await prisma.$transaction(
      utcDates.map((date) =>
        prisma.availability.upsert({
          where: { profileId_date: { profileId: profile.id, date } },
          update: { status: "AVAILABLE", timeSlots },
          create: { profileId: profile.id, date, status: "AVAILABLE", timeSlots },
        })
      )
    );

    revalidatePath("/dashboard/muthawif");
    return {
      success: true,
      message: `Template diterapkan ke ${utcDates.length} hari ✓`,
    };
  } catch (err) {
    return { success: false, message: "Gagal menerapkan template jadwal." };
  }
}

// ─── Document Upload URL Action ───────────────────────────────────────────────

export async function addDocumentUrl(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireMuthawif();

  const rawUrl = formData.get("documentUrl") as string;
  if (!rawUrl) return { success: false, message: "URL dokumen tidak valid" };
  
  // Validate: must be a valid https URL and belong to our Supabase storage
  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  if (!rawUrl.startsWith('https://') || (supabaseHost && !rawUrl.includes(supabaseHost))) {
    return { success: false, message: "URL dokumen tidak valid" };
  }
  const url = rawUrl.trim().slice(0, 2048);

  try {
    const profile = await prisma.muthawifProfile.findUnique({
      where: { userId: session.id },
      select: { id: true, documentsUrl: true },
    });

    if (!profile) {
      return { success: false, message: "Profil tidak ditemukan" };
    }

    await prisma.muthawifProfile.update({
      where: { userId: session.id },
      data: {
        documentsUrl: [...profile.documentsUrl, url],
      },
    });

    revalidatePath("/dashboard/muthawif");
    return { success: true, message: "Dokumen berhasil ditambahkan" };
  } catch (err) {
    return { success: false, message: "Gagal menambahkan dokumen" };
  }
}

export async function removeDocumentUrl(url: string): Promise<ActionState> {
  const session = await requireMuthawif();

  try {
    const profile = await prisma.muthawifProfile.findUnique({
      where: { userId: session.id },
      select: { documentsUrl: true },
    });
    if (!profile) return { success: false, message: "Profil tidak ditemukan" };

    // Hapus dari Supabase Storage jika ada URL valid
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "wifme-bucket";
    const publicUrlStr = url.split("::")[1] || url;
    const searchStr = `object/public/${bucket}/`;
    const idx = publicUrlStr.indexOf(searchStr);
    
    if (idx !== -1) {
      const filePath = publicUrlStr.substring(idx + searchStr.length);
      if (filePath) {
        const { supabaseAdmin } = await import("@/lib/supabase");
        await supabaseAdmin.storage.from(bucket).remove([filePath]);
      }
    }

    await prisma.muthawifProfile.update({
      where: { userId: session.id },
      data: {
        documentsUrl: profile.documentsUrl.filter((d) => d !== url),
      },
    });

    revalidatePath("/dashboard/muthawif");
    return { success: true, message: "Dokumen dihapus" };
  } catch (err) {
    return { success: false, message: "Gagal menghapus dokumen" };
  }
}
