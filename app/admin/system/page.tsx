import type { Metadata } from "next";
import { prisma } from "@/lib/database/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "System" };
export const dynamic = "force-dynamic";

async function checkDatabase() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "OK" as const, latencyMs: Date.now() - start };
  } catch {
    return { status: "DOWN" as const, latencyMs: Date.now() - start };
  }
}

export default async function AdminSystemPage() {
  const [database, pendingWithdrawals, flaggedWithdrawals, confirmingDeposits, recentAuditLogs] = await Promise.all([
    checkDatabase(),
    prisma.withdrawal.count({ where: { status: { in: ["PENDING_CONFIRMATION", "APPROVED", "PROCESSING"] } } }),
    prisma.withdrawal.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.deposit.count({ where: { status: "CONFIRMING" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const custodyProvider = process.env.CUSTODY_PROVIDER ?? "mock";
  const kycProvider = process.env.KYC_PROVIDER ?? "mock";
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System</h1>
        <p className="mt-1 text-sm text-muted">Provider status, queue depth, and recent admin activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase text-muted">Database</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={database.status === "OK" ? "success" : "danger"}>{database.status}</Badge>
            <span className="text-xs text-muted">{database.latencyMs}ms</span>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-muted">Custody provider</p>
          <div className="mt-2">
            <Badge tone={custodyProvider === "mock" ? "warning" : "success"}>{custodyProvider}</Badge>
            {custodyProvider === "mock" && <p className="mt-1 text-xs text-muted">Not connected to a real custodian.</p>}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-muted">KYC/AML provider</p>
          <div className="mt-2">
            <Badge tone={kycProvider === "mock" ? "warning" : "success"}>{kycProvider}</Badge>
            {kycProvider === "mock" && <p className="mt-1 text-xs text-muted">Not a real compliance integration.</p>}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-muted">Environment</p>
          <div className="mt-2">
            <Badge tone={demoMode ? "warning" : "success"}>{demoMode ? "DEMO MODE" : "PRODUCTION DATA"}</Badge>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase text-muted">Withdrawals in flight</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{pendingWithdrawals}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-muted">Withdrawals flagged for review</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{flaggedWithdrawals}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-muted">Deposits confirming</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{confirmingDeposits}</p>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold">Recent admin activity (audit log)</p>
        {recentAuditLogs.length === 0 ? (
          <p className="text-sm text-muted">No admin actions recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recentAuditLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-muted">
                    {log.targetType} {log.targetId ? `· ${log.targetId}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
