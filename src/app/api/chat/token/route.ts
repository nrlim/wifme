import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/chat/token
 *
 * Generates a Firebase Custom Auth Token for the authenticated user.
 * Security: verifies the user has an active booking before issuing a token.
 *
 * Body: { bookingId: string }
 * Returns: { token: string, uid: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the user is logged in (custom JWT session)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body as { bookingId?: string };

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    // 2. Verify the user is a participant in this specific booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ jamaahId: session.id }, { muthawifId: session.id }],
      },
      select: { id: true, jamaahId: true, muthawifId: true, status: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or access denied" },
        { status: 403 }
      );
    }

    // 3. AMIR (admin) also allowed to read/write for support purposes
    if (
      session.role !== "AMIR" &&
      booking.jamaahId !== session.id &&
      booking.muthawifId !== session.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Generate Firebase Custom Token
    // uid format: wifme_{userId} — namespaced to avoid Firebase uid collisions
    const firebaseUid = `wifme_${session.id}`;
    const adminAuth = getAdminAuth();
    const token = await adminAuth.createCustomToken(firebaseUid, {
      // Custom claims — accessible in Firebase Security Rules via auth.token
      wifmeUserId: session.id,
      wifmeRole: session.role,
      bookingId,
    });

    // 5. Background: sync token request — the sync job runs separately,
    //    this endpoint only issues auth credentials
    return NextResponse.json({
      token,
      uid: firebaseUid,
      bookingId,
    });
  } catch (error) {
    console.error("[chat/token] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
