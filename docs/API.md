# API reference

All routes are Next.js Route Handlers under `app/api/`. Unless noted, every
route requires an authenticated session (`requireUser()` /
`requireAdmin()` / `requireRole()` — see `lib/auth/guards.ts`) and returns
`401`/`403` JSON errors when that fails. State-changing routes additionally
verify the request's `Origin` header (`lib/security/origin.ts`) and return
`403` if it doesn't match `NEXT_PUBLIC_APP_URL`.

Errors are returned as `{ "error": string }` (plus `issues` for Zod
validation failures), with an appropriate HTTP status — see
`lib/api/response.ts`.

## Auth

| Method | Path | Description |
|---|---|---|
| `GET`/`POST` | `/api/auth/[...nextauth]` | Auth.js — sign-in, callback, session, sign-out. Public. |
| `POST` | `/api/auth/register` | Development-only self-registration for the dev-credentials provider. 404s in production. |

## Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/assets` | Enabled asset universe (symbol, network, price, allocation, flags). Public. |

## Portfolio & transactions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/portfolio?timeframe=24H\|7D\|30D\|90D\|1Y\|ALL` | Portfolio summary + performance series for the current user. |
| `GET` | `/api/transactions?cursor=&take=` | Paginated ledger entries for the current user. |

## Deposits

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/deposits` | Current user's deposit history. |
| `POST` | `/api/deposits/address` | `{ assetId }` → get-or-create a deposit address + QR code. |
| `POST` | `/api/dev/deposits/simulate` | `{ assetId, amount }` — simulates a fully-confirmed deposit. **Development only; 404s in production.** |

## Withdrawals

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/withdrawals` | Current user's withdrawal history. |
| `POST` | `/api/withdrawals` | `{ assetId, destinationAddress, amount, mfaCode, idempotencyKey }` — validates, risk-scores, reserves funds, and (if not flagged) processes immediately. Requires MFA to already be enabled. |

## Security

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/security/mfa/enroll` | Generates a new (unpersisted) TOTP secret, QR code, and recovery codes. |
| `POST` | `/api/security/mfa/enroll/confirm` | `{ code, encryptedSecret, encryptedRecoveryCodes }` — verifies the code and persists/enables MFA. |
| `POST` | `/api/security/mfa/disable` | `{ code }` — TOTP or recovery code required to disable MFA. |
| `GET` | `/api/security/events` | Current user's recent security events. |
| `GET` | `/api/security/login-events` | Current user's recent login history. |

## Compliance

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/kyc` | Current user's latest KYC record status. |
| `POST` | `/api/kyc` | `{ fullName, country, dateOfBirth }` — submits for verification + sanctions screening. |

## User settings

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/user/allowlist` | Current user's withdrawal address allowlist. |
| `POST` | `/api/user/allowlist` | `{ assetId, address, label? }` — adds/approves an allowlisted address. |

## Admin

All admin routes additionally require `role` to be `ADMIN`, `SUPPORT`, or
`COMPLIANCE` (`requireAdmin()`); some further restrict to `[ADMIN,
COMPLIANCE]`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/investors?q=` | Search/list investors. |
| `GET` | `/api/admin/investors/:id` | Investor detail: balances, KYC, withdrawals, deposits, security events. |
| `PATCH` | `/api/admin/investors/:id` | `{ status, reason? }` — change account status; audited. |
| `GET` | `/api/admin/assets` | Full asset list (including disabled). |
| `PATCH` | `/api/admin/assets/:id` | `{ enabled?, depositEnabled?, withdrawalEnabled?, tradingEnabled?, targetAllocationBps?, currentPriceUsd? }` — audited. |
| `GET` | `/api/admin/withdrawals?status=` | Withdrawal queue by status. |
| `POST` | `/api/admin/withdrawals/:id/review` | `{ decision: "APPROVE"\|"REJECT", note? }` — audited; approves → processes, rejects → releases the reservation. |
| `GET` | `/api/admin/deposits?status=` | Deposit queue by status. |
| `GET` | `/api/admin/compliance` | KYC queue + restricted jurisdictions. Requires `[ADMIN, COMPLIANCE]`. |
| `PATCH` | `/api/admin/compliance/:userId` | `{ status, reviewerNote? }` — manual KYC decision; audited. Requires `[ADMIN, COMPLIANCE]`. |
| `GET` | `/api/admin/system/health` | Database connectivity, provider status, queue depths. |
