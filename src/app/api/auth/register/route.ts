import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/auth";
import { formatWhatsAppNumber } from "@/lib/phone";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, whatsappNumber, password, role } = body;

    // Input validation
    if (!name || !email || !whatsappNumber || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }
    const formattedWhatsapp = formatWhatsAppNumber(whatsappNumber);
    if (formattedWhatsapp.length < 9) {
      return NextResponse.json({ error: "Format nomor WhatsApp tidak valid." }, { status: 400 });
    }
    const trimmedName = String(name).trim().slice(0, 100);
    const trimmedEmail = String(email).trim().toLowerCase();
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }
    // Prevent self-registration as AMIR (admin)
    const allowedSelfRegisterRoles = ["MUTHAWIF", "JAMAAH"];
    const sanitizedRole = allowedSelfRegisterRoles.includes(role) ? role : "JAMAAH";

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          whatsappNumber: formattedWhatsapp,
          password: hashed,
          role: sanitizedRole,
        },
      });

      if (newUser.role === "MUTHAWIF") {
        await tx.muthawifProfile.create({
          data: { userId: newUser.id },
        });
      }
      return newUser;
    });

    const user = result;

    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      message: "Registrasi berhasil.",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set("wifme_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
