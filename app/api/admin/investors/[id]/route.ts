import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { getPortfolioSummary } from "@/lib/portfolio";
import { adminInvestorStatusSchema } from "@/lib/validation/schemas";
import { recordAuditLog } from "@/lib/security/audit";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const investor = await prisma.user.findUnique({
      where: { id },
      include: {
        kycRecords: { orderBy: { createdAt: "desc" } },
        sanctionsScreenings: { orderBy: { screenedAt: "desc" } },
        balances: { include: { asset: true } },
        withdrawals: { orderBy: { requestedAt: "desc" }, take: 20, include: { asset: true } },
        deposits: { orderBy: { createdAt: "desc" }, take: 20, include: { asset: true } },
        securityEvents: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!investor) return jsonError("Investor not found.", 404);

    const portfolio = await getPortfolioSummary(id);
    return NextResponse.json({ investor, portfolio });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const admin = await requireAdmin();
    const { id } = await params;
    const body = adminInvestorStatusSchema.parse(await request.json());

    const updated = await prisma.user.update({
      where: { id },
      data: { status: body.status },
    });

    await recordAuditLog({
      actorUserId: admin.id,
      actorRole: admin.role,
      action: "INVESTOR_STATUS_CHANGED",
      targetType: "User",
      targetId: id,
      metadata: { newStatus: body.status, reason: body.reason },
    });

    return NextResponse.json({ investor: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
