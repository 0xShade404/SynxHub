import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { getKycProvider, isJurisdictionRestricted } from "@/lib/compliance/provider";
import { kycSubmitSchema } from "@/lib/validation/schemas";
import { recordAuditLog } from "@/lib/security/audit";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

export async function GET() {
  try {
    const user = await requireUser();
    const record = await prisma.kycRecord.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ record: record ?? { status: "NOT_STARTED" } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const user = await requireUser();
    const body = kycSubmitSchema.parse(await request.json());

    if (await isJurisdictionRestricted(body.country)) {
      return jsonError(
        "SynxHub is unable to onboard investors from this jurisdiction at this time.",
        403
      );
    }

    const provider = getKycProvider();
    const [verification, sanctions] = await Promise.all([
      provider.submitVerification({ userId: user.id, fullName: body.fullName, country: body.country, dateOfBirth: body.dateOfBirth }),
      provider.screenSanctions({ userId: user.id, fullName: body.fullName, country: body.country, dateOfBirth: body.dateOfBirth }),
    ]);

    const [record] = await prisma.$transaction([
      prisma.kycRecord.create({
        data: {
          userId: user.id,
          provider: verification.provider,
          status: verification.status,
          riskLevel: verification.riskLevel,
          country: body.country,
          externalReferenceId: verification.externalReferenceId,
          submittedAt: new Date(),
          reviewedAt: verification.status !== "PENDING" ? new Date() : null,
        },
      }),
      prisma.sanctionsScreening.create({
        data: {
          userId: user.id,
          provider: sanctions.provider,
          status: sanctions.status,
          metadata: sanctions.metadata as Prisma.InputJsonValue,
        },
      }),
      prisma.user.update({ where: { id: user.id }, data: { country: body.country } }),
    ]);

    await recordAuditLog({
      actorUserId: user.id,
      actorRole: user.role,
      action: "KYC_SUBMITTED",
      targetType: "KycRecord",
      targetId: record.id,
      metadata: { status: verification.status },
    });

    return NextResponse.json({ record });
  } catch (error) {
    return handleApiError(error);
  }
}
