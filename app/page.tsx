import Link from "next/link";
import { ShieldCheck, Wallet, LineChart } from "lucide-react";
import { prisma } from "@/lib/database/prisma";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Hero } from "@/components/marketing/Hero";
import { StrategySteps } from "@/components/marketing/StrategySteps";
import { AssetGrid } from "@/components/marketing/AssetGrid";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export const revalidate = 60;

async function getAssets() {
  const assets = await prisma.asset.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
  });
  return assets.map((a) => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    network: a.network,
    targetAllocationBps: a.targetAllocationBps,
    currentPriceUsd: a.currentPriceUsd.toString(),
    isDemoData: a.isDemoData,
  }));
}

const PILLARS = [
  {
    icon: LineChart,
    title: "Transparent portfolio management",
    body: "Every deposit, allocation, rebalance, and withdrawal is recorded in a server-side ledger you can review in your dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Security-first infrastructure",
    body: "MFA, device and address risk checks, and admin-reviewed holds on flagged withdrawals — security controls built into the product, not bolted on.",
  },
  {
    icon: Wallet,
    title: "Flexible withdrawals",
    body: "Zero SynxHub platform fee, no artificial minimums or maximums. Unavoidable network costs are always shown separately and in advance.",
  },
];

export default async function HomePage() {
  const assets = await getAssets();

  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <main id="main-content">
        <Hero />

        <section className="border-b border-border py-20">
          <Container>
            <div className="grid gap-8 sm:grid-cols-3">
              {PILLARS.map((pillar) => (
                <div key={pillar.title}>
                  <pillar.icon className="h-6 w-6 text-brand" aria-hidden="true" />
                  <h2 className="mt-4 text-lg font-semibold">{pillar.title}</h2>
                  <p className="mt-2 text-sm text-muted">{pillar.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <StrategySteps />
        <AssetGrid assets={assets} />

        <section className="py-20">
          <Container className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Understand exactly how SynxHub works
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Strategy methodology, fee structure, custody architecture, and the security
              controls protecting your account — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/transparency" size="lg">
                View Transparency & Security
              </LinkButton>
              <Link href="/signup" className="text-sm font-medium text-brand hover:underline">
                or create your account →
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
