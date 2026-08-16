# Architecture

## Overview

SynxHub is a single Next.js App Router application (no separate backend
service) with three layers:

```
app/                 Routes: pages (Server Components) + API route handlers
lib/                 Domain logic, framework-agnostic where possible
prisma/              Schema, migrations, seed script
```

The App Router lets pages call the domain layer (`lib/*`) directly during
server rendering (no internal HTTP round-trip), while API routes expose the
same domain layer to client components that need to mutate data or poll.

## Domain layer (`lib/`)

| Module | Responsibility |
|---|---|
| `lib/database/prisma.ts` | Singleton Prisma client |
| `lib/ledger/` | The financial ledger — see below |
| `lib/portfolio/` | Portfolio valuation & performance series, derived from the ledger + current pricing |
| `lib/deposits/` | Deposit address issuance + confirmation tracking, behind `CustodyDepositProvider` |
| `lib/withdrawals/` | Withdrawal request → risk assessment → reserve → signing → settlement, behind `SigningProvider` |
| `lib/compliance/` | KYC/AML submission + sanctions screening, behind `KycProvider` |
| `lib/pricing/` | Asset pricing, behind a provider interface (fixture in this build) |
| `lib/security/` | Encryption at rest, MFA (TOTP), audit logging, rate limiting, origin/CSRF check |
| `lib/auth/` | Auth.js configuration + `requireUser()` / `requireAdmin()` guards |
| `lib/validation/` | Zod schemas + address format validation |

## The ledger

`lib/ledger/core.ts` is the single place balances are ever mutated. Design:

- **Append-only.** `LedgerEntry` rows are created, never updated or deleted
  by application code. A correction is a new entry (`ADJUSTMENT`), which is
  itself part of the permanent record.
- **Materialized balance cache.** `UserAssetBalance(userId, assetId)` holds
  `balance` (total ledger-accounted holdings) and `reservedBalance` (locked
  against a pending withdrawal). `available = balance - reservedBalance` is
  what a user can withdraw right now.
- **Row locking.** Every posting takes `SELECT ... FOR UPDATE` on the
  `UserAssetBalance` row for the duration of the DB transaction, serializing
  concurrent postings for the same user+asset and preventing lost updates —
  verified in `tests/ledger.test.ts` with 10 concurrent postings.
- **Idempotency.** Every posting requires a unique `idempotencyKey`. A
  duplicate key returns the original entry instead of posting again — this
  is what makes retried API calls, webhook redelivery, and double-click
  submits safe.
- **No negative balances, ever.** A debit (or a reservation) that would
  drive `balance` (or `available`) below zero is rejected before any row is
  written, via `InsufficientBalanceError`.
- **Withdrawal lifecycle uses three postings**, not one:
  1. `WITHDRAWAL_RESERVE` (`reservationEffect: "RESERVE"`) — moves the
     requested amount from `balance` into `reservedBalance` at request time.
  2. `WITHDRAWAL` (`reservationEffect: "SETTLE"`) on success — reduces both
     `balance` and `reservedBalance` once funds actually leave custody.
  3. `WITHDRAWAL_RELEASE` (`reservationEffect: "RELEASE"`) on
     rejection/failure — moves the amount back from `reservedBalance` to
     `balance`.

  This is what prevents a user from spending the same funds twice while a
  withdrawal is in flight, without ever letting `balance` go negative.

## Deposits

1. `getOrCreateDepositAddress` asks the custody provider for an address
   (deterministic mock in this build) and persists it per (user, asset).
2. `recordObservedDeposit` — in production, called from a signed custody
   webhook handler — creates a `Deposit` row as funds are observed on-chain.
3. `advanceDepositConfirmations` is called as confirmations increase; once
   `confirmations >= requiredConfirmations`, it posts a `DEPOSIT` ledger
   entry and marks the deposit `COMPLETED` in the same DB transaction.

