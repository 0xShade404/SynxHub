import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { adminAssetUpdateSchema } from "@/lib/validation/schemas";
import { recordAuditLog } from "@/lib/security/audit";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const admin = await requireAdmin();
    const { id } = await params;
    const body = adminAssetUpdateSchema.parse(await request.json());

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        ...body,
        ...(body.currentPriceUsd !== undefined
          ? { currentPriceUsd: body.currentPriceUsd, priceUpdatedAt: new Date() }
          : {}),
      },
    });

    await recordAuditLog({
      actorUserId: admin.id,
      actorRole: admin.role,
      action: "ASSET_CONFIG_UPDATED",
      targetType: "Asset",
      targetId: id,
      metadata: body,
    });

    return NextResponse.json({ asset: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
