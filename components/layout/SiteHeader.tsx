import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "/#strategy", label: "Strategy" },
  { href: "/#assets", label: "Assets" },
  { href: "/transparency", label: "Transparency & Security" },
  { href: "/security", label: "Security" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-sm font-bold text-white"
          >
            S
          </span>
          {SITE_NAME}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LinkButton href="/login" variant="ghost" size="sm">
            Log in
          </LinkButton>
          <LinkButton href="/signup" variant="primary" size="sm">
            Create Account
          </LinkButton>
        </div>
      </Container>
    </header>
  );
}
