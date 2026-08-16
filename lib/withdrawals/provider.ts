/**
 * Custody / signing provider integration layer — withdrawal side.
 *
 * The frontend never issues a blockchain withdrawal directly. A withdrawal
 * request only ever reaches this provider after it has passed validation,
 * risk checks, MFA confirmation, and (if flagged) admin review in
 * lib/withdrawals/index.ts. `MockSigningProvider` simulates a
 * provider that accepts the request and settles it shortly after — no real
 * funds move. Swap in a real custody/signing integration (e.g. Fireblocks,
 * BitGo, Copper) before production and have it reviewed by security.
 */
import crypto from "crypto";

export interface SubmitWithdrawalParams {
  withdrawalId: string;
  assetSymbol: string;
  network: string;
  destinationAddress: string;
  amount: string;
}

export interface SigningProvider {
  readonly name: string;
  submitWithdrawal(params: SubmitWithdrawalParams): Promise<{ txHash: string }>;
}

class MockSigningProvider implements SigningProvider {
  readonly name = "mock-custody-signer";

  async submitWithdrawal(params: SubmitWithdrawalParams): Promise<{ txHash: string }> {
    const txHash = `demo_tx_${crypto
      .createHash("sha256")
      .update(`${params.withdrawalId}:${Date.now()}`)
      .digest("hex")
      .slice(0, 40)}`;
    return { txHash };
  }
}

export function getSigningProvider(): SigningProvider {
  const provider = process.env.CUSTODY_PROVIDER ?? "mock";
  if (provider === "mock") return new MockSigningProvider();
  throw new Error(
    `CUSTODY_PROVIDER="${provider}" is not implemented. Add a real signing integration in lib/withdrawals/provider.ts.`
  );
}
