import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { allowlistAddressSchema } from "@/lib/validation/schemas";
import { isValidAddressForNetwork } from "@/lib/validation/address";
import { recordSecurityEvent } from "@/lib/security/audit";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

export async function GET() {
  try {
    const user = await requireUser();
    const addresses = await prisma.allowlistAddress.findMany({
      where: { userId: user.id },
      include: { asset: { select: { symbol: true, network: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ addresses });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Adding a withdrawal address to the allowlist takes effect immediately in
 * this build (documented as a configurable control — see SECURITY.md); a
 * production deployment may add a cooling-off period or email confirmation
 * before a newly-added address is trusted.
 */
export async function POST(request: NextRequest) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const user = await requireUser();
    const body = allowlistAddressSchema.parse(await request.json());

    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: body.assetId } });
    if (!isValidAddressForNetwork(body.address, asset.network)) {
      return jsonError("Address is not valid for this network.", 422);
    }

    const entry = await prisma.allowlistAddress.upsert({
      where: { userId_assetId_address: { userId: user.id, assetId: body.assetId, address: body.address } },
      update: { label: body.label, status: "APPROVED", approvedAt: new Date() },
      create: {
        userId: user.id,
        assetId: body.assetId,
        network: asset.network,
        address: body.address,
        label: body.label,
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    await recordSecurityEvent({
      userId: user.id,
      type: "ALLOWLIST_ADDRESS_ADDED",
      severity: "MEDIUM",
      metadata: { assetId: body.assetId, address: body.address },
    });

    return NextResponse.json({ address: entry });
  } catch (error) {
    return handleApiError(error);
  }
}
