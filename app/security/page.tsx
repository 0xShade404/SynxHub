import type { Metadata } from "next";
import { ShieldCheck, Lock, KeyRound, Eye, Server, FileWarning } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Security" };

const CONTROLS = [
  {
    icon: Lock,
    title: "Transport & application security",
    items: ["HTTPS enforced with HSTS", "Content Security Policy and secure response headers", "CSRF-resistant, same-origin-verified state-changing requests", "Parameterized queries via Prisma — no raw SQL string interpolation"],
  },
  {
    icon: KeyRound,
    title: "Account security",
    items: ["Google OAuth with httpOnly, secure session cookies", "Optional TOTP multi-factor authentication with recovery codes", "Session expiry and server-side session/role enforcement on every request", "Rate limiting on login and withdrawal endpoints"],
  },
  {
    icon: Eye,
    title: "Monitoring & audit",
    items: ["Login event logging with device/IP context", "Security events for new devices, new withdrawal addresses, and MFA changes", "Immutable audit log for every admin action", "Admin system-health dashboard for database and provider status"],
  },
  {
    icon: Server,
    title: "Financial integrity",
    items: ["Append-only ledger with row-level locking to prevent race conditions", "Idempotency keys prevent duplicate deposits/withdrawals and replay attacks", "Server-enforced non-negative balances — no frontend-computed balances", "Withdrawals never issued directly from client code"],
  },
  {
    icon: ShieldCheck,
    title: "Custody & key management",
    items: ["No private keys or seed phrases are ever stored in the SynxHub database", "Deposit and withdrawal operations are delegated to a custody-provider integration layer", "Sensitive fields (e.g. MFA secrets) are encrypted at rest with AES-256-GCM"],
  },
  {
    icon: FileWarning,
    title: "What we do not claim",
    items: ["We do not claim immunity to every possible attack", "We do not claim insurance coverage, regulatory licensing, or completed third-party audits unless explicitly documented and verifiable", "Security is an ongoing program, not a one-time feature"],
  },
];

export default function SecurityPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Container className="max-w-4xl py-16">
          <h1 className="text-3xl font-semibold tracking-tight">Security</h1>
          <p className="mt-4 max-w-2xl text-muted">
            Security is a core product feature at SynxHub, not an afterthought. Below is an
            honest account of what is implemented today — and what still requires a live,
            reviewed integration before real investor funds are accepted.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {CONTROLS.map((control) => (
              <div key={control.title} className="rounded-xl border border-border bg-surface-raised p-6">
                <control.icon className="h-5 w-5 text-brand" aria-hidden="true" />
                <h2 className="mt-3 font-semibold">{control.title}</h2>
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  {control.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-warning-soft bg-warning-soft/60 p-6 text-sm text-foreground">
            <h2 className="font-semibold">Reporting a vulnerability</h2>
            <p className="mt-2">
              If you believe you&apos;ve found a security issue, please contact
              security@synxhub.example. Do not test against production accounts that are not
              your own, and give us a reasonable window to remediate before public disclosure.
            </p>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
