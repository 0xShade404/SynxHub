import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { verifyTotpCode, verifyRecoveryCode } from "@/lib/security/mfa";
import { recordSecurityEvent, recordAuditLog } from "@/lib/security/audit";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

const schema = z.object({ code: z.string().min(6).max(10) });

export async function POST(request: NextRequest) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const user = await requireUser();
    const body = schema.parse(await request.json());

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!dbUser.mfaEnabled || !dbUser.mfaSecretEnc) {
      return jsonError("MFA is not currently enabled.", 409);
    }

    const validTotp = verifyTotpCode(dbUser.mfaSecretEnc, body.code);
    const validRecovery =
      !validTotp && dbUser.mfaRecoveryCodesEnc
        ? verifyRecoveryCode(dbUser.mfaRecoveryCodesEnc, body.code)
        : false;

    if (!validTotp && !validRecovery) {
      return jsonError("Invalid authentication code.", 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false, mfaSecretEnc: null, mfaRecoveryCodesEnc: null },
    });

    await Promise.all([
      recordSecurityEvent({ userId: user.id, type: "MFA_DISABLED", severity: "HIGH" }),
      recordAuditLog({
        actorUserId: user.id,
        actorRole: user.role,
        action: "MFA_DISABLED",
        targetType: "User",
        targetId: user.id,
      }),
    ]);

    return NextResponse.json({ enabled: false });
  } catch (error) {
    return handleApiError(error);
  }
}
