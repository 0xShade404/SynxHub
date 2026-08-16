import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { formatUsd } from "@/lib/utils";

interface AssetItem {
  id: string;
  symbol: string;
  name: string;
  network: string;
  targetAllocationBps: number;
  currentPriceUsd: number | string;
  isDemoData: boolean;
}

export function AssetGrid({ assets }: { assets: AssetItem[] }) {
  return (
    <section id="assets" className="border-b border-border bg-surface py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">The asset universe</h2>
          <p className="mt-4 text-muted">
            An admin-configurable portfolio of Layer-1 networks. Allocations and enabled
            assets can change as the strategy evolves.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
          {assets.map((asset) => (
            <div key={asset.id} className="rounded-xl border border-border bg-surface-raised p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {asset.network}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{asset.symbol}</p>
                  <p className="text-sm text-muted">{asset.name}</p>
                </div>
                <Badge tone="brand">{(asset.targetAllocationBps / 100).toFixed(1)}%</Badge>
              </div>
              <p className="mt-4 text-sm tabular-nums text-muted">
                {formatUsd(Number(asset.currentPriceUsd))}
                {asset.isDemoData && (
                  <span className="ml-2 text-xs font-semibold text-warning">DEMO DATA</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
