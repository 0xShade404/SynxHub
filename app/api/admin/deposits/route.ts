import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { handleApiError } from "@/lib/api/response";
import type { DepositStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: DepositStatus[] = ["AWAITING_FUNDS", "CONFIRMING", "COMPLETED", "FAILED"];

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const statusParam = request.nextUrl.searchParams.get("status");
    const status = VALID_STATUSES.find((s) => s === statusParam);

    const deposits = await prisma.deposit.findMany({
      where: status ? { status } : {},
      include: {
        asset: { select: { symbol: true, network: true } },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ deposits });
  } catch (error) {
    return handleApiError(error);
  }
}
