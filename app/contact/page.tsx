import type { Metadata } from "next";
import { Mail, ShieldAlert, LifeBuoy } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/ui/Container";
import { SUPPORT_EMAIL, COMPLIANCE_EMAIL } from "@/lib/constants";

export const metadata: Metadata = { title: "Contact" };

const CHANNELS = [
  { icon: LifeBuoy, title: "General support", email: SUPPORT_EMAIL, body: "Account access, deposits, withdrawals, and platform questions." },
  { icon: ShieldAlert, title: "Compliance", email: COMPLIANCE_EMAIL, body: "KYC/AML status, verification issues, and jurisdiction questions." },
  { icon: Mail, title: "Security", email: "security@synxhub.example", body: "Report a suspected vulnerability or account compromise." },
];

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Container className="max-w-3xl py-16">
          <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
          <p className="mt-4 text-muted">
            [Placeholder — replace with the finalized legal entity name, registered address,
            and support hours before launch.]
          </p>

          <div className="mt-10 space-y-4">
            {CHANNELS.map((channel) => (
              <div key={channel.title} className="flex items-start gap-4 rounded-xl border border-border bg-surface-raised p-5">
                <channel.icon className="mt-0.5 h-5 w-5 text-brand" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold">{channel.title}</h2>
                  <p className="mt-1 text-sm text-muted">{channel.body}</p>
                  <a href={`mailto:${channel.email}`} className="mt-1 inline-block text-sm text-brand hover:underline">
                    {channel.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
