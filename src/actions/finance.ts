'use server';

import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';

export async function getWallet(userId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  // Only the owner of the wallet or the AMIR admin can access it
  if (session.id !== userId && session.role !== 'AMIR') {
    throw new Error('Unauthorized access to wallet');
  }

  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        availableBalance: 0,
        escrowBalance: 0,
      },
      include: {
        transactions: true,
      },
    });
  }

  return wallet;
}

export async function simulatePayment(bookingId: string) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  // Verify and Process
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { jamaahId: true }
  });
  
  if (!booking) throw new Error('Booking not found');
  if (session.id !== booking.jamaahId && session.role !== 'AMIR') {
    throw new Error('Unauthorized to process this payment');
  }

  return await internalProcessPayment(bookingId);
}

/**
 * INTERNAL USE ONLY: Processes payment logic without session check.
 * Used by webhooks or authorized administrative operations.
 */
export async function internalProcessPayment(bookingId: string) {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        muthawif: {
          select: {
            profile: { select: { basePrice: true } }
          }
        }
      }
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.paymentStatus === 'PAID') throw new Error('Already paid');

    // Calculate the duration in days
    const durationDays = Math.max(1, Math.round(
      (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ));

    const muthawifBaseFee =
      (booking as any).baseFee > 0
        ? (booking as any).baseFee
        : (booking.muthawif?.profile?.basePrice ?? 0) * durationDays;

    // Update Booking
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentRef: `MID-${Date.now()}`,
      },
    });

    // Find or Create Wallet for Muthawif
    let wallet = await tx.wallet.findUnique({
      where: { userId: booking.muthawifId },
    });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: { userId: booking.muthawifId },
      });
    }

    // Add ONLY baseFee (muthawif's portion) to Escrow
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        escrowBalance: { increment: muthawifBaseFee },
      },
    });

    // Log Transaction
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        bookingId: booking.id,
        type: 'PAYMENT_ESCROW',
        amount: muthawifBaseFee,
        status: 'SUCCESS',
        description: 'Pembayaran Masuk ke Escrow (Muthawif Share)',
      },
    });

    revalidatePath('/muthawif/wallet');
    return updatedWallet;
  });
}

export async function settleEscrow(bookingId: string) {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') {
    throw new Error('Unauthorized: only AMIR can settle escrow manually');
  }

  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new Error('Booking not found');
    if (booking.status === 'COMPLETED') throw new Error('Already completed and settled');

    // Cari transaksi escrow-nya
    const escrowTx = await tx.transaction.findFirst({
      where: {
        bookingId: booking.id,
        type: 'PAYMENT_ESCROW',
        status: 'SUCCESS'
      }
    });

    if (!escrowTx) throw new Error('No escrow payment found for this booking');

    // Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    });

    // Move balance from escrow to available
    await tx.wallet.update({
      where: { id: escrowTx.walletId },
      data: {
        escrowBalance: { decrement: escrowTx.amount },
        availableBalance: { increment: escrowTx.amount },
      },
    });

    // Log Settlement Transaction
    await tx.transaction.create({
      data: {
        walletId: escrowTx.walletId,
        bookingId: booking.id,
        type: 'ESCROW_SETTLEMENT',
        amount: escrowTx.amount,
        status: 'SUCCESS',
        description: 'Pencairan Dana Amanah ke Saldo Tersedia',
      },
    });

    revalidatePath('/muthawif/wallet');
    return { success: true };
  });
}

export async function requestWithdrawal(
  userId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountHolderName: string
) {
  // Basic type guards
  if (!userId || typeof userId !== 'string') throw new Error('Invalid userId');
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error('Jumlah penarikan tidak valid');
  }
  
  const session = await getSession();
  if (!session || session.id !== userId) {
    throw new Error('Unauthorized: anda tidak bisa menarik saldo dari dompet orang lain.');
  }

  // Validate and sanitize string inputs
  const trimmedBank = String(bankName).trim().slice(0, 100);
  const trimmedHolder = String(accountHolderName).trim().slice(0, 100);
  const trimmedAccount = String(accountNumber).trim();
  if (!/^[0-9]{6,20}$/.test(trimmedAccount)) {
    throw new Error('Nomor rekening tidak valid. Harus berisi 6-20 digit angka.');
  }
  if (!trimmedBank || !trimmedHolder) {
    throw new Error('Nama bank dan pemilik rekening tidak boleh kosong.');
  }

  return await prisma.$transaction(async (tx) => {
    // Fetch minimum withdrawal setting
    const settings = await tx.globalSetting.findUnique({ where: { id: 'singleton' } });
    const minimumWithdrawal = settings?.minimumWithdrawal ?? 50000;
    if (amount < minimumWithdrawal) {
      throw new Error(`Jumlah minimum penarikan adalah Rp ${minimumWithdrawal.toLocaleString('id-ID')}`);
    }

    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.availableBalance < amount) throw new Error('Insufficient available balance');

    // Deduct available
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { availableBalance: { decrement: amount } },
    });

    // Encrypt account number
    const encAccount = encrypt(trimmedAccount);

    // Create Payout Request
    await tx.payout.create({
      data: {
        walletId: wallet.id,
        amount,
        bankName: trimmedBank,
        encryptedAccountNumber: encAccount,
        accountHolderName: trimmedHolder,
        status: 'PENDING',
      },
    });

    // Log Transaction
    await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount,
        status: 'PENDING',
        description: `Penarikan ke ${trimmedBank} a/n ${trimmedHolder}`,
      },
    });

    revalidatePath('/muthawif/wallet');
    return { success: true };
  });
}

