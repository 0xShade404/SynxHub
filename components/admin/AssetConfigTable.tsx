"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

interface AssetRow {
  id: string;
  symbol: string;
  name: string;
  network: string;
  enabled: boolean;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  tradingEnabled: boolean;
  targetAllocationBps: number;
  currentPriceUsd: string;
  isDemoData: boolean;
}

const TOGGLE_FIELDS = [
  { key: "enabled", label: "Enabled" },
  { key: "depositEnabled", label: "Deposits" },
  { key: "withdrawalEnabled", label: "Withdrawals" },
  { key: "tradingEnabled", label: "Trading" },
] as const;

export function AssetConfigTable({ assets }: { assets: AssetRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function updateAsset(id: string, patch: Record<string, unknown>) {
    setPending(id);
    try {
      await fetch(`/api/admin/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const totalAllocation = assets.reduce((sum, a) => sum + a.targetAllocationBps, 0);

  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Total target allocation: {(totalAllocation / 100).toFixed(1)}%
        {totalAllocation !== 10000 && (
          <span className="ml-2 font-medium text-warning">Does not sum to 100% — review before relying on this for live rebalancing.</span>
        )}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="py-2 pr-4">Asset</th>
              <th scope="col" className="py-2 pr-4">Price (USD)</th>
              <th scope="col" className="py-2 pr-4">Allocation %</th>
              {TOGGLE_FIELDS.map((f) => (
                <th scope="col" key={f.key} className="py-2 pr-4">{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="py-3 pr-4">
                  <p className="font-medium">{a.symbol}</p>
                  <p className="text-xs text-muted">{a.name} · {a.network}</p>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-1">
                    <span className="tabular-nums">${Number(a.currentPriceUsd).toLocaleString()}</span>
                    {a.isDemoData && <Badge tone="warning">DEMO</Badge>}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    defaultValue={a.targetAllocationBps / 100}
                    disabled={pending === a.id}
                    onBlur={(e) => {
                      const bps = Math.round(Number(e.target.value) * 100);
                      if (bps !== a.targetAllocationBps) updateAsset(a.id, { targetAllocationBps: bps });
                    }}
                    className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums"
                    aria-label={`Target allocation percent for ${a.symbol}`}
                  />
                </td>
                {TOGGLE_FIELDS.map((f) => (
                  <td key={f.key} className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={a[f.key]}
                      disabled={pending === a.id}
                      onChange={(e) => updateAsset(a.id, { [f.key]: e.target.checked })}
                      aria-label={`${f.label} for ${a.symbol}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
