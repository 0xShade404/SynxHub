import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/constants";
import { Container } from "@/components/ui/Container";
import { DemoBanner } from "@/components/ui/DemoBanner";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <DemoBanner />
      <div className="flex min-h-screen flex-col justify-center bg-surface py-12">
        <Container className="max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 text-lg font-semibold">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-white"
            >
              S
            </span>
            {SITE_NAME}
          </Link>

          <main id="main-content" className="mt-8 rounded-xl border border-border bg-surface-raised p-8">
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </main>

          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </Container>
      </div>
    </>
  );
}
