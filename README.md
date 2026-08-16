# SynxHub

**Automated Crypto Investing. Built for Precision.**

SynxHub is a production-structured crypto investment platform: an automated
strategy across an admin-configurable universe of Layer-1 networks, with a
server-side financial ledger, investor and admin dashboards, deposit/withdrawal
architecture, security controls, and compliance integration points.

> **This build ships with mock custody, pricing, and KYC/AML providers,
> clearly labeled as DEMO DATA.** It is a real, working application — not a
> static mockup — but it must not be used to accept real investor funds until
> the items in [What's not production-ready yet](#whats-not-production-ready-yet)
> are addressed. See [docs/SECURITY.md](docs/SECURITY.md) and
> [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before any real launch.

---

## Tech stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL** + **Prisma ORM**
- **Auth.js (NextAuth v5)** — Google OAuth, JWT sessions, httpOnly cookies
- **Zod** for input validation
- **Vitest** for unit/integration tests, **Playwright** for e2e tests
- **Recharts** for the portfolio performance chart

## Architecture summary

- **Ledger-first accounting.** All investor balances are computed from an
  append-only `LedgerEntry` table plus a row-locked `UserAssetBalance` cache
  (`lib/ledger/core.ts`). The frontend never computes a balance — every
  number displayed comes from a server read of the ledger.
- **Provider abstraction for external integrations.** Custody/deposit
  addresses (`lib/deposits/provider.ts`), withdrawal signing
  (`lib/withdrawals/provider.ts`), KYC/AML (`lib/compliance/provider.ts`),
  and pricing (`lib/pricing/provider.ts`) are each behind an interface with a
  clearly-labeled mock implementation. Swapping in a real vendor means
  implementing the interface — no other code changes.
- **Auth/authorization is checked server-side, twice.** Every authenticated
  layout (`app/dashboard/layout.tsx`, `app/admin/layout.tsx`) checks the
  session and role, and every API route independently calls
  `requireUser()` / `requireAdmin()` (`lib/auth/guards.ts`). This build
  intentionally does not rely on Next.js Middleware for authorization —
  checks happen at the data-access layer instead, which can't be bypassed by
  route or cache quirks. `middleware.ts` only issues a per-request CSP nonce.
- **Route structure.** The suggested spec structure put investor pages
  (`portfolio`, `deposits`, …) and `security` at the site root; this build
  nests them under `/dashboard/*` instead (`/dashboard/portfolio`,
  `/dashboard/security`, …) so they don't collide with the public marketing
  `/security` page required by the legal-pages section of the spec.

Full write-up: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local install, Docker, or a hosted instance)

### Install

```bash
npm install
cp .env.example .env
# edit .env — at minimum set DATABASE_URL, AUTH_SECRET, APP_ENCRYPTION_KEY
```

Generate secrets:

```bash
openssl rand -base64 32   # use for AUTH_SECRET
openssl rand -base64 32   # use for APP_ENCRYPTION_KEY
```

### Database

```bash
npm run db:migrate   # creates the schema (prompts for a migration name on first run)
npm run db:seed      # seeds demo assets + demo admin/investor accounts
```

Seed output prints demo credentials. Defaults:

| Role     | Email                    | Password          |
|----------|--------------------------|--------------------|
| Investor | `investor@synxhub.demo`  | `InvestorDemo123!` |
| Admin    | `admin@synxhub.demo`     | `AdminDemo123!`    |

These only work when `ENABLE_DEV_CREDENTIALS_LOGIN=true` and
`NODE_ENV !== "production"` (see [Authentication](#authentication) below) —
they are a development convenience, never a production login path.

### Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

### Tests

```bash
npm run test        # vitest unit + integration tests (uses DATABASE_URL)
npm run test:e2e     # Playwright e2e tests (starts `next dev` automatically)
npm run lint
npm run typecheck
npm run build        # production build
```

## Authentication

Google OAuth is the supported production sign-in method. To configure it:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an OAuth 2.0 Client ID (type: Web application).
2. Authorized redirect URI: `{NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
   (e.g. `http://localhost:3000/api/auth/callback/google` in dev).
3. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env`. Never expose the
   client secret to the browser — it's only read server-side in
   `lib/auth/index.ts`.

A second, **development-only** credentials provider (email + password
against a bcrypt hash) is registered only when `ENABLE_DEV_CREDENTIALS_LOGIN`
is `"true"` **and** `NODE_ENV !== "production"` — the production check is
hardcoded and ignores the env flag, so it cannot be accidentally enabled in a
production build. Use it to test locally without Google credentials, and in
CI/e2e.

## Environment variables

See [.env.example](.env.example) for the full list with descriptions. Never
commit `.env`, real credentials, or production secrets.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full production
deployment guide (Vercel or equivalent), including database migrations,
environment variables, monitoring, backups, and rollback.

## Security

Security architecture, what's implemented, and what's explicitly out of
scope for this build: [docs/SECURITY.md](docs/SECURITY.md).

## API reference

Route-by-route API documentation: [docs/API.md](docs/API.md).

## What's not production-ready yet

This is a complete, working application, not a prototype — but three
categories of integration are intentionally mocked and **must** be replaced
before real investor funds are accepted:

1. **Custody / wallet provider** (`lib/deposits/provider.ts`,
   `lib/withdrawals/provider.ts`) — currently a deterministic mock that
   never touches a real blockchain. Integrate a reviewed custody or
   wallet-as-a-service vendor (e.g. Fireblocks, BitGo, Copper, Anchorage).
2. **KYC/AML provider** (`lib/compliance/provider.ts`) — currently a mock
   that approves/rejects based on a hardcoded country list. Integrate a real
   identity-verification and sanctions-screening vendor (e.g. Sumsub,
   Persona, ComplyAdvantage) and have the integration and onboarding flow
   reviewed by compliance counsel.
3. **Market pricing feed** (`lib/pricing/provider.ts`) — currently serves
   admin-set fixture prices labeled `DEMO_FIXTURE`. Integrate a licensed
   market data provider before displaying live prices or computing
   real-money valuations.

Also required before launch, and explicitly **not** covered by this
codebase: legal entity formation and licensing review, finalized legal
documents (all `/legal/*` pages are structural drafts — see the in-page
counsel-review notices), a real production secret-management setup, and an
independent security audit/penetration test. None of these are things code
alone can satisfy — see [docs/SECURITY.md](docs/SECURITY.md) for the full
list of what this build does and does not claim.

## License

Proprietary — all rights reserved unless a license is added by the project
owner.
