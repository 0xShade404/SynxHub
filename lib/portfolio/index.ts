import { prisma } from "@/lib/database/prisma";
import { getAssetPrices } from "@/lib/pricing/provider";
import { Prisma } from "@prisma/client";

export type Timeframe = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";

const TIMEFRAME_MS: Record<Exclude<Timeframe, "ALL">, number> = {
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
  "90D": 90 * 24 * 60 * 60 * 1000,
  "1Y": 365 * 24 * 60 * 60 * 1000,
};

export interface PortfolioSummary {
  currentValueUsd: number;
  totalDepositedUsd: number;
  totalWithdrawnUsd: number;
  netPnlUsd: number;
  roiPercent: number;
  availableWithdrawalUsd: number;
  allocation: { assetId: string; symbol: string; name: string; valueUsd: number; weightPercent: number }[];
  isDemoData: boolean;
}

/**
 * Every figure here is derived from the ledger and current admin-configured
 * pricing — never fabricated. `usdValueAtPosting` is recorded in
 * LedgerEntry.metadata by the deposit/withdrawal services at the moment
 * each entry is posted, which is what lets us report accurate
 * deposited/withdrawn totals without needing full historical price series.
 */
export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const [balances, prices, depositEntries, withdrawalEntries] = await Promise.all([
    prisma.userAssetBalance.findMany({
      where: { userId },
      include: { asset: true },
    }),
    getAssetPrices(),
    prisma.ledgerEntry.findMany({
      where: { userId, type: "DEPOSIT", status: "POSTED" },
      select: { metadata: true },
    }),
    prisma.ledgerEntry.findMany({
      where: { userId, type: "WITHDRAWAL", status: "POSTED" },
      select: { metadata: true },
    }),
  ]);

  const priceByAsset = new Map(prices.map((p) => [p.assetId, p]));

  let currentValueUsd = 0;
  let availableWithdrawalUsd = 0;
  const allocation: PortfolioSummary["allocation"] = [];
  let anyDemo = false;

  for (const b of balances) {
    const price = priceByAsset.get(b.assetId);
    const priceUsd = price?.priceUsd ?? Number(b.asset.currentPriceUsd);
    if (price?.isDemoData ?? b.asset.isDemoData) anyDemo = true;
    const balance = Number(b.balance);
    const reserved = Number(b.reservedBalance);
    const valueUsd = balance * priceUsd;
    currentValueUsd += valueUsd;
    availableWithdrawalUsd += (balance - reserved) * priceUsd;
    if (valueUsd > 0) {
      allocation.push({
        assetId: b.assetId,
        symbol: b.asset.symbol,
        name: b.asset.name,
        valueUsd,
        weightPercent: 0,
      });
    }
  }

  for (const a of allocation) {
    a.weightPercent = currentValueUsd > 0 ? (a.valueUsd / currentValueUsd) * 100 : 0;
  }
  allocation.sort((a, b) => b.valueUsd - a.valueUsd);

  const sumUsd = (entries: { metadata: Prisma.JsonValue }[]) =>
    entries.reduce((sum, e) => {
      const meta = e.metadata as { usdValueAtPosting?: number } | null;
      return sum + (meta?.usdValueAtPosting ?? 0);
    }, 0);

  const totalDepositedUsd = sumUsd(depositEntries);
  const totalWithdrawnUsd = sumUsd(withdrawalEntries);
  const netCostBasis = totalDepositedUsd - totalWithdrawnUsd;
  const netPnlUsd = currentValueUsd - netCostBasis;
  const roiPercent = totalDepositedUsd > 0 ? (netPnlUsd / totalDepositedUsd) * 100 : 0;

  return {
    currentValueUsd,
    totalDepositedUsd,
    totalWithdrawnUsd,
    netPnlUsd,
    roiPercent,
    availableWithdrawalUsd,
    allocation,
    isDemoData: anyDemo,
  };
}

export interface PerformancePoint {
  timestamp: string;
  valueUsd: number;
}

/**
 * Reconstructs portfolio value at evenly spaced checkpoints by replaying
 * ledger balance deltas up to each checkpoint and valuing the result at
 * *current* pricing. This intentionally does not simulate historical market
 * price movement SynxHub did not itself observe — see the Transparency &
 * Security page for the full methodology note.
 */
export async function getPerformanceSeries(
  userId: string,
  timeframe: Timeframe
): Promise<PerformancePoint[]> {
  const [entries, prices, user] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { userId, status: "POSTED" },
      orderBy: { createdAt: "asc" },
      select: { assetId: true, direction: true, amount: true, createdAt: true, type: true },
    }),
    getAssetPrices(),
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
  ]);

  const priceByAsset = new Map(prices.map((p) => [p.assetId, p.priceUsd]));
  const now = new Date();
  const rangeStart =
    timeframe === "ALL"
      ? user?.createdAt ?? (entries[0]?.createdAt ?? now)
      : new Date(now.getTime() - TIMEFRAME_MS[timeframe]);

  const POINTS = timeframe === "24H" ? 24 : timeframe === "7D" ? 14 : timeframe === "90D" ? 30 : 24;
  const span = Math.max(now.getTime() - rangeStart.getTime(), 1);
  const step = span / POINTS;

  const checkpoints: Date[] = [];
  for (let i = 0; i <= POINTS; i++) {
    checkpoints.push(new Date(rangeStart.getTime() + step * i));
  }

  return checkpoints.map((checkpoint) => {
    const balances = new Map<string, number>();
    for (const e of entries) {
      if (e.createdAt > checkpoint) break;
      // Only entries that affect the total accounted balance move the
      // valuation curve; reservations are excluded (see lib/ledger/core.ts).
      const signed =
        e.direction === "CREDIT" ? Number(e.amount) : -Number(e.amount);
      if (e.type === "WITHDRAWAL_RESERVE" || e.type === "WITHDRAWAL_RELEASE") continue;
      balances.set(e.assetId, (balances.get(e.assetId) ?? 0) + signed);
    }
    let valueUsd = 0;
    for (const [assetId, bal] of balances) {
      valueUsd += bal * (priceByAsset.get(assetId) ?? 0);
    }
    return { timestamp: checkpoint.toISOString(), valueUsd: Math.max(valueUsd, 0) };
  });
}
