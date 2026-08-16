import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Withdrawal Policy" };

export default function WithdrawalPolicyPage() {
  return (
    <LegalPage
      title="Withdrawal Policy"
      updated="Draft — pending legal review"
      sections={[
        {
          heading: "SynxHub platform fee: $0",
          body: (
            <p>
              SynxHub charges no platform fee on withdrawals. There is no artificial minimum
              or maximum withdrawal amount.
            </p>
          ),
        },
        {
          heading: "Network / third-party processing cost",
          body: (
            <p>
              Where a blockchain network or third-party infrastructure charges an
              unavoidable fee to process a transaction, that cost is calculated and shown
              separately from the SynxHub platform fee before you confirm a withdrawal.
              SynxHub does not mark this cost up. A withdrawal is never described as
              &quot;free&quot; when an on-chain cost must actually be paid.
            </p>
          ),
        },
        {
          heading: "Processing steps",
          body: (
            <ol className="list-decimal space-y-1 pl-5">
              <li>Select asset, network, and destination address.</li>
              <li>Address and network compatibility are validated.</li>
              <li>Enter an amount; available balance and estimated network cost are shown.</li>
              <li>Confirm the request and complete multi-factor authentication.</li>
              <li>Automated risk checks run; the request is reserved against your ledger balance.</li>
              <li>Most requests process automatically. Requests meeting the risk-review threshold are held for admin review, with the reason recorded.</li>
              <li>Once submitted on-chain, the transaction hash is shown and the ledger is reconciled on confirmation.</li>
            </ol>
          ),
        },
        {
          heading: "Security holds",
          body: (
            <p>
              A withdrawal may be placed on a temporary hold for reasons such as a new
              destination address, a new device, unusual velocity, or a large amount. Every
              hold has a specific internal reason visible to SynxHub&apos;s compliance and
              support teams, and status is reflected in your dashboard.
            </p>
          ),
        },
      ]}
    />
  );
}
