"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface TxEntry {
  id: string;
  type: string;
  direction: "CREDIT" | "DEBIT";
  amount: string;
  status: string;
  createdAt: string;
  reference: string | null;
  asset: { symbol: string };
}

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  POSTED: "success",
  REVERSED: "danger",
};

export function TransactionsList({
  initialTransactions,
  initialCursor,
}: {
  initialTransactions: TxEntry[];
  initialCursor: string | null;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?cursor=${cursor}`);
      const data = await res.json();
      setTransactions((prev) => [...prev, ...data.transactions]);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-muted">No transactions yet.</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th scope="col" className="py-2 pr-4">Type</th>
              <th scope="col" className="py-2 pr-4">Asset</th>
              <th scope="col" className="py-2 pr-4">Amount</th>
              <th scope="col" className="py-2 pr-4">Status</th>
              <th scope="col" className="py-2 pr-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-border">
                <td className="py-3 pr-4 font-medium">{tx.type.replace(/_/g, " ")}</td>
                <td className="py-3 pr-4">{tx.asset.symbol}</td>
                <td className="py-3 pr-4 tabular-nums">
                  {tx.direction === "CREDIT" ? "+" : "−"}
                  {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={STATUS_TONE[tx.status] ?? "neutral"}>{tx.status}</Badge>
                </td>
                <td className="py-3 pr-4 text-muted">{formatDate(tx.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cursor && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
