/**
 * Pricing provider integration point.
 *
 * PRICING_PROVIDER=fixture (default) reads the `currentPriceUsd` fixture
 * value stored on each `Asset` row (seeded/managed in the admin asset
 * console) and always reports it as DEMO DATA. Swap this module for a real
 * market-data integration (e.g. a licensed price feed) before accepting
 * real investor funds — do not fabricate live prices.
 */
import { prisma } from "@/lib/database/prisma";

export interface AssetPrice {
  assetId: string;
  symbol: string;
  priceUsd: number;
  isDemoData: boolean;
  source: string;
  updatedAt: Date;
}

export async function getAssetPrices(): Promise<AssetPrice[]> {
  const assets = await prisma.asset.findMany({ where: { enabled: true } });
  return assets.map((a) => ({
    assetId: a.id,
    symbol: a.symbol,
    priceUsd: Number(a.currentPriceUsd),
    isDemoData: a.isDemoData,
    source: a.priceSource,
    updatedAt: a.priceUpdatedAt,
  }));
}

export async function getAssetPrice(assetId: string): Promise<AssetPrice | null> {
  const a = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!a) return null;
  return {
    assetId: a.id,
    symbol: a.symbol,
    priceUsd: Number(a.currentPriceUsd),
    isDemoData: a.isDemoData,
    source: a.priceSource,
    updatedAt: a.priceUpdatedAt,
  };
}
