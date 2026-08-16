import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { verifyTotpCode } from "@/lib/security/mfa";
import { recordSecurityEvent, recordAuditLog } from "@/lib/security/audit";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

const schema = z.object({
  code: z.string().min(6).max(10),
  encryptedSecret: z.string().min(10),
  encryptedRecoveryCodes: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const user = await requireUser();
    const body = schema.parse(await request.json());

    const valid = verifyTotpCode(body.encryptedSecret, body.code);
    if (!valid) return jsonError("Invalid authentication code. Please try again.", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaSecretEnc: body.encryptedSecret,
        mfaRecoveryCodesEnc: body.encryptedRecoveryCodes,
      },
    });

    await Promise.all([
      recordSecurityEvent({ userId: user.id, type: "MFA_ENABLED", severity: "INFO" }),
      recordAuditLog({
        actorUserId: user.id,
        actorRole: user.role,
        action: "MFA_ENABLED",
        targetType: "User",
        targetId: user.id,
      }),
    ]);

    return NextResponse.json({ enabled: true });
  } catch (error) {
    return handleApiError(error);
  }
}