/**
 * ADMIN ACTIONS (AMIR)
 */
const PAYOUT_PAGE_SIZE = 10;

export async function getPayouts(opts: { search?: string; status?: string; page?: number } = {}) {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') throw new Error('Unauthorized');

  const { search = "", status = "ALL", page = 1 } = opts;
  const skip = (page - 1) * PAYOUT_PAGE_SIZE;

  const where: any = {};
  if (status !== "ALL") {
    where.status = status;
  }
  if (search.trim()) {
    where.OR = [
      { wallet: { user: { name: { contains: search, mode: 'insensitive' } } } },
      { bankName: { contains: search, mode: 'insensitive' } },
      { accountHolderName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.payout.count({ where }),
    prisma.payout.findMany({
      where,
      include: {
        wallet: {
          include: { user: { select: { name: true, email: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAYOUT_PAGE_SIZE,
    }),
  ]);

  return {
    items: items.map(p => ({
      ...p,
      accountNumber: decrypt(p.encryptedAccountNumber)
    })),
    total,
    page,
    totalPages: Math.ceil(total / PAYOUT_PAGE_SIZE)
  };
}

export async function approvePayout(payoutId: string) {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') throw new Error('Unauthorized');

  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== 'PENDING') throw new Error('Invalid payout');

    await tx.payout.update({ where: { id: payoutId }, data: { status: 'SUCCESS' } });

    await tx.transaction.updateMany({
      where: { walletId: payout.walletId, type: 'WITHDRAWAL', amount: payout.amount, status: 'PENDING' },
      data: { status: 'SUCCESS' }
    });

    revalidatePath('/dashboard');
    return { success: true };
  });
}

/**
 * GLOBAL SETTINGS (FEE & SYSTEM)
 */
export type FeeComponent = {
  id: string;
  label: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  description?: string;
};

export async function getGlobalSettings() {
  const settings = await prisma.globalSetting.findUnique({
    where: { id: 'singleton' },
  });

  if (!settings) {
    return await prisma.globalSetting.create({
      data: { id: 'singleton', feeType: 'PERCENT', feeValue: 5.0, feeComponents: [], minimumWithdrawal: 50000 }
    });
  }

  return settings;
}

export async function updateGlobalSettings(data: {
  feeType?: 'PERCENT' | 'FLAT';
  feeValue?: number;
  feeComponents?: FeeComponent[];
  minimumWithdrawal?: number;
  supportedLocations?: string[];
  supportedServices?: string[];
  supportedLanguages?: string[];
}) {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') throw new Error('Unauthorized');

  const updated = await prisma.globalSetting.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', feeType: 'PERCENT', feeValue: 5.0, feeComponents: [], minimumWithdrawal: 50000, ...data }
  });

  revalidatePath('/dashboard');
  return updated;
}

export async function rejectPayout(payoutId: string, reason: string = 'Ditolak oleh Admin') {
  const session = await getSession();
  if (!session || session.role !== 'AMIR') throw new Error('Unauthorized');

  return await prisma.$transaction(async (tx) => {
    const payout = await tx.payout.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== 'PENDING') throw new Error('Invalid payout');

    await tx.wallet.update({
      where: { id: payout.walletId },
      data: { availableBalance: { increment: payout.amount } }
    });

    await tx.payout.update({ where: { id: payoutId }, data: { status: 'FAILED' } });

    await tx.transaction.updateMany({
      where: { walletId: payout.walletId, type: 'WITHDRAWAL', amount: payout.amount, status: 'PENDING' },
      data: { status: 'FAILED', description: `Ditolak: ${reason}` }
    });

    revalidatePath('/dashboard');
    return { success: true };
  });
}
