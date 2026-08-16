import type { Metadata } from "next";
import { prisma } from "@/lib/database/prisma";
import { AssetConfigTable } from "@/components/admin/AssetConfigTable";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Assets & Strategy" };
export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
  const assets = await prisma.asset.findMany({ orderBy: { sortOrder: "asc" } });

  const serialized = assets.map((a) => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    network: a.network,
    enabled: a.enabled,
    depositEnabled: a.depositEnabled,
    withdrawalEnabled: a.withdrawalEnabled,
    tradingEnabled: a.tradingEnabled,
    targetAllocationBps: a.targetAllocationBps,
    currentPriceUsd: a.currentPriceUsd.toString(),
    isDemoData: a.isDemoData,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assets & Strategy</h1>
        <p className="mt-1 text-sm text-muted">
          Configure the eight-asset (or any size) Layer-1 universe: enable/disable assets,
          toggle deposits/withdrawals/trading, and set target allocation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset universe</CardTitle>
        </CardHeader>
        <AssetConfigTable assets={serialized} />
      </Card>
    </div>
  );
}
