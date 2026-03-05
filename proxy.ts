import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_ROUTES = ["/admin"];
const SUPER_ADMIN_ROUTES = ["/super-admin"];
const AUTH_ROUTES = ["/login", "/register"];

const isDev = process.env.NODE_ENV === "development";

// ── Next.js 16 Proxy Convention ──────────────────────────────
// Ref: https://nextjs.org/docs/app/guides/authentication
// Ref: https://authjs.dev/getting-started/session-management/protecting
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;
  const isLoggedIn = !!session?.user;

  // ── CSP Headers ──────────────────────────────────────────────
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} https://app.midtrans.com https://app.sandbox.midtrans.com`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.midtrans.com https://api.sandbox.midtrans.com",
    "frame-src https://app.midtrans.com https://app.sandbox.midtrans.com",
  ].join("; ");

  // Set CSP on request headers (untuk nonce di Server Components)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ── Auth Redirect ────────────────────────────────────────────
  // Jika sudah login, jangan akses halaman auth
  if (isLoggedIn && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ── RBAC Route Protection ────────────────────────────────────

  // /super-admin/* → Hanya SUPER_ADMIN
  if (SUPER_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // /admin/* → Hanya ADMIN atau SUPER_ADMIN
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
