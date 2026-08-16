import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="Draft — pending legal review"
      sections={[
        {
          heading: "Essential cookies",
          body: (
            <p>
              SynxHub uses a single essential, HTTP-only session cookie to keep you signed
              in securely. This cookie is required for the platform to function and cannot
              be disabled while remaining signed in.
            </p>
          ),
        },
        {
          heading: "No advertising or tracking cookies",
          body: <p>SynxHub does not use third-party advertising or cross-site tracking cookies.</p>,
        },
        {
          heading: "Analytics",
          body: (
            <p>
              If analytics are enabled in a given deployment, they are configured to be
              privacy-respecting and disclosed here before use. [Placeholder — update if/when
              an analytics provider is integrated.]
            </p>
          ),
        },
      ]}
    />
  );
}