`app/api/dev/deposits/simulate` composes these three steps to fully exercise
the flow without a real custody provider. It 404s outside development
(`NODE_ENV === "production"` check, not just an env flag).

## Withdrawals

`lib/withdrawals/index.ts#requestWithdrawal`:

1. Validates the asset is withdrawal-enabled and the address matches the
   network's expected format (`lib/validation/address.ts`).
2. Requires the caller to have already verified MFA for this request
   (checked one level up, in the API route, against the user's stored TOTP
   secret).
3. Runs risk scoring (`lib/withdrawals/risk.ts`): new destination address,
   new/untrusted device, request velocity, and amount thresholds each add to
   a score; crossing the threshold sets `status: PENDING_REVIEW` and records
   a `holdReason` an admin can see.
4. Reserves the funds (ledger posting #1 above) in the same DB transaction
   as creating the `Withdrawal` row.
5. If not flagged, immediately calls `processWithdrawal`, which submits to
   the signing provider and settles or fails the ledger reservation based on
   the result.
6. If flagged, an admin calls `reviewWithdrawal` (`POST
   /api/admin/withdrawals/:id/review`), which approves (→ processes) or
   rejects (→ releases the reservation) and writes an `AuditLog` entry.

The frontend only ever calls `POST /api/withdrawals` — it has no code path
that can submit a blockchain transaction directly.

## Auth & authorization

- Auth.js (NextAuth v5) with the Prisma adapter, JWT session strategy (12h
  max age), Google as the production provider, and a Credentials provider
  gated to development.
- `session.user` carries `id`, `role`, `status`, and `mfaEnabled`, populated
  in the `jwt` callback from the database at sign-in.
- **No reliance on Next.js Middleware for authorization.** `middleware.ts`
  only issues a per-request CSP nonce (see below) — it does not check
  sessions or roles, deliberately, because middleware runs on the Edge
  runtime where Prisma isn't available, and because auth checks are more
  robust placed at the data-access layer. Instead:
  - `app/dashboard/layout.tsx` and `app/admin/layout.tsx` call `auth()` and
    redirect if the session/role/status doesn't qualify.
  - Every API route calls `requireUser()` or `requireAdmin()`
    (`lib/auth/guards.ts`), which throws a typed `AuthError` mapped to the
    right HTTP status by `lib/api/response.ts#handleApiError`.

## CSP nonce middleware

`middleware.ts` generates a random nonce per request and sets it in the
`Content-Security-Policy` header (`script-src 'self' 'nonce-<value>'
'strict-dynamic'` in production). Next.js automatically tags its own
framework-injected inline scripts with this nonce, which is what allows a
strict CSP with no `unsafe-inline` / `unsafe-eval` for scripts in
production. In development the policy is relaxed to allow Next's dev-mode
HMR/eval, which the framework itself requires.

## Route structure note

The prompt's suggested file tree put `portfolio/`, `deposits/`,
`withdrawals/`, `transactions/`, `settings/`, and `security/` at the app
root, alongside a public marketing `security` page also required by the
legal-pages section of the spec. Both can't own the `/security` URL, so this
build nests the investor-authenticated pages under `/dashboard/*`
(`/dashboard/portfolio`, `/dashboard/security`, …), leaving `/security` for
the public security-practices page. This is noted here rather than silently
diverging from the spec.

## Testing strategy

- `tests/ledger.test.ts` — integration tests against a real local Postgres
  database (not mocked), covering deposits, idempotent replay, negative
  balance rejection, the reserve/settle/release lifecycle, and concurrent
  postings for the same user+asset.
- `tests/address-validation.test.ts`, `tests/utils.test.ts` — pure-function
  unit tests.
- `e2e/*.spec.ts` — Playwright tests covering the landing page, auth +
  authorization (including that an investor is redirected out of `/admin`),
  investor dashboard navigation, and the admin console, run against `next
  dev` (see `playwright.config.ts` for why).
