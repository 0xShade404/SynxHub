"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { truncateAddress } from "@/lib/utils";

interface AssetOption {
  id: string;
  symbol: string;
  network: string;
}

interface AllowlistEntry {
  id: string;
  address: string;
  label: string | null;
  asset: { symbol: string; network: string };
}

export function AllowlistManager({ assets, entries }: { assets: AssetOption[]; entries: AllowlistEntry[] }) {
  const router = useRouter();
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/user/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId, address, label: label || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to add address.");
        return;
      }
      setAddress("");
      setLabel("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal address allowlist</CardTitle>
      </CardHeader>
      <p className="text-sm text-muted">
        Optional: withdrawals to a first-time address are automatically flagged for
        additional review. Adding an address here marks it as recognized for future
        withdrawals.
      </p>

      {entries.length > 0 && (
        <ul className="mt-4 divide-y divide-border text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-mono text-xs">{truncateAddress(e.address, 8)}</p>
                <p className="text-xs text-muted">
                  {e.asset.symbol} · {e.asset.network} {e.label ? `· ${e.label}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="al-asset" className="block text-xs font-medium">Asset</label>
          <select
            id="al-asset"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="mt-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.symbol}</option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="al-address" className="block text-xs font-medium">Address</label>
          <input
            id="al-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-sm"
          />
        </div>
        <div>
          <label htmlFor="al-label" className="block text-xs font-medium">Label (optional)</label>
          <input
            id="al-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-1 w-32 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading || !address}>
          Add
        </Button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
