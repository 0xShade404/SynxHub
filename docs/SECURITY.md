# Security

This document is an honest account of what's implemented, how, and what is
explicitly out of scope. It intentionally avoids claiming certifications,
insurance, or regulatory status this codebase cannot provide.

## Transport & application security

- **HTTPS/HSTS**: `Strict-Transport-Security` is set in production
  (`next.config.ts`). Actual TLS termination is the responsibility of the
  hosting platform (Vercel and most PaaS providers terminate TLS
  automatically).
- **CSP**: issued per-request with a nonce by `middleware.ts`, allowing a
  strict `script-src 'self' 'nonce-...' 'strict-dynamic'` in production with
  no `unsafe-inline`/`unsafe-eval` for scripts. `style-src` allows
  `unsafe-inline` because React renders some inline `style` attributes
  (chart colors, allocation bar widths) — this is a common, low-risk
  tradeoff since it doesn't enable script execution.
- **Other headers** (`next.config.ts`): `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, and
  `frame-ancestors 'none'` in the CSP (clickjacking defense in depth).
- **CSRF**: NextAuth's own endpoints have built-in CSRF token handling. Our
  own state-changing API routes (deposits, withdrawals, MFA, admin actions)
  verify the request's `Origin` header matches `NEXT_PUBLIC_APP_URL`
  (`lib/security/origin.ts`) before doing anything — this blocks cross-site
  form/script submissions without extra client-side plumbing, since a
  cross-origin request cannot spoof `Origin` in a normal browser.
- **SQL injection**: all database access goes through Prisma's typed query
  builder; nowhere does the codebase interpolate user input into a raw SQL
  string. The two `$queryRaw`/`$executeRaw` uses (`lib/ledger/core.ts` row
  lock, `checkDatabase()` health check) use Prisma's tagged-template
  parameterization, not string concatenation.
- **XSS**: React escapes all rendered text by default; the codebase contains
  no `dangerouslySetInnerHTML`. Combined with the script-src CSP above, this
  is defense in depth against both reflected/stored XSS and inline-script
  injection.
- **Input validation**: every API route validates its body with Zod
  (`lib/validation/schemas.ts`) before touching the database.

## Account security

- **Google OAuth** via Auth.js, with the client secret read only server-side
  (`AUTH_GOOGLE_SECRET`, never sent to the browser).
- **Sessions**: JWT strategy, httpOnly + secure cookies (Auth.js default),
  12-hour max age, refreshed at most hourly.
- **MFA**: TOTP (RFC 6238) via `otpauth`, with 8 single-use recovery codes
  generated at enrollment. The secret and recovery codes are AES-256-GCM
  encrypted at rest (`lib/security/crypto.ts`) using a key from
  `APP_ENCRYPTION_KEY`, which must never be committed and should live in a
  real secret manager in production.
- **MFA is required before any withdrawal can be requested** — enforced
  server-side in `app/api/withdrawals/route.ts`, not just hidden in the UI.
- **Rate limiting**: in-process fixed-window limiter
  (`lib/security/rateLimit.ts`) applied to login-adjacent and withdrawal
  endpoints. This is per-instance — a multi-instance production deployment
  should back it with a shared store (Upstash Redis env vars are already
  wired in `.env.example`, unused until configured).
- **Suspicious login / device detection**: `Device` and `LoginEvent` models
  capture device fingerprint, IP, and success/failure per login; new or
  untrusted devices raise the risk score on a subsequent withdrawal request.
- **Login event logging**: every sign-in (Google or dev-credentials) is
  recorded with the actual provider used, success flag, and timestamp.

## RBAC & least privilege

- Four roles: `INVESTOR`, `SUPPORT`, `COMPLIANCE`, `ADMIN`. `ADMIN_ROLES =
  [ADMIN, SUPPORT, COMPLIANCE]` gates the entire `/admin` console; specific
  endpoints further restrict to `[ADMIN, COMPLIANCE]` (compliance actions)
  where appropriate.
- Authorization is checked at two independent layers — see
  [ARCHITECTURE.md](ARCHITECTURE.md#auth--authorization) — so a bug in one
  layer doesn't expose data through the other.

## Financial integrity

See [ARCHITECTURE.md](ARCHITECTURE.md#the-ledger) for the full design.
Summary of the guarantees and how they're verified:

| Guarantee | Mechanism | Verified by |
|---|---|---|
| No duplicate deposits/withdrawals | Idempotency key, unique DB constraint | `tests/ledger.test.ts` |
| No negative balances | Pre-write balance check inside the locked transaction | `tests/ledger.test.ts` |
| No lost updates under concurrency | `SELECT ... FOR UPDATE` row lock | `tests/ledger.test.ts` (10 concurrent postings) |
| No double-spend during a pending withdrawal | Reserve/settle/release lifecycle | `tests/ledger.test.ts` |
| Immutable audit trail | Append-only `LedgerEntry`, no update/delete code paths | Code review — Prisma client has no `ledgerEntry.update`/`delete` calls anywhere in the codebase |

## Custody & key management

- **No private keys or seed phrases are ever stored in the SynxHub
  database.** Deposit address issuance and withdrawal signing are both
  delegated to a provider interface (`lib/deposits/provider.ts`,
  `lib/withdrawals/provider.ts`); the mock implementations shipped in this
  build never touch a real key or a real chain.
- No credential for a custody or KYC provider appears in client-side
  JavaScript — those calls only happen in server-side route handlers and
  library code.

## Compliance

- KYC submission, sanctions screening, and restricted-jurisdiction
  enforcement are wired through `lib/compliance/provider.ts`. The mock
  provider makes clearly-fake decisions (see the code comments) and every
  record it produces is tagged so it can't be mistaken for a real check.
- Admin compliance actions (KYC status changes) are written to `AuditLog`.

## Monitoring & audit

- `AuditLog` records every admin action (asset config changes, investor
  status changes, withdrawal review decisions, KYC decisions) with actor,
  role, target, metadata, and IP.
- `SecurityEvent` records account-level security signals (new device, new
  withdrawal address, MFA enabled/disabled, rate-limited request,
  withdrawal hold).
- The admin **System** page reports live database connectivity and
  explicitly flags when the custody/KYC provider in use is the mock
  (`"Not connected to a real custodian."` / `"Not a real compliance
  integration."`) — this can't silently read as a real integration.
- No application-level error monitoring (e.g. Sentry) is wired up by
  default; `SENTRY_DSN` is present in `.env.example` as an integration
  point.

## What this document does not claim

- No claim of PCI-DSS, SOC 2, ISO 27001, or any other certification.
- No claim of insurance coverage for custodied assets.
- No claim of regulatory licensing or registration in any jurisdiction.
- No claim of resistance to every possible attack — this is a strong
  baseline, not a substitute for an independent security audit and
  penetration test, which should happen before real funds are accepted.
- No claim that the mock custody/KYC/pricing providers are anything other
  than development conveniences.

## Reporting a vulnerability

See the **Security** page in the app (`/security`) for the current
disclosure process and contact address.
