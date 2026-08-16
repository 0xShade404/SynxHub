import { NextRequest, NextResponse } from "next/server";

/**
 * Issues a per-request CSP nonce and applies it via response headers. Next.js
 * automatically tags its own framework-injected inline scripts (hydration,
 * streaming boundaries) with this nonce when it's present in the response's
 * CSP header, which lets us run a strict `script-src` with no
 * 'unsafe-inline' / 'unsafe-eval'. This file intentionally does nothing
 * beyond header rewriting — no database or auth-session access — so it stays
 * safe to run on the Edge runtime. All real authorization checks happen
 * server-side in layouts and API routes (see lib/auth/guards.ts), not here.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isProd = process.env.NODE_ENV === "production";

  const csp = [
    "default-src 'self'",
    isProd ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'` : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    isProd ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization files.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
