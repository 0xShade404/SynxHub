import { DEMO_MODE } from "@/lib/constants";

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="w-full bg-brand-strong px-4 py-2 text-center text-xs font-semibold tracking-wide text-white">
      DEMO ENVIRONMENT — NO REAL FUNDS. All balances, prices, and transactions on this
      site are simulated fixture data.
    </div>
  );
}
