import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard/muthawif — MUTHAWIF only
  if (pathname.startsWith("/dashboard/muthawif")) {
    const token = request.cookies.get("wifme_token")?.value;
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${pathname}`, request.url)
      );
    }
    const payload = await verifyJWT(token);
    if (!payload || payload.role !== "MUTHAWIF") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Protect /dashboard — any authenticated user
  if (pathname === "/dashboard") {
    const token = request.cookies.get("wifme_token")?.value;
    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?redirect=/dashboard", request.url)
      );
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.redirect(
        new URL("/auth/login?redirect=/dashboard", request.url)
      );
    }
    // Redirect MUTHAWIF users to their dedicated dashboard
    if (payload.role === "MUTHAWIF") {
      return NextResponse.redirect(
        new URL("/dashboard/muthawif", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/muthawif/:path*"],
};
