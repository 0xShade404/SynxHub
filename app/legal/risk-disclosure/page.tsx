import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { RISK_DISCLOSURE_LONG } from "@/lib/constants";

export const metadata: Metadata = { title: "Risk Disclosure" };

export default function RiskDisclosurePage() {
  return (
    <LegalPage
      title="Risk Disclosure"
      updated="Draft — pending legal review"
      intro={<p className="font-medium text-foreground">{RISK_DISCLOSURE_LONG}</p>}
      sections={[
        {
          heading: "Market risk",
          body: (
            <p>
              Digital asset prices are highly volatile and can move sharply in either
              direction, including to zero. SynxHub&apos;s automated allocation and
              rebalancing manage portfolio composition according to configured rules — they
              do not predict prices, hedge market risk, or guarantee any outcome.
            </p>
          ),
        },
        {
          heading: "No guaranteed returns",
          body: (
            <p>
              SynxHub does not offer guaranteed ROI, guaranteed profits, risk-free
              investing, guaranteed returns, or guaranteed capital protection. Any
              historical or illustrative performance shown reflects methodology described on
              the Transparency & Security page and is not a projection of future results.
            </p>
          ),
        },
        {
          heading: "Liquidity and withdrawal risk",
          body: (
            <p>
              While SynxHub does not impose artificial withdrawal minimums or maximums,
              withdrawals depend on underlying blockchain network conditions and, where
              applicable, security review — both of which can affect processing time.
            </p>
          ),
        },
        {
          heading: "Technology and operational risk",
          body: (
            <p>
              Smart contract, custody-provider, and infrastructure risk are inherent to any
              digital asset platform. SynxHub applies the security controls described on the
              Security page but cannot guarantee protection against every possible attack or
              failure.
            </p>
          ),
        },
        {
          heading: "Regulatory risk",
          body: (
            <p>
              Digital asset regulation is evolving and varies by jurisdiction. Regulatory
              action could affect SynxHub&apos;s ability to operate in your jurisdiction or
              affect the value or transferability of supported assets.
            </p>
          ),
        },
        {
          heading: "Your responsibility",
          body: (
            <p>
              Only invest capital you can afford to lose. This disclosure does not describe
              every risk associated with digital assets; consult independent financial and
              legal advice before investing.
            </p>
          ),
        },
      ]}
    />
  );
}
