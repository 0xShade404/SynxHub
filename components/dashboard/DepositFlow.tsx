"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface AssetOption {
  id: string;
  symbol: string;
  name: string;
  network: string;
  depositEnabled: boolean;
}

const DEV_TOOLS_ENABLED = process.env.NODE_ENV !== "production";

export function DepositFlow({ assets }: { assets: AssetOption[] }) {
  const depositable = assets.filter((a) => a.depositEnabled);
  const [assetId, setAssetId] = useState(depositable[0]?.id ?? "");
  const [address, setAddress] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simAmount, setSimAmount] = useState("0.5");
  const [simStatus, setSimStatus] = useState<string | null>(null);

  const selectedAsset = depositable.find((a) => a.id === assetId);

  async function generateAddress() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deposits/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to generate a deposit address.");
        return;
      }
      setAddress(data.depositAddress.address);
      setQrCodeDataUrl(data.qrCodeDataUrl);
    } finally {
      setLoading(false);
    }
  }

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function simulateDeposit() {
    setSimStatus("Submitting...");
    const res = await fetch("/api/dev/deposits/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, amount: simAmount }),
    });
    const data = await res.json();
    setSimStatus(res.ok ? `Simulated deposit completed (${data.deposit.confirmations} confirmations).` : data.error);
  }

  return (
    <div className="space-y-6">
      <Card>
        <label htmlFor="asset" className="block text-sm font-medium">
          Asset
        </label>
        <select
          id="asset"
          value={assetId}
          onChange={(e) => {
            setAssetId(e.target.value);
            setAddress(null);
            setQrCodeDataUrl(null);
          }}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {depositable.map((a) => (
            <option key={a.id} value={a.id}>
              {a.symbol} — {a.name} ({a.network})
            </option>
          ))}
        </select>

        {selectedAsset && (
          <p className="mt-2 text-xs text-muted">
            Network: <span className="font-medium text-foreground">{selectedAsset.network}</span>. Only send{" "}
            {selectedAsset.symbol} on this network — sending on an incompatible network can result in
            permanent loss of funds.
          </p>
        )}

        {!address ? (
          <Button className="mt-4" onClick={generateAddress} disabled={loading || !assetId}>
            {loading ? "Generating…" : "Generate deposit address"}
          </Button>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6 sm:flex-row">
            {qrCodeDataUrl && (
              <Image
                src={qrCodeDataUrl}
                alt={`QR code for deposit address ${address}`}
                width={140}
                height={140}
                className="rounded-md border border-border bg-white p-2"
                unoptimized
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Deposit address</p>
              <p className="mt-1 break-all font-mono text-sm">{address}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={copyAddress}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy address"}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
      </Card>

      {DEV_TOOLS_ENABLED && address && (
        <Card className="border-dashed">
          <div className="flex items-center gap-2">
            <Badge tone="warning">DEV TOOL</Badge>
            <p className="text-sm font-medium">Simulate an incoming deposit</p>
          </div>
          <p className="mt-1 text-xs text-muted">
            No real custody provider is connected in this environment. Use this to exercise the
            full deposit → confirmation → ledger flow locally.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              aria-label="Simulated deposit amount"
              className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <Button size="sm" variant="secondary" onClick={simulateDeposit}>
              Simulate deposit
            </Button>
          </div>
          {simStatus && <p className="mt-2 text-xs text-muted">{simStatus}</p>}
        </Card>
      )}
    </div>
  );
}
