import { Badge } from "@/components/ui/Badge";
import { formatDate, formatCrypto, truncateAddress } from "@/lib/utils";
import { getExplorerTxUrl } from "@/lib/blockchain/explorers";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  PENDING_CONFIRMATION: "neutral",
  PENDING_REVIEW: "warning",
  ON_HOLD: "warning",
  APPROVED: "neutral",
  PROCESSING: "warning",
  COMPLETED: "success",
  REJECTED: "danger",
  FAILED: "danger",
};

interface WithdrawalRow {
  id: string;
  network: string;
  destinationAddress: string;
  amount: { toString(): string };
  status: string;
  holdReason?: string | null;
  txHash: string | null;
  requestedAt: string | Date;
  asset: { symbol: string };
}

export function WithdrawalsTable({ withdrawals }: { withdrawals: WithdrawalRow[] }) {
  if (withdrawals.length === 0) {
    return <p className="text-sm text-muted">No withdrawals yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase text-muted">
          <tr>
            <th scope="col" className="py-2 pr-4">Asset</th>
            <th scope="col" className="py-2 pr-4">Amount</th>
            <th scope="col" className="py-2 pr-4">Destination</th>
            <th scope="col" className="py-2 pr-4">Status</th>
            <th scope="col" className="py-2 pr-4">Transaction</th>
            <th scope="col" className="py-2 pr-4">Date</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => {
            const explorerUrl = w.txHash ? getExplorerTxUrl(w.network, w.txHash) : null;
            return (
              <tr key={w.id} className="border-t border-border align-top">
                <td className="py-3 pr-4 font-medium">{w.asset.symbol}</td>
                <td className="py-3 pr-4 tabular-nums">{formatCrypto(Number(w.amount), w.asset.symbol)}</td>
                <td className="py-3 pr-4 font-mono text-xs">{truncateAddress(w.destinationAddress)}</td>
                <td className="py-3 pr-4">
                  <Badge tone={STATUS_TONE[w.status] ?? "neutral"}>{w.status.replace(/_/g, " ")}</Badge>
                  {w.holdReason && <p className="mt-1 max-w-[220px] text-xs text-muted">{w.holdReason}</p>}
                </td>
                <td className="py-3 pr-4">
                  {w.txHash ? (
                    explorerUrl ? (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                        {truncateAddress(w.txHash)}
                      </a>
                    ) : (
                      <span className="font-mono text-xs">{truncateAddress(w.txHash)}</span>
                    )
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4 text-muted">{formatDate(w.requestedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
