import { Container } from "@/components/ui/Container";

const STEPS = [
  { title: "Create an account", body: "Sign up with Google or email in minutes." },
  { title: "Complete required verification", body: "Identity verification and screening run before deposits are enabled." },
  { title: "Deposit supported assets", body: "Send a supported asset to your unique, provider-issued deposit address." },
  { title: "Capital enters the strategy accounting system", body: "Deposits are recorded in an immutable, server-side ledger the instant they're confirmed on-chain." },
  { title: "The strategy allocates across the configured L1 portfolio", body: "Capital is allocated across the admin-configured Layer-1 asset universe." },
  { title: "Automated portfolio logic monitors allocations", body: "The strategy engine continuously compares current allocation to target allocation." },
  { title: "Rebalancing occurs according to predefined strategy rules", body: "Rebalancing trades are recorded as ledger events, fully attributable and auditable." },
  { title: "Investors monitor their portfolio through the dashboard", body: "Live balances, allocation, performance, and full transaction history." },
  { title: "Investors can request withdrawals", body: "Zero SynxHub platform fee. Network costs, when unavoidable, are shown transparently." },
];

export function StrategySteps() {
  return (
    <section id="strategy" className="border-b border-border py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">How SynxHub works</h2>
          <p className="mt-4 text-muted">
            A transparent, automated process from deposit to withdrawal. Automation manages
            allocation and rebalancing — it does not eliminate market risk.
          </p>
        </div>

        <ol className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-border bg-surface-raised p-5">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
