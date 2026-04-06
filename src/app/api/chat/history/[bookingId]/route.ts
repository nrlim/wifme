import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/chat/history/[bookingId]
 *
 * Returns the last 50 archived messages from PostgreSQL + session status.
 * Used when Firebase session is closed.
 * Authorization: must be JAMAAH or MUTHAWIF of this booking.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await params;

    // Verify participant
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ jamaahId: session.id }, { muthawifId: session.id }],
      },
      select: {
        id: true,
        status: true,
        chatClosedAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or access denied" }, { status: 403 });
    }

    // Load last 50 messages from DB (ordered by sequence)
    const messages = await prisma.chatMessage.findMany({
      where: { bookingId },
      orderBy: { sequenceNumber: "desc" },
      take: 50,
      select: {
        id: true,
        senderId: true,
        content: true,
        sentAt: true,
        sequenceNumber: true,
        firebaseMessageId: true,
        status: true,
      },
    });

    // Reverse so oldest-first (chronological order for display)
    const ordered = messages.reverse();

    return NextResponse.json({
      messages: ordered.map((m) => ({
        id: m.firebaseMessageId ?? m.id,
        senderId: m.senderId,
        content: m.content,
        timestamp: m.sentAt.getTime(),
        sequenceNumber: m.sequenceNumber,
        status: m.status,
      })),
      session: {
        isClosed: !!booking.chatClosedAt,
        bookingStatus: booking.status,
      },
    });
  } catch {
    // Error details logged server-side via platform monitoring
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
