import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Admin Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [investorCount, pendingReview, confirmingDeposits, pendingKyc, activeAssets] = await Promise.all([
    prisma.user.count({ where: { role: "INVESTOR" } }),
    prisma.withdrawal.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.deposit.count({ where: { status: "CONFIRMING" } }),
    prisma.kycRecord.count({ where: { status: "PENDING" } }),
    prisma.asset.count({ where: { enabled: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="mt-1 text-sm text-muted">Platform-wide status at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Investors" value={String(investorCount)} />
        <StatCard label="Withdrawals awaiting review" value={String(pendingReview)} tone={pendingReview > 0 ? "negative" : "neutral"} />
        <StatCard label="Deposits confirming" value={String(confirmingDeposits)} />
        <StatCard label="KYC pending" value={String(pendingKyc)} tone={pendingKyc > 0 ? "negative" : "neutral"} />
        <StatCard label="Active assets" value={String(activeAssets)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/admin/withdrawals?status=PENDING_REVIEW" className="rounded-md border border-border p-4 text-sm hover:bg-surface">
            Review flagged withdrawals →
          </Link>
          <Link href="/admin/compliance" className="rounded-md border border-border p-4 text-sm hover:bg-surface">
            Review KYC queue →
          </Link>
          <Link href="/admin/system" className="rounded-md border border-border p-4 text-sm hover:bg-surface">
            Check system health →
          </Link>
        </div>
      </Card>
    </div>
  );
}
