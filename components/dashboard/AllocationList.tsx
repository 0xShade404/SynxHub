import { formatUsd } from "@/lib/utils";

interface AllocationItem {
  assetId: string;
  symbol: string;
  name: string;
  valueUsd: number;
  weightPercent: number;
}

const BAR_COLORS = ["var(--brand)", "var(--accent)", "#8794e8", "#4bcf94", "#e0a542", "#ef6674", "#2fc4b0", "#97a1b3"];

export function AllocationList({ allocation }: { allocation: AllocationItem[] }) {
  if (allocation.length === 0) {
    return <p className="text-sm text-muted">No allocated balance yet — make a deposit to get started.</p>;
  }

  return (
    <ul className="space-y-3">
      {allocation.map((item, i) => (
        <li key={item.assetId}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {item.symbol} <span className="font-normal text-muted">— {item.name}</span>
            </span>
            <span className="tabular-nums text-muted">
              {formatUsd(item.valueUsd)} · {item.weightPercent.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(item.weightPercent, 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
