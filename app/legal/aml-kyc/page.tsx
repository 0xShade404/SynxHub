import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { COMPLIANCE_EMAIL } from "@/lib/constants";

export const metadata: Metadata = { title: "AML / KYC Policy" };

export default function AmlKycPage() {
  return (
    <LegalPage
      title="AML / KYC Policy"
      updated="Draft — pending legal review"
      intro={
        <p className="rounded-md border border-warning-soft bg-warning-soft/60 p-4 text-foreground">
          This describes SynxHub&apos;s compliance architecture. It is not a substitute for a
          jurisdiction-specific AML program approved by qualified compliance counsel and, where
          required, a licensed compliance officer.
        </p>
      }
      sections={[
        {
          heading: "Identity verification",
          body: (
            <p>
              Before depositing funds, investors must complete identity verification (KYC)
              through our verification provider. Verification status is one of Not Started,
              Pending, Approved, Rejected, or Expired, and is visible to the investor and to
              SynxHub&apos;s compliance team.
            </p>
          ),
        },
        {
          heading: "Sanctions screening",
          body: (
            <p>
              Investors are screened against sanctions and watchlists as part of onboarding
              and on an ongoing basis. A flagged result restricts account activity pending
              compliance review.
            </p>
          ),
        },
        {
          heading: "Restricted jurisdictions",
          body: (
            <p>
              SynxHub does not onboard investors from jurisdictions subject to comprehensive
              sanctions programs. The current restricted-jurisdiction list is maintained by
              the compliance team and enforced at both KYC submission and ongoing monitoring.
            </p>
          ),
        },
        {
          heading: "Transaction monitoring",
          body: (
            <p>
              Deposits and withdrawals are monitored for suspicious patterns, including
              unusual velocity, large transactions to newly-added addresses, and other
              configurable risk signals. Flagged withdrawals are held for manual review with
              a clear internal reason recorded in the audit log.
            </p>
          ),
        },
        {
          heading: "Recordkeeping",
          body: (
            <p>
              KYC status, sanctions-screening results, and admin compliance actions are
              retained in an auditable record as required for regulatory recordkeeping.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: <p>Compliance questions: {COMPLIANCE_EMAIL}.</p>,
        },
      ]}
    />
  );
}
