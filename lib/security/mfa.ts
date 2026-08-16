import * as OTPAuth from "otpauth";
import crypto from "crypto";
import QRCode from "qrcode";
import { encryptSecret, decryptSecret } from "./crypto";

const ISSUER = "SynxHub";

export function generateTotpSecret(): OTPAuth.Secret {
  return new OTPAuth.Secret({ size: 20 });
}

export function buildTotp(secretBase32: string, accountLabel: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountLabel,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export async function generateMfaEnrollment(accountLabel: string) {
  const secret = generateTotpSecret();
  const totp = buildTotp(secret.base32, accountLabel);
  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  const recoveryCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(5).toString("hex")
  );
  return {
    secretBase32: secret.base32,
    encryptedSecret: encryptSecret(secret.base32),
    otpauthUrl,
    qrCodeDataUrl,
    recoveryCodes,
    encryptedRecoveryCodes: encryptSecret(JSON.stringify(recoveryCodes)),
  };
}

export function verifyTotpCode(encryptedSecret: string, code: string): boolean {
  const secretBase32 = decryptSecret(encryptedSecret);
  const totp = buildTotp(secretBase32, "verify");
  const delta = totp.validate({ token: code.trim(), window: 1 });
  return delta !== null;
}

export function verifyRecoveryCode(encryptedRecoveryCodes: string, code: string): boolean {
  const codes: string[] = JSON.parse(decryptSecret(encryptedRecoveryCodes));
  return codes.includes(code.trim().toLowerCase());
}
