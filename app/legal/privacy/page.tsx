import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="Draft — pending legal review"
      intro={
        <p className="rounded-md border border-warning-soft bg-warning-soft/60 p-4 text-foreground">
          This is a structural placeholder describing what we actually collect and why. A
          qualified privacy counsel should review this against applicable law (e.g. GDPR,
          CCPA) for your operating jurisdictions before launch.
        </p>
      }
      sections={[
        {
          heading: "Information we collect",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Account information: name, email, and authentication data (via Google OAuth or, in development, a hashed password).</li>
              <li>Identity verification data submitted for KYC/AML purposes, processed by our verification provider.</li>
              <li>Transaction and ledger data: deposits, withdrawals, balances, and portfolio activity.</li>
              <li>Security data: login events, device fingerprints, IP addresses, and MFA status.</li>
            </ul>
          ),
        },
        {
          heading: "How we use information",
          body: (
            <p>
              To operate your account, process deposits and withdrawals, meet legal and
              regulatory obligations (including AML/KYC and sanctions screening), detect and
              prevent fraud, and communicate with you about your account.
            </p>
          ),
        },
        {
          heading: "Data we never collect",
          body: (
            <p>
              SynxHub never asks for and never stores your wallet private keys or seed
              phrases. Custody operations are handled by an integrated custody provider,
              never by storing keys in our database or application code.
            </p>
          ),
        },
        {
          heading: "Sharing",
          body: (
            <p>
              We share data with service providers strictly as needed to operate the
              platform — e.g. our identity-verification and custody providers — and with
              regulators or law enforcement where legally required.
            </p>
          ),
        },
        {
          heading: "Data retention and security",
          body: (
            <p>
              Data is retained as required for legal, regulatory, and accounting purposes.
              Sensitive fields (e.g. MFA secrets) are encrypted at rest. See our Security
              page for platform-wide controls.
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: <p>[Placeholder — access, correction, deletion, and portability rights to be finalized per applicable jurisdiction.]</p>,
        },
        {
          heading: "Contact",
          body: <p>Privacy questions: {SUPPORT_EMAIL}.</p>,
        },
      ]}
    />
  );
}
