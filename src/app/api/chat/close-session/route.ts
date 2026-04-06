import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminDB } from "@/lib/firebase-admin";

/**
 * POST /api/chat/close-session
 *
 * Closes a chat session. Only MUTHAWIF of the booking can call this.
 * Actions:
 *   1. Archive all Firebase messages → PostgreSQL (upsert, no delete)
 *   2. Mark booking.chatClosedAt = now, chatClosedByMuthawif = true
 *   3. Write metadata to Firebase: /chats/{bookingId}/metadata.status = "closed"
 *
 * Body: { bookingId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = (await request.json()) as { bookingId?: string };
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    // Only the muthawif of this booking can close the session
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, muthawifId: session.id },
      select: { id: true, chatClosedAt: true, status: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or access denied" },
        { status: 403 }
      );
    }

    // Cannot close a completed booking (no active chat session)
    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot close chat session for a completed booking" },
        { status: 422 }
      );
    }

    if (booking.chatClosedAt) {
      return NextResponse.json(
        { error: "Chat session already closed" },
        { status: 409 }
      );
    }

    // ── 1. Archive Firebase messages → PostgreSQL ──────────────────
    const db = getAdminDB();
    const snapshot = await db.ref(`chats/${bookingId}/messages`).once("value");

    let archivedCount = 0;
    if (snapshot.exists()) {
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
          timestamp: val.timestamp ?? Date.now(),
          status: val.status ?? "sent",
        });
      });

      if (messages.length > 0) {
        // Find already-archived to avoid duplicates
        const existing = await prisma.chatMessage.findMany({
          where: {
            bookingId,
            firebaseMessageId: { in: messages.map((m) => m.id) },
          },
          select: { firebaseMessageId: true },
        });
        const existingIds = new Set(existing.map((e) => e.firebaseMessageId));
        const newMessages = messages
          .filter((m) => !existingIds.has(m.id))
          .sort((a, b) => a.timestamp - b.timestamp);

        if (newMessages.length > 0) {
          const lastMsg = await prisma.chatMessage.findFirst({
            where: { bookingId },
            orderBy: { sequenceNumber: "desc" },
            select: { sequenceNumber: true },
          });
          let seq = (lastMsg?.sequenceNumber ?? 0) + 1;

          await prisma.chatMessage.createMany({
            data: newMessages.map((m) => ({
              bookingId,
              senderId: m.senderId,
              content: m.content,
              firebaseMessageId: m.id,
              sentAt: new Date(m.timestamp),
              sequenceNumber: seq++,
              status: (m.status as "sent" | "delivered") ?? "sent",
            })),
            skipDuplicates: true,
          });
          archivedCount = newMessages.length;
        }
      }
    }

    // ── 2. Mark booking as chat-closed in PostgreSQL ───────────────
    const closedAt = new Date();
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        chatClosedAt: closedAt,
        chatClosedByMuthawif: true,
      },
    });

    // ── 3. Write metadata to Firebase (for real-time UI update) ───
    await db.ref(`chats/${bookingId}/metadata`).set({
      status: "closed",
      closedAt: closedAt.getTime(),
      closedBy: session.id,
    });

    return NextResponse.json({
      success: true,
      closedAt: closedAt.toISOString(),
      archivedMessages: archivedCount,
    });
  } catch {
    // Error details logged server-side via platform monitoring
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
