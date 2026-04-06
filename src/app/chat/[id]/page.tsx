import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import ChatRoom from "@/components/ChatRoom";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      muthawif: { select: { name: true } },
      jamaah: { select: { name: true } },
    },
  });
  if (!booking) return { title: "Chat — Wif-Me" };
  return {
    title: `Chat • ${booking.muthawif.name} × ${booking.jamaah.name} | Wif-Me`,
    description: "Real-time chat dengan Muthawif Anda",
    robots: { index: false }, // Chat pages must not be indexed
  };
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/auth/login?redirect=/chat/${id}`);
  }

  // Verify this user is a participant in the booking
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      OR: [{ jamaahId: session.id }, { muthawifId: session.id }],
    },
    include: {
      jamaah: { select: { id: true, name: true, photoUrl: true, role: true } },
      muthawif: { select: { id: true, name: true, photoUrl: true, role: true } },
    },
  });

  // AMIR can also access any booking chat for support
  const adminBooking =
    !booking && session.role === "AMIR"
      ? await prisma.booking.findUnique({
          where: { id },
          include: {
            jamaah: {
              select: { id: true, name: true, photoUrl: true, role: true },
            },
            muthawif: {
              select: { id: true, name: true, photoUrl: true, role: true },
            },
          },
        })
      : null;

  const resolved = booking ?? adminBooking;
  if (!resolved) notFound();

  // Determine "current" and "other" participant from session perspective
  const isJamaah = resolved.jamaahId === session.id;
  const currentParticipant = isJamaah
    ? resolved.jamaah
    : session.role === "AMIR"
    ? { id: session.id, name: session.name, photoUrl: null, role: "AMIR" as const }
    : resolved.muthawif;
  const otherParticipant = isJamaah ? resolved.muthawif : resolved.jamaah;

  return (
    <main style={{ width: "100%", minHeight: "100dvh", background: "#f3f4f6", display: "flex", alignItems: "stretch", justifyContent: "center" }}>
      {/* Desktop wrapper adds card styling */}
      <div
        style={{
          width: "100%",
          maxWidth: "896px",
          background: "white",
          boxShadow: "0 0 40px rgba(0,0,0,0.08)",
        }}
      >
        <ChatRoom
          bookingId={id}
          currentUser={{
            id: currentParticipant.id,
            name: currentParticipant.name,
            photoUrl: currentParticipant.photoUrl,
            role: isJamaah ? "JAMAAH" : "MUTHAWIF",
          }}
          otherUser={{
            id: otherParticipant.id,
            name: otherParticipant.name,
            photoUrl: otherParticipant.photoUrl,
            role: isJamaah ? "MUTHAWIF" : "JAMAAH",
          }}
        />
      </div>
    </main>
  );
}
