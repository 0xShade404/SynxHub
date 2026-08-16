import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getPortfolioSummary, getPerformanceSeries } from "@/lib/portfolio";
import { prisma } from "@/lib/database/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { AllocationList } from "@/components/dashboard/AllocationList";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatUsd, formatCrypto } from "@/lib/utils";

export const metadata: Metadata = { title: "Portfolio" };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [summary, performance, balances] = await Promise.all([
    getPortfolioSummary(userId),
    getPerformanceSeries(userId, "30D"),
    prisma.userAssetBalance.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { asset: { sortOrder: "asc" } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-sm text-muted">Balances, allocation, and performance across your strategy.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Portfolio value" value={formatUsd(summary.currentValueUsd)} />
        <StatCard label="Total deposited" value={formatUsd(summary.totalDepositedUsd)} />
        <StatCard label="Total withdrawn" value={formatUsd(summary.totalWithdrawnUsd)} />
        <StatCard
          label="Net P&L"
          value={formatUsd(summary.netPnlUsd, { signDisplay: "exceptZero" })}
          tone={summary.netPnlUsd > 0 ? "positive" : summary.netPnlUsd < 0 ? "negative" : "neutral"}
        />
      </div>

      <Card>
        <PerformanceChart initialData={performance} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
          </CardHeader>
          <AllocationList allocation={summary.allocation} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balances by asset</CardTitle>
          </CardHeader>
          {balances.length === 0 ? (
            <p className="text-sm text-muted">No balances yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {balances.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <span className="font-medium">{b.asset.symbol}</span>
                  <div className="text-right">
                    <p className="tabular-nums">{formatCrypto(Number(b.balance), b.asset.symbol)}</p>
                    {Number(b.reservedBalance) > 0 && (
                      <p className="text-xs text-muted">
                        {formatCrypto(Number(b.reservedBalance), b.asset.symbol)} reserved for pending withdrawal
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
