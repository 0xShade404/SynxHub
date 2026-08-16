/**
 * Custody / wallet provider integration layer — deposit side.
 *
 * Deposit addresses must never be generated or exposed using insecure
 * frontend logic or ad-hoc backend code. All address issuance goes through
 * this interface. `MockCustodyProvider` deterministically derives a
 * clearly-labeled placeholder address for local development so the deposit
 * UI is fully exercisable without real custody credentials.
 *
 * To go live: implement `CustodyDepositProvider` against a real custody /
 * wallet-as-a-service vendor (e.g. Fireblocks, BitGo, Copper, Anchorage)
 * selected via CUSTODY_PROVIDER, and have the integration reviewed by
 * security before it can receive real investor funds.
 */
import crypto from "crypto";

export interface CustodyDepositProvider {
  readonly name: string;
  generateDepositAddress(params: {
    userId: string;
    assetSymbol: string;
    network: string;
  }): Promise<{ address: string; provider: string }>;
}

class MockCustodyDepositProvider implements CustodyDepositProvider {
  readonly name = "mock-custody";

  async generateDepositAddress(params: {
    userId: string;
    assetSymbol: string;
    network: string;
  }): Promise<{ address: string; provider: string }> {
    const hash = crypto
      .createHash("sha256")
      .update(`${params.userId}:${params.assetSymbol}:${params.network}`)
      .digest("hex");

    // Clearly-fake, deterministic placeholder address — never a real
    // spendable on-chain address. Prefixed so it can never be mistaken for
    // one in demo/dev environments.
    const address = `demo1${hash.slice(0, 34)}`;
    return { address, provider: this.name };
  }
}

export function getCustodyDepositProvider(): CustodyDepositProvider {
  const provider = process.env.CUSTODY_PROVIDER ?? "mock";
  if (provider === "mock") return new MockCustodyDepositProvider();
  throw new Error(
    `CUSTODY_PROVIDER="${provider}" is not implemented. Add a real custody integration in lib/deposits/provider.ts.`
  );
}
