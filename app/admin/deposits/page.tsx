import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCrypto, formatDate } from "@/lib/utils";
import type { DepositStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Deposits" };
export const dynamic = "force-dynamic";

const STATUSES: DepositStatus[] = ["AWAITING_FUNDS", "CONFIRMING", "COMPLETED", "FAILED"];

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  AWAITING_FUNDS: "neutral",
  CONFIRMING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
};

export default async function AdminDepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.find((s) => s === status);

  const deposits = await prisma.deposit.findMany({
    where: activeStatus ? { status: activeStatus } : {},
    include: { asset: true, user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deposits</h1>
        <p className="mt-1 text-sm text-muted">Monitor inbound deposits across all confirmation states.</p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1" role="tablist" aria-label="Deposit status">
        <Link
          href="/admin/deposits"
          className={cn("rounded-md px-3 py-1.5 text-xs font-medium", !activeStatus ? "bg-brand text-white" : "text-muted hover:bg-surface")}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/deposits?status=${s}`}
            className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeStatus === s ? "bg-brand text-white" : "text-muted hover:bg-surface")}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Investor</th>
                <th scope="col" className="px-4 py-3">Asset</th>
                <th scope="col" className="px-4 py-3">Amount</th>
                <th scope="col" className="px-4 py-3">Confirmations</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-4 py-3">{d.user.name ?? d.user.email}</td>
                  <td className="px-4 py-3">{d.asset.symbol}</td>
                  <td className="px-4 py-3 tabular-nums">{d.amount ? formatCrypto(Number(d.amount), d.asset.symbol) : "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{d.confirmations}/{d.requiredConfirmations}</td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONE[d.status]}>{d.status.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3 text-muted">{formatDate(d.createdAt)}</td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">No deposits found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
