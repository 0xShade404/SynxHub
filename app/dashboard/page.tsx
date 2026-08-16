import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPortfolioSummary, getPerformanceSeries } from "@/lib/portfolio";
import { prisma } from "@/lib/database/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { AllocationList } from "@/components/dashboard/AllocationList";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskDisclosure } from "@/components/ui/RiskDisclosure";
import { formatUsd, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [summary, performance, recentEntries] = await Promise.all([
    getPortfolioSummary(userId),
    getPerformanceSeries(userId, "30D"),
    prisma.ledgerEntry.findMany({
      where: { userId },
      include: { asset: { select: { symbol: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Your portfolio, valued from SynxHub&apos;s server-side ledger.
          {summary.isDemoData && <span className="ml-2 font-semibold text-warning">DEMO DATA</span>}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Portfolio value" value={formatUsd(summary.currentValueUsd)} />
        <StatCard
          label="Net P&L"
          value={formatUsd(summary.netPnlUsd, { signDisplay: "exceptZero" })}
          tone={summary.netPnlUsd > 0 ? "positive" : summary.netPnlUsd < 0 ? "negative" : "neutral"}
          hint={`ROI ${summary.roiPercent >= 0 ? "+" : ""}${summary.roiPercent.toFixed(2)}%`}
        />
        <StatCard label="Total deposited" value={formatUsd(summary.totalDepositedUsd)} />
        <StatCard label="Available to withdraw" value={formatUsd(summary.availableWithdrawalUsd)} />
      </div>

      <Card>
        <PerformanceChart initialData={performance} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current allocation</CardTitle>
            <Link href="/dashboard/portfolio" className="text-xs font-medium text-brand hover:underline">
              View portfolio
            </Link>
          </CardHeader>
          <AllocationList allocation={summary.allocation} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <Link href="/dashboard/transactions" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </CardHeader>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-muted">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentEntries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{entry.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted">{formatDate(entry.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums">
                      {entry.direction === "CREDIT" ? "+" : "−"}
                      {Number(entry.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                      {entry.asset.symbol}
                    </p>
                    <Badge tone={entry.status === "POSTED" ? "success" : "neutral"} className="mt-1">
                      {entry.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <RiskDisclosure />
    </div>
  );
}
