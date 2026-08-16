import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { handleApiError } from "@/lib/api/response";
import type { WithdrawalStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: WithdrawalStatus[] = [
  "PENDING_CONFIRMATION",
  "PENDING_REVIEW",
  "APPROVED",
  "PROCESSING",
  "COMPLETED",
  "REJECTED",
  "FAILED",
  "ON_HOLD",
];

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const statusParam = request.nextUrl.searchParams.get("status");
    const status = VALID_STATUSES.find((s) => s === statusParam);

    const withdrawals = await prisma.withdrawal.findMany({
      where: status ? { status } : {},
      include: {
        asset: { select: { symbol: true, network: true } },
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { requestedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ withdrawals });
  } catch (error) {
    return handleApiError(error);
  }
}
