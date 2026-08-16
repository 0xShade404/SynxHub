/**
 * Lightweight CSRF defense for our own state-changing API routes (NextAuth's
 * own endpoints have their own built-in CSRF token handling). Since these
 * routes are only ever called via same-origin `fetch()` from the SynxHub
 * app, verifying the request's Origin header matches our configured app
 * URL blocks cross-site form/script submissions while requiring no
 * additional client-side plumbing.
 */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin || !appUrl) return false;
  try {
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}
