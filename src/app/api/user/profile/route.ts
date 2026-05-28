import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatWhatsAppNumber } from "@/lib/phone";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get("name")?.toString();
    const photoUrl = formData.get("photoUrl")?.toString();
    const rawWhatsapp = formData.get("whatsappNumber")?.toString();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updateData: any = {
      name,
    };

    if (photoUrl !== undefined) {
      updateData.photoUrl = photoUrl;
    }

    if (rawWhatsapp !== undefined) {
      const formatted = formatWhatsAppNumber(rawWhatsapp);
      if (formatted.length < 9) {
        return NextResponse.json({ error: "Invalid WhatsApp number" }, { status: 400 });
      }
      updateData.whatsappNumber = formatted;
    }

    await prisma.user.update({
      where: { id: session.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
