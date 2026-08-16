"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCrypto } from "@/lib/utils";

interface AssetOption {
  id: string;
  symbol: string;
  name: string;
  network: string;
  withdrawalEnabled: boolean;
}

interface BalanceMap {
  [assetId: string]: { available: number; symbol: string };
}

export function WithdrawalFlow({
  assets,
  balances,
  mfaEnabled,
  onSubmitted,
}: {
  assets: AssetOption[];
  balances: BalanceMap;
  mfaEnabled: boolean;
  onSubmitted?: () => void;
}) {
  const withdrawable = assets.filter((a) => a.withdrawalEnabled);
  const [assetId, setAssetId] = useState(withdrawable[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string } | null>(null);

  const selectedAsset = withdrawable.find((a) => a.id === assetId);
  const available = balances[assetId]?.available ?? 0;

  // SynxHub charges no platform withdrawal fee. A network cost would be
  // estimated here from the custody/signing provider before submission;
  // the mock provider used in this build reports zero.
  const networkFeeEstimate = 0;
  const expectedNet = useMemo(() => {
    const amt = Number(amount || 0);
    return Math.max(amt - networkFeeEstimate, 0);
  }, [amount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          destinationAddress: address,
          amount,
          mfaCode,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to submit withdrawal request.");
        return;
      }
      setResult({ status: data.withdrawal.status });
      setAddress("");
      setAmount("");
      setMfaCode("");
      setConfirmed(false);
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  }

  if (!mfaEnabled) {
    return (
      <Card className="flex items-start gap-3 border-warning-soft bg-warning-soft/40">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <div>
          <p className="font-medium">Multi-factor authentication required</p>
          <p className="mt-1 text-sm text-muted">
            For your security, MFA must be enabled before you can request a withdrawal. Set it
            up on the Security page.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="w-asset" className="block text-sm font-medium">
            1. Asset
          </label>
          <select
            id="w-asset"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {withdrawable.map((a) => (
              <option key={a.id} value={a.id}>
                {a.symbol} — {a.name} ({a.network})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">
            Available: {formatCrypto(available, selectedAsset?.symbol ?? "")}
          </p>
        </div>

        <div>
          <label htmlFor="w-address" className="block text-sm font-medium">
            2 & 3. Destination address ({selectedAsset?.network})
          </label>
          <input
            id="w-address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={`Enter a ${selectedAsset?.network ?? ""} address`}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted">
            Validated against the {selectedAsset?.network} address format on submission — double-check it matches the network above.
          </p>
        </div>

        <div>
          <label htmlFor="w-amount" className="block text-sm font-medium">
            4. Amount
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="w-amount"
              type="text"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <Button type="button" size="sm" variant="secondary" onClick={() => setAmount(String(available))}>
              Max
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">SynxHub platform fee</span>
            <span className="font-medium text-success">$0 / 0 {selectedAsset?.symbol}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted">Network / third-party processing cost</span>
            <span className="font-medium">{formatCrypto(networkFeeEstimate, selectedAsset?.symbol ?? "")}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
            <span>You will receive</span>
            <span>{formatCrypto(expectedNet, selectedAsset?.symbol ?? "")}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input
            id="w-confirm"
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <label htmlFor="w-confirm" className="text-sm text-muted">
            I confirm the destination address and network are correct. Withdrawals to an
            incorrect address or network cannot be reversed.
          </label>
        </div>

        <div>
          <label htmlFor="w-mfa" className="block text-sm font-medium">
            5. Authentication code
          </label>
          <input
            id="w-mfa"
            required
            inputMode="numeric"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="6-digit code from your authenticator app"
            className="mt-1 w-full max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {result && (
          <p role="status" className="text-sm text-success">
            Withdrawal request submitted — status: {result.status.replace(/_/g, " ")}.
          </p>
        )}

        <Button type="submit" disabled={!confirmed || submitting || !address || !amount}>
          {submitting ? "Submitting…" : "Request withdrawal"}
        </Button>
      </form>
    </Card>
  );
}
