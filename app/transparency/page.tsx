import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { RISK_DISCLOSURE_LONG } from "@/lib/constants";

export const metadata: Metadata = { title: "Transparency & Security" };
export const revalidate = 60;

export default async function TransparencyPage() {
  const assets = await prisma.asset.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Container className="max-w-4xl py-16">
          <h1 className="text-3xl font-semibold tracking-tight">Transparency & Security</h1>
          <p className="mt-4 max-w-2xl text-muted">
            What you deposited → where your capital is accounted for → current portfolio
            value → profit/loss → what you can withdraw → applicable costs. Every step below
            is backed by the server-side ledger, not frontend arithmetic.
          </p>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">The strategy</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              SynxHub runs a single automated strategy that allocates deposited capital
              across an admin-configured universe of Layer-1 networks, targeting the
              allocation weights shown below. The strategy engine periodically compares
              current allocation to target allocation and rebalances according to
              predefined rules. Automation manages allocation and rebalancing mechanics —
              it does not eliminate market risk or guarantee any outcome.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">Supported assets & target allocation</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-surface text-xs uppercase text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">Asset</th>
                    <th scope="col" className="px-4 py-3">Network</th>
                    <th scope="col" className="px-4 py-3">Target allocation</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{a.symbol} — {a.name}</td>
                      <td className="px-4 py-3 text-muted">{a.network}</td>
                      <td className="px-4 py-3 tabular-nums">{(a.targetAllocationBps / 100).toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <Badge tone={a.enabled ? "success" : "neutral"}>
                          {a.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              Prices shown across the platform are {assets.some((a) => a.isDemoData) ? "currently DEMO DATA fixtures" : "sourced from the configured pricing provider"} — see &quot;Performance methodology&quot; below.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">Performance methodology</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your portfolio value, deposited/withdrawn totals, and P&amp;L are computed from
              the immutable ledger: every deposit and withdrawal records its USD value at the
              moment it posts. Historical performance charts replay your ledger balance
              history and value it at <em>current</em> pricing — SynxHub does not simulate or
              fabricate historical market prices it did not itself observe. In production,
              connecting a live valuation pipeline with true point-in-time pricing is listed
              as a required follow-up integration (see README.md).
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">Fees</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              SynxHub charges no platform fee on withdrawals, and applies no artificial
              minimum or maximum withdrawal amount. Where a blockchain network charges an
              unavoidable processing cost, it is shown separately, in advance, at checkout —
              never bundled into a misleading &quot;free withdrawal&quot; claim. See the{" "}
              <Link href="/legal/withdrawal-policy" className="text-brand hover:underline">
                Withdrawal Policy
              </Link>.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">Custody architecture</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Deposit addresses and withdrawal signing are handled through a custody-provider
              integration layer (<code className="rounded bg-surface px-1 py-0.5 text-xs">lib/deposits/provider.ts</code>,{" "}
              <code className="rounded bg-surface px-1 py-0.5 text-xs">lib/withdrawals/provider.ts</code>). SynxHub never generates
              addresses or signs transactions in frontend code, and never stores private keys
              or seed phrases. The current build ships a clearly-labeled mock provider for
              development; a production deployment must integrate a real, reviewed custody
              provider before accepting real funds.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">Security controls</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              MFA, device and address risk scoring, rate limiting, audit logging, and
              server-enforced authorization on every request. See the full{" "}
              <Link href="/security" className="text-brand hover:underline">Security page</Link>.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">Compliance</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Identity verification and sanctions screening run through a KYC/AML provider
              integration layer before deposits are enabled. See the{" "}
              <Link href="/legal/aml-kyc" className="text-brand hover:underline">AML/KYC Policy</Link>.
            </p>
          </section>

          <section className="mt-12 rounded-xl border border-warning-soft bg-warning-soft/60 p-6 text-sm text-foreground">
            <h2 className="font-semibold">Risks</h2>
            <p className="mt-2">{RISK_DISCLOSURE_LONG}</p>
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="mt-2 text-sm text-muted">
              Questions about any of the above:{" "}
              <Link href="/contact" className="text-brand hover:underline">Contact us</Link>.
            </p>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
