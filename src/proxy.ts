import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Next.js 16 Proxy (ilgari Middleware)
 * Barcha /admin, /org va /audit yo'nalishlarida server-side so'rov render qilinishidan oldin
 * sessiya mavjudligi va haqiqiyligini tekshiradi hamda ruxsatsiz so'rovlarni darhol 307 Redirect qiladi.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/org") ||
    pathname.startsWith("/audit")
  ) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        const loginUrl = new URL("/login", request.url);
        const response = NextResponse.redirect(loginUrl, 307);
        response.headers.set(
          "Cache-Control",
          "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
        );
        return response;
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl, 307);
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/org",
    "/org/:path*",
    "/audit",
    "/audit/:path*",
  ],
};
