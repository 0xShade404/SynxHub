import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { listWithdrawals, requestWithdrawal, WithdrawalValidationError } from "@/lib/withdrawals";
import { verifyTotpCode } from "@/lib/security/mfa";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { withdrawalRequestSchema } from "@/lib/validation/schemas";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";
import { recordSecurityEvent } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const withdrawals = await listWithdrawals(user.id);
    return NextResponse.json({ withdrawals });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const user = await requireUser();

    const rate = checkRateLimit(
      `withdrawal:${user.id}`,
      RATE_LIMITS.WITHDRAWAL_REQUEST.limit,
      RATE_LIMITS.WITHDRAWAL_REQUEST.windowMs
    );
    if (!rate.allowed) {
      await recordSecurityEvent({
        userId: user.id,
        type: "RATE_LIMITED",
        severity: "MEDIUM",
        metadata: { route: "withdrawals:POST" },
      });
      return jsonError("Too many withdrawal requests. Please try again later.", 429);
    }

    const body = withdrawalRequestSchema.parse(await request.json());

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!dbUser.mfaEnabled || !dbUser.mfaSecretEnc) {
      return jsonError(
        "Multi-factor authentication must be enabled before requesting a withdrawal. Set it up in Security settings.",
        409
      );
    }

    const mfaValid = verifyTotpCode(dbUser.mfaSecretEnc, body.mfaCode);
    if (!mfaValid) {
      await recordSecurityEvent({
        userId: user.id,
        type: "MFA_FAILED",
        severity: "MEDIUM",
        metadata: { context: "withdrawal_request" },
      });
      return jsonError("Invalid authentication code.", 401);
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const withdrawal = await requestWithdrawal({
      userId: user.id,
      assetId: body.assetId,
      destinationAddress: body.destinationAddress,
      amount: body.amount,
      idempotencyKey: body.idempotencyKey,
      mfaVerified: true,
      ipAddress: forwardedFor?.split(",")[0]?.trim(),
      deviceFingerprint: request.headers.get("x-device-fingerprint") ?? undefined,
    });

    return NextResponse.json({ withdrawal });
  } catch (error) {
    if (error instanceof WithdrawalValidationError) {
      return jsonError(error.message, 422);
    }
    return handleApiError(error);
  }
}
