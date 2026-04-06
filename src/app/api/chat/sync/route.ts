import { NextRequest, NextResponse } from "next/server";
import { getAdminDB } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/chat/sync
 *
 * Background sync job: copies messages from Firebase RTDB → PostgreSQL (ChatMessage table).
 * Can be called by:
 *   - Vercel Cron Job: every 1 hour (add to vercel.json)
 *   - Webhook trigger: after message send (call from ChatService if desired)
 *
 * Authorization: CRON_SECRET header OR authenticated AMIR session
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: cron secret OR admin session
    const cronSecret = request.headers.get("x-cron-secret");
    const isCron = cronSecret === process.env.CRON_SECRET;

    if (!isCron) {
      const session = await getSession();
      if (!session || session.role !== "AMIR") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const { bookingId } = body as { bookingId?: string };

    // If bookingId provided, sync single room; else sync all active bookings
    const bookings = bookingId
      ? await prisma.booking.findMany({
          where: { id: bookingId },
          select: { id: true },
        })
      : await prisma.booking.findMany({
          where: {
            status: { in: ["CONFIRMED", "PENDING"] },
          },
          select: { id: true },
        });

    const db = getAdminDB();
    let totalSynced = 0;

    for (const booking of bookings) {
      const snapshot = await db
        .ref(`chats/${booking.id}/messages`)
        .once("value");

      if (!snapshot.exists()) continue;

      const messages: Array<{
        id: string;
        senderId: string;
        content: string;
        timestamp: number;
        status: string;
      }> = [];

      snapshot.forEach((child) => {
        const val = child.val();
        messages.push({
          id: child.key!,
          senderId: val.senderId,
          content: val.content,
          timestamp: val.timestamp,
          status: val.status ?? "sent",
        });
      });

      if (messages.length === 0) continue;

      // Upsert: skip already-archived messages
      const existing = await prisma.chatMessage.findMany({
        where: {
          bookingId: booking.id,
          firebaseMessageId: { in: messages.map((m) => m.id) },
        },
        select: { firebaseMessageId: true },
      });

      const existingIds = new Set<string | null>(existing.map((e) => e.firebaseMessageId));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));

      if (newMessages.length === 0) continue;

      // Assign sequence numbers based on timestamp ordering
      const sorted = [...newMessages].sort((a, b) => a.timestamp - b.timestamp);
      const lastMsg = await prisma.chatMessage.findFirst({
        where: { bookingId: booking.id },
        orderBy: { sequenceNumber: "desc" },
        select: { sequenceNumber: true },
      });
      let seq = (lastMsg?.sequenceNumber ?? 0) + 1;

      await prisma.chatMessage.createMany({
        data: sorted.map((m) => ({
          bookingId: booking.id,
          senderId: m.senderId,
          content: m.content,
          firebaseMessageId: m.id,
          sentAt: new Date(m.timestamp),
          sequenceNumber: seq++,
          status: m.status as "sent" | "delivered",
        })),
        skipDuplicates: true,
      });

      totalSynced += sorted.length;
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      rooms: bookings.length,
    });
  } catch (error) {
    console.error("[chat/sync] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
