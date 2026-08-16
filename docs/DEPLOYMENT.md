# Deployment guide

This guide targets Vercel (the natural fit for Next.js) but the app is a
standard Next.js + PostgreSQL app and will run on any Node.js host that can
run `next build` / `next start` and reach a Postgres instance.

## 1. Provision infrastructure

- **Database**: a managed PostgreSQL instance (e.g. Neon, Supabase, RDS,
  Vercel Postgres). Note the connection string.
- **Domain**: register/point your domain at the hosting platform; most
  platforms (including Vercel) provision TLS automatically once DNS is
  configured.

## 2. Configure environment variables

Set every variable from [.env.example](../.env.example) in your hosting
platform's environment variable settings (never in a committed file):

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | your production URL, no trailing slash |
| `NEXT_PUBLIC_DEMO_MODE` | `false` — **only after** real providers are integrated (see below) |
| `DATABASE_URL` | your managed Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` — a fresh value, not the dev one |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | from Google Cloud Console (see README) |
| `ENABLE_DEV_CREDENTIALS_LOGIN` | unset or `false` — it's hardcoded off outside development regardless |
| `APP_ENCRYPTION_KEY` | `openssl rand -base64 32` — a fresh value; rotating this invalidates existing encrypted MFA secrets |
| `CUSTODY_PROVIDER`, `CUSTODY_API_KEY`, `CUSTODY_API_SECRET`, `CUSTODY_WEBHOOK_SECRET` | your real custody provider's credentials, once integrated |
| `KYC_PROVIDER`, `KYC_API_KEY`, `KYC_WEBHOOK_SECRET` | your real KYC/AML provider's credentials, once integrated |
| `PRICING_PROVIDER`, `PRICING_API_KEY` | your real pricing feed's credentials, once integrated |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | if backing rate limiting with a shared store for multi-instance deployments |
| `SENTRY_DSN` | if wiring up error monitoring |

Update the Google OAuth client's authorized redirect URI to
`https://your-domain/api/auth/callback/google`.

## 3. Database migrations

Run migrations against production **before** the first deploy serves
traffic:

```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

`prisma migrate deploy` (not `migrate dev`) applies committed migrations
without prompting or generating new ones — this is the correct command for
CI/production. Seed data (`npm run db:seed`) is meant for demo/dev
environments; do not run it against a production database expecting real
users (it will create the demo admin/investor accounts with published
passwords — dev-credentials are hardcoded off outside development, but
prefer to skip seeding a production database entirely, or write a
production-specific seed limited to admin bootstrap + real asset config).

## 4. Build & deploy

```bash
npm run build
npm run start   # or let your platform run this
```

On Vercel: connect the repository, set the environment variables above, and
set the build command to `npm run build` (default) with a post-install or
release step running `npx prisma migrate deploy` against the production
`DATABASE_URL`. Vercel's standard Next.js preset handles the rest.

## 5. Verify before opening to real users

- [ ] `npm run build` succeeds with no errors.
- [ ] `npm run lint` and `npm run typecheck` are clean.
- [ ] `npm run test` and `npm run test:e2e` pass.
- [ ] `/admin/system` reports the database as `OK` and shows the *real*
      custody/KYC provider name (not `mock`).
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` and the demo banner no longer renders.
- [ ] Google OAuth sign-in works end-to-end against the production domain.
- [ ] Legal pages (`/legal/*`) have been reviewed and finalized by counsel —
      they currently contain explicit placeholder notices.
- [ ] A real custody provider is integrated and has been security-reviewed;
      `lib/deposits/provider.ts` and `lib/withdrawals/provider.ts` no longer
      point at the mock implementation.
- [ ] A real KYC/AML provider is integrated and the onboarding flow has been
      reviewed by compliance counsel; `lib/compliance/provider.ts` no
      longer points at the mock implementation.
- [ ] A real pricing feed is integrated; `lib/pricing/provider.ts` no longer
      serves `DEMO_FIXTURE` prices.
- [ ] An independent security review/penetration test has been completed.
- [ ] Database backups are configured and a restore has been tested (see
      below).

## Monitoring

- Application health: the admin **System** page (`/admin/system`) surfaces
  live database connectivity, queue depth (pending/flagged withdrawals,
  confirming deposits), and provider status.
- Wire `SENTRY_DSN` (or an equivalent) for error monitoring — not included
  by default.
- Most managed Postgres providers expose their own connection/latency
  metrics; use those alongside the in-app health check.

## Backups

Configure automated backups on your managed Postgres provider (point-in-time
recovery if available) — this is infrastructure configuration, not
something the application code can enforce. **Test a restore before you
need one.**

## Rollback procedure

1. Re-deploy the previous known-good build (Vercel: use the "Promote to
   Production" action on a prior deployment; other platforms: redeploy the
   previous release/tag).
2. If the rollback also requires a schema rollback, apply the corresponding
   down-migration or restore from backup — Prisma Migrate does not
   auto-generate down migrations, so plan schema changes with backward
   compatibility in mind (e.g. add-only migrations that a previous release
   can safely ignore) when possible.
3. Confirm `/admin/system` reports a healthy database and expected queue
   depths after rollback.
