import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { generateMfaEnrollment } from "@/lib/security/mfa";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

/**
 * Begins MFA enrollment: generates a new TOTP secret and QR code. The
 * secret is not persisted (and MFA is not enabled) until the user proves
 * possession via POST /api/security/mfa/enroll/confirm.
 */
export async function POST(request: NextRequest) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const user = await requireUser();
    const enrollment = await generateMfaEnrollment(user.email ?? user.id);
    return NextResponse.json({
      otpauthUrl: enrollment.otpauthUrl,
      qrCodeDataUrl: enrollment.qrCodeDataUrl,
      // Returned once, client-side, so the user can enter it manually or
      // save recovery codes. Never logged or stored in plaintext server-side.
      secretBase32: enrollment.secretBase32,
      encryptedSecret: enrollment.encryptedSecret,
      recoveryCodes: enrollment.recoveryCodes,
      encryptedRecoveryCodes: enrollment.encryptedRecoveryCodes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
