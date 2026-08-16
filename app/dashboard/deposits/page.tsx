import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/database/prisma";
import { listDeposits } from "@/lib/deposits";
import { DepositFlow } from "@/components/dashboard/DepositFlow";
import { DepositsTable } from "@/components/dashboard/DepositsTable";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Deposits" };
export const dynamic = "force-dynamic";

export default async function DepositsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [assets, deposits] = await Promise.all([
    prisma.asset.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
    listDeposits(userId),
  ]);

  const assetOptions = assets.map((a) => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    network: a.network,
    depositEnabled: a.depositEnabled,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deposits</h1>
        <p className="mt-1 text-sm text-muted">
          Generate a deposit address for a supported asset and network. Funds are credited to
          your ledger once the required number of network confirmations is reached.
        </p>
      </div>

      <DepositFlow assets={assetOptions} />

      <Card>
        <CardHeader>
          <CardTitle>Deposit history</CardTitle>
        </CardHeader>
        <DepositsTable deposits={deposits} />
      </Card>
    </div>
  );
}
