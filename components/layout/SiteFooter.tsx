import Link from "next/link";
import { SITE_NAME, RISK_DISCLOSURE_LONG } from "@/lib/constants";
import { Container } from "@/components/ui/Container";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { href: "/#strategy", label: "How it works" },
      { href: "/#assets", label: "Supported assets" },
      { href: "/transparency", label: "Transparency & Security" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/risk-disclosure", label: "Risk Disclosure" },
      { href: "/legal/aml-kyc", label: "AML / KYC Policy" },
      { href: "/legal/cookies", label: "Cookie Policy" },
      { href: "/legal/withdrawal-policy", label: "Withdrawal Policy" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/security", label: "Security" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {SITE_NAME}
            </Link>
            <p className="mt-3 text-sm text-muted">
              Automated crypto investing, built for precision.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted">{RISK_DISCLOSURE_LONG}</p>

        <p className="mt-6 text-xs text-muted">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved. {SITE_NAME} is not a bank.
          Digital assets are not covered by FDIC or SIPC protection.
        </p>
      </Container>
    </footer>
  );
}
