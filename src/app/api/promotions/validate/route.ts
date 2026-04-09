import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { validatePromoCode } from "@/actions/promotions";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ valid: false, message: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { code, bookingAmount, jamaahId } = await req.json();

    if (!code || !bookingAmount) {
      return NextResponse.json(
        { valid: false, message: "Kode promo dan nominal pesanan wajib diisi." },
        { status: 400 }
      );
    }

    // Validate that the session user matches the jamaahId for security
    const effectiveJamaahId = session.role === "JAMAAH" ? session.id : (jamaahId ?? session.id);

    const result = await validatePromoCode(code, bookingAmount, effectiveJamaahId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
    return NextResponse.json({ valid: false, message }, { status: 500 });
  }
}
