"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatCrypto, truncateAddress, cn } from "@/lib/utils";

const TABS = [
  { value: "PENDING_REVIEW", label: "Flagged" },
  { value: "PENDING_CONFIRMATION", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REJECTED", label: "Rejected" },
];

interface WithdrawalItem {
  id: string;
  amount: string;
  destinationAddress: string;
  status: string;
  riskScore: number;
  riskFlags: string[] | null;
  holdReason: string | null;
  requestedAt: string;
  asset: { symbol: string; network: string };
  user: { email: string; name: string | null };
}

export function WithdrawalQueue({ initialStatus }: { initialStatus?: string }) {
  const [status, setStatus] = useState(initialStatus ?? "PENDING_REVIEW");
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${status}`);
      const data = await res.json();
      setItems(data.withdrawals ?? []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id: string, decision: "APPROVE" | "REJECT") {
    setActioning(id);
    try {
      await fetch(`/api/admin/withdrawals/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await load();
    } finally {
      setActioning(null);
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="Withdrawal status" className="flex flex-wrap gap-1 rounded-lg border border-border p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={status === tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium",
              status === tab.value ? "bg-brand text-white" : "text-muted hover:bg-surface"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <p className="py-6 text-sm text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-sm text-muted">No withdrawals in this queue.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4">Investor</th>
                <th scope="col" className="py-2 pr-4">Amount</th>
                <th scope="col" className="py-2 pr-4">Destination</th>
                <th scope="col" className="py-2 pr-4">Risk</th>
                <th scope="col" className="py-2 pr-4">Requested</th>
                {status === "PENDING_REVIEW" && <th scope="col" className="py-2 pr-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id} className="border-t border-border align-top">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{w.user.name ?? w.user.email}</p>
                    <p className="text-xs text-muted">{w.user.email}</p>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{formatCrypto(Number(w.amount), w.asset.symbol)}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{truncateAddress(w.destinationAddress)}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={w.riskScore >= 50 ? "danger" : w.riskScore >= 25 ? "warning" : "neutral"}>
                      Score {w.riskScore}
                    </Badge>
                    {w.holdReason && <p className="mt-1 max-w-[220px] text-xs text-muted">{w.holdReason}</p>}
                  </td>
                  <td className="py-3 pr-4 text-muted">{formatDate(w.requestedAt)}</td>
                  {status === "PENDING_REVIEW" && (
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => review(w.id, "APPROVE")} disabled={actioning === w.id}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => review(w.id, "REJECT")} disabled={actioning === w.id}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
