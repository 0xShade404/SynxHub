import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/database/prisma";
import { getPortfolioSummary } from "@/lib/portfolio";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { InvestorStatusControl } from "@/components/admin/InvestorStatusControl";
import { formatUsd, formatDate, formatCrypto } from "@/lib/utils";

export const metadata: Metadata = { title: "Investor detail" };
export const dynamic = "force-dynamic";

export default async function AdminInvestorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const investor = await prisma.user.findUnique({
    where: { id },
    include: {
      kycRecords: { orderBy: { createdAt: "desc" } },
      balances: { include: { asset: true } },
      withdrawals: { orderBy: { requestedAt: "desc" }, take: 10, include: { asset: true } },
      deposits: { orderBy: { createdAt: "desc" }, take: 10, include: { asset: true } },
      securityEvents: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!investor) notFound();

  const portfolio = await getPortfolioSummary(id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{investor.name ?? investor.email}</h1>
        <p className="mt-1 text-sm text-muted">{investor.email} · Joined {formatDate(investor.createdAt)}</p>
      </div>

      <Card>
        <InvestorStatusControl investorId={investor.id} currentStatus={investor.status} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Portfolio value" value={formatUsd(portfolio.currentValueUsd)} />
        <StatCard label="Total deposited" value={formatUsd(portfolio.totalDepositedUsd)} />
        <StatCard label="Total withdrawn" value={formatUsd(portfolio.totalWithdrawnUsd)} />
        <StatCard
          label="Net P&L"
          value={formatUsd(portfolio.netPnlUsd, { signDisplay: "exceptZero" })}
          tone={portfolio.netPnlUsd > 0 ? "positive" : portfolio.netPnlUsd < 0 ? "negative" : "neutral"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Balances</CardTitle></CardHeader>
          {investor.balances.length === 0 ? (
            <p className="text-sm text-muted">No balances.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {investor.balances.map((b) => (
                <li key={b.id} className="flex justify-between py-2">
                  <span>{b.asset.symbol}</span>
                  <span className="tabular-nums">{formatCrypto(Number(b.balance), b.asset.symbol)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>KYC history</CardTitle></CardHeader>
          {investor.kycRecords.length === 0 ? (
            <p className="text-sm text-muted">No KYC submissions.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {investor.kycRecords.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-2">
                  <div>
                    <p>{k.country} · risk: {k.riskLevel ?? "—"}</p>
                    <p className="text-xs text-muted">{formatDate(k.createdAt)}</p>
                  </div>
                  <Badge tone={k.status === "APPROVED" ? "success" : k.status === "REJECTED" ? "danger" : "neutral"}>
                    {k.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent withdrawals</CardTitle></CardHeader>
          {investor.withdrawals.length === 0 ? (
            <p className="text-sm text-muted">No withdrawals.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {investor.withdrawals.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-2">
                  <span>{formatCrypto(Number(w.amount), w.asset.symbol)}</span>
                  <Badge tone="neutral">{w.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Security events</CardTitle></CardHeader>
          {investor.securityEvents.length === 0 ? (
            <p className="text-sm text-muted">No security events.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {investor.securityEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <span>{e.type.replace(/_/g, " ")}</span>
                  <Badge tone={e.severity === "HIGH" ? "danger" : "neutral"}>{e.severity}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
