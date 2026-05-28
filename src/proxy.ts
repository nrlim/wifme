import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";

export async function proxy(request: NextRequest) {
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

  // Protect /itinerary/* — any authenticated user
  if (pathname.startsWith("/itinerary/")) {
    const token = request.cookies.get("wifme_token")?.value;
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${pathname}`, request.url)
      );
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${pathname}`, request.url)
      );
    }
  }

  // Protect /chat/* — any authenticated user
  if (pathname.startsWith("/chat/")) {
    const token = request.cookies.get("wifme_token")?.value;
    if (!token) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${pathname}`, request.url)
      );
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${pathname}`, request.url)
      );
    }
  }

  // Protect other pages
  const otherProtectedPages = ['/booking', '/agenda', '/muthawif/wallet'];
  if (otherProtectedPages.some(p => pathname.startsWith(p))) {
    const token = request.cookies.get("wifme_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL(`/auth/login?redirect=${pathname}`, request.url));
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.redirect(new URL(`/auth/login?redirect=${pathname}`, request.url));
    }
  }

  // Protect API routes
  const protectedApiPaths = [
    '/api/bookings',
    '/api/chat',
    '/api/muthawif',
    '/api/reviews'
  ];
  if (protectedApiPaths.some(p => pathname.startsWith(p))) {
    const token = request.cookies.get("wifme_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/muthawif/:path*",
    "/itinerary/:path*",
    "/chat/:path*",
    "/booking/:path*",
    "/agenda/:path*",
    "/muthawif/wallet/:path*",
    "/api/bookings/:path*",
    "/api/chat/:path*",
    "/api/muthawif/:path*",
    "/api/reviews/:path*",
  ],
};
