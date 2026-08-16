import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { RiskDisclosure } from "@/components/ui/RiskDisclosure";
import { Container } from "@/components/ui/Container";
import { SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--brand-soft),transparent_60%)]"
      />
      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">SynxHub</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {SITE_TAGLINE}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted text-balance">
            {SITE_DESCRIPTION}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="/signup" size="lg" className="w-full sm:w-auto">
              Create Account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </LinkButton>
            <LinkButton href="#strategy" size="lg" variant="secondary" className="w-full sm:w-auto">
              Explore Strategy
            </LinkButton>
          </div>

          <RiskDisclosure className="mx-auto mt-12 max-w-xl text-left" />
        </div>
      </Container>
    </section>
  );
}
