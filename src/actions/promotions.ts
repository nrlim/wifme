'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PromoValidationResult {
  valid: boolean;
  promotionId?: string;
  code?: string;
  discountAmount?: number;
  finalAmount?: number;
  message: string;
  type?: 'FIXED_AMOUNT' | 'PERCENTAGE';
  value?: number;
}

// ── Validation Logic ───────────────────────────────────────────────────────────

/**
 * Validate a promo code against a specific booking amount.
 * Returns the discount amount if valid, or an error message.
 */
export async function validatePromoCode(
  code: string,
  bookingAmount: number,
  jamaahId: string
): Promise<PromoValidationResult> {
  if (!code?.trim()) {
    return { valid: false, message: 'Kode promo tidak boleh kosong.' };
  }

  const promo = await prisma.promotion.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: {
      bookings: {
        where: { jamaahId },
        select: { id: true },
      },
    },
  });

  if (!promo) {
    return { valid: false, message: 'Kode promo tidak ditemukan.' };
  }

  if (promo.status !== 'ACTIVE') {
    return { valid: false, message: 'Kode promo sudah tidak aktif.' };
  }

  if (promo.expiryDate && promo.expiryDate < new Date()) {
    return { valid: false, message: 'Kode promo sudah kadaluarsa.' };
  }

  if (promo.maxUsage !== null && promo.usedCount >= promo.maxUsage) {
    return { valid: false, message: 'Kuota penggunaan kode promo sudah habis.' };
  }

  if (bookingAmount < promo.minBookingAmount) {
    return {
      valid: false,
      message: `Minimum pemesanan Rp ${promo.minBookingAmount.toLocaleString('id-ID')} untuk menggunakan kode ini.`,
    };
  }

  // One-per-user check
  if (promo.bookings.length > 0) {
    return { valid: false, message: 'Anda sudah pernah menggunakan kode promo ini.' };
  }

  // Calculate discount
  let discountAmount = 0;
  if (promo.type === 'FIXED_AMOUNT') {
    discountAmount = Math.min(promo.value, bookingAmount);
  } else {
    discountAmount = Math.round(bookingAmount * (promo.value / 100));
  }
  const finalAmount = Math.max(0, bookingAmount - discountAmount);

  return {
    valid: true,
    promotionId: promo.id,
    code: promo.code,
    discountAmount,
    finalAmount,
    message: `Promo berhasil! Diskon Rp ${discountAmount.toLocaleString('id-ID')} diterapkan.`,
    type: promo.type as 'FIXED_AMOUNT' | 'PERCENTAGE',
    value: promo.value,
  };
}

/**
 * Apply a promo code atomically during booking creation.
 * Increments usedCount. Call only inside a Prisma $transaction.
 */
export async function applyPromoCodeTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  code: string,
  bookingAmount: number,
  jamaahId: string
): Promise<{ promotionId: string; discountAmount: number; finalAmount: number }> {
  const promo = await tx.promotion.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: {
      bookings: { where: { jamaahId }, select: { id: true } },
    },
  });

  if (!promo || promo.status !== 'ACTIVE') throw new Error('PROMO_INVALID');
  if (promo.expiryDate && promo.expiryDate < new Date()) throw new Error('PROMO_EXPIRED');
  if (promo.maxUsage !== null && promo.usedCount >= promo.maxUsage) throw new Error('PROMO_QUOTA');
  if (bookingAmount < promo.minBookingAmount) throw new Error('PROMO_MIN_AMOUNT');
  if (promo.bookings.length > 0) throw new Error('PROMO_USED');

  let discountAmount = 0;
  if (promo.type === 'FIXED_AMOUNT') {
    discountAmount = Math.min(promo.value, bookingAmount);
  } else {
    discountAmount = Math.round(bookingAmount * (promo.value / 100));
  }

  await tx.promotion.update({
    where: { id: promo.id },
    data: { usedCount: { increment: 1 } },
  });

  return {
    promotionId: promo.id,
    discountAmount,
    finalAmount: Math.max(0, bookingAmount - discountAmount),
  };
}

// ── AMIR Admin Actions ─────────────────────────────────────────────────────────

const PROMO_PAGE_SIZE = 15;

export async function getPromotions(opts: {
  page?: number;
  status?: string;
  search?: string;
} = {}) {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') throw new Error('Unauthorized');

  const { page = 1, status = 'ALL', search = '' } = opts;
  const skip = (page - 1) * PROMO_PAGE_SIZE;

  const where: Record<string, unknown> = {};
  if (status !== 'ALL') where.status = status;
  if (search.trim()) {
    where.OR = [
      { code: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.promotion.count({ where }),
    prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PROMO_PAGE_SIZE,
      include: {
        _count: { select: { bookings: true } },
      },
    }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PROMO_PAGE_SIZE) };
}

export async function createPromotion(data: {
  code: string;
  description?: string;
  type: 'FIXED_AMOUNT' | 'PERCENTAGE';
  value: number;
  minBookingAmount?: number;
  maxUsage?: number | null;
  expiryDate?: string | null;
  discountTarget?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') throw new Error('Unauthorized');

  const code = data.code.trim().toUpperCase();
  if (!code || code.length < 3) throw new Error('Kode promo minimal 3 karakter.');
  if (!/^[A-Z0-9_-]+$/.test(code)) throw new Error('Kode promo hanya boleh huruf, angka, - dan _.');
  if (data.value <= 0) throw new Error('Nilai diskon harus lebih dari 0.');
  if (data.type === 'PERCENTAGE' && data.value > 100) throw new Error('Persentase tidak boleh lebih dari 100%.');

  const exists = await prisma.promotion.findUnique({ where: { code } });
  if (exists) throw new Error(`Kode promo "${code}" sudah terdaftar.`);

  const promo = await prisma.promotion.create({
    data: {
      code,
      description: data.description?.trim() || null,
      type: data.type,
      value: data.value,
      minBookingAmount: data.minBookingAmount ?? 0,
      maxUsage: data.maxUsage ?? null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      discountTarget: data.discountTarget ?? 'PLATFORM',
      status: 'ACTIVE',
    },
  });

  revalidatePath('/dashboard');
  return promo;
}

export async function updatePromotion(
  id: string,
  data: {
    description?: string;
    status?: 'ACTIVE' | 'EXPIRED' | 'DISABLED';
    maxUsage?: number | null;
    expiryDate?: string | null;
    minBookingAmount?: number;
    discountTarget?: string;
  }
) {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') throw new Error('Unauthorized');

  const promo = await prisma.promotion.update({
    where: { id },
    data: {
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.maxUsage !== undefined && { maxUsage: data.maxUsage }),
      ...(data.expiryDate !== undefined && {
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      }),
      ...(data.minBookingAmount !== undefined && { minBookingAmount: data.minBookingAmount }),
      ...(data.discountTarget !== undefined && { discountTarget: data.discountTarget }),
    },
  });

  revalidatePath('/dashboard');
  return promo;
}

export async function deletePromotion(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') throw new Error('Unauthorized');

  // Only allow deletion if the promo has never been used
  const promo = await prisma.promotion.findUnique({ where: { id } });
  if (!promo) throw new Error('Promo tidak ditemukan.');
  if (promo.usedCount > 0) throw new Error('Promo yang sudah digunakan tidak dapat dihapus. Nonaktifkan saja.');

  await prisma.promotion.delete({ where: { id } });
  revalidatePath('/dashboard');
  return { success: true };
}
