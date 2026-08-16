import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/database/prisma";
import { listWithdrawals } from "@/lib/withdrawals";
import { getAvailableBalance } from "@/lib/ledger/core";
import { WithdrawalsPageClient } from "@/components/dashboard/WithdrawalsPageClient";
import { WithdrawalsTable } from "@/components/dashboard/WithdrawalsTable";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskDisclosure } from "@/components/ui/RiskDisclosure";

export const metadata: Metadata = { title: "Withdrawals" };
export const dynamic = "force-dynamic";

export default async function WithdrawalsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [assets, withdrawals, user] = await Promise.all([
    prisma.asset.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
    listWithdrawals(userId),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { mfaEnabled: true } }),
  ]);

  const balances: Record<string, { available: number; symbol: string }> = {};
  for (const asset of assets) {
    const { available } = await getAvailableBalance(userId, asset.id);
    balances[asset.id] = { available: Number(available), symbol: asset.symbol };
  }

  const assetOptions = assets.map((a) => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    network: a.network,
    withdrawalEnabled: a.withdrawalEnabled,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Withdrawals</h1>
        <p className="mt-1 text-sm text-muted">
          Zero SynxHub platform fee. No artificial minimum or maximum. Unavoidable network
          costs, when they apply, are always shown separately before you confirm.
        </p>
      </div>

      <WithdrawalsPageClient assets={assetOptions} balances={balances} mfaEnabled={user.mfaEnabled} />

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal history</CardTitle>
        </CardHeader>
        <WithdrawalsTable withdrawals={withdrawals} />
      </Card>

      <RiskDisclosure />
    </div>
  );
}
