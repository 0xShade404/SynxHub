import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/** Public: the admin-configured, enabled asset universe. */
export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        symbol: true,
        name: true,
        network: true,
        iconUrl: true,
        targetAllocationBps: true,
        depositEnabled: true,
        withdrawalEnabled: true,
        tradingEnabled: true,
        currentPriceUsd: true,
        priceSource: true,
        priceUpdatedAt: true,
        isDemoData: true,
      },
    });
    return NextResponse.json({ assets });
  } catch (error) {
    return handleApiError(error);
  }
}
