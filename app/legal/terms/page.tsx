import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_ENTITY_PLACEHOLDER, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="Draft — pending legal review"
      intro={
        <p className="rounded-md border border-warning-soft bg-warning-soft/60 p-4 text-foreground">
          This page is a structural placeholder, not a finished legal agreement. It must be
          reviewed and finalized by qualified legal counsel — covering the correct legal
          entity, governing law, arbitration/dispute terms, and jurisdiction-specific
          requirements — before {LEGAL_ENTITY_PLACEHOLDER.replace(/[[\]]/g, "")} accepts real
          investor funds.
        </p>
      }
      sections={[
        {
          heading: "1. Acceptance of terms",
          body: (
            <p>
              By creating an account or using SynxHub, you agree to these Terms of Service and
              our Privacy Policy, Risk Disclosure, and AML/KYC Policy. If you do not agree, do
              not use the platform.
            </p>
          ),
        },
        {
          heading: "2. Eligibility",
          body: (
            <p>
              You must be at least the age of majority in your jurisdiction and not a resident
              of a restricted jurisdiction (see AML/KYC Policy) to use SynxHub. You are
              responsible for ensuring your use of SynxHub complies with local law.
            </p>
          ),
        },
        {
          heading: "3. Description of service",
          body: (
            <p>
              SynxHub provides an automated investment strategy that allocates deposited
              digital assets across an admin-configured portfolio of Layer-1 networks.
              SynxHub does not provide investment, legal, or tax advice, and nothing on this
              platform is a guarantee of profit, income, or capital preservation.
            </p>
          ),
        },
        {
          heading: "4. No guaranteed returns",
          body: (
            <p>
              Digital assets are volatile. You may lose some or all of your capital.
              Automated allocation and rebalancing manage portfolio composition — they do
              not eliminate market risk, and past performance does not guarantee future
              results. See the Risk Disclosure for details.
            </p>
          ),
        },
        {
          heading: "5. Fees",
          body: (
            <p>
              SynxHub charges no platform fee on withdrawals. Where a blockchain network or
              third-party infrastructure charges an unavoidable network/processing cost,
              that cost is shown separately at the time of withdrawal. See the Withdrawal
              Policy for details.
            </p>
          ),
        },
        {
          heading: "6. Account security",
          body: (
            <p>
              You are responsible for maintaining the confidentiality of your account
              credentials and multi-factor authentication device. Notify us immediately of
              any unauthorized access.
            </p>
          ),
        },
        {
          heading: "7. Suspension and termination",
          body: (
            <p>
              We may suspend or restrict an account for suspected fraud, sanctions exposure,
              violation of these terms, or as required by law, with notice of the reason
              where legally permitted.
            </p>
          ),
        },
        {
          heading: "8. Limitation of liability",
          body: (
            <p>
              [Placeholder — liability limitation language to be drafted by counsel in
              compliance with applicable consumer-protection law.]
            </p>
          ),
        },
        {
          heading: "9. Governing law and disputes",
          body: <p>[Placeholder — governing law, venue, and dispute-resolution terms to be finalized by counsel.]</p>,
        },
        {
          heading: "10. Contact",
          body: <p>Questions about these terms can be sent to {SUPPORT_EMAIL}.</p>,
        },
      ]}
    />
  );
}
