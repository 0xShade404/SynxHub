/**
 * KYC / AML provider integration layer.
 *
 * This defines the contract SynxHub uses for identity verification and
 * sanctions screening. `MockKycProvider` is a safe development stand-in —
 * it never performs real verification and every record it produces is
 * clearly tagged so it can never be mistaken for a completed real check.
 *
 * To go live: implement `KycProvider` against a real, compliant vendor
 * (e.g. Sumsub, Persona, Onfido, ComplyAdvantage) and select it via the
 * KYC_PROVIDER environment variable. Do not accept real investor funds
 * until that integration has been reviewed by legal/compliance counsel for
 * your operating jurisdiction(s).
 */

export type KycStatus = "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type SanctionsStatus = "CLEAR" | "FLAGGED" | "PENDING";

export interface KycSubmission {
  userId: string;
  fullName: string;
  country: string;
  dateOfBirth: string;
}

export interface KycResult {
  provider: string;
  status: KycStatus;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  externalReferenceId: string;
}

export interface SanctionsResult {
  provider: string;
  status: SanctionsStatus;
  metadata: Record<string, unknown>;
}

export interface KycProvider {
  readonly name: string;
  submitVerification(submission: KycSubmission): Promise<KycResult>;
  screenSanctions(submission: KycSubmission): Promise<SanctionsResult>;
}

class MockKycProvider implements KycProvider {
  readonly name = "mock-kyc";

  async submitVerification(submission: KycSubmission): Promise<KycResult> {
    // Deterministic, clearly-fake decisioning for local development and
    // demos only. Never performs real identity verification.
    const restrictedCountries = ["KP", "IR", "SY", "CU"];
    const isRestricted = restrictedCountries.includes(submission.country.toUpperCase());
    return {
      provider: this.name,
      status: isRestricted ? "REJECTED" : "APPROVED",
      riskLevel: isRestricted ? "HIGH" : "LOW",
      externalReferenceId: `mock_kyc_${Date.now()}`,
    };
  }

  async screenSanctions(submission: KycSubmission): Promise<SanctionsResult> {
    const restrictedCountries = ["KP", "IR", "SY", "CU"];
    const flagged = restrictedCountries.includes(submission.country.toUpperCase());
    return {
      provider: this.name,
      status: flagged ? "FLAGGED" : "CLEAR",
      metadata: { note: "DEMO DATA — mock sanctions screening, not a real check." },
    };
  }
}

export function getKycProvider(): KycProvider {
  const provider = process.env.KYC_PROVIDER ?? "mock";
  if (provider === "mock") return new MockKycProvider();
  throw new Error(
    `KYC_PROVIDER="${provider}" is not implemented. Add a real provider integration in lib/compliance/provider.ts.`
  );
}

export async function isJurisdictionRestricted(countryCode: string): Promise<boolean> {
  const { prisma } = await import("@/lib/database/prisma");
  const record = await prisma.restrictedJurisdiction.findUnique({
    where: { countryCode: countryCode.toUpperCase() },
  });
  return Boolean(record?.enabled);
}
